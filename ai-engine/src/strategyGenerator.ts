import { v4 as uuidv4 } from "uuid";
import type {
  StructuredIntent,
  StrategyBundle,
  StrategyStep,
  GoalType,
  RiskTolerance,
  ParsedIntent,
} from "../../types";

/**
 * Validate that an amount field is a positive finite number.
 * Throws a descriptive error for zero, missing, NaN, negative, or Infinity values.
 * @param amount  - the candidate amount (may be undefined/null/NaN)
 * @param context - human-readable label used in the error message
 */
function requirePositiveAmount(amount: number | undefined | null, context: string): number {
  if (amount === undefined || amount === null) {
    throw new Error(
      `[strategyGenerator] ${context}: amount is required but was not provided. ` +
      `Please specify an explicit positive amount (e.g. "stake 5 INIT").`
    );
  }
  const n = typeof amount === "number" ? amount : parseFloat(String(amount));
  if (!isFinite(n) || n <= 0) {
    throw new Error(
      `[strategyGenerator] ${context}: amount must be a positive finite number, got "${amount}". ` +
      `Zero, negative, and non-numeric amounts are not allowed for financial actions.`
    );
  }
  return n;
}

// ── Existing Goal-based Templates ────────────────────────────

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
      estimatedYield: 12, riskScoreNumeric: 3,
      explanation: "Stablecoin pools minimize volatility while LP staking rewards provide consistent yield above market rate.",
    },
    medium: {
      steps: [
        { action: "split_allocation", from: "INIT", description: "Allocate 60% to staking and 40% to liquidity", protocol: "" },
        { action: "provide_liquidity", from: "INIT", to: "USDC", description: "Add INIT/USDC liquidity to earn trading fees", protocol: "Initia AMM" },
        { action: "stake_lp", description: "Stake LP tokens for additional incentives", protocol: "Initia Staking" },
      ],
      estimatedYield: 18, riskScoreNumeric: 5,
      explanation: "A balanced split between INIT staking and liquidity provision captures both staking rewards and trading fee income.",
    },
    high: {
      steps: [
        { action: "leverage_stake", from: "INIT", description: "Stake INIT with leverage for amplified yield", protocol: "Initia Staking" },
        { action: "provide_liquidity", from: "INIT", to: "ETH", description: "Provide INIT/ETH liquidity for high fee income", protocol: "Initia AMM" },
        { action: "compound", description: "Auto-compound rewards back into strategy", protocol: "Initia" },
      ],
      estimatedYield: 35, riskScoreNumeric: 8,
      explanation: "Leveraged staking and volatile pair liquidity maximizes yield but exposes the portfolio to impermanent loss and liquidation risk.",
    },
  },
  growth: {
    low: {
      steps: [
        { action: "dca_buy", to: "INIT", description: "Gradually accumulate INIT over time", protocol: "Initia DEX" },
        { action: "stake", from: "INIT", description: "Stake accumulated INIT for compounding growth", protocol: "Initia Staking" },
      ],
      estimatedYield: 10, riskScoreNumeric: 3,
      explanation: "Dollar-cost averaging into INIT and auto-staking builds a growing position steadily.",
    },
    medium: {
      steps: [
        { action: "stake", from: "INIT", description: "Stake 40% INIT for stable protocol rewards", protocol: "Initia Staking", amount: 0.4 },
        { action: "swap", from: "INIT", to: "USDC", description: "Swap 30% INIT → USDC for stablecoin reserve", protocol: "Initia DEX", amount: 0.3 },
        { action: "provide_liquidity", from: "INIT", to: "USDC", description: "Provide 30% as INIT/USDC liquidity", protocol: "Initia AMM", amount: 0.3 },
      ],
      estimatedYield: 20, riskScoreNumeric: 5,
      explanation: "Balanced growth strategy: staking generates steady yield, USDC reduces volatility, and liquidity provision earns trading fees.",
    },
    high: {
      steps: [
        { action: "swap_all", to: "INIT", description: "Convert full portfolio to INIT", protocol: "Initia DEX" },
        { action: "leverage_long", from: "INIT", description: "Use borrowed liquidity to amplify INIT position", protocol: "Initia Lending" },
      ],
      estimatedYield: 50, riskScoreNumeric: 9,
      explanation: "Maximum INIT exposure with leverage creates the highest growth potential but also the highest liquidation risk.",
    },
  },
  income: {
    low: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "Convert to stablecoins for income generation", protocol: "Initia DEX" },
        { action: "lend", from: "USDC", description: "Lend USDC to earn stable interest income", protocol: "Initia Lending" },
      ],
      estimatedYield: 8, riskScoreNumeric: 2,
      explanation: "Lending stablecoins generates predictable interest income with near-zero volatility risk.",
    },
    medium: {
      steps: [
        { action: "provide_liquidity", from: "INIT", to: "USDC", description: "LP position generates trading fee income", protocol: "Initia AMM" },
        { action: "stake_lp", description: "Stake LP for additional income stream", protocol: "Initia Staking" },
      ],
      estimatedYield: 16, riskScoreNumeric: 5,
      explanation: "Dual income from trading fees and LP staking rewards creates a diversified income stream.",
    },
    high: {
      steps: [
        { action: "provide_liquidity", from: "INIT", to: "ETH", description: "High-volume pair for maximum fee income", protocol: "Initia AMM" },
        { action: "leverage_lend", description: "Borrow to amplify liquidity position", protocol: "Initia Lending" },
      ],
      estimatedYield: 40, riskScoreNumeric: 8,
      explanation: "Leveraged liquidity in high-volume trading pairs maximizes fee income but introduces impermanent loss risk.",
    },
  },
  stable: {
    low: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "Convert to USDC for capital preservation", protocol: "Initia DEX" },
        { action: "lend", from: "USDC", description: "Earn stable yield on preserved capital", protocol: "Initia Lending" },
      ],
      estimatedYield: 6, riskScoreNumeric: 1,
      explanation: "Pure stablecoin strategy prioritizes capital preservation while earning a small, risk-free yield.",
    },
    medium: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "50% convert to USDC for stability", protocol: "Initia DEX" },
        { action: "provide_liquidity", from: "USDC", description: "Stablecoin LP for yield with low volatility", protocol: "Initia AMM" },
      ],
      estimatedYield: 9, riskScoreNumeric: 3,
      explanation: "Partial stablecoin conversion with stablecoin LP balances preservation and modest yield.",
    },
    high: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "Stable base position", protocol: "Initia DEX" },
        { action: "yield_farm", from: "USDC", description: "Farm USDC yield with protocol leverage", protocol: "Initia Farming" },
      ],
      estimatedYield: 15, riskScoreNumeric: 5,
      explanation: "Stablecoin farming with protocol leverage extracts higher yield from a stable base.",
    },
  },
  diversify: {
    low: {
      steps: [
        { action: "swap", from: "INIT", to: "USDC", description: "Allocate 40% to stablecoins", protocol: "Initia DEX" },
        { action: "stake", from: "INIT", description: "Stake 40% INIT for protocol rewards", protocol: "Initia Staking" },
        { action: "lend", from: "USDC", description: "Lend 20% USDC for base yield", protocol: "Initia Lending" },
      ],
      estimatedYield: 10, riskScoreNumeric: 3,
      explanation: "A 40/40/20 split across staking, stablecoins, and lending creates a diversified low-risk position.",
    },
    medium: {
      steps: [
        { action: "stake", from: "INIT", description: "Stake 33% INIT for staking rewards", protocol: "Initia Staking" },
        { action: "provide_liquidity", from: "INIT", to: "USDC", description: "33% in INIT/USDC LP pool", protocol: "Initia AMM" },
        { action: "lend", from: "USDC", description: "33% USDC lending for stable income", protocol: "Initia Lending" },
      ],
      estimatedYield: 16, riskScoreNumeric: 5,
      explanation: "Equal-weight diversification across staking, liquidity, and lending maximizes risk-adjusted returns.",
    },
    high: {
      steps: [
        { action: "provide_liquidity", from: "INIT", to: "ETH", description: "High-yield volatile pair LP", protocol: "Initia AMM" },
        { action: "stake", from: "INIT", description: "Leveraged staking for amplified rewards", protocol: "Initia Staking" },
        { action: "leverage_long", from: "INIT", description: "Long INIT exposure for capital growth", protocol: "Initia Lending" },
      ],
      estimatedYield: 45, riskScoreNumeric: 8,
      explanation: "Aggressive diversification across volatile LP, leveraged staking, and leveraged long positions.",
    },
  },
};

