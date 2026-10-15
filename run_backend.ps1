# Start FastAPI Backend for EEG-Based Imagined Speech Communication System
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting NeuroVoice BCI Backend on http://localhost:8000 " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Set-Location $PSScriptRoot
$PythonExe = "D:\EEG_Imagined_Speech\EEG_Imagined_Speech\.venv\Scripts\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "python"
}

& $PythonExe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
