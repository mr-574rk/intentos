"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import GlobalAutopilotToggle from "@/components/GlobalAutopilotToggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] w-full bg-bg-primary overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border-default bg-bg-primary z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-text-primary text-bg-primary flex items-center justify-center font-bold text-xs tracking-wider">
            IO
          </div>
          <p className="font-bold text-sm text-text-primary tracking-wide">IntentOS</p>
        </div>
        <button 
          className="text-text-primary p-2 text-xl" 
          onClick={() => setIsMobileMenuOpen(true)}
        >
          ☰
        </button>
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
        <GlobalAutopilotToggle />
        <div className="flex-1 h-full w-full mx-auto md:p-8 p-4 overflow-y-auto pb-10">
          {children}
        </div>
        
        {/* Global Page Footer */}
        <div className="absolute bottom-3 right-6 pointer-events-none hidden md:block">
           <p className="text-[10px] font-black text-text-muted/30 uppercase tracking-[0.2em]">
             Powered by Initia
           </p>
        </div>
      </main>
    </div>
  );
}
