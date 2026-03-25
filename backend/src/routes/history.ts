import { Router } from "express";
import type { Request, Response } from "express";
import { getAllHistory, type HistoryRow } from "../db/historyRepo";
import type { ApiResponse, HistoryEntry } from "../../../types";

const router = Router();

/**
 * GET /api/history
 * Returns all completed strategies from the persistent SQLite store.
 */
router.get("/", (_req: Request, res: Response) => {
  const rows: HistoryRow[] = getAllHistory();

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
});

export default router;

