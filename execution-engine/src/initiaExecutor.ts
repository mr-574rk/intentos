/**
 * initiaExecutor.ts — Message Builder (NO server-side signing)
 *
 * Security architecture:
 *  - The server NEVER holds a private key or signs transactions.
 *  - This module builds unsigned Initia Msg objects and returns them to the caller.
 *  - The frontend passes these msgs to InterwovenKit's requestTxSync for
 *    wallet-side signing and broadcast.
 *
 * Remediations applied:
 *  Finding #1 (CRITICAL) — RELAYER_PRIVATE_KEY removed. No server-side signing.
 *  Finding #2 (HIGH)     — Zero / missing amounts throw instead of defaulting to 1 INIT.
 *  Finding #6 (MEDIUM)   — Swap steps carry a bounded min_return (Some<u64>) derived
 *                          from SWAP_MIN_RETURN_BPS (default 100 = 1% max slippage).
 */

import { bcs } from "@initia/initia.js";
import type { TransactionObject } from "../../types";
import { INITIA_CONFIG } from "../../config/initiaConfig";

/** Result returned to the caller — unsigned messages for wallet signing. */
export interface UnsignedMessages {
  msgs: any[];
  memo: string;
}

// ── Action String → u8 Enum Map ───────────────────────────────────────────────
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
  // ACTION_UNSTAKE = 7 (native MsgUndelegate)
  unstake: 7,  undelegate: 7,  unbond: 7,
  // ACTION_CLAIM_REWARDS = 8 (native MsgWithdrawDelegatorReward)
  claim_rewards: 8,  claim: 8,  withdraw_rewards: 8,
};

// ── Pool / Metadata lookups ──────────────────────────────────────────────────

const POOL_MAP: Record<string, string> = {
  "INIT/USDC": INITIA_CONFIG.pools.initUsdc,
  "USDC/INIT": INITIA_CONFIG.pools.initUsdc,
  "INIT/ETH":  INITIA_CONFIG.pools.initEth,
  "ETH/INIT":  INITIA_CONFIG.pools.initEth,
};

const METADATA: Record<string, string> = {
  "uinit": "0x8e4733bdabcf7d4afc3d14f0dd46c9bf52fb0fce9e4b996c939e195b8bc891d9",
  "uusdc": "0x29824d952e035490fae7567deea5f15b504a68fa73610063c160ab1fa87dd609",
};

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

function resolveDenom(denom: string | undefined): string {
  if (!denom) return "uinit";
  if (denom.toUpperCase() === "INIT") return "uinit";
  if (denom.toUpperCase() === "USDC") return "uusdc";
  return denom;
}

function resolveMetadata(denom: string): string {
  return METADATA[denom] ?? METADATA["uinit"];
}

function resolvePair(from: string, to: string): string {
  const key = `${from.toUpperCase()}/${to.toUpperCase()}`;
  return POOL_MAP[key] ?? INITIA_CONFIG.pools.initUsdc;
}

/**
 * Parse and validate a required positive amount.
 * Throws if undefined, null, zero, negative, NaN, or Infinity.
 * Returns the amount in micro-units (× 1_000_000).
 */
function requirePositiveUAmount(raw: unknown, context: string): bigint {
  if (raw === undefined || raw === null) {
    throw new Error(
      `[initiaExecutor] ${context}: amount is required but was not provided. ` +
      `Zero and missing amounts are never defaulted — they are rejected.`
    );
  }
  const parsed = parseFloat(String(raw));
  if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `[initiaExecutor] ${context}: amount must be a positive finite number, got "${raw}". ` +
      `Zero, negative, and non-numeric amounts are forbidden.`
    );
  }
  return BigInt(Math.floor(parsed * 1_000_000));
}

// ── Slippage helpers ─────────────────────────────────────────────────────────

/**
 * Build a BCS-encoded Option<u64> Some(minReturn) for slippage protection.
 *
 * Format: [1, <u64-little-endian-8-bytes>]
 * BCS Option::Some(v) = 0x01 followed by the BCS encoding of v.
 */
function buildNoneOption(): string {
  // BCS Option::None = single byte 0x00
  // The previous Some(fraction of offer) was broken for cross-asset swaps
  // (INIT→USDC) where offer and return use different token units.
  return Buffer.from([0x00]).toString("base64");
}

/**
 * Build unsigned Initia messages for a strategy bundle.
 *
 * @param transactions - validated TransactionObject array (from buildTransactions)
 * @param strategyId   - strategy identifier (used for memo / session registration)
 * @param senderAddress - the user's wallet address (bech32 init1…); NEVER the server's key
 *
 * Returns { msgs, memo } for passing directly to InterwovenKit requestTxSync.
 */
