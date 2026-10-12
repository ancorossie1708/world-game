@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-signing.ps1"
if errorlevel 1 pause
