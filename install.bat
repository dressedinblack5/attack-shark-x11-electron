@echo off
chcp 65001 >nul
title Attack Shark X11 Installer
color 0A

:: Explicitly set working directory to the script's folder
cd /d "%~dp0"

echo ========================================
echo Attack Shark X11 - BUILD INSTALLER
echo ========================================
echo.

:: --- Check dependencies ---
echo [1/4] Checking dependencies...
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Bun is not installed!
    echo Please install Bun from https://bun.sh/
    pause
    exit /b 1
)
echo Bun detected.

echo.

:: --- Build in Temp to avoid Desktop permissions ---
echo [2/4] Setting up build in temporary directory...
set "BUILD_DIR=%TEMP%\attack-shark-build"
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"

:: Copy essential files
xcopy /e /i /q /exclude:install.bat . "%BUILD_DIR%"

echo [3/4] Installing and building in temporary directory...
cd /d "%BUILD_DIR%"

:: Install deps in temp
call bun install --no-lockfile

:: Build in temp
call bun run electron-vite build
call bun run electron-builder --win

:: --- Finalization ---
echo [4/4] Moving installer back to project directory...
if not exist "%~dp0dist" mkdir "%~dp0dist"
for /r "dist" %%i in (*.exe) do (
    copy /y "%%i" "%~dp0dist\"
    echo Installer moved: %%~nxi
)

:: Cleanup
cd /d "%~dp0"
rmdir /s /q "%BUILD_DIR%"

echo.
echo ========================================
echo BUILD SUCCESSFUL!
echo.
echo NOTE: If the app fails to detect your mouse,
echo you must replace the driver with WinUSB:
echo 1. Download Zadig: https://zadig.akeo.ie/
echo 2. Select 'List All Devices' in Options.
echo 3. Select your mouse, ensure WinUSB is selected.
echo 4. Click 'Replace Driver'.
echo ========================================
echo.
pause
