import { randomBytes } from "crypto";

/**
 * Minimal server-side wallet token store.
 *
 * A token is issued server-side when the caller first creates a strategy
 * (proving they sent a valid request to /api/execute/intent). The token is
 * bound to the wallet address and never leaves the server unencumbered —
 * the client must present it as `Authorization: Bearer <token>`.
 *
 * This replaces the spoofable X-Wallet-Owner header (CWE-639).
 *
 * Limitations / future work:
 *  - Tokens are in-memory; they are lost on restart. A persistent store
 *    (Redis, DB) and a full signed-challenge flow should replace this.
 *  - TTL is 15 minutes. Adjust via TOKEN_TTL_MS if needed.
 */

const TOKEN_TTL_MS = 15 * 60 * 1_000; // 15 minutes

interface TokenEntry {
  walletAddress: string;
  expiresAt: number;
}

const tokenStore = new Map<string, TokenEntry>();

/** Issue a fresh token for the given wallet address. */
export function issueToken(walletAddress: string): string {
  const token = randomBytes(32).toString("hex");
  tokenStore.set(token, { walletAddress, expiresAt: Date.now() + TOKEN_TTL_MS });
  return token;
}

/**
 * Verify a bearer token and return the associated wallet address.
 * Returns `null` if the token is missing, expired, or unknown.
 */
export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const entry = tokenStore.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokenStore.delete(token);
    return null;
  }
  return entry.walletAddress;
}

/** Revoke a token (e.g., on explicit sign-out). */
export function revokeToken(token: string): void {
  tokenStore.delete(token);
}

/** Periodically purge expired tokens to prevent unbounded memory growth. */
setInterval(() => {
  const now = Date.now();
  for (const [tok, entry] of tokenStore) {
    if (now > entry.expiresAt) tokenStore.delete(tok);
  }
}, TOKEN_TTL_MS);
