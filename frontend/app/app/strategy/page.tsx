"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Brain, AlertTriangle, Share2 } from "lucide-react";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { Strategy } from "@/types";
import SuccessModal from "@/components/SuccessModal";
import StrategyReasoning from "@/components/StrategyReasoning";
import { useAccount } from "wagmi";
import { useLocale } from "@/components/LocaleProvider";
import CustomWalletModal from "@/components/CustomWalletModal";
import IntentShareModal from "@/components/IntentShareModal";

import { API_URL,CHAIN_ID, API_HEADERS } from "@/lib/config";
import type { ApiResponse, UnsignedMsgBundle } from "@/types";

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
  const { t } = useLocale();
  return (
    <motion.button
      onClick={execState !== "executing" ? onExecute : undefined}
      disabled={disabled || execState === "executing"}
      className={clsx(
        "w-full py-4 font-bold text-sm uppercase tracking-widest transition-all duration-300 rounded-full",
        (execState === "idle" || execState === "executing") && "bg-[#00F5D4] text-black shadow-[0_0_20px_rgba(0,245,212,0.25)] hover:bg-[#14FFDF] hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(0,245,212,0.45)] border border-transparent hover:border-[#00F5D4]/50",
        execState === "success" && "bg-emerald-500 text-black shadow-[0_4px_20px_rgba(0,245,212,0.3)]",
        execState === "failed" && "bg-red-500/80 text-white",
      )}
      whileHover={!disabled && execState === "idle" ? { scale: 1.01 } : undefined}
      whileTap={!disabled && execState === "idle" ? { scale: 0.99 } : undefined}
    >
      {execState === "executing" && (
        <span className="flex items-center justify-center gap-3">
          <MintPulse size={14} />
          {t("executing")}
        </span>
      )}
      {execState === "idle" && <span className="flex items-center justify-center gap-2">{t("execute_button")} <ArrowRight className="w-4 h-4" /></span>}
      {execState === "success" && <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> {t("strategy_executed")}</span>}
      {execState === "failed" && <span className="flex items-center justify-center gap-2"><XCircle className="w-4 h-4" /> {t("execution_failed")}</span>}
    </motion.button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StrategyPage() {
  const router = useRouter();
  const { address, requestTx,autoSign } = useWalletGuard();
  const isOnline = useOnlineStatus();
  const { connector } = useAccount();
  const { t } = useLocale();

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [execState, setExecState] = useState<ExecState>("idle");
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Privy embedded wallets don't support the autoSign session-key flow.
  // Detect this so we can skip autoSign.enable() for them.
  const isPrivyWallet = connector?.id === "cmbq1ozyc006al70lx4uciz0q" || !!connector?.name?.toLowerCase().includes("privy");


  useEffect(() => {
    const stored = sessionStorage.getItem("intentos_strategy");
    if (stored) {
      try { setStrategy(JSON.parse(stored) as Strategy); } catch { /* ignore */ }
    }
    setLoaded(true);
  }, []);

  const sim = strategy?.simulation;

  let riskScore = sim?.riskScoreNumeric ?? 5;
  const riskBullet = strategy?.bundle?.reasoning?.find(r => r.match(/risk(?:\s+score)?\s+(\d+)\/10/i));
  if (riskBullet) {
    const match = riskBullet.match(/risk(?:\s+score)?\s+(\d+)\/10/i);
    if (match) riskScore = parseInt(match[1]);
  }

  const projectedApy = sim?.projectedAPY ?? 0;
  // Backend sends integer percentages (8 = 8%).
  const apyPct = Math.min(Math.round(projectedApy), 100);
  const blocked = sim && !sim.passed;

  /**
   * Sums the INIT required by this strategy's steps.
   * Covers: stake, swap-from-INIT, and any step with from=="INIT".
   * Falls back to 0.1 INIT minimum (covers gas) when no explicit amounts exist.
   */
  function calcRequiredINIT(s: typeof strategy): number {
    if (!s) return 0.1;
    let total = 0;
    for (const step of s.bundle.steps) {
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
    return total > 0 ? total : 0.1;
  }

  const handleExecute = async () => {
    if (!strategy || blocked) return;
    setErrorReason(null);
    setBalanceError(null);
    setExecState("executing");

    // Pre-flight: check connected wallet INIT balance
    if (address) {
      try {
        const portfolioRes = await fetch(`${API_URL}/api/portfolio/${address}`, { headers: API_HEADERS });
        const portfolioJson = await portfolioRes.json();
        const walletINIT: number =
          portfolioJson.wallet?.find((a: { symbol: string }) => a.symbol === "INIT")?.balance ?? 0;
        const required = calcRequiredINIT(strategy);

        if (walletINIT < required) {
          setBalanceError(
            `You need ${required.toFixed(4)} INIT but your wallet only has ${walletINIT.toFixed(4)} INIT. ` +
            `Visit the faucet to top up.`
          );
          setExecState("idle");
          return;
        }
      } catch {
        // Network hiccup — proceed, backend will re-check
      }
    }

    try {
      // Step 1: Build unsigned messages on backend
      const msgRes = await fetch(
        `${API_URL}/api/execute/messages/${strategy.id}?wallet=${encodeURIComponent(address ?? "")}`,
        { headers: API_HEADERS }
      );
      const msgData: ApiResponse<UnsignedMsgBundle> = await msgRes.json();

      if (!msgData.success || !msgData.data) {
        throw new Error(msgData.error ?? "Failed to build transaction messages.");
      }

      const { msgs, memo, mode } = msgData.data;
      const isMock = mode === "mock";

      let hash = "";

      if (isMock) {
        // Mock mode: simulate success without wallet signing
        hash = `mock-${Date.now().toString(16)}`;
        await new Promise(r => setTimeout(r, 800));
           } else {

        // Activate session key if not already granted — wallet prompts once,
        // then all subsequent transactions in this session auto-sign.
        // Skip for Privy embedded wallets: they don't support the autoSign session-key flow.
        if (!isPrivyWallet && !autoSign.isEnabledByChain[CHAIN_ID]) {
          await autoSign.enable(CHAIN_ID);
        }
        // Real mode: sign + broadcast via InterwovenKit.
        // MsgExecute args arrive from the backend as base64 strings (JSON-safe).
        // InterwovenKit's BinaryWriter.bytes() expects Uint8Array (needs .byteLength),
        // so we must decode them before handing off to the wallet.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processedMsgs = (msgs as any[]).map(msg => {
        // We MUST ensure args are Uint8Array instances before requestTx.
        // Plain objects/strings in 'args' (repeated bytes) will cause "invalid uint32" errors.
        if (msg.value?.args && Array.isArray(msg.value.args)) {
          return {
            ...msg,
            value: {
              ...msg.value,
              args: msg.value.args.map((arg: any) => {
                if (typeof arg === "string") {
                  return Uint8Array.from(atob(arg), c => c.charCodeAt(0));
                }
                if (arg && typeof arg === "object" && arg.type === "Buffer" && Array.isArray(arg.data)) {
                  return new Uint8Array(arg.data);
                }
                if (Array.isArray(arg)) {
                  return new Uint8Array(arg);
                }
                return arg;
              }),
            },
          };
        }
        return msg;
      });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const txResult = await requestTx({ messages: processedMsgs, memo });
        hash = typeof txResult === "string" ? txResult : "";
        if (!hash) throw new Error("Wallet returned no transaction hash after signing.");
      }

      // Step 2: Confirm execution with backend
      await fetch(`${API_URL}/api/execute/confirm`, {
        method: "POST",
        headers: { ...API_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: strategy.id,
          walletAddress: address,
          txHash: hash,
          strategy,
        }),
      });

      setTxHash(hash);
      setExecState("success");
      setShowSuccess(true);

      // Record referral if one exists
      try {
        const referrer = localStorage.getItem("intentos_referrer");
        if (referrer) {
          await fetch(`${API_URL}/api/referrals/record`, {
            method: "POST",
            headers: API_HEADERS,
            body: JSON.stringify({ referrerAddress: referrer, refereeAddress: address })
          });
          localStorage.removeItem("intentos_referrer");
        }
      } catch (_e) {
        // Silently ignore referral tracking errors
      }
    } catch (err) {
      console.error("Execution error trace:", err);
      setErrorReason((err as Error).message);
      setExecState("failed");
    }
  };

  // Don't flash empty state during hydration — wait for sessionStorage to load
  if (!loaded) {
    return (
      <div className="max-w-xl mx-auto space-y-4 mt-8 animate-pulse">
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
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.15)" }}
        >
          <Brain className="w-8 h-8" style={{ color: "#00F5D4" }} />
        </div>
        <h2 className="text-xl font-black text-text-primary mb-2">{t("no_strategy")}</h2>
        <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">
          {t("start_intent")}
        </p>
        <button
          onClick={() => router.push("/app/intent")}
          className="btn-primary flex items-center gap-2 px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4" /> {t("create_intent")}
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
        onShare={() => setShowShareModal(true)}
      />
      <div className="max-w-2xl mx-auto flex flex-col min-h-full px-1 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <div>
            <h1 className="text-2xl font-black text-text-primary tracking-tight">{t("strategy_plan")}</h1>
            <p className="text-sm text-text-muted mt-0.5">{t("strategy_desc")}</p>
          </div>
          {/* Pill-shaped "New Intent" back button */}
          <button
            onClick={() => router.push("/app/intent")}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-white/10
                       bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary
                       transition-all duration-200"
          >
            <ArrowLeft className="w-3 h-3" /> {t("new_intent")}
          </button>
        </div>

        {/* Top row: distinct cards with full gap — no merging borders */}
        <div className="flex flex-col md:flex-row gap-4">

          {/* Strategy Steps */}
          <motion.div
            className="bg-[#13161D]/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex-1 space-y-4 shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
              {t("execution_plan")} · {strategy.bundle.steps.length} {strategy.bundle.steps.length === 1 ? t("step") : t("steps")}
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
                    {t(`action_${step.action}`) || (step.action === "stake" ? `Stake ${step.from || "INIT"}` : step.action.replace(/_/g, " "))}
                  </p>
                  <p className="text-xs text-text-muted">
                    {step.action === "stake"
                      ? (step.protocol || "Initia Network Staking")
                      : step.action === "transfer" || step.action === "batch_transfer"
                        ? `${step.protocol ?? "Initia Bank"} · ${step.from ?? "INIT"} → recipient`
                        : step.from && step.to
                          ? `${step.protocol ? `${step.protocol} · ` : ""}${step.from} → ${step.to}`
                          : `${step.protocol ? `${step.protocol} · ` : ""}${step.description}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Before → After Simulation */}
          <motion.div
            className="bg-[#13161D]/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl space-y-6 md:w-64 flex-shrink-0 shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
              {t("strategy_simulation") || "Simulation"}
            </p>

            {/* Before / After derived from projectedAPY */}
            {sim && (
              <div className="flex items-center justify-between text-sm">
                <div className="text-center space-y-0.5">
                  <p className="text-xs text-text-muted">{t("strategy_input") || "Input"}</p>
                  <p className="text-lg font-black text-text-primary">$1,000</p>
                </div>
                <span className="text-[#00F5D4] text-xl">→</span>
                <div className="text-center space-y-0.5">
                  <p className="text-xs text-text-muted">{t("strategy_projected") || "Projected"}</p>
                  <p className="text-lg font-black text-emerald-400">
                    ${(1000 * (1 + projectedApy / 100)).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            )}

            {/* Ring chart: APY */}
            <div className="flex justify-center">
              <RingChart
                pct={apyPct}
                label={`${projectedApy.toFixed(1)}%`}
                sublabel={t("strategy_proj_apy") || "Proj. APY"}
                color="#00F5D4"
              />
            </div>

            {/* Risk bar */}
            {sim && <RiskBar score={riskScore} />}
          </motion.div>
        </div>

        {/* Why This Strategy — separate card below, with its own clean gap */}
        {strategy.bundle.reasoning && strategy.bundle.reasoning.length > 0 && (
          <div className="mt-4">
            <StrategyReasoning reasoning={strategy.bundle.reasoning} />
          </div>
        )}

        {/* ── GEMINI FIX: Blocked state shows why ── */}
        <AnimatePresence>
          {blocked && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-amber-500/25 bg-amber-500/8 px-5 py-4 space-y-1"
            >
              <p className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {t("strategy_blocked")}
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



            {/* ── Insufficient balance error ───────────────────────── */}
            <AnimatePresence>
              {balanceError && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 340, damping: 26 }}
                  className="rounded-2xl border px-5 py-4 space-y-2 mb-1"
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    borderColor: "rgba(239,68,68,0.25)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0"
                      style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    </span>
                    <p className="text-sm font-bold text-red-400">{t("insufficient_balance")}</p>
                  </div>
                  <p className="text-xs text-red-400/70 leading-relaxed pl-8">{balanceError}</p>
                  <div className="pl-8 flex items-center gap-4">
                    <button
                      onClick={() => setBalanceError(null)}
                      className="text-xs text-red-400/50 hover:text-red-400 transition-colors underline"
                    >
                      {t("dismiss")}
                    </button>
                    <a
                      href="https://faucet.testnet.initia.xyz"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#00F5D4]/60 hover:text-[#00F5D4] transition-colors underline"
                    >
                      Get testnet INIT →
                    </a>
                  </div>
                </motion.div>

              )}
            </AnimatePresence>

            <ExecuteButton
              onExecute={handleExecute}
              disabled={!!blocked || execState === "success" || !isOnline}
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
      <CustomWalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
      {strategy && (
        <IntentShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          result={{
            intentText: strategy.intent.rawText,
            returnPct: strategy.simulation?.projectedAPY ?? undefined,
            riskLevel: strategy.simulation?.riskScore ?? "Medium",
            executedAt: new Date().toISOString(),
            txHash,
          }}
        />
      )}
    </>
  );
}
