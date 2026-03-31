"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, ListTree, PieChart, PackageCheck, Zap, Check, X, Loader2 } from "lucide-react";
import type { AgentTimeline as TimelineType, TimelineStepStatus } from "../types";

// ── Mint pulse dot ─────────────────────────────────────────────────────────────
function MintPulse({ size = 10 }: { size?: number }) {
  return (
    <span className="relative inline-flex flex-shrink-0" style={{ width: size, height: size }}>
      <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: "rgba(0,245,212,0.5)" }} />
      <span className="relative inline-flex rounded-full" style={{ width: size, height: size, background: "#00F5D4" }} />
    </span>
  );
}

// ── Step metadata ──────────────────────────────────────────────────────────────
const STEP_META: Record<string, { icon: React.ElementType; label: string }> = {
  intent_parsed:       { icon: BrainCircuit, label: "Intent Parsed" },
  strategy_generated:  { icon: ListTree,     label: "Strategy Built" },
  simulation_complete: { icon: PieChart,     label: "Simulation Done" },
  bundle_prepared:     { icon: PackageCheck, label: "Bundle Ready" },
  execution_ready:     { icon: Zap,          label: "Ready to Execute" },
};

const LOADING_STEPS = [
  { label: "Parsing your intent",  sub: "Understanding your goal..." },
  { label: "Building strategy",    sub: "Selecting optimal DeFi paths..." },
  { label: "Running simulation",   sub: "Estimating returns & risk..." },
  { label: "Preparing bundle",     sub: "Assembling transaction steps..." },
  { label: "Finalizing",           sub: "Almost ready..." },
];

interface AgentTimelineProps {
  timeline?: TimelineType | null;
  loading?: boolean;
}

// ── Node circle for each step ──────────────────────────────────────────────────
function StepNode({ status, icon: Icon }: { status: TimelineStepStatus; icon: React.ElementType }) {
  if (status === "complete") {
    return (
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 relative bg-[#00F5D4]/10 border border-[#00F5D4]/30"
      >
        <Check className="w-5 h-5 text-[#00F5D4]" />
      </motion.div>
    );
  }
  if (status === "active") {
    return (
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 relative bg-[#00F5D4] shadow-[0_0_15px_rgba(0,245,212,0.6)] animate-pulse">
        <Zap className="w-5 h-5 text-gray-900" />
      </div>
    );
  }
  if (status === "failed") {
    return (
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 relative bg-red-500/10 border border-red-500/30">
        <X className="w-5 h-5 text-red-400" />
      </div>
    );
  }
  // pending
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 relative bg-white/5 border border-white/10">
      <Icon className="w-4 h-4 text-white/20" />
    </div>
  );
}

export default function AgentTimeline({ timeline, loading }: AgentTimelineProps) {
  const completedCount = timeline?.steps.filter(s => s.status !== "pending").length ?? 0;
  const [revealedCount, setRevealedCount] = useState(0);
  const prevCompleted = useRef(0);
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

  useEffect(() => {
    if (revealedCount > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [revealedCount]);

  const progressPct = timeline
    ? Math.round((completedCount / (timeline.steps.length || 1)) * 100)
    : 0;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading && !timeline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#13161D]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <MintPulse size={12} />
          <div>
            <p className="text-sm font-bold text-white tracking-tight">AI is processing your intent</p>
            <p className="text-xs text-gray-500 mt-0.5">This usually takes 2–5 seconds</p>
          </div>
        </div>

        {/* Skeleton track */}
        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-[2px] bg-white/5 rounded-full" />
          <div className="space-y-8">
            {LOADING_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-start gap-6 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 shrink-0 z-10 relative" />
                <div className="flex-1 pt-2 space-y-2">
                  <div className="h-3 bg-white/5 rounded-full" style={{ width: `${40 + i * 10}%` }} />
                  <div className="h-2 bg-white/[0.03] rounded-full" style={{ width: `${25 + i * 8}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (!timeline) return null;

  const totalSteps = timeline.steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#13161D]/60 backdrop-blur-md border border-white/5 rounded-3xl p-8 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-white tracking-tight">Agent Timeline</p>
        <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${
          timeline.overall === "complete" ? "bg-[#00F5D4]/10 border-[#00F5D4]/30 text-[#00F5D4]"
            : timeline.overall === "failed"  ? "bg-red-500/10 border-red-500/25 text-red-400"
            : "bg-white/5 border-white/10 text-gray-400"
        }`}>
          {timeline.overall === "complete" ? "✓ Complete"
            : timeline.overall === "failed" ? "✗ Failed"
            : "● Processing"}
        </span>
      </div>

      {/* Thin progress bar */}
      <div className="h-[2px] bg-white/5 rounded-full overflow-hidden mb-8">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #00F5D4, #00C4AA)" }}
          initial={{ width: "0%" }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Vertical timeline track */}
      <div className="relative">
        {/* Track line — teal for done, muted for rest */}
        <div className="absolute left-5 top-4 bottom-8 w-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="w-full rounded-full"
            style={{ background: "rgba(0,245,212,0.5)" }}
            initial={{ height: "0%" }}
            animate={{ height: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {timeline.steps.map((step, i) => {
            const meta = STEP_META[step.id] ?? { icon: Loader2, label: step.label };
            const isRevealed = step.status === "pending" || i < revealedCount;
            const isLastRevealed = i === revealedCount - 1;

            return (
              <AnimatePresence key={step.id}>
                {isRevealed && (
                  <motion.div
                    ref={isLastRevealed ? bottomRef : null}
                    initial={step.status !== "pending" ? { opacity: 0, x: -8 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                    className={`flex items-start gap-6 ${step.status === "pending" ? "opacity-30" : ""}`}
                  >
                    <StepNode status={step.status} icon={meta.icon} />
                    <div className="flex-1 min-w-0 pt-1.5">
                      <p className={`font-medium text-base leading-snug ${
                        step.status === "complete" ? "text-white"
                          : step.status === "active"   ? "text-[#00F5D4]"
                          : step.status === "failed"   ? "text-red-400"
                          : "text-white/30"
                      }`}>
                        {meta.label}
                      </p>
                      {step.description && (
                        <p className="text-gray-400 text-sm mt-1 leading-relaxed">{step.description}</p>
                      )}
                    </div>
                    {step.status === "active" && (
                      <div className="pt-3 shrink-0">
                        <MintPulse size={8} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
