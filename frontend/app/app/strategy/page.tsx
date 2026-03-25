"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import type { Strategy, ApiResponse, ExecutionResult } from "@/types";
import SuccessModal from "@/components/SuccessModal";

import { API_URL, API_HEADERS } from "@/lib/config";

// Initia-branded mint glow pulse — replaces generic spinners everywhere
function MintPulse({ size = 20 }: { size?: number }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <span
        className="absolute inline-flex h-full w-full rounded-full animate-ping"
        style={{ background: "rgba(0,245,212,0.4)" }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{ width: size, height: size, background: "#00F5D4" }}
      />
    </span>
  );
}

// ── Ring Chart Component ──────────────────────────────────────────────────────
function RingChart({ pct, label, sublabel, color }: {
  pct: number; label: string; sublabel: string; color: string;
}) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <motion.circle
          cx="50" cy="50" r={r}
          fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
          style={{ transformOrigin: "50% 50%", rotate: "-90deg" }}
        />
        <text x="50" y="47" textAnchor="middle" fontSize="15" fontWeight="800"
              fill="#F0F4FF" fontFamily="-apple-system, sans-serif">{label}</text>
        <text x="50" y="61" textAnchor="middle" fontSize="9" fill="#828A9E"
              fontFamily="-apple-system, sans-serif">{sublabel}</text>
      </svg>
    </div>
  );
}

// ── Risk Score Bar ────────────────────────────────────────────────────────────
function RiskBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const color = score <= 3 ? "#10B981" : score <= 6 ? "#F59E0B" : "#EF4444";
  const label = score <= 3 ? "Low" : score <= 6 ? "Medium" : "High";
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-text-muted">Risk Level</span>
        <span style={{ color }} className="font-semibold">{label} · {score}/10</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>Safe</span><span>Risky</span>
      </div>
    </div>
  );
}

