import { Pool } from "pg";

// ─── Supabase PostgreSQL connection ───────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase hosted Postgres
});

// Initialise schema on first connection
pool.query(`
  CREATE TABLE IF NOT EXISTS history (
    id              TEXT PRIMARY KEY,
    "intentText"     TEXT NOT NULL,
    bundle          TEXT NOT NULL,
    simulation      TEXT NOT NULL,
    result          TEXT NOT NULL,
    performance     TEXT,
    "createdAt"      TEXT NOT NULL,
    "walletAddress"  TEXT
  );
`)
  .then(() =>
    // Safe migration for existing tables that predate the walletAddress column
    pool.query(`ALTER TABLE history ADD COLUMN IF NOT EXISTS "walletAddress" TEXT`)
  )
  .catch((err: any) => console.error("[DB] Schema init error:", err));

export interface HistoryRow {
  id: string;
  intentText: string;
  bundle: string;
  simulation: string;
  result: string;
  performance?: string;
  createdAt: string;
}

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
}

export async function getAllHistory(): Promise<HistoryRow[]> {
  const result = await pool.query(
    `SELECT id, "intentText", bundle, simulation, result, performance, "createdAt", "walletAddress"
     FROM history
     ORDER BY "createdAt" DESC
     LIMIT 100`
  );
  return result.rows as HistoryRow[];
}

/** Returns only rows belonging to a specific wallet address. */
export async function getHistoryByAddress(address: string): Promise<HistoryRow[]> {
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

export default pool;
