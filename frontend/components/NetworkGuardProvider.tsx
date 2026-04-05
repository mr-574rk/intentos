"use client";

/**
 * NetworkGuardProvider
 *
 * Mounts system-wide. Detects two scenarios:
 *
 * 1. WRONG CHAIN ON CONNECT — wallet is connected but the address doesn't
 *    belong to the expected Initia network (address must start with "init1").
 *    Shows a blocking modal telling the user how to switch.
 *
 * 2. MID-SESSION CHAIN SWITCH — user switches chains/accounts while already
 *    using the app (keplr_keystorechange / leap_keystorechange / wagmi chain
 *    change events). Gives a 4-second warning then auto-disconnects.
 *
 * Mount this once, inside the InterwovenKit provider, wrapping all app pages.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ExternalLink, LogOut, RefreshCw } from "lucide-react";
import { CHAIN_ID } from "@/lib/config";

// ── Network validation ────────────────────────────────────────────────────────

/**
 * Initia addresses always start with "init1".
 * Returns true when the address belongs to an Initia chain.
 */
function isInitiaAddress(address: string): boolean {
  return address.startsWith("init1");
}

/**
 * Best-effort check: ask Keplr/Leap if the key they have for our CHAIN_ID
 * matches the currently connected address. Non-blocking — returns true on error.
 */
