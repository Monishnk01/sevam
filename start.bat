@echo off
title Sevam AI Launcher
echo =================================================================
echo                    SEVAM AI - STARTUP SYSTEM
echo =================================================================
echo [System Check] Launching backend Express SQLite & AI Server...
echo =================================================================

:: Start backend in a new command window
start cmd /k "cd backend && echo [Backend] Starting Sevam Express API... && npm start"

echo [System Check] Launching frontend React-Vite & Tailwind Dashboard...
echo =================================================================

:: Start frontend in a new command window
start cmd /k "cd frontend && echo [Frontend] Starting Vite Dev Server... && npm run dev"

echo =================================================================
echo [OK] Both systems are initialized. 
echo - Backend API running at: http://localhost:5000
echo - Frontend Application running at: http://localhost:5173
echo =================================================================
pause
