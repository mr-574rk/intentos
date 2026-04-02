"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Check, Zap, Loader2 } from "lucide-react";

interface ExecuteButtonProps {
  onExecute: () => Promise<void>;
  disabled?: boolean;
  executed?: boolean;
}

export default function ExecuteButton({ onExecute, disabled, executed }: ExecuteButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(executed ?? false);

  const handle = async () => {
    if (loading || done || disabled) return;
    setLoading(true);
    try {
      await onExecute();
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success font-semibold"
      >
        <Check className="w-5 h-5" />
        Strategy Executed Successfully
      </motion.div>
    );
  }

  return (
    <motion.button
      id="execute-strategy-btn"
      onClick={handle}
      disabled={!!disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      className={clsx(
        "relative w-full py-4 px-6 rounded-xl font-bold text-base transition-all duration-200 overflow-hidden",
        disabled || loading
          ? "opacity-50 cursor-not-allowed bg-bg-elevated border border-border-default text-text-muted"
          : "btn-primary text-bg-primary shadow-glow-strong"
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="animate-spin w-5 h-5" />
          Executing Bundle…
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <Zap className="w-5 h-5" /> Execute Strategy
        </span>
      )}
      {/* Shimmer on hover */}
      {!disabled && !loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] hover:translate-x-[200%] transition-transform duration-700 pointer-events-none" />
      )}
    </motion.button>
  );
}
