@echo off
setlocal
cd /d "%~dp0"

set "RELEASE=%~dp0src-tauri\target\release\d2r-item-keeper.exe"
set "DEBUG=%~dp0src-tauri\target\debug\d2r-item-keeper.exe"

if exist "%RELEASE%" (
    start "" "%RELEASE%"
    exit /b 0
)

if exist "%DEBUG%" (
    if not exist "%~dp0dist\index.html" (
        call npm run build
        if errorlevel 1 goto :fail
    )
    start "" "%DEBUG%"
    exit /b 0
)

:fail
echo.
echo D2R Item Keeper is not built yet.
echo.
echo Open PowerShell in this folder and run:
echo   npm run desktop:install
echo.
pause
exit /b 1
