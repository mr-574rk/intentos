"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import WalletConnect from "@/components/WalletConnect";
import { BrainCircuit, Zap, ShieldAlert, Layers } from "lucide-react";
import { IntentOSLogo } from "@/components/IntentOSLogo";

export default function LandingPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden flex flex-col bg-[#0D0F14]">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flowDown {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .animate-flow {
          animation: flowDown 1s linear infinite;
        }
        .bg-dots {
          background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}} />

      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-dots">
        <div className="w-[800px] h-[800px] bg-[#00F5D4] rounded-full blur-[140px] opacity-[0.05]" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-accent-purple/5 blur-[100px]" />
      </div>

      {/* Sticky Top Nav */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 lg:px-8 bg-[#0D0F14]/70 backdrop-blur-lg border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 md:gap-3">
          <IntentOSLogo />
          <span className="text-[10px] px-2 py-0.5 bg-[#00F5D4]/10 text-[#00F5D4] rounded-full border border-[#00F5D4]/20 font-bold uppercase tracking-widest translate-y-[1px]">
            Initia
          </span>
        </div>
        <WalletConnect />
      </nav>

      {/* Hero (pt-32 offset for navbar) */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-16">
        <motion.div
           initial={{ opacity: 0, y: 24 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="w-full max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-text-secondary mb-8 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse" />
            <span className="font-medium text-gray-200">Live on Initia Testnet</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight text-white drop-shadow-2xl">
            Your Goals.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] to-[#7C3AED]">On-Chain.</span><br/>
            Autonomously.
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            IntentOS converts your financial goals into simulated, safe, and
            executable DeFi strategies on Initia — powered by AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 items-center justify-center mb-16 relative z-30">
            <Link href="/onboarding" className="bg-[#00F5D4] text-gray-900 rounded-full font-bold text-base px-8 py-4 transition-all hover:scale-[1.02] hover:bg-[#00E5C4] hover:shadow-[0_0_20px_rgba(0,245,212,0.4)] tracking-wide">
              GET STARTED
            </Link>
            <a
              href="https://github.com/intentos/intentos"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#13161D] border border-white/10 text-white rounded-full font-semibold text-base px-8 py-4 transition-all hover:bg-white/10"
            >
              View on GitHub
            </a>
          </div>
        </motion.div>

        {/* Animated Architecture Graph */}
        <div className="relative flex flex-col items-center mt-4 mb-6 w-full max-w-3xl mx-auto pointer-events-none lg:scale-[0.9] lg:origin-top">
          
          {/* Node 1 */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-[#13161D]/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.05)] relative z-10">
              <span className="text-base text-white">💬</span>
              <span className="text-sm font-semibold text-gray-200 tracking-wide">User Intent (Natural Language)</span>
            </div>
          </motion.div>

          {/* Connection 1 */}
          <motion.svg initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="w-1 h-8 -my-1 relative z-0" viewBox="0 0 2 32">
            <line x1="1" y1="0" x2="1" y2="32" stroke="#00F5D4" strokeWidth="2" strokeDasharray="4 4" className="animate-flow opacity-50" />
          </motion.svg>

          {/* Node 2 */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
             <div className="bg-[#13161D]/90 backdrop-blur-xl border border-[#00F5D4]/30 px-8 py-4 rounded-2xl flex flex-col items-center shadow-[0_0_30px_rgba(0,245,212,0.15)] relative z-10">
               <BrainCircuit className="w-8 h-8 text-[#00F5D4] mb-2" />
               <span className="text-base font-bold text-white tracking-wide">IntentOS AI Agent Engine</span>
               <span className="text-xs text-[#00F5D4]/80 mt-1 uppercase tracking-widest font-medium">Validates & Builds Strategy</span>
             </div>
          </motion.div>

          {/* Split Connections */}
          <motion.svg initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="w-64 h-10 -my-1 relative z-0" viewBox="0 0 256 40">
            <path d="M128,0 C128,20 32,20 32,40" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 4" className="animate-flow opacity-60" />
            <path d="M128,0 C128,20 224,20 224,40" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="4 4" className="animate-flow opacity-60" />
          </motion.svg>

          {/* Nodes 3A and 3B */}
          <div className="flex justify-between w-full max-w-md relative z-10 gap-6">
             {/* 3A */}
             <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="flex-1 bg-[#13161D]/90 backdrop-blur-xl border border-[#F59E0B]/30 px-4 py-3 rounded-xl flex flex-col items-center shadow-[0_0_20px_rgba(245,158,11,0.1)]">
               <ShieldAlert className="w-5 h-5 text-[#F59E0B] mb-2" />
               <span className="text-sm font-bold text-white mb-1">Risk & Yield Simulation</span>
             </motion.div>
             {/* 3B */}
             <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="flex-1 bg-[#13161D]/90 backdrop-blur-xl border border-[#8B5CF6]/30 px-4 py-3 rounded-xl flex flex-col items-center shadow-[0_0_20px_rgba(139,92,246,0.1)]">
               <Layers className="w-5 h-5 text-[#8B5CF6] mb-2" />
               <span className="text-sm font-bold text-white mb-1">Transaction Bundler</span>
             </motion.div>
          </div>

          {/* Merging Connections */}
          <motion.svg initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="w-64 h-10 -my-1 relative z-0" viewBox="0 0 256 40">
            <path d="M32,0 C32,20 128,20 128,40" fill="none" stroke="#00F5D4" strokeWidth="2" strokeDasharray="4 4" className="animate-flow opacity-60" />
            <path d="M224,0 C224,20 128,20 128,40" fill="none" stroke="#00F5D4" strokeWidth="2" strokeDasharray="4 4" className="animate-flow opacity-60" />
          </motion.svg>

          {/* Final Node */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
             <div className="bg-[#13161D]/95 backdrop-blur-xl border border-[#00F5D4]/50 px-10 py-4 rounded-2xl flex flex-col items-center shadow-[0_0_40px_rgba(0,245,212,0.25)] relative z-10 w-64 lg:w-80">
               <div className="flex items-center gap-3 mb-1">
                 <Zap className="w-5 h-5 text-[#00F5D4]" fill="currentColor" />
                 <span className="text-lg font-black text-white tracking-widest uppercase">Initia L1 Execution</span>
               </div>
               <span className="text-xs text-[#00F5D4]/80 uppercase tracking-[0.2em] font-medium">Gasless · 1-Click Deploy</span>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-8 py-6 flex items-center justify-between text-text-muted text-sm bg-black/20">
        <span>© 2026 IntentOS · MIT License</span>
        <span>Built on Initia</span>
      </footer>
    </main>
  );
}
