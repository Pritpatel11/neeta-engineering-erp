@echo off
setlocal
title Stop Neeta Engineering ERP

echo ======================================================================
echo                 STOPPING ALL NEETA ENGINEERING ERP SERVERS
echo ======================================================================
echo.
echo [*] Terminating processes listening on ports 5000 and 5173...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 5000, 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

echo [*] Closing server terminal windows...
taskkill /F /FI "WINDOWTITLE eq ERP-Backend-Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq ERP-Frontend-Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq ERP-Electron-App*" >nul 2>&1

echo.
echo [OK] All ERP processes and windows have been stopped.
echo ======================================================================
timeout /t 2 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 3 >nul
