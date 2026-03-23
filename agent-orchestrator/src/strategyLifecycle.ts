import { v4 as uuidv4 } from "uuid";
import type { Strategy, StrategyState, AgentTimeline, TimelineStep } from "../../types";

// In-memory store (replace with DB in production)
const strategyStore = new Map<string, Strategy>();
const timelineStore = new Map<string, AgentTimeline>();

// ── Timeline Factory ─────────────────────────────────────────

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

export function createStrategy(partial: Omit<Strategy, "id" | "createdAt" | "updatedAt" | "state">): Strategy {
  const now = new Date().toISOString();
  const strategy: Strategy = {
    ...partial,
    id: uuidv4(),
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

export function getStrategy(id: string): Strategy | undefined {
  return strategyStore.get(id);
}

export function getTimeline(strategyId: string): AgentTimeline | undefined {
  return timelineStore.get(strategyId);
}

export function getAllStrategies(): Strategy[] {
  return Array.from(strategyStore.values());
}
