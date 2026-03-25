/**
 * Central frontend configuration.
 * All environment-specific values live here — never scattered across pages.
 */

/** Backend API base URL — set NEXT_PUBLIC_API_URL in .env.local */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://1492-197-210-77-187.ngrok-free.app";

/** Initia rollup chain ID — set NEXT_PUBLIC_CHAIN_ID in .env.local */
export const CHAIN_ID =
  process.env.NEXT_PUBLIC_CHAIN_ID ?? "intentos-1";

/** Common fetch headers used on all API calls */
export const API_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  // Bypasses ngrok HTML warning page so we always get JSON back
  "ngrok-skip-browser-warning": "69420",
};

/** Typed helper for JSON API calls */
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
  const data = await res.json();
  return data as T;
}
