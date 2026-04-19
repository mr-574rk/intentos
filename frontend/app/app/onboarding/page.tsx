"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useAccount } from "wagmi";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IntentOSLogo } from "@/components/IntentOSLogo";
import { CheckCircle2, Copy, ExternalLink, RefreshCw, Loader2, Droplets } from "lucide-react";
import { API_URL, API_HEADERS, FAUCET_URL } from "@/lib/config";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALES, Locale } from "@/lib/i18n";

const BALANCE_POLL_INTERVAL_MS = 3_000;

type OnboardingState = "language" | "connect" | "checking" | "faucet" | "ready" | "redirecting";

export default function OnboardingPage() {
  const { address: kitAddress, openConnect } = useInterwovenKit();
  const { address: wagmiAddress } = useAccount();
  const { locale, setLocale, t } = useLocale();

  // Combine addresses from both sources
  const address = kitAddress || wagmiAddress;
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<OnboardingState>("language");
  const [resolvedAddress, setResolvedAddress] = useState<string>("");
  const [initBalance, setInitBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const fetchBalance = useCallback(async (addr: string): Promise<number> => {
    try {
      const res = await fetch(`${API_URL}/api/portfolio/${addr}?t=${Date.now()}`, { headers: API_HEADERS, cache: 'no-store' });
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
    if (pollRef.current) return;
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

  // ── Core: react to address from InterwovenKit ───────────────────────────
  // This useEffect fires when the address changes — which happens after the
  // user connects via CustomWalletModal (wagmi connect → kit updates address).
  // This is the ONLY trigger for the balance check flow.

  useEffect(() => {
    if (!mounted) return;

    if (!address) {
      // Disconnected or not yet connected
      if (state !== "connect" && state !== "language") {
        setState("language");
        stopPolling();
        setInitBalance(null);
        setResolvedAddress("");
      }
      return;
    }

    // Address appeared or changed — run balance check
    if (address !== resolvedAddress) {
      setResolvedAddress(address);
      setState("checking");
      stopPolling();
      
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
    }

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, address, resolvedAddress]);

  // ── Manual actions ──────────────────────────────────────────────────────

  const handleManualRefresh = async () => {
    const addr = resolvedAddress || address;
    if (!addr) return;
    setPolling(true);
    const balance = await fetchBalance(addr);
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
    const addr = resolvedAddress || address;
    if (!addr) return;
    navigator.clipboard.writeText(addr).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] bg-[#0D0F14] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00F5D4]/20 border-t-[#00F5D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0D0F14] flex flex-col items-center justify-center px-4 relative overflow-hidden">

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

            {/* ── State: language ───────────────────────────────── */}
            {state === "language" && (
              <motion.div
                key="language"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex flex-col items-center"
              >
                <h1 className="text-[26px] font-black tracking-tight text-white text-center mt-5">
                  {t("select_language")}
                </h1>
                <div className="w-full mt-8 mb-5 space-y-2">
                  {LOCALES.map((l) => (
                    <motion.button
                      key={l.code}
                      onClick={() => {
                        setLocale(l.code as Locale);
                        setState("connect");
                      }}
                      className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00F5D4]/40 hover:bg-[#00F5D4]/5 transition-all outline-none focus:outline-none"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <span className="text-lg font-medium text-white">{l.label}</span>
                      <span className="text-xl">{l.flag}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

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
                  {t("initialize_workspace")}
                </h1>
                <p className="text-sm text-gray-400 text-center mt-3 mb-10 px-2 leading-relaxed">
                  {t("initialize_desc")}
                </p>
                <motion.button
                  id="onboarding-connect-btn"
                  onClick={openConnect}
                  className="w-full bg-[#00F5D4] text-gray-900 font-bold text-[15px] tracking-wider rounded-full py-4 transition-all hover:bg-[#00E5C4] hover:shadow-[0_0_24px_rgba(0,245,212,0.4)]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t("connect_wallet")}
                </motion.button>
                <p className="text-xs text-gray-500 mt-6 text-center font-medium tracking-wide">
                  {t("powered_by")}
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
                <p className="text-sm font-semibold text-white">{t("verifying_balance")}</p>
                <p className="text-xs text-gray-500 text-center">{t("checking_moment")}</p>
              </motion.div>
            )}

            {/* ── State: faucet — zero balance ─────────────────── */}
            {state === "faucet" && (
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

                <h2 className="text-xl font-black text-white text-center mb-1">{t("claim_init")}</h2>
                <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed px-2">
                  {t("claim_desc")}
                </p>

                {/* Wallet address display */}
                <div
                  className="w-full rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <p className="text-xs font-mono text-[#00F5D4] truncate flex-1">
                    {resolvedAddress || address || "Connecting…"}
                  </p>
                  <button
                    onClick={handleCopy}
                    disabled={!resolvedAddress && !address}
                    className="flex-shrink-0 text-gray-500 hover:text-[#00F5D4] transition-colors disabled:opacity-30"
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
                  {t("open_faucet")}
                </a>

                {/* Polling indicator */}
                <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
                  {polling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00F5D4]/60" />
                      <span>Auto-detecting balance every {BALANCE_POLL_INTERVAL_MS / 1000}s…</span>
                    </>
                  ) : (
                    <span>Balance: {initBalance !== null ? `${initBalance.toFixed(4)} INIT` : "Not yet checked"}</span>
                  )}
                  <button
                    onClick={handleManualRefresh}
                    disabled={polling}
                    className="ml-1 text-[#00F5D4]/60 hover:text-[#00F5D4] disabled:opacity-40 transition-colors"
                    title="Check now"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Escape hatch */}
                <button
                  onClick={() => {
                    setState("redirecting");
                    router.replace("/app/intent");
                  }}
                  className="mt-3 text-xs text-gray-600 hover:text-gray-400 transition-colors underline underline-offset-2"
                >
                  {t("skip_faucet")}
                </button>
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
                  {initBalance !== null ? `${initBalance.toFixed(2)} INIT` : t("wallet_funded")}
                </p>
                <p className="text-xs text-gray-500 text-center animate-pulse">
                  {t("entering_workspace")}
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
