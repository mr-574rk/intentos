"use client";

import { PropsWithChildren, useEffect } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  initiaPrivyWalletConnector,
  injectStyles,
  InterwovenKitProvider,
  TESTNET,
} from "@initia/interwovenkit-react";
import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js";

const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

const queryClient = new QueryClient();

// Initia testnet chain ID — update this to match your deployed rollup/appchain
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID ?? "interwoven-1";

const customLocalChain = {
  chain_id: CHAIN_ID,
  chain_name: "intentos-local",
  pretty_name: "IntentOS Local Rollup",
  network_type: "testnet",
  bech32_prefix: "init",
  fees: {
    fee_tokens: [{ denom: "uintos", fixed_min_gas_price: 0.15 }],
  },
  apis: {
    rpc: [{ address: "http://localhost:26657" }],
    rest: [{ address: "http://localhost:1317" }],
    indexer: [{ address: "http://localhost:6767" }],
  },
};

export default function Providers({ children }: PropsWithChildren) {
  useEffect(() => {
    injectStyles(InterwovenKitStyles);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <InterwovenKitProvider 
          {...TESTNET}
          defaultChainId={CHAIN_ID}
          customChain={customLocalChain as any}
        >
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
