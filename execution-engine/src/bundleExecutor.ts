import type { StrategyBundle } from "../../types";
import { getExecutionMode } from "../../config/executionMode";
import { buildTransactions } from "./transactionBuilder";
import { buildMessages, type UnsignedMessages } from "./initiaExecutor";

/**
 * Bundle message builder — builds unsigned Msg[] for wallet signing.
 *
 * Security: the server never signs or broadcasts transactions.
 * The returned messages are forwarded to the frontend for signing via InterwovenKit.
 *
 * @param bundle        - validated strategy bundle
 * @param strategyId    - strategy identifier (used in memo)
 * @param senderAddress - the verified wallet address of the owning user (never a relayer)
 */
export async function buildBundle(
  bundle: StrategyBundle,
  strategyId: string,
  senderAddress: string
): Promise<UnsignedMessages> {
  const mode = getExecutionMode();
  const transactions = buildTransactions(bundle);

  if (mode === "mock") {
    // Return mock messages for demo / dry-run — no wallet signing triggered
    return {
      msgs: transactions.map(tx => ({
        _mock: true,
        type: tx.type,
        action: tx.payload.action,
        amount: tx.payload.amount,
        from: tx.payload.from,
        to: tx.payload.to,
      })),
      memo: `IntentOS Strategy: ${strategyId} [mock]`,
    };
  }

  // Testnet mode: build real unsigned messages using the user's wallet address
  return buildMessages(transactions, strategyId, senderAddress);
}
