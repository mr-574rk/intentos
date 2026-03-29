"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import StrategyHistory from "@/components/StrategyHistory";
import { Zap, Bot } from "lucide-react";

interface SystemEvent {
  label: string;
  raw:   string;
  timestamp: string;
}

function SystemEvents() {
  const [events, setEvents] = useState<SystemEvent[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("intentos_system_events");
      if (raw) setEvents(JSON.parse(raw) as SystemEvent[]);
    } catch { /* ignore */ }
  }, []);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <Bot className="w-5 h-5" style={{ color: "#7C3AED" }} />
        </div>
        <p className="text-sm font-semibold text-text-primary mb-1">No system events yet</p>
        <p className="text-xs text-text-muted">Try: <span className="font-mono">"enable autopilot"</span> on the Intent page</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {events.map((ev, i) => {
        const isEnable  = ev.label.toLowerCase().includes("enable");
        const isDisable = ev.label.toLowerCase().includes("disable");
        const color     = isEnable ? "#00F5D4" : isDisable ? "#FF4D6D" : "#7C3AED";
        const icon      = isEnable ? "🤖" : isDisable ? "⏸" : "⚙";
        const date      = new Date(ev.timestamp).toLocaleString("en-US", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: `${color}08`, border: `1px solid ${color}16` }}
          >
            <span className="text-lg">{icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">{ev.label}</p>
              <p className="text-xs text-text-muted font-mono truncate">{ev.raw}</p>
            </div>
            <p className="text-[10px] text-text-muted flex-shrink-0">{date}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

type Tab = "transactions" | "system";

export default function HistoryPage() {
  const { isConnected } = useWalletGuard();
  const [tab, setTab] = useState<Tab>("transactions");

  if (!isConnected) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-black text-text-primary mb-1">History</h1>
        <p className="text-text-secondary text-sm">All past transactions and system events.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {([["transactions", Zap, "Transactions"], ["system", Bot, "System Events"]] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: tab === id ? "rgba(255,255,255,0.08)" : "transparent",
              color:      tab === id ? "#F0F4FF" : "#828A9E",
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "transactions" ? <StrategyHistory /> : <SystemEvents />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
