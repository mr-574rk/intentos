@echo off
setlocal enabledelayedexpansion
:: ============================================================
::  IntentOS — Easy Quick-Start Script (Windows)
::  Run from the repo root: setup.bat
:: ============================================================

title IntentOS — Easy Setup

echo.
echo   ==========================================
echo    IntentOS — AI Financial OS for DeFi
echo    Built on Initia
echo    Easy Setup Script
echo   ==========================================
echo.

:: ── 1. Check Node.js ─────────────────────────────────────────
echo [1/4] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo   ERROR: Node.js is not installed.
    echo   Please download and install Node.js v18+ from:
    echo   https://nodejs.org/en/download
    echo.
    pause
    exit /b 1
)

for /f "tokens=1" %%v in ('node -v') do set NODE_VER=%%v
echo   OK: Node.js %NODE_VER% detected

:: Check version is >= 18
for /f "tokens=1 delims=v." %%a in ('node -v') do set MAJOR=%%a
if %MAJOR% LSS 18 (
    echo.
    echo   ERROR: Node.js v18+ is required. You have %NODE_VER%.
    echo   Please upgrade at https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: ── 2. Check npm ─────────────────────────────────────────────
where npm >nul 2>&1
if errorlevel 1 (
    echo   ERROR: npm not found. Reinstall Node.js from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=1" %%v in ('npm -v') do echo   OK: npm %%v detected

:: ── 3. Install all dependencies ──────────────────────────────
echo.
echo [2/4] Installing all dependencies (this may take 1-2 minutes)...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo   ERROR: npm install failed. Check the output above.
    pause
    exit /b 1
)
echo   OK: All packages installed

:: ── 4. Set up environment files ──────────────────────────────
echo.
echo [3/4] Setting up environment files...

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env" >nul
    echo   OK: Created backend\.env
) else (
    echo   SKIP: backend\.env already exists
)

if not exist "frontend\.env.local" (
    copy "frontend\.env.local.example" "frontend\.env.local" >nul
    echo   OK: Created frontend\.env.local
) else (
    echo   SKIP: frontend\.env.local already exists
)

:: ── 5. Launch both servers ────────────────────────────────────
echo.
echo [4/4] Starting IntentOS...
echo.
echo   Backend API  --^>  http://localhost:4000
echo   Frontend app --^>  http://localhost:3000
echo.
echo   Both servers are starting in this window.
echo   Open http://localhost:3000 in your browser.
echo   Press Ctrl+C to stop.
echo.

call npm run dev
