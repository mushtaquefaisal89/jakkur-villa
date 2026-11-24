@echo off
rem Double-click this file to run the Jakkur Villa website on http://localhost:8080
rem Keep this window open while you use the site. Close it to stop the website.
cd /d "%~dp0"
title Jakkur Villa website - http://localhost:8080
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8080"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8080
pause
