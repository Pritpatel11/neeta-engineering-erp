@echo off
setlocal
title Neeta Engineering ERP - Desktop Launcher
cd /d "%~dp0"

echo ======================================================================
echo             NEETA ENGINEERING ERP - DESKTOP APPLICATION
echo ======================================================================
echo.

:: Check MongoDB Service
echo [*] Checking MongoDB Service...
sc query "MongoDB" 2>nul | find "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    net start MongoDB >nul 2>&1
)

:: Free up ports 5000 and 5173
echo [*] Cleaning up any previous processes on ports 5000 and 5173...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: Start Electron dev environment
echo [*] Launching Electron Desktop Window...
start "ERP-Electron-App" cmd /k "title ERP-Electron-App && cd /d "%~dp0erp-suite" && npm run electron:dev"

echo.
echo ======================================================================
echo [OK] Electron Desktop App starting...
echo You can run stop.bat at any time to cleanly stop all servers.
echo ======================================================================
timeout /t 3 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 4 >nul
