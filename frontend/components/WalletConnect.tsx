"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { truncate } from "@initia/utils";
import clsx from "clsx";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";

export default function WalletConnect({
  compact = false,
  navMode = false,
}: {
  compact?: boolean;
  navMode?: boolean;
}) {
  const { address, username, openConnect, openWallet } = useInterwovenKit();

  const isConnected = !!address;
  const displayName = username ?? (address ? truncate(address) : "Not connected");

  // ── Landing page nav mode ──────────────────────────────────────────────────
  if (navMode) {
    if (!isConnected) {
      return (
        <button
          id="nav-launch-app-btn"
          onClick={openConnect}
          className="bg-[#00F5D4] text-gray-900 font-bold text-sm px-5 py-2 rounded-full transition-all hover:scale-[1.03] hover:bg-[#00E5C4] hover:shadow-[0_0_18px_rgba(0,245,212,0.45)] tracking-wide"
        >
          Launch App
        </button>
      );
    }

    // Connected — send straight to the app
    return (
      <Link
        href="/app/onboarding"
        id="nav-open-dashboard-btn"
        className="flex items-center gap-2 bg-[#00F5D4]/10 border border-[#00F5D4]/30 text-[#00F5D4] font-bold text-sm px-5 py-2 rounded-full transition-all hover:bg-[#00F5D4]/20 hover:shadow-[0_0_14px_rgba(0,245,212,0.3)] hover:scale-[1.02]"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#00F5D4] animate-pulse shadow-[0_0_6px_rgba(0,245,212,0.8)]" />
        Open Dashboard
      </Link>
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
    <button
      className={clsx(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/5",
        compact && "w-full"
      )}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      onClick={openWallet}
      title="Click to manage wallet"
    >
      {/* Dynamic Profile Avatar */}
      <UserAvatar username={username} address={address} size={32} />

      {/* Wallet Details */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono font-semibold text-text-primary truncate">
          {displayName}
        </p>
        <p className="text-[10px] font-medium text-text-muted mt-0.5">
           Initia Testnet
        </p>
      </div>

      {/* Network Pulse Dot */}
      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#00F5D4] animate-pulse shadow-[0_0_8px_rgba(0,245,212,0.8)]" title="Connected" />
    </button>
  );
}
