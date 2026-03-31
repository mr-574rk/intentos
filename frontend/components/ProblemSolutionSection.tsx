"use client";

import { motion } from "framer-motion";
import { Layers, Database, Activity, Cpu, MessageSquare, Zap, TrendingUp } from "lucide-react";

export function ProblemSolutionSection() {
  return (
    <div className="w-full flex flex-col relative">
      {/* PART 1: THE PROBLEM (Muted & Dense) */}
      <section className="pt-24 pb-16 px-6 lg:px-8 relative z-10 w-full">
        <div className="max-w-4xl mx-auto text-center mb-16 mt-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            DeFi is powerful. But it’s still too complicated.
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Most people don’t lose money in crypto because of volatility. They lose money because DeFi is hard to navigate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Card 1 */}
          <div className="bg-[#13161D]/50 border border-white/5 rounded-3xl p-8 flex flex-col gap-4">
            <Layers className="w-6 h-6 text-gray-500" />
            <h3 className="text-xl font-bold text-white">Too many steps</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Using DeFi requires swapping, finding pools, comparing yields, and claiming rewards. One small mistake costs money.
            </p>
          </div>
          {/* Card 2 */}
          <div className="bg-[#13161D]/50 border border-white/5 rounded-3xl p-8 flex flex-col gap-4">
            <Database className="w-6 h-6 text-gray-500" />
            <h3 className="text-xl font-bold text-white">Information overload</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Hundreds of protocols. Thousands of tokens. Even experienced users constantly wonder: 'Am I using the best strategy?'
            </p>
          </div>
          {/* Card 3 */}
          <div className="bg-[#13161D]/50 border border-white/5 rounded-3xl p-8 flex flex-col gap-4">
            <Activity className="w-6 h-6 text-gray-500" />
            <h3 className="text-xl font-bold text-white">Manual management</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              DeFi is not passive. To earn yield you must monitor positions, claim rewards, and rebalance assets. It becomes a full-time job.
            </p>
          </div>
          {/* Card 4 */}
          <div className="bg-[#13161D]/50 border border-white/5 rounded-3xl p-8 flex flex-col gap-4">
            <Cpu className="w-6 h-6 text-gray-500" />
            <h3 className="text-xl font-bold text-white">Not designed for humans</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Tools assume you understand liquidity pools, validators, and gas optimization. But you just want to ask: 'What should my money do?'
            </p>
          </div>
        </div>
      </section>

      {/* PART 2: THE SOLUTION (Bright & Automated) */}
      <section className="mt-24 pb-24 relative px-6 lg:px-8">
        {/* Subtle radial glow to separate from problem */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center -z-10">
          <div className="w-[600px] h-[600px] bg-[#00F5D4] rounded-full blur-[160px] opacity-[0.05]" />
        </div>

        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00F5D4] mb-6 inline-block">
            What if DeFi worked like a conversation?
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-center leading-relaxed mt-6 mb-12">
            IntentOS turns complicated financial actions into simple natural language. IntentOS executes these strategies on Initia’s high-speed appchain infrastructure, allowing complex financial workflows to run seamlessly in the background.
          </p>
        </div>

        {/* PART 3: THE "MAGIC TRICK" ANIMATION (Crucial) */}
        <div className="flex flex-col items-center justify-center mb-24 relative z-10 w-full">
          {/* The Input Bubble */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-full bg-white/10 border border-white/20 px-6 py-3 shadow-[0_0_30px_rgba(0,245,212,0.2)] mb-4 z-20 backdrop-blur-md"
          >
            <span className="text-white text-base font-medium">"Grow my portfolio safely"</span>
          </motion.div>

          {/* The Flow Line */}
          <div className="relative w-full flex flex-col items-center">
            <svg width="4" height="64" viewBox="0 0 4 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
              <line 
                x1="2" y1="0" x2="2" y2="64" 
                stroke="#00F5D4" strokeWidth="2" strokeDasharray="6 6" 
                className="animate-flow opacity-60" 
              />
            </svg>
            
            {/* Execution Pills */}
            <div className="flex items-center gap-3 md:gap-6 px-6 py-4 rounded-3xl backdrop-blur-sm border border-white/5 relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="rounded-full border border-[#00F5D4] text-[#00F5D4] px-5 py-2.5 bg-[#00F5D4]/10 font-bold text-sm shadow-[0_0_15px_rgba(0,245,212,0.15)] animate-pulse"
              >
                Swap
              </motion.div>
              
              <div className="flex items-center">
                 <div className="w-4 md:w-8 h-[2px] bg-gradient-to-r from-[#00F5D4]/20 to-[#00F5D4]/80 hidden md:block" />
                 <svg className="w-4 h-4 text-[#00F5D4]/80 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>

              <motion.div
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.4 }}
                className="rounded-full border border-[#00F5D4] text-[#00F5D4] px-5 py-2.5 bg-[#00F5D4]/10 font-bold text-sm shadow-[0_0_15px_rgba(0,245,212,0.15)] animate-pulse"
                style={{ animationDelay: '0.2s' }}
              >
                Stake
              </motion.div>

              <div className="flex items-center">
                 <div className="w-4 md:w-8 h-[2px] bg-gradient-to-r from-[#00F5D4]/20 to-[#00F5D4]/80 hidden md:block" />
                 <svg className="w-4 h-4 text-[#00F5D4]/80 md:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>

              <motion.div
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.6 }}
                className="rounded-full border border-[#00F5D4] text-[#00F5D4] px-5 py-2.5 bg-[#00F5D4]/10 font-bold text-sm shadow-[0_0_15px_rgba(0,245,212,0.15)] animate-pulse"
                style={{ animationDelay: '0.4s' }}
              >
                Yield
              </motion.div>
            </div>
          </div>
        </div>

        {/* PART 4: SOLUTION PILLARS (3-Column Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Pillar 1 */}
          <div className="bg-[#13161D]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-10 transition-all duration-300 hover:-translate-y-2 hover:border-[#00F5D4]/30 hover:shadow-[0_10px_40px_rgba(0,245,212,0.1)] flex flex-col">
            <div className="w-14 h-14 rounded-full bg-[#00F5D4]/10 flex items-center justify-center mb-6">
              <MessageSquare className="w-6 h-6 text-[#00F5D4]" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Intent → Strategy</h3>
            <p className="text-gray-400 leading-relaxed">
              You describe what you want. IntentOS turns it into a structured financial plan.
            </p>
          </div>
          
          {/* Pillar 2 */}
          <div className="bg-[#13161D]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-10 transition-all duration-300 hover:-translate-y-2 hover:border-[#00F5D4]/30 hover:shadow-[0_10px_40px_rgba(0,245,212,0.1)] flex flex-col">
             <div className="w-14 h-14 rounded-full bg-[#00F5D4]/10 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-[#00F5D4]" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Strategy → Execution</h3>
            <p className="text-gray-400 leading-relaxed">
              IntentOS automatically swaps assets, stakes tokens, and deploys liquidity. No manual navigation required.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-[#13161D]/60 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-10 transition-all duration-300 hover:-translate-y-2 hover:border-[#00F5D4]/30 hover:shadow-[0_10px_40px_rgba(0,245,212,0.1)] flex flex-col">
             <div className="w-14 h-14 rounded-full bg-[#00F5D4]/10 flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-[#00F5D4]" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Execution → Autopilot</h3>
            <p className="text-gray-400 leading-relaxed">
              IntentOS can automatically claim rewards, rebalance strategies, and compound yield — turning DeFi into a self-managing financial system.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
