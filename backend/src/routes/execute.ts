import { Router } from "express";
import type { Request, Response } from "express";
import { processIntent, executeStrategy } from "../../../agent-orchestrator/src/agentController";
import type { ApiResponse, Strategy, ExecutionResult } from "../../../types";

const router = Router();

/**
 * POST /api/execute/intent
 * Body: { text: string }
 * Runs full AI pipeline → returns strategy for user review (SIMULATED state)
 */
router.post("/intent", async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Provide a non-empty `text` field",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  try {
    const strategy = await processIntent(text.trim());
    return res.json({
      success: true,
      data: strategy,
      timestamp: new Date().toISOString(),
    } as ApiResponse<Strategy>);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

/**
 * POST /api/execute/:strategyId
 * Executes an approved strategy by ID.
 */
router.post("/:strategyId", async (req: Request, res: Response) => {
  const { strategyId } = req.params;
  const { sessionKey } = req.body as { sessionKey?: string };

  try {
    const result = await executeStrategy(strategyId);
    return res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as ApiResponse<ExecutionResult>);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  void sessionKey;
});

export default router;
