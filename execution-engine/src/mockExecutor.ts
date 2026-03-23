import type { ExecutionResult } from "../../types";

const MOCK_TX_PREFIXES = ["mock_tx", "sim_tx", "testrun_tx"];

/**
 * Mock executor — simulates bundle execution instantly.
 * Used when EXECUTION_MODE=mock (default for demos and development).
 */
export async function mockExecute(
  bundleId: string,
  stepCount: number
): Promise<ExecutionResult> {
  // Simulate processing delay (800ms–1.5s)
  await sleep(800 + Math.random() * 700);

  const prefix = MOCK_TX_PREFIXES[Math.floor(Math.random() * MOCK_TX_PREFIXES.length)];
  const txHash = `${prefix}_${bundleId.slice(0, 8)}_${Date.now()}`;

  // Generate per-step tx hashes
  const txHashes = Array.from({ length: stepCount }, (_, i) =>
    `${prefix}_step${i + 1}_${Math.random().toString(36).slice(2, 10)}`
  );

  return {
    strategyId: bundleId,
    status: "success",
    txHash,
    txHashes,
    result: `Strategy executed successfully (simulated). ${stepCount} steps completed.`,
    mode: "mock",
    executedAt: new Date().toISOString(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
