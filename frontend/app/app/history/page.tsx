"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletGuard } from "@/hooks/useWalletGuard";
import StrategyHistory from "@/components/StrategyHistory";
import { Zap, Bot, Terminal } from "lucide-react";
import { Pagination } from "@/components/Pagination";

interface SystemEvent {
  label: string;
  raw:   string;
  timestamp: string;
}

function SystemEvents({ address }: { address: string }) {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`intentos_system_events_${address}`);
      if (raw) setEvents(JSON.parse(raw) as SystemEvent[]);
      else setEvents([]);
    } catch { /* ignore */ }
  }, [address]);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <Bot className="w-5 h-5" style={{ color: "#7C3AED" }} />
        </div>
        <p className="text-sm font-semibold text-text-primary mb-1">No system events yet</p>
        <p className="text-xs text-text-muted">Try: <span className="font-mono">&quot;enable autopilot&quot;</span> on the Intent page</p>
      </div>
    );
  }

  const totalPages = Math.ceil(events.length / itemsPerPage);
  const paginatedEvents = events.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-2">
      {paginatedEvents.map((ev, i) => {
        const date = new Date(ev.timestamp).toLocaleString("en-US", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-[#13161D]/40 border border-white/5 rounded-xl p-4 flex items-center justify-between mb-3 hover:bg-white/5 transition-colors gap-4"
          >
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 shrink-0">
                <Terminal className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center ml-3 min-w-0 gap-1.5 sm:gap-3">
                <span className="font-mono text-white text-sm truncate">&gt; {ev.raw}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-gray-400 w-fit shrink-0">
                  {ev.label}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-600 flex-shrink-0 ml-2">{date}</p>
          </motion.div>
        );
      })}

      <div className="flex justify-center w-full mt-4 pb-8">
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

type Tab = "transactions" | "system";

export default function HistoryPage() {
  const { isConnected, address } = useWalletGuard();
  const [tab, setTab] = useState<Tab>("transactions");

  if (!isConnected || !address) return null;

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
          {tab === "transactions" ? <StrategyHistory address={address} /> : <SystemEvents address={address} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
