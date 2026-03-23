"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AgentTimeline from "@/components/AgentTimeline";
import ExecuteButton from "@/components/ExecuteButton";
import type { Strategy, ApiResponse, ExecutionResult, AgentTimeline as TimelineType } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://1492-197-210-77-187.ngrok-free.app";

export default function ExecutePage() {
  const router = useRouter();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [timeline, setTimeline] = useState<TimelineType | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("intentos_strategy");
    if (stored) {
      const s = JSON.parse(stored) as Strategy;
      setStrategy(s);
      // Fetch existing timeline
      fetch(`${API}/api/agent/timeline/${s.id}`, {
        headers: { "ngrok-skip-browser-warning": "69420" }
      })
        .then((r) => r.json())
        .then((d: ApiResponse<TimelineType>) => { if (d.data) setTimeline(d.data); })
        .catch(() => undefined);
    }
  }, []);

  const handleExecute = async () => {
    if (!strategy) return;
    setError(null);
    try {
      const res = await fetch(`${API}/api/execute/${strategy.id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420" 
        },
        body: JSON.stringify({ sessionKey: "" }),
      });
      const data: ApiResponse<ExecutionResult> = await res.json();
      if (!data.success || !data.data) throw new Error(data.error ?? "Execution failed");
      setResult(data.data);

      // Refresh timeline
      const tlRes = await fetch(`${API}/api/agent/timeline/${strategy.id}`, {
        headers: { "ngrok-skip-browser-warning": "69420" }
      });
      const tlData: ApiResponse<TimelineType> = await tlRes.json();
      if (tlData.data) setTimeline(tlData.data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-text-primary mb-1">Execute Strategy</h1>
        <p className="text-text-secondary text-sm">
          Review the agent pipeline and approve execution.
        </p>
      </div>

      {!strategy && (
        <div className="glass-card p-12 text-center space-y-4">
          <p className="text-text-muted text-sm">No strategy ready for execution.</p>
          <button onClick={() => router.push("/app/intent")} className="btn-primary">
            ← Start with an Intent
          </button>
        </div>
      )}

      {strategy && (
        <>
          {/* Strategy summary */}
          <div className="glass-card p-5">
            <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">Intent</p>
            <p className="text-sm font-semibold text-text-primary">&quot;{strategy.intent.rawText}&quot;</p>
            <div className="flex gap-3 mt-3 text-xs text-text-muted">
              <span>{strategy.bundle.steps.length} steps</span>
              <span>·</span>
              <span>~{strategy.bundle.estimatedYield}% APY</span>
              <span>·</span>
              <span className="capitalize">{strategy.bundle.riskScore} risk</span>
            </div>
          </div>

          <AgentTimeline timeline={timeline} />

          {!result && (
            <ExecuteButton
              onExecute={handleExecute}
              disabled={strategy.simulation ? !strategy.simulation.passed : false}
            />
          )}

          {error && (
            <div className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-3">
              ⚠ {error}
            </div>
          )}

          {result && (
            <div className="glass-card p-5 space-y-3">
              <p className="text-sm font-semibold text-status-success">✓ Execution complete</p>
              <div className="text-xs text-text-muted space-y-1 font-mono">
                <p>Mode: <span className="text-text-primary">{result.mode}</span></p>
                <p>Tx Hash: <span className="text-accent-cyan">{result.txHash}</span></p>
                <p>Status: <span className="text-status-success">{result.status}</span></p>
              </div>
              <button onClick={() => router.push("/app/portfolio")} className="btn-primary w-full mt-2">
                View Portfolio →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
