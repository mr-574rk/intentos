import { Router } from "express";
import type { Request, Response } from "express";
import { RESTClient, bcs } from "@initia/initia.js";
import { NETWORK_CONFIG } from "../../../config/networkConfig";
import { toBech32 } from "@cosmjs/encoding";

const router = Router();
const restClient = new RESTClient(NETWORK_CONFIG.lcd);

// Module address for testnet usernames contract
const MODULE_ADDRESS = "0x42cd8467b1c86e59bf319e5664a09b6b5840bb3fac64f5ce690b5041c530565a";

function hexToInitAddress(hex: string): string {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = Buffer.from(clean, "hex");
  return toBech32("init", bytes);
}

/**
 * GET /api/nameservice/resolve/:username
 *
 * Resolves an Initia username to an address by triggering a view function on the Move VM.
 */
router.get("/resolve/:username", async (req: Request, res: Response) => {
  const rawQuery = req.params.username ?? "";
  // Ensure we strip trailing .init and leading @
  const username = rawQuery.replace(/^@/, "").replace(/\.init$/, "").toLowerCase().trim();

  if (!username) {
    return res.status(400).json({ success: false, error: "Invalid username." });
  }

  try {
    const bcsArg = bcs.string().serialize(username).toBase64();
    console.log(`[nameservice] Resolving "${username}.init" on ${NETWORK_CONFIG.network} (BCS: ${bcsArg})`);

    const result = await restClient.move.view(
      MODULE_ADDRESS,
      "usernames",
      "get_address_from_name",
      [],
      [bcsArg]
    );

    let resolvedAddress: string | null = null;
    
    // SDK wraps response in { data, events, gas_used }
    // data is a JSON-stringified value, e.g. "\"0x3dd7b...\""  or  "null"  or  "{\"vec\":[...]}"
    const raw = (result as any)?.data;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw); // unwraps the extra quotes

        if (typeof parsed === "string" && parsed.length > 0) {
          // Direct address (Option was already unwrapped by the node — most common)
          resolvedAddress = parsed;
        } else if (parsed?.vec && Array.isArray(parsed.vec) && parsed.vec.length > 0) {
          // Option<address> still in vec form
          resolvedAddress = parsed.vec[0];
        }
        // parsed === null or parsed?.vec === [] means name not found / expired
      } catch {
        console.warn("[nameservice] unexpected data shape:", raw);
      }
    } else if (Array.isArray(raw) && raw.length > 0) {
      // Future-proof: if a newer SDK version returns the array directly
      resolvedAddress = raw[0]?.vec?.[0] ?? (typeof raw[0] === "string" ? raw[0] : null);
    }

    if (!resolvedAddress) {
      return res.status(404).json({
        success: false,
        error: "Username not found",
        detail: `"${username}.init" is not registered or has expired.`,
      });
    }

    const initAddress = hexToInitAddress(resolvedAddress);

    return res.json({
      success: true,
      address: initAddress,
      hexAddress: resolvedAddress,
      username: `${username}.init`
    });
  } catch (err: any) {
    console.error("[nameservice] error:", err?.response?.data || err?.message || err);
    return res.status(502).json({
      success: false,
      error: "Could not reach Initia nameservice.",
      detail: err?.response?.data?.message || err?.message || "Unknown error",
    });
  }
});

export default router;
