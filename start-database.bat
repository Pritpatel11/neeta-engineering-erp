@echo off
setlocal
title Start MongoDB Database Service
cd /d "%~dp0"

echo ======================================================================
echo              START MONGODB DATABASE SERVICE
echo ======================================================================
echo.

sc query "MongoDB" 2>nul | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB Service is already running!
    goto END
)

echo [*] Checking for administrator privileges...
net session >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [*] Starting MongoDB service...
    net start MongoDB
) else (
    echo [*] Administrator rights required. Requesting elevation...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c net start MongoDB' -Verb RunAs -Wait"
)

sc query "MongoDB" 2>nul | find "RUNNING" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MongoDB Service started successfully!
) else (
    echo.
    echo [ERROR] Failed to start MongoDB service.
    echo Please right-click this file and select 'Run as administrator',
    echo or start it via Services: Press Win+R, type services.msc, find 'MongoDB Server', and click 'Start'.
)

:END
echo.
echo ======================================================================
timeout /t 5
