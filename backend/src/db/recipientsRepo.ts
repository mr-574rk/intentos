import pool from "./historyRepo";

// Initialise recipients table on startup
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
  .catch((err: any) =>
    console.error("[DB] Recipients schema init error:", err)
  );

export interface RecipientRow {
  name: string;
  address: string;
  lastUsed: number;
}

/**
 * Upsert a recipient for a given wallet owner.
 * If the (wallet_owner, address) pair already exists, update name and last_used.
 */
export async function saveRecipient(
  walletOwner: string,
  name: string,
  address: string
): Promise<void> {
  const lastUsed = Date.now();
  await pool.query(
    `INSERT INTO recipients (wallet_owner, name, address, last_used)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (wallet_owner, address)
     DO UPDATE SET name = EXCLUDED.name, last_used = EXCLUDED.last_used`,
    [walletOwner, name, address, lastUsed]
  );
}

/**
 * Fetch up to 20 most-recently-used recipients for a wallet.
 */
export async function getRecipients(
  walletOwner: string
): Promise<RecipientRow[]> {
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
