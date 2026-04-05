"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ExternalLink, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Strategy } from "@/types";
import { explorerTxUrl, EXPLORER_BASE } from "@/lib/config";

interface SuccessModalProps {
  open: boolean;
  strategy: Strategy | null;
  txHash?: string;
  onClose: () => void;
}

// Animated checkmark ring — Initia mint brand
function CheckRing() {
  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      {/* Pulsing outer ring */}
      <span
        className="absolute inset-0 rounded-full animate-ping"
        style={{ background: "rgba(0,245,212,0.15)" }}
      />
      {/* Static ring */}
      <span
        className="absolute inset-0 rounded-full"
        style={{ border: "1px solid rgba(0,245,212,0.3)" }}
      />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 340, damping: 22, delay: 0.1 }}
      >
        <CheckCircle2 className="w-10 h-10" style={{ color: "#00F5D4" }} />
      </motion.div>
    </div>
  );
}

export default function SuccessModal({ open, strategy, txHash, onClose }: SuccessModalProps) {
  const router = useRouter();
  const steps = strategy?.bundle?.steps ?? [];

  const handleClose = () => {
    onClose();
    router.push("/app/portfolio");
  };

  const explorerUrl = txHash ? explorerTxUrl(txHash) : EXPLORER_BASE;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md pointer-events-auto"
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              style={{
                background: "#000",
                border: "1px solid rgba(0,245,212,0.25)",
                boxShadow: "0 0 40px rgba(0,245,212,0.15), 0 24px 60px rgba(0,0,0,1)",
                borderRadius: "16px",
              }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 space-y-6">
                {/* Top — animated check */}
                <div className="flex flex-col items-center gap-3">
                  <CheckRing />
                  <div className="text-center">
                    <p className="text-xl font-black text-white tracking-tight">Strategy Executed</p>
                    <p className="text-sm text-text-muted mt-1">
                      All steps confirmed on-chain
                    </p>
                  </div>
                </div>

                {/* Middle — step summary */}
                {steps.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">
                      What happened
                    </p>
                    <div
                      className="space-y-2 p-4 rounded-xl bg-white/5 border border-white/5"
                    >
                      {steps.map((step, i) => (
                        <motion.div
                          key={i}
                          className="flex items-start gap-3 text-sm"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.07, type: "spring", stiffness: 320, damping: 24 }}
                        >
                          <span
                            className="w-2 h-2 mt-2 flex-shrink-0 rounded-full"
                            style={{ background: "#00F5D4", boxShadow: "0 0 6px #00F5D4" }}
                          />
                          <span className="text-text-secondary capitalize font-medium">
                            {step.action?.replace(/_/g, " ") ?? step.description ?? `Step ${i + 1}`}
                            {step.protocol && (
                              <span className="ml-1.5 text-text-muted text-xs">
                                via {step.protocol}
                              </span>
                            )}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom — CTA buttons */}
                <div className="flex flex-col gap-3 pt-2">
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-gray-900 transition-all duration-200"
                    style={{ background: "#00F5D4" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 20px rgba(0,245,212,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                  >
                    View on Explorer <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 text-sm font-semibold rounded-full border border-white/10 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-200"
                  >
                    Back to Portfolio
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
