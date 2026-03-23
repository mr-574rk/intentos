import type { StrategyBundle, TransactionObject } from "../../types";

/**
 * Builds an array of Initia-compatible transaction objects
 * from a strategy bundle's steps.
 */
export function buildTransactions(bundle: StrategyBundle): TransactionObject[] {
  return bundle.steps.map((step, i) => {
    const base: TransactionObject = {
      index: i + 1,
      type: `intentos/${step.action}`,
      payload: {
        action: step.action,
        from: step.from ?? null,
        to: step.to ?? null,
        protocol: step.protocol ?? "Initia",
        bundleId: bundle.id,
        stepIndex: step.index,
        description: step.description,
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
  };
  return GAS_TABLE[action] ?? 150_000;
}
