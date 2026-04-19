import { Pool } from "pg";

// ── Connection ─────────────────────────────────────────────────────────────────
// Reuses the same DATABASE_URL pattern as historyRepo — Postgres when available,
// in-memory fallback otherwise.

const DB_URL = process.env.DATABASE_URL;

const pool = DB_URL
  ? new Pool({
      connectionString: DB_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000,
      idleTimeoutMillis: 10000,
    })
  : null;

// ── Schema init ───────────────────────────────────────────────────────────────
if (pool) {
  pool
    .query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "referrerAddress" TEXT NOT NULL,
        "refereeAddress"  TEXT NOT NULL,
        "createdAt"       TEXT NOT NULL,
        UNIQUE ("referrerAddress", "refereeAddress")
      );
    `)
    .catch((err: Error) =>
      console.warn("[DB] Referral schema unreachable — using in-memory fallback:", err.message)
    );
}

// ── In-memory fallback ────────────────────────────────────────────────────────
interface ReferralEntry {
  id: string;
  referrerAddress: string;
  refereeAddress: string;
  createdAt: string;
}
const memReferrals: ReferralEntry[] = [];

async function dbAvailable(): Promise<boolean> {
  if (!pool) return false;
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

// ── Tiered Referral Logic ─────────────────────────────────────────────────────
// Level 1:  3 invites → 10% fee discount
// Level 2: 10 invites → 25% fee discount + premium autopilot access
// Level 3: 25 invites → 50% fee discount + leaderboard badge

export interface ReferralTier {
  level: 0 | 1 | 2 | 3;
  label: string;
  discount: number; // % fee discount
  perks: string[];
  nextThreshold: number | null; // invites needed for next level
}

export function calcTier(inviteCount: number): ReferralTier {
  if (inviteCount >= 25) {
    return {
      level: 3,
      label: "Elite",
      discount: 50,
      perks: ["50% fee discount", "Leaderboard boost badge", "Premium autopilot"],
      nextThreshold: null,
    };
  }
  if (inviteCount >= 10) {
    return {
      level: 2,
      label: "Pro",
      discount: 25,
      perks: ["25% fee discount", "Premium autopilot access"],
      nextThreshold: 25,
    };
  }
  if (inviteCount >= 3) {
    return {
      level: 1,
      label: "Starter",
      discount: 10,
      perks: ["10% fee discount"],
      nextThreshold: 10,
    };
  }
  return {
    level: 0,
    label: "None",
    discount: 0,
    perks: [],
    nextThreshold: 3,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Record a new referral (referee's first execution after clicking a ref link). */
export async function recordReferral(referrerAddress: string, refereeAddress: string): Promise<void> {
  const now = new Date().toISOString();

  if (pool && (await dbAvailable())) {
    await pool.query(
      `INSERT INTO referrals ("referrerAddress", "refereeAddress", "createdAt")
       VALUES ($1, $2, $3)
       ON CONFLICT ("referrerAddress", "refereeAddress") DO NOTHING`,
      [referrerAddress, refereeAddress, now]
    );
    return;
  }

  // In-memory fallback — deduplicate
  const exists = memReferrals.some(
    (r) => r.referrerAddress === referrerAddress && r.refereeAddress === refereeAddress
  );
  if (!exists) {
    memReferrals.unshift({
      id: `mem-${Date.now()}`,
      referrerAddress,
      refereeAddress,
      createdAt: now,
    });
  }
}

/** Get all referrals made by a specific address. */
export async function getReferralsByReferrer(referrerAddress: string): Promise<ReferralEntry[]> {
  if (pool && (await dbAvailable())) {
    const result = await pool.query(
      `SELECT id, "referrerAddress", "refereeAddress", "createdAt"
       FROM referrals
       WHERE "referrerAddress" = $1
       ORDER BY "createdAt" DESC`,
      [referrerAddress]
    );
    return result.rows as ReferralEntry[];
  }
  return memReferrals.filter((r) => r.referrerAddress === referrerAddress);
}

/** Check if an address was referred (i.e., used a referral link). */
export async function getReferrerOf(refereeAddress: string): Promise<string | null> {
  if (pool && (await dbAvailable())) {
    const result = await pool.query(
      `SELECT "referrerAddress" FROM referrals WHERE "refereeAddress" = $1 LIMIT 1`,
      [refereeAddress]
    );
    return result.rows[0]?.referrerAddress ?? null;
  }
  return memReferrals.find((r) => r.refereeAddress === refereeAddress)?.referrerAddress ?? null;
}

export default pool;
