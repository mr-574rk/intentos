"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BrainCircuit, PieChart, Zap, ArrowRight } from "lucide-react";

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
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-cyan/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-accent-purple/5 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-lg w-full text-center space-y-8"
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
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-text-primary leading-tight">
            Control DeFi using
            <span className="text-accent-cyan"> natural language</span>
          </h1>
          <p className="text-text-secondary text-base leading-relaxed">
            Tell IntentOS what you want to achieve. Our AI agent interprets your goal,
            builds a strategy, simulates the outcome, and executes on-chain — all with one sentence.
          </p>
        </div>

        {/* Example intents */}
        <div className="bg-bg-elevated border border-border-default p-6 text-left space-y-4 shadow-2xl">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
            Example commands
          </p>
          <div className="space-y-2">
            {EXAMPLE_INTENTS.map((ex, i) => (
              <motion.div
                key={ex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-text-secondary font-medium"
              >
                <ArrowRight className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                <span>&quot;{ex}&quot;</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 text-center text-xs">
          {[
            { icon: BrainCircuit, label: "AI interprets your intent" },
            { icon: PieChart,     label: "Simulates outcome first" },
            { icon: Zap,          label: "Executes on Initia chain" },
          ].map((s, i) => (
            <div key={i} className="bg-bg-elevated border border-border-default p-4 space-y-2 flex flex-col items-center shadow-xl">
              <s.icon className="w-6 h-6 text-text-primary" />
              <p className="text-text-muted font-medium mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Connect CTA */}
        <div className="space-y-4 pt-4">
          <motion.button
            id="onboarding-connect-btn"
            onClick={openConnect}
            className="btn-primary w-full text-base py-5 tracking-widest"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
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
