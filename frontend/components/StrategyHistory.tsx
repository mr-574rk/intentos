"use client";

import { motion } from "framer-motion";
import type { HistoryEntry } from "../types";

const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: "h1",
    intentText: "Earn stable yield with low risk",
    bundle: {
      id: "b1",
      steps: [
        { index: 1, action: "swap",            description: "Swap INIT → USDC",       from: "INIT", to: "USDC" },
        { index: 2, action: "provide_liquidity", description: "Add USDC to yield pool" },
        { index: 3, action: "stake_lp",         description: "Stake LP tokens" },
      ],
      estimatedYield: 12, riskScore: "low", riskScoreNumeric: 3,
      explanation: "Conservative stablecoin strategy.",
      intent: { goal: "yield", riskTolerance: "low", timeHorizon: "medium", assets: ["INIT"], rawText: "Earn stable yield" },
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    simulation: {
      bundleId: "b1", portfolioAllocation: { Staking: 40, "USDC LP": 40, Lending: 20 },
      projectedAPY: 12, riskScore: "low", riskScoreNumeric: 3,
      explanation: "Cleared.", passed: true, warnings: [],
    },
    result: { strategyId: "b1", status: "success", txHash: "mock_tx_abc123", result: "3 steps completed", mode: "mock", executedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    performance: "+2.8%",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "h2",
    intentText: "Maximize INIT returns aggressively",
    bundle: {
      id: "b2",
      steps: [{ index: 1, action: "leverage_stake", description: "Leverage stake INIT" }],
      estimatedYield: 35, riskScore: "high", riskScoreNumeric: 9,
      explanation: "High-yield leverage strategy.",
      intent: { goal: "growth", riskTolerance: "high", timeHorizon: "short", assets: ["INIT"], rawText: "Maximize INIT returns" },
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    simulation: {
      bundleId: "b2", portfolioAllocation: { "Leveraged Position": 100 },
      projectedAPY: 35, riskScore: "high", riskScoreNumeric: 9,
      explanation: "High risk.", passed: false, warnings: ["Exceeds threshold"],
    },
    result: { strategyId: "b2", status: "failed", txHash: "n/a", result: "Blocked by execution guard", mode: "mock", executedAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
];

export default function StrategyHistory({ entries }: { entries?: HistoryEntry[] }) {
  const list = entries ?? MOCK_HISTORY;

  if (list.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-text-muted text-sm">
        No strategy history yet. Execute your first strategy to see results here.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {list.map((entry, i) => {
        const success = entry.result.status === "success";
        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card p-5 hover:border-accent-cyan/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    success ? "text-status-success bg-status-success/10 border-status-success/20"
                            : "text-status-error bg-status-error/10 border-status-error/20"
                  }`}>
                    {success ? "✓ Success" : "✗ Failed"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p className="text-sm font-semibold text-text-primary mb-2 truncate">&quot;{entry.intentText}&quot;</p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.bundle.steps.slice(0, 3).map((step) => (
                    <span key={step.index} className="text-xs px-2 py-0.5 bg-bg-elevated border border-border-default rounded-md text-text-muted">
                      {step.description}
                    </span>
                  ))}
                  {entry.bundle.steps.length > 3 && (
                    <span className="text-xs px-2 py-0.5 bg-bg-elevated border border-border-default rounded-md text-text-muted">
                      +{entry.bundle.steps.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              {entry.performance && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-status-success">{entry.performance}</p>
                  <p className="text-xs text-text-muted">return</p>
                </div>
              )}
            </div>
            {entry.result.txHash !== "n/a" && (
              <div className="mt-3 pt-3 border-t border-border-default">
                <p className="text-xs text-text-muted">
                  Tx: <span className="font-mono text-accent-cyan/70">{entry.result.txHash}</span>
                  <span className="ml-2">· {entry.result.mode} mode</span>
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