// ── Intent-specific step generators ──────────────────────────

function buildSwapSteps(intent: ParsedIntent): Omit<StrategyStep, "index">[] {
  const from = intent.tokenIn ?? "INIT";
  const to = intent.tokenOut ?? "USDC";
  return [
    { action: "swap", from, to, description: `Swap ${from} → ${to}`, protocol: "Initia DEX" },
  ];
}

function buildTransferSteps(intent: ParsedIntent): Omit<StrategyStep, "index">[] {
  const token = intent.token ?? "USDC";
  const amount = requirePositiveAmount(intent.amount, `transfer of ${token}`);
  const recipient = intent.recipient ?? "";
  if (!recipient || !recipient.startsWith("init1")) {
    throw new Error(
      `[strategyGenerator] transfer: a valid Initia recipient address (init1…) is required, got "${recipient}".`
    );
  }
  return [
    {
      action: "transfer",
      from: token,
      description: `Transfer ${amount} ${token} to ${recipient.slice(0, 10)}…`,
      protocol: "Initia Bank",
      amount,
      recipient,
    },
  ];
}

function buildBatchTransferSteps(intent: ParsedIntent): Omit<StrategyStep, "index">[] {
  const token = intent.token ?? "USDC";
  const amount = requirePositiveAmount(intent.amount, `batch transfer of ${token}`);
  const recipients = intent.recipients ?? [];
  if (recipients.length === 0) {
    throw new Error(`[strategyGenerator] batch_transfer: at least one recipient address is required.`);
  }
  return recipients.map(r => ({
    action: "transfer",
    from: token,
    description: `Transfer ${amount} ${token} to ${r.slice(0, 10)}…`,
    protocol: "Initia Bank",
    amount,
    recipient: r,
  }));
}

