@echo off
title Quantum Green Fleet Launcher
echo =================================================
echo        Quantum Green Fleet Launcher
echo =================================================

start "Quantum Fleet Backend" powershell -NoExit -Command "$env:PYTHONUTF8=1; cd '%~dp0backend'; C:\Users\GANESH\AppData\Local\Python\pythoncore-3.14-64\python.exe -m uvicorn app.main:app --reload --port 8000"
start "Quantum Fleet Frontend" powershell -NoExit -Command "cd '%~dp0frontend'; npm run dev"

echo Backend launching on http://localhost:8000
echo Frontend launching on http://localhost:5173
echo.
pause
