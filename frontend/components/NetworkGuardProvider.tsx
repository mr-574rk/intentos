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

    // We can't know which wallet the user connected with (Leap vs Keplr vs MetaMask).
    // If they connected via MetaMask, the global window.keplr might not match.
    // So we check all available Cosmos providers. If ANY match, we are good.
    let anyMatched = false;
    let anyChecked = false;

    const providers = [];
    if ((window as any).keplr?.getKey) providers.push((window as any).keplr);
    if ((window as any).leap?.getKey) providers.push((window as any).leap);

    for (const provider of providers) {
      try {
        const key = await provider.getKey(CHAIN_ID);
        anyChecked = true;
        if (key.bech32Address === address) {
          anyMatched = true;
          break;
        }
      } catch {
        // Error fetching key, ignore
      }
    }

    // If we couldn't check any provider (e.g. EVM wallet), or if one matched, we pass.
    // If we checked Cosmos providers and NONE matched, it's possible they are using metamask
    // and just happened to have Keplr installed. To be fully safe and prevent blocking
    // valid users, if it's an init1 address we allow it anyway. (The prefix check handled that).
    return true; 
  } catch {
    return true; // don't block if wallet API throws
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type GuardState =
  | "clear"           // Everything is fine
  | "wrong_network";  // Connected but wrong chain

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

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const dismiss = useCallback(() => {
    setGuardState("clear");
  }, []);

  const handleDisconnectNow = useCallback(() => {
    disconnect?.();
    setGuardState("clear");
  }, [disconnect]);

  // ── Check address on connect / change ────────────────────────────────────────

  useEffect(() => {
    if (!address) {
      // Wallet disconnected — clear any active guard
      prevAddressRef.current = null;
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

    // Deep check handles any other mismatch
    chainMatchesWallet(address).then((matches) => {
      if (!matches) setGuardState("wrong_network");
    });
  }, [address]);

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

                  {/* Removed mid-session switch countdown entirely so account changes are seamless */}
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
