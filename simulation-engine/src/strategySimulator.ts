import type { StrategyBundle, SimulationResult, PortfolioAllocation } from "../../types";
import { estimateYield } from "./yieldEstimator";
import { scoreRisk } from "./riskScoring";

// ── Portfolio allocation rules ───────────────────────────────

function buildAllocation(bundle: StrategyBundle): PortfolioAllocation {
  const allocation: PortfolioAllocation = {};
  const steps = bundle.steps;
  const stepCount = steps.length;

  // Derive allocation from strategy steps
  steps.forEach((step, i) => {
    const weight = Math.round(100 / stepCount);
    if (step.action === "stake" || step.action === "stake_lp" || step.action === "leverage_stake") {
      allocation["Staking"] = (allocation["Staking"] ?? 0) + weight;
    } else if (step.action === "provide_liquidity") {
      const label = step.to ? `${step.from ?? ""}/${step.to} LP` : "Liquidity Pool";
      allocation[label] = (allocation[label] ?? 0) + weight;
    } else if (step.action === "lend") {
      allocation["Lending"] = (allocation["Lending"] ?? 0) + weight;
    } else if (step.action === "swap" || step.action === "swap_all") {
      allocation[step.to ?? "USDC"] = (allocation[step.to ?? "USDC"] ?? 0) + weight;
    } else if (step.action.includes("leverage")) {
      allocation["Leveraged Position"] = (allocation["Leveraged Position"] ?? 0) + weight;
    } else {
      allocation["Other"] = (allocation["Other"] ?? 0) + weight;
    }
    void i;
  });

  // Normalize to 100%
  const total = Object.values(allocation).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    const keys = Object.keys(allocation);
    allocation[keys[0]] = (allocation[keys[0]] ?? 0) + (100 - total);
  }

  return allocation;
}

// ── Main Simulator ───────────────────────────────────────────

export function simulateStrategy(bundle: StrategyBundle): SimulationResult {
  const portfolioAllocation = buildAllocation(bundle);
  const projectedAPY = estimateYield(bundle);
  const { score, label, passed, warnings, explanation } = scoreRisk(bundle);

  return {
    bundleId: bundle.id,
    portfolioAllocation,
    projectedAPY,
    riskScore: label,
    riskScoreNumeric: score,
    explanation,
    passed,
    warnings,
  };
}
