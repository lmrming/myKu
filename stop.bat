@echo off
chcp 65001 >nul 2>&1

title myku - Stop All Services

echo.
echo   ============================================
echo   =       myku - Stop All Services          =
echo   ============================================
echo.

echo   [1/3] Stopping Redis (Docker)...
docker compose -f docker-compose.redis.yml down 2>nul
if %ERRORLEVEL% EQU 0 (
    echo   [OK] Redis stopped
) else (
    echo   [WARN] Redis container may not be running or Docker not available
)

echo.
echo   [2/3] Stopping Node processes on ports 3001, 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 :3002" ^| findstr "LISTENING"') do (
    taskkill /pid %%a /f >nul 2>&1
)
echo   [OK] Frontend/Backend processes cleaned

echo.
echo   [3/3] Cleaning up residual node processes...
taskkill /fi "WINDOWTITLE eq myku*" /f >nul 2>&1

echo.
echo   ----------------------------------------------
echo   [OK] All services have been stopped
echo.
pause
