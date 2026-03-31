"use client";

import { motion } from "framer-motion";
import { Brain } from "lucide-react";

interface StrategyReasoningProps {
  reasoning: string[];
}

export default function StrategyReasoning({ reasoning }: StrategyReasoningProps) {
  if (!reasoning || reasoning.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="bg-[#13161D]/60 backdrop-blur-md border border-white/10 p-6 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden"
    >
      {/* Subtle accent glow in corner */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#00F5D4]/5 blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2.5 relative z-10">
        <span
          className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
          style={{ background: "rgba(0,245,212,0.08)", border: "1px solid rgba(0,245,212,0.15)" }}
        >
          <Brain className="w-4 h-4" style={{ color: "#00F5D4" }} />
        </span>
        <h2 className="font-semibold text-text-primary">Why This Strategy?</h2>
      </div>

      <ul className="space-y-2 relative z-10">
        {reasoning.map((bullet, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed"
          >
            <span className="text-[#00F5D4] mt-0.5 flex-shrink-0 text-xs">✔</span>
            <span>{bullet}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
