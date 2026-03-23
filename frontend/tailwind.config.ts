import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // IntentOS Design System
        bg: {
          primary: "#0D0F14",
          secondary: "#12151C",
          card: "#161B26",
          elevated: "#1C2333",
        },
        accent: {
          cyan: "#00F5D4",
          "cyan-dim": "#00C4AA",
          purple: "#7C3AED",
          "purple-light": "#A78BFA",
        },
        text: {
          primary: "#F0F4FF",
          secondary: "#8892A4",
          muted: "#4B5563",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          pending: "#6B7280",
        },
        border: {
          default: "#1E2A3A",
          accent: "#00F5D420",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-hero": "radial-gradient(ellipse at 50% 0%, #7C3AED22 0%, transparent 60%)",
        "gradient-card": "linear-gradient(135deg, #161B26 0%, #1C2333 100%)",
        "gradient-accent": "linear-gradient(135deg, #00F5D4 0%, #7C3AED 100%)",
        "gradient-glow": "radial-gradient(circle at center, #00F5D410 0%, transparent 70%)",
      },
      boxShadow: {
        card: "0 4px 24px rgba(0, 0, 0, 0.4)",
        glow: "0 0 24px rgba(0, 245, 212, 0.15)",
        "glow-strong": "0 0 48px rgba(0, 245, 212, 0.25)",
        "glow-purple": "0 0 24px rgba(124, 58, 237, 0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 245, 212, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 245, 212, 0.3)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
