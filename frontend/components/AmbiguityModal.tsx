"use client";

import { motion, AnimatePresence } from "framer-motion";

interface AmbiguityModalProps {
  question: string;
  options: string[];
  onSelect: (option: string) => void;
  onDismiss: () => void;
}

export default function AmbiguityModal({
  question,
  options,
  onSelect,
  onDismiss,
}: AmbiguityModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={onDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25 }}
          className="glass-card p-6 w-full max-w-sm space-y-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤔</span>
            <h2 className="text-base font-bold text-text-primary">Clarify Your Goal</h2>
          </div>

          <p className="text-sm text-text-secondary">{question}</p>

          {/* Options */}
          <div className="space-y-2">
            {options.map((opt, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onSelect(opt)}
                className="w-full text-left px-4 py-3 rounded-xl border border-border-default
                           text-sm text-text-primary bg-bg-elevated
                           hover:border-accent-cyan/40 hover:bg-white/5
                           transition-all duration-200 flex items-center gap-3"
              >
                <span className="text-[#00F5D4] font-bold">{i + 1}.</span>
                <span>{opt}</span>
              </motion.button>
            ))}
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
          >
            Cancel — let IntentOS decide
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
