import { Router } from "express";
import type { Request, Response } from "express";
import { simulateStrategy } from "../../../simulation-engine/src/strategySimulator";
import type { ApiResponse, SimulationResult, StrategyBundle } from "../../../types";

const router = Router();

/**
 * POST /api/simulate
 * Body: { bundle: StrategyBundle }
 * Returns: SimulationResult
 */
router.post("/", (req: Request, res: Response) => {
  const { bundle } = req.body as { bundle?: StrategyBundle };

  if (!bundle || !bundle.id || !Array.isArray(bundle.steps)) {
    const response: ApiResponse<null> = {
      success: false,
      error: "Request body must include a valid `bundle` (StrategyBundle)",
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(response);
  }

  const simulation = simulateStrategy(bundle);

  const response: ApiResponse<SimulationResult> = {
    success: true,
    data: simulation,
    timestamp: new Date().toISOString(),
  };

  return res.json(response);
});

export default router;
