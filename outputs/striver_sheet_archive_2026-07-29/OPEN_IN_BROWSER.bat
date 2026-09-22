@echo off
setlocal
set "archive=%~dp0striver_revision_ledger_offline.html"

if not exist "%archive%" (
  echo Could not find:
  echo %archive%
  pause
  exit /b 1
)

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%archive%"
  exit /b 0
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" "%archive%"
  exit /b 0
)

if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
  start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" "%archive%"
  exit /b 0
)

start "" "%archive%"
exit /b 0
