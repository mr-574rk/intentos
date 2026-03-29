"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { HistoryEntry } from "../types";
import { API_URL, EXPLORER } from "@/lib/config";



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
    <div className="space-y-4 pb-24 md:pb-8">
      {list.map((entry, i) => {
        const success = entry.result.status === "success";
        const txHash = entry.result.txHash;
        const isReal = txHash && txHash !== "n/a" && !txHash.startsWith("tx_cached") && !txHash.startsWith("mock");
        const explorerUrl = isReal ? `${EXPLORER}/${txHash}` : null;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-5 transition-colors shadow-lg"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,245,212,0.25)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${success
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

                <p className="text-lg font-semibold text-white mb-3 line-clamp-2 leading-snug">
                  &quot;{entry.intentText}&quot;
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {entry.bundle.steps.slice(0, 3).map((step) => (
                    <span
                      key={step.index}
                      className="text-[11px] font-medium px-2.5 py-1 bg-white/[0.04] border border-white-[0.05] rounded-lg text-white/60"
                    >
                      {step.description}
                    </span>
                  ))}
                  {entry.bundle.steps.length > 3 && (
                    <span className="text-[11px] font-medium px-2.5 py-1 bg-white/[0.04] border border-white-[0.05] rounded-lg text-white/50">
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

            {/* TX row — compact hash + prominent button */}
            {txHash && txHash !== "n/a" && (
              <div className="mt-3 pt-3 border-t border-border-default flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-white/40 font-mono truncate max-w-[180px]">
                  {isReal ? `${txHash.slice(0, 10)}…${txHash.slice(-8)}` : txHash}
                </p>
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all"
                    style={{
                      color: "#00F5D4",
                      borderColor: "rgba(0,245,212,0.25)",
                      background: "rgba(0,245,212,0.06)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,245,212,0.12)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,245,212,0.06)")}
                  >
                    View on Explorer
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
