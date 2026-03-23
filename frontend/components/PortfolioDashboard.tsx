"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { Portfolio } from "../types";

const MOCK_PORTFOLIO: Portfolio = {
  address: "init1abc...def1",
  username: "demo.init",
  totalValueUSD: 12_450.72,
  change24h: 2.4,
  assets: [
    { symbol: "INIT", name: "Initia",   balance: 4200, valueUSD: 8400, allocation: 67, change24h: 3.1 },
    { symbol: "USDC", name: "USD Coin", balance: 2800, valueUSD: 2800, allocation: 22, change24h: 0 },
    { symbol: "ETH",  name: "Ethereum", balance: 0.5,  valueUSD: 1250, allocation: 11, change24h: 1.2 },
  ],
  activeStrategies: 1,
  completedStrategies: 3,
  lastUpdated: new Date().toISOString(),
};

const CHART_DATA = [
  { date: "Mar 17", value: 10200 },
  { date: "Mar 18", value: 10800 },
  { date: "Mar 19", value: 10600 },
  { date: "Mar 20", value: 11400 },
  { date: "Mar 21", value: 11200 },
  { date: "Mar 22", value: 12100 },
  { date: "Mar 23", value: 12450 },
];

export default function PortfolioDashboard() {
  const p = MOCK_PORTFOLIO;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <p className="text-sm text-text-muted mb-1">Total Portfolio Value</p>
        <div className="flex items-end gap-3">
          <h1 className="text-4xl font-black text-text-primary">
            ${p.totalValueUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </h1>
          <span className={`text-sm font-semibold mb-1 ${p.change24h >= 0 ? "text-status-success" : "text-status-error"}`}>
            {p.change24h >= 0 ? "+" : ""}{p.change24h}% 24h
          </span>
        </div>
        <div className="flex gap-4 mt-3 text-sm text-text-muted">
          <span>🟢 {p.activeStrategies} active</span>
          <span>✓ {p.completedStrategies} completed</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
        <p className="text-sm font-semibold text-text-muted mb-4">7-Day Performance</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={CHART_DATA}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F5D4" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00F5D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "#4B5563", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#161B26", border: "1px solid #1E2A3A", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`]} />
              <Area type="monotone" dataKey="value" stroke="#00F5D4" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5 space-y-3">
        <p className="text-sm font-semibold text-text-muted">Assets</p>
        {p.assets.map((asset) => (
          <div key={asset.symbol} className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-border-default">
            <div className="w-9 h-9 rounded-full bg-gradient-accent flex items-center justify-center text-bg-primary font-black text-xs flex-shrink-0">
              {asset.symbol.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{asset.name}</p>
              <p className="text-xs text-text-muted">{asset.balance.toLocaleString()} {asset.symbol}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-text-primary">${asset.valueUSD.toLocaleString()}</p>
              <p className={`text-xs ${asset.change24h >= 0 ? "text-status-success" : "text-status-error"}`}>
                {asset.change24h >= 0 ? "+" : ""}{asset.change24h}%
              </p>
            </div>
            <span className="text-xs text-text-muted flex-shrink-0 w-10 text-right">{asset.allocation}%</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
