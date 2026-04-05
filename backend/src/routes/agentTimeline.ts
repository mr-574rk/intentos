import { Router } from "express";
import type { Request, Response } from "express";
import {
  getTimelineForOwner,
  getStrategiesForOwner,
  getTimeline,
} from "../../../agent-orchestrator/src/strategyLifecycle";
import type { ApiResponse, AgentTimeline } from "../../../types";

const router = Router();

/**
 * GET /api/agent/timeline/:strategyId?wallet=<address>
 *
 * Returns the agent timeline for a specific strategy.
 *
 * Security (Finding #3):
 *  - `wallet` query parameter is required.
 *  - Timeline is only returned if the wallet owns the referenced strategy.
 *  - Mismatched or missing wallet → 403 Forbidden.
 */
router.get("/timeline/:strategyId", (req: Request, res: Response) => {
  const { strategyId } = req.params;
  const walletAddress = req.query.wallet as string | undefined;

  if (!walletAddress || !walletAddress.startsWith("init1")) {
    return res.status(400).json({
      success: false,
      error: "Missing or invalid `wallet` query parameter. A connected wallet address is required.",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  const timeline = getTimelineForOwner(strategyId, walletAddress);

  if (!timeline) {
    // Deliberately generic message — does not reveal whether strategy exists
    return res.status(403).json({
      success: false,
      error: `Timeline not found or access denied for strategy ${strategyId}.`,
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
 * GET /api/agent/timeline?wallet=<address>
 *
 * Returns timelines for all strategies owned by the requesting wallet.
 *
 * Security (Finding #3):
 *  - `wallet` query parameter is required.
 *  - Only strategies whose ownerAddress matches the wallet are returned.
 *  - The global (all-user) listing endpoint is removed to prevent cross-user enumeration.
 */
router.get("/timeline", (req: Request, res: Response) => {
  const walletAddress = req.query.wallet as string | undefined;

  if (!walletAddress || !walletAddress.startsWith("init1")) {
    return res.status(400).json({
      success: false,
      error: "Missing or invalid `wallet` query parameter. A connected wallet address is required.",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  const ownerStrategies = getStrategiesForOwner(walletAddress);
  const timelines = ownerStrategies
    .map(s => getTimeline(s.id))
    .filter(Boolean) as AgentTimeline[];

  return res.json({
    success: true,
    data: timelines,
    timestamp: new Date().toISOString(),
  } as ApiResponse<AgentTimeline[]>);
});

export default router;
