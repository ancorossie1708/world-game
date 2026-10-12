@echo off
title World Game
echo.
echo Opening World Game...
echo Please keep this window open until the browser appears.
echo.
powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "%~dp0scripts\start-preview.ps1" %*
if errorlevel 1 (
  echo.
  echo The game could not open. The reason is shown above.
  pause
  exit /b 1
)
exit /b 0
