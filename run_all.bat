@echo off
title NeuroVoice BCI Launcher
echo ==========================================================
echo Starting NeuroVoice BCI (Backend + Frontend)
echo ==========================================================

start "NeuroVoice BCI Backend" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0run_backend.ps1"
timeout /t 3 /nobreak >nul
start "NeuroVoice BCI Frontend" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0run_frontend.ps1"

echo.
echo Servers are launching:
echo  - Backend API: http://localhost:8000/docs
echo  - Frontend UI: http://localhost:5173
echo.
