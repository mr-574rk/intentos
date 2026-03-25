/**
 * Initia Network Configuration
 * Override via environment variables for testnet/mainnet deployment.
 */
export const INITIA_CONFIG = {
  rpc: process.env.INITIA_RPC || "http://localhost:26657",
  rest: process.env.INITIA_REST || "http://localhost:1317",
  chainId: process.env.CHAIN_ID || "intentos-1",
  chainName: "IntentOS Local Rollup",
  denom: "uintos",
  displayDenom: "UINTOS",
  decimals: 6,

  // InterwovenKit
  interwovenKitEndpoint: process.env.INTERWOVENKIT_ENDPOINT || "https://connect.wallet.initia.xyz",

  // Known contract addresses
  contracts: {
    strategyExecutor: process.env.CONTRACT_STRATEGY_EXECUTOR || "0x3dd7b889be628c573c8a46b0f7657ae8483ebec3",
    permissionManager: process.env.CONTRACT_PERMISSION_MANAGER || "0x3dd7b889be628c573c8a46b0f7657ae8483ebec3",
  },

  // Known protocol pools (used by simulation engine)
  pools: {
    initUsdc: "init1pool_init_usdc_placeholder",
    initEth: "init1pool_init_eth_placeholder",
  },
} as const;

export type InitiaConfig = typeof INITIA_CONFIG;
