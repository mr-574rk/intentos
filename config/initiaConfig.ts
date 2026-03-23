/**
 * Initia Network Configuration
 * Override via environment variables for testnet/mainnet deployment.
 */
export const INITIA_CONFIG = {
  rpc: process.env.INITIA_RPC || "https://rpc.testnet.initia.xyz",
  rest: process.env.INITIA_REST || "https://lcd.testnet.initia.xyz",
  chainId: process.env.CHAIN_ID || "initiation-2",
  chainName: "Initia Testnet",
  denom: "uinit",
  displayDenom: "INIT",
  decimals: 6,

  // InterwovenKit
  interwovenKitEndpoint: process.env.INTERWOVENKIT_ENDPOINT || "https://connect.wallet.initia.xyz",

  // Known contract addresses (deploy and update here)
  contracts: {
    strategyExecutor: process.env.CONTRACT_STRATEGY_EXECUTOR || "init1strategy_executor_placeholder",
    permissionManager: process.env.CONTRACT_PERMISSION_MANAGER || "init1permission_manager_placeholder",
  },

  // Known protocol pools (used by simulation engine)
  pools: {
    initUsdc: "init1pool_init_usdc_placeholder",
    initEth: "init1pool_init_eth_placeholder",
  },
} as const;

export type InitiaConfig = typeof INITIA_CONFIG;
