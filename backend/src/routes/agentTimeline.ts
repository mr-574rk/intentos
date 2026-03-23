import { Router } from "express";
import type { Request, Response } from "express";
import {
  getTimeline,
  getAllStrategies,
} from "../../../agent-orchestrator/src/strategyLifecycle";
import type { ApiResponse, AgentTimeline } from "../../../types";

const router = Router();

/**
 * GET /api/agent/timeline/:strategyId
 * Returns the agent timeline for a specific strategy.
 */
router.get("/timeline/:strategyId", (req: Request, res: Response) => {
  const { strategyId } = req.params;
  const timeline = getTimeline(strategyId);

  if (!timeline) {
    return res.status(404).json({
      success: false,
      error: `Timeline not found for strategy ${strategyId}`,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  return res.json({
    success: true,
    data: timeline,
    timestamp: new Date().toISOString(),
  } as ApiResponse<AgentTimeline>);
});

/**
 * GET /api/agent/timeline
 * Returns timelines for all strategies (useful for dashboard).
 */
router.get("/timeline", (_req: Request, res: Response) => {
  const strategies = getAllStrategies();
  const timelines = strategies
    .map((s) => getTimeline(s.id))
    .filter(Boolean) as AgentTimeline[];

  return res.json({
    success: true,
    data: timelines,
    timestamp: new Date().toISOString(),
  } as ApiResponse<AgentTimeline[]>);
});

export default router;
