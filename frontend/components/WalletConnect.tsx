"use client";

import { useState } from "react";
import clsx from "clsx";

interface WalletState {
  connected: boolean;
  address?: string;
  username?: string; // .init username
}

// Simulated wallet state (replace with real InterwovenKit hooks)
// import { useWallet } from "@initia/interwovenkit-react";

export default function WalletConnect({ compact = false }: { compact?: boolean }) {
  const [wallet, setWallet] = useState<WalletState>({ connected: false });
  const [connecting, setConnecting] = useState(false);

  // Mock connection for demo — replace with:
  // const { connect, disconnect, address, username } = useWallet();
  const handleConnect = async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setWallet({
      connected: true,
      address: "init1abc...def1",
      username: "demo.init",
    });
    setConnecting(false);
  };

  const handleDisconnect = () => {
    setWallet({ connected: false });
  };

  if (!wallet.connected) {
    return (
      <button
        id="wallet-connect-btn"
        onClick={handleConnect}
        disabled={connecting}
        className={clsx(
          "btn-primary",
          compact ? "text-xs px-3 py-2 w-full" : "text-sm px-5 py-2.5",
          connecting && "opacity-60 cursor-wait"
        )}
      >
        {connecting ? (
          <>
            <span className="animate-spin">◌</span>
            Connecting…
          </>
        ) : (
          <>🔗 Connect Wallet</>
        )}
      </button>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-3 glass-card px-3 py-2 cursor-pointer hover:border-accent-cyan/30 transition-colors",
        compact && "w-full"
      )}
      onClick={handleDisconnect}
      title="Click to disconnect"
    >
      <div className="w-7 h-7 rounded-full bg-gradient-accent flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-accent-cyan truncate">
          {wallet.username ?? wallet.address}
        </p>
        <p className="text-xs text-text-muted">Connected · Initia</p>
      </div>
      <span className="status-dot active flex-shrink-0" />
    </div>
  );
}
