"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import IntentInput from "@/components/IntentInput";
import AgentTimeline from "@/components/AgentTimeline";
import AmbiguityModal from "@/components/AmbiguityModal";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type {
  ApiResponse,
  Strategy,
  AgentTimeline as TimelineType,
  AmbiguityResponse,
  ExecutionResult,
} from "@/types";
import { API_URL, API_HEADERS } from "@/lib/config";
import {
  enableAutopilot,
  disableAutopilot,
  getActiveStrategyLabels,
} from "@/lib/autopilotState";
import {
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  SendHorizonal,
} from "lucide-react";

// ── Detect goal-based (no explicit amount) intents ───────────────────────────
const GOAL_PATTERNS =
  /\b(grow|safe|savings|return|income|passive|earn|yield|invest|highest|steady|profit|reward|accumulat|compound|wealth|stake|swap|delegate)\b/i;
const HAS_AMOUNT = /\b\d+(\.\d+)?\b/;

// ── Wallet send/transfer intent detection ─────────────────────────────────────
interface TransferIntent {
  amount: string;
  token: string;
  recipient: string;
}

function parseTransferIntent(text: string): TransferIntent | null {
  // Matches: "send 5 INIT to init1xyz..." or "transfer 0.5 USDC to 0xABC..."
  const match = text.match(
    /\b(send|transfer|pay)\s+([\d.]+)\s+(\w+)\s+to\s+(init1[a-zA-Z0-9]{30,}|0x[a-fA-F0-9]{8,}|[a-zA-Z0-9._-]{3,}@[a-zA-Z0-9._-]{2,})/i
  );
  if (!match) return null;
  return { amount: match[2], token: match[3].toUpperCase(), recipient: match[4] };
}

// ── Portfolio API response shape ───────────────────────────────────────────────
interface PortfolioAPIData {
  wallet: { symbol: string; balance: number; valueUSD: number }[];
  staked: { symbol: string; balance: number; valueUSD: number }[];
  rewards: { symbol: string; balance: number; valueUSD: number }[];
  totalValueUSD: number;
}

// ── System intents ─────────────────────────────────────────────────────────────
type SystemResponse = {
  message: string;
  sub?: string;
  icon: string;
  type?: "autopilot" | "receive" | "greeting" | "help" | "unknown";
  address?: string;
  walletBalance?: number;
};

