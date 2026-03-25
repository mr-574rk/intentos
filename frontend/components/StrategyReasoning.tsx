"use client";

import { motion } from "framer-motion";

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
      className="glass-card p-5 space-y-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">🧠</span>
        <h2 className="font-semibold text-text-primary">Why This Strategy?</h2>
      </div>

      <ul className="space-y-2">
        {reasoning.map((bullet, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="flex items-start gap-2.5 text-sm text-text-secondary leading-relaxed"
          >
            <span className="text-[#00F5D4] mt-0.5 flex-shrink-0">✔</span>
            <span>{bullet}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
