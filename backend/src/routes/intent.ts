import { Router } from "express";
import type { Request, Response } from "express";
import { interpretIntentRemote } from "../coreClient";
import type { ApiResponse, StructuredIntent } from "../../../types";

const router = Router();

/**
 * POST /api/intent/parse
 * Body: { text: string }
 * Returns: StructuredIntent
 */
router.post("/parse", async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    const response: ApiResponse<null> = {
      success: false,
      error: "Request body must include a non-empty `text` string",
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(response);
  }

  try {
    const intent = await interpretIntentRemote(text.trim());
    const response: ApiResponse<StructuredIntent> = {
      success: true,
      data: intent,
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