async function chainMatchesWallet(address: string): Promise<boolean> {
  try {
    if (typeof window === "undefined") return true;
    const provider =
      (window as unknown as Record<string, { getKey?: (c: string) => Promise<{ bech32Address: string }> }>)
        .keplr ?? 
      (window as unknown as Record<string, { getKey?: (c: string) => Promise<{ bech32Address: string }> }>)
        .leap;
    if (!provider?.getKey) return true;
    const key = await provider.getKey(CHAIN_ID);
    return key.bech32Address === address;
  } catch {
    return true; // don't block if wallet API throws
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type GuardState =
  | "clear"           // Everything is fine
  | "wrong_network"   // Connected but wrong chain
  | "switching";      // Mid-session chain switch detected — countdown to logout

// ── Component ─────────────────────────────────────────────────────────────────

export default function NetworkGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { address, disconnect } = useInterwovenKit();
  const [guardState, setGuardState] = useState<GuardState>("clear");
  const [countdown, setCountdown] = useState(4);
  const prevAddressRef = useRef<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const clearTimers = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (logoutRef.current) clearTimeout(logoutRef.current);
  }, []);

  const startSwitchCountdown = useCallback(() => {
    clearTimers();
    setCountdown(4);
    setGuardState("switching");

    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearTimers();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    logoutRef.current = setTimeout(() => {
      disconnect?.();
      setGuardState("clear");
    }, 4000);
  }, [clearTimers, disconnect]);

  const dismiss = useCallback(() => {
    clearTimers();
    setGuardState("clear");
  }, [clearTimers]);

  const handleDisconnectNow = useCallback(() => {
    clearTimers();
    disconnect?.();
    setGuardState("clear");
  }, [clearTimers, disconnect]);

  // ── Check address on connect / change ────────────────────────────────────────

  useEffect(() => {
    if (!address) {
      // Wallet disconnected — clear any active guard
      prevAddressRef.current = null;
      clearTimers();
      setGuardState("clear");
      return;
    }

    const prev = prevAddressRef.current;
    prevAddressRef.current = address;

    // ── 1. Address prefix check (catches MetaMask / wrong-chain Cosmos wallets)
    if (!isInitiaAddress(address)) {
      setGuardState("wrong_network");
      return;
    }

    // ── 2. Mid-session switch: address changed while already signed in
    if (prev !== null && prev !== address) {
      startSwitchCountdown();
      return;
    }

    // ── 3. Deep check: verify wallet key matches expected chain (async)
    chainMatchesWallet(address).then((matches) => {
      if (!matches) setGuardState("wrong_network");
    });
  }, [address, startSwitchCountdown, clearTimers]);

  // ── Listen for keystore/chain change events from Cosmos wallets ──────────────

  useEffect(() => {
    const onKeystoreChange = () => {
      // Only trigger if we're currently signed in
      if (!prevAddressRef.current) return;
      startSwitchCountdown();
    };

    window.addEventListener("keplr_keystorechange", onKeystoreChange);
    window.addEventListener("leap_keystorechange", onKeystoreChange);

    return () => {
      window.removeEventListener("keplr_keystorechange", onKeystoreChange);
      window.removeEventListener("leap_keystorechange", onKeystoreChange);
    };
  }, [startSwitchCountdown]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────

  useEffect(() => () => clearTimers(), [clearTimers]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {children}

      <AnimatePresence>
        {guardState !== "clear" && (
          <>
            {/* Backdrop */}
            <motion.div
              key="ng-backdrop"
              className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal */}
            <motion.div
              key="ng-modal"
              className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-sm pointer-events-auto rounded-3xl overflow-hidden"
                initial={{ scale: 0.92, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                style={{
                  background: "rgba(13,15,20,0.97)",
                  backdropFilter: "blur(24px)",
                  border: "1px solid rgba(251,146,60,0.3)",
                  boxShadow: "0 0 60px rgba(251,146,60,0.08), 0 32px 64px rgba(0,0,0,0.7)",
                }}
              >
                {/* Header glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-16 bg-orange-500/20 blur-[48px] rounded-full pointer-events-none" />

                <div className="relative p-8 space-y-5">
                  {/* Icon + close */}
                  <div className="flex items-start justify-between">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full animate-pulse blur-[14px]" style={{ background: "rgba(251,146,60,0.4)" }} />
                      <div className="relative w-12 h-12 rounded-full flex items-center justify-center border border-orange-500/30 bg-orange-500/10">
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                      </div>
                    </div>

                    {/* Only show X on wrong_network, not while countdown is live */}
                    {guardState === "wrong_network" && (
                      <button
                        onClick={dismiss}
                        className="p-2 rounded-full text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* ── Wrong network ── */}
                  {guardState === "wrong_network" && (
                    <>
                      <div>
                        <h2 className="text-lg font-black text-white tracking-tight mb-1">
                          Wrong Network
                        </h2>
                        <p className="text-sm text-white/60 leading-relaxed">
                          IntentOS runs on{" "}
                          <span className="font-bold text-orange-400">
                            Initia {CHAIN_ID === "initiation-2" ? "Testnet" : "Mainnet"} ({CHAIN_ID})
                          </span>
                          . Your wallet is connected to a different chain.
                        </p>
                      </div>

                      <div
                        className="rounded-2xl p-4 space-y-2.5 text-sm"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        <p className="font-semibold text-white/80 text-xs uppercase tracking-widest">
                          How to switch
                        </p>
                        {CHAIN_ID === "initiation-2" ? (
                          <>
                            <Step n={1}>Open Keplr or Leap wallet</Step>
                            <Step n={2}>Switch to <b>Initia Testnet (initiation-2)</b></Step>
                            <Step n={3}>Return here — we&apos;ll detect it automatically</Step>
                          </>
                        ) : (
                          <>
                            <Step n={1}>Open Keplr or Leap wallet</Step>
                            <Step n={2}>Switch to <b>Initia ({CHAIN_ID})</b></Step>
                            <Step n={3}>Return here — we&apos;ll detect it automatically</Step>
                          </>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <a
                          href="https://wallet.keplr.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-sm font-bold border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all"
                        >
                          Open Keplr <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={handleDisconnectNow}
                          className="flex-1 py-3 rounded-full text-sm font-bold text-orange-400 border border-orange-500/30 bg-orange-500/8 hover:bg-orange-500/15 transition-all flex items-center justify-center gap-1.5"
                        >
                          Disconnect <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* ── Mid-session switch countdown ── */}
                  {guardState === "switching" && (
                    <>
                      <div>
                        <h2 className="text-lg font-black text-white tracking-tight mb-1">
                          Network Switch Detected
                        </h2>
                        <p className="text-sm text-white/60 leading-relaxed">
                          Your wallet changed chains or accounts while you were signed in. For
                          your security, you will be signed out automatically.
                        </p>
                      </div>

                      {/* Countdown ring */}
                      <div className="flex flex-col items-center gap-3 py-2">
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                            <motion.circle
                              cx="32" cy="32" r="28"
                              fill="none"
                              stroke="#FB923C"
                              strokeWidth="5"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 28}
                              animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - countdown / 4) }}
                              transition={{ duration: 0.8, ease: "linear" }}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xl font-black text-white">
                            {countdown}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 text-center">
                          Signing you out in {countdown}s…
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={dismiss}
                          className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-full text-sm font-bold border border-white/10 text-white/70 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Stay signed in
                        </button>
                        <button
                          onClick={handleDisconnectNow}
                          className="flex-1 py-3 rounded-full text-sm font-bold text-orange-400 border border-orange-500/30 bg-orange-500/8 hover:bg-orange-500/15 transition-all flex items-center justify-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign out now
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Small helper ──────────────────────────────────────────────────────────────
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-5 h-5 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[10px] font-black text-orange-400 flex-shrink-0 mt-0.5">
        {n}
      </span>
      <span className="text-white/60 text-xs leading-relaxed">{children}</span>
    </div>
  );
}
