import React from "react";

export function IntentOSLogo({ className = "", spin = false }: { className?: string; spin?: boolean }) {
  return (
    <div className={`group flex items-center gap-x-2 ${!spin && "cursor-pointer"} ${className}`}>
      {/* 1. The OS Orbit Icon (SVG) */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-8 h-8 drop-shadow-[0_0_8px_rgba(0,245,212,0.6)] ${spin ? "animate-[spin_3s_linear_infinite]" : "transition-transform duration-700 ease-in-out group-hover:rotate-180"}`}
        >
          {/* Faint background track */}
          <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />

          {/* The Active Neon Ring (Sweeping Arc) */}
          {/* Circumference of r=9 is ~56.5. Dasharray 35 leaves a cool gap. */}
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="#00F5D4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="35 60"
            strokeDashoffset="15"
          />

          {/* The Core / AI Spark */}
          <circle cx="12" cy="12" r="2.5" fill="#00F5D4" />
        </svg>
      </div>

      {/* 2. The Typography Wordmark */}
      <h1 className="text-[22px] font-black tracking-tighter flex items-center -ml-0.5">
        <span className="text-white">Intent</span>
        <span className="text-[#00F5D4] drop-shadow-[0_0_12px_rgba(0,245,212,0.5)]">OS</span>
      </h1>
    </div>
  );
}
