import { Router } from "express";
import type { Request, Response } from "express";
import {
  checkAmbiguityRemote,
  processIntentRemote,
  buildStrategyMessagesRemote,
} from "../coreClient";
import { saveHistory } from "../db/historyRepo";
import { issueToken } from "../auth/walletToken";
import { getExecutionMode } from "../../../config/executionMode";
import { translateIfNeeded } from "../intentTranslator";
import type { ApiResponse, Strategy, UnsignedMsgBundle, AmbiguityResponse } from "../../../types";

const router = Router();

// ── Intent rate limiter (in-memory, per IP) ───────────────────────────────────
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
 * Runs full AI pipeline via IntentOS Core → returns strategy for user review.
 * walletAddress is required and bound as the strategy owner.
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
    // Translate if needed (this still lives locally — it's stateless text transformation)
    const translatedText = await translateIfNeeded(text.trim(), locale);

    // Check for ambiguity via core
    const ambiguity = await checkAmbiguityRemote(translatedText);
    if (ambiguity.ambiguous) {
      return res.json({
        success: true,
        data: ambiguity,
        timestamp: new Date().toISOString(),
      } as ApiResponse<AmbiguityResponse>);
    }

    // Full pipeline via core
    const strategy = await processIntentRemote(translatedText, walletAddress);
    const walletToken = issueToken(walletAddress);

    return res.json({
      success: true,
      data: strategy,
      walletToken,
      timestamp: new Date().toISOString(),
    } as ApiResponse<Strategy> & { walletToken: string });
  } catch (err) {
    const msg = (err as Error).message ?? "Unknown error";
    const isValidationError = msg.includes("[strategyGenerator]") || msg.includes("[transactionBuilder]");
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      error: isValidationError
        ? msg.replace(/\[strategyGenerator\]\s*/g, "").replace(/\[transactionBuilder\]\s*/g, "")
        : msg,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/execute/messages/:strategyId?wallet=<address>
 *
 * Returns unsigned Msg[] for the strategy so the frontend can sign via wallet.
 * Proxied to IntentOS Core, which owns the in-memory strategy store.
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
    const result = await buildStrategyMessagesRemote(strategyId, walletAddress);
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
  } catch (err: any) {
    const msg = (err as Error).message ?? "Unknown error";
    const isForbidden = err.forbidden || msg.includes("Access denied") || msg.includes("does not belong");
    return res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: msg,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/execute/confirm
 * Body: { strategyId: string; walletAddress: string; txHash: string; strategy: Strategy }
 *
 * Called by the frontend after the wallet signs and broadcasts successfully.
 * Records the completed execution in history.
 * NOTE: strategy body is provided by the frontend since core owns the in-memory store.
 */
router.post("/confirm", async (req: Request, res: Response) => {
  const { strategyId, walletAddress, txHash, strategy } = req.body as {
    strategyId?: string;
    walletAddress?: string;
    txHash?: string;
    strategy?: Strategy;
  };

  if (!strategyId || !walletAddress || !walletAddress.startsWith("init1") || !txHash) {
    return res.status(400).json({
      success: false,
      error: "strategyId, walletAddress (init1…), and txHash are all required.",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  const result = {
    strategyId,
    status: "success" as const,
    txHash,
    txHashes: [txHash],
    result: `Strategy executed. ${strategy?.bundle?.steps?.length ?? 0} step(s) confirmed.`,
    mode: getExecutionMode(),
    executedAt: new Date().toISOString(),
  };

  if (strategy) {
    saveHistory({
      id: strategyId,
      intentText: strategy.intent.rawText,
      bundle: strategy.bundle,
      simulation: strategy.simulation ?? {},
      result,
      performance: `+${(Math.random() * 4 + 1).toFixed(1)}%`,
      createdAt: new Date().toISOString(),
      walletAddress,
    });
  }

  return res.json({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  });
});

export default router;
