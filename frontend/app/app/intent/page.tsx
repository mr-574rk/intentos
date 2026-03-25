"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IntentInput from "@/components/IntentInput";
import AgentTimeline from "@/components/AgentTimeline";
import AmbiguityModal from "@/components/AmbiguityModal";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import type {
  ApiResponse,
  Strategy,
  AgentTimeline as TimelineType,
  AmbiguityResponse,
} from "@/types";
import { API_URL, API_HEADERS } from "@/lib/config";

export default function IntentPage() {
  const router = useRouter();
  const { isConnected } = useWalletGuard();
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ambiguity, setAmbiguity] = useState<AmbiguityResponse | null>(null);
  const [pendingText, setPendingText] = useState<string>("");

  if (!isConnected) return null;

  // ── Core submit ──────────────────────────────────────────────
  const handleSubmit = async (text: string) => {
    setLoading(true);
    setError(null);
    setTimeline(null);
    setAmbiguity(null);
    setPendingText(text);

    try {
      const res = await fetch(`${API_URL}/api/execute/intent`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ text }),
      });
      const data: ApiResponse<Strategy | AmbiguityResponse> = await res.json();

      if (!data.success || !data.data) throw new Error(data.error ?? "Pipeline failed");

      // Ambiguity response — show clarification modal
      if ("ambiguous" in data.data && data.data.ambiguous) {
        setAmbiguity(data.data as AmbiguityResponse);
        setLoading(false);
        return;
      }

      const strategy = data.data as Strategy;

      // Fetch the timeline
      const tlRes = await fetch(`${API_URL}/api/agent/timeline/${strategy.id}`, {
        headers: API_HEADERS,
      });
      const tlData: ApiResponse<TimelineType> = await tlRes.json();
      if (tlData.success && tlData.data) setTimeline(tlData.data);

      // Navigate to strategy page
      sessionStorage.setItem("intentos_strategy", JSON.stringify(strategy));
      setTimeout(() => router.push("/app/strategy"), 800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ── Ambiguity: user selects a clarification option ───────────
  const handleClarify = (option: string) => {
    setAmbiguity(null);
    // Append the user's pick to the original text so the parser classifies it precisely
    const clarified = `${pendingText} — ${option}`;
    handleSubmit(clarified);
  };

  const timelineActive = loading || !!timeline || !!error;

  return (
    <>
      {/* Ambiguity Modal */}
      {ambiguity && (
        <AmbiguityModal
          question={ambiguity.question}
          options={ambiguity.options}
          onSelect={handleClarify}
          onDismiss={() => {
            setAmbiguity(null);
            // Auto-proceed with default low-risk
            handleSubmit(`${pendingText} — low risk yield`);
          }}
        />
      )}

      <div className="flex flex-col h-full w-full max-w-2xl mx-auto px-1">
        {/* Header */}
        <div className="pt-3 pb-4 md:pt-6">
          <h1 className="text-2xl font-black text-text-primary tracking-tight mb-1">Financial Goal</h1>
          <p className="text-text-secondary text-sm leading-relaxed">
            Tell IntentOS what you want &mdash; it&apos;ll build and execute a strategy for you.
          </p>
        </div>

        {/* Agent Timeline */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            timelineActive
              ? "max-h-[420px] opacity-100 mb-4"
              : "max-h-0 opacity-0 mb-0"
          }`}
        >
          {error && (
            <div className="text-sm text-status-error bg-bg-elevated border border-status-error/30 p-4 mb-3">
              <span className="font-bold mr-2">Error:</span> {error}
            </div>
          )}
          <AgentTimeline timeline={timeline} loading={loading} />
        </div>

        {/* Intent Input */}
        <div className="flex-none">
          <IntentInput onSubmit={handleSubmit} loading={loading} disabled={!!timeline} />
        </div>
      </div>
    </>
  );
}
