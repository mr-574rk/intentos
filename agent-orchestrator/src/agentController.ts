import type { Strategy, ExecutionResult } from "../../types";
import {
  createStrategy,
  createTimeline,
  updateState,
  getStrategy,
  getTimeline,
} from "./strategyLifecycle";
import { runIntentWorkflow } from "./intentWorkflow";
import { guardExecution } from "./executionGuard";
import { executeBundle } from "../../execution-engine/src/bundleExecutor";
// ── Agent Controller ─────────────────────────────────────────

/**
 * Phase 1: Process a user intent.
 * Runs the full AI pipeline → returns strategy + simulation for user review.
 */
export async function processIntent(rawText: string): Promise<Strategy> {
  // Step 1: Run AI pipeline (interpret → generate → simulate)
  const { intent, bundle, simulation } = await runIntentWorkflow(rawText, "");

  // Step 2: Persist strategy with SIMULATED state
  const strategy = createStrategy({ intent, bundle, simulation });
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
 * Phase 2: Execute an approved strategy.
 * Called after the user clicks "Execute Strategy".
 */
export async function executeStrategy(strategyId: string, sessionKey = ""): Promise<ExecutionResult> {
  const strategy = getStrategy(strategyId);
  if (!strategy) throw new Error(`Strategy ${strategyId} not found`);
  if (!strategy.simulation) throw new Error("Strategy has not been simulated");

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
    throw new Error(`Execution blocked: ${guard.reason}`);
  }

  updateState(strategyId, "EXECUTING");

  try {
    const result = await executeBundle(strategy.bundle, strategyId, sessionKey);
    strategy.executionResult = result;
    updateState(strategyId, "COMPLETE");

    // Finalize timeline
    const timeline = getTimeline(strategyId);
    if (timeline) {
      timeline.steps.forEach((s) => { s.status = "complete"; });
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
