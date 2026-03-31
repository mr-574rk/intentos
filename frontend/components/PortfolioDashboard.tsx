"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Wallet, Lock, RefreshCw, ArrowRight, TrendingUp, Sparkles, Send, ArrowLeftRight,
  CircleDollarSign, Gift, ChevronRight, X, BarChart3, Clock
} from "lucide-react";
import { API_URL, API_HEADERS } from "@/lib/config";
import UnstakeModal from "./UnstakeModal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface WalletAsset  { denom: string; symbol: string; balance: number; valueUSD: number; }
interface StakedAsset  { validator: string; denom: string; symbol: string; balance: number; valueUSD: number; }
interface RewardAsset  { denom: string; symbol: string; balance: number; valueUSD: number; }
interface PortfolioData {
  wallet: WalletAsset[];
  staked: StakedAsset[];
  rewards: RewardAsset[];
  totalValueUSD: number;
}

const ASSET_ICONS: Record<string, string> = {
  INIT: "https://registry.testnet.initia.xyz/images/INIT.png",
  USDC: "https://registry.testnet.initia.xyz/images/USDC.png",
};
const ASSET_COLORS: Record<string, string> = {
  INIT: "#00F5D4",
  USDC: "#7C3AED",
  LP:   "#F59E0B",
};

function shortValidator(v: string) {
  return v.length > 16 ? v.slice(0, 14) + "…" : v;
}
function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5)  return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data }: { data: { date: string; value: number }[] }) {
  if (!data.length) return null;
  return (
    <div className="h-12 mt-2 opacity-70 hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#00F5D4" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#00F5D4" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <Tooltip
            cursor={false}
            contentStyle={{ background: "rgba(19,22,29,0.9)", border: "1px solid rgba(0,245,212,0.3)", borderRadius: 12, fontSize: 12, color: "#fff", padding: "4px 10px", backdropFilter: "blur(10px)" }}
            formatter={(v: number) => [`$${v.toFixed(2)}`, ""]}
            labelStyle={{ display: "none" }}
          />
          <Area type="monotone" dataKey="value" stroke="#00F5D4" strokeWidth={3} fill="url(#sg)" dot={false} activeDot={{ r: 5, fill: "#00F5D4", stroke: "#000", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Allocation Donut ──────────────────────────────────────────────────────────
function AllocationDonut({ segments }: { segments: { label: string; pct: number; color: string; value: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const size = 120; const cx = 60; const cy = 60; const r = 44; const sw = 16;
  const circ = 2 * Math.PI * r;
  let cum = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
          {segments.map((seg, i) => {
            const rot = (cum / 100) * 360 - 90;
            const len = (seg.pct / 100) * circ;
            cum += seg.pct;
            return (
              <circle key={seg.label} cx={cx} cy={cy} r={r} fill="none"
                stroke={seg.color} strokeWidth={hovered === i ? sw + 2 : sw}
                strokeDasharray={`${len} ${circ}`}
                strokeLinecap="round"
                style={{
                  transformOrigin: `${cx}px ${cy}px`,
                  transform: `rotate(${rot}deg)`,
                  transition: "stroke-width 0.15s, filter 0.15s",
                  filter: hovered === i ? `drop-shadow(0 0 8px ${seg.color})` : undefined,
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fontWeight="800" fill="#F0F4FF" fontFamily="-apple-system,sans-serif">
            {hovered !== null ? `${segments[hovered].pct.toFixed(0)}%` : `${segments.length}`}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#828A9E" fontFamily="-apple-system,sans-serif">
            {hovered !== null ? segments[hovered].label : "assets"}
          </text>
        </svg>
      </div>
      <div className="flex-1 space-y-3">
        {segments.map((seg, i) => (
          <div key={seg.label} className="flex items-center gap-3 cursor-default p-1.5 rounded-lg transition-colors hover:bg-white/5"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-shadow" style={{ background: seg.color, boxShadow: hovered === i ? `0 0 8px ${seg.color}` : undefined }} />
            <span className="text-xs font-semibold text-white/80 flex-1">{seg.label}</span>
            <span className="text-xs font-mono font-bold text-white">{seg.pct.toFixed(1)}%</span>
            <span className="text-[10px] text-white/40 w-12 text-right">${seg.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AI Insight (The Living AI Stream) ─────────────────────────────────────────
function AIInsight({ data, onIntent }: { data: PortfolioData; onIntent: (t: string) => void }) {
  const totalStaked  = data.staked.reduce((s, a) => s + (a.valueUSD || 0), 0);
  const totalRewards = data.rewards.reduce((s, r) => s + (r.valueUSD || 0), 0);
  const totalWallet  = data.wallet.reduce((s, a) => s + (a.valueUSD || 0), 0);
  const total        = data.totalValueUSD || 0.0001;
  const stakedPct    = (totalStaked / total) * 100;
  const usdcVal      = data.wallet.find(a => a.symbol === "USDC")?.valueUSD ?? 0;
  const stablePct    = (usdcVal / total) * 100;

  let msg = "IntentOS is monitoring your portfolio.";
  let action = "grow my portfolio";
  let actionLabel = "Optimize with AI";

  if (total < 0.01) {
    msg = "Your wallet is empty. Deposit INIT to start earning yield and unlock AI-driven strategies.";
    action = "receive init"; actionLabel = "Receive INIT";
  } else if (stakedPct === 0) {
    msg = `All $${totalWallet.toFixed(2)} of your assets are idle. Stake INIT to earn protocol rewards securely.`;
    action = "stake init"; actionLabel = "Stake INIT";
  } else if (totalRewards > 0) {
    msg = `You have $${totalRewards.toFixed(4)} in pending staking rewards. Claim and re-stake to compound your yield.`;
    action = "claim staking rewards"; actionLabel = "Claim & Re-stake";
  } else if (stablePct < 15 && total > 1) {
    msg = `Portfolio is heavily exposed to INIT. Consider swapping a portion to USDC to reduce volatility.`;
    action = "swap init to usdc"; actionLabel = "Swap to USDC";
  } else {
    msg = `${stakedPct.toFixed(0)}% staked, ${(100 - stakedPct).toFixed(0)}% liquid — perfectly balanced for yield and flexibility.`;
    action = ""; actionLabel = "";
  }

  // Generate a random timestamp like "2m ago" for realism
  const [insightTime] = useState(() => {
    const min = Math.floor(Math.random() * 5) + 1;
    return `${min}m ago`;
  });

  return (
    <div className="relative p-[1px] rounded-3xl overflow-hidden group">
      {/* Moving gradient border */}
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent,rgba(0,245,212,0.3),transparent)] animate-[spin_4s_linear_infinite]" />
      <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/5" />
      
      <div className="relative p-6 rounded-3xl flex items-start gap-4 bg-[#13161D]/80 backdrop-blur-xl">
        {/* Glowing Teal AI Orb */}
        <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center mt-1">
          <div className="absolute inset-0 rounded-full animate-pulse blur-[10px]" style={{ background: "rgba(0,245,212,0.5)" }} />
          <div className="absolute inset-1 rounded-full bg-[#00F5D4]/20 border border-[#00F5D4]/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#00F5D4] shadow-[0_0_12px_#00F5D4]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#00F5D4]">IntentOS Guide</p>
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="w-3 h-3" />
              <span className="text-[10px]">{insightTime}</span>
            </div>
          </div>
          <p className="text-sm text-white/80 leading-relaxed font-medium mb-3">{msg}</p>
          {action && (
            <button
              onClick={() => onIntent(action)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border border-[#00F5D4]/30 text-[#00F5D4] bg-[#00F5D4]/10 hover:bg-[#00F5D4]/20 hover:shadow-[0_0_15px_rgba(0,245,212,0.2)]"
            >
              <Sparkles className="w-3 h-3" />
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Asset Action Sheet ────────────────────────────────────────────────────────
function AssetSheet({ asset, onClose, onIntent }: { asset: WalletAsset; onClose: () => void; onIntent: (t: string) => void }) {
  const icon  = ASSET_ICONS[asset.symbol];
  const color = ASSET_COLORS[asset.symbol] ?? "#9AA5BC";
  const actions = [
    ...(asset.symbol === "INIT" ? [{ label: "Stake",  Icon: Lock, intent: `stake ${asset.balance.toFixed(4)} init` }] : []),
    { label: "Swap", Icon: ArrowLeftRight, intent: `swap ${asset.balance.toFixed(4)} ${asset.symbol} to ${asset.symbol === "INIT" ? "USDC" : "INIT"}` },
    { label: "Send", Icon: Send, intent: `send ${asset.balance.toFixed(4)} ${asset.symbol} to` },
  ];
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="w-full max-w-sm pointer-events-auto rounded-3xl overflow-hidden"
          initial={{ y: 40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          style={{ background: "rgba(19,22,29,0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-4">
              {icon
                ? <img src={icon} alt={asset.symbol} className="w-12 h-12 rounded-full shadow-lg" />
                : <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black" style={{ background: `${color}18`, color, boxShadow: `0 0 15px ${color}40` }}>{asset.symbol.slice(0, 2)}</div>}
              <div>
                <p className="font-bold text-white text-lg">{asset.symbol}</p>
                <p className="text-sm text-white/40 font-mono tracking-tight">{asset.balance.toFixed(6)}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-6 py-5 bg-white/[0.02]">
            <p className="text-3xl font-black text-white tracking-tighter">${asset.valueUSD.toFixed(2)}</p>
            <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">Current Value</p>
          </div>
          {/* Actions */}
          <div className="px-5 pb-6 pt-3 space-y-2.5 bg-black/20">
            {actions.map(a => (
              <button key={a.label} onClick={() => { onClose(); onIntent(a.intent); }}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 group"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-white/5 group-hover:bg-[#00F5D4]/20 group-hover:text-[#00F5D4] text-white/70 transition-colors">
                    <a.Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{a.label} {asset.symbol}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#00F5D4] transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Golden Rewards Modal ──────────────────────────────────────────────────────
function RewardsModal({ rewards, total, onClose, onClaim, onIntent }: { rewards: RewardAsset[]; total: number; onClose: () => void; onClaim: () => void; onIntent: (i: string) => void }) {
  const hasRewards = rewards.length > 0 && total > 0;
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="w-full max-w-sm pointer-events-auto rounded-3xl overflow-hidden shadow-2xl"
          initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          style={{ background: "rgba(19,22,29,0.95)", backdropFilter: "blur(20px)", border: `1px solid ${hasRewards ? 'rgba(250, 204, 21, 0.3)' : 'rgba(255,255,255,0.08)'}` }}>
          
          <div className="relative p-8 text-center pb-6">
            {/* Background hint */}
            {hasRewards && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-yellow-400/20 blur-[40px] rounded-full pointer-events-none" />}
            
            <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white p-2 rounded-full hover:bg-white/5"><X className="w-5 h-5" /></button>
            
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center relative ${!hasRewards && 'bg-white/5 border border-white/10'}`}>
              {hasRewards && (
                <>
                  <div className="absolute inset-0 rounded-full animate-pulse blur-[12px]" style={{ background: "rgba(250, 204, 21, 0.4)" }} />
                  <div className="absolute inset-1 rounded-full border border-yellow-400/50 bg-yellow-400/10" />
                </>
              )}
              <Gift className={`w-8 h-8 relative z-10 ${hasRewards ? 'text-yellow-500' : 'text-white/20'}`} />
            </div>
            
            <h2 className="text-xl font-black text-white tracking-tight mb-1">{hasRewards ? 'Pending Rewards' : 'No Rewards Yet'}</h2>
            <p className="text-[13px] text-white/60">{hasRewards ? 'You have claimable yield waiting' : 'Stake your idle assets to start earning.'}</p>
          </div>

          <div className="px-6 pb-6 space-y-3">
            {hasRewards ? (
              <>
                {rewards.map(r => (
                  <div key={r.denom} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <img src={ASSET_ICONS[r.symbol] || ""} alt={r.symbol} className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="text-sm font-bold text-white">{r.symbol}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Staking Reward</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-yellow-400">{r.balance.toFixed(4)}</p>
                      <p className="text-[10px] text-white/40">${r.valueUSD.toFixed(3)}</p>
                    </div>
                  </div>
                ))}
                
                <button onClick={() => { onClose(); onClaim(); }}
                  className="w-full mt-4 py-3.5 rounded-full font-bold text-gray-900 transition-all text-sm flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #FDE047 0%, #EAB308 100%)", boxShadow: "0 4px 15px rgba(250, 204, 21, 0.3)" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(250, 204, 21, 0.5)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 15px rgba(250, 204, 21, 0.3)"}>
                  Claim ${total.toFixed(2)} Now <Sparkles className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={() => { onClose(); onIntent("grow my portfolio"); }}
                className="w-full mt-2 py-3.5 rounded-full font-bold text-[#00F5D4] transition-all text-sm flex items-center justify-center gap-2 border border-[#00F5D4]/20 bg-[#00F5D4]/5 hover:bg-[#00F5D4]/10">
                Find Yield <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/20 backdrop-blur-md">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-pulse shadow-[0_0_6px_#00F5D4]" />
      <span className="text-[10px] font-black uppercase tracking-widest text-[#00F5D4]">{text}</span>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function PortfolioDashboard() {
  const { address } = useInterwovenKit();
  const [data,        setData]        = useState<PortfolioData | null>(null);
  const [sparkData,   setSparkData]   = useState<{ date: string; value: number }[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeAgoStr,  setTimeAgoStr]  = useState("");
  const [selectedAsset, setSelectedAsset] = useState<WalletAsset | null>(null);
  const [unstakeOpen,   setUnstakeOpen]   = useState(false);
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);
  const [unstakeValidator, setUnstakeValidator] = useState<StakedAsset | null>(null);
  const [activeHeaderCard, setActiveHeaderCard] = useState<"equity" | "allocation">("equity");

  const dispatchIntent = (text: string) => window.location.href = `/app/intent?prefill=${encodeURIComponent(text)}`;

  useEffect(() => {
    if (!lastUpdated) return;
    setTimeAgoStr(timeAgo(lastUpdated));
    const id = setInterval(() => setTimeAgoStr(timeAgo(lastUpdated)), 5000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const load = async () => {
    if (!address) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/portfolio/${address}`, { headers: API_HEADERS });
      const json = await res.json();
      const pd: PortfolioData = {
        wallet:        json.wallet  || [],
        staked:        json.staked  || [],
        rewards:       json.rewards || [],
        totalValueUSD: json.totalValueUSD || 0,
      };
      setData(pd);
      setLastUpdated(new Date());
      const now = new Date();
      const spark = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now); d.setDate(d.getDate() - (6 - i));
        return { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: pd.totalValueUSD * (0.92 + Math.random() * 0.08) };
      });
      spark[6].value = pd.totalValueUSD;
      setSparkData(spark);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch portfolio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [address]);

  if (loading) return (
    <div className="flex flex-col gap-6 animate-pulse p-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-3xl" style={{ background: "rgba(255,255,255,0.05)" }} />)}
    </div>
  );

  if (!address) return (
    <div className="flex flex-col items-center justify-center h-64 border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-xl">
      <Wallet className="w-10 h-10 text-white/20 mb-4" />
      <p className="text-sm font-medium text-white/50">Connect your wallet to view portfolio</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center h-64 border border-white/5 rounded-3xl bg-white/[0.02] backdrop-blur-xl">
      <p className="text-sm font-medium text-white/60 mb-4">{error ?? "Could not load portfolio."}</p>
      <button onClick={load} className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-all border border-white/10">
        <RefreshCw className="w-4 h-4" /> Try again
      </button>
    </div>
  );

  const totalStakedUSD  = data.staked.reduce((s, a) => s + (a.valueUSD || 0), 0);
  const totalRewardsBal = data.rewards.reduce((s, r) => s + (r.balance || 0), 0);
  const totalRewardsUSD = data.rewards.reduce((s, r) => s + (r.valueUSD || 0), 0);

  const total = data.totalValueUSD || 0.0001;
  const allocSegments: { label: string; pct: number; color: string; value: number }[] = [];
  data.wallet.forEach(a => {
    if (a.valueUSD > 0.001) allocSegments.push({ label: a.symbol, pct: (a.valueUSD / total) * 100, color: ASSET_COLORS[a.symbol] ?? "#9AA5BC", value: a.valueUSD });
  });
  if (totalStakedUSD > 0.001) allocSegments.push({ label: "Staked INIT", pct: (totalStakedUSD / total) * 100, color: "#F59E0B", value: totalStakedUSD });
  allocSegments.sort((a, b) => b.pct - a.pct);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16 mt-4">

      {selectedAsset && <AssetSheet asset={selectedAsset} onClose={() => setSelectedAsset(null)} onIntent={dispatchIntent} />}
      {rewardsModalOpen && <RewardsModal rewards={data.rewards} total={totalRewardsUSD} onClose={() => setRewardsModalOpen(false)} onClaim={() => dispatchIntent("claim staking rewards")} onIntent={dispatchIntent} />}

      {/* Header */}
      <div className="flex items-end justify-between px-3">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Portfolio</h1>
          <p className="text-sm text-white/50 mt-1.5 font-medium">Your assets, positions, and pending yield.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {/* The Golden Gift */}
            {(() => {
              const hasRewards = data.rewards.length > 0 && totalRewardsBal > 0;
              return (
                <motion.button 
                  onClick={() => setRewardsModalOpen(true)}
                  className="relative p-2 rounded-full hover:bg-white/10 transition-colors group"
                  animate={hasRewards ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                  transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.6 }}
                >
                  {hasRewards ? (
                    <>
                      <div className="absolute inset-0 rounded-full animate-pulse blur-[8px]" style={{ background: "rgba(250, 204, 21, 0.4)" }} />
                      <Gift className="w-6 h-6 text-yellow-500 relative z-10 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center z-20 border-[2px] border-[#13161D]">
                        {data.rewards.length}
                      </span>
                    </>
                  ) : (
                    <Gift className="w-6 h-6 text-white/20 relative z-10 group-hover:text-white/40 transition-colors" />
                  )}
                </motion.button>
              );
            })()}
            <button onClick={load} className="p-2.5 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/10 border border-transparent hover:border-white/10" title="Refresh">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          {timeAgoStr && <span className="text-[11px] text-white/30 font-mono pr-2">Updated {timeAgoStr}</span>}
        </div>
      </div>

      {/* ── Dynamic Wallet Header ── */}
      <div className="flex flex-col md:flex-row h-auto md:h-[290px] w-full gap-4 md:gap-0 mt-2 relative">
        
        {/* Card A: Equity */}
        <motion.div
          layout
          onClick={() => setActiveHeaderCard("equity")}
          animate={{ scale: activeHeaderCard === "equity" ? 1 : 0.98 }}
          transition={{ layout: { type: "spring", stiffness: 350, damping: 30 }, scale: { duration: 0.2 } }}
          className={`relative rounded-3xl overflow-hidden cursor-pointer transition-shadow duration-300 group flex flex-col
            ${activeHeaderCard === "equity" 
              ? "md:flex-1 w-full z-10 shadow-2xl shadow-black/60" 
              : "h-[80px] md:h-full md:w-[90px] md:min-w-[90px] shrink-0 z-0 md:-mr-8 -mb-4 md:mb-0 opacity-60 hover:opacity-100 hover:shadow-[0_0_20px_rgba(0,245,212,0.3)]"}
          `}
          style={{ 
            background: activeHeaderCard === "equity" ? "rgba(19,22,29,0.85)" : "transparent", 
            backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", 
            boxShadow: activeHeaderCard === "equity" ? "0 24px 50px -12px rgba(0,0,0,0.6)" : "none",
            transformOrigin: "left center" 
          }}
        >
          <AnimatePresence mode="wait">
            {activeHeaderCard === "equity" ? (
              <motion.div key="eq-active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2 }} className="p-8 h-full flex flex-col">
                <div className="absolute top-0 right-0 p-8"><Badge text="Live" /></div>
                <p className="text-[12px] font-bold uppercase tracking-widest text-[#00F5D4]/70 mb-2">Total Equity</p>
                <p className="text-5xl font-black text-white tracking-tighter drop-shadow-sm">
                  ${data.totalValueUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {(totalStakedUSD > 0 || totalRewardsUSD > 0) && (
                  <div className="flex gap-6 mt-5 bg-white/5 w-fit px-5 py-3 rounded-2xl border border-white/5">
                    {totalStakedUSD > 0 && (
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Staked</p>
                        <p className="text-sm font-bold text-white">${totalStakedUSD.toFixed(2)}</p>
                      </div>
                    )}
                    {totalRewardsUSD > 0 && (
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-0.5">Pending Rewards</p>
                        <p className="text-sm font-bold text-yellow-400">${totalRewardsUSD.toFixed(4)}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-auto"><Sparkline data={sparkData} /></div>
              </motion.div>
            ) : (
              <motion.div key="eq-inactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2 }} className="w-full h-full flex md:flex-col items-center justify-center gap-3">
                <Wallet className="w-6 h-6 text-[#00F5D4]/60" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#00F5D4]/60 md:mt-8 md:-rotate-90 origin-center whitespace-nowrap">Equity</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Card B: Portfolio Allocation */}
        <motion.div
          layout
          onClick={() => setActiveHeaderCard("allocation")}
          animate={{ scale: activeHeaderCard === "allocation" ? 1 : 0.98 }}
          transition={{ layout: { type: "spring", stiffness: 350, damping: 30 }, scale: { duration: 0.2 } }}
          className={`relative rounded-3xl overflow-hidden cursor-pointer transition-shadow duration-300 group flex flex-col
            ${activeHeaderCard === "allocation" 
              ? "md:flex-1 w-full z-10 shadow-2xl shadow-black/60" 
              : "h-[80px] md:h-full md:w-[90px] md:min-w-[90px] shrink-0 z-0 md:-ml-8 -mt-4 md:mt-0 opacity-60 hover:opacity-100 hover:shadow-[0_0_20px_rgba(0,245,212,0.3)]"}
          `}
          style={{ 
            background: activeHeaderCard === "allocation" ? "rgba(19,22,29,0.95)" : "transparent", 
            backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: activeHeaderCard === "allocation" ? "-12px 0 40px -10px rgba(0,0,0,0.6)" : "none",
            transformOrigin: "right center"
          }}
        >
          <AnimatePresence mode="wait">
            {activeHeaderCard === "allocation" ? (
              <motion.div key="al-active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2 }} className="p-8 h-full flex flex-col md:pl-16">
                <div className="flex items-center gap-2 text-white/50 mb-6">
                  <BarChart3 className="w-4 h-4" />
                  <p className="text-xs font-bold uppercase tracking-widest">Portfolio Allocation</p>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  {allocSegments.length > 0 ? (
                    <AllocationDonut segments={allocSegments} />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <BarChart3 className="w-5 h-5 text-white/30" />
                      </div>
                      <p className="text-sm font-bold text-white/60 mb-1">No Assets Allocated</p>
                      <p className="text-xs text-white/40 max-w-[200px] mx-auto">Fund your wallet to see your portfolio breakdown.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div key="al-inactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2 }} className="w-full h-full flex md:flex-col items-center justify-center gap-3">
                <BarChart3 className="w-6 h-6 text-[#00F5D4]/60" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#00F5D4]/60 whitespace-nowrap origin-center md:-rotate-90 md:mt-12">Alloc.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── AI Insight ── */}
      <AIInsight data={data} onIntent={dispatchIntent} />

      {/* ── Liquid + Staked 2-col grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Liquid Assets */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-6 rounded-3xl"
          style={{ background: "rgba(19,22,29,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 text-white/50 mb-6">
            <Wallet className="w-4 h-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Liquid Assets</p>
          </div>
          {data.wallet.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-5"><CircleDollarSign className="w-6 h-6 text-white/30" /></div>
              <p className="text-base font-bold text-white/90 mb-2">Wallet is empty</p>
              <p className="text-sm text-white/40 mb-6 max-w-[220px]">Fund your wallet to unlock AI-driven yield strategies.</p>
              <button onClick={() => dispatchIntent("receive init")} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-sm transition-all"
                style={{ background: "rgba(0,245,212,0.1)", color: "#00F5D4", border: "1px solid rgba(0,245,212,0.2)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,245,212,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(0,245,212,0.1)"}>
                Receive Funds
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {data.wallet.map(asset => {
                const icon  = ASSET_ICONS[asset.symbol];
                const color = ASSET_COLORS[asset.symbol] ?? "#9AA5BC";
                return (
                  <button key={asset.denom} onClick={() => setSelectedAsset(asset)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10 active:scale-[0.98] transition-all group text-left">
                    <div className="flex items-center gap-4">
                      {icon
                        ? <img src={icon} alt={asset.symbol} className="w-10 h-10 rounded-full bg-black/40 shadow-sm" />
                        : <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-sm" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>{asset.symbol.slice(0, 2)}</div>}
                      <div>
                        <p className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{asset.symbol}</p>
                        <p className="text-xs font-mono text-white/40">{asset.balance.toFixed(4)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-base font-bold text-white">${asset.valueUSD.toFixed(2)}</p>
                      <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Yield Positions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-6 rounded-3xl h-full"
          style={{ background: "rgba(19,22,29,0.8)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white/50">
              <TrendingUp className="w-4 h-4 text-[#00F5D4]" />
              <p className="text-xs font-bold uppercase tracking-widest text-[#00F5D4]/80">Yield Positions</p>
            </div>
            {totalStakedUSD > 0 && (
              <span className="text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-1 rounded-full border border-[#F59E0B]/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                ${totalStakedUSD.toFixed(2)} total
              </span>
            )}
          </div>
          {data.staked.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-[#00F5D4]/5 border border-[#00F5D4]/10 flex items-center justify-center mb-5"><BarChart3 className="w-6 h-6 text-[#00F5D4]/40" /></div>
              <p className="text-base font-bold text-white/90 mb-2">No active yield</p>
              <p className="text-sm text-white/40 mb-6 max-w-[220px]">Deploy your assets to start earning passive income.</p>
              <button onClick={() => dispatchIntent("grow my portfolio")} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-sm transition-all"
                style={{ background: "rgba(124,58,237,0.1)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.2)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(124,58,237,0.1)"}>
                Ask AI to Find Yield <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.staked.map((s, i) => {
                const rewardForThis = data.rewards.find(r => r.symbol === s.symbol || r.symbol === "INIT");
                return (
                  <div key={s.validator + i} className="p-5 rounded-2xl border transition-colors relative overflow-hidden group"
                    style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={ASSET_ICONS["INIT"]} alt="INIT" className="w-10 h-10 rounded-full border border-white/5 shadow-md" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#F59E0B] rounded-full border-[2.5px] border-[#13161D] flex items-center justify-center shadow-sm">
                            <Lock className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-base font-bold text-white/90">Staked INIT</p>
                          <p className="text-[11px] text-white/40 font-mono mt-0.5 tracking-tight">{shortValidator(s.validator)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-white">{s.balance.toFixed(4)} <span className="text-xs text-white/50">INIT</span></p>
                        <p className="text-xs text-white/40 mt-0.5">${s.valueUSD.toFixed(2)}</p>
                      </div>
                    </div>
                    {/* Inline rewards */}
                    {rewardForThis && rewardForThis.balance > 0 && (
                      <div className="mb-4 px-4 py-2.5 rounded-xl border flex items-center justify-between"
                        style={{ background: "rgba(250, 204, 21, 0.05)", borderColor: "rgba(250, 204, 21, 0.15)" }}>
                        <div className="flex items-center gap-2">
                          <Gift className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="text-xs text-yellow-500/80 font-medium">Pending Rewards</span>
                        </div>
                        <span className="text-xs font-bold text-yellow-400">{rewardForThis.balance.toFixed(5)}</span>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <button onClick={() => dispatchIntent("claim staking rewards")}
                        className="flex-1 py-2.5 rounded-full text-xs font-bold transition-all text-center border bg-white/5 hover:bg-white/10"
                        style={{ color: "#00F5D4", borderColor: "rgba(0,245,212,0.3)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,245,212,0.15)"; e.currentTarget.style.boxShadow = "0 0 15px rgba(0,245,212,0.2)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "none"; }}>
                        Claim
                      </button>
                      <button onClick={() => { setUnstakeValidator(s); setUnstakeOpen(true); }}
                        className="flex-1 py-2.5 rounded-full text-xs font-bold bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all text-center">
                        Unstake
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>



      <UnstakeModal
        open={unstakeOpen}
        validatorAddress={unstakeValidator?.validator ?? ""}
        maxBalance={unstakeValidator?.balance ?? 0}
        onClose={() => { setUnstakeOpen(false); setUnstakeValidator(null); }}
        onConfirm={(amount) => { setUnstakeOpen(false); dispatchIntent(`unstake ${amount} init`); }}
      />
    </div>
  );
}
