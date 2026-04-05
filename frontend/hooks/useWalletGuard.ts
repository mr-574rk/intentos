"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInterwovenKit } from "@initia/interwovenkit-react";

/**
 * Guards a page — redirects to /onboarding if wallet is not connected.
 * Call this at the top of every /app/* page.
 */
export function useWalletGuard(): {
  address: string | undefined;
  isConnected: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestTx: any;
  username: string | undefined;
} {
  const kit = useInterwovenKit();
  const address = kit.address;
  const router = useRouter();

  useEffect(() => {
    if (!address) {
      router.replace("/app/onboarding");
    }
  }, [address, router]);

  return { address, isConnected: !!address, requestTx: kit.requestTxSync, username: kit.username };
}
