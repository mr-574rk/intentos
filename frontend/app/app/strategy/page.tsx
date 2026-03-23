"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StrategyPreview from "@/components/StrategyPreview";
import SimulationPanel from "@/components/SimulationPanel";
import ExecuteButton from "@/components/ExecuteButton";
import type { Strategy, ApiResponse, ExecutionResult } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://1492-197-210-77-187.ngrok-free.app";

export default function StrategyPage() {
  const router = useRouter();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executed, setExecuted] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("intentos_strategy");
    if (stored) {
      try { setStrategy(JSON.parse(stored) as Strategy); } catch { /* ignore */ }
    }
  }, []);

  const handleExecute = async () => {
    if (!strategy) return;
    setExecuting(true);
    try {
      const res = await fetch(`${API}/api/execute/${strategy.id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "69420" 
        },
        body: JSON.stringify({ sessionKey: "" }), // populated with InterwovenKit session
      });
      const data: ApiResponse<ExecutionResult> = await res.json();
      if (!data.success) throw new Error(data.error ?? "Execution failed");
      setExecuted(true);
      // Navigate to portfolio after 1.5s
      setTimeout(() => router.push("/app/portfolio"), 1500);
    } finally {
      setExecuting(false);
    }
  };

  if (!strategy) {
    return (
      <div className="max-w-2xl mx-auto glass-card p-12 text-center space-y-4">
        <p className="text-text-muted text-sm">No strategy found.</p>
        <button onClick={() => router.push("/app/intent")} className="btn-primary">
          ← Generate a Strategy
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-text-primary mb-1">Strategy Ready</h1>
          <p className="text-text-secondary text-sm">
            Review your strategy and simulation results. Click execute to run it on-chain.
          </p>
        </div>
        <button onClick={() => router.push("/app/intent")} className="btn-secondary text-xs px-3 py-2">
          ← New Intent
        </button>
      </div>

      <StrategyPreview bundle={strategy.bundle} />

      {strategy.simulation && <SimulationPanel simulation={strategy.simulation} />}

      <ExecuteButton
        onExecute={handleExecute}
        disabled={!strategy.simulation?.passed || executing}
        executed={executed}
      />

      {strategy.simulation && !strategy.simulation.passed && (
        <p className="text-xs text-status-error text-center">
          ⚠ Strategy is flagged — execution is disabled. Adjust your intent for a lower-risk strategy.
        </p>
      )}
    </div>
  );
}
