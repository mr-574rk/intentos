import { Router } from "express";
import type { Request, Response } from "express";
import { saveRecipient, getRecipients } from "../db/recipientsRepo";

const router = Router();

/**
 * Validate that the X-Wallet-Owner header is present and matches a given address.
 *
 * Security (Finding #4):
 * The X-Wallet-Owner header provides an interim ownership gate while a full
 * signed-challenge auth flow is implemented. It prevents naive cross-wallet
 * access where a caller simply supplies a different wallet address in the body/params.
 *
 * @returns true if header is present, valid, and matches; false otherwise.
 */
function validateWalletOwnerHeader(req: Request, expectedAddress: string): boolean {
  const header = req.headers["x-wallet-owner"] as string | undefined;
  if (!header) return false;
  if (!header.startsWith("init1")) return false;
  if (header !== expectedAddress) return false;
  return true;
}

/**
 * POST /api/recipients
 * Body: { walletOwner: string; name: string; address: string }
 * Headers: X-Wallet-Owner: <walletOwner>
 *
 * Saves or updates a recipient for a wallet.
 *
 * Security (Finding #4):
 *  - X-Wallet-Owner header must be present and match body.walletOwner.
 *  - Missing or mismatched header → 401 Unauthorized.
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

  // Owner header validation — prevents cross-wallet recipient injection
  if (!validateWalletOwnerHeader(req, walletOwner)) {
    return res.status(401).json({
      success: false,
      error: "X-Wallet-Owner header is missing or does not match walletOwner. " +
             "You can only add recipients to your own address book.",
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
 * Headers: X-Wallet-Owner: <walletOwner>
 *
 * Returns the 20 most recent recipients for a wallet address.
 *
 * Security (Finding #4):
 *  - X-Wallet-Owner header must be present and match :walletOwner path param.
 *  - Missing or mismatched header → 403 Forbidden.
 */
router.get("/:walletOwner", async (req: Request, res: Response) => {
  const { walletOwner } = req.params;

  if (!walletOwner || !walletOwner.startsWith("init1")) {
    return res.status(400).json({ success: false, error: "Invalid wallet address." });
  }

  // Owner header validation — prevents cross-wallet address-book reads
  if (!validateWalletOwnerHeader(req, walletOwner)) {
    return res.status(403).json({
      success: false,
      error: "X-Wallet-Owner header is missing or does not match the requested wallet. " +
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
