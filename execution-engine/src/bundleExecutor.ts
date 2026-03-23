import type { StrategyBundle, ExecutionResult } from "../../types";
import { getExecutionMode } from "../../config/executionMode";
import { buildTransactions } from "./transactionBuilder";
import { mockExecute } from "./mockExecutor";
import { initiaExecute } from "./initiaExecutor";

/**
 * Bundle executor — routes to mock or testnet based on EXECUTION_MODE.
 * Called by the agent orchestrator after guard approval.
 */
export async function executeBundle(
  bundle: StrategyBundle,
  strategyId: string,
  sessionKey = ""
): Promise<ExecutionResult> {
  const mode = getExecutionMode();
  const transactions = buildTransactions(bundle);

  if (mode === "mock") {
    return mockExecute(bundle.id, transactions.length);
  }

  if (!sessionKey) {
    throw new Error("Session key required for testnet execution");
  }

  return initiaExecute(transactions, strategyId, sessionKey);
}
