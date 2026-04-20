import { Router } from "express";
import type { Request, Response } from "express";
import { generateStrategyRemote, interpretIntentRemote } from "../coreClient";
import type { ApiResponse, StrategyBundle, StructuredIntent } from "../types";

const router = Router();

/**
 * POST /api/strategy/generate
 * Body: { text: string } OR { intent: StructuredIntent }
 * Returns: StrategyBundle
 */
router.post("/generate", async (req: Request, res: Response) => {
  const { text, intent } = req.body as { text?: string; intent?: StructuredIntent };

  let resolvedIntent: StructuredIntent;

  try {
    if (intent) {
      resolvedIntent = intent;
    } else if (text && typeof text === "string" && text.trim().length > 0) {
      resolvedIntent = await interpretIntentRemote(text.trim());
    } else {
      const response: ApiResponse<null> = {
        success: false,
        error: "Provide either `text` (raw intent) or `intent` (StructuredIntent) in the request body",
        timestamp: new Date().toISOString(),
      };
      return res.status(400).json(response);
    }

    const bundle = await generateStrategyRemote(resolvedIntent);
    const response: ApiResponse<StrategyBundle> = {
      success: true,
      data: bundle,
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
