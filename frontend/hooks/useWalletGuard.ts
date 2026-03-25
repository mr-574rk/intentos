"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInterwovenKit } from "@initia/interwovenkit-react";

/**
 * Guards a page — redirects to /onboarding if wallet is not connected.
 * Call this at the top of every /app/* page.
 */
export function useWalletGuard() {
  const { address } = useInterwovenKit();
  const router = useRouter();

  useEffect(() => {
    if (!address) {
      router.replace("/onboarding");
    }
  }, [address, router]);

  return { address, isConnected: !!address };
}
