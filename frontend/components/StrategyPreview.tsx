"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { ListTree, ArrowRight } from "lucide-react";
import type { StrategyBundle } from "../types";

const RISK_CONFIG = {
  low:    { color: "text-status-success", bg: "bg-status-success/10", border: "border-status-success/20" },
  medium: { color: "text-status-warning", bg: "bg-status-warning/10", border: "border-status-warning/20" },
  high:   { color: "text-status-error",   bg: "bg-status-error/10",   border: "border-status-error/20" },
};

export default function StrategyPreview({ bundle }: { bundle: StrategyBundle }) {
  const risk = RISK_CONFIG[bundle.riskScore];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-bg-elevated border border-border-default p-6 space-y-5 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <ListTree className="w-5 h-5 text-accent-cyan" />
          <h2 className="font-semibold text-text-primary tracking-wide">Strategy Preview</h2>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <span className={clsx("text-xs px-2.5 py-1 rounded-full border font-medium", risk.color, risk.bg, risk.border)}>
            {bundle.riskScore.charAt(0).toUpperCase() + bundle.riskScore.slice(1)} Risk
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan font-medium">
            ~{bundle.estimatedYield}% APY
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {bundle.steps.map((step, i) => (
          <motion.div
            key={step.index}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="flex items-start gap-3 p-3.5 bg-bg-secondary border border-border-default"
          >
            <span className="w-6 h-6 bg-accent-cyan/10 text-accent-cyan text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border border-accent-cyan/20">
              {step.index}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium">{step.description}</p>
              {step.from && step.to && (
                <p className="flex items-center gap-1 text-xs text-text-muted mt-1 font-medium">
                  {step.from} <ArrowRight className="w-3 h-3 text-accent-cyan/50" /> {step.to}
                  {step.protocol && <> <span className="mx-1 text-border-default">|</span> <span className="text-accent-cyan/70">{step.protocol}</span></>}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="border-t border-border-default" />

      <div className="bg-bg-secondary border border-border-default p-5 border-l-2 border-l-accent-purple/50">
        <p className="text-[10px] font-bold text-text-muted mb-2 uppercase tracking-widest">Why this strategy?</p>
        <p className="text-sm text-text-secondary leading-relaxed">{bundle.explanation}</p>
      </div>
    </motion.div>
  );
}
