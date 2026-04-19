import { Router } from "express";
import type { Request, Response } from "express";
import { getAllHistory } from "../db/historyRepo";
import type { HistoryRow } from "../db/historyRepo";

const router = Router();

// ── High-fidelity mock seed data ───────────────────────────────────────────────
// These represent plausible real-world performers. They are flagged as `mock: true`
// so the frontend can visually distinguish them, and so removing them later (when
// real user volume arrives) requires no backend logic changes — just remove this array.

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  intentText: string;
  returnPct: number;
  riskLevel: string;
  executedAt: string;
  txHash?: string;
  mock: boolean;
}

const MOCK_SEED: Omit<LeaderboardEntry, "rank">[] = [
  {
    address: "init1daniel000000000000000000000000000000001",
    displayName: "daniel.init",
    intentText: "maximize yield with low risk on my INIT holdings",
    returnPct: 18.2,
    riskLevel: "Low",
    executedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    mock: true,
  },
  {
    address: "init1alex00000000000000000000000000000000002",
    displayName: "alex.init",
    intentText: "rotate into best yield pools this week",
    returnPct: 15.7,
    riskLevel: "Medium",
    executedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    mock: true,
  },
  {
    address: "init1maria0000000000000000000000000000000003",
    displayName: "maria.init",
    intentText: "stake INIT and compound rewards automatically",
    returnPct: 12.4,
    riskLevel: "Low",
    executedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    mock: true,
  },
  {
    address: "init1chen00000000000000000000000000000000004",
    displayName: "chen.init",
    intentText: "grow my portfolio safely over 7 days",
    returnPct: 9.8,
    riskLevel: "Low",
    executedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    mock: true,
  },
  {
    address: "init1priya0000000000000000000000000000000005",
    displayName: "priya.init",
    intentText: "stake 50 INIT and swap 100 USDC to ETH for diversification",
    returnPct: 7.3,
    riskLevel: "Medium",
    executedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    mock: true,
  },
];

// ── Helper: extract APY % from a history row ──────────────────────────────────
function extractReturnPct(row: HistoryRow): number | null {
  try {
    const sim = typeof row.simulation === "string" ? JSON.parse(row.simulation) : row.simulation;
    if (sim?.projectedAPY && typeof sim.projectedAPY === "number") return sim.projectedAPY;
  } catch {}
  // Try performance field (stored as "8.5%" or "+8.5%")
  if (row.performance) {
    const m = row.performance.match(/([+-]?\d+(\.\d+)?)/);
    if (m) return parseFloat(m[1]);
  }
  return null;
}

function extractRiskLevel(row: HistoryRow): string {
  try {
    const sim = typeof row.simulation === "string" ? JSON.parse(row.simulation) : row.simulation;
    if (sim?.riskLabel) return sim.riskLabel;
    if (sim?.riskScoreNumeric) {
      const score = sim.riskScoreNumeric as number;
      if (score <= 3) return "Low";
      if (score <= 6) return "Medium";
      return "High";
    }
  } catch {}
  return "Unknown";
}

function shortenAddress(addr: string): string {
  if (!addr) return "anon";
  return `${addr.slice(0, 8)}…${addr.slice(-4)}`;
}

/**
 * GET /api/leaderboard
 * Returns top performers ranked by projected APY.
 * Blends real execution history with mock seed data.
 * Query params: ?limit=20&window=week|month|all
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const allHistory = await getAllHistory();

    // Build real entries from successful executions with measurable returns
    const realEntries: Omit<LeaderboardEntry, "rank">[] = [];

    for (const row of allHistory) {
      try {
        const result = typeof row.result === "string" ? JSON.parse(row.result) : row.result;
        if (result?.status !== "success") continue;
        const returnPct = extractReturnPct(row);
        if (returnPct === null || returnPct <= 0) continue;

        realEntries.push({
          address: row.walletAddress ?? "unknown",
          displayName: row.walletAddress ? shortenAddress(row.walletAddress) : "anon",
          intentText: row.intentText,
          returnPct,
          riskLevel: extractRiskLevel(row),
          executedAt: row.createdAt,
          txHash: result.txHash,
          mock: false,
        });
      } catch {}
    }

    // Merge: real entries first, then fill with mock seed up to desired count
    // De-duplicate by address (keep highest return per address)
    const byAddress = new Map<string, Omit<LeaderboardEntry, "rank">>();

    for (const entry of [...realEntries, ...MOCK_SEED]) {
      const existing = byAddress.get(entry.address);
      if (!existing || entry.returnPct > existing.returnPct) {
        byAddress.set(entry.address, entry);
      }
    }

    // Sort descending by returnPct, assign ranks
    const ranked: LeaderboardEntry[] = Array.from(byAddress.values())
      .sort((a, b) => b.returnPct - a.returnPct)
      .slice(0, 20)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    res.json({ success: true, data: ranked });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
