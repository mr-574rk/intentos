import { Router } from "express";
import type { Request, Response } from "express";
import { interpretIntent } from "../../../ai-engine/src/intentInterpreter";
import type { ApiResponse, StructuredIntent } from "../../../types";

const router = Router();

/**
 * POST /api/intent/parse
 * Body: { text: string }
 * Returns: StructuredIntent
 */
router.post("/parse", (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    const response: ApiResponse<null> = {
      success: false,
      error: "Request body must include a non-empty `text` string",
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(response);
  }

  const intent = interpretIntent(text.trim());

  const response: ApiResponse<StructuredIntent> = {
    success: true,
    data: intent,
    timestamp: new Date().toISOString(),
  };

  return res.json(response);
});

export default router;
