/**
 * Initia Network Configuration
 * Override via environment variables for testnet/mainnet deployment.
 *
 * To find real testnet addresses:
 *   - REST: GET {INITIA_REST}/initia/move/v1/accounts/{addr}/modules
 *   - DEX pairs: GET {INITIA_REST}/minitia/dex/v1/pairs
 */
export const INITIA_CONFIG = {
  rpc:       process.env.INITIA_RPC  || "http://localhost:26657",
  rest:      process.env.INITIA_REST || "http://localhost:1317",
  chainId:   process.env.CHAIN_ID    || "intentos-1",
  chainName: "IntentOS Local Rollup",
  denom:        "uintos",
  displayDenom: "UINTOS",
  decimals: 6,

  // InterwovenKit session-key endpoint
  interwovenKitEndpoint:
    process.env.INTERWOVENKIT_ENDPOINT || "https://connect.wallet.initia.xyz",

  // Deployed contract addresses (intentos:: namespace).
  // These MUST be different addresses post-deployment.
  // Replace with real deployed addresses from `initiad move deploy`.
  contracts: {
    strategyExecutor:  process.env.CONTRACT_STRATEGY_EXECUTOR  || "0x0000000000000000000000000000000000000001",
    permissionManager: process.env.CONTRACT_PERMISSION_MANAGER || "0x0000000000000000000000000000000000000002",
  },

  // DEX pair object addresses — these are Object<dex::Config> addresses.
  // Passed as step_pair_addrs in initiaExecutor.ts for swap/liquidity steps.
  // To resolve: query GET {INITIA_REST}/minitia/dex/v1/pairs and find the
  // liquidity_token address matching your coin pair; that is the pair object address.
  pools: {
    // INIT/USDC pair object address on Initia testnet
    initUsdc: process.env.POOL_INIT_USDC || "0x0000000000000000000000000000000000000010",
    // INIT/ETH pair object address on Initia testnet
    initEth:  process.env.POOL_INIT_ETH  || "0x0000000000000000000000000000000000000011",
  },

  // Default validator for stake actions.
  // Replace with a real initvaloper... bech32 address from your testnet.
  defaultValidator:
    process.env.DEFAULT_VALIDATOR || "initvaloper1qyqa2mdel5vmre7uwn7rft7n076qahg46y9zus",

  // ── Action Enum Constants ──────────────────────────────────────────────────
  // Must stay in sync with StrategyExecutor.move ACTION_* constants.
  // TypeScript uses these to build the step_actions: vector<u8> ABI arg.
  actions: {
    SWAP:              1 as const,
    TRANSFER:         2 as const,
    BATCH_TRANSFER:   3 as const,
    STAKE:            4 as const,
    PROVIDE_LIQUIDITY:5 as const,
    LEND:             6 as const,
  },
} as const;

export type InitiaConfig = typeof INITIA_CONFIG;

/** Map from strategy step action string → u8 enum value */
export function actionStringToEnum(action: string): number {
  const map: Record<string, number> = {
    swap:               INITIA_CONFIG.actions.SWAP,
    transfer:           INITIA_CONFIG.actions.TRANSFER,
    batch_transfer:     INITIA_CONFIG.actions.BATCH_TRANSFER,
    stake:              INITIA_CONFIG.actions.STAKE,
    stake_lp:           INITIA_CONFIG.actions.STAKE,   // stake_lp maps to STAKE
    provide_liquidity:  INITIA_CONFIG.actions.PROVIDE_LIQUIDITY,
    single_asset_provide_liquidity: INITIA_CONFIG.actions.PROVIDE_LIQUIDITY,
    lend:               INITIA_CONFIG.actions.LEND,
    leverage_lend:      INITIA_CONFIG.actions.LEND,
    // yield / portfolio strategies that expand to sub-actions
    swap_all:           INITIA_CONFIG.actions.SWAP,
    dca_buy:            INITIA_CONFIG.actions.SWAP,
    split_allocation:   INITIA_CONFIG.actions.PROVIDE_LIQUIDITY,
    yield_farm:         INITIA_CONFIG.actions.LEND,
    compound:           INITIA_CONFIG.actions.STAKE,
    leverage_stake:     INITIA_CONFIG.actions.STAKE,
    leverage_long:      INITIA_CONFIG.actions.SWAP,
  };
  return map[action] ?? INITIA_CONFIG.actions.SWAP; // default to SWAP for unknown
}

/** Resolve pair address for a given from/to denom pair */
export function resolvePairAddress(fromDenom: string, toDenom: string): string {
  const key = [fromDenom.toUpperCase(), toDenom.toUpperCase()].sort().join("/");
  const pairMap: Record<string, string> = {
    "INIT/USDC": INITIA_CONFIG.pools.initUsdc,
    "ETH/INIT":  INITIA_CONFIG.pools.initEth,
    "INIT/ETH":  INITIA_CONFIG.pools.initEth,
    "USDC/INIT": INITIA_CONFIG.pools.initUsdc,
  };
  return pairMap[key] ?? INITIA_CONFIG.pools.initUsdc; // default to INIT/USDC pool
}
