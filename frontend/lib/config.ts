/**
 * lib/config.ts — Single source of truth for all frontend constants.
 *
 * Every network URL, chain ID, and environment flag lives here.
 * Nothing is hardcoded in pages or components — import from this file.
 *
 * To switch networks (testnet → mainnet):
 *   Update the corresponding NEXT_PUBLIC_* values in .env.local.
 *   No source code changes needed.
 */

// ── Backend ───────────────────────────────────────────────────────────────────

/** IntentOS backend API base URL */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Execution mode: "mock" for demos, "testnet" for live chain */
export const EXECUTION_MODE =
  (process.env.NEXT_PUBLIC_EXECUTION_MODE ?? "mock") as "mock" | "testnet";

// ── Initia Network ─────────────────────────────────────────────────────────────

/** Chain ID — e.g. "initiation-2" (testnet) or future mainnet ID */
export const CHAIN_ID =
  process.env.NEXT_PUBLIC_CHAIN_ID ?? "initiation-2";

/**
 * Block explorer base URL.
 * Append /txs/<hash>  for transactions.
 * Append /address/<addr>  for wallet pages.
 */
export const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_EXPLORER_BASE ??
  "https://scan.testnet.initia.xyz/initiation-2";

/** Construct a full explorer URL for a transaction hash */
export const explorerTxUrl = (txHash: string) =>
  `${EXPLORER_BASE}/txs/${txHash}`;

/** Construct a full explorer URL for a wallet address */
export const explorerAddressUrl = (address: string) =>
  `${EXPLORER_BASE}/address/${address}`;

/** Testnet INIT faucet — users claim free tokens here */
export const FAUCET_URL =
  process.env.NEXT_PUBLIC_FAUCET_URL ?? "https://app.testnet.initia.xyz/faucet";

/**
 * Token image registry base URL.
 * Usage: `${REGISTRY_URL}/images/INIT.png`
 */
export const REGISTRY_URL =
  process.env.NEXT_PUBLIC_REGISTRY_URL ??
  "https://registry.testnet.initia.xyz";

/** Username-to-avatar image API base URL */
export const USERNAMES_API_URL =
  process.env.NEXT_PUBLIC_USERNAMES_API_URL ??
  "https://usernames-api.testnet.initia.xyz";

// ── Token image helpers ────────────────────────────────────────────────────────

/** Map of token symbol → registry image URL */
export const TOKEN_IMAGES: Record<string, string> = {
  INIT: `${REGISTRY_URL}/images/INIT.png`,
  USDC: `${REGISTRY_URL}/images/USDC.png`,
  ETH:  `${REGISTRY_URL}/images/ETH.png`,
};

/** Resolve a token symbol to its image URL, falling back gracefully */
export const tokenImageUrl = (symbol: string) =>
  TOKEN_IMAGES[symbol.toUpperCase()] ?? `${REGISTRY_URL}/images/${symbol.toUpperCase()}.png`;

/** Resolve a .init username to their avatar URL */
export const usernameAvatarUrl = (username: string) => {
  const stripped = username.replace(/^@/, "").replace(/\.init$/, "");
  return `${USERNAMES_API_URL}/image/${stripped}`;
};

// ── HTTP Headers ─────────────────────────────────────────────────────────────

/**
 * Common headers for all API fetch calls.
 * ngrok-skip-browser-warning bypasses ngrok's HTML interstitial in dev.
 * Safe to include in production since it's a no-op on non-ngrok hosts.
 */
export const API_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "69420",
};

// ── Misc ──────────────────────────────────────────────────────────────────────

/** Demo / marketing YouTube embed URL */
export const YOUTUBE_URL =
  process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "";

// ── Generic fetch helper ──────────────────────────────────────────────────────

/** Typed helper for JSON API calls to the IntentOS backend */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...API_HEADERS,
      ...(options?.headers ?? {}),
    },
  });
  return res.json() as Promise<T>;
}
