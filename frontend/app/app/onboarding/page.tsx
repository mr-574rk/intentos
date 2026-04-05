"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IntentOSLogo } from "@/components/IntentOSLogo";
import CustomWalletModal from "@/components/CustomWalletModal";
import { CheckCircle2, Copy, ExternalLink, RefreshCw, Loader2, Droplets } from "lucide-react";
import { API_URL, API_HEADERS, FAUCET_URL } from "@/lib/config";

const BALANCE_POLL_INTERVAL_MS = 5_000;

type OnboardingState = "connect" | "checking" | "faucet" | "ready" | "redirecting";

export default function OnboardingPage() {
  const { address } = useInterwovenKit();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [state, setState] = useState<OnboardingState>("connect");
  const [initBalance, setInitBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchBalance = useCallback(async (addr: string): Promise<number> => {
    try {
      const res = await fetch(`${API_URL}/api/portfolio/${addr}`, { headers: API_HEADERS });
      const json = await res.json();
      const initAsset = json.wallet?.find((a: { symbol: string }) => a.symbol === "INIT");
      return initAsset?.balance ?? 0;
    } catch {
      return 0;
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }, []);

  const startPolling = useCallback((addr: string) => {
    if (pollRef.current) return; // already polling
    setPolling(true);
    pollRef.current = setInterval(async () => {
      const balance = await fetchBalance(addr);
      setInitBalance(balance);
      if (balance > 0) {
        stopPolling();
        setState("ready");
        setTimeout(() => {
          setState("redirecting");
          router.replace("/app/intent");
        }, 1800);
      }
    }, BALANCE_POLL_INTERVAL_MS);
  }, [fetchBalance, stopPolling, router]);

  // When wallet connects, check balance immediately
  useEffect(() => {
    if (!address) {
      setState("connect");
      stopPolling();
      setInitBalance(null);
      return;
    }

    setState("checking");
    fetchBalance(address).then((balance) => {
      setInitBalance(balance);
      if (balance > 0) {
        setState("ready");
        setTimeout(() => {
          setState("redirecting");
          router.replace("/app/intent");
        }, 1200);
      } else {
        setState("faucet");
        startPolling(address);
      }
    });

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const handleManualRefresh = async () => {
    if (!address) return;
    setPolling(true);
    const balance = await fetchBalance(address);
    setInitBalance(balance);
    setPolling(false);
    if (balance > 0) {
      stopPolling();
      setState("ready");
      setTimeout(() => {
        setState("redirecting");
        router.replace("/app/intent");
      }, 1200);
    }
  };

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] bg-[#0D0F14] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00F5D4]/20 border-t-[#00F5D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0D0F14] flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Custom Wallet Gateway Modal */}
      <CustomWalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-[#00F5D4] rounded-full blur-[140px] opacity-[0.06]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md w-full"
      >
        <div className="bg-[#13161D]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 shadow-[0_24px_60px_rgba(0,0,0,0.6)] flex flex-col items-center">

          <div className="flex justify-center w-full mb-2">
            <IntentOSLogo className="scale-125 pointer-events-none" />
          </div>

          <AnimatePresence mode="wait">

            {/* ── State: connect ────────────────────────────────── */}
            {state === "connect" && (
              <motion.div
                key="connect"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center"
              >
                <h1 className="text-[26px] font-black tracking-tight text-white text-center mt-5">
                  Initialize Workspace
                </h1>
                <p className="text-sm text-gray-400 text-center mt-3 mb-10 px-2 leading-relaxed">
                  Securely connect your Initia wallet to deploy autonomous strategies.
                </p>
                <motion.button
                  id="onboarding-connect-btn"
                  onClick={() => setWalletModalOpen(true)}
                  className="w-full bg-[#00F5D4] text-gray-900 font-bold text-[15px] tracking-wider rounded-full py-4 transition-all hover:bg-[#00E5C4] hover:shadow-[0_0_24px_rgba(0,245,212,0.4)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  CONNECT WALLET
                </motion.button>
                <p className="text-xs text-gray-500 mt-6 text-center font-medium tracking-wide">
                  Powered by Initia InterwovenKit
                </p>
              </motion.div>
            )}

            {/* ── State: checking balance ───────────────────────── */}
            {state === "checking" && (
              <motion.div
                key="checking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center mt-8 gap-4"
              >
                <Loader2 className="w-10 h-10 text-[#00F5D4] animate-spin" />
                <p className="text-sm font-semibold text-white">Checking wallet balance…</p>
                <p className="text-xs text-gray-500 text-center">Verifying INIT balance before proceeding.</p>
              </motion.div>
            )}

            {/* ── State: faucet — zero balance ─────────────────── */}
            {state === "faucet" && address && (
              <motion.div
                key="faucet"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center mt-6"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.2)" }}
                >
                  <Droplets className="w-7 h-7 text-[#00F5D4]" />
                </div>

                <h2 className="text-xl font-black text-white text-center mb-1">Claim Testnet INIT</h2>
                <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed px-2">
                  Your wallet has no INIT balance. You need testnet INIT to pay for gas and execute strategies.
                  Visit the faucet, paste your address, then return here — we'll detect your balance automatically.
                </p>

                {/* Wallet address display */}
                <div
                  className="w-full rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-xs font-mono text-[#00F5D4] truncate flex-1">{address}</p>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 text-gray-500 hover:text-[#00F5D4] transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-[#00F5D4]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Faucet CTA */}
                <a
                  href={FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#00F5D4] text-gray-900 font-bold text-[14px] tracking-wider rounded-full py-3.5 text-center hover:bg-[#00E5C4] hover:shadow-[0_0_24px_rgba(0,245,212,0.35)] transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Initia Faucet
                </a>

                {/* Polling indicator */}
                <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
                  {polling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00F5D4]/60" />
                      <span>Checking balance every {BALANCE_POLL_INTERVAL_MS / 1000}s…</span>
                    </>
                  ) : (
                    <span>Balance: {initBalance !== null ? `${initBalance.toFixed(4)} INIT` : "—"}</span>
                  )}
                  <button
                    onClick={handleManualRefresh}
                    disabled={polling}
                    className="ml-1 text-[#00F5D4]/60 hover:text-[#00F5D4] disabled:opacity-40 transition-colors"
                    title="Refresh balance"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── State: ready ──────────────────────────────────── */}
            {(state === "ready" || state === "redirecting") && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center mt-8 gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,245,212,0.12)", border: "1px solid rgba(0,245,212,0.3)" }}
                >
                  <CheckCircle2 className="w-7 h-7 text-[#00F5D4]" />
                </motion.div>
                <p className="text-lg font-black text-white">
                  {initBalance !== null ? `${initBalance.toFixed(2)} INIT detected` : "Wallet funded!"}
                </p>
                <p className="text-xs text-gray-500 text-center animate-pulse">
                  Entering your workspace…
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
