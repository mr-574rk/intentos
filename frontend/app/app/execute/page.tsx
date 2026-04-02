"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AgentTimeline from "@/components/AgentTimeline";
import ExecuteButton from "@/components/ExecuteButton";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import { XCircle } from "lucide-react";
import type { Strategy, ApiResponse, ExecutionResult, AgentTimeline as TimelineType, StrategyStep } from "@/types";
import { API_URL, API_HEADERS } from "@/lib/config";

/** Sum how much INIT this strategy needs before it can run. */
function calcRequiredINIT(steps: StrategyStep[]): number {
  let total = 0;
  for (const step of steps) {
    const action = String(step.action ?? "").toLowerCase();
    const from   = String(step.from  ?? "").toUpperCase();
    const amt    = typeof step.amount === "number" ? step.amount : parseFloat(String(step.amount ?? 0));
    const spendingINIT =
      from === "INIT" ||
      action === "stake" ||
      action === "delegate" ||
      action === "compound" ||
      action === "leverage_stake";
    if (spendingINIT && !isNaN(amt) && amt > 0) {
      total += amt;
    }
  }
  // Minimum 0.1 INIT covers gas even when amounts aren't explicit
  return total > 0 ? total : 0.1;
}

export default function ExecutePage() {
  const router = useRouter();
  const { address } = useWalletGuard();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [timeline, setTimeline] = useState<TimelineType | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("intentos_strategy");
    if (stored) {
      const s = JSON.parse(stored) as Strategy;
      setStrategy(s);
      fetch(`${API_URL}/api/agent/timeline/${s.id}`, { headers: API_HEADERS })
        .then((r) => r.json())
        .then((d: ApiResponse<TimelineType>) => { if (d.data) setTimeline(d.data); })
        .catch(() => undefined);
    }
    setLoaded(true);
  }, []);

  const handleExecute = async () => {
    if (!strategy) return;
    setError(null);
    setBalanceError(null);

    // ── Pre-flight: check connected wallet INIT balance ──────────────────────
    if (address) {
      try {
        const portfolioRes = await fetch(`${API_URL}/api/portfolio/${address}`, { headers: API_HEADERS });
        const portfolioJson = await portfolioRes.json();
        const walletINIT: number =
          portfolioJson.wallet?.find((a: { symbol: string }) => a.symbol === "INIT")?.balance ?? 0;
        const required = calcRequiredINIT(strategy.bundle.steps);

        if (walletINIT < required) {
          setBalanceError(
            `Your connected wallet has ${walletINIT.toFixed(4)} INIT but this strategy requires ≈${required.toFixed(4)} INIT. ` +
            `Please fund your wallet before executing.`
          );
          return; // ← hard stop — never reaches the backend
        }
      } catch {
        // Don't block on a network hiccup — let execution attempt proceed
        console.warn("[BalanceCheck] Portfolio fetch failed — proceeding anyway.");
      }
    }

    try {
      const res = await fetch(`${API_URL}/api/execute/${strategy.id}`, {
        method: "POST",
        headers: API_HEADERS,
        // Pass the connected wallet address as sessionKey (fixes empty-string bug)
        body: JSON.stringify({ sessionKey: address ?? "", strategy }),
      });
      const data: ApiResponse<ExecutionResult> = await res.json();
      if (!data.success || !data.data) throw new Error(data.error ?? "Execution failed");
      setResult(data.data);

      // Refresh timeline
      const tlRes = await fetch(`${API_URL}/api/agent/timeline/${strategy.id}`, { headers: API_HEADERS });
      const tlData: ApiResponse<TimelineType> = await tlRes.json();
      if (tlData.data) setTimeline(tlData.data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (!loaded) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 mt-8 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)" }} />
        ))}
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 text-3xl"
          style={{ background: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.15)" }}
        >
          ⚡
        </div>
        <h2 className="text-xl font-black text-text-primary mb-2">No execution plan available</h2>
        <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">
          Generate a strategy first before executing on-chain.<br />
          Head to Intent to tell IntentOS your goal.
        </p>
        <button
          onClick={() => router.push("/app/intent")}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          ← Create Intent
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text-primary mb-1">Execute Strategy</h1>
        <p className="text-text-secondary text-sm">
          Review the agent pipeline and approve execution.
        </p>
      </div>

      <>
        {/* Strategy summary */}
        <div className="glass-card p-5">
          <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">Intent</p>
          <p className="text-sm font-semibold text-text-primary">&quot;{strategy.intent.rawText}&quot;</p>
          <div className="flex gap-3 mt-3 text-xs text-text-muted">
            <span>{strategy.bundle.steps.length} steps</span>
            <span>·</span>
            <span>~{strategy.bundle.estimatedYield}% APY</span>
            <span>·</span>
            <span className="capitalize">{strategy.bundle.riskScore} risk</span>
          </div>
        </div>

        <AgentTimeline timeline={timeline} />

        {/* ── Insufficient balance error ─────────────────────────── */}
        <AnimatePresence>
          {balanceError && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              className="rounded-2xl border px-5 py-4 space-y-2"
              style={{
                background: "rgba(239,68,68,0.06)",
                borderColor: "rgba(239,68,68,0.25)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                </span>
                <p className="text-sm font-bold text-red-400">Insufficient INIT Balance</p>
              </div>
              <p className="text-xs text-red-400/70 leading-relaxed pl-8">{balanceError}</p>
              <button
                onClick={() => setBalanceError(null)}
                className="pl-8 text-xs text-red-400/50 hover:text-red-400 transition-colors underline"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && (
          <ExecuteButton
            onExecute={handleExecute}
            disabled={strategy.simulation ? !strategy.simulation.passed : false}
          />
        )}

        {error && (
          <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3">
            ⚠ {error}
          </div>
        )}

        {result && (
          <div className="glass-card p-5 space-y-3">
            <p className="text-sm font-semibold text-status-success">✓ Execution complete</p>
            <div className="text-xs text-text-muted space-y-1 font-mono">
              <p>Mode: <span className="text-text-primary">{result.mode}</span></p>
              <p>Tx Hash: <span className="text-accent-cyan">{result.txHash}</span></p>
              <p>Status: <span className="text-status-success">{result.status}</span></p>
            </div>
            <button onClick={() => router.push("/app/portfolio")} className="btn-primary w-full mt-2">
              View Portfolio →
            </button>
          </div>
        )}
      </>
    </div>
  );
}
