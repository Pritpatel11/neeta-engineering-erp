@echo off
setlocal
title Neeta Engineering ERP - Claude MCP Server
cd /d "%~dp0mcp-server"

echo ======================================================================
echo          NEETA ENGINEERING ERP - MODEL CONTEXT PROTOCOL (MCP)
echo ======================================================================
echo.

if not exist "node_modules\" (
    echo [*] Installing MCP server dependencies...
    call npm install
    echo.
)

echo [*] Starting MCP Server for Claude (Stdio Transport)...
echo [*] Target ERP API : http://127.0.0.1:5000/api
echo.
npm start
