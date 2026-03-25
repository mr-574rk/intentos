import type { StructuredIntent, StrategyBundle, SimulationResult } from "../../types";

/**
 * Runs the full AI pipeline:
 *   raw text → multi-intent parse → bundle → explain → simulate
 */
export async function runIntentWorkflow(
  rawText: string,
  _strategyId: string
): Promise<{ intent: StructuredIntent; bundle: StrategyBundle; simulation: SimulationResult }> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parseIntent } = require("../../ai-engine/src/intentParser") as typeof import("../../ai-engine/src/intentParser");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { generateFromIntents } = require("../../ai-engine/src/strategyGenerator") as typeof import("../../ai-engine/src/strategyGenerator");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { explainStrategy } = require("../../ai-engine/src/strategyExplainer") as typeof import("../../ai-engine/src/strategyExplainer");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { simulateStrategy } = require("../../simulation-engine/src/strategySimulator") as typeof import("../../simulation-engine/src/strategySimulator");

  // 1. Parse into one or more intents
  const parsedIntents = parseIntent(rawText);

  // 2. Build a bundle from all intents
  const bundle = generateFromIntents(parsedIntents);

  // 3. Attach reasoning bullets ("Why this strategy?")
  bundle.reasoning = explainStrategy(bundle, parsedIntents);

  // 4. Simulate
  const simulation = simulateStrategy(bundle);

  return { intent: bundle.intent, bundle, simulation };
}

/**
 * Quick check: does this raw text lead to an ambiguous single intent?
 * Returns null if clear, or an ambiguity descriptor if not.
 */
export function checkAmbiguity(rawText: string): { ambiguous: true; question: string; options: string[] } | null {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parseIntent } = require("../../ai-engine/src/intentParser") as typeof import("../../ai-engine/src/intentParser");
  const intents = parseIntent(rawText);
  const first = intents[0];
  if (first?.ambiguous && first.clarificationOptions?.length) {
    return {
      ambiguous: true,
      question: "How would you like to proceed?",
      options: first.clarificationOptions,
    };
  }
  return null;
}
