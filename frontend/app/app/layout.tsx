"use client";

import { useState, useEffect } from "react";
import { wakeBackend } from "@/utils/wakeBackend";
import Sidebar from "@/components/Sidebar";
import GlobalAutopilotToggle from "@/components/GlobalAutopilotToggle";
import OfflineToast from "@/components/OfflineToast";
import { IntentOSLogo } from "@/components/IntentOSLogo";
import { useInterwovenKit } from "@initia/interwovenkit-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { address } = useInterwovenKit();
  const isConnected = !!address;

  useEffect(() => {
    wakeBackend();
  }, []);

  return (
    <div className="flex h-[100dvh] w-full bg-bg-primary overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border-default bg-bg-primary/80 backdrop-blur-lg z-50 flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <IntentOSLogo />
        </div>

        {/* Right-side actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isConnected && (
            <GlobalAutopilotToggle inline />
          )}
          <button
            id="mobile-menu-btn"
            className="p-2 rounded-lg bg-transparent hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div 
        className={`fixed md:static inset-y-0 left-0 z-50 transform ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-snappy flex`}
      >
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-[100dvh] flex flex-col pt-16 md:pt-0 w-full relative">
        {/* Desktop Autopilot — only shown when wallet connected */}
        {isConnected && <GlobalAutopilotToggle />}
        <div className="flex-1 h-full w-full mx-auto md:p-8 p-4 overflow-y-auto pb-10">
          {children}
        </div>
        
        {/* Global offline detector */}
        <OfflineToast />

        {/* Global Page Footer */}
        <div className="absolute bottom-3 right-4 md:right-6 pointer-events-none">
           <p className="text-[10px] sm:text-[10px] font-black text-text-muted/30 uppercase tracking-[0.2em]">
             Powered by Initia
           </p>
        </div>
      </main>
    </div>
  );
}
