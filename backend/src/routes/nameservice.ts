import { Router } from "express";
import type { Request, Response } from "express";
import { RESTClient, bcs } from "@initia/initia.js";
import { NETWORK_CONFIG } from "../../../config/networkConfig";

const router = Router();
const restClient = new RESTClient(NETWORK_CONFIG.lcd);

// Module address for testnet usernames contract
const MODULE_ADDRESS = "0x42cd8467b1c86e59bf319e5664a09b6b5840bb3fac64f5ce690b5041c530565a";

/**
 * GET /api/nameservice/resolve/:username
 *
 * Resolves an Initia username to an address by triggering a view function on the Move VM.
 */
router.get("/resolve/:username", async (req: Request, res: Response) => {
  const raw = req.params.username ?? "";
  // Ensure we strip trailing .init and leading @
  const username = raw.replace(/^@/, "").replace(/\.init$/, "").toLowerCase().trim();

  if (!username) {
    return res.status(400).json({ success: false, error: "Invalid username." });
  }

  console.log(`[nameservice] Resolving "${username}.init" on ${NETWORK_CONFIG.network} via Move VM`);
  
  try {
    const result = await restClient.move.view(
      MODULE_ADDRESS,
      "usernames",
      "get_address_from_name",
      [],
      [bcs.string().serialize(username).toBase64()]
    );

    // Option<address> parsing
    let resolvedAddress: string | null = null;
    if (Array.isArray(result) && result.length > 0) {
      const opt = result[0];
      if (opt?.vec && Array.isArray(opt.vec) && opt.vec.length > 0) {
        resolvedAddress = opt.vec[0];
      }
    }

    if (!resolvedAddress || (!resolvedAddress.startsWith("init1") && !resolvedAddress.startsWith("0x"))) {
      return res.status(404).json({
        success: false,
        error: "Username not found",
        detail: `The name "${username}.init" is not registered.`,
      });
    }

    return res.json({ success: true, address: resolvedAddress, username: `${username}.init` });
  } catch (err: any) {
    console.error("[nameservice] proxy error:", err?.response?.data || err?.message || err);
    return res.status(502).json({
      success: false,
      error: "Could not reach or resolve Initia nameservice.",
      detail: err?.response?.data?.message || err?.message || "Unknown proxy error",
    });
  }
});

export default router;
