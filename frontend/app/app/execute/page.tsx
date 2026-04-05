"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AgentTimeline from "@/components/AgentTimeline_Deprecated";
import ExecuteButton from "@/components/ExecuteButton";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import { XCircle, Zap, AlertTriangle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import type { Strategy, ApiResponse, UnsignedMsgBundle, AgentTimeline as TimelineType, StrategyStep } from "@/types";
import { API_URL, API_HEADERS, FAUCET_URL, explorerTxUrl } from "@/lib/config";

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
  const { address, requestTx } = useWalletGuard();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [timeline, setTimeline] = useState<TimelineType | null>(null);
  const [result, setResult] = useState<{ txHash: string; mode: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("intentos_strategy");
    if (stored) {
      const s = JSON.parse(stored) as Strategy;
      setStrategy(s);
      if (address && s.id) {
        fetch(
          `${API_URL}/api/agent/timeline/${s.id}?wallet=${encodeURIComponent(address)}`,
          { headers: API_HEADERS }
        )
          .then((r) => r.json())
          .then((d: ApiResponse<TimelineType>) => { if (d.data) setTimeline(d.data); })
          .catch(() => undefined);
      }
    }
    setLoaded(true);
  }, [address]);

  const handleExecute = async () => {
    if (!strategy || !address) return;
    setError(null);
    setBalanceError(null);

    // ── Pre-flight: enforce wallet INIT balance check ───────────────────────
    try {
      const portfolioRes = await fetch(`${API_URL}/api/portfolio/${address}`, { headers: API_HEADERS });
      const portfolioJson = await portfolioRes.json();
      const walletINIT: number =
        portfolioJson.wallet?.find((a: { symbol: string }) => a.symbol === "INIT")?.balance ?? 0;
      const required = calcRequiredINIT(strategy.bundle.steps);

      if (walletINIT < required) {
        setBalanceError(
          `Insufficient INIT balance. You have ${walletINIT.toFixed(4)} INIT but this strategy needs at least ${required.toFixed(4)} INIT. ` +
          `Claim testnet INIT from the faucet to continue.`
        );
        return; // Hard stop — do not proceed to signing
      }
    } catch {
      // Only block if we got a definitive 0 balance response; let network failures through
      console.warn("[BalanceCheck] Portfolio fetch failed — proceeding.");
    }

    setSigning(true);
    try {
      // ── Step 1: Fetch unsigned messages from backend ──────────────────────
      const msgRes = await fetch(
        `${API_URL}/api/execute/messages/${strategy.id}?wallet=${encodeURIComponent(address)}`,
        { headers: API_HEADERS }
      );
      const msgData: ApiResponse<UnsignedMsgBundle> = await msgRes.json();

      if (!msgData.success || !msgData.data) {
        throw new Error(msgData.error ?? "Failed to build transaction messages.");
      }

      const { msgs, memo, mode } = msgData.data;
      const isMock = mode === "mock";

      let txHash = "";

      if (isMock) {
        // Mock mode: simulate success without wallet signing
        txHash = `mock-${Date.now().toString(16)}`;
        await new Promise(r => setTimeout(r, 800)); // brief UX delay
      } else {
        // Real mode: sign + broadcast via InterwovenKit
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const txResult = await requestTx({ messages: msgs as any[], memo });
        // requestTxSync returns a string (tx hash), not an object
        txHash = typeof txResult === "string" ? txResult : "";
        if (!txHash) throw new Error("Wallet returned no transaction hash after signing.");
      }

      // ── Step 3: Confirm execution with backend (record history) ──────────
      await fetch(`${API_URL}/api/execute/confirm`, {
        method: "POST",
        headers: { ...API_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: strategy.id,
          walletAddress: address,
          txHash,
          strategy,
        }),
      });

      setResult({ txHash, mode: isMock ? "mock" : "testnet" });

      // Refresh timeline (now wallet-scoped)
      const tlRes = await fetch(
        `${API_URL}/api/agent/timeline/${strategy.id}?wallet=${encodeURIComponent(address)}`,
        { headers: API_HEADERS }
      );
      const tlData: ApiResponse<TimelineType> = await tlRes.json();
      if (tlData.data) setTimeline(tlData.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSigning(false);
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
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.15)" }}
        >
          <Zap className="w-8 h-8 text-[#00F5D4]" />
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
          Review the agent pipeline, then sign with your wallet to execute on-chain.
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

        {/* ── Insufficient balance error ──────────────────────────────────── */}
        <AnimatePresence>
          {balanceError && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              className="rounded-2xl border px-5 py-4 space-y-3"
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
              <div className="pl-8 flex gap-3 items-center">
                <a
                  href={FAUCET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#00F5D4] hover:text-[#00F5D4]/80 flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Claim testnet INIT
                </a>
                <button
                  onClick={() => setBalanceError(null)}
                  className="text-xs text-red-400/50 hover:text-red-400 transition-colors underline"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Signing indicator ────────────────────────────────────────────── */}
        <AnimatePresence>
          {signing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="rounded-2xl border px-5 py-4 flex items-center gap-3"
              style={{
                background: "rgba(0,245,212,0.04)",
                borderColor: "rgba(0,245,212,0.2)",
              }}
            >
              <Loader2 className="w-4 h-4 text-[#00F5D4] animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#00F5D4]">Waiting for wallet signature…</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Your wallet will prompt you to review and sign the transaction bundle.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && (
          <ExecuteButton
            onExecute={handleExecute}
            disabled={signing || (strategy.simulation ? !strategy.simulation.passed : false)}
          />
        )}

        {error && (
          <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> <span className="pt-px">{error}</span>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="glass-card p-5 space-y-3"
          >
            <p className="text-sm font-semibold text-status-success items-center inline-flex gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              {result.mode === "mock" ? "Strategy simulated successfully" : "Transaction signed & broadcast"}
            </p>
            <div className="text-xs text-text-muted space-y-1 font-mono">
              <p>Mode: <span className="text-text-primary">{result.mode}</span></p>
              <p>
                Tx Hash:{" "}
                {result.mode === "mock" ? (
                  <span className="text-accent-cyan">{result.txHash}</span>
                ) : (
                  <a
                    href={explorerTxUrl(result.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-cyan hover:underline inline-flex items-center gap-1"
                  >
                    {result.txHash.slice(0, 16)}…{result.txHash.slice(-8)}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </p>
              <p>Status: <span className="text-status-success">success</span></p>
            </div>
            <button onClick={() => router.push("/app/portfolio")} className="btn-primary w-full mt-2">
              View Portfolio →
            </button>
          </motion.div>
        )}
      </>
    </div>
  );
}
