@echo off
title NeuroVoice BCI Desktop Application Launcher
color 0b

echo =====================================================================
echo       NEUROVOICE BCI - PARALYZED PATIENT SPEECH SYNTHESIZER
echo                     Desktop Application Mode
echo =====================================================================
echo.

:: 1. Check if backend port 8000 is running
echo [1/3] Checking FastAPI Neural Decoding Backend (Port 8000)...
netstat -ano | findstr :8000 >nul
if %errorlevel% neq 0 (
    echo     Starting backend server in background...
    start /min "NeuroVoice Backend" "D:\EEG_Imagined_Speech\EEG_Imagined_Speech\.venv\Scripts\python.exe" -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
    timeout /t 3 /nobreak >nul
) else (
    echo     Backend server is already running and ready.
)

:: 2. Check if frontend port 5173 is running
echo [2/3] Checking Desktop Frontend Server (Port 5173)...
netstat -ano | findstr :5173 >nul
if %errorlevel% neq 0 (
    echo     Starting frontend interface...
    cd /d "D:\EEG-Based-Imagined-Speech-Communication-System-main\frontend"
    start /min "NeuroVoice UI" cmd /c "npm run dev"
    timeout /t 3 /nobreak >nul
) else (
    echo     Frontend server is active.
)

:: 3. Launch Standalone Native App Window
echo [3/3] Launching NeuroVoice Standalone Desktop App...
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=http://localhost:5173 --window-size=1366,880
) else if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173 --window-size=1366,880
) else (
    start http://localhost:5173
)

echo.
echo =====================================================================
echo App successfully launched in standalone desktop window!
echo You can minimize or close this launcher window.
echo =====================================================================
timeout /t 4 >nul
exit
