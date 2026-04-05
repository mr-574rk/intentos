import { v4 as uuidv4 } from "uuid";
import type { Strategy, StrategyState, AgentTimeline, TimelineStep } from "../../types";

// In-memory store (replace with DB in production)
const strategyStore = new Map<string, Strategy>();
const timelineStore = new Map<string, AgentTimeline>();

// ── Timeline Factory ──────────────────────────────────────────

const TIMELINE_STEPS = [
  { id: "intent_parsed",       label: "Intent Parsed",       description: "Financial goal interpreted by AI" },
  { id: "strategy_generated",  label: "Strategy Generated",  description: "DeFi strategy bundle created" },
  { id: "simulation_complete", label: "Simulation Complete", description: "Outcomes and risk projected" },
  { id: "bundle_prepared",     label: "Bundle Prepared",     description: "Transactions assembled and validated" },
  { id: "execution_ready",     label: "Execution Ready",     description: "Agent ready to submit on-chain" },
];

export function createTimeline(strategyId: string): AgentTimeline {
  const steps: TimelineStep[] = TIMELINE_STEPS.map((s) => ({
    ...s,
    status: "pending",
  }));

  const timeline: AgentTimeline = {
    strategyId,
    steps,
    currentStepIndex: 0,
    overall: "running",
    startedAt: new Date().toISOString(),
  };

  timelineStore.set(strategyId, timeline);
  return timeline;
}

export function advanceTimeline(strategyId: string): AgentTimeline | null {
  const timeline = timelineStore.get(strategyId);
  if (!timeline) return null;

  const { steps, currentStepIndex } = timeline;

  // Mark current as complete
  if (steps[currentStepIndex]) {
    steps[currentStepIndex].status = "complete";
    steps[currentStepIndex].timestamp = new Date().toISOString();
  }

  const nextIndex = currentStepIndex + 1;

  // Mark next as active
  if (nextIndex < steps.length) {
    steps[nextIndex].status = "active";
    timeline.currentStepIndex = nextIndex;
  } else {
    // All done
    timeline.overall = "complete";
    timeline.completedAt = new Date().toISOString();
  }

  timelineStore.set(strategyId, timeline);
  return timeline;
}

export function failTimeline(strategyId: string): void {
  const timeline = timelineStore.get(strategyId);
  if (!timeline) return;
  const { steps, currentStepIndex } = timeline;
  if (steps[currentStepIndex]) steps[currentStepIndex].status = "failed";
  timeline.overall = "failed";
  timeline.completedAt = new Date().toISOString();
  timelineStore.set(strategyId, timeline);
}

// ── Strategy CRUD ─────────────────────────────────────────────

/**
 * Create a new strategy bound to an owner wallet address.
 * The ownerAddress is stored and must be verified on every subsequent read/execute.
 */
export function createStrategy(
  partial: Omit<Strategy, "id" | "createdAt" | "updatedAt" | "state" | "ownerAddress">,
  ownerAddress: string
): Strategy {
  if (!ownerAddress || !ownerAddress.startsWith("init1")) {
    throw new Error(
      `[strategyLifecycle] ownerAddress must be a valid bech32 init1… address, got "${ownerAddress}". ` +
      `Strategies cannot be created without a verified wallet owner.`
    );
  }

  const now = new Date().toISOString();
  const strategy: Strategy = {
    ...partial,
    id: uuidv4(),
    ownerAddress,
    state: "PENDING",
    createdAt: now,
    updatedAt: now,
  };
  strategyStore.set(strategy.id, strategy);
  return strategy;
}

export function updateState(id: string, state: StrategyState): Strategy | null {
  const strategy = strategyStore.get(id);
  if (!strategy) return null;
  strategy.state = state;
  strategy.updatedAt = new Date().toISOString();
  strategyStore.set(id, strategy);
  return strategy;
}

/**
 * Internal-only getter — returns the strategy regardless of owner.
 * Do NOT expose this via HTTP routes.
 */
export function getStrategy(id: string): Strategy | undefined {
  return strategyStore.get(id);
}

/**
 * Owner-scoped strategy getter (Finding #3 remediation).
 * Returns undefined if:
 *  - The strategy does not exist.
 *  - The supplied ownerAddress does not exactly match the stored owner.
 *
 * Routes should use this function, never getStrategy(), for user-facing endpoints.
 */
export function getStrategyForOwner(
  id: string,
  ownerAddress: string
): Strategy | undefined {
  const strategy = strategyStore.get(id);
  if (!strategy) return undefined;
  if (strategy.ownerAddress !== ownerAddress) return undefined;
  return strategy;
}

/**
 * Owner-scoped timeline getter (Finding #3 remediation).
 * Returns undefined if the strategy exists but owner does not match.
 */
export function getTimelineForOwner(
  strategyId: string,
  ownerAddress: string
): AgentTimeline | undefined {
  const strategy = strategyStore.get(strategyId);
  if (!strategy || strategy.ownerAddress !== ownerAddress) return undefined;
  return timelineStore.get(strategyId);
}

export function getTimeline(strategyId: string): AgentTimeline | undefined {
  return timelineStore.get(strategyId);
}

/**
 * Returns all strategies for a specific owner.
 * Never returns strategies for other wallet addresses.
 */
export function getStrategiesForOwner(ownerAddress: string): Strategy[] {
  return Array.from(strategyStore.values()).filter(
    s => s.ownerAddress === ownerAddress
  );
}

/**
 * @internal NOT for use in HTTP routes — no ownership filtering.
 * Retained for internal timeline aggregation only.
 */
export function getAllStrategies(): Strategy[] {
  return Array.from(strategyStore.values());
}
