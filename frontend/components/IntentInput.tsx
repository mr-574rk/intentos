"use client";

import { useState, useRef } from "react";

const EXAMPLE_INTENTS = [
  "Earn stable yield with low risk",
  "Maximize my INIT returns over 3 months",
  "Diversify my portfolio across DeFi protocols",
  "Generate passive income with medium risk",
];

interface IntentInputProps {
  onSubmit: (text: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function IntentInput({ onSubmit, loading, disabled }: IntentInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!text.trim() || loading || disabled) return;
    onSubmit(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🧠</span>
        <h2 className="font-semibold text-text-primary">What&apos;s your financial goal?</h2>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          id="intent-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Earn stable yield with low risk…"
          disabled={loading || disabled}
          rows={3}
          className="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-3.5 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-cyan/50 transition-colors text-sm disabled:opacity-50"
        />
        <div className="absolute bottom-3 right-3 text-xs text-text-muted">
          ⌘↵ to send
        </div>
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLE_INTENTS.map((ex) => (
          <button
            key={ex}
            onClick={() => { setText(ex); textareaRef.current?.focus(); }}
            className="text-xs px-3 py-1.5 bg-bg-elevated border border-border-default rounded-lg text-text-secondary hover:text-accent-cyan hover:border-accent-cyan/30 transition-all"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        id="intent-submit-btn"
        onClick={handleSubmit}
        disabled={!text.trim() || !!loading || !!disabled}
        className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? (
          <>
            <span className="animate-spin text-base">◌</span>
            Processing Intent…
          </>
        ) : (
          <>⚡ Generate Strategy</>
        )}
      </button>
    </div>
  );
}
