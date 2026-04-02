/**
 * Initia Network Configuration
 * Controls which network (testnet / mainnet) all SDK calls target.
 *
 * Set INITIA_NETWORK in .env:
 *   INITIA_NETWORK=testnet   → https://lcd.testnet.initia.xyz (default)
 *   INITIA_NETWORK=mainnet   → https://lcd.initia.xyz
 *
 * You can also override individual URLs directly:
 *   INITIA_RPC, INITIA_REST
 */

const network = (process.env.INITIA_NETWORK ?? "testnet").toLowerCase();

const NETWORKS: Record<string, { lcd: string; rpc: string; chainId: string; explorerBase: string }> = {
  testnet: {
    lcd:         "https://lcd.testnet.initia.xyz",
    rpc:         "https://rpc.testnet.initia.xyz",
    chainId:     "initiation-2",
    explorerBase: "https://scan.testnet.initia.xyz/initiation-2",
  },
  mainnet: {
    lcd:         "https://lcd.initia.xyz",
    rpc:         "https://rpc.initia.xyz",
    chainId:     "intiation-1",
    explorerBase: "https://scan.initia.xyz",
  },
};

const preset = NETWORKS[network] ?? NETWORKS.testnet;

export const NETWORK_CONFIG = {
  network,
  /** Cosmos REST / LCD base URL */
  lcd:  process.env.INITIA_REST ?? preset.lcd,
  /** Tendermint RPC base URL */
  rpc:  process.env.INITIA_RPC  ?? preset.rpc,
  chainId:     process.env.CHAIN_ID ?? preset.chainId,
  explorerBase: preset.explorerBase,
  isTestnet: network === "testnet",
  isMainnet: network === "mainnet",
} as const;

export type NetworkConfig = typeof NETWORK_CONFIG;
