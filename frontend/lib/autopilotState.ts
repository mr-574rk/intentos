/**
 * Shared autopilot state utilities — single source of truth.
 * Used by both the Intent page (NL commands) and the Autopilot settings page (UI toggles).
 * Stored in localStorage under "intentos_autopilot".
 */

export interface AutopilotState {
  enabled:    boolean;
  strategies: {
    auto_compound:      boolean;
    rebalance:          boolean;
    stablecoin_safety:  boolean;
    profit_lock:        boolean;
  };
}

/** Map from autopilot rule id → strategies key */
export const RULE_TO_STRATEGY: Record<string, keyof AutopilotState["strategies"]> = {
  auto_compound:      "auto_compound",
  rebalance:          "rebalance",
  stablecoin_safety:  "stablecoin_safety",
  profit_lock:        "profit_lock",
};

const KEY = "intentos_autopilot";

const DEFAULTS: AutopilotState = {
  enabled: false,
  strategies: {
    auto_compound:     true,
    rebalance:         true,
    stablecoin_safety: false,
    profit_lock:       false,
  },
};

export function readAutopilotState(): AutopilotState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function writeAutopilotState(patch: Partial<AutopilotState>): AutopilotState {
  const current = readAutopilotState();
  const next: AutopilotState = { ...current, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  // Also keep legacy key in sync so AutopilotBanner still works
  localStorage.setItem("autopilot_enabled", next.enabled ? "true" : "false");
  // Notify same-tab listeners (storage event only fires cross-tab by default)
  window.dispatchEvent(new StorageEvent("storage"));
  return next;
}

export function enableAutopilot(): AutopilotState {
  return writeAutopilotState({ enabled: true });
}

export function disableAutopilot(): AutopilotState {
  return writeAutopilotState({ enabled: false });
}

/**
 * Sync individual rule enabled-states into the shared intentos_autopilot key.
 * Called from the Autopilot settings page whenever a rule is toggled.
 */
export function syncStrategiesFromRules(
  rules: { id: string; enabled: boolean }[]
): AutopilotState {
  const current = readAutopilotState();
  const strategies = { ...current.strategies };
  for (const rule of rules) {
    const key = RULE_TO_STRATEGY[rule.id];
    if (key) strategies[key] = rule.enabled;
  }
  // If at least one strategy is enabled, keep enabled flag as-is;
  // if all disabled, propagate disabled state.
  const anyEnabled = Object.values(strategies).some(Boolean);
  return writeAutopilotState({ strategies, enabled: anyEnabled ? current.enabled : false });
}

/** Returns list of active strategy labels for display in intent responses */
export function getActiveStrategyLabels(state: AutopilotState): string[] {
  const labels: string[] = [];
  if (state.strategies.auto_compound)    labels.push("Auto-compound staking");
  if (state.strategies.rebalance)        labels.push("Portfolio rebalance");
  if (state.strategies.stablecoin_safety) labels.push("Stablecoin safety");
  if (state.strategies.profit_lock)      labels.push("Profit lock");
  return labels;
}
