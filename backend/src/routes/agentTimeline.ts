import { Router } from "express";
import type { Request, Response } from "express";
import { getTimelineRemote, getAllTimelinesRemote } from "../coreClient";
import type { ApiResponse, AgentTimeline } from "../../../types";

const router = Router();

/**
 * GET /api/agent/timeline/:strategyId?wallet=<address>
 */
router.get("/timeline/:strategyId", async (req: Request, res: Response) => {
  const { strategyId } = req.params;
  const walletAddress = req.query.wallet as string | undefined;

  if (!walletAddress || !walletAddress.startsWith("init1")) {
    return res.status(400).json({
      success: false,
      error: "Missing or invalid `wallet` query parameter. A connected wallet address is required.",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  try {
    const timeline = await getTimelineRemote(strategyId, walletAddress);
    if (!timeline) {
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
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

/**
 * GET /api/agent/timeline?wallet=<address>
 */
router.get("/timeline", async (req: Request, res: Response) => {
  const walletAddress = req.query.wallet as string | undefined;

  if (!walletAddress || !walletAddress.startsWith("init1")) {
    return res.status(400).json({
      success: false,
      error: "Missing or invalid `wallet` query parameter. A connected wallet address is required.",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  try {
    const timelines = await getAllTimelinesRemote(walletAddress);
    return res.json({
      success: true,
      data: timelines,
      timestamp: new Date().toISOString(),
    } as ApiResponse<AgentTimeline[]>);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

export default router;
