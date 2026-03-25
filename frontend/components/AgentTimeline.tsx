"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { BrainCircuit, ListTree, PieChart, PackageCheck, Zap, Check, X, Loader2 } from "lucide-react";
import type { AgentTimeline as TimelineType, TimelineStepStatus } from "../types";

// Initia-branded mint glow pulse
function MintPulse({ size = 16 }: { size?: number }) {
  return (
    <span className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "rgba(0,245,212,0.4)" }} />
      <span className="relative inline-flex rounded-full" style={{ width: size, height: size, background: "#00F5D4" }} />
    </span>
  );
}

// ─── GEMINI FIX: Timeline is now driven ENTIRELY by real API data ───────────
// Steps auto-advance only by a minimum-delay reveal (500ms per step) to make
// them visible, but NEVER outpace the backend — completedCount comes from
// actual API response data, not a fake timer.

const STEP_META: Record<string, { icon: React.ElementType; label: string }> = {
  intent_parsed:       { icon: BrainCircuit, label: "Intent Parsed" },
  strategy_generated:  { icon: ListTree,     label: "Strategy Built" },
  simulation_complete: { icon: PieChart,     label: "Simulation Done" },
  bundle_prepared:     { icon: PackageCheck, label: "Bundle Ready" },
  execution_ready:     { icon: Zap,          label: "Ready to Execute" },
};

const LOADING_STEPS = [
  "Parsing your intent",
  "Building strategy",
  "Running simulation",
  "Preparing bundle",
  "Finalizing",
];

interface AgentTimelineProps {
  timeline?: TimelineType | null;
  loading?: boolean;
}

function StepIcon({ status, icon: Icon }: { status: TimelineStepStatus; icon: React.ElementType }) {
  if (status === "complete") {
    return (
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20
                   flex items-center justify-center text-emerald-400 flex-shrink-0"
      >
        <Check className="w-5 h-5" />
      </motion.div>
    );
  }
  if (status === "active") {
    return (
      <div className="w-9 h-9 bg-[rgba(0,245,212,0.05)] border border-accent-cyan/30
                      flex items-center justify-center text-accent-cyan flex-shrink-0 relative">
        <Icon className="w-4 h-4" />
        <span className="absolute inset-0 border border-[rgba(0,245,212,0.4)]
                         animate-ping opacity-30" />
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="w-9 h-9 bg-red-500/5 border border-red-500/20
                      flex items-center justify-center text-red-500 flex-shrink-0">
        <X className="w-5 h-5" />
      </div>
    );
  }
  // pending
  return (
    <div className="w-9 h-9 border border-white/5 flex items-center justify-center
                    text-text-muted flex-shrink-0 bg-white/5">
      <Icon className="w-4 h-4" />
    </div>
  );
}

export default function AgentTimeline({ timeline, loading }: AgentTimelineProps) {
  const completedCount = timeline?.steps.filter(s => s.status !== "pending").length ?? 0;
  const [revealedCount, setRevealedCount] = useState(0);
  const prevCompleted = useRef(0);
  // ref attached to the last *active/revealed* step for auto-scroll
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (completedCount === 0) { setRevealedCount(0); return; }
    if (completedCount <= prevCompleted.current) return;

    prevCompleted.current = completedCount;
    let i = revealedCount;

    const reveal = () => {
      if (i >= completedCount) return;
      i++;
      setRevealedCount(i);
      setTimeout(reveal, 500);
    };
    setTimeout(reveal, 200);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedCount]);

  // Auto-scroll to bottom whenever a new step is revealed
  useEffect(() => {
    if (revealedCount > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [revealedCount]);

  const progressPct = timeline
    ? Math.round((completedCount / (timeline.steps.length || 1)) * 100)
    : 0;

  // === Loading skeleton (before API returns) ===
  if (loading && !timeline) {
    return (
      <motion.div
        className="bg-bg-elevated border border-border-default p-6 space-y-5 shadow-2xl bg-gradient-to-b from-white/[0.03] to-transparent"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <MintPulse size={14} />
          <div>
            <p className="text-sm font-bold text-text-primary tracking-tight">AI is processing your intent</p>
            <p className="text-xs text-text-muted">This usually takes 2–5 seconds</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {LOADING_STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3 animate-pulse" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="w-9 h-9 bg-white/5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-white/5" style={{ width: `${40 + i * 10}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!timeline) return null;

  return (
    <motion.div
      className="bg-bg-elevated border border-border-default p-6 space-y-5 shadow-2xl bg-gradient-to-b from-white/[0.03] to-transparent"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">Agent Timeline</p>
        <span className={clsx(
          "text-xs px-2.5 py-1 rounded-full border font-medium",
          timeline.overall === "complete" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
            : timeline.overall === "failed"  ? "bg-red-500/10 border-red-500/25 text-red-400"
            : "bg-[rgba(0,245,212,0.1)] border-[rgba(0,245,212,0.25)] text-[#00F5D4]"
        )}>
          {timeline.overall === "complete" ? "✓ Complete"
            : timeline.overall === "failed" ? "✗ Failed"
            : "● Processing"}
        </span>
      </div>

      {/* Progress bar — driven by real API completedCount */}
      <div className="h-[2px] bg-white/5 overflow-hidden">
        <motion.div
          className="h-full bg-accent-cyan"
          initial={{ width: "0%" }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
          {timeline.steps.map((step, i) => {
          const meta = STEP_META[step.id] ?? { icon: Loader2, label: step.label };
          const isRevealed = step.status === "pending" || i < revealedCount;
          // attach bottomRef to the last revealed/active step
          const isLastRevealed = i === revealedCount - 1;

          return (
            <AnimatePresence key={step.id}>
              {isRevealed && (
                <motion.div
                  ref={isLastRevealed ? bottomRef : null}
                  initial={step.status !== "pending" ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 24 }}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 border transition-all duration-200",
                    step.status === "complete" && "bg-emerald-500/5 border-emerald-500/15",
                    step.status === "active"   && "bg-[rgba(0,245,212,0.05)] border-[rgba(0,245,212,0.2)]",
                    step.status === "failed"   && "bg-red-500/5 border-red-500/15",
                    step.status === "pending"  && "bg-transparent border-transparent opacity-40",
                  )}
                >
                  <StepIcon status={step.status} icon={meta.icon} />
                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      "text-sm font-medium",
                      step.status === "complete" ? "text-emerald-400"
                        : step.status === "active" ? "text-[#00F5D4]"
                        : step.status === "failed" ? "text-red-400"
                        : "text-text-muted"
                    )}>
                      {meta.label}
                    </p>
                    {step.description && (
                      <p className="text-xs text-text-muted truncate">{step.description}</p>
                    )}
                  </div>
                  {step.status === "active" && <MintPulse size={10} />}
                  {step.status === "complete" && (
                    <span className="text-xs text-emerald-400/60 flex-shrink-0 font-medium">Done</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>
    </motion.div>
  );
}
