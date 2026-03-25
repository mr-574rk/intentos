"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { truncate } from "@initia/utils";
import clsx from "clsx";

export default function WalletConnect({ compact = false }: { compact?: boolean }) {
  const { address, username, openConnect, openWallet } = useInterwovenKit();

  const isConnected = !!address;
  const displayName = username ?? (address ? truncate(address) : null);

  if (!isConnected) {
    return (
      <button
        id="wallet-connect-btn"
        onClick={openConnect}
        className={clsx(
          "btn-primary",
          compact ? "text-xs px-3 py-2 w-full" : "text-sm px-5 py-2.5"
        )}
      >
        CONNECT WALLET
      </button>
    );
  }

  return (
    <button
      className={clsx(
        "flex items-center gap-3 bg-bg-elevated border border-border-default px-3 py-2 hover:border-accent-cyan/50 transition-colors text-left shadow-lg",
        compact && "w-full"
      )}
      onClick={openWallet}
      title="Click to manage wallet"
    >
      <div className="w-7 h-7 bg-text-primary text-bg-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">
        IO
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-accent-cyan truncate">
          {displayName}
        </p>
        <p className="text-xs text-text-muted">Connected · Initia</p>
      </div>
      <span className="status-dot active flex-shrink-0" />
    </button>
  );
}
