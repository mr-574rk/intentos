"use client";

import { useEffect, useState } from "react";
import { IntentOSLogo } from "@/components/IntentOSLogo";

export default function LoadingCover() {
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(false);
  const [dash, setDash] = useState("-");

  useEffect(() => {
    // Lock scrolling while loading
    document.body.style.overflow = "hidden";

    // Animated dash for terminal effect
    const frames = ["-", "\\", "|", "/"];
    let i = 0;
    const dashTimer = setInterval(() => {
      i = (i + 1) % frames.length;
      setDash(frames[i]);
    }, 100);

    // Wait for the heavy lifting (React hydration, DOM painting, Canvas initialization)
    const loadTimer = setTimeout(() => {
      setFade(true); // Trigger CSS fade out
      
      // Unmount after fade finishes and restore scrolling
      setTimeout(() => {
        setLoading(false);
        document.body.style.overflow = "unset";
      }, 600);
    }, 2800);

    return () => {
      clearInterval(dashTimer);
      clearTimeout(loadTimer);
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!loading) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#0D0F14] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${fade ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Subtle Background Glow behind Logo */}
      <div className="absolute w-[400px] h-[400px] bg-[#00F5D4]/10 blur-[100px] rounded-full pointer-events-none" />

      {/* The Logo Pulse */}
      <div className="relative z-10 scale-[2] mb-12 animate-[pulse_2s_ease-in-out_infinite]">
        <IntentOSLogo spin />
      </div>

      {/* Premium Gradient Loading Bar */}
      <div className="relative z-10 w-48 h-[2px] bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-[#00F5D4] rounded-full w-full animate-[pulse_1s_ease-in-out_infinite]" style={{ transformOrigin: "left" }}>
          {/* We do a fake progress bar using a simple CSS animation injected via style block since Tailwind scaleX isn't default */}
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes load-progress {
              0% { transform: scaleX(0); }
              50% { transform: scaleX(0.7); }
              100% { transform: scaleX(1); }
            }
            .animate-load-progress {
              animation: load-progress 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            `
          }} />
          <div className="w-full h-full bg-[#00F5D4] animate-load-progress shadow-[0_0_10px_#00F5D4]" />
        </div>
      </div>
      
      <div className="mt-6 flex items-center justify-center gap-2">
        <p className="text-xs text-[#00F5D4] font-mono tracking-[0.3em] uppercase animate-pulse">
          Initializing System
        </p>
        <span className="text-[#00F5D4] font-mono text-xs w-2 text-center">{dash}</span>
      </div>
    </div>
  );
}
