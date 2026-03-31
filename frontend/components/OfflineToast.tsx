"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineToast() {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [everWentOffline, setEverWentOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setEverWentOffline(true);
      setShowReconnected(false);
    } else if (everWentOffline && isOnline) {
      setShowReconnected(true);
      const t = setTimeout(() => {
        setShowReconnected(false);
        setEverWentOffline(false);
      }, 3500);
      return () => clearTimeout(t);
    }
  }, [isOnline, everWentOffline]);

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col gap-2 items-end">
      <AnimatePresence mode="wait">
        {!isOnline && (
          <motion.div
            key="offline-toast"
            initial={{ opacity: 0, y: -12, x: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,   x: 0,  scale: 1    }}
            exit  ={{ opacity: 0, y: -12, x: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl shadow-2xl border"
            style={{
              background: "rgba(18, 18, 25, 0.92)",
              borderColor: "rgba(239,68,68,0.35)",
              boxShadow: "0 4px 30px rgba(239,68,68,0.15), 0 0 0 1px rgba(239,68,68,0.1)",
            }}
          >
            <span
              className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <WifiOff className="w-4 h-4" style={{ color: "#ef4444" }} />
            </span>
            <div>
              <p className="text-sm font-bold" style={{ color: "#fca5a5" }}>No internet connection</p>
              <p className="text-xs" style={{ color: "rgba(252,165,165,0.6)" }}>All actions disabled until reconnected</p>
            </div>
            {/* Animated pulse ring on icon */}
            <span className="absolute inset-0 rounded-2xl border border-red-500/20 animate-ping opacity-10 pointer-events-none" />
          </motion.div>
        )}

        {showReconnected && (
          <motion.div
            key="reconnected-toast"
            initial={{ opacity: 0, y: -12, x: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,   x: 0,  scale: 1    }}
            exit  ={{ opacity: 0, y: -12, x: 12, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl shadow-2xl border"
            style={{
              background: "rgba(18, 18, 25, 0.92)",
              borderColor: "rgba(16,185,129,0.3)",
              boxShadow: "0 4px 30px rgba(16,185,129,0.12), 0 0 0 1px rgba(16,185,129,0.08)",
            }}
          >
            <span
              className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <Wifi className="w-4 h-4" style={{ color: "#10b981" }} />
            </span>
            <div>
              <p className="text-sm font-bold" style={{ color: "#6ee7b7" }}>Back online</p>
              <p className="text-xs" style={{ color: "rgba(110,231,183,0.6)" }}>All systems operational</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
