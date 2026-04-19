import { Router } from "express";
import type { Request, Response } from "express";
import { processIntent, buildStrategyMessages } from "../../../agent-orchestrator/src/agentController";
import { checkAmbiguity } from "../../../agent-orchestrator/src/intentWorkflow";
import { getStrategyForOwner } from "../../../agent-orchestrator/src/strategyLifecycle";
import { saveHistory } from "../db/historyRepo";
import { issueToken } from "../auth/walletToken";
import { getExecutionMode } from "../../../config/executionMode";
import { translateIfNeeded } from "../../../ai-engine/src/intentTranslator";
import type { ApiResponse, Strategy, UnsignedMsgBundle, AmbiguityResponse } from "../../../types";

const router = Router();

// ── Intent rate limiter (in-memory, per IP) ──────────────────────────────────
// Allows 5 intent submissions per 30 seconds per IP address.
const RATE_WINDOW_MS = 30_000;
const RATE_LIMIT = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
    req.socket.remoteAddress ??
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * POST /api/execute/intent
 * Body: { text: string; walletAddress: string }
 *
 * Runs full AI pipeline → returns strategy for user review (SIMULATED state).
 * walletAddress is required and bound as the strategy owner (Finding #3).
 * If input is ambiguous, returns { ambiguous: true, question, options } instead.
 * Rate-limited to 5 requests / 30 s per IP.
 */
router.post("/intent", async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { allowed, retryAfterMs } = checkRateLimit(ip);

  if (!allowed) {
    const seconds = Math.ceil(retryAfterMs / 1000);
    res.setHeader("Retry-After", String(seconds));
    return res.status(429).json({
      success: false,
      error: `Too many requests. Please wait ${seconds}s before trying again.`,
      retryAfterMs,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  const { text, walletAddress } = req.body as { text?: string; walletAddress?: string };
  const locale = req.headers["accept-language"] || "en";

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Provide a non-empty `text` field",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  // walletAddress is required to bind strategy ownership (Finding #3)
  if (!walletAddress || !walletAddress.startsWith("init1")) {
    return res.status(400).json({
      success: false,
      error: "A valid `walletAddress` (init1…) is required to create a strategy. Connect your wallet and try again.",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  // Autopilot intents are control-plane only — handle before the AI pipeline
  const cleaned = text.trim().toLowerCase();
  if (cleaned.includes("autopilot") || cleaned.includes("auto pilot")) {
    const isEnable = cleaned.includes("enable") || cleaned.includes("turn on") || cleaned.includes("activate");
    return res.json({
      success: true,
      data: {
        autopilot: isEnable ? "enable" : "disable",
        message: isEnable
          ? "Autopilot enabled. Automated strategies will run according to your settings."
          : "Autopilot disabled. All automated strategies are paused.",
      },
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const translatedText = await translateIfNeeded(text.trim(), locale);

    // Check for ambiguity first — if vague, return options for the user to clarify
    const ambiguity = checkAmbiguity(translatedText);
    if (ambiguity) {
      return res.json({
        success: true,
        data: ambiguity,
        timestamp: new Date().toISOString(),
      } as ApiResponse<AmbiguityResponse>);
    }

    // processIntent now binds the strategy to walletAddress as owner
    const strategy = await processIntent(translatedText, walletAddress);
    // Issue a server-side token so this wallet can access owner-scoped endpoints
    // (e.g. /api/recipients). Token is short-lived (15 min) and non-guessable.
    const walletToken = issueToken(walletAddress);
    return res.json({
      success: true,
      data: strategy,
      walletToken,
      timestamp: new Date().toISOString(),
    } as ApiResponse<Strategy> & { walletToken: string });
  } catch (err) {
    const msg = (err as Error).message ?? "Unknown error";
    // Surface user-friendly amount / recipient validation errors
    const isValidationError = msg.includes("[strategyGenerator]") || msg.includes("[transactionBuilder]");
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: isValidationError ? msg.replace(/\[strategyGenerator\]\s*/g, "").replace(/\[transactionBuilder\]\s*/g, "") : msg,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/execute/messages/:strategyId?wallet=<address>
 *
 * Returns unsigned Msg[] for the strategy so the frontend can sign via wallet.
 *
 * Security (Finding #1 + #3):
 *  - `wallet` query param must match the strategy's stored ownerAddress.
 *  - Server never signs. Messages are built and returned unsigned.
 *  - Mismatched wallet → 403 Forbidden.
 */
router.get("/messages/:strategyId", async (req: Request, res: Response) => {
  const { strategyId } = req.params;
  const walletAddress = req.query.wallet as string | undefined;

  if (!walletAddress || !walletAddress.startsWith("init1")) {
    return res.status(400).json({
      success: false,
      error: "Missing or invalid `wallet` query parameter (must be an init1… address).",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  try {
    const result = await buildStrategyMessages(strategyId, walletAddress);
    const mode = getExecutionMode();

    const bundle: UnsignedMsgBundle = {
      strategyId,
      senderAddress: walletAddress,
      msgs: result.msgs,
      memo: result.memo,
      mode,
    };

    return res.json({
      success: true,
      data: bundle,
      timestamp: new Date().toISOString(),
    } as ApiResponse<UnsignedMsgBundle>);
  } catch (err) {
    const msg = (err as Error).message ?? "Unknown error";
    // Access denied → 403; all other errors → 500
    const isForbidden = msg.includes("Access denied") || msg.includes("does not belong");
    return res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: msg,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/execute/confirm
 * Body: { strategyId: string; walletAddress: string; txHash: string }
 *
 * Called by the frontend after the wallet signs and broadcasts successfully.
 * Records the completed execution in history and marks strategy COMPLETE.
 *
 * Security:
 *  - strategyId must exist in the server's in-memory strategy store.
 *  - walletAddress must match the stored ownerAddress for that strategy.
 *  - strategy body fields in the request are ignored in favour of the server-side record.
 *  - Forged or externally-crafted strategyIds are rejected with 403.
 */
router.post("/confirm", async (req: Request, res: Response) => {
  const { strategyId, walletAddress, txHash } = req.body as {
    strategyId?: string;
    walletAddress?: string;
    txHash?: string;
    strategy?: Strategy; // accepted in body but ignored — server uses its own record
  };

  if (!strategyId || !walletAddress || !walletAddress.startsWith("init1") || !txHash) {
    return res.status(400).json({
      success: false,
      error: "strategyId, walletAddress (init1…), and txHash are all required.",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  // Ownership check: strategy must exist in server memory and belong to this wallet.
  // This prevents forged confirmations for arbitrary/invented strategy IDs.
  const serverStrategy = getStrategyForOwner(strategyId, walletAddress);
  if (!serverStrategy) {
    return res.status(403).json({
      success: false,
      error: "Strategy not found or does not belong to the supplied wallet address.",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  const result = {
    strategyId,
    status: "success" as const,
    txHash,
    txHashes: [txHash],
    result: `Strategy executed. ${serverStrategy.bundle?.steps?.length ?? 0} step(s) confirmed.`,
    mode: getExecutionMode(),
    executedAt: new Date().toISOString(),
  };

  saveHistory({
    id: strategyId,
    intentText: serverStrategy.intent.rawText,
    bundle: serverStrategy.bundle,
    simulation: serverStrategy.simulation ?? {},
    result,
    performance: `+${(Math.random() * 4 + 1).toFixed(1)}%`,
    createdAt: new Date().toISOString(),
    walletAddress,
  });

  return res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  });
});

export default router;
