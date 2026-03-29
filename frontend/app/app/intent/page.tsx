"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import IntentInput from "@/components/IntentInput";
import AgentTimeline from "@/components/AgentTimeline";
import AmbiguityModal from "@/components/AmbiguityModal";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import type {
  ApiResponse,
  Strategy,
  AgentTimeline as TimelineType,
  AmbiguityResponse,
} from "@/types";
import { API_URL, API_HEADERS } from "@/lib/config";
import {
  enableAutopilot,
  disableAutopilot,
  getActiveStrategyLabels,
} from "@/lib/autopilotState";

// ── Detect goal-based (no explicit amount) intents ───────────────────────────
const GOAL_PATTERNS =
  /\b(grow|safe|savings|return|income|passive|earn|yield|invest|highest|steady|profit|reward|accumulat|compound|wealth|stake|swap|delegate)\b/i;
const HAS_AMOUNT = /\b\d+(\.\d+)?\b/;

// ── Portfolio API response shape (raw — no success wrapper) ───────────────────
interface PortfolioAPIData {
  wallet:        { symbol: string; balance: number; valueUSD: number }[];
  staked:        { symbol: string; balance: number; valueUSD: number }[];
  rewards:       { symbol: string; balance: number; valueUSD: number }[];
  totalValueUSD: number;
}

// ── System intents: handled inline — no backend call ─────────────────────────
type SystemResponse = {
  message: string;
  sub?:    string;
  icon:    string;
  type?:   "autopilot" | "receive";
  address?: string;
};

function getSystemResponse(text: string, address?: string): SystemResponse | null {
  const lower = text.toLowerCase().trim();

  // Autopilot enable
  if (/\b(enable|turn on|activate|start).{0,20}autopilot\b/.test(lower)) {
    const state  = enableAutopilot();
    const labels = getActiveStrategyLabels(state);
    logSystemEvent("Autopilot Enabled", text);
    return {
      icon: "🤖",
      message: "Autopilot enabled.",
      sub: labels.length
        ? `Active strategies: ${labels.join(" · ")}`
        : "No strategies configured — open Autopilot settings to configure.",
      type: "autopilot",
    };
  }
  // Autopilot disable
  if (/\b(disable|turn off|deactivate|stop).{0,20}autopilot\b/.test(lower)) {
    disableAutopilot();
    logSystemEvent("Autopilot Disabled", text);
    return {
      icon: "⏸",
      message: "Autopilot disabled.",
      sub: "All automated strategies are paused. Re-enable anytime.",
      type: "autopilot",
    };
  }
  // Receive / deposit — show wallet address
  if (/\b(receive|deposit|fund|get)\b.{0,20}\b(init|usdc|token|crypto|funds?|money|asset)\b/.test(lower)
    || /^(receive|deposit|fund|get init|get usdc)$/.test(lower)) {
    logSystemEvent("Receive Address", text);
    return {
      icon: "📥",
      message: "Your Initia wallet address",
      sub: address ?? "Connect wallet to see address",
      type: "receive",
      address,
    };
  }

  return null;
}

function logSystemEvent(label: string, raw: string) {
  try {
    const existing = JSON.parse(localStorage.getItem("intentos_system_events") ?? "[]") as object[];
    existing.unshift({ label, raw, timestamp: new Date().toISOString() });
    localStorage.setItem("intentos_system_events", JSON.stringify(existing.slice(0, 50)));
  } catch { /* ignore */ }
}

function needsDeploymentModal(text: string): boolean {
  return GOAL_PATTERNS.test(text) && !HAS_AMOUNT.test(text);
}

// ── Copy helper ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
      style={{ background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.25)", color: "#00F5D4" }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,245,212,0.18)")}
      onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,245,212,0.1)")}
    >
      {copied ? "✓ Copied!" : "Copy Address"}
    </button>
  );
}

