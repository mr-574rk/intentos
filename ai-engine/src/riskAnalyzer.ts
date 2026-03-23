import type { StrategyBundle, RiskLabel } from "../../types";

// ── Risk Thresholds ──────────────────────────────────────────

export const RISK_THRESHOLD = 7; // block execution above this

export interface RiskAnalysis {
  score: number;         // 1–10
  label: RiskLabel;
  passed: boolean;       // false if score > threshold
  warnings: string[];
  explanation: string;
}

// ── Risk Factors ─────────────────────────────────────────────

const RISK_FACTORS: { check: (b: StrategyBundle) => boolean; weight: number; warning: string }[] = [
  {
    check: (b) => b.steps.some((s) => s.action.includes("leverage")),
    weight: 2,
    warning: "Strategy includes leveraged positions — liquidation risk present",
  },
  {
    check: (b) => b.steps.length > 5,
    weight: 1,
    warning: "Executing >5 steps increases gas cost and failure probability",
  },
  {
    check: (b) => b.steps.some((s) => s.from === "INIT" && s.to === "ETH"),
    weight: 1.5,
    warning: "Volatile pair liquidity (INIT/ETH) exposes to impermanent loss",
  },
  {
    check: (b) => b.estimatedYield > 30,
    weight: 1,
    warning: "Projected yield >30% typically indicates elevated risk",
  },
  {
    check: (b) => b.steps.some((s) => s.action === "leverage_long"),
    weight: 2,
    warning: "Leveraged long positions may be liquidated in a market decline",
  },
];

// ── Analyzer ─────────────────────────────────────────────────

export function analyzeRisk(bundle: StrategyBundle): RiskAnalysis {
  const warnings: string[] = [];
  let additionalScore = 0;

  for (const factor of RISK_FACTORS) {
    if (factor.check(bundle)) {
      additionalScore += factor.weight;
      warnings.push(factor.warning);
    }
  }

  // Clamp to [1, 10]
  const score = Math.min(10, Math.max(1, bundle.riskScoreNumeric + additionalScore));
  const label: RiskLabel = score <= 3 ? "low" : score <= 6 ? "medium" : "high";
  const passed = score <= RISK_THRESHOLD;

  const explanation = passed
    ? `Risk score ${score}/10 — strategy is within safe execution limits.`
    : `Risk score ${score}/10 — exceeds safety threshold of ${RISK_THRESHOLD}. Manual review required.`;

  return { score, label, passed, warnings, explanation };
}
