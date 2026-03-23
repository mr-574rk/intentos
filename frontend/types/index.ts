// ============================================================
// IntentOS — Frontend Types
// Local copy of shared types for Next.js frontend.
// Keep in sync with /types/index.ts at the monorepo root.
// ============================================================

export type GoalType = "yield" | "growth" | "income" | "stable" | "diversify";
export type RiskTolerance = "low" | "medium" | "high";
export type TimeHorizon = "short" | "medium" | "long";
export type RiskLabel = "low" | "medium" | "high";
export type ExecutionMode = "mock" | "testnet";
export type StrategyState = "PENDING" | "SIMULATED" | "APPROVED" | "EXECUTING" | "COMPLETE" | "FAILED";
export type TimelineStepStatus = "pending" | "active" | "complete" | "failed";

export interface StructuredIntent {
  goal: GoalType;
  riskTolerance: RiskTolerance;
  timeHorizon: TimeHorizon;
  assets: string[];
  rawText: string;
}

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
  estimatedYield: number;
  riskScore: RiskLabel;
  riskScoreNumeric: number;
  explanation: string;
  intent: StructuredIntent;
  createdAt: string;
}

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

export interface HistoryEntry {
  id: string;
  intentText: string;
  bundle: StrategyBundle;
  simulation: SimulationResult;
  result: ExecutionResult;
  performance?: string;
  createdAt: string;
}

export interface PortfolioAsset {
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
