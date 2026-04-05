"use client";

import { PropsWithChildren, useEffect, useRef, useCallback } from "react";
import React from "react";
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

// Polyfill React.useEffectEvent for @initia/interwovenkit-react
// This experimental API exists in React 18 canary/experimental but may not be
// exposed via Turbopack's next/dist/compiled/react bundle.
if (typeof (React as Record<string, unknown>).useEffectEvent === "undefined") {
  (React as Record<string, unknown>).useEffectEvent = function useEffectEvent<T extends (...args: unknown[]) => unknown>(fn: T): T {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ref = { current: fn };
    ref.current = fn;
    return ((...args: unknown[]) => ref.current(...args)) as unknown as T;
  };
}

const wagmiConfig = createConfig({
  connectors: [initiaPrivyWalletConnector],
  chains: [mainnet],
  transports: { [mainnet.id]: http() },
});

const queryClient = new QueryClient();

// Initia testnet chain ID — update this to match your deployed rollup/appchain
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID ?? "initiation-2";

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
        >
          {children}
        </InterwovenKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
