"use client";

import { useState, useRef, useEffect } from "react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { truncate } from "@initia/utils";
import clsx from "clsx";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { Copy, ExternalLink, LogOut, Check, MoreVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function WalletConnect({
  compact = false,
  navMode = false,
}: {
  compact?: boolean;
  navMode?: boolean;
}) {
  const { address, username, openConnect, openWallet, disconnect } = useInterwovenKit();

  const isConnected = !!address;
  const displayName = username ?? (address ? truncate(address) : "Not connected");

  // State for the popover menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const menuItems = (
    <>
      <button
        onClick={handleCopy}
        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        <span>Copy Address</span>
      </button>
      <a
        href={`https://scan.testnet.initia.xyz/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
        onClick={() => setIsMenuOpen(false)}
      >
        <ExternalLink className="w-4 h-4" />
        <span>View on Explorer</span>
      </a>
      <div className="border-t border-white/5 mt-1 pt-1" />
      <button
        onClick={() => {
          disconnect?.();
          setIsMenuOpen(false);
        }}
        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
      >
        <LogOut className="w-4 h-4" />
        <span>Disconnect</span>
      </button>
    </>
  );

  // ── Landing page nav mode ──────────────────────────────────────────────────
  if (navMode && !isConnected) {
    return (
      <Link
        id="nav-launch-app-btn"
        href="/app/onboarding"
        className="bg-[#00F5D4] text-gray-900 font-bold text-sm px-5 py-2 rounded-full transition-all hover:scale-[1.03] hover:bg-[#00E5C4] hover:shadow-[0_0_18px_rgba(0,245,212,0.45)] tracking-wide"
      >
        Launch App
      </Link>
    );
  }

  if (navMode && isConnected) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="rounded-full overflow-hidden border border-white/10 hover:border-[#00F5D4]/50 transition-all shadow-md block"
          title="Manage Wallet"
        >
          <UserAvatar username={username} address={address} size={38} />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-0 mt-3 w-48 bg-[#0D0F14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-1.5 z-50 origin-top-right whitespace-nowrap"
            >
              {menuItems}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Dashboard / sidebar wallet pill (unchanged) ────────────────────────────
  if (!isConnected) {
    return (
      <button
        id="wallet-connect-btn"
        onClick={openConnect}
        className={clsx(
          "bg-[#00F5D4] text-gray-900 font-bold transition-all hover:scale-[1.02] hover:bg-[#00E5C4] hover:shadow-[0_0_15px_rgba(0,245,212,0.4)]",
          compact ? "text-xs px-4 py-2 w-full rounded-xl" : "text-sm px-6 py-2.5 rounded-full"
        )}
      >
        CONNECT WALLET
      </button>
    );
  }

  // Premium Phantom-Style Wallet Card
  return (
    <div className={clsx("relative", compact ? "w-full" : "w-auto")} ref={menuRef}>
      <button
        className="w-full flex items-center justify-between p-3 bg-white/[0.02] border border-white/10 rounded-xl hover:bg-white/5 transition-colors duration-300"
        onClick={openWallet}
        title="Click to manage wallet"
      >
        {/* Left Side: Avatar + Text */}
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar username={username} address={address} size={32} />
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-mono font-semibold text-text-primary truncate">
              {displayName}
            </p>
            <p className="text-[10px] font-medium text-text-muted mt-0.5">
               Initia Testnet
            </p>
          </div>
        </div>

        {/* Right Side: Status Dot + 3-dot Menu */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#00F5D4] animate-pulse shadow-[0_0_8px_rgba(0,245,212,0.8)]" title="Connected" />
          <div
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="text-gray-400 hover:text-white transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Popover Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-0 mb-2 w-full bg-[#0D0F14]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] p-1.5 z-50"
          >
            {menuItems}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
