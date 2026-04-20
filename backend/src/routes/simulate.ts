import { Router } from "express";
import type { Request, Response } from "express";
import { simulateStrategyRemote } from "../coreClient";
import type { ApiResponse, SimulationResult, StrategyBundle } from "../types";

const router = Router();

/**
 * POST /api/simulate
 * Body: { bundle: StrategyBundle }
 * Returns: SimulationResult
 */
router.post("/", async (req: Request, res: Response) => {
  const { bundle } = req.body as { bundle?: StrategyBundle };

  if (!bundle || !bundle.id || !Array.isArray(bundle.steps)) {
    const response: ApiResponse<null> = {
      success: false,
      error: "Request body must include a valid `bundle` (StrategyBundle)",
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(response);
  }

  try {
    const simulation = await simulateStrategyRemote(bundle);
    const response: ApiResponse<SimulationResult> = {
      success: true,
      data: simulation,
      timestamp: new Date().toISOString(),
    };
    return res.json(response);
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: (err as Error).message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

export default router;
