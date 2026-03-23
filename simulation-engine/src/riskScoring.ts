import type { StrategyBundle, RiskLabel } from "../../types";

export const RISK_THRESHOLD = 7;

export interface RiskScoreResult {
  score: number;
  label: RiskLabel;
  passed: boolean;
  warnings: string[];
  explanation: string;
}

// ── Risk Factor Table ─────────────────────────────────────────

const FACTORS: {
  id: string;
  check: (b: StrategyBundle) => boolean;
  weight: number;
  warning: string;
}[] = [
  {
    id: "leverage",
    check: (b) => b.steps.some((s) => s.action.includes("leverage")),
    weight: 2,
    warning: "⚠ Leveraged positions — liquidation risk if price drops sharply",
  },
  {
    id: "many_steps",
    check: (b) => b.steps.length > 5,
    weight: 1,
    warning: "⚠ Multi-step bundle (>5 steps) increases gas cost and failure surface",
  },
  {
    id: "volatile_pair",
    check: (b) => b.steps.some((s) => s.from === "INIT" && s.to === "ETH"),
    weight: 1.5,
    warning: "⚠ Volatile pair LP (INIT/ETH) exposes portfolio to impermanent loss",
  },
  {
    id: "high_yield",
    check: (b) => b.estimatedYield > 30,
    weight: 1,
    warning: "⚠ Projected yield >30% is typically associated with elevated risk",
  },
  {
    id: "long_leverage",
    check: (b) => b.steps.some((s) => s.action === "leverage_long"),
    weight: 2,
    warning: "⚠ Leveraged long positions can be liquidated in a market decline",
  },
  {
    id: "no_stable",
    check: (b) =>
      !b.steps.some((s) => s.to === "USDC" || s.to === "USDT" || s.from === "USDC"),
    weight: 0.5,
    warning: "ℹ No stablecoin allocation — portfolio fully exposed to volatile assets",
  },
];

// ── Scorer ──────────────────────────────────────────────────

export function scoreRisk(bundle: StrategyBundle): RiskScoreResult {
  const warnings: string[] = [];
  let extra = 0;

  for (const factor of FACTORS) {
    if (factor.check(bundle)) {
      extra += factor.weight;
      warnings.push(factor.warning);
    }
  }

  const score = Math.min(10, Math.max(1, Math.round(bundle.riskScoreNumeric + extra)));
  const label: RiskLabel = score <= 3 ? "low" : score <= 6 ? "medium" : "high";
  const passed = score <= RISK_THRESHOLD;

  const explanation = passed
    ? `Risk score ${score}/10 — within safe threshold. Strategy is cleared for execution.`
    : `Risk score ${score}/10 — exceeds safety threshold (${RISK_THRESHOLD}/10). Review warnings before executing.`;

  return { score, label, passed, warnings, explanation };
}
