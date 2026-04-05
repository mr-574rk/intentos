import { Router } from "express";
import type { Request, Response } from "express";
import type { ApiResponse } from "../../../types";

const router = Router();

const CORE_API = process.env.CORE_API_URL ?? "https://intentos-core.onrender.com";

router.post("/parse", async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: "Request body must include a non-empty `text` string",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }

  try {
    const coreRes = await fetch(`${CORE_API}/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    const data = await coreRes.json() as Record<string, unknown>;

    if (!coreRes.ok) {
      return res.status(coreRes.status).json({
        success: false,
        error: (data["error"] as string | undefined) ?? "Core service error",
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>);
    }

    return res.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    } as ApiResponse<Record<string, unknown>>);
  } catch (_err) {
    return res.status(503).json({
      success: false,
      error: "Core service unavailable",
      timestamp: new Date().toISOString(),
    } as ApiResponse<null>);
  }
});

export default router;
