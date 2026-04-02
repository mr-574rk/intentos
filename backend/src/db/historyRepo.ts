import { Pool } from "pg";

// ─── Supabase PostgreSQL connection ───────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase hosted Postgres
});

// Initialise schema on first connection
pool.query(`
  CREATE TABLE IF NOT EXISTS history (
    id          TEXT PRIMARY KEY,
    "intentText" TEXT NOT NULL,
    bundle      TEXT NOT NULL,
    simulation  TEXT NOT NULL,
    result      TEXT NOT NULL,
    performance TEXT,
    "createdAt"  TEXT NOT NULL
  );
`).catch((err: any) => console.error("[DB] Schema init error:", err));

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
}) {
  await pool.query(
    `INSERT INTO history (id, "intentText", bundle, simulation, result, performance, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE
     SET "intentText" = EXCLUDED."intentText",
         bundle = EXCLUDED.bundle,
         simulation = EXCLUDED.simulation,
         result = EXCLUDED.result,
         performance = EXCLUDED.performance,
         "createdAt" = EXCLUDED."createdAt"`,
    [
      entry.id,
      entry.intentText,
      JSON.stringify(entry.bundle),
      JSON.stringify(entry.simulation),
      JSON.stringify(entry.result),
      entry.performance ?? null,
      entry.createdAt,
    ]
  );
}

export async function getAllHistory(): Promise<HistoryRow[]> {
  const result = await pool.query(
    `SELECT id, "intentText", bundle, simulation, result, performance, "createdAt"
     FROM history
     ORDER BY "createdAt" DESC
     LIMIT 100`
  );
  return result.rows as HistoryRow[];
}

export default pool;
