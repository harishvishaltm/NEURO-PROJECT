@echo off
title NeuroVoice BCI - Public Deployment Launcher
color 0b

echo =====================================================================
echo       NEUROVOICE BCI - PUBLIC LIVE DEPLOYMENT LAUNCHER
echo =====================================================================
echo.

:: 1. Start Backend if not running
echo [1/3] Checking Backend (Port 8000)...
netstat -ano | findstr :8000 >nul
if %errorlevel% neq 0 (
    echo     Starting backend server...
    start /min "NeuroVoice Backend" "D:\EEG_Imagined_Speech\EEG_Imagined_Speech\.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
    timeout /t 4 /nobreak >nul
) else (
    echo     Backend server is running.
)

:: 2. Start Frontend if not running
echo [2/3] Checking Frontend (Port 5173)...
netstat -ano | findstr :5173 >nul
if %errorlevel% neq 0 (
    echo     Starting frontend interface...
    cd /d "%~dp0frontend"
    start /min "NeuroVoice UI" cmd /c "npm run dev"
    timeout /t 4 /nobreak >nul
) else (
    echo     Frontend server is active.
)

:: 3. Launch Cloudflare Tunnel
echo [3/3] Publishing live public URL via Cloudflare Tunnel...
echo.
echo =====================================================================
echo   Keep this window open to maintain the live public website link.
echo   Share the URL below with your vendor or evaluators.
echo =====================================================================
echo.
"%~dp0bin\cloudflared.exe" tunnel --url http://localhost:5173
pause
