"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IntentInput from "@/components/IntentInput";
import AgentTimeline from "@/components/AgentTimeline";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import type { ApiResponse, Strategy, AgentTimeline as TimelineType } from "@/types";

import { API_URL, API_HEADERS } from "@/lib/config";

export default function IntentPage() {
  const router = useRouter();
  const { isConnected } = useWalletGuard(); // Redirects to /onboarding if not connected
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (text: string) => {
    setLoading(true);
    setError(null);
    setTimeline(null);

    try {
      // Call the agent pipeline
      const res = await fetch(`${API_URL}/api/execute/intent`, {
        method: "POST",
        headers: API_HEADERS,
        body: JSON.stringify({ text }),
      });
      const data: ApiResponse<Strategy> = await res.json();
      if (!data.success || !data.data) throw new Error(data.error ?? "Pipeline failed");

      const strategy = data.data;

      // Fetch the timeline
      const tlRes = await fetch(`${API_URL}/api/agent/timeline/${strategy.id}`, {
        headers: API_HEADERS,
      });
      const tlData: ApiResponse<TimelineType> = await tlRes.json();
      if (tlData.success && tlData.data) setTimeline(tlData.data);

      // Store strategy in sessionStorage and navigate to strategy page
      sessionStorage.setItem("intentos_strategy", JSON.stringify(strategy));
      setTimeout(() => router.push("/app/strategy"), 800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Timeline is "active" whenever we're loading or have results to show
  const timelineActive = loading || !!timeline || !!error;

  return (
    <div className="flex flex-col h-full w-full max-w-2xl mx-auto px-1">
      {/* Header — compact, no wasted space */}
      <div className="pt-3 pb-4 md:pt-6">
        <h1 className="text-2xl font-black text-text-primary tracking-tight mb-1">Financial Goal</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Tell IntentOS what you want &mdash; it&apos;ll build and execute a strategy for you.
        </p>
      </div>

      {/* ② Collapsible AgentTimeline accordion ─────────────────────────────
           Sits BETWEEN description and input — exactly like ChatGPT.
           Collapses to nothing when idle → no dead space.
           Expands smoothly when the AI starts processing.
           scrollIntoView auto-scroll inside AgentTimeline.tsx is intact.
      ─────────────────────────────────────────────────────────────────── */}
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

      {/* ③ Intent Input — always visible, sits below the accordion */}
      <div className="flex-none">
        <IntentInput onSubmit={handleSubmit} loading={loading} />
      </div>
    </div>
  );
}
