"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Copy, Check } from "lucide-react";

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

import { useLocale } from "@/components/LocaleProvider";

export interface ShareableResult {
  intentText: string;
  returnPct?: number;
  riskLevel?: string;
  executedAt?: string;
  txHash?: string;
  walletAddress?: string;
  displayName?: string;
}

interface IntentShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ShareableResult;
}

function formatReturn(pct?: number): string {
  if (!pct) return "—";
  return `+${pct.toFixed(1)}%`;
}

function formatRisk(riskLevel?: string): string {
  return riskLevel ?? "—";
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildShareText(result: ShareableResult, t: (key: string) => string): string {
  const lines: string[] = [
    t("intent_execution_result"),
    ``,
    `${t("intent_goal")}: "${result.intentText}"`,
    result.returnPct ? `${t("intent_return")}: ${formatReturn(result.returnPct)} APY` : "",
    result.riskLevel ? `${t("intent_risk")}: ${formatRisk(result.riskLevel)}` : "",
    result.executedAt ? `${t("intent_date")}: ${formatDate(result.executedAt)}` : "",
    ``,
    t("powered_by_intentos"),
    `https://intentos.app`,
  ].filter((l) => l !== undefined && !(l === "" && false));

  return lines.join("\n");
}

export default function IntentShareModal({ isOpen, onClose, result }: IntentShareModalProps) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const shareText = buildShareText(result, t);
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("intent_execution_result"),
          text: shareText,
          url: "https://intentos.app",
        });
      } catch { }
    } else {
      handleCopy();
    }
  };

  const riskColor =
    result.riskLevel?.toLowerCase() === "low"
      ? "#00F5D4"
      : result.riskLevel?.toLowerCase() === "medium"
        ? "#F59E0B"
        : "#EF4444";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            className="w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#00F5D4]" />
                {t("share_result")}
              </p>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Intent Card — the visual "receipt" */}
            <div
              ref={cardRef}
              className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ background: "linear-gradient(135deg, #0D0F14 0%, #13161D 100%)" }}
            >
              {/* Top accent bar */}
              <div
                className="h-1 w-full"
                style={{
                  background:
                    "linear-gradient(90deg, #00F5D4 0%, #7C3AED 50%, #0066FF 100%)",
                }}
              />

              <div className="p-6 space-y-5">
                {/* Brand */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(0,245,212,0.1)", border: "1px solid rgba(0,245,212,0.2)" }}
                  >
                    <span className="text-xs font-black text-[#00F5D4]">IO</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {t("intent_execution_receipt")}
                  </span>
                </div>

                {/* Intent */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {t("intent_goal")}
                  </p>
                  <p className="text-white font-semibold leading-snug">
                    &ldquo;{result.intentText}&rdquo;
                  </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {result.returnPct && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {t("intent_return")}
                      </p>
                      <p
                        className="text-xl font-black"
                        style={{ color: "#00F5D4" }}
                      >
                        {formatReturn(result.returnPct)}
                      </p>
                    </div>
                  )}
                  {result.riskLevel && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {t("intent_risk")}
                      </p>
                      <p className="text-sm font-bold" style={{ color: riskColor }}>
                        {formatRisk(result.riskLevel)}
                      </p>
                    </div>
                  )}
                  {result.executedAt && (
                    <div className="flex flex-col gap-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {t("intent_date")}
                      </p>
                      <p className="text-sm font-semibold text-gray-300">
                        {formatDate(result.executedAt)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer watermark */}
                <div
                  className="pt-4 border-t flex items-center justify-between"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <p className="text-[10px] text-gray-600 font-medium whitespace-pre">
                    {t("powered_by_initia")} · intentos.app
                  </p>
                  {result.displayName && (
                    <p className="text-[10px] font-bold text-[#00F5D4]/60">
                      {result.displayName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: copied ? "rgba(0,245,212,0.15)" : "rgba(255,255,255,0.05)",
                  border: copied ? "1px solid rgba(0,245,212,0.3)" : "1px solid rgba(255,255,255,0.1)",
                  color: copied ? "#00F5D4" : "#fff",
                }}
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> {t("copied_exclamation")}</>
                ) : (
                  <><Copy className="w-4 h-4" /> {t("copy_card")}</>
                )}
              </button>

              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                }}
              >
                <XIcon className="w-4 h-4" /> {t("share_on_x")}
              </a>
            </div>

            {/* Native share for mobile */}
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={handleShareNative}
                className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-colors"
              >
                {t("share_system")}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
