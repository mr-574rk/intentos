import "dotenv/config";
import express from "express";
import cors from "cors";

import intentRouter from "./routes/intent";
import strategyRouter from "./routes/strategy";
import simulateRouter from "./routes/simulate";
import executeRouter from "./routes/execute";
import historyRouter from "./routes/history";
import timelineRouter from "./routes/agentTimeline";
import lcdRouter from "./routes/lcd";
import portfolioRouter from "./routes/portfolio";
import recipientsRouter from "./routes/recipients";
import nameserviceRouter from "./routes/nameservice";

const app = express();
const PORT = process.env.PORT ?? 4000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health ───────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "IntentOS Backend",
    executionMode: process.env.EXECUTION_MODE ?? "mock",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use("/api/intent", intentRouter);
app.use("/api/strategy", strategyRouter);
app.use("/api/simulate", simulateRouter);
app.use("/api/execute", executeRouter);
app.use("/api/history", historyRouter);
app.use("/api/agent", timelineRouter);
app.use("/api/lcd", lcdRouter);
app.use("/api/portfolio", portfolioRouter);
app.use("/api/recipients", recipientsRouter);
app.use("/api/nameservice", nameserviceRouter);

console.log(`   Network: ${process.env.INITIA_NETWORK ?? "testnet"} (LCD: ${process.env.INITIA_REST ?? "https://lcd.testnet.initia.xyz"})\n`);

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 IntentOS Backend running on http://localhost:${PORT}`);
  console.log(`   Execution mode: ${process.env.EXECUTION_MODE ?? "mock"}\n`);
});

export default app;
