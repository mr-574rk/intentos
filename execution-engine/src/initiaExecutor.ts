import { RESTClient, Wallet, RawKey, MsgExecute, bcs } from "@initia/initia.js";
import type { TransactionObject, ExecutionResult } from "../../types";
import { INITIA_CONFIG } from "../../config/initiaConfig";

/**
 * Real Initia testnet executor using @initia/initia.js.
 * Submits transaction bundles using BCS-encoded Move VM arguments.
 */
export async function initiaExecute(
  transactions: TransactionObject[],
  strategyId: string,
  sessionKey: string
): Promise<ExecutionResult> {
  const privateKey = process.env.RELAYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("RELAYER_PRIVATE_KEY must be set in backend/.env for testnet execution.");
  }

  // 1. Initialize connection to Initia Testnet
  const lcd = new RESTClient(INITIA_CONFIG.rest, {
    chainId: INITIA_CONFIG.chainId,
    gasPrices: "0.015uintos",
    gasAdjustment: "1.5",
  });

  // 2. Load the Relayer Wallet
  const key = new RawKey(Buffer.from(privateKey, "hex"));
  const wallet = new Wallet(lcd, key);

  // 3. BCS-encode Move VM arguments to match the StrategyExecutor.move execute_bundle signature:
  //    execute_bundle(bundle_id: vector<u8>, step_actions: vector<vector<u8>>,
  //                   step_from_assets: vector<vector<u8>>, step_to_assets: vector<vector<u8>>,
  //                   step_amounts: vector<u64>, risk_score: u64)
  const stepActions   = transactions.map((tx) => String(tx.payload.action ?? tx.type ?? "execute"));
  const stepFromAssets = transactions.map((tx) => String(tx.payload.from ?? "USDC"));
  const stepToAssets  = transactions.map((tx) => String(tx.payload.to ?? "INIT"));
  const stepAmounts   = transactions.map((tx) => {
    const amt = Number(tx.payload.amount);
    return BigInt(amt > 0 ? amt * 1000000 : 1000000);
  });

  const args = [
    bcs.string().serialize(strategyId).toBase64(),
    bcs.vector(bcs.string()).serialize(stepActions).toBase64(),
    bcs.vector(bcs.string()).serialize(stepFromAssets).toBase64(),
    bcs.vector(bcs.string()).serialize(stepToAssets).toBase64(),
    bcs.vector(bcs.u64()).serialize(stepAmounts).toBase64(),
    bcs.u64().serialize(BigInt(5)).toBase64(),
  ];

  const msgs = [
    new MsgExecute(
      wallet.key.accAddress,
      INITIA_CONFIG.contracts.strategyExecutor,
      "strategy_executor",
      "execute_bundle",
      [],
      args
    )
  ];

  // 4. Sign and Broadcast Bundle
  try {
    const signedTx = await wallet.createAndSignTx({
      msgs,
      memo: `IntentOS Strategy: ${strategyId}`,
    });

    const result = await lcd.tx.broadcast(signedTx);

    if ('code' in result && result.code !== 0) {
      throw new Error(`Initia TX failed: ${'raw_log' in result ? result.raw_log : 'Unknown error'}`);
    }

    return {
      strategyId,
      status: "success",
      txHash: result.txhash,
      txHashes: [result.txhash],
      result: `Strategy executed on Initia testnet. ${transactions.length} steps bundled.`,
      mode: "testnet",
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(`Blockchain execution failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
