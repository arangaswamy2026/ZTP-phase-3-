@echo off
title ZTP Design 2.98 — Dev Server
cd /d "%~dp0"

echo.
echo  SonicWall ZTP Design 2.98
echo  -------------------------
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERROR: Node.js is not installed.
  echo  Download it from https://nodejs.org  ^(LTS version^)
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  Installing dependencies ^(first run only^)...
  echo.
  npm install
  echo.
)

echo  Starting dev server...
echo  Open http://localhost:5177/ZTP-phase-3-/ in your browser.
echo  Press Ctrl+C to stop.
echo.
npm run dev
pause
