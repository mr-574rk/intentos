"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { HistoryEntry } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const EXPLORER = "https://scan.testnet.initia.xyz/intentos-1/txs";

export default function StrategyHistory({ entries }: { entries?: HistoryEntry[] }) {
  const [list, setList] = useState<HistoryEntry[]>(entries ?? []);
  const [loading, setLoading] = useState(!entries);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entries) return; // caller provided data — skip fetch
    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/api/history`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setList(json.data ?? []);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [entries]);

  if (loading) {
    return (
      <div className="glass-card p-12 text-center text-text-muted text-sm animate-pulse">
        Loading strategy history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-12 text-center text-red-400 text-sm">
        Failed to load history: {error}
      </div>
    );
  }

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
        const txHash  = entry.result.txHash;
        const isReal  = txHash && txHash !== "n/a" && !txHash.startsWith("tx_cached") && !txHash.startsWith("mock");

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
                    success
                      ? "text-status-success bg-status-success/10 border-status-success/20"
                      : "text-status-error bg-status-error/10 border-status-error/20"
                  }`}>
                    {success ? "✓ Success" : "✗ Failed"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                </div>

                <p className="text-sm font-semibold text-text-primary mb-2 truncate">
                  &quot;{entry.intentText}&quot;
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {entry.bundle.steps.slice(0, 3).map((step) => (
                    <span
                      key={step.index}
                      className="text-xs px-2 py-0.5 bg-bg-elevated border border-border-default rounded-md text-text-muted"
                    >
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

            {txHash && txHash !== "n/a" && (
              <div className="mt-3 pt-3 border-t border-border-default">
                <p className="text-xs text-text-muted flex items-center gap-2 flex-wrap">
                  <span>Tx:</span>
                  {isReal ? (
                    <a
                      href={`${EXPLORER}/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-accent-cyan/80 hover:text-accent-cyan truncate max-w-[200px] sm:max-w-none"
                    >
                      {txHash.slice(0, 12)}…{txHash.slice(-8)} ↗
                    </a>
                  ) : (
                    <span className="font-mono text-text-muted/50">{txHash}</span>
                  )}
                  <span>· testnet</span>
                </p>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
