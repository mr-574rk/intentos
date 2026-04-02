import { API_URL } from "@/lib/config";

export async function wakeBackend() {
  try {
    await fetch(`${API_URL}/health`, {
      method: "GET",
      cache: "no-store"
    });
  } catch (err) {
    console.warn("Backend wake attempt failed", err);
  }
}

export async function waitForBackend(maxRetries = 8) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${API_URL}/health`);
      if (res.ok) return true;
    } catch {}

    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}