// ── Execute Button ────────────────────────────────────────────────────────────
type ExecState = "idle" | "executing" | "success" | "failed";
function ExecuteButton({ onExecute, disabled, execState }: {
  onExecute: () => void; disabled: boolean; execState: ExecState;
}) {
  return (
    <motion.button
      onClick={execState !== "executing" ? onExecute : undefined}
      disabled={disabled || execState === "executing"}
      className={clsx(
        "w-full py-4 font-bold text-sm uppercase tracking-widest transition-all duration-200",
        execState === "idle" || execState === "executing" ? "btn-primary" : "",
        execState === "success" && "bg-emerald-500 text-black shadow-[0_4px_20px_rgba(0,245,212,0.3)]",
        execState === "failed"  && "bg-red-500/80 text-white",
      )}
      whileHover={!disabled && execState === "idle" ? { scale: 1.01 } : undefined}
      whileTap={!disabled && execState === "idle"   ? { scale: 0.99 } : undefined}
    >
      {execState === "executing" && (
        <span className="flex items-center justify-center gap-3">
          <MintPulse size={14} />
          Executing on Initia…
        </span>
      )}
      {execState === "idle"    && <span className="flex items-center justify-center gap-2">Execute Strategy <ArrowRight className="w-4 h-4"/></span>}
      {execState === "success" && <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4"/> Strategy Executed</span>}
      {execState === "failed"  && <span className="flex items-center justify-center gap-2"><XCircle className="w-4 h-4"/> Execution Failed — Retry</span>}
    </motion.button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StrategyPage() {
  const router = useRouter();
  const { address } = useWalletGuard();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [execState, setExecState] = useState<ExecState>("idle");
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();

  useEffect(() => {
    const stored = sessionStorage.getItem("intentos_strategy");
    if (stored) {
      try { setStrategy(JSON.parse(stored) as Strategy); } catch { /* ignore */ }
    }
  }, []);

  const sim = strategy?.simulation;
  const riskScore = sim?.riskScoreNumeric ?? 5;
  const projectedApy = sim?.projectedAPY ?? 0;
  const apyPct = Math.min(Math.round(projectedApy * 100), 100);
  const blocked = sim && !sim.passed;

  const handleExecute = async () => {
    if (!strategy || blocked) return;
    setExecState("executing");
    setErrorReason(null);
    try {
      const res = await fetch(`${API_URL}/api/execute/${strategy.id}`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ sessionKey: address ?? "", strategy }),
      });
      const data: ApiResponse<ExecutionResult> = await res.json();
      if (!data.success) throw new Error(data.error ?? "Execution failed");
      setTxHash((data.data as ExecutionResult & { txHash?: string })?.txHash);
      setExecState("success");
      // Show success modal instead of redirecting immediately
      setTimeout(() => setShowSuccess(true), 400);
    } catch (err) {
      setExecState("failed");
      setErrorReason((err as Error).message);
    }
  };

  if (!strategy) {
    return (
      <div className="max-w-xl mx-auto bg-bg-elevated border border-border-default p-12 text-center space-y-4 mt-8 shadow-2xl">
        <p className="text-lg font-bold text-text-primary tracking-tight">No strategy yet</p>
        <p className="text-sm text-text-muted">Start by entering your financial goal.</p>
        <button onClick={() => router.push("/app/intent")} className="btn-primary mx-auto mt-2 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4"/> New Intent
        </button>
      </div>
    );
  }

  return (
    <>
      <SuccessModal
        open={showSuccess}
        strategy={strategy}
        txHash={txHash}
        onClose={() => { setShowSuccess(false); router.push("/app/portfolio"); }}
      />
      <div className="max-w-2xl mx-auto flex flex-col min-h-full px-1 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Strategy Ready</h1>
          <p className="text-sm text-text-muted mt-0.5">Review the simulation, then execute.</p>
        </div>
        <button onClick={() => router.push("/app/intent")} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1">
          <ArrowLeft className="w-3 h-3"/> New Intent
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">

        {/* Strategy Steps */}
        <motion.div
          className="bg-bg-elevated border border-border-default p-5 flex-1 space-y-3 bg-gradient-to-b from-white/[0.03] to-transparent shadow-2xl"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Execution Plan · {strategy.bundle.steps.length} steps
          </p>
          {strategy.bundle.steps.map((step, i) => (
            <motion.div
              key={step.action}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-start gap-3 p-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <span className="w-6 h-6 rounded-full bg-[rgba(0,245,212,0.1)] text-[#00F5D4]
                               text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-text-primary capitalize">
                  {step.action.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-text-muted">
                  {step.protocol ? `${step.protocol} · ` : ""}{step.from ? `${step.from} → ${step.to}` : step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Before → After Simulation */}
        <motion.div
          className="bg-bg-elevated border border-border-default p-5 space-y-5 md:w-64 flex-shrink-0 bg-gradient-to-b from-white/[0.03] to-transparent shadow-2xl"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Simulation
          </p>

          {/* Before / After derived from projectedAPY */}
          {sim && (
            <div className="flex items-center justify-between text-sm">
              <div className="text-center space-y-0.5">
                <p className="text-xs text-text-muted">Input</p>
                <p className="text-lg font-black text-text-primary">$1,000</p>
              </div>
              <span className="text-[#00F5D4] text-xl">→</span>
              <div className="text-center space-y-0.5">
                <p className="text-xs text-text-muted">Projected</p>
                <p className="text-lg font-black text-emerald-400">
                  ${(1000 * (1 + sim.projectedAPY)).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          )}

          {/* Ring chart: APY */}
          <div className="flex justify-center">
            <RingChart
              pct={apyPct}
              label={`${(projectedApy * 100).toFixed(1)}%`}
              sublabel="Proj. APY"
              color="#00F5D4"
            />
          </div>

          {/* Risk bar */}
          {sim && <RiskBar score={riskScore} />}
        </motion.div>
      </div>

      {/* ── GEMINI FIX: Blocked state shows why ── */}
      <AnimatePresence>
        {blocked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-5 py-4 space-y-1"
          >
            <p className="text-sm font-semibold text-amber-400">
              ⚠ Strategy execution blocked
            </p>
            <p className="text-xs text-amber-400/75">
              {sim?.warnings?.[0] ??
                `Risk score (${riskScore}/10) exceeds the safe threshold. The AI blocked execution to protect your funds. Try a lower-risk intent.`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Execute CTA — sticky on mobile, normal on desktop */}
      <div className="fixed md:static bottom-0 left-0 right-0 z-40 md:z-auto p-4 md:p-0 md:mt-4"
           style={{ background: "linear-gradient(to top, #000 60%, transparent)" }}>
        <div className="max-w-2xl mx-auto space-y-2">
          <ExecuteButton
            onExecute={handleExecute}
            disabled={!!blocked || execState === "success"}
            execState={execState}
          />
          <AnimatePresence>
            {errorReason && execState === "failed" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-400 text-center pb-2"
              >
                {errorReason}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </>
  );
}
