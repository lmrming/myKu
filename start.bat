@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion
set "NODE_OPTIONS=--experimental-vm-modules"

title myku - Dev Server

echo.
echo   ============================================
echo   =          myku - Dev Environment         =
echo   ============================================
echo.
echo   [Flow] Redis -^> Frontend(Vite) -^> Backend(Express)
echo   [Stop] Press Ctrl+C to stop all services
echo.

node dev-start.js %*

if !ERRORLEVEL! NEQ 0 (
    echo.
    echo   [ERROR] Startup failed. Check error messages above.
    echo.
    pause
)
