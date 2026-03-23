import type { TransactionObject, ExecutionResult } from "../../types";
import { INITIA_CONFIG } from "../../config/initiaConfig";

/**
 * Initia testnet executor.
 * Submits transaction bundles to the Initia testnet RPC.
 *
 * NOTE: Full signing requires a connected InterwovenKit session.
 * This module handles the on-chain submission step after the frontend
 * has obtained session key authorization.
 */
export async function initiaExecute(
  transactions: TransactionObject[],
  strategyId: string,
  sessionKey: string
): Promise<ExecutionResult> {
  const txHashes: string[] = [];

  for (const tx of transactions) {
    const txHash = await submitTransaction(tx, sessionKey);
    txHashes.push(txHash);
  }

  return {
    strategyId,
    status: "success",
    txHash: txHashes[txHashes.length - 1] ?? "unknown",
    txHashes,
    result: `Strategy executed on Initia testnet. ${transactions.length} transactions submitted.`,
    mode: "testnet",
    executedAt: new Date().toISOString(),
  };
}

/**
 * Submit a single transaction to the Initia RPC.
 * Replace this stub with the @initia/initia.js SDK when available.
 */
async function submitTransaction(
  tx: TransactionObject,
  sessionKey: string
): Promise<string> {
  const endpoint = `${INITIA_CONFIG.rpc}/broadcast_tx_commit`;

  // Build the transaction payload
  const body = {
    tx: {
      type: tx.type,
      payload: tx.payload,
      session_key: sessionKey,
      chain_id: INITIA_CONFIG.chainId,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Transaction failed (step ${tx.index}): ${error}`);
  }

  const data = await response.json() as { result?: { hash?: string } };
  return data?.result?.hash ?? `tx_${Date.now()}_${tx.index}`;
}
