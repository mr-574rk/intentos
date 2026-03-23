import type {
  StructuredIntent,
  GoalType,
  RiskTolerance,
  TimeHorizon,
} from "../../types";

// ── Keyword Maps ─────────────────────────────────────────────

const GOAL_KEYWORDS: Record<GoalType, string[]> = {
  yield: ["yield", "earn", "interest", "apy", "passive", "income from"],
  income: ["income", "cash flow", "dividend", "payout", "returns"],
  growth: ["grow", "growth", "appreciate", "long term", "accumulate", "hodl"],
  stable: ["stable", "preserve", "safe", "protect", "low risk", "stablecoin"],
  diversify: ["diversify", "spread", "balanced", "allocation", "mix"],
};

const RISK_KEYWORDS: Record<RiskTolerance, string[]> = {
  low: ["low risk", "safe", "conservative", "minimal risk", "preserve", "stable", "secure"],
  medium: ["moderate", "balanced", "medium risk", "some risk", "okay with risk"],
  high: ["high risk", "aggressive", "max yield", "risky", "speculative", "degen"],
};

const HORIZON_KEYWORDS: Record<TimeHorizon, string[]> = {
  short: ["short term", "quick", "1 month", "few weeks", "today", "immediate"],
  medium: ["medium term", "few months", "3 months", "6 months", "mid term"],
  long: ["long term", "year", "long", "hodl", "forever", "accumulate"],
};

const ASSET_KEYWORDS: Record<string, string[]> = {
  INIT: ["init", "initia"],
  USDC: ["usdc", "usd coin", "stablecoin", "stable"],
  ETH: ["eth", "ethereum", "ether"],
  BTC: ["btc", "bitcoin"],
  USDT: ["usdt", "tether"],
};

// ── Helpers ──────────────────────────────────────────────────

function matchKeywords<T extends string>(
  text: string,
  map: Record<T, string[]>
): T | null {
  const lower = text.toLowerCase();
  let bestMatch: T | null = null;
  let bestCount = 0;

  for (const [key, keywords] of Object.entries(map) as [T, string[]][]) {
    const count = keywords.filter((k) => lower.includes(k)).length;
    if (count > bestCount) {
      bestCount = count;
      bestMatch = key;
    }
  }
  return bestMatch;
}

function detectAssets(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [asset, keywords] of Object.entries(ASSET_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      found.push(asset);
    }
  }
  return found.length > 0 ? found : ["INIT"]; // default to INIT
}

// ── Main Interpreter ─────────────────────────────────────────

/**
 * Converts raw natural language text into a StructuredIntent.
 *
 * Phase 1: Rule-based keyword matching (no LLM dependency).
 * Phase 2 (optional): Replace or augment with LLM call below.
 */
export function interpretIntent(rawText: string): StructuredIntent {
  const goal = matchKeywords<GoalType>(rawText, GOAL_KEYWORDS) ?? "yield";
  const riskTolerance =
    matchKeywords<RiskTolerance>(rawText, RISK_KEYWORDS) ?? "medium";
  const timeHorizon =
    matchKeywords<TimeHorizon>(rawText, HORIZON_KEYWORDS) ?? "medium";
  const assets = detectAssets(rawText);

  return {
    goal,
    riskTolerance,
    timeHorizon,
    assets,
    rawText,
  };
}

// ── LLM Hook (Phase 2) ───────────────────────────────────────
// Uncomment and configure to use OpenAI / Anthropic instead.
//
// import OpenAI from "openai";
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//
// export async function interpretIntentLLM(rawText: string): Promise<StructuredIntent> {
//   const completion = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       {
//         role: "system",
//         content: `You are a DeFi intent parser. Convert user financial goals into JSON.
// Return ONLY JSON: { goal, riskTolerance, timeHorizon, assets[] }
// goal: "yield" | "growth" | "income" | "stable" | "diversify"
// riskTolerance: "low" | "medium" | "high"
// timeHorizon: "short" | "medium" | "long"
// assets: array of token symbols`,
//       },
//       { role: "user", content: rawText },
//     ],
//     response_format: { type: "json_object" },
//   });
//   const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
//   return { ...parsed, rawText };
// }
