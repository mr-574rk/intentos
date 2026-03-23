import { Router } from "express";
import type { Request, Response } from "express";
import { interpretIntent } from "../../../ai-engine/src/intentInterpreter";
import { generateStrategy } from "../../../ai-engine/src/strategyGenerator";
import type { ApiResponse, StrategyBundle, StructuredIntent } from "../../../types";

const router = Router();

/**
 * POST /api/strategy/generate
 * Body: { text: string } OR { intent: StructuredIntent }
 * Returns: StrategyBundle
 */
router.post("/generate", (req: Request, res: Response) => {
  const { text, intent } = req.body as { text?: string; intent?: StructuredIntent };

  let resolvedIntent: StructuredIntent;

  if (intent) {
    resolvedIntent = intent;
  } else if (text && typeof text === "string" && text.trim().length > 0) {
    resolvedIntent = interpretIntent(text.trim());
  } else {
    const response: ApiResponse<null> = {
      success: false,
      error: "Provide either `text` (raw intent) or `intent` (StructuredIntent) in the request body",
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(response);
  }

  const bundle = generateStrategy(resolvedIntent);

  const response: ApiResponse<StrategyBundle> = {
    success: true,
    data: bundle,
    timestamp: new Date().toISOString(),
  };

  return res.json(response);
});

export default router;
