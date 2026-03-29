"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowUpRight } from "lucide-react";

// Suggestions when wallet has funds — action-oriented
const SUGGESTIONS_FUNDED = [
  "stake 1 init",
  "swap 0.5 init to usdc",
  "grow my portfolio",
  "claim staking rewards",
  "unstake half my init",
];

// Suggestions when wallet is empty — guide user to receive funds first
const SUGGESTIONS_EMPTY = [
  "receive init",
  "receive usdc",
  "how do I get started?",
];

interface IntentInputProps {
  onSubmit:      (text: string) => void;
  loading?:      boolean;
  disabled?:     boolean;
  defaultValue?: string;
  /** Pass true when wallet has no assets — suggestions switch to onboarding flow */
  walletEmpty?:  boolean;
}

export default function IntentInput({ onSubmit, loading, disabled, defaultValue, walletEmpty }: IntentInputProps) {
  const [text, setText] = useState(defaultValue ?? "");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = walletEmpty ? SUGGESTIONS_EMPTY : SUGGESTIONS_FUNDED;

  const handleSubmit = () => {
    if (!text.trim() || loading || disabled) return;
    onSubmit(text.trim());
  };

  const selectSuggestion = (s: string) => {
    setText(s);
    textareaRef.current?.focus();
  };

  const canSubmit = !!text.trim() && !loading && !disabled;

  return (
    <div className="space-y-3">
      {/* Main input card */}
      <div
        className="bg-bg-elevated border border-border-default transition-all duration-150 relative"
        style={{
          borderColor: focused ? "rgba(0,245,212,0.4)" : undefined,
          boxShadow: focused ? "0 0 0 1px rgba(0,245,212,0.4), 0 8px 30px rgba(0,0,0,0.8)" : undefined,
        }}
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
          placeholder="e.g. stake 0.5 INIT · swap USDC to INIT · grow my portfolio safely · enable autopilot"
          disabled={loading || disabled}
          rows={3}
          className="w-full bg-transparent px-5 pt-5 pb-3 text-base text-text-primary
                     placeholder:text-text-muted resize-none focus:outline-none leading-relaxed"
        />

        {/* Toolbar row */}
        <div className="flex items-center justify-between px-5 pb-5 pt-3">
          <span className="text-xs text-text-muted">⌘↵ to send</span>
          <motion.button
            id="intent-submit-btn"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary px-5 py-2.5 text-sm"
            whileHover={canSubmit ? { scale: 1.02 } : undefined}
            whileTap={canSubmit ? { scale: 0.98 } : undefined}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Thinking…
              </span>
            ) : (
              <span className="flex items-center gap-2">Generate <Sparkles className="w-4 h-4"/></span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Suggestion chips — max 3, ChatGPT style */}
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
                key={s}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => selectSuggestion(s)}
                className="flex items-center gap-1.5 text-xs px-3.5 py-2 border text-text-secondary
                           hover:text-[#00F5D4] hover:border-[#00F5D4]/30
                           bg-bg-secondary hover:bg-[#00F5D4]/5
                           transition-all duration-150"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                {s} <ArrowUpRight className="w-3 h-3 opacity-50" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
