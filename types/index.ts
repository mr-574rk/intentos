// ============================================================
// IntentOS — Shared Types
// Used across: backend, ai-engine, simulation-engine,
//              agent-orchestrator, execution-engine, frontend
// ============================================================

// ── Intent ──────────────────────────────────────────────────

export type GoalType = "yield" | "growth" | "income" | "stable" | "diversify";
export type RiskTolerance = "low" | "medium" | "high";
export type TimeHorizon = "short" | "medium" | "long";
export type RiskLabel = "low" | "medium" | "high";

export interface StructuredIntent {
  goal: GoalType;
  riskTolerance: RiskTolerance;
  timeHorizon: TimeHorizon;
  assets: string[];
  rawText: string;
}

// ── Strategy ─────────────────────────────────────────────────

export interface StrategyStep {
  index: number;
  action: string;
  from?: string;
  to?: string;
  description: string;
  protocol?: string;
}

export interface StrategyBundle {
  id: string;
  steps: StrategyStep[];
  estimatedYield: number;       // percentage, e.g. 18
  riskScore: RiskLabel;
  riskScoreNumeric: number;     // 1–10
  explanation: string;          // AI-written rationale
  intent: StructuredIntent;
  createdAt: string;
}

// ── Simulation ───────────────────────────────────────────────

export interface PortfolioAllocation {
  [asset: string]: number;      // asset → percentage
}

export interface SimulationResult {
  bundleId: string;
  portfolioAllocation: PortfolioAllocation;
  projectedAPY: number;
  riskScore: RiskLabel;
  riskScoreNumeric: number;
  explanation: string;
  passed: boolean;              // false if risk > threshold
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
  txHashes?: string[];          // one per bundle step
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
  performance?: string;         // e.g. "+3.2%"
  createdAt: string;
}

// ── Portfolio ────────────────────────────────────────────────

export interface PortfolioAsset {
  symbol: string;
  name: string;
  balance: number;
  valueUSD: number;
  allocation: number;           // percentage
  change24h: number;            // percentage
}

export interface Portfolio {
  address: string;
  username?: string;            // .init username
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
