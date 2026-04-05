import type { ParsedIntent, IntentType, GoalType, RiskTolerance } from "../../types";

// ── Keyword Patterns (non-global, stateless — tested with .test() or .exec()) ──

const SWAP_PATTERNS       = /\b(swap|buy|convert|exchange|turn .{1,20} into|change .{1,20} to)\b/i;
const TRANSFER_PATTERNS   = /\b(send|pay|transfer|give)\b/i;
const YIELD_PATTERNS      = /\b(earn|yield|passive|income|profitable|something from|make money|interest)\b/i;
// Fix #7: Stake wins over yield — UNSTAKE_PATTERNS is the only blocking condition now
const STAKE_PATTERNS      = /\b(stake|staking|lock)\b/i;
const PORTFOLIO_PATTERNS  = /\b(allocate|diversify|split|portfolio|balance between|spread)\b/i;
const UNSTAKE_PATTERNS    = /\b(unstake|undelegate|unbond|withdraw.{0,10}stake|take out.{0,15}staked)\b/i;
// Fix #13: also matches bare "claim" alone
const CLAIM_PATTERNS      = /\b(claim|collect|harvest|withdraw).{0,20}(reward|staking reward|earning|yield)\b/i;
const CLAIM_SOLO_RE       = /^\s*claim\s*$/i;
const AUTOPILOT_ENABLE_PATTERNS  = /\b(enable|turn on|activate|start).{0,20}(autopilot|auto.?compound|automation|auto)\b/i;
const AUTOPILOT_DISABLE_PATTERNS = /\b(disable|turn off|deactivate|stop).{0,20}(autopilot|auto.?compound|automation|auto)\b/i;

// Fix #1/#2: Non-global, no .lastIndex required — don't use /g here
const FRACTION_WORD_RE  = /\b(all|half|quarter|third)\b/i;
const PERCENT_SYMBOL_RE = /(\d+(?:\.\d+)?)\s*%/;
const PERCENT_WORD_RE   = /\b(zero|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|\d+(?:\.\d+)?)\s+percent\b/i;

/** Maps fraction-word → raw decimal (e.g. "half" → 0.5) */
const FRACTION_WORD_MAP: Record<string, number> = {
  all: 1.0,
  half: 0.5,
  quarter: 0.25,
  third: 1 / 3, // ≈ 0.333…
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
  yield:     ["yield", "earn", "interest", "apy", "passive", "income from"],
  income:    ["income", "cash flow", "dividend", "returns"],
  growth:    ["grow", "growth", "appreciate", "accumulate", "hodl"],
  stable:    ["stable", "preserve", "protect", "stablecoin"],
  diversify: ["diversify", "spread", "allocation", "balanced"],
};

// Fix #14: Removed "also" from split pattern — too ambiguous in non-compound sentences
// Fix #5: MULTI_SPLIT_RE is non-global to avoid lastIndex pollution from split()
const MULTI_SPLIT_RE = /\s+(?:and(?:\s+then)?|then|after(?:\s+that)?)\s+/i;

// ── Helpers ──────────────────────────────────────────────────

// Fix #4: All global regexes are now instantiated inside their helpers — no module-scope /g state

function extractTokens(text: string): string[] {
  // Fix #11: corrected "uintos" → "uinit"
  const TOKEN_RE = /\b(INIT|USDC|ETH|BTC|USDT|uinit)\b/gi;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(text)) !== null) found.add(m[1].toUpperCase());
  return Array.from(found);
}

/**
 * Extract a numeric amount from natural-language text.
 *
 * Priority order:
 *   1. Fraction words  — "half" → 0.5 | "quarter" → 0.25 | "third" → 0.333 | "all" → 1.0
 *      (only fires when there is no explicit digit in the clause — fix #6)
 *   2. Percent symbol  — "10%"  → 0.10 | "50%"   → 0.50
 *   3. Percent word    — "ten percent" → 0.10 | "50 percent" → 0.50
 *   4. Plain numeric   — "0.5 USDC" → 0.5 | "100" → 100
 *
 * Returns `undefined` when no amount can be detected.
 */
