#!/usr/bin/env bash
# ============================================================
#  IntentOS — Judge Quick-Start Script (macOS / Linux)
#  Run from the repo root: bash setup.sh
# ============================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

banner() {
  echo ""
  echo -e "${CYAN}${BOLD}  ██╗███╗   ██╗████████╗███████╗███╗   ██╗████████╗ ██████╗ ███████╗${RESET}"
  echo -e "${CYAN}${BOLD}  ██║████╗  ██║╚══██╔══╝██╔════╝████╗  ██║╚══██╔══╝██╔═══██╗██╔════╝${RESET}"
  echo -e "${CYAN}${BOLD}  ██║██╔██╗ ██║   ██║   █████╗  ██╔██╗ ██║   ██║   ██║   ██║███████╗${RESET}"
  echo -e "${CYAN}${BOLD}  ██║██║╚██╗██║   ██║   ██╔══╝  ██║╚██╗██║   ██║   ██║   ██║╚════██║${RESET}"
  echo -e "${CYAN}${BOLD}  ██║██║ ╚████║   ██║   ███████╗██║ ╚████║   ██║   ╚██████╔╝███████║${RESET}"
  echo -e "${CYAN}${BOLD}  ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚══════╝${RESET}"
  echo ""
  echo -e "  ${BOLD}AI Financial Operating System for DeFi — Built on Initia${RESET}"
  echo -e "  ${YELLOW}Easy Setup Script${RESET}"
  echo ""
}

step() { echo -e "\n${CYAN}▶ ${BOLD}$1${RESET}"; }
ok()   { echo -e "  ${GREEN}✔ $1${RESET}"; }
warn() { echo -e "  ${YELLOW}⚠ $1${RESET}"; }
err()  { echo -e "  ${RED}✖ $1${RESET}"; exit 1; }

banner

# ── 1. Check Node.js ─────────────────────────────────────────
step "Checking Node.js..."
if ! command -v node &> /dev/null; then
  err "Node.js is not installed. Please install Node.js v18+ from https://nodejs.org and re-run this script."
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  err "Node.js v18+ required. You have $(node -v). Please upgrade at https://nodejs.org"
fi
ok "Node.js $(node -v) detected"

# ── 2. Check npm ─────────────────────────────────────────────
if ! command -v npm &> /dev/null; then
  err "npm is not installed. It ships with Node.js — please reinstall Node.js from https://nodejs.org"
fi
ok "npm $(npm -v) detected"

# ── 3. Install all dependencies (npm workspaces) ──────────────
step "Installing all dependencies (this may take 1-2 minutes on first run)..."
npm install --legacy-peer-deps
ok "All packages installed"

# ── 4. Set up environment files ──────────────────────────────
step "Setting up environment files..."

if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  ok "Created backend/.env from example"
else
  warn "backend/.env already exists — skipping (keeping your config)"
fi

if [ ! -f "frontend/.env.local" ]; then
  cp frontend/.env.local.example frontend/.env.local
  ok "Created frontend/.env.local from example"
else
  warn "frontend/.env.local already exists — skipping (keeping your config)"
fi

# ── 5. Done — launch both servers ────────────────────────────
step "Starting IntentOS..."
echo ""
echo -e "  ${BOLD}Backend API  →  ${CYAN}http://localhost:4000${RESET}"
echo -e "  ${BOLD}Frontend app →  ${CYAN}http://localhost:3000${RESET}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop both servers.${RESET}"
echo ""

# Use root-level npm run dev which runs both via concurrently
npm run dev
