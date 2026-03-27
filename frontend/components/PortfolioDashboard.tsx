"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Portfolio } from "../types";
import { API_URL } from "@/lib/config";


const ASSET_COLORS: Record<string, string> = {
  INIT: "#00F5D4",
  USDC: "#7C3AED",
  LP: "#F59E0B",
  uintos: "#00F5D4",
};

/** Convert a micro-denom balance to display units */
function toDisplay(amount: string, decimals = 6) {
  return (parseFloat(amount) / 10 ** decimals);
}

interface CoinBalance { denom: string; amount: string; }

function Sparkline({ data }: { data: { date: string; value: number }[] }) {
  if (!data.length) return null;
  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#00F5D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fill: "#828A9E", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#161B26",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              fontSize: 12,
              color: "#F0F4FF",
            }}
            formatter={(v: number) => [`${v.toLocaleString()} uintos`, "Balance"]}
          />
          <Area type="monotone" dataKey="value" stroke="#00F5D4" strokeWidth={2} fill="url(#sparkGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PortfolioDashboard() {
  const { username, address } = useInterwovenKit();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [history, setHistory] = useState<{ date: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    async function load() {
      setLoading(true);
      try {
        // 1. Fetch real on-chain balance from the L2 LCD
        const balRes = await fetch(`${API_URL}/api/lcd/cosmos/bank/v1beta1/balances/${address}`);
        const balJson = await balRes.json();
        const coins: CoinBalance[] = balJson.balances ?? [];

        const assets = coins.map((coin) => {
          const symbol = coin.denom === "uintos" ? "INIT" : coin.denom.toUpperCase();
          const displayBalance = toDisplay(coin.amount);
          // Very rough USD estimate — $1 per INIT for demo purposes
          const valueUSD = symbol === "INIT" ? displayBalance * 1 : 0;
          return {
            symbol,
            name: symbol === "INIT" ? "Initia (L2)" : coin.denom,
            balance: Math.round(displayBalance),
            valueUSD: parseFloat(valueUSD.toFixed(2)),
            allocation: 100, // will recalculate below
            change24h: 0,
          };
        });

        const totalUSD = assets.reduce((s, a) => s + a.valueUSD, 0);
        assets.forEach((a) => {
          a.allocation = totalUSD > 0 ? Math.round((a.valueUSD / totalUSD) * 100) : 0;
        });

        // 2. Fetch strategy count from history API
        const histRes = await fetch(`${API_URL}/api/history`);
        const histJson = await histRes.json();
        const histEntries = histJson.data ?? [];
        const completed = histEntries.filter((e: { result: { status: string } }) => e.result.status === "success").length;

        setPortfolio({
          address: address ?? "",
          username: username ?? "",
          totalValueUSD: parseFloat(totalUSD.toFixed(2)),
          change24h: 0,
          assets,
          activeStrategies: 0,
          completedStrategies: completed,
          lastUpdated: new Date().toISOString(),
        });

        // 3. Build a simple sparkline from history timestamps + raw balance
        const chartData = histEntries.slice(0, 7).reverse().map((e: { createdAt: string }) => ({
          date: new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          value: Math.round(toDisplay(coins.find(c => c.denom === "uintos")?.amount ?? "0")),
        }));
        setHistory(chartData);
      } catch (err) {
        console.error("Portfolio load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [address, username]);

  if (!address) {
    return (
      <div className="glass-card p-12 text-center text-text-muted text-sm">
        Connect your wallet to view your portfolio.
      </div>
    );
  }

  if (loading || !portfolio) {
    return (
      <div className="glass-card p-12 text-center text-text-muted text-sm animate-pulse">
        Loading portfolio…
      </div>
    );
  }

  const isPositive = portfolio.change24h >= 0;
  const displayName = portfolio.username || address.slice(0, 10) + "…";

  return (
    <div className="space-y-4">
      {/* ── Hero: Total Value ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <p className="text-xs text-text-muted mb-4">
          {displayName} · intentos-1
        </p>

        <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-1">
          Total Portfolio Value
        </p>
        <div className="flex items-end gap-3 flex-wrap">
          <h1 className="text-5xl font-black text-text-primary tabular-nums leading-none">
            ${portfolio.totalValueUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h1>
          <span className={`text-base font-semibold mb-0.5 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "↑" : "↓"} {Math.abs(portfolio.change24h)}%
          </span>
        </div>

        <div className="flex gap-5 mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div>
            <p className="text-xs text-text-muted">Active</p>
            <p className="text-sm font-semibold text-[#00F5D4]">{portfolio.activeStrategies} strategy</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Completed</p>
            <p className="text-sm font-semibold text-text-primary">{portfolio.completedStrategies}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Updated</p>
            <p className="text-sm font-semibold text-text-primary">Just now</p>
          </div>
        </div>
      </motion.div>

      {/* ── Sparkline ── */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-card p-5"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-4">
            Balance History
          </p>
          <Sparkline data={history} />
        </motion.div>
      )}

      {/* ── Asset Breakdown ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="glass-card p-5 space-y-2"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-3">
          Holdings
        </p>

        {portfolio.assets.length === 0 && (
          <p className="text-sm text-text-muted text-center py-4">No tokens found on-chain.</p>
        )}

        {portfolio.assets.map((asset, i) => {
          const color = ASSET_COLORS[asset.symbol] ?? "#9AA5BC";
          const aPositive = asset.change24h >= 0;
          return (
            <motion.div
              key={asset.symbol}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.06 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
              >
                {asset.symbol.slice(0, 2)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{asset.name}</p>
                <p className="text-xs text-text-muted">
                  {asset.balance.toLocaleString()} {asset.symbol}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-text-primary">
                  ${asset.valueUSD.toLocaleString()}
                </p>
                <p className={`text-xs ${aPositive ? "text-emerald-400" : "text-red-400"}`}>
                  {aPositive ? "+" : ""}{asset.change24h}% 24h
                </p>
              </div>

              <div className="w-12 flex-shrink-0 hidden sm:block">
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${asset.allocation}%`, background: color, opacity: 0.7 }}
                  />
                </div>
                <p className="text-[10px] text-text-muted text-right mt-0.5">{asset.allocation}%</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
