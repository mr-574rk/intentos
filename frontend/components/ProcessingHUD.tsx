"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

// ── Steps ──────────────────────────────────────────────────────────────────────
const HUD_STEPS = [
  "Parsing natural language intent...",
  "Verifying wallet balances...",
  "Generating DeFi strategy...",
  "Simulating risk and yield...",
  "Bundling transactions...",
  "Finalizing strategy parameters...",
] as const;

const TOTAL_STEPS = HUD_STEPS.length;

/** Interval between step advances (ms) */
const STEP_INTERVAL_MS = 800;

/** Minimum time the HUD must stay visible (ms) — prevents "AI did nothing" flash */
const MIN_DISPLAY_MS = 2400;

/** Brief pause on the final step before firing onComplete */
const FINAL_PAUSE_MS = 400;

// ── Props ──────────────────────────────────────────────────────────────────────
interface ProcessingHUDProps {
  /** True while the API call is in-flight */
  apiPending: boolean;
  /** Called when the HUD has finished its minimum animation AND the API is done */
  onComplete: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ProcessingHUD({ apiPending, onComplete }: ProcessingHUDProps) {
  const [stepIndex,        setStepIndex]        = useState(0);
  const [readyToComplete,  setReadyToComplete]  = useState(false);

  const startTimeRef    = useRef(Date.now());
  const onCompleteRef   = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // ── Step auto-advance — stops at last step, never loops ──────────────────────
  useEffect(() => {
    if (stepIndex >= TOTAL_STEPS - 1) return;
    const t = setTimeout(
      () => setStepIndex(i => Math.min(i + 1, TOTAL_STEPS - 1)),
      STEP_INTERVAL_MS
    );
    return () => clearTimeout(t);
  }, [stepIndex]);

  // ── When API resolves, wait for minimum display time then set ready ───────────
  useEffect(() => {
    if (apiPending) return; // still in-flight
    const elapsed  = Date.now() - startTimeRef.current;
    const delay    = Math.max(MIN_DISPLAY_MS - elapsed, 0);
    const t = setTimeout(() => setReadyToComplete(true), delay);
    return () => clearTimeout(t);
  }, [apiPending]);

  // ── Fire onComplete only when BOTH: last step reached AND ready ───────────────
  useEffect(() => {
    if (!readyToComplete || stepIndex < TOTAL_STEPS - 1) return;
    const t = setTimeout(() => onCompleteRef.current(), FINAL_PAUSE_MS);
    return () => clearTimeout(t);
  }, [readyToComplete, stepIndex]);

  return (
    <div
      className="h-20 w-full p-4 rounded-2xl flex items-center gap-4"
      style={{
        background:  "#0D0F14",
        border:      "1px solid rgba(255,255,255,0.1)",
        boxShadow:   "0 0 20px rgba(0,245,212,0.1)",
      }}
    >
      {/* AI Core — spinning glow orb */}
      <Loader2
        className="w-8 h-8 animate-spin flex-shrink-0"
        style={{
          color:      "#00F5D4",
          filter:     "drop-shadow(0 0 10px rgba(0,245,212,0.8))",
        }}
      />

      {/* Right side — text + dashes */}
      <div className="flex flex-col flex-1 gap-2 min-w-0">

        {/* Cross-fading step text */}
        <div className="relative h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={stepIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0 text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ color: "#fff" }}
            >
              {HUD_STEPS[stepIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Horizontal progress dashes */}
        <div className="flex gap-1.5 w-full">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const isActive  = i < stepIndex;
            const isCurrent = i === stepIndex;
            return (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all duration-500"
                style={
                  isActive
                    ? { background: "#00F5D4" }
                    : isCurrent
                    ? { background: "#00F5D4", boxShadow: "0 0 6px rgba(0,245,212,0.7)" }
                    : { background: "rgba(255,255,255,0.1)" }
                }
              />
            );
          })}
        </div>

      </div>
    </div>
  );
}
