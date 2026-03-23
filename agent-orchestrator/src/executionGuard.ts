import type { StrategyBundle, SimulationResult } from "../../types";
import { RISK_THRESHOLD } from "../../simulation-engine/src/riskScoring";

export interface GuardResult {
  cleared: boolean;
  reason?: string;
}

export function guardExecution(
  bundle: StrategyBundle,
  simulation: SimulationResult
): GuardResult {
  if (!simulation.passed) {
    return {
      cleared: false,
      reason: `Simulation did not pass (risk ${simulation.riskScoreNumeric}/10 > threshold ${RISK_THRESHOLD}/10)`,
    };
  }
  if (simulation.riskScoreNumeric > RISK_THRESHOLD) {
    return {
      cleared: false,
      reason: `Risk score ${simulation.riskScoreNumeric}/10 exceeds maximum ${RISK_THRESHOLD}/10`,
    };
  }
  if (!bundle.steps || bundle.steps.length === 0) {
    return { cleared: false, reason: "Strategy contains no executable steps" };
  }
  if (bundle.steps.length > 10) {
    return {
      cleared: false,
      reason: `Bundle has ${bundle.steps.length} steps — max is 10`,
    };
  }
  if (simulation.bundleId !== bundle.id) {
    return {
      cleared: false,
      reason: "Simulation does not match bundle — re-simulate before executing",
    };
  }
  return { cleared: true };
}
