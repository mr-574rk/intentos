import type { Strategy } from "../../types";
import type { UnsignedMessages } from "../../execution-engine/src/initiaExecutor";
import {
  createStrategy,
  createTimeline,
  updateState,
  getStrategyForOwner,
  getTimeline,
} from "./strategyLifecycle";
import { runIntentWorkflow } from "./intentWorkflow";
import { guardExecution } from "./executionGuard";
import { buildBundle } from "../../execution-engine/src/bundleExecutor";

// ── Agent Controller ──────────────────────────────────────────

/**
 * Phase 1: Process a user intent.
 * Runs the full AI pipeline → returns strategy + simulation for user review.
 *
 * @param rawText       - the natural-language intent string
 * @param ownerAddress  - the verified wallet address submitting the intent
 *                        (must be a valid init1… bech32 address)
 */
export async function processIntent(rawText: string, ownerAddress: string): Promise<Strategy> {
  if (!ownerAddress || !ownerAddress.startsWith("init1")) {
    throw new Error(
      `[agentController] processIntent requires a valid wallet address (init1…). ` +
      `Got: "${ownerAddress}". Strategies cannot be created without an owner.`
    );
  }

  // Step 1: Run AI pipeline (interpret → generate → simulate)
  const { intent, bundle, simulation } = await runIntentWorkflow(rawText, "");

  // Step 2: Persist strategy with ownerAddress and SIMULATED state (Finding #3)
  const strategy = createStrategy({ intent, bundle, simulation }, ownerAddress);
  updateState(strategy.id, "SIMULATED");

  // Step 3: Build completed timeline for the frontend to animate
  const timeline = createTimeline(strategy.id);
  const now = new Date().toISOString();
  timeline.steps.forEach((step, i) => {
    if (i < 4) {
      // First 4 steps are complete (parsed, generated, simulated, bundled)
      step.status = "complete";
      step.timestamp = now;
    } else {
      // Last step "execution_ready" stays active — waiting for user approval
      step.status = "active";
    }
  });
  timeline.currentStepIndex = 4;

  return strategy;
}

/**
 * Phase 2: Build unsigned messages for an approved strategy.
 *
 * Replaces the old executeStrategy() which signed and broadcast via a server relayer.
 * The returned messages are passed to the frontend for wallet signing via InterwovenKit.
 *
 * Security invariants:
 *  - ownerAddress must exactly match the strategy's stored ownerAddress (Finding #3)
 *  - No server-side signing occurs here (Finding #1)
 *
 * @param strategyId    - strategy to build messages for
 * @param ownerAddress  - caller's wallet address; must match strategy owner
 */
export async function buildStrategyMessages(
  strategyId: string,
  ownerAddress: string
): Promise<UnsignedMessages> {
  if (!ownerAddress || !ownerAddress.startsWith("init1")) {
    throw new Error(
      `[agentController] buildStrategyMessages requires a valid wallet address (init1…), ` +
      `got "${ownerAddress}".`
    );
  }

  // Owner-scoped lookup — returns undefined if strategy not found OR wrong owner
  const strategy = getStrategyForOwner(strategyId, ownerAddress);
  if (!strategy) {
    throw new Error(
      `[agentController] Strategy "${strategyId}" not found or does not belong to wallet "${ownerAddress}". ` +
      `Access denied.`
    );
  }

  if (!strategy.simulation) {
    throw new Error(`[agentController] Strategy has not been simulated.`);
  }

  // Safety gate — must pass before any on-chain action
  const guard = guardExecution(strategy.bundle, strategy.simulation);
  if (!guard.cleared) {
    updateState(strategyId, "FAILED");
    const timeline = getTimeline(strategyId);
    if (timeline) {
      const current = timeline.steps[timeline.currentStepIndex];
      if (current) current.status = "failed";
      timeline.overall = "failed";
    }
    throw new Error(`[agentController] Execution blocked: ${guard.reason}`);
  }

  updateState(strategyId, "EXECUTING");

  try {
    // Build unsigned messages — senderAddress is the user's wallet, not a server key
    const result = await buildBundle(strategy.bundle, strategyId, ownerAddress);

    // Mark strategy as ready for broadcast (wallet signing happens client-side)
    updateState(strategyId, "APPROVED");

    const timeline = getTimeline(strategyId);
    if (timeline) {
      timeline.steps.forEach(s => { s.status = "complete"; });
      timeline.overall = "complete";
      timeline.completedAt = new Date().toISOString();
    }

    return result;
  } catch (err) {
    updateState(strategyId, "FAILED");
    const timeline = getTimeline(strategyId);
    if (timeline) {
      const current = timeline.steps[timeline.currentStepIndex];
      if (current) current.status = "failed";
      timeline.overall = "failed";
    }
    throw err;
  }
}
