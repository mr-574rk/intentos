import type { StrategyBundle, ParsedIntent } from "../../types";

interface ReasoningRule {
  match: (bundle: StrategyBundle, intents: ParsedIntent[]) => boolean;
  explain: (bundle: StrategyBundle, intents: ParsedIntent[]) => string;
}

const RULES: ReasoningRule[] = [
  {
    match: (b) => b.steps.some(s => s.action === "swap"),
    explain: (b, intents) => {
      const swp = intents.find(i => i.intentType === "swap");
      if (swp?.tokenIn && swp?.tokenOut)
        return `Swapping ${swp.tokenIn} → ${swp.tokenOut} repositions assets for the next step without manual wallet interaction.`;
      return "Swapping assets ensures the right liquidity is available for the strategy.";
    },
  },
  {
    match: (b) => b.steps.some(s => s.action === "provide_liquidity" || s.action === "add_liquidity"),
    explain: () => "Providing liquidity earns trading fees from every swap in the pool — a passive income source that compounds over time.",
  },
  {
    match: (b) => b.steps.some(s => s.action === "stake" || s.action === "stake_lp"),
    explain: (_, intents) => {
      const token = intents.find(i => i.intentType === "stake")?.token ?? "LP tokens";
      return `Staking ${token} earns protocol rewards on top of any trading fees — maximizing yield from a single deposit.`;
    },
  },
  {
    match: (b) => b.steps.some(s => s.action === "transfer"),
    explain: (_, intents) => {
      const t = intents.find(i => i.intentType === "transfer" || i.intentType === "batch_transfer");
      if (t?.amount && t?.token)
        return `Transferring ${t.amount} ${t.token} is executed as a signed on-chain transaction — no copy-pasting addresses required.`;
      return "The transfer is bundled as a single atomic on-chain transaction.";
    },
  },
  {
    match: (b) => b.steps.some(s => s.action === "lend"),
    explain: () => "Lending idle assets generates interest without exposing the portfolio to impermanent loss.",
  },
  {
    match: (b) => b.steps.some(s => s.action === "leverage_stake" || s.action === "leverage_long"),
    explain: () => "Leverage amplifies potential returns but increases liquidation risk — only suitable for high-risk tolerance.",
  },
  {
    match: (b) => b.steps.some(s => s.action === "dca_buy"),
    explain: () => "Dollar-cost averaging reduces timing risk by spreading purchases across time rather than all at once.",
  },
  {
    match: (b) => b.riskScoreNumeric <= 3,
    explain: (b) => `Risk score ${b.riskScoreNumeric}/10 — this is a conservative strategy that prioritizes capital preservation.`,
  },
  {
    match: (b) => b.riskScoreNumeric >= 7,
    explain: (b) => `Risk score ${b.riskScoreNumeric}/10 — this is an aggressive strategy. Only proceed if you accept the possibility of significant losses.`,
  },
  {
    match: (_, intents) => intents.length > 1,
    explain: (_, intents) =>
      `This strategy chains ${intents.length} sequential actions based on your compound instruction — each step feeds directly into the next.`,
  },
];

/**
 * Generate "Why This Strategy?" bullet points for the frontend.
 * Returns 2–4 concise reasoning strings.
 */
export function explainStrategy(bundle: StrategyBundle, intents: ParsedIntent[]): string[] {
  const matched = RULES
    .filter(rule => rule.match(bundle, intents))
    .map(rule => rule.explain(bundle, intents));

  // Deduplicate and cap at 4 bullets
  const unique = Array.from(new Set(matched)).slice(0, 4);

  // Always append an estimated yield bullet if one exists
  if (bundle.estimatedYield > 0) {
    unique.push(`Estimated yield: ~${bundle.estimatedYield}% APY based on current protocol rates.`);
  }

  return unique.slice(0, 5);
}
