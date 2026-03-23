import type { StructuredIntent, StrategyBundle, SimulationResult } from "../../types";

/**
 * Runs the full AI pipeline:
 *   raw text → intent → strategy → simulation
 */
export async function runIntentWorkflow(
  rawText: string,
  _strategyId: string
): Promise<{ intent: StructuredIntent; bundle: StrategyBundle; simulation: SimulationResult }> {
  // Dynamic requires to avoid circular compile issues with engines
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { interpretIntent } = require("../../ai-engine/src/intentInterpreter") as typeof import("../../ai-engine/src/intentInterpreter");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { generateStrategy } = require("../../ai-engine/src/strategyGenerator") as typeof import("../../ai-engine/src/strategyGenerator");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { simulateStrategy } = require("../../simulation-engine/src/strategySimulator") as typeof import("../../simulation-engine/src/strategySimulator");

  const intent = interpretIntent(rawText);
  const bundle = generateStrategy(intent);
  const simulation = simulateStrategy(bundle);

  return { intent, bundle, simulation };
}
