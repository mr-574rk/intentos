# IntentOS — API Reference

Base URL: `http://localhost:4000`

All responses are wrapped in:
```json
{ "success": true, "data": {...}, "timestamp": "ISO8601" }
```

---

## Health

### `GET /health`
Returns service status.

**Response:**
```json
{ "status": "ok", "service": "IntentOS Backend", "executionMode": "mock", "timestamp": "..." }
```

---

## Intent

### `POST /api/intent/parse`
Parse raw natural language into a structured intent.

**Body:**
```json
{ "text": "Earn stable yield with low risk" }
```

**Response:**
```json
{
  "goal": "yield",
  "riskTolerance": "low",
  "timeHorizon": "medium",
  "assets": ["INIT"],
  "rawText": "Earn stable yield with low risk"
}
```

---

## Strategy

### `POST /api/strategy/generate`
Generate a strategy bundle from text or pre-parsed intent.

**Body (option A):** `{ "text": "..." }`  
**Body (option B):** `{ "intent": { ...StructuredIntent } }`

**Response:** `StrategyBundle`
```json
{
  "id": "uuid",
  "steps": [
    { "index": 1, "action": "swap", "from": "INIT", "to": "USDC", "description": "..." }
  ],
  "estimatedYield": 12,
  "riskScore": "low",
  "riskScoreNumeric": 3,
  "explanation": "Why this strategy...",
  "createdAt": "..."
}
```

---

## Simulation

### `POST /api/simulate`
Simulate a strategy bundle. Returns projected outcome before execution.

**Body:** `{ "bundle": { ...StrategyBundle } }`

**Response:** `SimulationResult`
```json
{
  "bundleId": "uuid",
  "portfolioAllocation": { "Staking": 60, "USDC LP": 40 },
  "projectedAPY": 12,
  "riskScore": "low",
  "riskScoreNumeric": 3,
  "explanation": "Risk score 3/10 — within safe threshold.",
  "passed": true,
  "warnings": []
}
```

---

## Execute

### `POST /api/execute/intent`
**Full pipeline in one call:** parse intent → generate → simulate → return strategy for review.

**Body:** `{ "text": "Earn stable yield with low risk" }`

**Response:** `Strategy` (state: `SIMULATED`)
```json
{
  "id": "uuid",
  "intent": { ...StructuredIntent },
  "bundle": { ...StrategyBundle },
  "simulation": { ...SimulationResult },
  "state": "SIMULATED",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### `POST /api/execute/:strategyId`
Execute an approved strategy by ID. Requires the strategy to be in `SIMULATED` state and to have passed simulation.

**Body:** `{ "sessionKey": "interwovenkit_session_key" }` *(empty string for mock mode)*

**Response:** `ExecutionResult`
```json
{
  "strategyId": "uuid",
  "status": "success",
  "txHash": "mock_tx_abc123",
  "txHashes": ["mock_tx_step1_...", "mock_tx_step2_..."],
  "result": "3 steps completed",
  "mode": "mock",
  "executedAt": "..."
}
```

**Error (guard blocked):**
```json
{ "success": false, "error": "Execution blocked: Risk score 9/10 exceeds maximum 7/10" }
```

---

## History

### `GET /api/history`
Returns all completed and failed strategies.

**Response:** `HistoryEntry[]`
```json
[
  {
    "id": "uuid",
    "intentText": "Earn stable yield",
    "bundle": { ... },
    "simulation": { ... },
    "result": { ... },
    "performance": "+2.8%",
    "createdAt": "..."
  }
]
```

---

## Agent Timeline

### `GET /api/agent/timeline/:strategyId`
Returns the live agent pipeline timeline for a strategy.

**Response:** `AgentTimeline`
```json
{
  "strategyId": "uuid",
  "steps": [
    { "id": "intent_parsed",       "label": "Intent Parsed",       "status": "complete", "timestamp": "..." },
    { "id": "strategy_generated",  "label": "Strategy Generated",  "status": "complete", "timestamp": "..." },
    { "id": "simulation_complete", "label": "Simulation Complete", "status": "complete", "timestamp": "..." },
    { "id": "bundle_prepared",     "label": "Bundle Prepared",     "status": "complete", "timestamp": "..." },
    { "id": "execution_ready",     "label": "Execution Ready",     "status": "active" }
  ],
  "currentStepIndex": 4,
  "overall": "running",
  "startedAt": "..."
}
```

Step statuses: `pending` | `active` | `complete` | `failed`

### `GET /api/agent/timeline`
Returns all timelines (all strategies).

---

## Error Format

All errors return:
```json
{ "success": false, "error": "Human readable error message", "timestamp": "..." }
```

| Code | Cause |
|---|---|
| 400 | Missing or invalid request body |
| 404 | Strategy or timeline not found |
| 500 | Internal pipeline error |
