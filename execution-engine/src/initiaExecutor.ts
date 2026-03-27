import { RESTClient, Wallet, RawKey, MsgExecute, bcs } from "@initia/initia.js";
import type { TransactionObject, ExecutionResult } from "../../types";
import { INITIA_CONFIG } from "../../config/initiaConfig";

/**
 * Real Initia testnet executor using @initia/initia.js.
 * Submits transaction bundles using BCS-encoded Move VM arguments.
 *
 * ABI: intentos::strategy_executor::execute_bundle (9 vector args + risk_score)
 *
 * Action enum values (must match StrategyExecutor.move ACTION_* constants):
 *   1 = ACTION_SWAP              → dex_adapter::swap
 *   2 = ACTION_TRANSFER          → bank_adapter::transfer
 *   3 = ACTION_BATCH_TRANSFER    → bank_adapter::transfer (expanded steps)
 *   4 = ACTION_STAKE             → staking_adapter::stake (cosmos::delegate)
 *   5 = ACTION_PROVIDE_LIQUIDITY → dex_adapter::provide_liquidity
 *   6 = ACTION_LEND              → lending_adapter::lend (no-op, records event)
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

  // 1. Connect to Initia Testnet
  const lcd = new RESTClient(INITIA_CONFIG.rest, {
    chainId: INITIA_CONFIG.chainId,
    gasPrices: "0.015uinits",
    gasAdjustment: "1.5",
  });

  // 2. Load Relayer Wallet
  const rawKey = new RawKey(Buffer.from(privateKey, "hex"));
  const wallet = new Wallet(lcd, rawKey);

  // ── Action String → u8 Enum Map ──────────────────────────────────────────
  // Maps strategyGenerator.ts action strings → StrategyExecutor.move enum values.
  const ACTION_ENUM: Record<string, number> = {
    // Swap family → ACTION_SWAP = 1
    swap: 1,  swap_all: 1,  dca_buy: 1,  leverage_long: 1,  split_allocation: 1,
    // Transfer → ACTION_TRANSFER = 2, BATCH_TRANSFER = 3
    transfer: 2,
    batch_transfer: 3,
    // Stake family → ACTION_STAKE = 4
    stake: 4,  stake_lp: 4,  leverage_stake: 4,  compound: 4,
    // Liquidity → ACTION_PROVIDE_LIQUIDITY = 5
    provide_liquidity: 5,  single_asset_provide_liquidity: 5,
    // Lend family → ACTION_LEND = 6
    lend: 6,  leverage_lend: 6,  yield_farm: 6,
  };

  // ── DEX pair address lookup ───────────────────────────────────────────────
  // Maps "FROM/TO" denom pairs → Object<dex::Config> addresses from initiaConfig.ts.
  const POOL_MAP: Record<string, string> = {
    "INIT/USDC": INITIA_CONFIG.pools.initUsdc,
    "USDC/INIT": INITIA_CONFIG.pools.initUsdc,
    "INIT/ETH":  INITIA_CONFIG.pools.initEth,
    "ETH/INIT":  INITIA_CONFIG.pools.initEth,
  };

  const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
  const SWAP_ACTIONS  = new Set([1, 5]); // ACTION_SWAP, ACTION_PROVIDE_LIQUIDITY
  const STAKE_ACTIONS = new Set([4]);    // ACTION_STAKE

  function resolvePair(from: string, to: string): string {
    const key = `${from.toUpperCase()}/${to.toUpperCase()}`;
    return POOL_MAP[key] ?? INITIA_CONFIG.pools.initUsdc;
  }

  // ── Build per-step vectors ─────────────────────────────────────────────────
  // All vectors MUST be the same length as step_actions (enforced on-chain).

  const resolveDenom = (denom: string | undefined): string => {
    if (!denom) return "uinit";
    if (denom.toUpperCase() === "INIT") return "uinit";
    if (denom.toUpperCase() === "USDC") return "ibc/8E27BA2D5493AF5636760E354E46004562C46AB7EC0CC4C1CA14E9E20E2545B5"; // Standard Noble USDC channel on initiation-2
    return denom;
  };

  const stepActions     = transactions.map(tx => ACTION_ENUM[String(tx.payload.action ?? "")] ?? 1);
  const stepFromDenoms  = transactions.map(tx => resolveDenom(tx.payload.from as string | undefined));
  const stepToDenoms    = transactions.map(tx => resolveDenom(tx.payload.to as string | undefined));
  const stepAmounts     = transactions.map(tx => {
    const amt = Number(tx.payload.amount);
    return BigInt(amt > 0 ? amt * 1_000_000 : 1_000_000);
  });

  // step_recipients: recipient address for transfer/batch_transfer, @0x0 for all others.
  const stepRecipients  = transactions.map((tx, i) => {
    if (stepActions[i] === 2 || stepActions[i] === 3) {
      return String(tx.payload.to ?? ZERO_ADDR);
    }
    return ZERO_ADDR;
  });

  // step_validators: bech32 validator string for stake actions, "" for all others.
  const stepValidators  = transactions.map((_, i) =>
    STAKE_ACTIONS.has(stepActions[i]) ? INITIA_CONFIG.defaultValidator : ""
  );

  // step_pair_addrs: Object<dex::Config> address for swap/liquidity, @0x0 for others.
  const stepPairAddrs   = transactions.map((tx, i) =>
    SWAP_ACTIONS.has(stepActions[i])
      ? resolvePair(String(tx.payload.from ?? "INIT"), String(tx.payload.to ?? "USDC"))
      : ZERO_ADDR
  );

  const bundleIdBcs = bcs.string().serialize(strategyId).toBase64();
  console.log(`[DEBUG] Backend strategyId: '${strategyId}'`);
  console.log(`[DEBUG] Backend bundleIdBcs base64: ${bundleIdBcs}`);

  const args = [
    bundleIdBcs,                                                             // bundle_id
    bcs.vector(bcs.u8()).serialize(stepActions).toBase64(),                  // step_actions (u8 enum)
    bcs.vector(bcs.string()).serialize(stepFromDenoms).toBase64(),           // step_from_denoms
    bcs.vector(bcs.string()).serialize(stepToDenoms).toBase64(),             // step_to_denoms
    bcs.vector(bcs.u64()).serialize(stepAmounts).toBase64(),                 // step_amounts
    bcs.vector(bcs.address()).serialize(stepRecipients).toBase64(),          // step_recipients
    bcs.vector(bcs.string()).serialize(stepValidators).toBase64(),           // step_validators
    bcs.vector(bcs.address()).serialize(stepPairAddrs).toBase64(),           // step_pair_addrs
    bcs.u64().serialize(BigInt(5)).toBase64(),                               // risk_score = 5
  ];

  const msgs = [
    new MsgExecute(
      wallet.key.accAddress,
      INITIA_CONFIG.contracts.strategyExecutor,
      "strategy_executor",
      "execute_bundle",
      [],
      args
    ),
  ];

  // 4. Sign and Broadcast
  try {
    const signedTx = await wallet.createAndSignTx({
      msgs,
      memo: `IntentOS Strategy: ${strategyId}`,
    });

    const result = await lcd.tx.broadcast(signedTx);

    if ("code" in result && result.code !== 0) {
      throw new Error(
        `Initia TX failed: ${"raw_log" in result ? result.raw_log : "Unknown error"}`
      );
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
  } catch (error: any) {
    if (error.response?.data) {
      console.error("Simulation API Error:", JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(
      `Blockchain execution failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
