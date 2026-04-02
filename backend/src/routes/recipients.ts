import { Router } from "express";
import type { Request, Response } from "express";
import { saveRecipient, getRecipients } from "../db/recipientsRepo";

const router = Router();

/**
 * POST /api/recipients
 * Body: { walletOwner: string; name: string; address: string }
 * Saves or updates a recipient for a wallet.
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
 * Returns the 20 most recent recipients for a wallet address.
 */
router.get("/:walletOwner", async (req: Request, res: Response) => {
  const { walletOwner } = req.params;

  if (!walletOwner || !walletOwner.startsWith("init1")) {
    return res.status(400).json({ success: false, error: "Invalid wallet address." });
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
