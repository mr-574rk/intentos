"use client";

import { motion } from "framer-motion";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Portfolio } from "../types";

// Placeholder data — replace with real Initia RPC query once deployed
const PLACEHOLDER: Portfolio = {
  address: "",
  username: "",
  totalValueUSD: 12_450.72,
  change24h: 3.2,
  assets: [
    { symbol: "INIT", name: "Initia",   balance: 4200,  valueUSD: 8_400,  allocation: 67, change24h: 3.1 },
    { symbol: "USDC", name: "USD Coin", balance: 2_800, valueUSD: 2_800,  allocation: 22, change24h: 0   },
    { symbol: "LP",   name: "LP Token", balance: 1,     valueUSD: 1_250,  allocation: 11, change24h: 1.2 },
  ],
  activeStrategies: 1,
  completedStrategies: 3,
  lastUpdated: new Date().toISOString(),
};

const CHART_DATA = [
  { date: "Mar 17", value: 10_200 },
  { date: "Mar 18", value: 10_800 },
  { date: "Mar 19", value: 10_600 },
  { date: "Mar 20", value: 11_400 },
  { date: "Mar 21", value: 11_200 },
  { date: "Mar 22", value: 12_100 },
  { date: "Mar 23", value: 12_450 },
];

const ASSET_COLORS: Record<string, string> = {
  INIT: "#00F5D4",
  USDC: "#7C3AED",
  LP:   "#F59E0B",
};

function Sparkline() {
  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={CHART_DATA} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00F5D4" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#00F5D4" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: "#828A9E", fontSize: 10 }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#161B26",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12,
              fontSize: 12,
              color: "#F0F4FF",
            }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00F5D4"
            strokeWidth={2}
            fill="url(#sparkGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PortfolioDashboard() {
  const { username, address } = useInterwovenKit();
  const p = PLACEHOLDER;

  const isPositive = p.change24h >= 0;
  const displayName = username ?? address ?? "Your portfolio";

  return (
    <div className="space-y-4">

      {/* ── Hero: Total Value ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        {/* Identity line */}
        <p className="text-xs text-text-muted mb-4">
          {displayName ? `${displayName} · ` : ""}Connected to Initia
        </p>

        {/* Value */}
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-1">
          Total Portfolio Value
        </p>
        <div className="flex items-end gap-3 flex-wrap">
          <h1 className="text-5xl font-black text-text-primary tabular-nums leading-none">
            ${p.totalValueUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h1>
          <span className={`text-base font-semibold mb-0.5 ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "↑" : "↓"} {Math.abs(p.change24h)}% 7d
          </span>
        </div>

        {/* Stats row */}
        <div className="flex gap-5 mt-4 pt-4 border-t"
             style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div>
            <p className="text-xs text-text-muted">Active</p>
            <p className="text-sm font-semibold text-[#00F5D4]">{p.activeStrategies} strategy</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Completed</p>
            <p className="text-sm font-semibold text-text-primary">{p.completedStrategies}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Updated</p>
            <p className="text-sm font-semibold text-text-primary">Just now</p>
          </div>
        </div>
      </motion.div>

      {/* ── 7-Day Sparkline ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass-card p-5"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted mb-4">
          7-Day Performance
        </p>
        <Sparkline />
      </motion.div>

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

        {p.assets.map((asset, i) => {
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
              {/* Token badge */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center
                           text-[11px] font-black flex-shrink-0"
                style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
              >
                {asset.symbol.slice(0, 2)}
              </div>

              {/* Name + balance */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{asset.name}</p>
                <p className="text-xs text-text-muted">
                  {asset.balance.toLocaleString()} {asset.symbol}
                </p>
              </div>

              {/* Value + change */}
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-text-primary">
                  ${asset.valueUSD.toLocaleString()}
                </p>
                <p className={`text-xs ${aPositive ? "text-emerald-400" : "text-red-400"}`}>
                  {aPositive ? "+" : ""}{asset.change24h}% 24h
                </p>
              </div>

              {/* Allocation bar */}
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
