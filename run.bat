@echo off
setlocal EnableDelayedExpansion
title Neeta Engineering ERP Launcher

:: Navigate to the directory containing this batch file
cd /d "%~dp0"

cls
echo ======================================================================
echo                     NEETA ENGINEERING ERP LAUNCHER
echo ======================================================================
echo.

:: 1. Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js v18+ from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 2. Check npm
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in your PATH.
    echo.
    pause
    exit /b 1
)

:: 3. Check MongoDB service
echo [*] Checking MongoDB Service...
sc query "MongoDB" 2>nul | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB is running.
) else (
    echo [!] MongoDB service is not currently running. Attempting to start...
    net start MongoDB >nul 2>&1
    sc query "MongoDB" 2>nul | find "RUNNING" >nul
    if %ERRORLEVEL% NEQ 0 (
        echo [*] Requesting Administrator permission to start MongoDB...
        powershell -NoProfile -Command "Start-Process cmd -ArgumentList '/c net start MongoDB' -Verb RunAs -Wait" >nul 2>&1
    )
    sc query "MongoDB" 2>nul | find "RUNNING" >nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] MongoDB service started successfully.
    ) else (
        echo [WARNING] Could not automatically start MongoDB service.
        echo           If your MongoDB is running as a local process or container,
        echo           you can proceed, otherwise please start MongoDB manually.
    )
)
echo.

:: 4. Check dependencies in backend and erp-suite
if not exist "backend\node_modules\" (
    echo [!] backend\node_modules not found. Installing backend dependencies...
    cd /d "%~dp0backend"
    call npm install
    cd /d "%~dp0"
    echo.
)

if not exist "erp-suite\node_modules\" (
    echo [!] erp-suite\node_modules not found. Installing frontend dependencies...
    cd /d "%~dp0erp-suite"
    call npm install
    cd /d "%~dp0"
    echo.
)

:MENU
cls
echo ======================================================================
echo                     NEETA ENGINEERING ERP LAUNCHER
echo ======================================================================
echo  1. Launch Full Stack Web App (Browser: http://localhost:5173) [DEFAULT]
echo  2. Launch Desktop App (Electron Window)
echo  3. Launch Backend Server Only (Port 5000)
echo  4. Launch Frontend Server Only (Port 5173)
echo  5. Stop All Running ERP Processes
echo  6. Exit
echo ======================================================================
echo.
choice /c 123456 /t 5 /d 1 /m "Select an option (Auto-starting [1] in 5s): "
set CHOICE_VAL=%ERRORLEVEL%

if "%CHOICE_VAL%"=="1" goto RUN_WEB
if "%CHOICE_VAL%"=="2" goto RUN_ELECTRON
if "%CHOICE_VAL%"=="3" goto RUN_BACKEND
if "%CHOICE_VAL%"=="4" goto RUN_FRONTEND
if "%CHOICE_VAL%"=="5" goto STOP_ALL
if "%CHOICE_VAL%"=="6" goto EXIT_SCRIPT

:RUN_WEB
echo.
echo [*] Cleaning up any previous processes on ports 5000 and 5173...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo [*] Starting Backend Server (Port 5000)...
start "ERP-Backend-Server" cmd /k "title ERP-Backend-Server && cd /d "%~dp0backend" && npm run dev"

echo [*] Starting Frontend Server (Port 5173)...
start "ERP-Frontend-Server" cmd /k "title ERP-Frontend-Server && cd /d "%~dp0erp-suite" && npm run dev"

echo [*] Waiting for services to initialize...
ping 127.0.0.1 -n 4 >nul

echo [*] Opening ERP Web App in your browser...
start http://localhost:5173

goto STATUS_LOOP

:RUN_ELECTRON
echo.
echo [*] Cleaning up any previous processes on ports 5000 and 5173...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo [*] Starting Electron Desktop App...
cd /d "%~dp0erp-suite"
start "ERP-Electron-App" cmd /k "title ERP-Electron-App && cd /d "%~dp0erp-suite" && npm run electron:dev"
cd /d "%~dp0"
goto STATUS_LOOP

:RUN_BACKEND
echo.
echo [*] Starting Backend Server only...
start "ERP-Backend-Server" cmd /k "title ERP-Backend-Server && cd /d "%~dp0backend" && npm run dev"
echo Backend launched in separate window.
pause
goto MENU

:RUN_FRONTEND
echo.
echo [*] Starting Frontend Server only...
start "ERP-Frontend-Server" cmd /k "title ERP-Frontend-Server && cd /d "%~dp0erp-suite" && npm run dev"
echo Frontend launched in separate window.
pause
goto MENU

:STOP_ALL
echo.
echo [*] Stopping all ERP backend, frontend, and electron processes...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq ERP-Backend-Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq ERP-Frontend-Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq ERP-Electron-App*" >nul 2>&1
echo [OK] All ERP processes stopped.
timeout /t 2 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 3 >nul
goto MENU

:STATUS_LOOP
cls
echo ======================================================================
echo                     NEETA ENGINEERING ERP IS RUNNING
echo ======================================================================
echo   - Web URL       : http://localhost:5173
echo   - Backend API   : http://localhost:5000/api
echo   - Database      : MongoDB (Port 27017)
echo.
echo   Sample Credentials:
echo   - Admin         : admin / admin123
echo   - Owner         : owner / owner123
echo   - Accounts Mgr  : manager.accounts / accounts123
echo   - Store Mgr     : manager.logistics / logistics123
echo   - Production Mgr: manager.production / production123
echo   - Quality Mgr   : manager.quality / quality123
echo ======================================================================
echo   [O] Open Web App in browser
echo   [S] Stop all servers and exit
echo   [R] Restart servers
echo   [Q] Close this launcher (leave servers running in background)
echo ======================================================================
echo.
choice /c OSRQ /m "Choose an action: "
set SUB_CHOICE=%ERRORLEVEL%

if "%SUB_CHOICE%"=="1" (
    start http://localhost:5173
    goto STATUS_LOOP
)
if "%SUB_CHOICE%"=="2" (
    echo.
    echo [*] Shutting down ERP servers...
    powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1
    taskkill /F /FI "WINDOWTITLE eq ERP-Backend-Server*" >nul 2>&1
    taskkill /F /FI "WINDOWTITLE eq ERP-Frontend-Server*" >nul 2>&1
    taskkill /F /FI "WINDOWTITLE eq ERP-Electron-App*" >nul 2>&1
    echo [OK] All ERP servers stopped. Goodbye!
    timeout /t 2 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 3 >nul
    exit /b 0
)
if "%SUB_CHOICE%"=="3" (
    goto RUN_WEB
)
if "%SUB_CHOICE%"=="4" (
    echo.
    echo Servers are running in their respective windows. Goodbye!
    exit /b 0
)

:EXIT_SCRIPT
exit /b 0
