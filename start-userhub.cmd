@echo off
cd /d "%~dp0"
set "PATH=%~dp0..\.tools;%PATH%"
node scripts/start-local.cjs
pause