function buildStakeSteps(intent: ParsedIntent): Omit<StrategyStep, "index">[] {
  const token = intent.token ?? "INIT";
  const amount = requirePositiveAmount(intent.amount, `stake of ${token}`);
  return [
    {
      action: "stake",
      from: token,
      description: `Stake ${amount} ${token} for protocol rewards`,
      protocol: "Initia Staking",
      amount,
    },
  ];
}

// ── Multi-Intent Bundle Generator ────────────────────────────

export function generateFromIntents(intents: ParsedIntent[]): StrategyBundle {
  const allSteps: Omit<StrategyStep, "index">[] = [];
  let totalRisk = 0;
  let totalYield = 0;
  let explanationParts: string[] = [];

  for (const intent of intents) {
    switch (intent.intentType) {
      case "swap":
        allSteps.push(...buildSwapSteps(intent));
        totalRisk += 2; totalYield += 0;
        explanationParts.push(`Swap ${intent.tokenIn ?? "token"} → ${intent.tokenOut ?? "token"}`);
        break;
      case "transfer":
        allSteps.push(...buildTransferSteps(intent));
        totalRisk += 1; totalYield += 0;
        explanationParts.push(`Transfer ${intent.token ?? "token"} to recipient`);
        break;
      case "batch_transfer":
        allSteps.push(...buildBatchTransferSteps(intent));
        totalRisk += 1; totalYield += 0;
        explanationParts.push(`Batch transfer to ${intent.recipients?.length ?? 0} recipients`);
        break;
      case "stake":
        allSteps.push(...buildStakeSteps(intent));
        totalRisk += 3; totalYield += 12;
        explanationParts.push(`Stake ${intent.token ?? "INIT"}`);
        break;

      case "unstake": {
        const uToken = intent.token ?? "INIT";
        const uAmount = requirePositiveAmount(intent.amount, `unstake of ${uToken}`);
        allSteps.push({
          action: "unstake",
          from: uToken,
          description: `Unstake ${uAmount} ${uToken} from validator (21-day unbonding)`,
          protocol: "Initia Staking",
          amount: uAmount,
        });
        totalRisk += 1; totalYield += 0;
        explanationParts.push(`Unstake ${uToken} — 21-day unbonding period begins`);
        break;
      }

      case "claim_rewards": {
        allSteps.push({
          action: "claim_rewards",
          from: "INIT",
          description: "Claim pending staking rewards from validator",
          protocol: "Initia Staking",
        });
        totalRisk += 0; totalYield += 0;
        explanationParts.push("Claim staking rewards");
        break;
      }

      case "autopilot_enable":
      case "autopilot_disable": {
        // Autopilot commands are control-plane actions — they MUST NOT produce
        // executable transaction steps. Throw here so the caller can handle
        // them as UI state changes (not on-chain transactions).
        throw new Error(
          `[strategyGenerator] "${intent.intentType}" is a control-plane action and cannot ` +
          `be included in an executable transaction bundle. Handle autopilot ` +
          `enable/disable in the frontend UI state layer instead.`
        );
      }
      case "yield":
      case "portfolio_allocation":
      default: {
        const goal = intent.goal ?? "yield";
        const risk = intent.riskTolerance ?? "medium";
        const tpl = STRATEGY_TEMPLATES[goal]?.[risk] ?? STRATEGY_TEMPLATES.yield.medium;
        allSteps.push(...tpl.steps);
        totalRisk += tpl.riskScoreNumeric;
        totalYield += tpl.estimatedYield;
        explanationParts.push(tpl.explanation);
        break;
      }
    }
  }

  const avgRisk = Math.round(totalRisk / intents.length);
  const avgYield = Math.round(totalYield / intents.length);
  const riskLabel: "low" | "medium" | "high" =
    avgRisk <= 3 ? "low" : avgRisk <= 6 ? "medium" : "high";

  const steps: StrategyStep[] = allSteps.map((s, i) => ({ index: i + 1, ...s }));

  // Derive a legacy StructuredIntent to keep backward compat
  const firstYield = intents.find(i => i.intentType === "yield" || i.intentType === "portfolio_allocation");
  const legacyIntent: StructuredIntent = {
    goal: firstYield?.goal ?? "yield",
    riskTolerance: firstYield?.riskTolerance ?? "medium",
    timeHorizon: firstYield?.timeHorizon ?? "medium",
    assets: firstYield?.assets ?? ["INIT"],
    rawText: intents.map(i => i.rawText).join(", "),
  };

  return {
    id: uuidv4(),
    steps,
    estimatedYield: avgYield,
    riskScore: riskLabel,
    riskScoreNumeric: avgRisk,
    explanation: explanationParts.join(" — "),
    intent: legacyIntent,
    parsedIntents: intents,
    createdAt: new Date().toISOString(),
  };
}

// ── Backward-compat single-intent generator ───────────────────

export function generateStrategy(intent: StructuredIntent): StrategyBundle {
  const template =
    STRATEGY_TEMPLATES[intent.goal]?.[intent.riskTolerance] ??
    STRATEGY_TEMPLATES.yield.medium;

  const steps: StrategyStep[] = template.steps.map((step, i) => ({ index: i + 1, ...step }));
  const riskLabel = template.riskScoreNumeric <= 3 ? "low" : template.riskScoreNumeric <= 6 ? "medium" : "high";

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
