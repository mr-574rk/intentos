"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lock, ArrowRightLeft, TrendingUp, Gift, Unlock, Download, HelpCircle } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

// Suggestions when wallet has funds — action-oriented
const SUGGESTIONS_FUNDED = [
  { text: "stake 1 init", icon: Lock },
  { text: "swap 0.5 init to usdc", icon: ArrowRightLeft },
  { text: "grow my portfolio", icon: TrendingUp },
  { text: "claim staking rewards", icon: Gift },
  { text: "unstake half my init", icon: Unlock },
];

// Suggestions when wallet is empty — guide user to receive funds first
const SUGGESTIONS_EMPTY = [
  { text: "receive init", icon: Download },
  { text: "receive usdc", icon: Download },
  { text: "how do I get started?", icon: HelpCircle },
];

interface IntentInputProps {
  onSubmit: (text: string) => void;
  loading?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  /** Pass true when wallet has no assets — switches to onboarding flow. Null means loading so suppress pills. */
  walletEmpty?: boolean | null;
}

export default function IntentInput({ onSubmit, loading, disabled, defaultValue, walletEmpty }: IntentInputProps) {
  const [text, setText] = useState(defaultValue ?? "");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Suppress suggestions until balance check completes (walletEmpty !== null)
  const suggestions = walletEmpty === null ? [] : (walletEmpty ? SUGGESTIONS_EMPTY : SUGGESTIONS_FUNDED);
  
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
          className="rounded-2xl overflow-hidden transition-all duration-300 relative flex flex-col justify-between"
          style={{ background: "#13161D", height: (focused || text.length > 0) ? "160px" : "80px" }}
        >
          <textarea
            ref={textareaRef}
            id="intent-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
            placeholder="e.g. stake 0.5 INIT · swap USDC to INIT · enable autopilot"
            disabled={loading || disabled || !isOnline}
            className="w-full bg-transparent pt-4 px-5 pb-16 text-base text-text-primary
                       placeholder:text-text-muted resize-none focus:outline-none focus:ring-0 focus:border-transparent border-none align-top leading-relaxed
                       transition-all duration-300 ease-in-out h-full"
          />

          {/* Toolbar row */}
          <div className="absolute bottom-3 left-5 right-3 flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {!isOnline ? (
                <span className="text-red-400/70">Offline — reconnect to send</span>
              ) : (
                "⌘↵ to send"
              )}
            </span>
            <motion.button
              id="intent-submit-btn"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-full font-bold text-sm px-5 py-2.5 transition-all duration-200 flex items-center gap-2"
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
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running…
                </>
              ) : (
                <>Run <Sparkles className="w-4 h-4" /></>
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
                key={s.text}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => selectSuggestion(s.text)}
                disabled={!isOnline}
                className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full border border-white/10
                           text-text-secondary bg-white/5
                           hover:text-[#00F5D4] hover:border-[#00F5D4]/30 hover:bg-[#00F5D4]/5
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all duration-150"
              >
                <s.icon className="w-3.5 h-3.5 opacity-70" />
                {s.text}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
