import { v4 as uuidv4 } from "uuid";
import type { StructuredIntent, StrategyBundle, StrategyStep, GoalType, RiskTolerance } from "../../types";

// ── Strategy Templates ───────────────────────────────────────

type StrategyTemplate = {
  steps: Omit<StrategyStep, "index">[];
  estimatedYield: number;
  riskScoreNumeric: number;
  explanation: string;
};

const STRATEGY_TEMPLATES: Record<GoalType, Record<RiskTolerance, StrategyTemplate>> = {
  yield: {
    low: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "Swap INIT to USDC for stablecoin exposure", protocol: "Initia DEX" },
        { action: "provide_liquidity", from: "USDC", description: "Deposit USDC into stablecoin yield pool", protocol: "Initia Liquidity" },
        { action: "stake_lp", description: "Stake LP tokens to earn protocol rewards", protocol: "Initia Staking" },
      ],
      estimatedYield: 12,
      riskScoreNumeric: 3,
      explanation: "Stablecoin pools minimize volatility while LP staking rewards provide consistent yield above market rate. This is a conservative, time-tested DeFi strategy.",
    },
    medium: {
      steps: [
        { action: "split_allocation", from: "INIT", description: "Split INIT 60/40 between staking and liquidity", protocol: "Initia" },
        { action: "provide_liquidity", from: "INIT", to: "USDC", description: "Add INIT/USDC liquidity to earn trading fees", protocol: "Initia AMM" },
        { action: "stake_lp", description: "Stake LP tokens for additional incentives", protocol: "Initia Staking" },
      ],
      estimatedYield: 18,
      riskScoreNumeric: 5,
      explanation: "A balanced split between INIT staking and liquidity provision captures both staking rewards and trading fee income, delivering above-average yield with moderate risk.",
    },
    high: {
      steps: [
        { action: "leverage_stake", from: "INIT", description: "Stake INIT with leverage for amplified yield", protocol: "Initia Staking" },
        { action: "provide_liquidity", from: "INIT", to: "ETH", description: "Provide INIT/ETH liquidity for high fee income", protocol: "Initia AMM" },
        { action: "compound", description: "Auto-compound rewards back into strategy", protocol: "Initia" },
      ],
      estimatedYield: 35,
      riskScoreNumeric: 8,
      explanation: "Leveraged staking and volatile pair liquidity maximizes yield but exposes the portfolio to impermanent loss and liquidation risk.",
    },
  },
  growth: {
    low: {
      steps: [
        { action: "dca_buy", to: "INIT", description: "Gradually accumulate INIT over time", protocol: "Initia DEX" },
        { action: "stake", from: "INIT", description: "Stake accumulated INIT for compounding growth", protocol: "Initia Staking" },
      ],
      estimatedYield: 10,
      riskScoreNumeric: 3,
      explanation: "Dollar-cost averaging into INIT and auto-staking builds a growing position steadily while avoiding timing the market.",
    },
    medium: {
      steps: [
        { action: "swap", from: "USDC", to: "INIT", description: "Convert stablecoins to INIT for growth exposure", protocol: "Initia DEX" },
        { action: "stake", from: "INIT", description: "Stake INIT to compound growth over time", protocol: "Initia Staking" },
      ],
      estimatedYield: 20,
      riskScoreNumeric: 5,
      explanation: "Full INIT exposure with staking rewards compounds price appreciation with protocol incentives for strong medium-term growth.",
    },
    high: {
      steps: [
        { action: "swap_all", to: "INIT", description: "Convert full portfolio to INIT", protocol: "Initia DEX" },
        { action: "leverage_long", from: "INIT", description: "Use borrowed liquidity to amplify INIT position", protocol: "Initia Lending" },
      ],
      estimatedYield: 50,
      riskScoreNumeric: 9,
      explanation: "Maximum INIT exposure with leverage creates the highest growth potential but also the highest liquidation risk.",
    },
  },
  income: {
    low: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "Convert to stablecoins for income generation", protocol: "Initia DEX" },
        { action: "lend", from: "USDC", description: "Lend USDC to earn stable interest income", protocol: "Initia Lending" },
      ],
      estimatedYield: 8,
      riskScoreNumeric: 2,
      explanation: "Lending stablecoins generates predictable interest income with near-zero volatility risk — ideal for consistent cash flow.",
    },
    medium: {
      steps: [
        { action: "provide_liquidity", from: "INIT", to: "USDC", description: "LP position generates trading fee income", protocol: "Initia AMM" },
        { action: "stake_lp", description: "Stake LP for additional income stream", protocol: "Initia Staking" },
      ],
      estimatedYield: 16,
      riskScoreNumeric: 5,
      explanation: "Dual income from trading fees and LP staking rewards creates a diversified income stream with moderate risk.",
    },
    high: {
      steps: [
        { action: "provide_liquidity", from: "INIT", to: "ETH", description: "High-volume pair for maximum fee income", protocol: "Initia AMM" },
        { action: "leverage_lend", description: "Borrow to amplify liquidity position", protocol: "Initia Lending" },
      ],
      estimatedYield: 40,
      riskScoreNumeric: 8,
      explanation: "Leveraged liquidity in high-volume trading pairs maximizes fee income but introduces impermanent loss and liquidation exposure.",
    },
  },
  stable: {
    low: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "Convert to USDC for capital preservation", protocol: "Initia DEX" },
        { action: "lend", from: "USDC", description: "Earn stable yield on preserved capital", protocol: "Initia Lending" },
      ],
      estimatedYield: 6,
      riskScoreNumeric: 1,
      explanation: "Pure stablecoin strategy prioritizes capital preservation while earning a small, risk-free yield from USDC lending.",
    },
    medium: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "50% convert to USDC for stability", protocol: "Initia DEX" },
        { action: "provide_liquidity", from: "USDC", description: "Stablecoin LP for yield with low volatility", protocol: "Initia AMM" },
      ],
      estimatedYield: 9,
      riskScoreNumeric: 3,
      explanation: "Partial stablecoin conversion with stablecoin LP balances preservation and modest yield without significant risk.",
    },
    high: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "Stable base position", protocol: "Initia DEX" },
        { action: "yield_farm", from: "USDC", description: "Farm USDC yield with protocol leverage", protocol: "Initia Farming" },
      ],
      estimatedYield: 15,
      riskScoreNumeric: 5,
      explanation: "Stablecoin farming with protocol leverage extracts higher yield from a stable base — moderate execution risk only.",
    },
  },
  diversify: {
    low: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "Allocate 40% to stablecoins", protocol: "Initia DEX" },
        { action: "stake", from: "INIT", description: "Stake 40% INIT for protocol rewards", protocol: "Initia Staking" },
        { action: "lend", from: "USDC", description: "Lend 20% USDC for base yield", protocol: "Initia Lending" },
      ],
      estimatedYield: 10,
      riskScoreNumeric: 3,
      explanation: "A 40/40/20 split across staking, stablecoins, and lending creates a diversified low-risk position with multiple income sources.",
    },
    medium: {
      steps: [
        { action: "stake", from: "INIT", description: "Stake 33% INIT for staking rewards", protocol: "Initia Staking" },
        { action: "provide_liquidity", from: "INIT", to: "USDC", description: "33% in INIT/USDC LP pool", protocol: "Initia AMM" },
        { action: "lend", from: "USDC", description: "33% USDC lending for stable income", protocol: "Initia Lending" },
      ],
      estimatedYield: 16,
      riskScoreNumeric: 5,
      explanation: "Equal-weight diversification across staking, liquidity, and lending maximizes risk-adjusted returns across market conditions.",
    },
    high: {
      steps: [
        { action: "provide_liquidity", from: "INIT", to: "ETH", description: "High-yield volatile pair LP", protocol: "Initia AMM" },
        { action: "stake", from: "INIT", description: "Leveraged staking for amplified rewards", protocol: "Initia Staking" },
        { action: "leverage_long", from: "INIT", description: "Long INIT exposure for capital growth", protocol: "Initia Lending" },
      ],
      estimatedYield: 45,
      riskScoreNumeric: 8,
      explanation: "Aggressive diversification across volatile LP, leveraged staking, and leveraged long positions maximizes yield with high risk exposure.",
    },
  },
};

// ── Generator ────────────────────────────────────────────────

export function generateStrategy(intent: StructuredIntent): StrategyBundle {
  const template =
    STRATEGY_TEMPLATES[intent.goal]?.[intent.riskTolerance] ??
    STRATEGY_TEMPLATES.yield.medium;

  const steps: StrategyStep[] = template.steps.map((step, i) => ({
    index: i + 1,
    ...step,
  }));

  const riskLabel =
    template.riskScoreNumeric <= 3
      ? "low"
      : template.riskScoreNumeric <= 6
      ? "medium"
      : "high";

  return {
    id: uuidv4(),
    steps,
    estimatedYield: template.estimatedYield,
    riskScore: riskLabel,
    riskScoreNumeric: template.riskScoreNumeric,
    explanation: template.explanation,
    intent,
    createdAt: new Date().toISOString(),
  };
}