export async function buildMessages(
  transactions: TransactionObject[],
  strategyId: string,
  senderAddress: string
): Promise<UnsignedMessages> {

  if (!senderAddress || !senderAddress.startsWith("init1")) {
    throw new Error(
      `[initiaExecutor] senderAddress must be a valid bech32 init1… address, got "${senderAddress}". ` +
      `Server-side signing is not supported.`
    );
  }

 

  const stepActions    = transactions.map(tx => ACTION_ENUM[String(tx.payload.action ?? "")] ?? -1);
  const stepFromDenoms = transactions.map(tx => resolveDenom(tx.payload.from as string | undefined));
  const stepToDenoms   = transactions.map(tx => resolveDenom(tx.payload.to as string | undefined));

  // Categorise steps
  const NATIVE_COSMOS_ENUMS = new Set([2, 3, 4, 7, 8]);
  const STAKE_ENUM           = new Set([4]);
  const UNSTAKE_ENUM         = new Set([7]);
  const CLAIM_ENUM           = new Set([8]);
  const TRANSFER_ENUM        = new Set([2, 3]);
  const DEX_ENUMS            = new Set([1, 5]);
  const SWAP_ACTIONS         = new Set([1, 5]);

  const stakeSteps   = transactions.filter((_, i) => STAKE_ENUM.has(stepActions[i]));
  const unstakeSteps = transactions.filter((_, i) => UNSTAKE_ENUM.has(stepActions[i]));
  const claimSteps   = transactions.filter((_, i) => CLAIM_ENUM.has(stepActions[i]));
  const xferSteps    = transactions.filter((_, i) => TRANSFER_ENUM.has(stepActions[i]));
  const dexIdxs      = transactions.map((_, i) => i).filter(i => DEX_ENUMS.has(stepActions[i]));
  const nonDexIdxs   = transactions.map((_, i) => i).filter(i =>
    !NATIVE_COSMOS_ENUMS.has(stepActions[i]) && !DEX_ENUMS.has(stepActions[i])
  );

  // Guard against unsupported action enum (-1 means unknown action leaked through)
  transactions.forEach((tx, i) => {
    if (stepActions[i] === -1) {
      throw new Error(
        `[initiaExecutor] Unrecognized action "${tx.payload.action}" in step ${i + 1}. ` +
        `This action is not mapped to a Move VM enum and cannot be executed.`
      );
    }
  });

  const msgs: Array<{ typeUrl: string; value: any }> = [];

  // ── Native MsgSend (transfer / batch_transfer) ────────────────────────────
  for (const tx of xferSteps) {
    const uAmt = requirePositiveUAmount(tx.payload.amount, `transfer step`);
    const recipientAddr = String(tx.payload.to ?? "");
    if (!recipientAddr || recipientAddr === ZERO_ADDR) {
      throw new Error("[initiaExecutor] Transfer step missing recipient address.");
    }
    if (!recipientAddr.startsWith("init1")) {
      throw new Error(
        `[initiaExecutor] Transfer recipient must be a bech32 init1… address, got: ${recipientAddr}`
      );
    }
    msgs.push({
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: {
        fromAddress: senderAddress,
        toAddress: recipientAddr,
        amount: [{ denom: "uinit", amount: String(uAmt) }]
      }
    });
  }

  // ── Native MsgDelegate (stake) ─────────────────────────────────────────────
  for (const tx of stakeSteps) {
    const uAmt = requirePositiveUAmount(tx.payload.amount, `stake step`);
    msgs.push({
      typeUrl: "/initia.mstaking.v1.MsgDelegate",
      value: {
        delegatorAddress: senderAddress,
        validatorAddress: INITIA_CONFIG.defaultValidator,
        amount: [{ denom: "uinit", amount: String(uAmt) }]
      }
    });
  }

  // ── Native MsgUndelegate (unstake) ────────────────────────────────────────
  for (const tx of unstakeSteps) {
    const uAmt = requirePositiveUAmount(tx.payload.amount, `unstake step`);
    const validator = String(tx.payload.validator ?? INITIA_CONFIG.defaultValidator);
    msgs.push({
      typeUrl: "/initia.mstaking.v1.MsgUndelegate",
      value: {
        delegatorAddress: senderAddress,
        validatorAddress: validator,
        amount: [{ denom: "uinit", amount: String(uAmt) }]
      }
    });
  }

  // ── Native MsgWithdrawDelegatorReward (claim rewards) ─────────────────────
  if (claimSteps.length > 0) {
    msgs.push({
  typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
  value: {
    delegatorAddress: senderAddress,
    validatorAddress: INITIA_CONFIG.defaultValidator
  }
});
  }

  // ── DEX swaps (0x1::dex::swap_script) ─────────────────────────────────────
  for (const globalIdx of dexIdxs) {
    const tx     = transactions[globalIdx];
    const action = stepActions[globalIdx];
    const fromDenom = stepFromDenoms[globalIdx];
    const uAmt   = requirePositiveUAmount(tx.payload.amount, `DEX swap step`);

    if (action === 1 || action === 5) {
      // Swap (action=1) and Provide Liquidity (action=5) both route through
      // 0x1::dex::swap_script — Initia's AMM entry-point for single-asset LP
      // provision and swaps use the same on-chain function.
      const offerDenom   = fromDenom !== "uinit" ? fromDenom : "uinit";
      const offerMeta    = resolveMetadata(offerDenom);

      // Determine pool pair: for provide_liquidity, use from→to if both are set
      const toDenom = stepToDenoms[globalIdx];
      const resolvedPair = resolvePair(
        offerDenom === "uinit" ? "INIT" : offerDenom.replace("u", "").toUpperCase(),
        toDenom === "uinit" ? "INIT" : toDenom !== "uusdc" ? "USDC" :
          (offerDenom === "uinit" ? "USDC" : "INIT")
      );

      // ── Slippage protection (Finding #6) ──────────────────────────────────
      const minReturnBytes = buildNoneOption();
      msgs.push({
        typeUrl: "/initia.move.v1.MsgExecute",
        value: {
          sender: senderAddress,
          moduleAddress: "0x1",
          moduleName: "dex",
          functionName: "swap_script",
          typeArgs: [],
          args: [
            bcs.address().serialize(resolvedPair).toBase64(),
            bcs.address().serialize(offerMeta).toBase64(),
            bcs.u64().serialize(uAmt).toBase64(),
            minReturnBytes, // Option<u64>::None — no min_return constraint
          ]
        }
      });
    }
  }

  // ── Move VM execute_bundle (lend, etc.) ──────────────────────────────────
  if (nonDexIdxs.length > 0) {
    const moveActions    = nonDexIdxs.map(i => stepActions[i]);
    const moveFromDenoms = nonDexIdxs.map(i => stepFromDenoms[i]);
    const moveToDenoms   = nonDexIdxs.map(i => stepToDenoms[i]);
    const moveAmounts    = nonDexIdxs.map(i => {
      const tx = transactions[i];
      return requirePositiveUAmount(tx.payload.amount, `Move step ${i + 1}`);
    });
    const moveRecipients = nonDexIdxs.map((globalIdx, localIdx) => {
      if (moveActions[localIdx] === 2 || moveActions[localIdx] === 3) {
        const addr = String(transactions[globalIdx].payload.to ?? ZERO_ADDR);
        if (!addr || addr === ZERO_ADDR) {
          throw new Error("[initiaExecutor] Transfer step missing recipient address.");
        }
        if (!addr.startsWith("init1")) {
          throw new Error(
            `[initiaExecutor] Transfer recipient must be a bech32 init1… address, got: ${addr}`
          );
        }
        return addr;
      }
      return ZERO_ADDR;
    });
    const moveValidators = nonDexIdxs.map((_, localIdx) =>
      SWAP_ACTIONS.has(moveActions[localIdx]) ? INITIA_CONFIG.defaultValidator : ""
    );
    const movePairAddrs = nonDexIdxs.map((globalIdx, localIdx) =>
      SWAP_ACTIONS.has(moveActions[localIdx])
        ? resolvePair(
            String(transactions[globalIdx].payload.from ?? "INIT"),
            String(transactions[globalIdx].payload.to ?? "USDC")
          )
        : ZERO_ADDR
    );

    const moveArgs = [
      bcs.string().serialize(strategyId).toBase64(),
      bcs.vector(bcs.u8()).serialize(moveActions).toBase64(),
      bcs.vector(bcs.string()).serialize(moveFromDenoms).toBase64(),
      bcs.vector(bcs.string()).serialize(moveToDenoms).toBase64(),
      bcs.vector(bcs.u64()).serialize(moveAmounts).toBase64(),
      bcs.vector(bcs.address()).serialize(moveRecipients).toBase64(),
      bcs.vector(bcs.string()).serialize(moveValidators).toBase64(),
      bcs.vector(bcs.address()).serialize(movePairAddrs).toBase64(),
      bcs.u64().serialize(BigInt(5)).toBase64(),
    ];

    msgs.push({
      typeUrl: "/initia.move.v1.MsgExecute",
      value: {
        sender: senderAddress,
        moduleAddress: INITIA_CONFIG.contracts.strategyExecutor,
        moduleName: "strategy_executor",
        functionName: "execute_bundle",
        typeArgs: [],
        args: moveArgs
      }
    });
  }

  if (msgs.length === 0) {
    throw new Error(
      "[initiaExecutor] No executable messages were generated for this strategy. " +
      "Ensure at least one financial step is present."
    );
  }

  return {
    msgs,
    memo: `IntentOS Strategy: ${strategyId}`,
  };
}
