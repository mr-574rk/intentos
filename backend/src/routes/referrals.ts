import { Router } from "express";
import type { Request, Response } from "express";
import {
  recordReferral,
  getReferralsByReferrer,
  getReferrerOf,
  calcTier,
} from "../db/referralRepo";

const router = Router();

/**
 * GET /api/referrals/:address
 * Returns referral stats + current tier for a wallet address.
 */
router.get("/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!address || !address.startsWith("init1")) {
    res.status(400).json({ success: false, error: "Invalid wallet address" });
    return;
  }
  try {
    const referrals = await getReferralsByReferrer(address);
    const tier = calcTier(referrals.length);
    res.json({
      success: true,
      data: {
        address,
        inviteCount: referrals.length,
        referees: referrals.map((r) => ({
          address: r.refereeAddress,
          joinedAt: r.createdAt,
        })),
        tier,
        referralLink: `/app/onboarding?ref=${encodeURIComponent(address)}`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * POST /api/referrals/record
 * Body: { referrerAddress: string; refereeAddress: string }
 * Called by the onboarding flow when a new user executes their first strategy
 * after arriving via a referral link.
 */
router.post("/record", async (req: Request, res: Response) => {
  const { referrerAddress, refereeAddress } = req.body as {
    referrerAddress?: string;
    refereeAddress?: string;
  };

  if (
    !referrerAddress ||
    !refereeAddress ||
    !referrerAddress.startsWith("init1") ||
    !refereeAddress.startsWith("init1")
  ) {
    res.status(400).json({ success: false, error: "Both referrerAddress and refereeAddress must be valid init1 addresses" });
    return;
  }

  if (referrerAddress === refereeAddress) {
    res.status(400).json({ success: false, error: "Cannot refer yourself" });
    return;
  }

  try {
    await recordReferral(referrerAddress, refereeAddress);
    const referrals = await getReferralsByReferrer(referrerAddress);
    const tier = calcTier(referrals.length);
    res.json({
      success: true,
      data: {
        recorded: true,
        referrerNewTier: tier,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

/**
 * GET /api/referrals/referrer-of/:address
 * Returns who referred a given address, if anyone.
 */
router.get("/referrer-of/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  try {
    const referrer = await getReferrerOf(address);
    res.json({ success: true, data: { referrer } });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

export default router;
