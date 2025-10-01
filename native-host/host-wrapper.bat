@echo off
REM This wrapper ensures Node.js can be found on Windows
REM regardless of installation method (nvm-windows, official installer, etc.)

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Try to find Node.js in common Windows locations
where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    REM Node is in PATH
    node "%SCRIPT_DIR%host.js"
    exit /b %ERRORLEVEL%
)

REM Check Program Files (64-bit)
if exist "C:\Program Files\nodejs\node.exe" (
    "C:\Program Files\nodejs\node.exe" "%SCRIPT_DIR%host.js"
    exit /b %ERRORLEVEL%
)

REM Check Program Files (x86)
if exist "C:\Program Files (x86)\nodejs\node.exe" (
    "C:\Program Files (x86)\nodejs\node.exe" "%SCRIPT_DIR%host.js"
    exit /b %ERRORLEVEL%
)

REM Check nvm-windows default location
if exist "%APPDATA%\nvm" (
    for /f "delims=" %%i in ('dir /b /o-d "%APPDATA%\nvm\v*" 2^>nul') do (
        if exist "%APPDATA%\nvm\%%i\node.exe" (
            "%APPDATA%\nvm\%%i\node.exe" "%SCRIPT_DIR%host.js"
            exit /b %ERRORLEVEL%
        )
    )
)

REM If we get here, Node.js was not found
echo Error: Node.js not found. Please ensure Node.js is installed and in your PATH.
exit /b 1
