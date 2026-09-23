@echo off
setlocal
title Neeta Engineering ERP - Web Launcher
cd /d "%~dp0"

echo ======================================================================
echo             NEETA ENGINEERING ERP - WEB APPLICATION
echo ======================================================================
echo.

:: Check MongoDB Service
echo [*] Checking MongoDB Service...
sc query "MongoDB" 2>nul | find "RUNNING" >nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] MongoDB is not running. Attempting to start...
    net start MongoDB >nul 2>&1
    sc query "MongoDB" 2>nul | find "RUNNING" >nul
    if %ERRORLEVEL% NEQ 0 (
        echo [*] Requesting Administrator permission to start MongoDB...
        powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c net start MongoDB' -Verb RunAs -Wait" >nul 2>&1
    )
    sc query "MongoDB" 2>nul | find "RUNNING" >nul
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [WARNING] Could not start MongoDB service automatically.
        echo If login fails, please right-click 'start-database.bat' and select 'Run as administrator'.
        echo.
    ) else (
        echo [OK] MongoDB Service started successfully.
    )
) else (
    echo [OK] MongoDB Service is running.
)


:: Free up ports 5000 and 5173
echo [*] Cleaning up any previous processes on ports 5000 and 5173...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: Start Backend
echo [*] Starting Backend Server (Port 5000)...
start "ERP-Backend-Server" cmd /k "title ERP-Backend-Server && cd /d "%~dp0backend" && npm run dev"

:: Start Frontend
echo [*] Starting Frontend Server (Port 5173)...
start "ERP-Frontend-Server" cmd /k "title ERP-Frontend-Server && cd /d "%~dp0erp-suite" && npm run dev"

:: Wait for Vite and Express to bind
echo [*] Waiting for services to initialize...
ping 127.0.0.1 -n 4 >nul

:: Launch default web browser
echo [*] Launching ERP in default browser...
start http://localhost:5173

echo.
echo ======================================================================
echo [OK] ERP System is running!
echo   - Web URL       : http://localhost:5173
echo   - Backend API   : http://localhost:5000/api
echo.
echo You can run stop.bat at any time to cleanly stop all servers.
echo ======================================================================
timeout /t 3 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 4 >nul
