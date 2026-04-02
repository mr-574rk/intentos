"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

interface UnstakeModalProps {
  open: boolean;
  validatorAddress: string;
  validatorName?: string;
  maxBalance: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const PRESETS = [0.1, 0.25, 0.5, "MAX"] as const;

export default function UnstakeModal({
  open, validatorAddress, validatorName, maxBalance, onClose, onConfirm
}: UnstakeModalProps) {
  const [amount, setAmount] = useState<string>("");

  const handlePreset = (p: typeof PRESETS[number]) => {
    if (p === "MAX") setAmount(String(maxBalance.toFixed(6)));
    else             setAmount(String((maxBalance * p).toFixed(6)));
  };

  const handleConfirm = () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) onConfirm(val);
  };

  const displayName = validatorName || (validatorAddress.slice(0, 12) + "…");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm pointer-events-auto"
              initial={{ scale: 0.93, y: 18, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 18, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              style={{
                background: "#0B0E1A",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 16,
                boxShadow: "0 24px 60px rgba(0,0,0,0.9)",
              }}
            >
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-black text-text-primary">Unstake INIT</h2>
                    <p className="text-xs text-text-muted mt-0.5">Begins 21-day unbonding period</p>
                  </div>
                  <button onClick={onClose} className="text-text-muted hover:text-text-primary mt-0.5">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-xs text-text-muted uppercase tracking-widest mb-2 block">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-bg-elevated border border-border-default rounded-xl px-4 py-3 text-text-primary text-base font-mono focus:outline-none focus:border-accent-cyan/40"
                  />
                  {/* Preset buttons */}
                  <div className="flex gap-2 mt-2">
                    {PRESETS.map(p => (
                      <button
                        key={String(p)}
                        onClick={() => handlePreset(p)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                        style={{
                          borderColor: "rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          color: "#9AA5BC",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(0,245,212,0.3)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      >
                        {p === "MAX" ? "MAX" : `${Number(p) * 100}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-2 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Validator</span>
                    <span className="text-text-secondary font-mono">{displayName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Staked</span>
                    <span className="text-text-primary font-semibold">{maxBalance.toFixed(4)} INIT</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Unbonding period</span>
                    <span style={{ color: "#F59E0B" }} className="font-semibold">21 days</span>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex gap-2 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-text-muted leading-relaxed">
                    Unstaked INIT will be locked for <strong className="text-text-primary">21 days</strong> before returning to your wallet. You will not earn rewards during this period.
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={handleConfirm}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "rgba(255,77,109,0.12)", border: "1px solid rgba(255,77,109,0.25)", color: "#FF4D6D" }}
                  onMouseEnter={e => { if (amount) e.currentTarget.style.background = "rgba(255,77,109,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,77,109,0.12)"; }}
                >
                  Confirm Unstake
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
