import type { ExecutionMode } from "../types";

/**
 * Reads the EXECUTION_MODE environment variable.
 *
 * EXECUTION_MODE=mock    → Simulated execution (default, hackathon-safe)
 * EXECUTION_MODE=testnet → Real Initia testnet execution
 */
export function getExecutionMode(): ExecutionMode {
  const mode = process.env.EXECUTION_MODE?.toLowerCase();
  if (mode === "testnet") return "testnet";
  return "mock";
}

export const EXECUTION_MODE: ExecutionMode = getExecutionMode();

export const IS_MOCK = EXECUTION_MODE === "mock";
export const IS_TESTNET = EXECUTION_MODE === "testnet";
