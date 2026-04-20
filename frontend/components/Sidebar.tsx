"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import WalletConnect from "@/components/WalletConnect";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { BrainCircuit, PieChart, History, X, BookOpen, ExternalLink, Compass } from "lucide-react";

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

import { readAutopilotState } from "@/lib/autopilotState";
import { IntentOSLogo } from "@/components/IntentOSLogo";
import GlobalAutopilotToggle from "@/components/GlobalAutopilotToggle";
import { useLocale } from "@/components/LocaleProvider";

// Consolidated nav — Strategy/Execute are steps in a flow, not top-level pages
const NAV_ITEMS = [
  { href: "/app/intent",    icon: BrainCircuit, labelKey: "chat" },
  { href: "/app/explore",   icon: Compass,      labelKey: "explore" },
  { href: "/app/portfolio", icon: PieChart,     labelKey: "portfolio" },
  { href: "/app/activity",  icon: History,      labelKey: "activity" },
];

function shortenAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname          = usePathname();
  const { address }       = useInterwovenKit();
  const { t } = useLocale();
  const [, setAutopilotOn] = useState(false);

  // React to autopilot state changes (same-tab via custom storage events)
  useEffect(() => {
    const read = () => setAutopilotOn(readAutopilotState().enabled);
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  // Derive display name — use .init username if known, else shorten address
  const _displayName = address ? shortenAddress(address) : "Not connected";

  const socialLinks = {
    discord: process.env.NEXT_PUBLIC_SOCIAL_DISCORD || "https://discord.com",
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "https://instagram.com",
    twitter: process.env.NEXT_PUBLIC_SOCIAL_X || "https://x.com/intentosai",
    github: process.env.NEXT_PUBLIC_SOCIAL_GITHUB || "https://github.com/mr-574rk/intentos"
  };

  return (
    <aside className="w-64 flex-shrink-0 h-full flex flex-col border-r border-border-default bg-bg-secondary shadow-2xl md:shadow-none">

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
              {t(item.labelKey)}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00F5D4] shadow-[0_0_6px_#00F5D4]" />}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-4 border-t border-white/5 mx-3" />

        {/* Docs Link with Tooltip */}
        <div className="relative group/tooltip px-0">
          <a
            href="https://intentos.mintlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all duration-150 group"
          >
            <BookOpen className="w-[18px] h-[18px] text-text-secondary group-hover:text-[#00F5D4] transition-colors" strokeWidth={2} />
            <span className="flex-1">{t("docs")}</span>
            <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
          </a>
          
          {/* Custom Tooltip */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-lg bg-[#13161D]/90 backdrop-blur-md border border-white/10 text-[10px] font-bold text-[#00F5D4] uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-200 shadow-2xl z-50 translate-x-[-8px] group-hover/tooltip:translate-x-0">
            {t("dev_docs")}
          </div>
        </div>
      </nav>

      {/* ── Bottom Section ─────────────────────────────────── */}
      <div className="mt-auto px-4 pb-4 flex flex-col gap-4">
        {address && (
          <div className="px-2 pt-2">
            <GlobalAutopilotToggle inline />
          </div>
        )}
        {/* Social Dock */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-6">
          <a href={socialLinks.discord} target="_blank" rel="noopener noreferrer">
            <DiscordIcon className="w-5 h-5 text-gray-500 hover:text-[#00F5D4] hover:drop-shadow-[0_0_8px_rgba(0,245,212,0.5)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300" />
          </a>
          <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
            <TwitterIcon className="w-5 h-5 text-gray-500 hover:text-[#00F5D4] hover:drop-shadow-[0_0_8px_rgba(0,245,212,0.5)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300" />
          </a>
          <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
            <InstagramIcon className="w-5 h-5 text-gray-500 hover:text-[#00F5D4] hover:drop-shadow-[0_0_8px_rgba(0,245,212,0.5)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300" />
          </a>
          <a href={socialLinks.github} target="_blank" rel="noopener noreferrer">
            <GithubIcon className="w-5 h-5 text-gray-500 hover:text-[#00F5D4] hover:drop-shadow-[0_0_8px_rgba(0,245,212,0.5)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300" />
          </a>
        </div>

        {/* User Profile Card */}
        <div className="w-full">
          <WalletConnect compact />
        </div>
      </div>
    </aside>
  );
}
