"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import WalletConnect from "@/components/WalletConnect";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { BrainCircuit, PieChart, History, X } from "lucide-react";
import { readAutopilotState } from "@/lib/autopilotState";
import { IntentOSLogo } from "@/components/IntentOSLogo";

// Consolidated nav — Strategy/Execute are steps in a flow, not top-level pages
const NAV_ITEMS = [
  { href: "/app/intent",    icon: BrainCircuit, label: "Chat" },
  { href: "/app/portfolio", icon: PieChart,     label: "Portfolio" },
  { href: "/app/history",   icon: History,      label: "History" },
];

function shortenAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname          = usePathname();
  const { address }       = useInterwovenKit();
  const [autopilotOn, setAutopilotOn] = useState(false);

  // React to autopilot state changes (same-tab via custom storage events)
  useEffect(() => {
    const read = () => setAutopilotOn(readAutopilotState().enabled);
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  // Derive display name — use .init username if known, else shorten address
  const displayName = address ? shortenAddress(address) : "Not connected";

  return (
    <aside className="w-64 flex-shrink-0 h-screen flex flex-col border-r border-border-default bg-bg-secondary shadow-2xl md:shadow-none">

      {/* ── Brand + Close ─────────────────────────────────── */}
      <div className="px-5 py-5 border-b border-border-default flex items-center justify-between">
        <IntentOSLogo />
        <button className="md:hidden text-text-muted hover:text-text-primary p-1" onClick={onClose}><X className="w-5 h-5" /></button>
      </div>

        {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (item.href === "/app/intent" && pathname === "/app/strategy");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00F5D4] shadow-[0_0_6px_#00F5D4]" />}
            </Link>
          );
        })}
      </nav>

      {/* ── Wallet Identity ───────────────────────────────── */}
      <div className="p-4 border-t border-border-default">
        <WalletConnect compact />
      </div>
    </aside>
  );
}
