"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Award, Wallet, Lock, RefreshCw, Zap, ArrowRight, CircleDollarSign } from "lucide-react";
import { API_URL } from "@/lib/config";
import UnstakeModal from "./UnstakeModal";

// ── Types ─────────────────────────────────────────────────────
interface WalletAsset   { denom: string; symbol: string; balance: number; valueUSD: number; }
interface StakedAsset   { validator: string; denom: string; symbol: string; balance: number; valueUSD: number; }
interface RewardAsset   { denom: string; symbol: string; balance: number; valueUSD: number; }
interface PortfolioData {
  wallet:        WalletAsset[];
  staked:        StakedAsset[];
  rewards:       RewardAsset[];
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

const MOCK_APY = "14.2%"; // For demo purposes on staked INIT

function shortValidator(v: string) {
  return v.startsWith("initvaloper")
    ? v.slice(0, 16) + "…"
    : v.slice(0, 12) + "…";
}

// ── Sleek Sparkline ───────────────────────────────────
function BalanceSparkline({ data }: { data: { date: string; value: number }[] }) {
  if (data.length === 0) return null;
  return (
    <div className="h-10 mt-1 opacity-70 hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#00F5D4" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#00F5D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <Tooltip
            cursor={false}
            contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(0,245,212,0.3)", borderRadius: 12, fontSize: 12, color: "#fff", padding: "4px 10px", backdropFilter: "blur(8px)" }}
            formatter={(v: number) => [`$${v.toFixed(2)}`, ""]}
            labelStyle={{ display: "none" }}
          />
          <Area type="monotone" dataKey="value" stroke="#00F5D4" strokeWidth={2.5} fill="url(#sg)" dot={false} activeDot={{ r: 4, fill: "#00F5D4", stroke: "#000", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function PortfolioDashboard() {
  const { address } = useInterwovenKit();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [sparkData, setSparkData] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [hideSmall, setHideSmall] = useState(true);

  // Unstake modal state
  const [unstakeOpen, setUnstakeOpen] = useState(false);
  const [unstakeValidator, setUnstakeValidator] = useState<StakedAsset | null>(null);

  const dispatchIntent = (text: string) => {
    window.location.href = `/app/intent?prefill=${encodeURIComponent(text)}`;
  };

  const load = async () => {
    if (!address) { setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_URL}/api/portfolio/${address}`);
      const json = await res.json();
      
      // Since API returns raw data directly:
      const portfolioData: PortfolioData = {
        wallet: json.wallet || [],
        staked: json.staked || [],
        rewards: json.rewards || [],
        totalValueUSD: json.totalValueUSD || 0,
      };
      
      setData(portfolioData);

      // Sparkline mock data
      const now   = new Date();
      const spark = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        return {
          date:  d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: portfolioData.totalValueUSD * (0.92 + Math.random() * 0.08),
        };
      });
      spark[spark.length - 1].value = portfolioData.totalValueUSD;
      setSparkData(spark);
    } catch (e) {
      console.error(e);
      setError("Failed to fetch portfolio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [address]);

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-[24px]" style={{ background: "rgba(255,255,255,0.03)" }} />
        ))}
      </div>
    );
  }

  // disconnected
  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-white/5 rounded-[32px] bg-white/[0.02] backdrop-blur-xl">
        <Wallet className="w-10 h-10 text-white/20 mb-4" />
        <p className="text-sm font-medium text-white/50">Connect your wallet to view portfolio</p>
      </div>
    );
  }

  // error
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-white/5 rounded-[32px] bg-white/[0.02] backdrop-blur-xl">
        <p className="text-sm font-medium text-white/60 mb-4">{error ?? "Could not load portfolio."}</p>
        <button onClick={load} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all">
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  const totalStakedUSD  = data.staked.reduce((s, a) => s + (a.valueUSD || 0), 0);
  const totalRewardsUSD = data.rewards.reduce((s, a) => s + (a.valueUSD || 0), 0);
  const walletAssets    = hideSmall ? data.wallet.filter(a => a.valueUSD >= 0.01) : data.wallet;
  const hiddenCount     = hideSmall ? data.wallet.length - walletAssets.length : 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 mt-2">
      <div className="flex items-start justify-between px-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Portfolio</h1>
          <p className="text-sm text-white/50 mt-1">Your assets, active strategies, and 7-day performance.</p>
        </div>
        <button onClick={load} className="p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/5" title="Refresh portfolio">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* ── Total Value Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-[32px] relative overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 24px 48px -12px rgba(0,0,0,0.5)" }}
      >
        <div className="absolute top-0 right-0 p-8">
          <Badge text="Live" />
        </div>
        
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Total Equity</p>
        <div className="flex items-end gap-3 z-10 relative">
          <p className="text-5xl font-black text-white tracking-tighter">
            ${data.totalValueUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="mt-8">
          <BalanceSparkline data={sparkData} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ── Liquid Assets ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-6 rounded-[28px] h-full"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white/50">
              <Wallet className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-widest">Liquid Assets</p>
            </div>
            {/* Hide small toggle (Apple-style) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                Hide Small {hiddenCount > 0 && <span className="bg-[#00F5D4]/20 text-[#00F5D4] px-1.5 rounded">{hiddenCount}</span>}
              </span>
              <button 
                onClick={() => setHideSmall(!hideSmall)}
                className="relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none"
                style={{ background: hideSmall ? "#00F5D4" : "rgba(255,255,255,0.15)" }}
              >
                <span 
                  className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200"
                  style={{ transform: hideSmall ? "translateX(16px)" : "translateX(0)" }}
                />
              </button>
            </div>
          </div>

          {walletAssets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
               <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                 <CircleDollarSign className="w-5 h-5 text-white/30" />
               </div>
               <p className="text-sm font-semibold text-white/80 mb-2">Your wallet is empty</p>
               <p className="text-xs text-white/40 mb-6 max-w-[200px]">Fund your wallet to unlock AI-driven yield strategies.</p>
               <button onClick={() => window.location.href = "?receive=1"} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs"
                 style={{ background: "rgba(0,245,212,0.1)", color: "#00F5D4", border: "1px solid rgba(0,245,212,0.2)" }}>
                 Fund via Fiat or Crypto
               </button>
            </div>
          ) : (
            <div className="space-y-2">
              {walletAssets.map((asset) => {
                const icon = ASSET_ICONS[asset.symbol];
                const color = ASSET_COLORS[asset.symbol] ?? "#9AA5BC";
                return (
                  <div key={asset.denom} className="flex items-center justify-between p-3 rounded-[16px] hover:bg-white/[0.04] transition-colors group cursor-default">
                    <div className="flex items-center gap-4">
                      {icon ? (
                        <img src={icon} alt={asset.symbol} className="w-10 h-10 rounded-full bg-black/20 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0" style={{ background: `${color}18`, color }}>
                          {asset.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-[#00F5D4] transition-colors">{asset.symbol}</p>
                        <p className="text-[11px] font-mono font-medium text-white/40">{asset.balance.toFixed(4)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-bold text-white">${asset.valueUSD.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Staked Positions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-6 rounded-[28px] h-full"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white/50">
              <Lock className="w-4 h-4" />
              <p className="text-xs font-bold uppercase tracking-widest">Yield Positions</p>
            </div>
            {data.staked.length > 0 && (
              <span className="text-[10px] font-bold text-[#00F5D4] bg-[#00F5D4]/10 px-2 py-1 rounded-md border border-[#00F5D4]/20">
                Avg APY {MOCK_APY}
              </span>
            )}
          </div>

          {data.staked.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
               <div className="w-12 h-12 rounded-full bg-[#00F5D4]/5 border border-[#00F5D4]/10 flex items-center justify-center mb-4">
                 <Zap className="w-5 h-5 text-[#00F5D4]/50" />
               </div>
               <p className="text-sm font-semibold text-white/80 mb-2">No active yield</p>
               <p className="text-xs text-white/40 mb-6 max-w-[200px]">Deploy your assets to start earning passive income.</p>
               <button onClick={() => dispatchIntent("grow my portfolio")} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs"
                 style={{ background: "rgba(124,58,237,0.1)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.2)" }}>
                 Ask AI to Find Yield <ArrowRight className="w-3 h-3" />
               </button>
            </div>
          ) : (
            <div className="space-y-4">
              {data.staked.map((s, i) => {
                const reward = data.rewards[0]; 
                return (
                  <div key={s.validator + i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] relative group hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={ASSET_ICONS["INIT"]} alt="INIT" className="w-8 h-8 rounded-full" />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#7C3AED] rounded-full border-2 border-bg-primary flex items-center justify-center">
                            <Lock className="w-2 h-2 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-tight">Staked INIT</p>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5">{shortValidator(s.validator)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{s.balance.toFixed(2)} INIT</p>
                        <p className="text-[10px] text-white/40">${s.valueUSD.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                       <button onClick={() => dispatchIntent("claim staking rewards")} className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#00F5D4]/10 text-[#00F5D4] hover:bg-[#00F5D4]/20 transition-colors text-center border border-[#00F5D4]/20">
                          Claim
                       </button>
                       <button onClick={() => { setUnstakeValidator(s); setUnstakeOpen(true); }} className="flex-1 py-2 rounded-lg text-xs font-bold bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-center">
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

// ── Simple Badge Component ──
function Badge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00F5D4]/10 border border-[#00F5D4]/20">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-pulse"></span>
      <span className="text-[10px] font-black uppercase tracking-wider text-[#00F5D4]">{text}</span>
    </div>
  );
}
