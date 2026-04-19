"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lock, ArrowRightLeft, TrendingUp, Gift, Unlock, Download, HelpCircle, X } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useLocale } from "@/components/LocaleProvider";

// Suggestions when wallet has funds — action-oriented
const SUGGESTIONS_FUNDED_KEYS = [
  { key: "sug_stake", icon: Lock },
  { key: "sug_swap", icon: ArrowRightLeft },
  { key: "sug_grow", icon: TrendingUp },
  { key: "sug_claim", icon: Gift },
  { key: "sug_unstake", icon: Unlock },
];

// Suggestions when wallet is empty — guide user to receive funds first
const SUGGESTIONS_EMPTY_KEYS = [
  { key: "sug_recv_init", icon: Download },
  { key: "sug_recv_usdc", icon: Download },
  { key: "sug_help", icon: HelpCircle },
];

interface IntentInputProps {
  onSubmit: (text: string) => void;
  loading?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  /** Pass true when wallet has no assets — switches to onboarding flow. Null means loading so suppress pills. */
  walletEmpty?: boolean | null;
  onTextChange?: (text: string) => void;
  detectedIntent?: string | null;
  placeholderOverride?: string;
}

export default function IntentInput({ onSubmit, loading, disabled, defaultValue, walletEmpty, onTextChange, detectedIntent, placeholderOverride }: IntentInputProps) {
  const [text, setText] = useState(defaultValue ?? "");
  const [focused, setFocused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize(); // Init on client
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Suppress suggestions until balance check completes (walletEmpty !== null)
  const suggestions = walletEmpty === null ? [] : (walletEmpty ? SUGGESTIONS_EMPTY_KEYS : SUGGESTIONS_FUNDED_KEYS);
  
  const isOnline = useOnlineStatus();

  const handleSubmit = () => {
    if (!text.trim() || loading || disabled || !isOnline) return;
    onSubmit(text.trim());
    setText("");
    // Immediately blur so keyboard dismisses and signals "locked"
    textareaRef.current?.blur();
  };

  const selectSuggestion = (s: string) => {
    setText(s);
    textareaRef.current?.focus();
    if (onTextChange) onTextChange(s);
  };

  const canSubmit = !!text.trim() && !loading && !disabled && isOnline;

  // Glow ring intensity driven by focus state
  const glowGradient = focused
    ? "linear-gradient(135deg, #00F5D4 0%, #7C3AED 40%, #0066FF 70%, #00F5D4 100%)"
    : "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)";

  return (
    <div className="space-y-3">
      {/* Animated Gemini-style glow ring wrapper */}
      <div
        className="rounded-2xl transition-all duration-500"
        style={{
          padding: "1.5px",
          backgroundImage: glowGradient,
          backgroundSize: "300% 300%",
          animation: focused ? "glowRingRotate 3s ease-in-out infinite" : "none",
          boxShadow: focused
            ? "0 0 28px rgba(0,245,212,0.18), 0 0 60px rgba(124,58,237,0.08)"
            : "0 0 0 rgba(0,0,0,0)",
        }}
      >
        {/* Inner card — dark background so text stays readable */}
        <div
          className="rounded-2xl overflow-hidden transition-all duration-300 relative flex flex-col w-full"
          style={{ background: "#13161D" }}
        >
          {/* 1. THE DETECTED INTENT HEADER (Only renders if intent exists) */}
          <AnimatePresence>
            {detectedIntent && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full px-5 pt-4 pb-2 border-b border-white/5 bg-white/[0.02] relative"
              >
                <button
                  type="button"
                  onClick={() => {
                    setText("");
                    if (onTextChange) onTextChange("");
                    textareaRef.current?.focus();
                  }}
                  className="absolute top-4 right-4 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-full transition-all duration-200"
                  aria-label="Dismiss Intent"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-pulse" />
                  <span className="text-[10px] font-bold text-[#00F5D4] tracking-widest uppercase">Detected Intent</span>
                </div>
                <p className="text-white font-medium pl-3.5 pr-8 tracking-tight mb-1">{detectedIntent}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2. THE TEXT AREA (Must ALWAYS be visible) */}
          <div className="relative w-full flex-1">
            <textarea
              ref={textareaRef}
              id="intent-input"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (onTextChange) onTextChange(e.target.value);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
              placeholder={placeholderOverride || t("type_intent_placeholder")}
              disabled={loading || disabled || !isOnline}
              className={`w-full bg-transparent pl-5 pt-4 pb-12 pr-[100px] md:pr-[120px] text-base text-text-primary
                         placeholder:text-text-muted resize-none focus:outline-none focus:ring-0 focus:border-transparent border-none align-top leading-relaxed
                         transition-all duration-300 ease-in-out ${focused || text.length > 0 ? "min-h-[140px]" : "min-h-[80px]"}`}
            />

          {/* Bottom Left: Cmd to send helper */}
          <span className="absolute bottom-4 left-5 text-xs text-text-muted hidden md:block pointer-events-none">
            {!isOnline ? (
              <span className="text-red-400/70">{t("offline_reconnect")}</span>
            ) : (
              t("cmd_send")
            )}
          </span>

          {/* Bottom Right: Run Button */}
          <motion.button
            id="intent-submit-btn"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="absolute bottom-3 right-3 rounded-full font-bold text-sm px-5 py-2.5 transition-all duration-200 flex items-center gap-2"
            style={{
              background: canSubmit ? "#00F5D4" : "rgba(255,255,255,0.06)",
              color: canSubmit ? "#000" : "rgba(255,255,255,0.3)",
              boxShadow: canSubmit ? "0 0 16px rgba(0,245,212,0.25)" : "none",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
            whileHover={canSubmit ? { scale: 1.03, boxShadow: "0 0 28px rgba(0,245,212,0.45)" } : undefined}
            whileTap={canSubmit ? { scale: 0.97 } : undefined}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t("generating_strategy")}
              </>
            ) : (
              <>{t("generate_strategy")} <Sparkles className="w-4 h-4" /></>
            )}
          </motion.button>
          </div>
        </div>
      </div>

      {/* Suggestion chips — pill shape, premium tactile feel */}
      <AnimatePresence>
        {!loading && (
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
          >
            {suggestions.map((s, i) => (
              <motion.button
                key={s.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => selectSuggestion(t(s.key))}
                disabled={!isOnline}
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-white/10
                           text-text-secondary bg-white/5
                           hover:text-[#00F5D4] hover:border-[#00F5D4]/30 hover:bg-[#00F5D4]/5
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all duration-150"
              >
                <s.icon className="w-3.5 h-3.5 opacity-70" />
                {t(s.key)}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
