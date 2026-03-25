import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Store database in a persistent location
const DB_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = path.join(DB_DIR, "intentos.db");
const db = new Database(DB_PATH);

// Initialise schema
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id          TEXT PRIMARY KEY,
    intentText  TEXT NOT NULL,
    bundle      TEXT NOT NULL,    -- JSON
    simulation  TEXT NOT NULL,    -- JSON
    result      TEXT NOT NULL,    -- JSON
    performance TEXT,
    createdAt   TEXT NOT NULL
  );
`);

export interface HistoryRow {
  id: string;
  intentText: string;
  bundle: string;
  simulation: string;
  result: string;
  performance?: string;
  createdAt: string;
}

export function saveHistory(entry: {
  id: string;
  intentText: string;
  bundle: object;
  simulation: object;
  result: object;
  performance?: string;
  createdAt: string;
}) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO history (id, intentText, bundle, simulation, result, performance, createdAt)
    VALUES (@id, @intentText, @bundle, @simulation, @result, @performance, @createdAt)
  `);
  stmt.run({
    ...entry,
    bundle: JSON.stringify(entry.bundle),
    simulation: JSON.stringify(entry.simulation),
    result: JSON.stringify(entry.result),
    performance: entry.performance ?? null,
  });
}

export function getAllHistory(): HistoryRow[] {
  return db
    .prepare("SELECT * FROM history ORDER BY createdAt DESC LIMIT 100")
    .all() as HistoryRow[];
}

export default db;
