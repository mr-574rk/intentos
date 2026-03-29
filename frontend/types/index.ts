// ============================================================
// IntentOS — Shared Types  (extended with multi-intent support)
// ============================================================

export type GoalType = "yield" | "growth" | "income" | "stable" | "diversify";
export type RiskTolerance = "low" | "medium" | "high";
export type TimeHorizon = "short" | "medium" | "long";
export type RiskLabel = "low" | "medium" | "high";

// ── Intent ───────────────────────────────────────────────────

/** Legacy single-goal intent (kept for backward compat) */
export interface StructuredIntent {
  goal: GoalType;
  riskTolerance: RiskTolerance;
  timeHorizon: TimeHorizon;
  assets: string[];
  rawText: string;
}

// ── Multi-Intent (new) ───────────────────────────────────────

export type IntentType =
  | "yield"
  | "swap"
  | "transfer"
  | "batch_transfer"
  | "stake"
  | "unstake"
  | "claim_rewards"
  | "autopilot_enable"
  | "autopilot_disable"
  | "portfolio_allocation";

export interface ParsedIntent {
  intentType: IntentType;
  // goal-based fields (yield / portfolio_allocation)
  goal?: GoalType;
  riskTolerance?: RiskTolerance;
  timeHorizon?: TimeHorizon;
  assets?: string[];
  // swap fields
  tokenIn?: string;
  tokenOut?: string;
  // transfer / batch_transfer fields
  token?: string;
  amount?: number;
  recipient?: string;
  recipients?: string[];
  // ambiguity
  ambiguous?: boolean;
  clarificationOptions?: string[];
  rawText: string;
}

export interface AmbiguityResponse {
  ambiguous: true;
  question: string;
  options: string[];
}

// ── Strategy ─────────────────────────────────────────────────

export interface StrategyStep {
  index: number;
  action: string;
  from?: string;
  to?: string;
  description: string;
  protocol?: string;
  amount?: number;
  recipient?: string;
}

export interface StrategyBundle {
  id: string;
  steps: StrategyStep[];
  estimatedYield: number;
  riskScore: RiskLabel;
  riskScoreNumeric: number;
  explanation: string;
  reasoning?: string[];        // ← new: "Why this strategy?" bullets
  intent: StructuredIntent;
  parsedIntents?: ParsedIntent[]; // ← new: full multi-intent array
  createdAt: string;
}

// ── Simulation ───────────────────────────────────────────────

export interface PortfolioAllocation {
  [asset: string]: number;
}

export interface SimulationResult {
  bundleId: string;
  portfolioAllocation: PortfolioAllocation;
  projectedAPY: number;
  riskScore: RiskLabel;
  riskScoreNumeric: number;
  explanation: string;
  passed: boolean;
  warnings: string[];
}

// ── Execution ────────────────────────────────────────────────

export type ExecutionMode = "mock" | "testnet";

export interface TransactionObject {
  index: number;
  type: string;
  sender?: string;
  payload: Record<string, unknown>;
  estimatedGas?: number;
}

export interface ExecutionResult {
  strategyId: string;
  status: "success" | "failed";
  txHash: string;
  txHashes?: string[];
  result: string;
  mode: ExecutionMode;
  executedAt: string;
  error?: string;
}

// ── Strategy Lifecycle ───────────────────────────────────────

export type StrategyState =
  | "PENDING"
  | "SIMULATED"
  | "APPROVED"
  | "EXECUTING"
  | "COMPLETE"
  | "FAILED";

export interface Strategy {
  id: string;
  intent: StructuredIntent;
  bundle: StrategyBundle;
  simulation?: SimulationResult;
  state: StrategyState;
  executionResult?: ExecutionResult;
  createdAt: string;
  updatedAt: string;
}

// ── Agent Timeline ───────────────────────────────────────────

export type TimelineStepStatus = "pending" | "active" | "complete" | "failed";

export interface TimelineStep {
  id: string;
  label: string;
  description: string;
  status: TimelineStepStatus;
  timestamp?: string;
}

export interface AgentTimeline {
  strategyId: string;
  steps: TimelineStep[];
  currentStepIndex: number;
  overall: "running" | "complete" | "failed";
  startedAt: string;
  completedAt?: string;
}

// ── History ──────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  intentText: string;
  bundle: StrategyBundle;
  simulation: SimulationResult;
  result: ExecutionResult;
  performance?: string;
  createdAt: string;
}

// ── Portfolio ────────────────────────────────────────────────

export interface PortfolioAsset {
  denom?: string;
  symbol: string;
  name: string;
  balance: number;
  valueUSD: number;
  allocation: number;
  change24h: number;
}

export interface Portfolio {
  address: string;
  username?: string;
  totalValueUSD: number;
  change24h: number;
  assets: PortfolioAsset[];
  activeStrategies: number;
  completedStrategies: number;
  lastUpdated: string;
}

// ── API Responses ────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
