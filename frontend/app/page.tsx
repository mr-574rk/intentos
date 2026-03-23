"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import WalletConnect from "@/components/WalletConnect";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent-purple/5 blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-cyan/5 blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-border-default">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center text-bg-primary font-black text-sm">
            IO
          </div>
          <span className="font-bold text-lg text-text-primary">IntentOS</span>
          <span className="text-xs px-2 py-0.5 bg-accent-cyan/10 text-accent-cyan rounded-full border border-accent-cyan/20 ml-1">
            Initia
          </span>
        </div>
        <WalletConnect />
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-default rounded-full text-sm text-text-secondary mb-8">
            <span className="status-dot active" />
            Live on Initia Testnet
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
            <span className="text-text-primary">Your Goals.</span>
            <br />
            <span className="gradient-text">On-Chain.</span>
            <br />
            <span className="text-text-primary">Autonomously.</span>
          </h1>

          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            IntentOS converts your financial goals into simulated, safe, and
            executable DeFi strategies on Initia — powered by AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/app/intent" className="btn-primary text-base px-8 py-4">
              Launch App →
            </Link>
            <a
              href="https://github.com/intentos/intentos"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-base px-8 py-4"
            >
              View on GitHub
            </a>
          </div>
        </motion.div>

        {/* Flow diagram */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 glass-card px-8 py-6 flex flex-wrap items-center justify-center gap-3 text-sm"
        >
          {["Intent", "Strategy", "Simulation", "Approval", "Execution"].map(
            (step, i, arr) => (
              <div key={step} className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-bg-elevated border border-border-default rounded-lg text-text-primary font-medium">
                  {step}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-accent-cyan text-lg">→</span>
                )}
              </div>
            )
          )}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full"
        >
          {[
            { icon: "🧠", title: "AI Intent Engine", desc: "Natural language → DeFi strategy" },
            { icon: "📊", title: "Risk Simulation", desc: "See outcomes before you execute" },
            { icon: "⚡", title: "Autonomous Agent", desc: "One approval, full execution" },
          ].map((f) => (
            <div key={f.title} className="glass-card p-5 text-left hover:border-accent-cyan/30 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold text-text-primary mb-1">{f.title}</div>
              <div className="text-text-secondary text-sm">{f.desc}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border-default px-8 py-6 flex items-center justify-between text-text-muted text-sm">
        <span>© 2026 IntentOS · MIT License</span>
        <span>Built on Initia</span>
      </footer>
    </main>
  );
}
