import { Router } from "express";
import type { Request, Response } from "express";
import https from "https";
import { NETWORK_CONFIG } from "../../../config/networkConfig";

const router = Router();

/**
 * GET /api/nameservice/resolve/:username
 *
 * Server-side proxy to the Initia nameservice LCD endpoint.
 * Avoids CORS issues from direct browser calls.
 *
 * Strips leading "@" from username before lookup.
 * Returns: { success: true, address: "init1..." }
 *      or: { success: false, error: "..." }
 */
router.get("/resolve/:username", async (req: Request, res: Response) => {
  const raw = req.params.username ?? "";
  const username = raw.replace(/^@/, "").toLowerCase().trim();

  if (!username || !username.endsWith(".init")) {
    return res.status(400).json({ success: false, error: "Invalid .init username." });
  }

  const lcdBase = new URL(NETWORK_CONFIG.lcd);

  const path = `/initia/nameservice/v1/names/${encodeURIComponent(username)}`;

  console.log(`[nameservice] Resolving "${username}" on ${NETWORK_CONFIG.network} → ${lcdBase.hostname}${path}`);

  const options = {
    hostname: lcdBase.hostname,
    port: lcdBase.port ? parseInt(lcdBase.port, 10) : 443,
    path,
    method: "GET",
    headers: { Accept: "application/json" },
  };

  const makeRequest = () =>
    new Promise<{ status: number; body: string }>((resolve, reject) => {
      const reqHttp = https.request(options, (upstream) => {
        let data = "";
        upstream.on("data", (chunk: string) => { data += chunk; });
        upstream.on("end", () => resolve({ status: upstream.statusCode ?? 0, body: data }));
      });
      reqHttp.on("error", reject);
      reqHttp.end();
    });

  try {
    const { status, body } = await makeRequest();

    if (status === 404 || status === 400) {
      return res.status(404).json({
        success: false,
        error: "Username not found",
        detail: `"${username}" is not registered on the Initia ${NETWORK_CONFIG.network}.`,
      });
    }

    if (status !== 200) {
      return res.status(502).json({
        success: false,
        error: "Nameservice unavailable",
        detail: `LCD returned HTTP ${status}. Network: ${NETWORK_CONFIG.network}`,
      });
    }

    let json: Record<string, unknown>;
    try {
      json = JSON.parse(body);
    } catch {
      return res.status(502).json({ success: false, error: "Invalid response from nameservice." });
    }

    // Initia nameservice response shape: { name: { owner: "init1...", ... } }
    const address: string | undefined =
      (json?.name as Record<string, string>)?.owner ??
      (json?.address as string) ??
      (json?.owner as string);

    if (!address || !address.startsWith("init1")) {
      return res.status(404).json({
        success: false,
        error: "Username not found",
        detail: `Could not resolve an init1 address for "${username}".`,
      });
    }

    return res.json({ success: true, address, username });
  } catch (err) {
    console.error("[nameservice] proxy error:", err);
    return res.status(502).json({
      success: false,
      error: "Could not reach Initia nameservice.",
      detail: `Network: ${NETWORK_CONFIG.network} (${NETWORK_CONFIG.lcd})`,
    });
  }
});

export default router;
