@echo off
cd /d "%~dp0"
title MidiSheet Local Web Server
echo ========================================================
echo Starting MidiSheet Web Server on http://localhost:8001
echo ========================================================
echo Press Ctrl+C at any time to stop the server.
echo.

python server.py
if %ERRORLEVEL% neq 0 (
    py server.py
)

pause
