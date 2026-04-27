@echo off
title BookMotion Director's Suite Launcher
echo ==========================================
echo   LAUNCHING BOOKMOTION AI STUDIO...
echo ==========================================
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [!] Missing dependencies. Running 'npm install' first...
    echo This may take a minute...
    call npm install
)

echo [1/2] Opening browser at http://localhost:3000...
:: Start browser after a small delay to ensure server has time to bind
start "" http://localhost:3000

echo [2/2] Starting high-performance development server...
echo.
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] Error detected. Press any key to see log or close.
    pause
)
