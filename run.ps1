# Quantum Green Fleet - Quick Launcher
param (
    [string]$Service = "both"
)

Write-Host "=================================================" -ForegroundColor Green
Write-Host "       🌿 Quantum Green Fleet Launcher          " -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

$pythonExe = "C:\Users\GANESH\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}

if ($Service -eq "backend" -or $Service -eq "both") {
    Write-Host "[1/2] Starting FastAPI Backend on http://localhost:8000..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONUTF8=1; cd '$PSScriptRoot\backend'; & '$pythonExe' -m uvicorn app.main:app --reload --port 8000"
}

if ($Service -eq "frontend" -or $Service -eq "both") {
    Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"
}

Write-Host "`nServices started! Access the application at:" -ForegroundColor Yellow
Write-Host "  -> Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  -> Backend Docs: http://localhost:8000/docs`n" -ForegroundColor White
