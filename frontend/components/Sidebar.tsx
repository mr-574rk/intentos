"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import WalletConnect from "@/components/WalletConnect";

import { BrainCircuit, ListTree, Zap, PieChart, History } from "lucide-react";

const NAV_ITEMS = [
  { href: "/app/intent",    icon: BrainCircuit, label: "Intent" },
  { href: "/app/strategy",  icon: ListTree,     label: "Strategy" },
  { href: "/app/execute",   icon: Zap,          label: "Execute" },
  { href: "/app/portfolio", icon: PieChart,     label: "Portfolio" },
  { href: "/app/history",   icon: History,      label: "History" },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 h-screen flex flex-col border-r border-border-default bg-bg-secondary shadow-2xl md:shadow-none">
      {/* Logo & Mobile Close */}
      <div className="px-5 py-5 border-b border-border-default flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-text-primary text-bg-primary flex items-center justify-center font-bold text-xs tracking-wider">
            IO
          </div>
          <div>
            <p className="font-bold text-sm text-text-primary">IntentOS</p>
            <p className="text-xs text-text-muted">AI DeFi OS</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button 
          className="md:hidden text-text-muted hover:text-text-primary p-1"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
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
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-none bg-accent-cyan" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Wallet */}
      <div className="p-4 border-t border-border-default">
        <WalletConnect compact />
      </div>
    </aside>
  );
}
