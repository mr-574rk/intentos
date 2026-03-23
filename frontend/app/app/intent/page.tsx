"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import IntentInput from "@/components/IntentInput";
import AgentTimeline from "@/components/AgentTimeline";
import type { ApiResponse, Strategy, AgentTimeline as TimelineType } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://1492-197-210-77-187.ngrok-free.app";

export default function IntentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<TimelineType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (text: string) => {
    setLoading(true);
    setError(null);
    setTimeline(null);

    try {
      // Call the agent pipeline
      const res = await fetch(`${API}/api/execute/intent`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420" 
        },
        body: JSON.stringify({ text }),
      });
      const data: ApiResponse<Strategy> = await res.json();
      if (!data.success || !data.data) throw new Error(data.error ?? "Pipeline failed");

      const strategy = data.data;

      // Fetch the timeline
      const tlRes = await fetch(`${API}/api/agent/timeline/${strategy.id}`, {
        headers: { "ngrok-skip-browser-warning": "69420" }
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text-primary mb-1">What&apos;s your financial goal?</h1>
        <p className="text-text-secondary text-sm">Tell IntentOS what you want to achieve &mdash; it&apos;ll build and simulate a strategy for you.</p>
      </div>

      <IntentInput onSubmit={handleSubmit} loading={loading} />

      {error && (
        <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3">
          ⚠ {error}
        </div>
      )}

      <AgentTimeline timeline={timeline} loading={loading} />
    </div>
  );
}
