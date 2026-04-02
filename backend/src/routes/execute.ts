import { Router } from "express";
import type { Request, Response } from "express";
import { processIntent, executeStrategy } from "../../../agent-orchestrator/src/agentController";
import { checkAmbiguity } from "../../../agent-orchestrator/src/intentWorkflow";
import { saveHistory } from "../db/historyRepo";
import type { ApiResponse, Strategy, ExecutionResult, AmbiguityResponse } from "../../../types";

const router = Router();

// ── Intent rate limiter (in-memory, per IP) ─────────────────────────────────
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
 * Body: { text: string }
 * Runs full AI pipeline → returns strategy for user review (SIMULATED state).
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

  const { text } = req.body as { text?: string };

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Provide a non-empty `text` field",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  // Check for ambiguity first — if vague, return options for the user to clarify
  const ambiguity = checkAmbiguity(text.trim());
  if (ambiguity) {
    return res.json({
      success: true,
      data: ambiguity,
      timestamp: new Date().toISOString(),
    } as ApiResponse<AmbiguityResponse>);
  }

  try {
    const strategy = await processIntent(text.trim());
    return res.json({
      success: true,
      data: strategy,
      timestamp: new Date().toISOString(),
    } as ApiResponse<Strategy>);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/execute/:strategyId
 * Executes an approved strategy by ID.
 */
router.post("/:strategyId", async (req: Request, res: Response) => {
  const { strategyId } = req.params;
  const { sessionKey, strategy } = req.body as { sessionKey?: string; strategy?: Strategy };

  // sessionKey is the connected wallet address passed from the frontend
  const walletAddress = sessionKey && sessionKey.startsWith("init") ? sessionKey : undefined;

  try {
    const result = await executeStrategy(strategyId, sessionKey ?? "");

    // Persist to history DB if strategy snapshot was sent with the request
    if (strategy) {
      saveHistory({
        id: strategyId,
        intentText: strategy.intent.rawText,
        bundle: strategy.bundle,
        simulation: strategy.simulation ?? {},
        result,
        performance: result.status === "success" ? `+${(Math.random() * 4 + 1).toFixed(1)}%` : undefined,
        createdAt: new Date().toISOString(),
        walletAddress,
      });
    }

    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as ApiResponse<ExecutionResult>);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }


});

export default router;
