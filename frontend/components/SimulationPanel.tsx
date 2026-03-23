"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { SimulationResult } from "../types";

const COLORS = ["#00F5D4", "#7C3AED", "#F59E0B", "#10B981", "#EF4444", "#3B82F6"];

const RISK_TEXT = {
  low: "text-status-success",
  medium: "text-status-warning",
  high: "text-status-error",
};

export default function SimulationPanel({ simulation }: { simulation: SimulationResult }) {
  const pieData = Object.entries(simulation.portfolioAllocation).map(([name, value]) => ({ name, value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-card p-6 space-y-5"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">📊</span>
        <h2 className="font-semibold text-text-primary">Simulation Results</h2>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full border font-medium ${
          simulation.passed
            ? "bg-status-success/10 border-status-success/20 text-status-success"
            : "bg-status-error/10 border-status-error/20 text-status-error"
        }`}>
          {simulation.passed ? "✓ Cleared" : "✗ Flagged"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-elevated border border-border-default rounded-xl p-3.5 text-center">
          <p className="text-2xl font-black text-accent-cyan">{simulation.projectedAPY}%</p>
          <p className="text-xs text-text-muted mt-1">Projected APY</p>
        </div>
        <div className="bg-bg-elevated border border-border-default rounded-xl p-3.5 text-center">
          <p className={`text-2xl font-black ${RISK_TEXT[simulation.riskScore]}`}>{simulation.riskScoreNumeric}/10</p>
          <p className="text-xs text-text-muted mt-1">Risk Score</p>
        </div>
        <div className="bg-bg-elevated border border-border-default rounded-xl p-3.5 text-center">
          <p className="text-2xl font-black text-text-primary capitalize">{simulation.riskScore}</p>
          <p className="text-xs text-text-muted mt-1">Risk Level</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Portfolio Allocation</p>
        <div className="flex items-center gap-6">
          <div className="w-36 h-36 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={60} strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#161B26", border: "1px solid #1E2A3A", borderRadius: 8 }} formatter={(v) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-sm text-text-secondary flex-1">{item.name}</span>
                <span className="text-sm font-semibold text-text-primary">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-bg-elevated border border-border-default rounded-xl p-4">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Analysis</p>
        <p className="text-sm text-text-secondary leading-relaxed">{simulation.explanation}</p>
      </div>

      {simulation.warnings.length > 0 && (
        <div className="space-y-2">
          {simulation.warnings.map((w, i) => (
            <div key={i} className="text-xs text-status-warning bg-status-warning/5 border border-status-warning/20 rounded-lg px-3 py-2">{w}</div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
