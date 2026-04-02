"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { readAutopilotState, writeAutopilotState } from "@/lib/autopilotState";
import { Bot } from "lucide-react";

export default function GlobalAutopilotToggle({ inline = false }: { inline?: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const checkState = () => {
      setEnabled(readAutopilotState().enabled);
    };
    checkState();
    window.addEventListener("storage", checkState);
    return () => window.removeEventListener("storage", checkState);
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !enabled;
    setEnabled(next);
    writeAutopilotState({ enabled: next });
  };

  const openSettings = () => {
    router.push("/app/autopilot");
  };

  return (
    <div
      onClick={openSettings}
      className={`${
        inline
          ? "relative flex"
          : "absolute top-4 right-4 md:top-6 md:right-8 z-50"
      } flex items-center gap-3 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200`}
      style={{
        background: enabled ? "rgba(0,245,212,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${enabled ? "rgba(0,245,212,0.2)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div className="flex items-center gap-1.5">
        <Bot className="w-4 h-4" style={{ color: enabled ? "#00F5D4" : "#828A9E" }} />
        <span className="hidden sm:inline-block text-xs font-medium" style={{ color: enabled ? "#00F5D4" : "#828A9E" }}>
          Autopilot
        </span>
      </div>

      {/* Apple-style Switch */}
      <button 
        onClick={toggle}
        className="relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none"
        style={{
          background: enabled ? "#00F5D4" : "rgba(255,255,255,0.15)",
        }}
      >
        <span 
          className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200"
          style={{ transform: enabled ? "translateX(16px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}
