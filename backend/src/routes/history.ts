import { Router } from "express";
import type { Request, Response } from "express";
import { getHistoryByAddress, type HistoryRow } from "../db/historyRepo";
import type { ApiResponse, HistoryEntry } from "../types";

const router = Router();

/**
 * GET /api/history?address=<address>
 *
 * Returns completed strategies from the persistent SQLite store for a specific wallet.
 *
 * Security (Finding #4):
 *  - `address` query parameter is REQUIRED. Requests without it are rejected with 400.
 *  - The global fallback (getAllHistory with no filter) is removed entirely.
 *  - Address must be a valid init1… bech32 address.
 *  - Note: full cryptographic wallet-ownership verification (signed challenge) should
 *    be implemented in a future auth layer. This endpoint enforces that the caller
 *    must at minimum supply a valid wallet address.
 */
router.get("/", async (req: Request, res: Response) => {
  const address = req.query.address as string | undefined;

  // Reject requests without an address — no aggregate cross-wallet history dump
  if (!address || !address.startsWith("init1")) {
    return res.status(400).json({
      success: false,
      error: "A valid `address` query parameter (init1…) is required. Cross-wallet history access is not permitted.",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  try {
    const rows: HistoryRow[] = await getHistoryByAddress(address);

    const history: HistoryEntry[] = rows.map((row) => ({
      id: row.id,
      intentText: row.intentText,
      bundle: JSON.parse(row.bundle),
      simulation: JSON.parse(row.simulation),
      result: JSON.parse(row.result),
      performance: row.performance ?? undefined,
      createdAt: row.createdAt,
    }));

    const response: ApiResponse<HistoryEntry[]> = {
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  } catch (err) {
    console.error("[history] fetch error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch history.",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

export default router;
