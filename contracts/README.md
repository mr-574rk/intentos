# IntentOS Smart Contracts

Initia Move smart contracts for strategy execution and session-based permission management.

## Contracts

### StrategyExecutor.move

Executes DeFi strategy bundles forwarded by the IntentOS execution engine.

**Key functions:**
- `execute_bundle(...)` — Runs a multi-step strategy; validates risk score ≤ 7 and bundle size ≤ 10
- `cancel_strategy(...)` — Emergency stop for in-flight strategies
- `max_bundle_size()` — View: returns maximum allowed steps

**Safety checks:**
- Risk score must be ≤ 7 (enforced on-chain)
- Bundle size capped at 10 steps
- Executor address logged for each execution

### PermissionManager.move

Manages session-based execution permissions for InterwovenKit.

**Key functions:**
- `register_session(...)` — Registers a session key after user wallet approval
- `revoke_session(...)` — User can revoke permission at any time
- `is_session_active(addr)` — View: checks if a session is active
- `get_session_strategy(addr)` — View: returns the strategy ID locked to the session

## Deployment

```bash
# Compile (requires Initia Move CLI)
initia move compile

# Deploy to testnet
initia move publish --profile testnet
```

Update `config/initiaConfig.ts` with deployed contract addresses.

## Status

| Contract | Status |
|---|---|
| StrategyExecutor | Scaffold — wire DeFi protocol calls |
| PermissionManager | Scaffold — wire InterwovenKit session keys |
