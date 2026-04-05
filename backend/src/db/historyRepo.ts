import { Pool } from "pg";

// ── Connection ────────────────────────────────────────────────────────────────
// DATABASE_URL is optional. When missing or unreachable the repo automatically
// falls back to a local in-memory store so the server stays functional.
//
// Free-tier Supabase projects are paused after a period of inactivity.
// Resume yours at https://supabase.com/dashboard or set DATABASE_URL to another
// Postgres instance. Until then the in-memory fallback keeps everything working.

const DB_URL = process.env.DATABASE_URL;

// Only create a real pool when DATABASE_URL is supplied
const pool = DB_URL
  ? new Pool({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
      // Short timeouts so boot doesn't stall when Supabase is paused
      connectionTimeoutMillis: 4000,
      idleTimeoutMillis: 10000,
    })
  : null;

// ── Schema init (best-effort, non-blocking) ───────────────────────────────────
if (pool) {
  pool
    .query(`
      CREATE TABLE IF NOT EXISTS history (
        id              TEXT PRIMARY KEY,
        "intentText"    TEXT NOT NULL,
        bundle          TEXT NOT NULL,
        simulation      TEXT NOT NULL,
        result          TEXT NOT NULL,
        performance     TEXT,
        "createdAt"     TEXT NOT NULL,
        "walletAddress" TEXT
      );
    `)
    .then(() =>
      pool.query(
        `ALTER TABLE history ADD COLUMN IF NOT EXISTS "walletAddress" TEXT`
      )
    )
    .catch((err: Error) =>
      console.warn("[DB] History schema unreachable — using in-memory fallback:", err.message)
    );
}

// ── In-memory fallback store ──────────────────────────────────────────────────
interface HistoryEntry {
  id: string;
  intentText: string;
  bundle: string;
  simulation: string;
  result: string;
  performance?: string;
  createdAt: string;
  walletAddress?: string;
}
const memHistory: HistoryEntry[] = [];

// ── Types ─────────────────────────────────────────────────────────────────────
export interface HistoryRow {
  id: string;
  intentText: string;
  bundle: string;
  simulation: string;
  result: string;
  performance?: string;
  createdAt: string;
  walletAddress?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function dbAvailable(): Promise<boolean> {
  if (!pool) return false;
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function saveHistory(entry: {
  id: string;
  intentText: string;
  bundle: object;
  simulation: object;
  result: object;
  performance?: string;
  createdAt: string;
  walletAddress?: string;
}) {
  if (pool && (await dbAvailable())) {
    await pool.query(
      `INSERT INTO history (id, "intentText", bundle, simulation, result, performance, "createdAt", "walletAddress")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE
       SET "intentText"    = EXCLUDED."intentText",
           bundle          = EXCLUDED.bundle,
           simulation      = EXCLUDED.simulation,
           result          = EXCLUDED.result,
           performance     = EXCLUDED.performance,
           "createdAt"     = EXCLUDED."createdAt",
           "walletAddress" = EXCLUDED."walletAddress"`,
      [
        entry.id,
        entry.intentText,
        JSON.stringify(entry.bundle),
        JSON.stringify(entry.simulation),
        JSON.stringify(entry.result),
        entry.performance ?? null,
        entry.createdAt,
        entry.walletAddress ?? null,
      ]
    );
    return;
  }

  // In-memory fallback
  const idx = memHistory.findIndex((h) => h.id === entry.id);
  const row: HistoryEntry = {
    id: entry.id,
    intentText: entry.intentText,
    bundle: JSON.stringify(entry.bundle),
    simulation: JSON.stringify(entry.simulation),
    result: JSON.stringify(entry.result),
    performance: entry.performance,
    createdAt: entry.createdAt,
    walletAddress: entry.walletAddress,
  };
  if (idx >= 0) memHistory[idx] = row;
  else memHistory.unshift(row);
  // Cap at 500 entries
  if (memHistory.length > 500) memHistory.length = 500;
}

export async function getAllHistory(): Promise<HistoryRow[]> {
  if (pool && (await dbAvailable())) {
    const result = await pool.query(
      `SELECT id, "intentText", bundle, simulation, result, performance, "createdAt", "walletAddress"
       FROM history
       ORDER BY "createdAt" DESC
       LIMIT 100`
    );
    return result.rows as HistoryRow[];
  }
  return memHistory.slice(0, 100) as HistoryRow[];
}

/** Returns only rows belonging to a specific wallet address. */
export async function getHistoryByAddress(address: string): Promise<HistoryRow[]> {
  if (pool && (await dbAvailable())) {
    const result = await pool.query(
      `SELECT id, "intentText", bundle, simulation, result, performance, "createdAt", "walletAddress"
       FROM history
       WHERE "walletAddress" = $1
       ORDER BY "createdAt" DESC
       LIMIT 100`,
      [address]
    );
    return result.rows as HistoryRow[];
  }
  return memHistory.filter((h) => h.walletAddress === address).slice(0, 100) as HistoryRow[];
}

export default pool;
