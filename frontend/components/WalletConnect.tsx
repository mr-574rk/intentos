"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { truncate } from "@initia/utils";
import clsx from "clsx";

export default function WalletConnect({ compact = false }: { compact?: boolean }) {
  const { address, username, openConnect, openWallet } = useInterwovenKit();

  const isConnected = !!address;
  // Use username (.init) if available, otherwise truncate the address.
  const displayName = username ?? (address ? truncate(address) : "Not connected");

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
      {/* Dynamic Gradient Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #00F5D4 0%, #7C3AED 100%)", color: "#000" }}>
        {address.slice(2, 4).toUpperCase()}
      </div>
      
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
