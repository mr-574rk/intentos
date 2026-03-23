import type { StrategyBundle } from "../../types";

// ── Base APY lookup ──────────────────────────────────────────
// Realistic stubs — replace with live oracle/pool data for testnet

const BASE_APY: Record<string, number> = {
  stake: 8,
  stake_lp: 12,
  leverage_stake: 22,
  provide_liquidity: 10,
  lend: 6,
  leverage_lend: 18,
  dca_buy: 5,
  split_allocation: 9,
  swap: 0,         // swaps don't yield directly
  swap_all: 0,
  leverage_long: 0, // speculative — APY from price action
  compound: 3,      // compound adds ~3% to effective APY
  yield_farm: 14,
};

const PAIR_MULTIPLIERS: Record<string, number> = {
  "INIT/USDC": 1.0,
  "INIT/ETH": 1.5,   // more volatile = more fees
  "USDC/USDT": 0.7,  // stable pair = less fees
};

// ── Estimator ────────────────────────────────────────────────

export function estimateYield(bundle: StrategyBundle): number {
  let totalAPY = 0;
  const stepCount = bundle.steps.length;

  for (const step of bundle.steps) {
    let stepAPY = BASE_APY[step.action] ?? 5;

    // Apply pair multiplier if applicable
    if (step.from && step.to) {
      const pairKey = `${step.from}/${step.to}`;
      const revKey = `${step.to}/${step.from}`;
      const multiplier = PAIR_MULTIPLIERS[pairKey] ?? PAIR_MULTIPLIERS[revKey] ?? 1.0;
      stepAPY *= multiplier;
    }

    totalAPY += stepAPY;
  }

  // Average across steps (each step contributes proportionally)
  const averageAPY = totalAPY / stepCount;

  // Apply diversification bonus for multi-step strategies
  const diversificationBonus = stepCount > 2 ? 2 : 0;

  // Clamp within realistic bounds [2%, 60%]
  return Math.min(60, Math.max(2, Math.round(averageAPY + diversificationBonus)));
}