function getSystemResponse(text: string, address?: string, walletBalance: number = 0): SystemResponse | null {
  const lower = text.toLowerCase().trim();

  const financialIntents = ["stake", "delegate", "swap", "unstake", "claim", "grow", "invest", "yield", "buy", "sell", "portfolio", "transfer", "send"];
  if (financialIntents.some(f => lower.includes(f)) || HAS_AMOUNT.test(lower)) {
    return null;
  }

  const greetings = ["hello", "hi", "hey", "gm", "good morning", "good evening", "howdy", "sup", "how are you"];
  if (greetings.some(g => lower === g || lower.startsWith(g + " "))) {
    logSystemEvent("Greeting", text);
    return { icon: "👋", message: "Hi! I'm IntentOS.", type: "greeting", walletBalance };
  }

  const helps = ["help", "commands", "what can you do", "get started", "how do i", "what is intentos", "beginner", "tutorial", "new here", "how does this work", "what can i do"];
  if (helps.some(h => lower.includes(h))) {
    logSystemEvent("Help", text);
    return { icon: "💡", message: "Here are things I can help with:", type: "help" };
  }

  if (/\b(enable|turn on|activate|start).{0,20}autopilot\b/.test(lower)) {
    const state = enableAutopilot();
    const labels = getActiveStrategyLabels(state);
    logSystemEvent("Autopilot Enabled", text);
    return {
      icon: "🤖",
      message: "Autopilot enabled.",
      sub: labels.length ? `Active strategies: ${labels.join(" · ")}` : "No strategies configured — open Autopilot settings to configure.",
      type: "autopilot",
    };
  }
  if (/\b(disable|turn off|deactivate|stop).{0,20}autopilot\b/.test(lower)) {
    disableAutopilot();
    logSystemEvent("Autopilot Disabled", text);
    return { icon: "⏸", message: "Autopilot disabled.", sub: "All automated strategies are paused. Re-enable anytime.", type: "autopilot" };
  }
  if (/\b(receive|deposit|fund|get)\b.{0,20}\b(init|usdc|token|crypto|funds?|money|asset)\b/.test(lower)
    || /^(receive|deposit|fund|get init|get usdc)$/.test(lower)) {
    logSystemEvent("Receive Address", text);
    return { icon: "📥", message: "Your Initia wallet address", sub: address ?? "Connect wallet to see address", type: "receive", address };
  }

  logSystemEvent("Unknown", text);
  return { icon: "⚠️", message: "I couldn't understand that command.", type: "unknown" };
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

// ── Premium Receive Card ───────────────────────────────────────────────────────
function ReceiveCard({ address, onDismiss }: { address: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const [activeToken, setActiveToken] = useState<"INIT" | "USDC">("INIT");
  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-3xl p-6 bg-[#13161D]/80 backdrop-blur-md border border-white/10 shadow-2xl flex flex-col items-center">
      <button onClick={onDismiss} className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
      </button>
      <div className="flex bg-black/40 p-1 rounded-full mb-6 w-full max-w-[200px] border border-white/5">
        {(["INIT", "USDC"] as const).map(t => (
          <button key={t} onClick={() => setActiveToken(t)}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-full transition-all flex items-center justify-center gap-1.5 ${activeToken === t ? "bg-[#00F5D4] text-black shadow-sm" : "text-text-muted hover:text-white"}`}>
            {t === "INIT" && activeToken === t && <img src="https://registry.testnet.initia.xyz/images/INIT.png" className="w-3.5 h-3.5 rounded-full" />}
            {t === "USDC" && activeToken === t && <img src="https://registry.testnet.initia.xyz/images/USDC.png" className="w-3.5 h-3.5 rounded-full" />}
            {t}
          </button>
        ))}
      </div>
      <div className="w-40 h-40 bg-white rounded-[22px] flex items-center justify-center mb-6 shadow-xl p-2.5">
        <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center bg-gray-50/50">
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${address}`} alt="Wallet QR Code" className="w-full h-full object-contain" />
        </div>
      </div>
      <p className="text-sm font-bold text-white mb-3 text-center">Your {activeToken} Address</p>
      <div className="w-full bg-black/40 rounded-xl p-1.5 flex items-center border border-white/5 relative group transition-all hover:border-[#00F5D4]/30">
        <div className="flex-1 overflow-x-auto pl-3 pr-10 py-2">
          <p className="font-mono text-[13px] tracking-tight text-gray-300 break-all">{address}</p>
        </div>
        <button onClick={copy}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 hover:bg-[#00F5D4]/10 text-gray-400 hover:text-[#00F5D4] transition-all">
          {copied
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>}
        </button>
      </div>
    </div>
  );
}

// ── Deployment Size Modal ──────────────────────────────────────────────────────
function DeploymentModal({ onConfirm, onDismiss }: { onConfirm: (pct: number) => void; onDismiss: () => void }) {
  const [pct, setPct] = useState(50);
  const presets = [10, 25, 50, 100];
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDismiss} />
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="w-full max-w-sm pointer-events-auto p-7 space-y-5 shadow-2xl shadow-black/80"
          initial={{ scale: 0.93, y: 18, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.93, y: 18, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          style={{ background: "#0d0f14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px" }}
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
              <button key={p} onClick={() => setPct(p)}
                className={`flex-1 py-2 text-xs font-bold rounded-full transition-all duration-200 border ${pct === p ? "bg-[#00F5D4] text-black border-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.3)]" : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"}`}>
                {p === 100 ? "All in" : `${p}%`}
              </button>
            ))}
          </div>
          <input type="range" min={1} max={100} value={pct} onChange={e => setPct(Number(e.target.value))} className="w-full cursor-pointer accent-[#00F5D4]"
            style={{ appearance: "none", height: "6px", borderRadius: "999px", background: `linear-gradient(to right, #00F5D4 ${pct}%, rgba(255,255,255,0.1) ${pct}%)`, outline: "none" }} />
          <button onClick={() => onConfirm(pct)} className="w-full py-4 font-bold text-sm tracking-wide rounded-full bg-[#00F5D4] text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(0,245,212,0.4)] hover:bg-[#0cf6d6]">
            Build Strategy with {pct === 100 ? "Full" : `${pct}%`} Deployment →
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Confirm Transaction Card (inline timeline step) ───────────────────────────
function ConfirmTransactionCard({
  transfer,
  onProceed,
  onReject,
  loading,
}: {
  transfer: TransferIntent;
  onProceed: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
      style={{ background: "#13161D" }}
    >
      {/* Header strip */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5"
        style={{ background: "rgba(0,245,212,0.04)" }}>
        <span className="flex items-center justify-center w-7 h-7 rounded-xl flex-shrink-0"
          style={{ background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.2)" }}>
          <SendHorizonal className="w-3.5 h-3.5" style={{ color: "#00F5D4" }} />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#00F5D4" }}>Confirm Transaction</p>
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Transfer summary */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Sending</span>
            <span className="text-base font-black text-text-primary">
              {transfer.amount} <span style={{ color: "#00F5D4" }}>{transfer.token}</span>
            </span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs text-text-muted">Recipient</span>
            <span className="text-xs font-mono text-text-secondary text-right max-w-[200px] break-all">
              {transfer.recipient}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">Network Fee</span>
            <span className="text-xs font-semibold text-emerald-400">Gasless (Initia)</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5" />

        {/* Warning */}
        <div className="flex gap-2.5 items-start rounded-xl p-3"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400/80 leading-relaxed">
            Transactions are irreversible. Verify the recipient address before proceeding.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 py-3 text-sm font-bold rounded-full border border-white/10 bg-white/5
                       hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400
                       text-text-secondary transition-all duration-200 disabled:opacity-40"
          >
            Reject
          </button>
          <button
            onClick={onProceed}
            disabled={loading}
            className="flex-1 py-3 text-sm font-bold rounded-full transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            style={{
              background: loading ? "rgba(0,245,212,0.3)" : "#00F5D4",
              color: "#000",
              boxShadow: loading ? "none" : "0 0 20px rgba(0,245,212,0.3)",
            }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
            ) : (
              <>Proceed <ArrowUpRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Transaction Result Card ────────────────────────────────────────────────────
function TransactionResultCard({ txHash, onDone }: { txHash: string; onDone: () => void }) {
  // Correct Initia testnet explorer — tx detail page
  const hasTxHash = txHash && txHash !== "confirmed" && txHash.length > 10;
  const explorerUrl = hasTxHash
    ? `https://scan.testnet.initia.xyz/initiation-2/txs/${txHash}`
    : `https://scan.testnet.initia.xyz/initiation-2/txs`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="rounded-2xl border overflow-hidden shadow-2xl"
      style={{ background: "#13161D", borderColor: "rgba(16,185,129,0.25)" }}
    >
      {/* Success strip */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b"
        style={{ background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.15)" }}>
        <span className="flex items-center justify-center w-7 h-7 rounded-xl flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Transaction Sent</p>
      </div>

      <div className="px-5 py-5 space-y-4">
        <p className="text-sm text-text-secondary leading-relaxed">
          Your transaction has been broadcast to the Initia network and is being confirmed.
        </p>

        {/* TX hash */}
        <div className="rounded-xl p-3 space-y-1.5"
          style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)" }}>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Transaction Hash</p>
          {hasTxHash ? (
            <p className="font-mono text-xs text-emerald-400 break-all">{txHash}</p>
          ) : (
            <p className="text-xs text-emerald-400 font-semibold">Confirmed on-chain ✓</p>
          )}
        </div>

        {/* Explorer link */}
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-4 py-3 rounded-full border text-sm font-semibold transition-all duration-200
                     hover:bg-white/5 hover:border-white/20"
          style={{ borderColor: "rgba(255,255,255,0.1)", color: "#00F5D4" }}
        >
          <span>{hasTxHash ? "View Transaction on Initia Explorer" : "View Initia Explorer"}</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        <button
          onClick={onDone}
          className="w-full py-2.5 text-sm font-semibold rounded-full border border-white/10
                     bg-white/5 hover:bg-white/10 text-text-secondary transition-all duration-200"
        >
          New Intent
        </button>
      </div>
    </motion.div>
  );
}

// ── Toast notification ─────────────────────────────────────────────────────────
function TxSentToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, x: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, x: 12, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 340, damping: 26 }}
          className="fixed top-4 right-4 z-[9997] flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl"
          style={{
            background: "rgba(18, 18, 25, 0.92)",
            borderColor: "rgba(16,185,129,0.3)",
            boxShadow: "0 4px 30px rgba(16,185,129,0.15)",
          }}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </span>
          <div>
            <p className="text-sm font-bold text-emerald-300">Transaction Sent!</p>
            <p className="text-xs" style={{ color: "rgba(110,231,183,0.6)" }}>Broadcasting to Initia network…</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function IntentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isConnected, address, username } = useWalletGuard();
  const isOnline = useOnlineStatus();

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [timeline, setTimeline] = useState<TimelineType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{ message: string; sub: string; action?: "receive" | "deposit" } | null>(null);
  const [ambiguity, setAmbiguity] = useState<AmbiguityResponse | null>(null);
  const [pendingText, setPendingText] = useState<string>("");
  const [showDeploy, setShowDeploy] = useState(false);
  const [rawText, setRawText] = useState("");
  const [systemResponse, setSystemResponse] = useState<SystemResponse | null>(null);
  const [walletEmpty, setWalletEmpty] = useState<boolean | null>(null);
  const [walletInitBalance, setWalletInitBalance] = useState<number>(0);
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);

  // Transfer confirmation states
  const [transferConfirm, setTransferConfirm] = useState<TransferIntent | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferResult, setTransferResult] = useState<string | null>(null); // txHash
  const [showTxToast, setShowTxToast] = useState(false);

  // Auto-scroll ref for the tx result card
  const txResultRef = useRef<HTMLDivElement>(null);

  // Pre-fill from ?prefill= URL param
  useEffect(() => {
    const prefill = searchParams.get("prefill");
    if (prefill) {
      setRawText(decodeURIComponent(prefill));
    } else {
      sessionStorage.removeItem("intentos_strategy");
    }
  }, [searchParams]);

  // Silently fetch wallet state on mount
  useEffect(() => {
    if (!address) return;
    fetch(`${API_URL}/api/portfolio/${address}`, { headers: API_HEADERS })
      .then(r => r.json())
      .then((json: PortfolioAPIData) => {
        const totalBalance = json.wallet?.reduce((s, a) => s + (a.valueUSD ?? 0), 0) ?? 0;
        const initBal = json.wallet?.find(a => a.symbol === "INIT")?.balance ?? 0;
        setWalletEmpty(totalBalance === 0);
        setWalletInitBalance(initBal);
      })
      .catch(() => { /* ignore */ });
  }, [address]);

  // Auto-scroll to tx result card when it appears
  useEffect(() => {
    if (transferResult && txResultRef.current) {
      txResultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [transferResult]);

  if (!isConnected) return null;

  // ── Submit to backend (strategy flow) ────────────────────────────────────────
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
      setActiveStrategy(strategy);

      const tlRes = await fetch(`${API_URL}/api/agent/timeline/${strategy.id}`, { headers: API_HEADERS });
      const tlData: ApiResponse<TimelineType> = await tlRes.json();
      if (tlData.success && tlData.data) setTimeline(tlData.data);

      sessionStorage.setItem("intentos_strategy", JSON.stringify(strategy));
      setTimeout(() => router.push("/app/strategy"), 9000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ── Transfer execution (mirrors strategy page two-step flow exactly) ──────────
  const handleTransferProceed = async () => {
    if (!transferConfirm) return;
    setTransferLoading(true);
    try {
      // Step 1: Parse the transfer intent → get a strategy with an ID
      const intentText = `send ${transferConfirm.amount} ${transferConfirm.token} to ${transferConfirm.recipient}`;
      const intentRes = await fetch(`${API_URL}/api/execute/intent`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ text: intentText }),
      });
      const intentData: ApiResponse<Strategy> = await intentRes.json();
      if (!intentData.success || !intentData.data) {
        throw new Error(intentData.error ?? "Failed to parse transfer intent");
      }

      const strategy = intentData.data as Strategy;

      // Step 2: Execute the strategy bundle via the real relayer — same endpoint
      // the Execute button on strategy page calls
      const execRes = await fetch(`${API_URL}/api/execute/${strategy.id}`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ sessionKey: address ?? "", strategy }),
      });
      const execData: ApiResponse<ExecutionResult> = await execRes.json();
      if (!execData.success) {
        throw new Error(execData.error ?? "Execution failed");
      }

      const txHash =
        (execData.data as ExecutionResult & { txHash?: string })?.txHash ?? "";

      setTransferResult(txHash || "confirmed");
      setShowTxToast(true);
      setTimeout(() => setShowTxToast(false), 4000);
    } catch (err) {
      console.error("[Transfer] execution failed:", err);
      setTransferResult("error");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleTransferReject = () => {
    setTransferConfirm(null);
    setTransferResult(null);
  };

  const resetTransferFlow = () => {
    setTransferConfirm(null);
    setTransferResult(null);
    setRawText("");
  };

  // ── Pre-flight validation ─────────────────────────────────────────────────────
  const validateIntentPreflight = async (text: string): Promise<{ message: string; sub: string; action?: "receive" | "deposit" } | null> => {
    if (!address) return null;
    try {
      const res = await fetch(`${API_URL}/api/portfolio/${address}`, { headers: API_HEADERS });
      const json: PortfolioAPIData = await res.json();

      const walletINIT = json.wallet?.find(a => a.symbol === "INIT")?.balance ?? 0;
      const totalRewards = json.rewards?.reduce((s, r) => s + r.balance, 0) ?? 0;
      const totalDelegated = json.staked?.reduce((s, d) => s + d.balance, 0) ?? 0;
      const totalBalance = json.wallet?.reduce((s, a) => s + (a.valueUSD ?? 0), 0) ?? 0;

      setWalletEmpty(totalBalance === 0);

      const lower = text.toLowerCase();
      const amount = parseFloat(text.match(/\b(\d+(?:\.\d+)?)\b/)?.[1] ?? "0");

      if (/\b(stake|delegate)\b/.test(lower)) {
        if (amount > 0 && walletINIT < amount) return { message: `Not enough INIT to stake ${amount} INIT.`, sub: `Your balance: ${walletINIT.toFixed(4)} INIT · Required: ${amount} INIT`, action: "receive" };
        if (walletINIT === 0) return { message: "You have no INIT to stake.", sub: "Receive INIT to your wallet first.", action: "receive" };
      }
      if (/\bswap\b.{0,20}\binit\b/.test(lower)) {
        if (amount > 0 && walletINIT < amount) return { message: "Insufficient INIT for this swap.", sub: `Your balance: ${walletINIT.toFixed(4)} INIT · Required: ${amount} INIT`, action: "receive" };
        if (walletINIT === 0) return { message: "You have no INIT to swap.", sub: "Receive INIT to your wallet first.", action: "receive" };
      }
      // Claim/collect rewards — distinguish "never staked" from "staked but still accruing"
      if (/\b(claim|collect|withdraw).{0,35}(reward|yield|earn|staking)\b|\b(staking).{0,35}(reward|yield)\b/.test(lower)) {
        if (totalDelegated === 0 && totalRewards === 0) {
          return {
            message: "You have no staking positions.",
            sub: "Stake INIT first — rewards start accruing once your delegation is active. This usually takes 1\u20132 epochs.",
          };
        }
        if (totalDelegated > 0 && totalRewards === 0) {
          return {
            message: "No claimable rewards yet.",
            sub: `You have ${totalDelegated.toFixed(4)} INIT staked. Rewards are still accruing — check back after the next epoch (usually a few hours).`,
          };
        }
      }
      if (/\b(unstake|undelegate)\b/.test(lower) && totalDelegated === 0)
        return { message: "You have no staked INIT to unstake.", sub: "Stake INIT first before you can unstake." };
      if (/\b(grow|invest|earn|yield|passive|income)\b/.test(lower) && totalBalance === 0)
        return { message: "Your wallet has no assets to invest.", sub: "Deposit INIT or USDC to begin.", action: "deposit" };

      return null;
    } catch {
      return null;
    }
  };

  // ── Intent input handler ──────────────────────────────────────────────────────
  const handleSubmit = async (text: string) => {
    setSystemResponse(null);
    setError(null);
    setValidationError(null);
    setActiveStrategy(null);
    setTransferConfirm(null);
    setTransferResult(null);

    // 0. System commands
    const sysResponse = getSystemResponse(text, address, walletInitBalance);
    if (sysResponse) {
      setSystemResponse(sysResponse);
      setRawText("");
      return;
    }

    // 1. Transfer/send to wallet — skip strategy, show confirm card
    const transferIntent = parseTransferIntent(text);
    if (transferIntent) {
      setTransferConfirm(transferIntent);
      return;
    }

    // 2. Pre-flight balance validation
    setValidating(true);
    const preflight = await validateIntentPreflight(text);
    setValidating(false);
    if (preflight) {
      setValidationError(preflight);
      return;
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
  const anyActive = timelineActive || !!systemResponse || !!validationError || validating || !!transferConfirm;

  return (
    <>
      {/* Transaction sent toast */}
      <TxSentToast visible={showTxToast} />

      {showDeploy && <DeploymentModal onConfirm={handleDeployConfirm} onDismiss={() => setShowDeploy(false)} />}
      {ambiguity && (
        <AmbiguityModal
          question={ambiguity.question}
          options={ambiguity.options}
          onSelect={handleClarify}
          onDismiss={() => { setAmbiguity(null); submitToApi(`${pendingText} — low risk yield`); }}
        />
      )}

      <div className="flex flex-col h-full w-full max-w-2xl mx-auto px-1">

        {/* Hero — visible when idle */}
        <AnimatePresence>
          {!anyActive && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center justify-center text-center px-4 pb-6"
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,245,212,0.3)] animate-pulse group cursor-pointer"
                style={{ background: "rgba(0,245,212,0.05)", border: "1px solid rgba(0,245,212,0.15)" }}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 transition-transform duration-700 ease-in-out group-hover:rotate-180 drop-shadow-[0_0_8px_rgba(0,245,212,0.8)]"
                >
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                  <circle
                    cx="12" cy="12" r="9"
                    stroke="#00F5D4" strokeWidth="2" strokeLinecap="round"
                    strokeDasharray="35 60" strokeDashoffset="15"
                  />
                  <circle cx="12" cy="12" r="2.5" fill="#00F5D4" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg mb-6 font-medium">
                Hi, <span className="text-[#00F5D4] font-semibold tracking-wide drop-shadow-[0_0_8px_rgba(0,245,212,0.5)] transition-all duration-300">{username ?? (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "there")}</span>
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-normal mb-5 leading-snug">
                What do you want<br />
                <span className="bg-gradient-to-r from-white to-[#00F5D4] text-transparent bg-clip-text">
                  your money to do?
                </span>
              </h1>
              <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                Type a goal in plain English — IntentOS validates, plans, and executes it for you.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active session content */}
        {anyActive && (
          <div className="flex-1 overflow-y-auto pt-6 pb-2 space-y-3">

            {/* ── Transfer confirm flow ─────────────────────────────────── */}
            <AnimatePresence>
              {transferConfirm && !transferResult && (
                <motion.div key="transfer-confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ConfirmTransactionCard
                    transfer={transferConfirm}
                    onProceed={handleTransferProceed}
                    onReject={handleTransferReject}
                    loading={transferLoading}
                  />
                </motion.div>
              )}
              {transferResult && transferResult !== "error" && (
                <div key="transfer-result" ref={txResultRef}>
                  <TransactionResultCard txHash={transferResult} onDone={resetTransferFlow} />
                </div>
              )}
              {transferResult === "error" && (
                <motion.div
                  key="transfer-error"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-300">Transaction failed</p>
                    <p className="text-xs text-red-400/70 mt-1">Please try again or check your connection.</p>
                    <button onClick={resetTransferFlow} className="text-xs text-red-400 underline mt-2">Try again</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Agent Timeline / strategy flow ───────────────────────── */}
            {timelineActive && (
              <div className="space-y-4">
                {error && (
                  <div className="text-sm text-status-error bg-bg-elevated border border-status-error/30 p-4 rounded-xl">
                    <span className="font-bold mr-2">Error:</span> {error}
                  </div>
                )}
                {activeStrategy && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="bg-[#13161D] border border-white/10 p-5 rounded-2xl shadow-xl">
                    <h3 className="text-xs font-bold text-[#00F5D4] uppercase tracking-widest mb-3">IntentOS Plan</h3>
                    <p className="text-sm text-white font-medium leading-relaxed mb-5">{activeStrategy.bundle.explanation}</p>
                    <div className="space-y-2 mb-5">
                      {activeStrategy.bundle.steps.map(step => (
                        <div key={step.index} className="flex gap-3 text-sm">
                          <span className="text-text-muted font-mono whitespace-nowrap">Step {step.index} —</span>
                          <span className="text-gray-300 font-medium">{step.description}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-6 border-t border-white/5 pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-0.5">Estimated Yield</span>
                        <span className="text-[15px] font-black text-[#00F5D4]">{activeStrategy.bundle.estimatedYield > 0 ? `${(activeStrategy.bundle.estimatedYield * 100).toFixed(1)}% APY` : "—"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-0.5">Risk Level</span>
                        <span className="text-[15px] font-black text-white capitalize">{activeStrategy.bundle.riskScore}</span>
                      </div>
                    </div>
                  </motion.div>
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
                  className={
                    systemResponse.type === "receive" ? "mt-4 outline-none" :
                      systemResponse.type === "greeting" ? "mt-4 rounded-3xl p-6 bg-[#13161D]/60 backdrop-blur-md border border-white/5 shadow-2xl relative overflow-hidden" :
                        "rounded-2xl p-4"
                  }
                  style={(systemResponse.type === "receive" || systemResponse.type === "greeting") ? {} : { background: "rgba(0,245,212,0.06)", border: "1px solid rgba(0,245,212,0.18)" }}
                >
                  {systemResponse.type === "receive" && systemResponse.address ? (
                    <ReceiveCard address={systemResponse.address} onDismiss={() => setSystemResponse(null)} />
                  ) : systemResponse.type === "greeting" ? (
                    <div className="relative">
                      <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#00F5D4]/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="flex items-center gap-3 mb-2 relative z-10">
                        <span className="text-2xl">👋</span>
                        <h2 className="text-xl font-bold text-white tracking-tight">{systemResponse.message}</h2>
                      </div>
                      <div className="flex items-center gap-2 mb-4 relative z-10 inline-flex px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-sm backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-pulse shadow-[0_0_8px_#00F5D4]" />
                        <span className="text-[11px] font-medium text-gray-300">Wallet Balance: <span className="text-[#00F5D4] font-bold tracking-wide">{systemResponse.walletBalance?.toFixed(3)} INIT</span></span>
                      </div>
                      <p className="text-[13px] text-gray-400 mb-5 leading-relaxed font-medium relative z-10">What would you like your money to do today?</p>
                      <div className="flex flex-wrap gap-2.5 relative z-10">
                        {[
                          { label: "Stake INIT", q: "Stake INIT" },
                          { label: "Grow Portfolio", q: "grow my portfolio" },
                          { label: "Swap INIT → USDC", q: "Swap INIT to USDC" },
                          { label: "Claim Rewards", q: "claim staking rewards" },
                        ].map(btn => (
                          <button key={btn.q} onClick={() => handleSubmit(btn.q)}
                            className="px-4 py-2 text-[12px] font-semibold rounded-full bg-white/5 border border-white/10 hover:bg-[#00F5D4]/10 hover:border-[#00F5D4]/30 hover:text-[#00F5D4] transition-all text-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 max-w-fit">
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 items-start">
                      <span className="text-lg mt-0.5">{systemResponse.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-text-primary">{systemResponse.message}</p>
                        {systemResponse.type === "help" && (
                          <div className="mt-3 space-y-2">
                            {["• Stake tokens", "• Swap assets", "• Claim rewards", "• Manage your portfolio", "• Enable autopilot strategies"].map(h => (
                              <p key={h} className="text-xs font-medium text-gray-400">{h}</p>
                            ))}
                            <p className="text-xs text-text-muted mt-4">Try typing: <span className="font-mono text-[#00F5D4]/80">stake 1 init</span></p>
                          </div>
                        )}
                        {systemResponse.type === "unknown" && (
                          <>
                            <p className="text-xs text-text-muted mt-2 mb-4 leading-relaxed">IntentOS primarily connects your text to on-chain execution. Try something like:</p>
                            <div className="flex gap-2 flex-wrap relative z-10">
                              {[{ label: "Stake INIT", q: "Stake INIT" }, { label: "Swap Asset", q: "Swap INIT to USDC" }, { label: "Grow Portfolio", q: "grow my portfolio" }].map(btn => (
                                <button key={btn.q} onClick={() => handleSubmit(btn.q)}
                                  className="px-3 py-1.5 text-[11px] font-semibold rounded-full bg-white/5 border border-white/10 hover:bg-[#F59E0B]/10 hover:border-[#F59E0B]/30 hover:text-[#F59E0B] transition-all text-gray-300">
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                        {systemResponse.sub && <p className="text-xs text-text-muted mt-1 leading-relaxed">{systemResponse.sub}</p>}
                        {systemResponse.type === "autopilot" && (
                          <button onClick={() => window.location.href = "/app/autopilot"}
                            className="text-xs mt-3 font-semibold relative z-10 text-[#00F5D4] hover:underline">
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
                            style={{ background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.25)", color: "#00F5D4" }}>
                            <img src="https://registry.testnet.initia.xyz/images/INIT.png" alt="INIT" width={14} height={14} className="rounded-full" />
                            Receive INIT
                          </button>
                        </div>
                      )}
                      {validationError.action === "deposit" && (
                        <div className="flex gap-2 mt-2.5 flex-wrap">
                          <button onClick={() => { setSystemResponse({ icon: "📥", message: "Your Initia Wallet Address", type: "receive", address }); setValidationError(null); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                            style={{ background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.25)", color: "#00F5D4" }}>
                            <img src="https://registry.testnet.initia.xyz/images/INIT.png" alt="INIT" width={14} height={14} className="rounded-full" />
                            Receive INIT
                          </button>
                          <button onClick={() => { setSystemResponse({ icon: "📥", message: "Your Initia Wallet Address", type: "receive", address }); setValidationError(null); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#7C3AED" }}>
                            <img src="https://registry.testnet.initia.xyz/images/USDC.png" alt="USDC" width={14} height={14} className="rounded-full" />
                            Receive USDC
                          </button>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setValidationError(null)} className="text-text-muted hover:text-text-primary text-xs mt-0.5 flex-shrink-0">✕</button>
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
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking wallet balance…
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Intent Input — always at bottom, disabled when offline */}
        <div className="flex-none pt-3 pb-2">
          <IntentInput
            key={rawText}
            onSubmit={handleSubmit}
            loading={loading || validating}
            disabled={!!timeline || !isOnline || transferLoading || !!transferConfirm}
            defaultValue={rawText}
            walletEmpty={walletEmpty}
          />
        </div>
      </div>
    </>
  );
}
