"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import WalletConnect from "@/components/WalletConnect";
import { BrainCircuit, Zap, ShieldAlert, Layers, Circle, ArrowRight, PlayCircle } from "lucide-react";
import { IntentOSLogo } from "@/components/IntentOSLogo";
import { ProblemSolutionSection } from "@/components/ProblemSolutionSection";
import { VideoModal } from "@/components/VideoModal";

export default function LandingPage() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  return (
    <main className="relative min-h-[100dvh] overflow-hidden flex flex-col bg-[#0D0F14]">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes flowDown {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .animate-flow {
          animation: flowDown 1s linear infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float-1 { animation: float 4s ease-in-out infinite; }
        .animate-float-2 { animation: float 5s ease-in-out infinite 1s; }
        .animate-float-3 { animation: float 6s ease-in-out infinite 2s; }
        .animate-float-4 { animation: float 5.5s ease-in-out infinite 0.5s; }
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
        <WalletConnect navMode />
      </nav>

      {/* Hero (pt-32 offset for navbar) */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center pt-32 pb-24 min-h-[80vh] overflow-hidden w-full">
        {/* Typography */}
        <div className="relative z-20 flex flex-col items-center text-center px-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#00F5D4]/30 rounded-full text-[#00F5D4] text-sm font-medium mb-8 bg-white/5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse" />
            Live on Initia Testnet
          </div>
          <p className="text-sm font-semibold tracking-widest uppercase text-[#00F5D4] mb-4">The AI operating system for DeFi on Initia.</p>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 tracking-tight text-white drop-shadow-2xl">
            Your Goals.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5D4] to-[#7C3AED]">On-Chain.</span><br />
            Autonomously.
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed font-medium">
            IntentOS converts your natural language goals into safe, simulated DeFi strategies. You review, AI executes.
          </p>
        </div>

        {/* AI Data Loom Visualization */}
        <div className="w-full max-w-5xl h-64 relative flex items-center justify-between px-4 sm:px-10 mt-12 mb-12 pointer-events-none z-10">

          {/* Connecting Lines (Background) */}
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#00F5D4]/30 to-transparent absolute top-1/2 -translate-y-1/2" />
          </div>

          {/* Left Side: Input Data Packets */}
          <div className="flex flex-col justify-between h-full w-full max-w-[280px] z-10">
            <div className="flex flex-col gap-6 w-full justify-center h-full">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0, transition: { repeat: Infinity, repeatType: "reverse", duration: 3 } }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl rounded-bl-sm px-4 py-2 shadow-lg w-fit self-end mr-4">
                <p className="text-sm text-white font-medium">&quot;stake 1 init&quot;</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0, transition: { repeat: Infinity, repeatType: "reverse", duration: 4, delay: 0.5 } }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl rounded-bl-sm px-4 py-2 shadow-lg w-fit self-center">
                <p className="text-sm text-white font-medium">&quot;swap usdc to init&quot;</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0, transition: { repeat: Infinity, repeatType: "reverse", duration: 3.5, delay: 1 } }} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl rounded-bl-sm px-4 py-2 shadow-lg w-fit self-end mr-2">
                <p className="text-sm text-white font-medium">&quot;grow my portfolio&quot;</p>
              </motion.div>
            </div>
          </div>

          {/* Center: The AI Core */}
          <div className="relative flex items-center justify-center z-20 mx-4">
            <div className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border border-[#00F5D4]/10 animate-[spin_10s_linear_infinite]" />
            <div className="absolute w-24 h-24 md:w-32 md:h-32 rounded-full border border-[#00F5D4]/20 animate-[spin_7s_linear_infinite_reverse]" />
            <div className="w-16 h-16 md:w-24 md:h-24 bg-[#13161D] border border-[#00F5D4]/40 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(0,245,212,0.4)] animate-pulse relative z-10">
              <span className="font-black text-xl md:text-2xl text-[#00F5D4] tracking-widest drop-shadow-[0_0_10px_#00F5D4]">AI</span>
            </div>
          </div>

          {/* Right Side: Execution Threads/Rollups */}
          <div className="flex flex-col justify-between h-full z-10 w-[140px] md:w-[180px]">
            <div className="flex flex-col gap-6 h-full justify-center items-end">
              <div className="flex items-center gap-3">
                <div className="bg-[#13161D]/50 rounded text-[10px] md:text-xs font-mono text-text-secondary p-1 px-2 border border-white/5 hidden sm:block whitespace-nowrap">Simulating Risk</div>
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="w-8 h-8 md:w-10 md:h-10 bg-white/5 border border-[#00F5D4]/20 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(0,245,212,0.15)] rotate-45 shrink-0">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-[#00F5D4]/50 rounded-full -rotate-45" />
                </motion.div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#13161D]/50 rounded text-[10px] md:text-xs font-mono text-text-secondary p-1 px-2 border border-white/5 hidden sm:block whitespace-nowrap">Routing to Dex</div>
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2, delay: 0.7 }} className="w-8 h-8 md:w-10 md:h-10 bg-white/5 border border-[#00F5D4]/20 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(0,245,212,0.15)] rotate-45 shrink-0">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-[#00F5D4]/50 rounded-full -rotate-45" />
                </motion.div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-[#13161D]/50 rounded text-[10px] md:text-xs font-mono text-text-secondary p-1 px-2 border border-white/5 hidden sm:block whitespace-nowrap">Executing on Initia</div>
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2, delay: 1.4 }} className="w-8 h-8 md:w-10 md:h-10 bg-white/5 border border-[#00F5D4]/20 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(0,245,212,0.15)] rotate-45 shrink-0">
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-[#00F5D4]/50 rounded-full -rotate-45" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-5 items-center justify-center relative z-30 mb-8 mt-4">
          <Link href="/app/onboarding" className="bg-[#00F5D4] text-gray-900 rounded-full font-bold text-base px-8 py-4 transition-all hover:scale-[1.02] hover:bg-[#00E5C4] hover:shadow-[0_0_20px_rgba(0,245,212,0.4)] tracking-wide pointer-events-auto">
            Launch App
          </Link>
          <button
            onClick={() => setIsVideoOpen(true)}
            className="flex items-center justify-center bg-[#13161D] border border-white/10 text-white rounded-full font-semibold text-base px-8 py-4 transition-all hover:bg-white/10 pointer-events-auto group"
          >
            <PlayCircle className="w-5 h-5 mr-2 text-gray-400 group-hover:text-white transition-colors" />
            Watch Demo
          </button>
        </div>
      </section>

      <ProblemSolutionSection />

      {/* How IntentOS works under the hood */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-16 pb-16">
        <h2 className="text-sm uppercase tracking-widest text-[#00F5D4] mb-8 text-center font-bold">
          How IntentOS works under the hood
        </h2>

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

      {/* Roadmap Section */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-16 pb-24 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Roadmap</h2>
          <p className="text-gray-400 mt-3 font-medium text-lg">Building the AI operating system for decentralized finance.</p>
        </div>

        {/* The Horizontal "Fiber-Optic" Timeline Layout */}
        <div className="flex flex-col md:flex-row justify-center gap-10 md:gap-8 relative">
          {/* The Glowing Track (Hidden on Mobile) */}
          <div className="hidden md:flex absolute top-[11px] left-0 right-[16.6%] h-[2px] z-0">
            <div className="w-[20%] h-full bg-gradient-to-r from-transparent to-[#00F5D4]/50" />
            <div className="w-[80%] h-full bg-white/10" />
          </div>

          {/* Card 1: Q2 2026 */}
          <div className="flex-1 flex flex-col relative z-10 w-full group">
            <div className="w-6 h-6 rounded-full bg-[#00F5D4] border-[4px] border-[#0D0F14] animate-pulse shadow-[0_0_15px_#00F5D4] mx-auto mb-10 shrink-0 relative z-20" />
            <div className="flex-1 bg-white/5 backdrop-blur-md border-t-2 border-t-[#00F5D4] border-white/10 rounded-3xl p-8 relative hover:bg-white/10 transition-colors text-left flex flex-col shadow-[0_0_30px_rgba(0,245,212,0.05)]">
              <p className="text-xs font-mono text-[#00F5D4] tracking-widest uppercase mb-2">Q2 2026</p>
              <h3 className="text-xl font-bold text-white mb-6">IntentOS Launch</h3>
              <ul className="text-sm text-gray-300 space-y-4 font-medium">
                <li className="flex items-start gap-3"><Zap className="w-5 h-5 text-[#00F5D4] shrink-0" /> <span className="pt-0.5">Natural language DeFi execution</span></li>
                <li className="flex items-start gap-3"><Zap className="w-5 h-5 text-[#00F5D4] shrink-0" /> <span className="pt-0.5">Portfolio intelligence dashboard</span></li>
                <li className="flex items-start gap-3"><Zap className="w-5 h-5 text-[#00F5D4] shrink-0" /> <span className="pt-0.5"><span className="text-[#00F5D4] font-bold">Initia</span>-native integration</span></li>
                <li className="flex items-start gap-3"><Zap className="w-5 h-5 text-[#00F5D4] shrink-0" /> <span className="pt-0.5">AI strategy planner</span></li>
              </ul>
            </div>
          </div>

          {/* Card 2: Q3 2026 */}
          <div className="flex-1 flex flex-col relative z-10 w-full group opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full border-[2px] border-gray-600 bg-[#0D0F14] mx-auto mb-10 shrink-0 relative z-20" />
            <div className="flex-1 bg-[#13161D]/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative hover:bg-white/5 transition-colors text-left flex flex-col">
              <p className="text-xs font-mono text-gray-400 tracking-widest uppercase mb-2">Q3 2026</p>
              <h3 className="text-xl font-bold text-white mb-6">Smart Portfolio Agents</h3>
              <ul className="text-sm text-gray-400 space-y-4 font-medium">
                <li className="flex items-start gap-3"><ArrowRight className="w-5 h-5 text-gray-500 shrink-0" /> <span className="pt-0.5">Autopilot yield strategies</span></li>
                <li className="flex items-start gap-3"><ArrowRight className="w-5 h-5 text-gray-500 shrink-0" /> <span className="pt-0.5">Risk-aware portfolio balancing</span></li>
                <li className="flex items-start gap-3"><ArrowRight className="w-5 h-5 text-gray-500 shrink-0" /> <span className="pt-0.5">Automated reward compounding</span></li>
                <li className="flex items-start gap-3"><ArrowRight className="w-5 h-5 text-gray-500 shrink-0" /> <span className="pt-0.5">Multi-protocol execution</span></li>
              </ul>
            </div>
          </div>

          {/* Card 3: Q4 2026 */}
          <div className="flex-1 flex flex-col relative z-10 w-full group opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full border-[2px] border-gray-600 bg-[#0D0F14] mx-auto mb-10 shrink-0 relative z-20" />
            <div className="flex-1 bg-[#13161D]/60 backdrop-blur-md border border-white/10 rounded-3xl p-8 relative hover:bg-white/5 transition-colors text-left flex flex-col">
              <p className="text-xs font-mono text-gray-400 tracking-widest uppercase mb-2">Q4 2026</p>
              <h3 className="text-xl font-bold text-white mb-6">Autonomous Finance</h3>
              <ul className="text-sm text-gray-400 space-y-4 font-medium">
                <li className="flex items-start gap-3"><Circle className="w-4 h-4 mt-0.5 text-gray-600 shrink-0" /> <span className="pt-0.5">AI financial agents</span></li>
                <li className="flex items-start gap-3"><Circle className="w-4 h-4 mt-0.5 text-gray-600 shrink-0" /> <span className="pt-0.5">Cross-rollup routing on <span className="text-gray-300 font-bold">Initia</span></span></li>
                <li className="flex items-start gap-3"><Circle className="w-4 h-4 mt-0.5 text-gray-600 shrink-0" /> <span className="pt-0.5">Self-optimizing portfolios</span></li>
                <li className="flex items-start gap-3"><Circle className="w-4 h-4 mt-0.5 text-gray-600 shrink-0" /> <span className="pt-0.5">Agent marketplace</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative z-10 bg-[#0D0F14] py-10 md:py-16 mt-20">
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/15 to-transparent absolute top-0 left-0" />

        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Side */}
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-[#00F5D4]" />
            <span className="text-gray-500 text-sm">IntentOS © 2026. MIT License.</span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <a href="https://twitter.com/intentosai" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#00F5D4] transition-colors duration-300">
                <svg className="w-5 h-5 cursor-pointer" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://github.com/mr-574rk/intentos" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#00F5D4] transition-colors duration-300">
                <svg className="w-5 h-5 cursor-pointer" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>
            </div>

            <div className="h-4 w-[1px] bg-white/10" />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-[#00F5D4]/20">
              <span className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse" />
              <span className="text-[#00F5D4] text-xs font-mono tracking-widest uppercase mt-[2px]">BUILT ON INITIA</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Embedded Video Demo Modal */}
      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} />
    </main>
  );
}
