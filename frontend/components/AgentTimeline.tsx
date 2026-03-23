"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import type { AgentTimeline as TimelineType, TimelineStepStatus } from "../types";

const STEP_ICONS: Record<string, string> = {
  intent_parsed: "🧠",
  strategy_generated: "📋",
  simulation_complete: "📊",
  bundle_prepared: "📦",
  execution_ready: "⚡",
};

const STATUS_CONFIG: Record<TimelineStepStatus, { color: string; bg: string; border: string; label: string }> = {
  pending:  { color: "text-text-muted",     bg: "bg-bg-elevated",           border: "border-border-default", label: "Waiting" },
  active:   { color: "text-accent-cyan",    bg: "bg-accent-cyan/10",        border: "border-accent-cyan/30",  label: "Running" },
  complete: { color: "text-status-success", bg: "bg-status-success/10",     border: "border-status-success/20", label: "Done" },
  failed:   { color: "text-status-error",   bg: "bg-status-error/10",       border: "border-status-error/20", label: "Failed" },
};

interface AgentTimelineProps {
  timeline?: TimelineType | null;
  loading?: boolean;
}

export default function AgentTimeline({ timeline, loading }: AgentTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!timeline) { setVisibleCount(0); return; }
    const count = timeline.steps.filter((s) => s.status !== "pending").length;
    let i = 0;
    const interval = setInterval(() => {
      if (i >= count) { clearInterval(interval); return; }
      i++;
      setVisibleCount(i);
    }, 450);
    return () => clearInterval(interval);
  }, [timeline]);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h2 className="font-semibold text-text-primary">Agent Timeline</h2>
        </div>
        {timeline && (
          <span className={clsx(
            "text-xs px-2.5 py-1 rounded-full border font-medium",
            timeline.overall === "complete" ? "bg-status-success/10 border-status-success/30 text-status-success"
              : timeline.overall === "failed" ? "bg-status-error/10 border-status-error/30 text-status-error"
              : "bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan"
          )}>
            {timeline.overall === "complete" ? "✓ Complete" : timeline.overall === "failed" ? "✗ Failed" : "● Running"}
          </span>
        )}
      </div>

      {!timeline && !loading && (
        <div className="py-8 text-center text-text-muted text-sm">Enter an intent above to start the AI pipeline</div>
      )}

      {loading && !timeline && (
        <div className="space-y-3">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-bg-elevated" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-bg-elevated rounded w-1/3" />
                <div className="h-2.5 bg-bg-elevated rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {timeline && (
        <div className="space-y-3">
          {timeline.steps.map((step, i) => {
            const cfg = STATUS_CONFIG[step.status];
            const icon = STEP_ICONS[step.id] ?? "●";
            const shouldShow = step.status === "pending" || i < visibleCount;

            return (
              <AnimatePresence key={step.id}>
                {shouldShow && (
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={clsx(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                      cfg.bg, cfg.border,
                      step.status === "active" && "shadow-glow"
                    )}
                  >
                    <div className={clsx(
                      "w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0",
                      cfg.color,
                      step.status === "active" && "animate-pulse-slow"
                    )}>
                      {step.status === "complete" ? "✓" : icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx("text-sm font-medium", cfg.color)}>{step.label}</p>
                      <p className="text-xs text-text-muted truncate">{step.description}</p>
                    </div>
                    <span className={clsx("text-xs font-medium flex-shrink-0", cfg.color)}>{cfg.label}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      )}
    </div>
  );
}
