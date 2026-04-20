/**
 * coreClient.ts — Secure HTTP client for IntentOS Core API
 *
 * All calls to the private AI / execution engines route through here.
 * The backend never imports from agent-orchestrator, ai-engine,
 * execution-engine, or simulation-engine directly.
 */

const CORE_URL = process.env.INTENTOS_CORE_URL ?? "http://localhost:4001";
const CORE_KEY = process.env.CORE_API_KEY ?? "dev_core_secret";

const CORE_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${CORE_KEY}`,
};

async function corePost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${CORE_URL}${path}`, {
    method: "POST",
    headers: CORE_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IntentOS Core error (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function coreGet<T>(path: string): Promise<T> {
  const res = await fetch(`${CORE_URL}${path}`, {
    method: "GET",
    headers: CORE_HEADERS,
  });
  if (!res.ok) {
    const text = await res.text();
    const isForbidden = res.status === 403;
    const err = new Error(`IntentOS Core error (${res.status}): ${text}`);
    (err as any).status = res.status;
    (err as any).forbidden = isForbidden;
    throw err;
  }
  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────────────────────

import type {
  Strategy,
  StructuredIntent,
  StrategyBundle,
  SimulationResult,
  AgentTimeline,
} from "../../types";

interface AmbiguityCheck {
  ambiguous: boolean;
  question?: string;
  options?: string[];
}

interface UnsignedMsgResult {
  msgs: Record<string, unknown>[];
  memo: string;
}

/**
 * Check if an intent is ambiguous. Returns the clarification prompt if so.
 */
export async function checkAmbiguityRemote(text: string): Promise<AmbiguityCheck> {
  // /intent on the core server checks ambiguity and returns parsed/structured
  const data = await corePost<AmbiguityCheck & { intents?: unknown; structured?: StructuredIntent }>(
    "/intent",
    { text }
  );
  return { ambiguous: data.ambiguous, question: data.question, options: data.options };
}

/**
 * Parse and interpret intent text → StructuredIntent.
 */
export async function interpretIntentRemote(text: string): Promise<StructuredIntent> {
  const data = await corePost<{ ambiguous: boolean; structured: StructuredIntent }>(
    "/intent",
    { text }
  );
  if (!data.structured) throw new Error("Core did not return a structured intent");
  return data.structured;
}

/**
 * Full pipeline: raw intent text + wallet → Strategy (stored in core's in-memory store).
 */
export async function processIntentRemote(text: string, walletAddress: string): Promise<Strategy> {
  return corePost<Strategy>("/process-intent", { text, walletAddress });
}

/**
 * Build unsigned messages for a strategy ready for wallet signing.
 */
export async function buildStrategyMessagesRemote(
  strategyId: string,
  walletAddress: string
): Promise<UnsignedMsgResult> {
  return coreGet<UnsignedMsgResult>(`/messages/${strategyId}?wallet=${encodeURIComponent(walletAddress)}`);
}

/**
 * Generate a StrategyBundle from a StructuredIntent or raw text.
 */
export async function generateStrategyRemote(
  intent: StructuredIntent
): Promise<StrategyBundle> {
  return corePost<StrategyBundle>("/strategy", { intent });
}

/**
 * Simulate a StrategyBundle → SimulationResult.
 */
export async function simulateStrategyRemote(
  bundle: StrategyBundle
): Promise<SimulationResult> {
  return corePost<SimulationResult>("/simulate", { bundle });
}

/**
 * Fetch the agent timeline for a strategy (owner-scoped).
 */
export async function getTimelineRemote(
  strategyId: string,
  walletAddress: string
): Promise<AgentTimeline | null> {
  try {
    return await coreGet<AgentTimeline>(`/timeline/${strategyId}?wallet=${encodeURIComponent(walletAddress)}`);
  } catch (e: any) {
    if (e.status === 403) return null;
    throw e;
  }
}

/**
 * Fetch all timelines for a wallet.
 */
export async function getAllTimelinesRemote(walletAddress: string): Promise<AgentTimeline[]> {
  return coreGet<AgentTimeline[]>(`/timelines?wallet=${encodeURIComponent(walletAddress)}`);
}
