import pool from "./historyRepo";

// ── Schema init (best-effort) ─────────────────────────────────────────────────
if (pool) {
  pool
    .query(`
      CREATE TABLE IF NOT EXISTS recipients (
        id            SERIAL PRIMARY KEY,
        wallet_owner  TEXT NOT NULL,
        name          TEXT NOT NULL,
        address       TEXT NOT NULL,
        last_used     BIGINT NOT NULL,
        UNIQUE (wallet_owner, address)
      );
    `)
    .catch((err: Error) =>
      console.warn("[DB] Recipients schema unreachable — using in-memory fallback:", err.message)
    );
}

// ── In-memory fallback store ──────────────────────────────────────────────────
interface MemRecipient {
  walletOwner: string;
  name: string;
  address: string;
  lastUsed: number;
}
const memRecipients: MemRecipient[] = [];

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RecipientRow {
  name: string;
  address: string;
  lastUsed: number;
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

/**
 * Upsert a recipient for a given wallet owner.
 * Falls back to in-memory when Postgres is unavailable.
 */
export async function saveRecipient(
  walletOwner: string,
  name: string,
  address: string
): Promise<void> {
  const lastUsed = Date.now();

  if (pool && (await dbAvailable())) {
    await pool.query(
      `INSERT INTO recipients (wallet_owner, name, address, last_used)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (wallet_owner, address)
       DO UPDATE SET name = EXCLUDED.name, last_used = EXCLUDED.last_used`,
      [walletOwner, name, address, lastUsed]
    );
    return;
  }

  // In-memory fallback
  const idx = memRecipients.findIndex(
    (r) => r.walletOwner === walletOwner && r.address === address
  );
  if (idx >= 0) {
    memRecipients[idx].name = name;
    memRecipients[idx].lastUsed = lastUsed;
  } else {
    memRecipients.push({ walletOwner, name, address, lastUsed });
  }
}

/**
 * Fetch up to 20 most-recently-used recipients for a wallet.
 * Falls back to in-memory when Postgres is unavailable.
 */
export async function getRecipients(walletOwner: string): Promise<RecipientRow[]> {
  if (pool && (await dbAvailable())) {
    const result = await pool.query(
      `SELECT name, address, last_used AS "lastUsed"
       FROM recipients
       WHERE wallet_owner = $1
       ORDER BY last_used DESC
       LIMIT 20`,
      [walletOwner]
    );
    return result.rows as RecipientRow[];
  }

  // In-memory fallback
  return memRecipients
    .filter((r) => r.walletOwner === walletOwner)
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, 20)
    .map(({ name, address, lastUsed }) => ({ name, address, lastUsed }));
}
