import type { ParsedIntent, IntentType, GoalType, RiskTolerance } from "../../types";

// ── Keyword Maps ─────────────────────────────────────────────

const SWAP_PATTERNS = /\b(swap|buy|convert|exchange|turn .{1,20} into|change .{1,20} to)\b/i;
const TRANSFER_PATTERNS = /\b(send|pay|transfer|give)\b/i;
const YIELD_PATTERNS = /\b(earn|yield|passive|income|profitable|something from|make money|interest)\b/i;
const STAKE_PATTERNS = /\b(stake|staking|lock)\b/i;
const PORTFOLIO_PATTERNS = /\b(allocate|diversify|split|portfolio|balance between|spread)\b/i;

// Token detection
const TOKEN_RE = /\b(INIT|USDC|ETH|BTC|USDT|uintos)\b/gi;
const AMOUNT_RE = /(\d+(?:\.\d+)?)\s*(USDC|INIT|ETH|BTC|USDT|uintos)?/gi;
const RECIPIENT_RE = /(?:to|for)\s+(0x[a-fA-F0-9]{4,}|[a-z][a-z0-9.]{2,30})/gi;
const TOKEN_PAIR_RE = /\b(INIT|USDC|ETH|BTC|USDT)\s+(?:to|for|into|→)\s+(INIT|USDC|ETH|BTC|USDT)\b/gi;
const MULTI_SPLIT_RE = /\s+(?:and(?:\s+then)?|then|also|after(?:\s+that)?)\s+/gi;

const RISK_KEYWORDS: Record<RiskTolerance, string[]> = {
  low:    ["low risk", "safe", "conservative", "secure", "preserve"],
  medium: ["moderate", "balanced", "medium risk", "some risk"],
  high:   ["high risk", "aggressive", "max", "risky", "speculative", "degen"],
};

const GOAL_KEYWORDS: Record<GoalType, string[]> = {
  yield:     ["yield", "earn", "interest", "apy", "passive", "income from"],
  income:    ["income", "cash flow", "dividend", "returns"],
  growth:    ["grow", "growth", "appreciate", "accumulate", "hodl"],
  stable:    ["stable", "preserve", "protect", "stablecoin"],
  diversify: ["diversify", "spread", "allocation", "balanced"],
};

// ── Helpers ──────────────────────────────────────────────────

function extractTokens(text: string): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(text)) !== null) found.add(m[1].toUpperCase());
  return Array.from(found);
}

function extractAmount(text: string): number | undefined {
  AMOUNT_RE.lastIndex = 0;
  const m = AMOUNT_RE.exec(text);
  return m ? parseFloat(m[1]) : undefined;
}

function extractRecipient(text: string): string | undefined {
  RECIPIENT_RE.lastIndex = 0;
  const m = RECIPIENT_RE.exec(text);
  return m ? m[1] : undefined;
}

function extractRecipients(text: string): string[] {
  const out: string[] = [];
  RECIPIENT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RECIPIENT_RE.exec(text)) !== null) out.push(m[1]);
  return out;
}

function extractTokenPair(text: string): { tokenIn?: string; tokenOut?: string } {
  TOKEN_PAIR_RE.lastIndex = 0;
  const m = TOKEN_PAIR_RE.exec(text);
  if (m) return { tokenIn: m[1].toUpperCase(), tokenOut: m[2].toUpperCase() };
  return {};
}

function matchRisk(text: string): RiskTolerance {
  const lower = text.toLowerCase();
  for (const [level, kws] of Object.entries(RISK_KEYWORDS) as [RiskTolerance, string[]][]) {
    if (kws.some(k => lower.includes(k))) return level;
  }
  return "medium";
}

function matchGoal(text: string): GoalType {
  const lower = text.toLowerCase();
  for (const [goal, kws] of Object.entries(GOAL_KEYWORDS) as [GoalType, string[]][]) {
    if (kws.some(k => lower.includes(k))) return goal;
  }
  return "yield";
}

// ── Single Clause Classifier ─────────────────────────────────

