"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Copy } from "lucide-react";
import { Pagination } from "./Pagination";
import type { ActivityEntry } from "../types";
import { API_URL, explorerTxUrl } from "@/lib/config";



export default function StrategyActivity({ entries, address }: { entries?: ActivityEntry[]; address?: string }) {
  const [list, setList] = useState<ActivityEntry[]>(entries ?? []);
  const [loading, setLoading] = useState(!entries);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (entries) return; // caller provided data — skip fetch
    // address is required by the backend (Finding #4 fix: no unauthenticated all-history dump)
    if (!address) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const cacheKey = `intentos_activity_cache_${address}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached && list.length === 0) {
      try {
        setList(JSON.parse(cached));
        setLoading(false);
      } catch {}
    } else if (list.length === 0) {
      setLoading(true);
    }

    fetch(`${API_URL}/api/history?address=${encodeURIComponent(address)}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setList(json.data ?? []);
          localStorage.setItem(cacheKey, JSON.stringify(json.data ?? []));
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [entries, address]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse pt-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)" }} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-12 text-center text-red-400 text-sm">
        Failed to load activity: {error}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-text-muted text-sm">
        No strategy activity yet. Execute your first strategy to see results here.
      </div>
    );
  }

  const totalPages = Math.ceil(list.length / itemsPerPage);
  const paginatedList = list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      {paginatedList.map((entry, i) => {
        const success = entry.result.status === "success";
        const txHash = entry.result.txHash;
        const isReal = txHash && txHash !== "n/a" && !txHash.startsWith("tx_cached") && !txHash.startsWith("mock");
        const explorerUrl = isReal ? explorerTxUrl(txHash) : null;
        const date = new Date(entry.createdAt).toLocaleDateString("en-US", {
          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#13161D]/60 backdrop-blur-md border border-white/5 hover:bg-white/5 hover:border-white/10 transition-colors group"
          >
            {/* Left Side: The Intent */}
            <div className="flex flex-col flex-[1.2] min-w-0">
               <div className="flex items-center gap-2 mb-2 text-xs">
                 <span className={`px-2 py-1 rounded-full border ${
                   success 
                     ? "bg-green-500/10 text-green-400 border-green-500/20" 
                     : "bg-red-500/10 text-red-400 border-red-500/20"
                 }`}>
                   {success ? "Success" : "Failed"}
                 </span>
                 <span className="text-gray-500">{date}</span>
               </div>
               <p className="text-[17px] font-mono text-white mt-1 leading-snug truncate">
                 &gt; &quot;{entry.intentText}&quot;
               </p>
            </div>

            {/* Middle: The Details */}
            <div className="flex flex-col flex-[1.4] min-w-0 gap-2">
               <div className="flex flex-wrap gap-2">
                 {entry.bundle.steps.slice(0, 3).map((step) => (
                    <span key={step.index} className="rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs px-3 py-1 truncate max-w-[150px]">
                      {step.description}
                    </span>
                 ))}
                 {entry.bundle.steps.length > 3 && (
                    <span className="rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs px-3 py-1">
                      +{entry.bundle.steps.length - 3} more
                    </span>
                 )}
               </div>
               
               {txHash && txHash !== "n/a" && (
                 <div className="flex items-center gap-2 mt-1">
                   <p className="text-xs text-gray-500 font-mono">
                     {isReal ? `${txHash.slice(0, 6)}...${txHash.slice(-4)}` : txHash}
                   </p>
                   {isReal && (
                     <Copy 
                       className="w-3.5 h-3.5 text-gray-500 hover:text-[#00F5D4] cursor-pointer transition-colors" 
                       onClick={() => navigator.clipboard.writeText(txHash)}
                     />
                   )}
                 </div>
               )}
            </div>

            {/* Right Side: Results & Action */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center shrink-0 w-full md:w-auto mt-2 md:mt-0 gap-2.5">
               {entry.performance && (
                 <p className="text-sm font-bold text-green-400">
                   {entry.performance} return
                 </p>
               )}
               {explorerUrl && (
                 <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full text-xs border border-[#00F5D4]/30 text-[#00F5D4] hover:bg-[#00F5D4]/10 px-4 py-1.5 transition-colors whitespace-nowrap text-center"
                 >
                    View on Explorer
                 </a>
               )}
            </div>
          </motion.div>
        );
      })}

      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
