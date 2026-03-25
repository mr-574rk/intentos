import { Router } from "express";
import type { Request, Response } from "express";
import http from "http";

const router = Router();
const LCD_HOST = "localhost";
const LCD_PORT = 1317;

/**
 * GET /api/lcd/*
 * Transparent proxy to the local Minitia LCD (avoids browser CORS issues).
 */
router.get("/*", (req: Request, res: Response) => {
  const path = req.params[0] ? `/${req.params[0]}` : "/";
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const fullPath = path + query;

  const options = {
    hostname: LCD_HOST,
    port: LCD_PORT,
    path: fullPath,
    method: "GET",
    headers: { "Content-Type": "application/json" },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.statusCode = proxyRes.statusCode ?? 200;
    res.setHeader("Content-Type", "application/json");
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    res.status(503).json({ error: "LCD unavailable", detail: err.message });
  });

  proxyReq.end();
});

export default router;
