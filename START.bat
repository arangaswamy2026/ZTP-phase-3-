@echo off
title ZTP Phase 3 Prototype — 30 June
cd /d "%~dp0"

echo.
echo  ================================================
echo   SonicWall ZTP Phase 3 Prototype  ^|  30 June
echo  ================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERROR: Node.js is not installed.
  echo  Please download and install it from:
  echo    https://nodejs.org  ^(LTS version^)
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  Installing dependencies ^(first run only, ~1 min^)...
  echo.
  npm install
  echo.
)

echo  Starting prototype server...
echo.
echo  --^> Open this URL in your browser:
echo       http://localhost:5175/ZTP-phase-3-/
echo.
echo  Press Ctrl+C to stop the server.
echo.
npm run dev -- --port 5175
pause