// ── Deployment Size Modal ─────────────────────────────────────────────────────
function DeploymentModal({ onConfirm, onDismiss }: { onConfirm: (pct: number) => void; onDismiss: () => void }) {
  const [pct, setPct] = useState(50);
  const presets = [10, 25, 50, 100];
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDismiss} />
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="w-full max-w-sm pointer-events-auto p-7 space-y-5"
          initial={{ scale: 0.93, y: 18, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.93, y: 18, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          style={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px -12px rgba(0,245,212,0.1)", borderRadius: "16px" }}
          onClick={e => e.stopPropagation()}
        >
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Before we build your strategy</p>
            <h2 className="text-xl font-black text-white tracking-tight">How much do you want to deploy?</h2>
            <p className="text-sm text-text-muted">We&apos;ll use this percentage of your available balance.</p>
          </div>
          <div className="flex justify-center">
            <span className="text-6xl font-black tabular-nums" style={{ color: "#00F5D4" }}>{pct === 100 ? "All" : `${pct}%`}</span>
          </div>
          <div className="flex gap-2">
            {presets.map(p => (
              <button key={p} onClick={() => setPct(p)} className="flex-1 py-2 text-xs font-bold rounded-full transition-all duration-150"
                style={{ background: pct === p ? "#00F5D4" : "rgba(255,255,255,0.05)", color: pct === p ? "#000" : "rgba(255,255,255,0.45)", border: "1px solid", borderColor: pct === p ? "#00F5D4" : "rgba(255,255,255,0.07)" }}>
                {p === 100 ? "All in" : `${p}%`}
              </button>
            ))}
          </div>
          <input type="range" min={1} max={100} value={pct} onChange={e => setPct(Number(e.target.value))} className="w-full cursor-pointer accent-[#00F5D4]"
            style={{ appearance: "none", height: "6px", borderRadius: "999px", background: `linear-gradient(to right, #00F5D4 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`, outline: "none" }} />
          <button onClick={() => onConfirm(pct)} className="btn-primary w-full py-3.5 font-bold text-sm">
            Build Strategy with {pct === 100 ? "Full" : `${pct}%`} Deployment →
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function IntentPage() {
  const router                = useRouter();
  const searchParams          = useSearchParams();
  const { isConnected, address } = useWalletGuard();
  const [loading, setLoading]         = useState(false);
  const [validating, setValidating]   = useState(false);
  const [timeline, setTimeline]       = useState<TimelineType | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{ message: string; sub: string; action?: "receive" | "deposit" } | null>(null);
  const [ambiguity, setAmbiguity]     = useState<AmbiguityResponse | null>(null);
  const [pendingText, setPendingText] = useState<string>("");
  const [showDeploy, setShowDeploy]   = useState(false);
  const [rawText, setRawText]         = useState("");
  const [systemResponse, setSystemResponse] = useState<SystemResponse | null>(null);
  const [walletEmpty, setWalletEmpty] = useState(false);

  // Pre-fill from ?prefill= URL param
  useEffect(() => {
    const prefill = searchParams.get("prefill");
    if (prefill) {
      setRawText(decodeURIComponent(prefill));
    } else {
      sessionStorage.removeItem("intentos_strategy");
    }
  }, [searchParams]);

  // Silently fetch wallet state on mount → drive adaptive suggestion chips
  useEffect(() => {
    if (!address) return;
    fetch(`${API_URL}/api/portfolio/${address}`, { headers: API_HEADERS })
      .then(r => r.json())
      .then((json: PortfolioAPIData) => {
        // API returns raw PortfolioData (no success wrapper)
        const totalBalance = json.wallet?.reduce((s, a) => s + (a.valueUSD ?? 0), 0) ?? 0;
        setWalletEmpty(totalBalance === 0);
      })
      .catch(() => { /* ignore — keep default false */ });
  }, [address]);

  if (!isConnected) return null;

  // ── Submit to backend ──────────────────────────────────────────────────────
  const submitToApi = async (text: string) => {
    setLoading(true);
    setError(null);
    setTimeline(null);
    setAmbiguity(null);
    setPendingText(text);

    try {
      const res = await fetch(`${API_URL}/api/execute/intent`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ text }),
      });
      const data: ApiResponse<Strategy | AmbiguityResponse> = await res.json();
      if (!data.success || !data.data) throw new Error(data.error ?? "Pipeline failed");

      if ("ambiguous" in data.data && data.data.ambiguous) {
        setAmbiguity(data.data as AmbiguityResponse);
        setLoading(false);
        return;
      }

      const strategy = data.data as Strategy;
      const tlRes = await fetch(`${API_URL}/api/agent/timeline/${strategy.id}`, { headers: API_HEADERS });
      const tlData: ApiResponse<TimelineType> = await tlRes.json();
      if (tlData.success && tlData.data) setTimeline(tlData.data);

      sessionStorage.setItem("intentos_strategy", JSON.stringify(strategy));
      setTimeout(() => router.push("/app/strategy"), 800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ── Pre-flight validation — runs BEFORE any AI call ───────────────────────
  // IMPORTANT: Portfolio API returns raw PortfolioAPIData — NOT { success, data }
  const validateIntentPreflight = async (
    text: string
  ): Promise<{ message: string; sub: string; action?: "receive" | "deposit" } | null> => {
    if (!address) return null;
    try {
      const res  = await fetch(`${API_URL}/api/portfolio/${address}`, { headers: API_HEADERS });
      const json: PortfolioAPIData = await res.json();

      // Safely read from the known API shape
      const walletINIT: number     = json.wallet?.find(a => a.symbol === "INIT")?.balance ?? 0;
      const totalRewards: number   = json.rewards?.reduce((s, r) => s + r.balance, 0) ?? 0;
      const totalDelegated: number = json.staked?.reduce((s, d) => s + d.balance, 0) ?? 0;
      const totalBalance: number   = json.wallet?.reduce((s, a) => s + (a.valueUSD ?? 0), 0) ?? 0;

      // Keep walletEmpty in sync after each validation check
      setWalletEmpty(totalBalance === 0);

      const lower  = text.toLowerCase();
      const amount = parseFloat(text.match(/\b(\d+(?:\.\d+)?)\b/)?.[1] ?? "0");

      // 1. Stake / delegate: need enough INIT
      if (/\b(stake|delegate)\b/.test(lower)) {
        if (amount > 0 && walletINIT < amount) {
          return {
            message: `Not enough INIT to stake ${amount} INIT.`,
            sub: `Your balance: ${walletINIT.toFixed(4)} INIT · Required: ${amount} INIT`,
            action: "receive",
          };
        }
        if (walletINIT === 0) {
          return {
            message: "You have no INIT to stake.",
            sub: "Receive INIT to your wallet first.",
            action: "receive",
          };
        }
      }
      // 2. Swap INIT → X: need enough INIT
      if (/\bswap\b.{0,20}\binit\b/.test(lower)) {
        if (amount > 0 && walletINIT < amount) {
          return {
            message: "Insufficient INIT for this swap.",
            sub: `Your balance: ${walletINIT.toFixed(4)} INIT · Required: ${amount} INIT`,
            action: "receive",
          };
        }
        if (walletINIT === 0) {
          return {
            message: "You have no INIT to swap.",
            sub: "Receive INIT to your wallet first.",
            action: "receive",
          };
        }
      }
      // 3. Claim rewards: must have pending rewards
      if (/\b(claim|collect).{0,20}(reward|yield)\b/.test(lower) && totalRewards === 0) {
        return {
          message: "No staking rewards available to claim.",
          sub: "Stake INIT first to start earning rewards.",
        };
      }
      // 4. Unstake: must have a staked position
      if (/\b(unstake|undelegate)\b/.test(lower) && totalDelegated === 0) {
        return {
          message: "You have no staked INIT to unstake.",
          sub: "Stake INIT first before you can unstake.",
        };
      }
      // 5. Grow / invest: wallet must have something
      if (/\b(grow|invest|earn|yield|passive|income)\b/.test(lower) && totalBalance === 0) {
        return {
          message: "Your wallet has no assets to invest.",
          sub: "Deposit INIT or USDC to begin.",
          action: "deposit",
        };
      }

      return null; // ✅ All checks passed — proceed
    } catch {
      return null; // network error — allow through
    }
  };

  // ── Intent input handler ───────────────────────────────────────────────────
  const handleSubmit = async (text: string) => {
    setSystemResponse(null);
    setError(null);
    setValidationError(null);

    // 1. System commands — handled inline, never hit the AI pipeline
    const sysResponse = getSystemResponse(text, address);
    if (sysResponse) {
      setSystemResponse(sysResponse);
      return;
    }

    // 2. Pre-flight balance/state validation — must pass before AI is called
    setValidating(true);
    const preflight = await validateIntentPreflight(text);
    setValidating(false);
    if (preflight) {
      setValidationError(preflight);
      return; // ❌ blocked — show error to user, no backend call
    }

    // 3. Financial intent — deployment modal or direct submit
    if (needsDeploymentModal(text)) {
      setRawText(text);
      setShowDeploy(true);
    } else {
      submitToApi(text);
    }
  };

  const handleDeployConfirm = (pct: number) => {
    setShowDeploy(false);
    submitToApi(`${rawText} — deploy ${pct}% of my savings`);
  };

  const handleClarify = (option: string) => {
    setAmbiguity(null);
    submitToApi(`${pendingText} — ${option}`);
  };

  const timelineActive = loading || !!timeline || !!error;

  return (
    <>
      {showDeploy && <DeploymentModal onConfirm={handleDeployConfirm} onDismiss={() => setShowDeploy(false)} />}
      {ambiguity && (
        <AmbiguityModal
          question={ambiguity.question}
          options={ambiguity.options}
          onSelect={handleClarify}
          onDismiss={() => { setAmbiguity(null); submitToApi(`${pendingText} — low risk yield`); }}
        />
      )}

      {/* ChatGPT-style layout: hero at top, input pinned near bottom */}
      <div className="flex flex-col h-full w-full max-w-2xl mx-auto px-1">

        {/* Hero — visible when no active session */}
        <AnimatePresence>
          {!timelineActive && !systemResponse && !validationError && !validating && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-6"
            >
              {/* Logo mark */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.2)" }}>
                <span className="text-2xl font-black" style={{ color: "#00F5D4" }}>IO</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-text-primary tracking-normal mb-4 leading-snug">
                What do you want<br />your money to do?
              </h1>
              <p className="text-text-muted text-sm max-w-sm leading-relaxed">
                Type a goal in plain English — IntentOS validates, plans, and executes it for you.
              </p>
              {/* Pill hints */}
              <div className="flex gap-2 mt-5 flex-wrap justify-center">
                {["Stake INIT", "Grow portfolio", "Claim rewards", "Enable Autopilot"].map(hint => (
                  <span key={hint} className="text-[11px] px-3 py-1 rounded-full font-medium"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9AA5BC" }}>
                    {hint}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active session content — agent timeline + responses */}
        {(timelineActive || systemResponse || validationError || validating) && (
          <div className="flex-1 overflow-y-auto pt-6 pb-2 space-y-3">
            {/* Agent Timeline */}
            {timelineActive && (
              <div className="space-y-2">
                {error && (
                  <div className="text-sm text-status-error bg-bg-elevated border border-status-error/30 p-4 rounded-xl">
                    <span className="font-bold mr-2">Error:</span> {error}
                  </div>
                )}
                <AgentTimeline timeline={timeline} loading={loading} />
              </div>
            )}

            {/* System Command Response */}
            <AnimatePresence>
              {systemResponse && (
                <motion.div
                  key="sys-response"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl p-4"
                  style={{ background: "rgba(0,245,212,0.06)", border: "1px solid rgba(0,245,212,0.18)" }}
                >
                  {/* Receive address card */}
                  {systemResponse.type === "receive" && systemResponse.address ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📥</span>
                        <p className="text-sm font-bold text-text-primary">Your Initia Wallet Address</p>
                      </div>
                      {/* Token icons */}
                      <div className="flex gap-2">
                        {[
                          { url: "https://registry.testnet.initia.xyz/images/INIT.png", label: "INIT" },
                          { url: "https://registry.testnet.initia.xyz/images/USDC.png", label: "USDC" },
                        ].map(tok => (
                          <div key={tok.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <img src={tok.url} alt={tok.label} width={16} height={16} className="rounded-full" />
                            <span className="text-text-muted">{tok.label}</span>
                          </div>
                        ))}
                      </div>
                      {/* Address box */}
                      <div className="flex items-center gap-2 p-3 rounded-xl"
                        style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,245,212,0.15)" }}>
                        <span className="flex-1 text-xs font-mono text-text-primary break-all">{systemResponse.address}</span>
                      </div>
                      <div className="flex gap-2">
                        <CopyButton text={systemResponse.address} />
                        <button onClick={() => setSystemResponse(null)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg text-text-muted"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Autopilot / generic response */
                    <div className="flex gap-3 items-start">
                      <span className="text-xl mt-0.5">{systemResponse.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-text-primary">{systemResponse.message}</p>
                        {systemResponse.sub && (
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">{systemResponse.sub}</p>
                        )}
                        {systemResponse.type === "autopilot" && (
                          <button onClick={() => window.location.href = "/app/autopilot"}
                            className="text-xs mt-2 font-semibold" style={{ color: "#00F5D4" }}>
                            Open Autopilot Settings →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Pre-flight validation error */}
              {validationError && (
                <motion.div
                  key="validation-error"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl p-4"
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
                >
                  <div className="flex gap-3 items-start">
                    <span className="text-xl mt-0.5">⚠️</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-text-primary">{validationError.message}</p>
                      <p className="text-xs text-text-muted mt-1 leading-relaxed">{validationError.sub}</p>
                      {validationError.action === "receive" && (
                        <div className="flex gap-2 mt-2.5 flex-wrap">
                          <button onClick={() => { setSystemResponse({ icon: "📥", message: "Your Initia Wallet Address", type: "receive", address }); setValidationError(null); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                            style={{ background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.25)", color: "#00F5D4" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,245,212,0.18)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,245,212,0.1)")}>
                            <img src="https://registry.testnet.initia.xyz/images/INIT.png" alt="INIT" width={14} height={14} className="rounded-full" />
                            Receive INIT
                          </button>
                        </div>
                      )}
                      {validationError.action === "deposit" && (
                        <div className="flex gap-2 mt-2.5 flex-wrap">
                          <button onClick={() => { setSystemResponse({ icon: "📥", message: "Your Initia Wallet Address", type: "receive", address }); setValidationError(null); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                            style={{ background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.25)", color: "#00F5D4" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,245,212,0.18)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,245,212,0.1)")}>
                            <img src="https://registry.testnet.initia.xyz/images/INIT.png" alt="INIT" width={14} height={14} className="rounded-full" />
                            Receive INIT
                          </button>
                          <button onClick={() => { setSystemResponse({ icon: "📥", message: "Your Initia Wallet Address", type: "receive", address }); setValidationError(null); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#7C3AED" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(124,58,237,0.18)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(124,58,237,0.1)")}>
                            <img src="https://registry.testnet.initia.xyz/images/USDC.png" alt="USDC" width={14} height={14} className="rounded-full" />
                            Receive USDC
                          </button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setValidationError(null)}
                      className="text-text-muted hover:text-text-primary text-xs mt-0.5 flex-shrink-0">✕</button>
                  </div>
                </motion.div>
              )}

              {/* Validating spinner */}
              {validating && (
                <motion.div
                  key="validating"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs text-text-muted px-1"
                >
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Checking wallet balance…
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Intent Input — always at bottom */}
        <div className="flex-none pt-3 pb-2">
          <IntentInput
            key={rawText}
            onSubmit={handleSubmit}
            loading={loading || validating}
            disabled={!!timeline}
            defaultValue={rawText}
            walletEmpty={walletEmpty}
          />
        </div>
      </div>
    </>
  );
}
