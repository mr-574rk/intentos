import { Router } from "express";
import type { Request, Response } from "express";
import { saveRecipient, getRecipients } from "../db/recipientsRepo";
import { verifyToken } from "../auth/walletToken";

const router = Router();

/**
 * Extract and verify the bearer token from the Authorization header.
 * Returns the wallet address bound to the token if valid, or null otherwise.
 *
 * Security (CWE-639 remediation):
 *  - Tokens are issued server-side by POST /api/execute/intent.
 *  - They are cryptographically random (256-bit hex), stored only on the server,
 *    and expire after 15 minutes.
 *  - Unlike the previous X-Wallet-Owner header, tokens CANNOT be forged by an
 *    attacker who merely knows the victim's wallet address; the attacker would
 *    also need to steal the 256-bit random token.
 */
function extractBearerWallet(req: Request): string | null {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return verifyToken(token);
}

/**
 * POST /api/recipients
 * Body: { walletOwner: string; name: string; address: string }
 * Headers: Authorization: Bearer <walletToken>
 *
 * Saves or updates a recipient for a wallet.
 *
 * Security:
 *  - Bearer token must be present, valid, and issued for the same walletOwner.
 *  - Missing, expired, or mismatched token → 401 Unauthorized.
 */
router.post("/", async (req: Request, res: Response) => {
  const { walletOwner, name, address } = req.body as {
    walletOwner?: string;
    name?: string;
    address?: string;
  };

  if (
    !walletOwner || !walletOwner.startsWith("init1") ||
    !name || typeof name !== "string" ||
    !address || !address.startsWith("init1")
  ) {
    return res.status(400).json({
      success: false,
      error: "walletOwner, name, and address are required and must be valid Initia addresses.",
    });
  }

  // Bearer token verification — the token is server-issued and cryptographically random.
  // Verifying it server-side ensures the caller actually owns `walletOwner`.
  const tokenWallet = extractBearerWallet(req);
  if (!tokenWallet || tokenWallet !== walletOwner) {
    return res.status(401).json({
      success: false,
      error: "Missing or invalid Authorization token. " +
             "Obtain a token via POST /api/execute/intent with your wallet address.",
    });
  }

  try {
    await saveRecipient(walletOwner.trim(), name.trim(), address.trim());
    return res.json({ success: true });
  } catch (err) {
    console.error("[recipients] save error:", err);
    return res.status(500).json({ success: false, error: "Failed to save recipient." });
  }
});

/**
 * GET /api/recipients/:walletOwner
 * Headers: Authorization: Bearer <walletToken>
 *
 * Returns the 20 most recent recipients for a wallet address.
 *
 * Security:
 *  - Bearer token must be present, valid, and issued for the requested walletOwner.
 *  - Missing, expired, or mismatched token → 403 Forbidden.
 */
router.get("/:walletOwner", async (req: Request, res: Response) => {
  const { walletOwner } = req.params;

  if (!walletOwner || !walletOwner.startsWith("init1")) {
    return res.status(400).json({ success: false, error: "Invalid wallet address." });
  }

  // Bearer token verification — prevents cross-wallet address-book reads
  const tokenWallet = extractBearerWallet(req);
  if (!tokenWallet || tokenWallet !== walletOwner) {
    return res.status(403).json({
      success: false,
      error: "Missing or invalid Authorization token. " +
             "You can only read your own address book.",
    });
  }

  try {
    const recipients = await getRecipients(walletOwner);
    return res.json({ success: true, data: recipients });
  } catch (err) {
    console.error("[recipients] fetch error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch recipients." });
  }
});

export default router;