function extractAmount(text: string): number | undefined {
  const lower = text.toLowerCase();

  // ── Tier 1: fraction words — only when no explicit digit present (fix #6) ──
  if (!/\d/.test(lower)) {
    const fracMatch = FRACTION_WORD_RE.exec(lower);
    if (fracMatch) return FRACTION_WORD_MAP[fracMatch[1].toLowerCase()];
  }

  // ── Tier 2: percentage symbol e.g. "10%", "33.5%" ────────────────────────
  const pctSymMatch = PERCENT_SYMBOL_RE.exec(lower);
  if (pctSymMatch) return parseFloat(pctSymMatch[1]) / 100;

  // ── Tier 3: percentage word e.g. "ten percent", "10 percent" ─────────────
  const pctWordMatch = PERCENT_WORD_RE.exec(lower);
  if (pctWordMatch) {
    const raw = pctWordMatch[1].toLowerCase();
    const asNum = parseFloat(raw);
    const value = !isNaN(asNum) ? asNum : (PERCENT_NUMBER_WORDS[raw] ?? 0);
    return value / 100;
  }

  // ── Tier 4: standard numeric e.g. "100 USDC", "0.5" ─────────────────────
  // Fix #3: purely numeric match — no fraction words here to avoid NaN
  const PLAIN_AMOUNT_RE = /\b(\d+(?:\.\d+)?)\s*(?:%|percent)?\s*(?:USDC|INIT|ETH|BTC|USDT|uinit)?/i;
  const m = PLAIN_AMOUNT_RE.exec(text);
  return m ? parseFloat(m[1]) : undefined;
}

// Fix #8: Tighter RECIPIENT_RE — must be an address (0x/init1), .init username, or @handle
function extractRecipients(text: string): string[] {
  const RECIPIENT_RE = /(?:to|for)\s+(0x[a-fA-F0-9]{40,}|init1[a-z0-9]{38,}|@?[a-z0-9][a-z0-9._-]{2,}\.init)/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = RECIPIENT_RE.exec(text)) !== null) out.push(m[1]);
  return out;
}

function extractTokenPair(text: string): { tokenIn?: string; tokenOut?: string } {
  const TOKEN_PAIR_RE = /\b(INIT|USDC|ETH|BTC|USDT)\s+(?:to|for|into|→)\s+(INIT|USDC|ETH|BTC|USDT)\b/gi;
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
    const amount = extractAmount(clause);
    return {
      intentType: "swap",
      tokenIn: tokenIn ?? tokens[0],
      tokenOut: tokenOut ?? tokens[1],
      amount,
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

  // ── unstake / undelegate — check before stake ──
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
    // ── claim staking rewards — must be checked before stake because
  //    phrases like "claim staking rewards" contain the word "staking"
  //    which would otherwise match STAKE_PATTERNS first.
  if (CLAIM_PATTERNS.test(lower) || CLAIM_SOLO_RE.test(lower)) {
    return {
      intentType: "claim_rewards",
      token: "INIT",
      rawText: clause.trim(),
    };
  }

  // ── explicit stake — fix #7: STAKE_PATTERNS wins over YIELD_PATTERNS now ──
  if (STAKE_PATTERNS.test(lower)) {
    const tokens = extractTokens(clause);
    const amount = extractAmount(clause);
    return {
      intentType: "stake",
      token: tokens[0] ?? "INIT",
      amount,
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
    // Fix #10: cache extractTokens result — don't call twice
    const assets = extractTokens(clause);
    return {
      intentType: "portfolio_allocation",
      goal: matchGoal(lower),
      riskTolerance: matchRisk(lower),
      // Fix #12: timeHorizon removed from hardcoded default until extraction is implemented
      assets: assets.length ? assets : ["INIT"],
      rawText: clause.trim(),
    };
  }

  // ── yield / earn — may be ambiguous ──
  if (YIELD_PATTERNS.test(lower)) {
    const risk = matchRisk(lower);
    const isVague = !lower.match(/\b(stablecoin|lp|liquidity|pool|apy|percent)\b/i);
    // Fix #10: cache extractTokens result
    const assets = extractTokens(clause);
    return {
      intentType: "yield",
      goal: matchGoal(lower),
      riskTolerance: risk,
      assets: assets.length ? assets : ["INIT"],
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
 * Supports multi-intent sentences joined by "and / then / after that".
 *
 * Examples:
 *   "swap INIT to USDC and stake it"
 *   → [{ intentType: "swap" }, { intentType: "stake" }]
 *
 *   "I want to earn something"
 *   → [{ intentType: "yield", ambiguous: true }]
 */
export function parseIntent(rawText: string): ParsedIntent[] {
  // Fix #5/#14: MULTI_SPLIT_RE is non-global — no lastIndex pollution
  const clauses = rawText.split(MULTI_SPLIT_RE).filter(c => c.trim().length > 2);

  if (clauses.length === 0) {
    return [classifyClause(rawText)];
  }

  const intents: ParsedIntent[] = [];

  for (const clause of clauses) {
    const intent = classifyClause(clause);

    // Fix #9: pronoun resolution extended to transfer intents
    if (
      (intent.intentType === "stake" || intent.intentType === "yield" ||
       intent.intentType === "transfer" || intent.intentType === "batch_transfer") &&
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
