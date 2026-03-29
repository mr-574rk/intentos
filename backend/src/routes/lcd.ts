import { Router } from "express";
import type { Request, Response } from "express";
import https from "https";

const router = Router();

// Public initiation-2 testnet REST endpoint
const LCD_BASE = "rest.testnet.initia.xyz";

/**
 * GET /api/lcd/*
 * Transparent CORS-safe proxy to the initiation-2 REST API.
 */
router.get("/*", (req: Request, res: Response) => {
  const path = req.params[0] ? `/${req.params[0]}` : "/";
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  const fullPath = path + query;

  const options = {
    hostname: LCD_BASE,
    port: 443,
    path: fullPath,
    method: "GET",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.statusCode = proxyRes.statusCode ?? 200;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    res.status(503).json({ error: "LCD unavailable", detail: err.message });
  });

  proxyReq.end();
});

export default router;
