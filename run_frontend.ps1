# Start Vite React Frontend for NeuroVoice BCI
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting NeuroVoice BCI Frontend on http://localhost:5173" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location "$PSScriptRoot\frontend"
npm run dev