function classifyClause(clause: string): ParsedIntent {
  const lower = clause.toLowerCase().trim();

  // ── swap / exchange ──
  if (SWAP_PATTERNS.test(lower)) {
    const { tokenIn, tokenOut } = extractTokenPair(clause);
    const tokens = extractTokens(clause);
    return {
      intentType: "swap",
      tokenIn: tokenIn ?? tokens[0],
      tokenOut: tokenOut ?? tokens[1],
      rawText: clause.trim(),
    };
  }

  // ── transfer / batch_transfer ──
  if (TRANSFER_PATTERNS.test(lower)) {
    const recipients = extractRecipients(clause);
    const amount = extractAmount(clause);
    const tokens = extractTokens(clause);
    const token = tokens[0] ?? "USDC";

    if (recipients.length > 1) {
      return {
        intentType: "batch_transfer",
        token,
        amount,
        recipients,
        rawText: clause.trim(),
      };
    }
    return {
      intentType: "transfer",
      token,
      amount,
      recipient: recipients[0],
      rawText: clause.trim(),
    };
  }

  // ── explicit stake ──
  if (STAKE_PATTERNS.test(lower) && !YIELD_PATTERNS.test(lower)) {
    const tokens = extractTokens(clause);
    return {
      intentType: "stake",
      token: tokens[0] ?? "INIT",
      rawText: clause.trim(),
    };
  }

  // ── portfolio allocation ──
  if (PORTFOLIO_PATTERNS.test(lower)) {
    return {
      intentType: "portfolio_allocation",
      goal: matchGoal(lower),
      riskTolerance: matchRisk(lower),
      timeHorizon: "medium",
      assets: extractTokens(clause).length ? extractTokens(clause) : ["INIT"],
      rawText: clause.trim(),
    };
  }

  // ── yield / earn — may be ambiguous ──
  if (YIELD_PATTERNS.test(lower)) {
    const risk = matchRisk(lower);
    const isVague = !lower.match(/\b(stablecoin|lp|liquidity|pool|apy|percent)\b/i);
    return {
      intentType: "yield",
      goal: matchGoal(lower),
      riskTolerance: risk,
      timeHorizon: "medium",
      assets: extractTokens(clause).length ? extractTokens(clause) : ["INIT"],
      ambiguous: isVague,
      clarificationOptions: isVague
        ? ["Low risk — stake INIT", "Moderate yield — INIT/USDC liquidity pool", "Higher yield — leverage strategies"]
        : undefined,
      rawText: clause.trim(),
    };
  }

  // ── fallback: default yield with ambiguity flag ──
  return {
    intentType: "yield",
    goal: "yield",
    riskTolerance: "medium",
    timeHorizon: "medium",
    assets: ["INIT"],
    ambiguous: true,
    clarificationOptions: [
      "Low risk — stake INIT",
      "Moderate yield — INIT/USDC liquidity pool",
      "Higher yield — leverage strategies",
    ],
    rawText: clause.trim(),
  };
}

// ── Multi-Intent Parser (main export) ────────────────────────

/**
 * Parse a raw user sentence into one or more `ParsedIntent` objects.
 * Supports multi-intent sentences joined by "and / then / also".
 *
 * Examples:
 *   "swap INIT to USDC and stake it"
 *   → [{ intentType: "swap" }, { intentType: "stake" }]
 *
 *   "I want to earn something"
 *   → [{ intentType: "yield", ambiguous: true }]
 */
export function parseIntent(rawText: string): ParsedIntent[] {
  // Split on conjunctions to detect multiple sub-commands
  const clauses = rawText.split(MULTI_SPLIT_RE).filter(c => c.trim().length > 2);

  if (clauses.length === 0) {
    return [classifyClause(rawText)];
  }

  const intents: ParsedIntent[] = [];

  for (const clause of clauses) {
    const intent = classifyClause(clause);

    // Handle pronoun references: "stake it" → inherit token from previous swap
    if (
      (intent.intentType === "stake" || intent.intentType === "yield") &&
      !intent.token &&
      intents.length > 0
    ) {
      const prev = intents[intents.length - 1];
      if (prev.intentType === "swap" && prev.tokenOut) {
        intent.token = prev.tokenOut;
        intent.assets = [prev.tokenOut];
      }
    }

    intents.push(intent);
  }

  return intents;
}
