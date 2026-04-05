import type { StrategyBundle, TransactionObject } from "../../types";
import { EXECUTABLE_ACTIONS, AMOUNT_REQUIRED_ACTIONS } from "../../types";

/**
 * Builds an array of Initia-compatible transaction objects from a strategy bundle's steps.
 *
 * Security invariants (defense-in-depth):
 *  1. Fail-closed allowlist: only actions in EXECUTABLE_ACTIONS are accepted.
 *     Unknown / control-plane actions (e.g. autopilot_enable) throw immediately.
 *  2. Amount validation: actions that require a spend amount must have a
 *     positive, finite, non-zero amount field. Defaults and coercions are forbidden.
 */
export function buildTransactions(bundle: StrategyBundle): TransactionObject[] {
  return bundle.steps.map((step, i) => {
    const action = String(step.action ?? "").toLowerCase();

    // ── Allowlist check ────────────────────────────────────────────────────
    if (!EXECUTABLE_ACTIONS.has(action)) {
      throw new Error(
        `[transactionBuilder] Unsupported action "${step.action}" in bundle step ${i + 1}. ` +
        `Only executable DeFi actions are allowed in transaction bundles. ` +
        `Control-plane actions (autopilot, system commands) must not reach this layer.`
      );
    }

    // ── Amount validation ─────────────────────────────────────────────────
    if (AMOUNT_REQUIRED_ACTIONS.has(action)) {
      const raw = step.amount;
      if (raw === undefined || raw === null) {
        throw new Error(
          `[transactionBuilder] Action "${action}" requires an explicit amount, ` +
          `but step ${i + 1} has no amount field. Zero and missing amounts are forbidden.`
        );
      }
      const n = typeof raw === "number" ? raw : parseFloat(String(raw));
      if (!isFinite(n) || n <= 0) {
        throw new Error(
          `[transactionBuilder] Action "${action}" requires a positive finite amount, ` +
          `got "${raw}" in step ${i + 1}. Zero, negative, and non-numeric amounts are forbidden.`
        );
      }
    }

    const base: TransactionObject = {
      index: i + 1,
      type: `intentos/${step.action}`,
      payload: {
        action: step.action,
        from: step.from ?? "USDC",
        to: step.to ?? step.recipient ?? "INIT",
        amount: step.amount,
        protocol: step.protocol ?? "Initia",
        bundleId: bundle.id,
        stepIndex: step.index,
        description: step.description,
        slippageBps: step.slippageBps,
      },
      estimatedGas: estimateGas(step.action),
    };
    return base;
  });
}

function estimateGas(action: string): number {
  const GAS_TABLE: Record<string, number> = {
    swap: 150_000,
    swap_all: 150_000,
    provide_liquidity: 200_000,
    stake: 120_000,
    stake_lp: 180_000,
    lend: 130_000,
    leverage_stake: 250_000,
    leverage_long: 300_000,
    leverage_lend: 280_000,
    compound: 100_000,
    dca_buy: 120_000,
    split_allocation: 80_000,
    yield_farm: 220_000,
    transfer: 80_000,
    batch_transfer: 80_000,
    unstake: 120_000,
    undelegate: 120_000,
    unbond: 120_000,
    claim_rewards: 90_000,
    claim: 90_000,
    withdraw_rewards: 90_000,
  };
  return GAS_TABLE[action] ?? 150_000;
}
