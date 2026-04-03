import { API_URL } from "@/lib/config";

/**
 * Wakes the backend and polls until it returns a 200 OK.
 * Uses an exponential backoff with jitter and per-request timeouts 
 * to ensure cold-starts on hosts like Render don't block the frontend indefinitely.
 */
export async function waitForBackend(maxRetries = 5): Promise<boolean> {
  if (!API_URL) {
    console.error("[waitForBackend] API_URL is not configured.");
    return false;
  }

  for (let i = 0; i < maxRetries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    try {
      const res = await fetch(`${API_URL}/health`, { 
        method: "GET",
        cache: "no-store",
        signal: controller.signal 
      });
      clearTimeout(timeout);
      
      if (res.ok) return true;
    } catch (err: any) {
      clearTimeout(timeout);
      console.warn(`[waitForBackend] attempt ${i + 1} failed:`, err.name === "AbortError" ? "Request timed out" : err.message);
    }

    if (i < maxRetries - 1) {
      // Exponential backoff + minimal jitter
      const delay = Math.min(1000 * 2 ** i, 8000) + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return false;
}

// Maintain backwards compatibility:
export async function wakeBackend() {
  await waitForBackend(1);
}
