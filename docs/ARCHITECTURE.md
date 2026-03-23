# IntentOS — Architecture

## System Overview

IntentOS is structured as a layered monorepo. Each layer has a single responsibility and communicates through defined interfaces.

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                       │
│  / Landing · /app/intent · /app/strategy · /app/execute       │
│  /app/portfolio · /app/history                                │
│                                                               │
│  Components: WalletConnect · IntentInput · AgentTimeline      │
│              StrategyPreview · SimulationPanel · ExecuteButton │
│              PortfolioDashboard · StrategyHistory              │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP REST (JSON)
┌──────────────────────▼───────────────────────────────────────┐
│                   Backend (Express/Node.js)                    │
│                                                               │
│  POST /api/intent/parse      → AI Engine                      │
│  POST /api/strategy/generate → AI Engine                      │
│  POST /api/simulate          → Simulation Engine              │
│  POST /api/execute/intent    → Agent Orchestrator (Phase 1)   │
│  POST /api/execute/:id       → Agent Orchestrator (Phase 2)   │
│  GET  /api/history           → Strategy Lifecycle store       │
│  GET  /api/agent/timeline/:id → Strategy Lifecycle store      │
└──┬────────────┬──────────────┬───────────────┬───────────────┘
   │            │              │               │
┌──▼──┐     ┌──▼────┐     ┌───▼───┐       ┌───▼────────┐
│ AI  │     │ Sim.  │     │ Agent │       │ Execution  │
│Eng. │     │ Eng.  │     │ Orch. │       │ Engine     │
└──┬──┘     └───────┘     └───┬───┘       └─────┬──────┘
   │                           │                 │
   └───────────────────────────►─────────────────►
                                          Initia Contracts
                                          (Move / Testnet RPC)
```

## Module Descriptions

### `ai-engine/`
Rule-based (Phase 1) intent interpreter and strategy generator. LLM hook available in `intentInterpreter.ts`.

| File | Responsibility |
|---|---|
| `intentInterpreter.ts` | Raw text → `StructuredIntent` via keyword matching |
| `strategyGenerator.ts` | `StructuredIntent` → `StrategyBundle` via template map |
| `riskAnalyzer.ts` | Bundle → risk score + warnings |

### `simulation-engine/`
Simulates execution outcomes without touching the blockchain.

| File | Responsibility |
|---|---|
| `strategySimulator.ts` | Bundle → `SimulationResult` (allocation + APY + risk) |
| `yieldEstimator.ts` | Per-action APY calculation with pair multipliers |
| `riskScoring.ts` | Weighted risk factor scoring; returns pass/fail + warnings |

### `agent-orchestrator/`
Autonomous lifecycle coordinator.

| File | Responsibility |
|---|---|
| `agentController.ts` | Two-phase entry point: `processIntent` + `executeStrategy` |
| `intentWorkflow.ts` | Chains interpret → generate → simulate |
| `strategyLifecycle.ts` | In-memory strategy + timeline state store |
| `executionGuard.ts` | Pre-execution safety gate (5 checks) |

### `execution-engine/`
Builds and submits transaction bundles.

| File | Responsibility |
|---|---|
| `transactionBuilder.ts` | Bundle steps → Initia tx objects + gas estimates |
| `bundleExecutor.ts` | Routes to mock or testnet based on `EXECUTION_MODE` |
| `mockExecutor.ts` | Returns simulated tx results instantly |
| `initiaExecutor.ts` | Submits to Initia RPC via session key |

### `contracts/`
Initia Move smart contracts.

| Contract | Responsibility |
|---|---|
| `StrategyExecutor.move` | On-chain bundle execution with risk validation |
| `PermissionManager.move` | Session-based permission registration and revocation |

### `config/`
| File | Responsibility |
|---|---|
| `executionMode.ts` | Reads `EXECUTION_MODE` env var |
| `initiaConfig.ts` | RPC, chain ID, contract addresses |

### `types/`
Shared TypeScript types used across all backend packages. Frontend has a local copy at `frontend/types/index.ts`.

## Data Flow

### Phase 1 — Intent Processing
```
User Input (text)
  → POST /api/execute/intent
  → intentWorkflow.runIntentWorkflow()
      → intentInterpreter.interpretIntent()    → StructuredIntent
      → strategyGenerator.generateStrategy()   → StrategyBundle
      → strategySimulator.simulateStrategy()   → SimulationResult
  → strategyLifecycle.createStrategy()         → Strategy (SIMULATED)
  → strategyLifecycle.createTimeline()         → AgentTimeline
  ← Strategy returned to frontend
```

### Phase 2 — Execution
```
User clicks Execute
  → POST /api/execute/:strategyId
  → agentController.executeStrategy()
      → executionGuard.guardExecution()        → pass/fail
      → bundleExecutor.executeBundle()
          → transactionBuilder.buildTransactions()
          → mockExecutor.mockExecute() OR initiaExecutor.initiaExecute()
  → Strategy state → COMPLETE
  ← ExecutionResult returned to frontend
```

## Execution Modes

| Mode | Behavior |
|---|---|
| `mock` | Instant simulated responses. No wallet required. Default for demos. |
| `testnet` | Real Initia testnet transactions via session key. |

Set `EXECUTION_MODE` in `backend/.env`.
