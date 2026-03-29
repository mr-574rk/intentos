import type { ParsedIntent, IntentType, GoalType, RiskTolerance } from "../../types";

// ── Keyword Maps ─────────────────────────────────────────────

const SWAP_PATTERNS = /\b(swap|buy|convert|exchange|turn .{1,20} into|change .{1,20} to)\b/i;
const TRANSFER_PATTERNS = /\b(send|pay|transfer|give)\b/i;
const YIELD_PATTERNS = /\b(earn|yield|passive|income|profitable|something from|make money|interest)\b/i;
const STAKE_PATTERNS = /\b(stake|staking|lock)\b/i;
const PORTFOLIO_PATTERNS = /\b(allocate|diversify|split|portfolio|balance between|spread)\b/i;
const UNSTAKE_PATTERNS = /\b(unstake|undelegate|unbond|withdraw.{0,10}stake|take out.{0,15}staked)\b/i;
const CLAIM_PATTERNS = /\b(claim|collect|harvest|withdraw).{0,20}(reward|staking reward|earning|yield)\b/i;
const AUTOPILOT_ENABLE_PATTERNS = /\b(enable|turn on|activate|start).{0,20}(autopilot|auto.?compound|automation|auto)\b/i;
const AUTOPILOT_DISABLE_PATTERNS = /\b(disable|turn off|deactivate|stop).{0,20}(autopilot|auto.?compound|automation|auto)\b/i;

// Token detection
const TOKEN_RE = /\b(INIT|USDC|ETH|BTC|USDT|uintos)\b/gi;
// Decodes numbers, fractions ("half", "quarter"), and percentages ("10%", "10 percent")
const AMOUNT_RE = /\b(half|quarter|third|all|\d+(?:\.\d+)?)\s*(?:%|percent)?\s*(USDC|INIT|ETH|BTC|USDT|uintos)?/gi;
const RECIPIENT_RE = /(?:to|for)\s+(0x[a-fA-F0-9]{4,}|[a-z][a-z0-9.]{2,60})/gi;
const TOKEN_PAIR_RE = /\b(INIT|USDC|ETH|BTC|USDT)\s+(?:to|for|into|→)\s+(INIT|USDC|ETH|BTC|USDT)\b/gi;
const MULTI_SPLIT_RE = /\s+(?:and(?:\s+then)?|then|also|after(?:\s+that)?)\s+/gi;

// Natural-language amount patterns (evaluated in priority order inside extractAmount)
const FRACTION_WORD_RE = /\b(all|half|quarter|third)\b/i;
const PERCENT_SYMBOL_RE = /(\d+(?:\.\d+)?)\s*%/;
// Matches digit-prefixed or English-word-prefixed "percent": "10 percent", "fifty percent"
const PERCENT_WORD_RE =
  /\b(zero|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|\d+(?:\.\d+)?)\s+percent\b/i;

/** Maps fraction-word → raw decimal (e.g. "half" → 0.5) */
const FRACTION_WORD_MAP: Record<string, number> = {
  all: 1.0,
  half: 0.5,
  quarter: 0.25,
  third: 1 / 3,   // ≈ 0.333…
};

/** Maps English number-word → integer, used for "fifty percent" → 50 → 0.50 */
const PERCENT_NUMBER_WORDS: Record<string, number> = {
  zero: 0, ten: 10, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

const RISK_KEYWORDS: Record<RiskTolerance, string[]> = {
  low: ["low risk", "safe", "conservative", "secure", "preserve"],
  medium: ["moderate", "balanced", "medium risk", "some risk"],
  high: ["high risk", "aggressive", "max", "risky", "speculative", "degen"],
};

const GOAL_KEYWORDS: Record<GoalType, string[]> = {
  yield: ["yield", "earn", "interest", "apy", "passive", "income from"],
  income: ["income", "cash flow", "dividend", "returns"],
  growth: ["grow", "growth", "appreciate", "accumulate", "hodl"],
  stable: ["stable", "preserve", "protect", "stablecoin"],
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

/**
 * Extract a numeric amount from natural-language text.
 *
 * Priority order:
 *   1. Fraction words  — "half" → 0.5 | "quarter" → 0.25 | "third" → 0.333 | "all" → 1.0
 *   2. Percent symbol  — "10%"  → 0.10 | "50%"   → 0.50
 *   3. Percent word    — "ten percent" → 0.10 | "50 percent" → 0.50
 *   4. Plain numeric   — "0.5 USDC" → 0.5 | "100" → 100  (original behaviour)
 *
 * Returns `undefined` when no amount can be detected.
 */
function extractAmount(text: string): number | undefined {
  const lower = text.toLowerCase();

  // ── Tier 1: fraction words ────────────────────────────────
  FRACTION_WORD_RE.lastIndex = 0;
  const fracMatch = FRACTION_WORD_RE.exec(lower);
  if (fracMatch) {
    return FRACTION_WORD_MAP[fracMatch[1].toLowerCase()];
  }

  // ── Tier 2: percentage symbol  e.g. "10%", "33.5%" ────────
  PERCENT_SYMBOL_RE.lastIndex = 0;
  const pctSymMatch = PERCENT_SYMBOL_RE.exec(lower);
  if (pctSymMatch) {
    return parseFloat(pctSymMatch[1]) / 100;
  }

  // ── Tier 3: percentage word  e.g. "ten percent", "10 percent" ──
  PERCENT_WORD_RE.lastIndex = 0;
  const pctWordMatch = PERCENT_WORD_RE.exec(lower);
  if (pctWordMatch) {
    const raw = pctWordMatch[1].toLowerCase();
    // Try direct numeric parse first ("10 percent"), then English word map
    const asNum = parseFloat(raw);
    const value = !isNaN(asNum) ? asNum : (PERCENT_NUMBER_WORDS[raw] ?? 0);
    return value / 100;
  }

  // ── Tier 4: standard numeric  e.g. "100 USDC", "0.5" ──────
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
  if (STAKE_PATTERNS.test(lower) && !YIELD_PATTERNS.test(lower) && !UNSTAKE_PATTERNS.test(lower)) {
    const tokens = extractTokens(clause);
    const amount = extractAmount(clause);
    return {
      intentType: "stake",
      token: tokens[0] ?? "INIT",
      amount,
      rawText: clause.trim(),
    };
  }

  // ── unstake / undelegate ──
  if (UNSTAKE_PATTERNS.test(lower)) {
    const tokens = extractTokens(clause);
    const amount = extractAmount(clause);
    return {
      intentType: "unstake",
      token: tokens[0] ?? "INIT",
      amount,
      rawText: clause.trim(),
    };
  }

  // ── claim staking rewards ──
  if (CLAIM_PATTERNS.test(lower)) {
    return {
      intentType: "claim_rewards",
      token: "INIT",
      rawText: clause.trim(),
    };
  }

  // ── autopilot enable / disable ──
  if (AUTOPILOT_ENABLE_PATTERNS.test(lower)) {
    return { intentType: "autopilot_enable", rawText: clause.trim() };
  }
  if (AUTOPILOT_DISABLE_PATTERNS.test(lower)) {
    return { intentType: "autopilot_disable", rawText: clause.trim() };
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