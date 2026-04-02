"use client";

import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IntentOSLogo } from "@/components/IntentOSLogo";

export default function OnboardingPage() {
  const { address, openConnect } = useInterwovenKit();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If already connected, drop them instantly into the workspace
  useEffect(() => {
    if (address) {
      router.replace("/app/intent");
    }
  }, [address, router]);

  // Prevent flash of onboarding UI if already connected or hydratiing
  if (!mounted || address) {
    return (
      <div className="min-h-[100dvh] bg-[#0D0F14] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00F5D4]/20 border-t-[#00F5D4] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0D0F14] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      
      {/* 1. Distraction-Free Tunnel / Centered Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] bg-[#00F5D4] rounded-full blur-[140px] opacity-[0.06]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md w-full"
      >
        {/* 2. The Premium Auth Card */}
        <div className="bg-[#13161D]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 shadow-[0_24px_60px_rgba(0,0,0,0.6)] flex flex-col items-center">
          
          {/* 3. Card Content & Typography */}
          <div className="flex justify-center w-full mb-2 mt-4">
            <IntentOSLogo className="scale-125 origin-center justify-center pointer-events-none" />
          </div>

          <h1 className="text-[26px] font-black tracking-tight text-white text-center mt-6">
            Initialize Workspace
          </h1>
          <p className="text-sm text-gray-400 text-center mt-3 mb-10 px-2 leading-relaxed">
            Securely connect your Initia wallet to deploy autonomous strategies.
          </p>

          {/* 4. The Action Button & Trust Markers */}
          <motion.button
            onClick={openConnect}
            className="w-full bg-[#00F5D4] text-gray-900 font-bold text-[15px] tracking-widest rounded-full py-4 transition-all hover:bg-[#00E5C4] hover:shadow-[0_0_24px_rgba(0,245,212,0.4)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            CONNECT WALLET
          </motion.button>

          {/* Trust Footer */}
          <p className="text-xs text-gray-500 mt-6 text-center font-medium tracking-wide">
            Powered by Initia InterwovenKit
          </p>
        </div>
      </motion.div>
    </div>
  );
}
