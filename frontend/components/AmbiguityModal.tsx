"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Target, Shield, Activity, Zap } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";

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
  const { t } = useLocale();
  
  // Use translations inside the component so they respond to language switches
  const OPTION_META = [
    {
      Icon: Shield,
      label: t("modal_strat_low_risk") || "Low Risk",
      subtext: t("modal_strat_low_risk_sub") || "Single-sided INIT staking",
    },
    {
      Icon: Activity,
      label: t("modal_strat_mod_yield") || "Moderate Yield",
      subtext: t("modal_strat_mod_yield_sub") || "Balanced staking & liquidity",
    },
    {
      Icon: Zap,
      label: t("modal_strat_agg") || "Aggressive",
      subtext: t("modal_strat_agg_sub") || "Max yield, higher exposure",
    },
  ];
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="ambiguity-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      >
        {/* Modal Card */}
        <motion.div
          key="ambiguity-card"
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="w-full max-w-md p-8 rounded-[2rem] border border-white/10 relative"
          style={{
            background: "rgba(19,22,29,0.92)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 50px rgba(0,0,0,0.8), 0 0 80px rgba(0,245,212,0.04)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Subtle teal glow top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 rounded-full blur-[40px] pointer-events-none"
            style={{ background: "rgba(0,245,212,0.08)" }} />

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6 relative">
            <div className="inline-flex items-center justify-center bg-[#00F5D4]/10 p-3 rounded-full mb-4 border border-[#00F5D4]/20">
              <Target className="w-6 h-6 text-[#00F5D4]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              {t("modal_select_strategy") || "Select Strategy"}
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              {question || (t("modal_ambiguity_subtitle") || "How would you like the AI to optimize this intent?")}
            </p>
          </div>

          {/* Strategy Cards */}
          <div className="space-y-3">
            {options.map((opt, i) => {
              const meta = OPTION_META[i] ?? { Icon: Zap, label: opt, subtext: "" };
              const { Icon, label, subtext } = meta;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 22 }}
                  onClick={() => onSelect(opt)}
                  className="w-full text-left bg-white/5 border border-white/5 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00F5D4]/50 hover:bg-[#00F5D4]/10 group"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-[#00F5D4]/10 group-hover:border-[#00F5D4]/30 transition-colors">
                      <Icon className="w-4 h-4 text-gray-400 group-hover:text-[#00F5D4] transition-colors" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm leading-snug">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-400 transition-colors truncate">{opt}</p>
                    </div>

                    {/* Arrow hint */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#00F5D4]/40 transition-colors">
                      <svg className="w-3 h-3 text-white/20 group-hover:text-[#00F5D4] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Auto-select ghost button */}
          <button
            onClick={onDismiss}
            className="mt-4 w-full py-3 rounded-xl border border-dashed border-white/20 text-gray-400 text-sm flex items-center justify-center gap-2 hover:border-[#00F5D4]/50 hover:text-[#00F5D4] transition-colors duration-200"
          >
            <Zap className="w-3.5 h-3.5" />
            {t("modal_auto_select") || "Auto-Select Best Strategy"}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
