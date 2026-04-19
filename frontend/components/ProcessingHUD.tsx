"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ReasoningStep {
  action: string;
  discovery?: string;
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface ProcessingHUDProps {
  /** True while the API call is in-flight */
  apiPending: boolean;
  /** Array of reasoning steps specific to the intent */
  steps: ReasoningStep[];
  /** Called when the HUD has finished its minimum animation AND the API is done */
  onComplete: () => void;
}

/** Timing variables */
const STEP_DELAY_MS = 800; // Time spent on 'action' before discovery
const DISCOVERY_DELAY_MS = 600; // Time to pause on 'discovery' before moving to next step
const FINAL_PAUSE_MS = 400; // Time before firing onComplete at the end

export default function ProcessingHUD({ apiPending, steps, onComplete }: ProcessingHUDProps) {
  const { t } = useLocale();
  const [stepIndex, setStepIndex] = useState(0);
  const [isShowingDiscovery, setIsShowingDiscovery] = useState(false);
  const [readyToComplete, setReadyToComplete] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const totalSteps = steps.length;
  const currentStep = steps[stepIndex];

  // ── Step auto-advance logic ──────────────────────────────────────────────────
  useEffect(() => {
    // If we reached the end, stop advancing
    if (!currentStep || stepIndex >= totalSteps) return;

    let timeout: ReturnType<typeof setTimeout>;

    if (!isShowingDiscovery) {
      // We are showing the ACTION.
      timeout = setTimeout(() => {
        if (currentStep.discovery) {
          // If there's a discovery, show it next
          setIsShowingDiscovery(true);
        } else {
          // Otherwise, just move to the next step
          if (stepIndex < totalSteps - 1) {
            setStepIndex((i) => i + 1);
          }
        }
      }, STEP_DELAY_MS);
    } else {
      // We are showing the DISCOVERY.
      timeout = setTimeout(() => {
        // Move to the next step
        if (stepIndex < totalSteps - 1) {
          setIsShowingDiscovery(false);
          setStepIndex((i) => i + 1);
        }
      }, DISCOVERY_DELAY_MS);
    }

    return () => clearTimeout(timeout);
  }, [stepIndex, isShowingDiscovery, currentStep, totalSteps]);

  // ── When API resolves, signal ready (no complex min-time needed anymore, HUD length dictates it) ──
  useEffect(() => {
    if (!apiPending) {
      setReadyToComplete(true);
    }
  }, [apiPending]);

  // ── Fire onComplete only when BOTH: last step reached AND ready ───────────────
  useEffect(() => {
    const isAtLastStep = stepIndex >= totalSteps - 1;
    const hasShownFinalDiscoveryOrNone = !currentStep?.discovery || isShowingDiscovery;

    if (!readyToComplete || !isAtLastStep || !hasShownFinalDiscoveryOrNone) return;

    const t = setTimeout(() => onCompleteRef.current(), FINAL_PAUSE_MS);
    return () => clearTimeout(t);
  }, [readyToComplete, stepIndex, isShowingDiscovery, totalSteps, currentStep]);

  return (
    <div
      className="h-20 w-full p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden"
      style={{
        background: "#0D0F14",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 0 20px rgba(0,245,212,0.1)",
      }}
    >
      {/* AI Core — spinning glow orb */}
      <motion.div
        animate={isShowingDiscovery ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Loader2
          className="w-8 h-8 animate-spin flex-shrink-0"
          style={{
            color: "#00F5D4",
            filter: "drop-shadow(0 0 10px rgba(0,245,212,0.8))",
          }}
        />
      </motion.div>

      {/* Right side — text + dashes */}
      <div className="flex flex-col flex-1 gap-2 min-w-0 z-10">
        {/* Cross-fading step text */}
        <div className="relative h-5 overflow-hidden flex items-center">
          <AnimatePresence mode="wait">
            {!isShowingDiscovery ? (
              <motion.div
                key={`action-${stepIndex}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute inset-0 flex items-center gap-2"
              >
                <span className="text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis text-white">
                  {currentStep?.action ?? t("processing")}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key={`discovery-${stepIndex}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute inset-0 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00F5D4]" />
                <span className="text-sm font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis text-[#00F5D4]">
                  {currentStep?.discovery}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Horizontal progress dashes */}
        <div className="flex gap-1.5 w-full">
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isActive = i < stepIndex || (i === stepIndex && isShowingDiscovery);
            const isCurrent = i === stepIndex && !isShowingDiscovery;
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
