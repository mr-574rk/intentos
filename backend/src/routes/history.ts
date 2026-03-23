import { Router } from "express";
import type { Request, Response } from "express";
import { getAllStrategies } from "../../../agent-orchestrator/src/strategyLifecycle";
import type { ApiResponse, HistoryEntry } from "../../../types";

const router = Router();

/**
 * GET /api/history
 * Returns all completed strategies as history entries.
 */
router.get("/", (_req: Request, res: Response) => {
  const strategies = getAllStrategies().filter(
    (s) => s.state === "COMPLETE" || s.state === "FAILED"
  );

  const history: HistoryEntry[] = strategies.map((s) => ({
    id: s.id,
    intentText: s.intent.rawText,
    bundle: s.bundle,
    simulation: s.simulation!,
    result: s.executionResult!,
    performance: s.state === "COMPLETE"
      ? `+${(Math.random() * 5).toFixed(1)}%`  // mock performance; replace with real calculation
      : undefined,
    createdAt: s.createdAt,
  }));

  const response: ApiResponse<HistoryEntry[]> = {
    success: true,
    data: history,
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

export default router;
