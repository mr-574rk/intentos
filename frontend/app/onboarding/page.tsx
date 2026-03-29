"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BrainCircuit, PieChart, Zap, ArrowRight, ShieldAlert, Layers } from "lucide-react";

const EXAMPLE_INTENTS = [
  "Grow my savings safely without taking big risks",
  "Get the highest returns on my money over the next 3 months",
  "Spread my funds around so they aren't all in one place",
  "Set up a steady stream of passive income",
];

export default function OnboardingPage() {
  const { address, openConnect } = useInterwovenKit();
  const router = useRouter();

  // If already connected, skip to app
  useEffect(() => {
    if (address) {
      router.replace("/app/intent");
    }
  }, [address, router]);

  return (
    <div className="min-h-[100dvh] bg-[#0D0F14] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden bg-dots">
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

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[800px] h-[800px] bg-[#00F5D4] rounded-full blur-[140px] opacity-[0.05]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-3xl w-full text-center space-y-6"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-text-primary flex items-center justify-center text-bg-primary font-black text-xl shadow-[0_0_24px_rgba(255,255,255,0.1)]">
            IO
          </div>
          <div className="text-left">
            <p className="text-2xl font-black text-text-primary tracking-tight">IntentOS</p>
            <p className="text-xs text-text-muted uppercase tracking-widest mt-0.5">AI DeFi Operating System</p>
          </div>
        </div>

        {/* Hero */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-text-primary leading-tight max-w-3xl mx-auto">
            Control DeFi using
            <span className="text-accent-cyan"> natural language</span>
          </h1>
          <p className="text-text-secondary text-base leading-relaxed max-w-xl mx-auto">
            Tell IntentOS what you want to achieve. Our AI agent interprets your goal,
            builds a strategy, simulates the outcome, and executes on-chain — all with one sentence.
          </p>
        </div>

        {/* Animated Architecture Graph */}
        <div className="relative flex flex-col items-center mt-6 mb-6 w-full max-w-3xl mx-auto pointer-events-none lg:scale-[0.9] lg:origin-top">
          
          {/* Node 1 */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-[#13161D]/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.05)] relative z-10">
              <span className="text-base text-white">👛</span>
              <span className="text-sm font-semibold text-gray-200 tracking-wide">User Wallet & Intent</span>
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
               <span className="text-base font-bold text-white tracking-wide">IntentOS Agent Engine</span>
               <span className="text-xs text-[#00F5D4]/80 mt-1 uppercase tracking-widest font-medium">Parse · Validate · Build</span>
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
               <span className="text-sm font-bold text-white mb-1">Risk Simulation</span>
               <span className="text-[10px] text-[#F59E0B]/80 uppercase tracking-widest text-center">Projects outcomes</span>
             </motion.div>
             {/* 3B */}
             <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="flex-1 bg-[#13161D]/90 backdrop-blur-xl border border-[#8B5CF6]/30 px-4 py-3 rounded-xl flex flex-col items-center shadow-[0_0_20px_rgba(139,92,246,0.1)]">
               <Layers className="w-5 h-5 text-[#8B5CF6] mb-2" />
               <span className="text-sm font-bold text-white mb-1">Transaction Bundler</span>
               <span className="text-[10px] text-[#8B5CF6]/80 uppercase tracking-widest text-center">Batches swap/stake</span>
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

        {/* Connect CTA */}
        <div className="space-y-4 pt-4 max-w-md mx-auto relative z-20">
          <motion.button
            id="onboarding-connect-btn"
            onClick={openConnect}
            className="w-full text-base py-4 tracking-widest font-semibold rounded-2xl transition-all duration-300 bg-[#00F5D4] text-gray-900 hover:shadow-[0_0_20px_rgba(0,245,212,0.4)] hover:scale-[1.02] hover:bg-[#00E5C4]"
            whileTap={{ scale: 0.98 }}
          >
            CONNECT WALLET
          </motion.button>
          <p className="text-xs text-text-muted uppercase tracking-wider">
            Powered by InterwovenKit &middot; Your keys, your control
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-text-muted/50">
          Built on{" "}
          <a href="https://initia.xyz" target="_blank" rel="noreferrer" className="text-accent-cyan/60 hover:text-accent-cyan transition-colors">
            Initia
          </a>
          {" "}· {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
