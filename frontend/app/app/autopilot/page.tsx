"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, ChevronDown, ChevronUp, Zap, RefreshCw, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { readAutopilotState, writeAutopilotState, syncStrategiesFromRules } from "@/lib/autopilotState";

// ── Types ─────────────────────────────────────────────────────
interface AutopilotRule {
  id:          string;
  label:       string;
  description: string;
  icon:        React.ElementType;
  iconColor:   string;
  enabled:     boolean;
  config:      { key: string; label: string; value: string; unit?: string }[];
}

const DEFAULT_RULES: AutopilotRule[] = [
  {
    id: "auto_compound", label: "Auto-Compound Staking", icon: RefreshCw, iconColor: "#00F5D4",
    description: "Automatically claim and re-stake rewards when threshold is reached.",
    enabled: true,
    config: [
      { key: "frequency", label: "Claim every",    value: "24",   unit: "hours" },
      { key: "threshold", label: "Min reward",     value: "0.01", unit: "INIT" },
    ],
  },
  {
    id: "rebalance", label: "Portfolio Rebalance", icon: RefreshCw, iconColor: "#7C3AED",
    description: "Maintain target allocation across INIT, USDC, and staked positions.",
    enabled: true,
    config: [
      { key: "init_pct",   label: "INIT target",   value: "40", unit: "%" },
      { key: "usdc_pct",   label: "USDC target",   value: "30", unit: "%" },
      { key: "staked_pct", label: "Staked target",  value: "30", unit: "%" },
    ],
  },
  {
    id: "stablecoin_safety", label: "Stablecoin Safety", icon: Shield, iconColor: "#F59E0B",
    description: "Automatically swap to USDC when INIT price drops significantly.",
    enabled: false,
    config: [
      { key: "drop_pct",  label: "Trigger at drop", value: "10", unit: "%" },
      { key: "swap_pct",  label: "Swap to USDC",    value: "50", unit: "%" },
    ],
  },
  {
    id: "profit_lock", label: "Profit Lock", icon: TrendingUp, iconColor: "#FF4D6D",
    description: "Convert gains to stablecoins when profit threshold is reached.",
    enabled: false,
    config: [
      { key: "profit_pct", label: "Trigger at gain", value: "20", unit: "%" },
      { key: "lock_pct",   label: "Lock to USDC",    value: "50", unit: "%" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────
type SavedRule = { id: string; enabled: boolean; config: { key: string; label: string; value: string; unit?: string }[] };

function loadRules(): AutopilotRule[] {
  if (typeof window === "undefined") return DEFAULT_RULES;
  try {
    const saved = localStorage.getItem("autopilot_rules");
    if (!saved) return DEFAULT_RULES;
    const parsed: SavedRule[] = JSON.parse(saved);
    // Re-merge saved state (enabled + config) onto DEFAULT_RULES which has icon references
    return DEFAULT_RULES.map(def => {
      const override = parsed.find(p => p.id === def.id);
      return override ? { ...def, enabled: override.enabled, config: override.config ?? def.config } : def;
    });
  } catch { return DEFAULT_RULES; }
}

function saveRules(rules: AutopilotRule[]) {
  // Only serialize id/enabled/config — icon is a React component and cannot be JSON-stringified
  const serializable: SavedRule[] = rules.map(r => ({ id: r.id, enabled: r.enabled, config: r.config }));
  localStorage.setItem("autopilot_rules", JSON.stringify(serializable));
  // ✅ Sync individual strategy enabled-states into the shared intentos_autopilot key
  syncStrategiesFromRules(rules.map(r => ({ id: r.id, enabled: r.enabled })));
  window.dispatchEvent(new StorageEvent("storage")); // notify AutopilotBanner
}

// ── Rule Card ─────────────────────────────────────────────────
function RuleCard({ rule, onToggle, onConfigChange }: {
  rule: AutopilotRule;
  onToggle: () => void;
  onConfigChange: (key: string, val: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = rule.icon;

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        background: rule.enabled ? `${rule.iconColor}08` : "rgba(255,255,255,0.02)",
        border: `1px solid ${rule.enabled ? rule.iconColor + "20" : "rgba(255,255,255,0.06)"}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${rule.iconColor}15`, border: `1px solid ${rule.iconColor}30` }}>
          <Icon className="w-4 h-4" style={{ color: rule.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">{rule.label}</p>
          <p className="text-xs text-text-muted leading-snug">{rule.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Toggle */}
          <button onClick={onToggle}
            className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
            style={{ background: rule.enabled ? rule.iconColor + "50" : "rgba(255,255,255,0.1)" }}
          >
            <span className="absolute top-1 w-4 h-4 rounded-full transition-all"
              style={{ left: rule.enabled ? "24px" : "4px", background: rule.enabled ? rule.iconColor : "#9AA5BC" }} />
          </button>
          {/* Expand */}
          <button onClick={() => setExpanded(e => !e)} className="text-text-muted hover:text-text-secondary transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Config panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border-default/40 pt-3">
              {rule.config.map(cfg => (
                <div key={cfg.key} className="flex items-center justify-between gap-3">
                  <label className="text-xs text-text-muted">{cfg.label}</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={cfg.value}
                      onChange={e => onConfigChange(cfg.key, e.target.value)}
                      className="w-20 bg-bg-elevated border border-border-default rounded-lg px-2.5 py-1.5 text-xs font-mono text-text-primary text-right focus:outline-none focus:border-accent-cyan/30"
                    />
                    {cfg.unit && <span className="text-xs text-text-muted">{cfg.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function AutopilotPage() {
  const [rules,        setRules]        = useState<AutopilotRule[]>(DEFAULT_RULES);
  const [globalEnable, setGlobalEnable] = useState(false);

  useEffect(() => {
    const loaded = loadRules();
    setRules(loaded);
    // Read master enabled state from shared autopilotState
    setGlobalEnable(readAutopilotState().enabled);

    // Listen for storage events (e.g. intent page toggling autopilot)
    const onStorage = () => {
      setGlobalEnable(readAutopilotState().enabled);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updateRules = (next: AutopilotRule[]) => {
    setRules(next);
    saveRules(next);
    setGlobalEnable(next.some(r => r.enabled));
  };

  const toggleRule = (id: string) => {
    updateRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const updateConfig = (id: string, key: string, val: string) => {
    updateRules(rules.map(r =>
      r.id === id ? { ...r, config: r.config.map(c => c.key === key ? { ...c, value: val } : c) } : r
    ));
  };

  const toggleGlobal = () => {
    const next = !globalEnable;
    setGlobalEnable(next);
    const sharedState = readAutopilotState();
    writeAutopilotState({ enabled: next });
    // When enabling: restore per-strategy states from shared state
    // When disabling: turn off all rules
    updateRules(rules.map(r => ({
      ...r,
      enabled: next
        ? (sharedState.strategies[r.id as keyof typeof sharedState.strategies] ?? (DEFAULT_RULES.find(d => d.id === r.id)?.enabled ?? false))
        : false,
    })));
  };

  return (
    <div className="max-w-lg mx-auto space-y-5 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Bot className="w-6 h-6" style={{ color: "#00F5D4" }} />
          <h1 className="text-2xl font-black text-text-primary">Autopilot</h1>
        </div>
        <p className="text-sm text-text-muted">Automated DeFi strategies that run on your behalf.</p>
      </motion.div>

      {/* Master toggle */}
      <motion.div
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
        className="glass-card p-4 flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-semibold text-text-primary">Enable Autonomous Finance</p>
          <p className="text-xs text-text-muted mt-0.5">Allow IntentOS to execute strategies automatically</p>
        </div>
        <button onClick={toggleGlobal}
          className="w-14 h-7 rounded-full relative transition-all flex-shrink-0"
          style={{ background: globalEnable ? "rgba(0,245,212,0.4)" : "rgba(255,255,255,0.1)" }}
        >
          <span className="absolute top-1 w-5 h-5 rounded-full transition-all"
            style={{ left: globalEnable ? "32px" : "4px", background: globalEnable ? "#00F5D4" : "#9AA5BC" }} />
        </button>
      </motion.div>

      {/* Pro fee notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="flex gap-3 px-4 py-3 rounded-xl"
        style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.15)" }}
      >
        <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#7C3AED" }} />
        <div>
          <p className="text-xs font-bold" style={{ color: "#7C3AED" }}>IntentOS Pro</p>
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
            Autopilot strategies incur a <strong className="text-text-primary">0.5% execution fee</strong> per automated transaction.
            Manual execution remains free.
          </p>
        </div>
      </motion.div>

      {/* Strategy rules */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted px-1">Available Strategies</p>
        {rules.map((rule, i) => (
          <motion.div key={rule.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.05 }}>
            <RuleCard
              rule={rule}
              onToggle={() => toggleRule(rule.id)}
              onConfigChange={(key, val) => updateConfig(rule.id, key, val)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Demo activation tip */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="text-center text-xs text-text-muted space-y-1"
      >
        <p>Or type in Intent:</p>
        <div className="flex gap-2 justify-center flex-wrap">
          {["enable autopilot", "disable autopilot", "auto compound"].map(s => (
            <Link key={s} href={`/app/intent?prefill=${encodeURIComponent(s)}`}
              className="px-2.5 py-1 rounded-lg border text-xs font-medium transition-all hover:border-accent-cyan/30 hover:text-accent-cyan"
              style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "#828A9E" }}
            >
              {s}
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
