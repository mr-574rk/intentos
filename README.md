# IntentOS

> AI-powered DeFi operating system on Initia — converts natural language financial goals into simulated and executable on-chain strategies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Built on Initia](https://img.shields.io/badge/Built%20on-Initia-blue)](https://initia.xyz)

---

## Overview

IntentOS introduces a new interaction model for DeFi on Initia. Instead of manually configuring transactions, users express their financial goals in plain English. The AI engine interprets the intent, the simulation engine previews outcomes, and the agent orchestrator autonomously executes the strategy on-chain — all after a single user approval.

```
User Intent → AI Interpreter → Strategy Generator → Simulation
           → User Approval → Agent Orchestrator → Execution Engine → Initia Contracts
```

---

## Features

| Feature | Description |
|---|---|
| **AI Intent Interpreter** | Convert natural language goals into structured DeFi strategies |
| **Strategy Simulation** | Preview asset allocation, projected APY, and risk score before execution |
| **Agent Orchestrator** | Autonomous lifecycle manager: PENDING → SIMULATED → APPROVED → EXECUTING → COMPLETE |
| **Transaction Bundles** | Multi-step on-chain strategies executed sequentially |
| **Dual Execution Mode** | `mock` for demos, `testnet` for real Initia execution |
| **Agent Timeline** | Live visual pipeline showing AI reasoning steps |
| **Portfolio Dashboard** | Unified view of assets, active strategies, and performance |
| **Strategy History** | Record of past strategies with outcome tracking |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
│  WalletConnect · IntentInput · AgentTimeline · Dashboard │
└────────────────────────┬────────────────────────────────┘
                         │ REST API
┌────────────────────────▼────────────────────────────────┐
│                  Backend (Express/Node.js)                │
│          intent · strategy · simulate · execute          │
└──┬─────────────┬───────────────┬────────────────┬───────┘
   │             │               │                │
┌──▼──┐     ┌───▼───┐     ┌─────▼────┐     ┌─────▼──────┐
│ AI  │     │ Sim   │     │  Agent   │     │ Execution  │
│Eng. │     │ Eng.  │     │  Orch.   │     │   Engine   │
└──┬──┘     └───────┘     └─────┬────┘     └─────┬──────┘
   │                             │                │
   └────────────────────────────►└────────────────►
                                              Initia Contracts
```

---

## Initia Integrations

### InterwovenKit
Uses `@initia/interwovenkit-react` for:
- Wallet connection
- Transaction signing
- Session key management for autonomous execution

### .init Usernames
Displays the user's Initia decentralized identity (e.g., `daniel.init`) after wallet connection.

### Session-based Execution
After strategy approval, the agent executes transaction bundles using session permissions — no repeated confirmations needed.

---

## Demo Flow

1. **Connect wallet** → `.init` username appears
2. **Enter intent** → `"Earn stable yield with low risk"`
3. **Agent Timeline animates** → 5 steps complete live
4. **Strategy Preview** → steps, estimated yield, risk score, AI explanation
5. **Simulation Panel** → projected APY, portfolio allocation breakdown
6. **Click Execute** → bundle submitted on-chain
7. **Portfolio Dashboard** → updated balances and strategy status
8. **Strategy History** → new entry with performance result

---

## Repository Structure

```
intentos/
├── frontend/             # Next.js 14 + TailwindCSS UI
├── backend/              # Express REST API (orchestration middleware)
├── ai-engine/            # Intent interpreter, strategy generator, risk analyzer
├── simulation-engine/    # Yield estimator, strategy simulator, risk scoring
├── agent-orchestrator/   # Lifecycle manager + execution guardrails
├── execution-engine/     # Transaction builder, mock + testnet executors
├── contracts/            # Initia Move smart contracts
├── config/               # Chain config + execution mode
├── types/                # Shared TypeScript types
├── docs/                 # Architecture and API docs
├── .initia/
│   └── submission.json   # Hackathon submission metadata
├── docker-compose.yml    # One-command local setup
├── package.json          # Monorepo root
└── LICENSE
```

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- Docker + Docker Compose (optional, recommended)

### Option A — Docker (Recommended for judges)

```bash
git clone https://github.com/intentos/intentos
cd intentos
docker-compose up
```

Opens:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### Option B — Manual

```bash
# Install all workspaces
npm install

# Start backend
cd backend && cp .env.example .env && npm run dev

# Start frontend (new terminal)
cd frontend && cp .env.local.example .env.local && npm run dev
```

### Environment Variables

**Backend** (`backend/.env`):
```env
PORT=4000
NODE_ENV=development
EXECUTION_MODE=mock          # mock | testnet
INITIA_RPC=https://rpc.testnet.initia.xyz
CHAIN_ID=initiation-2
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CHAIN_ID=initiation-2
NEXT_PUBLIC_EXECUTION_MODE=mock
```

---

## License

MIT © 2026 IntentOS
