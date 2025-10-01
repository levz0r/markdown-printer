@echo off
setlocal enabledelayedexpansion

echo Installing Markdown Printer...
echo.

REM Get absolute paths
set SCRIPT_DIR=%~dp0
set NATIVE_HOST_DIR=%SCRIPT_DIR%native-host
set HOST_MANIFEST=%NATIVE_HOST_DIR%\host.json
set HOST_WRAPPER=%NATIVE_HOST_DIR%\host-wrapper.bat

REM Install npm dependencies
echo Installing Node.js dependencies...
cd /d "%NATIVE_HOST_DIR%"
call npm install
if errorlevel 1 (
    echo Error: Failed to install npm dependencies
    exit /b 1
)

REM Create native messaging host manifest for Windows
set MANIFEST_DIR=%LOCALAPPDATA%\Google\Chrome\NativeMessagingHosts
if not exist "%MANIFEST_DIR%" mkdir "%MANIFEST_DIR%"

set FINAL_MANIFEST=%MANIFEST_DIR%\com.markdownprinter.host.json

REM Escape backslashes for JSON
set "HOST_PATH_ESCAPED=%HOST_WRAPPER:\=\\%"

REM Create the manifest file with proper JSON escaping
(
echo {
echo   "name": "com.markdownprinter.host",
echo   "description": "Markdown Printer Native Host",
echo   "path": "%HOST_PATH_ESCAPED%",
echo   "type": "stdio",
echo   "allowed_origins": [
echo     "chrome-extension://EXTENSION_ID_PLACEHOLDER/"
echo   ]
echo }
) > "%FINAL_MANIFEST%"

echo.
echo √ Native host installed successfully
echo.
echo Next steps:
echo 1. Open Chrome and navigate to chrome://extensions/
echo 2. Enable 'Developer mode' in the top right
echo 3. Click 'Load unpacked'
echo 4. Select the directory: %SCRIPT_DIR%extension
echo 5. Note the Extension ID and update it in: %FINAL_MANIFEST%
echo    (Replace EXTENSION_ID_PLACEHOLDER with the actual ID)
echo.
echo After updating the extension ID, you can use Markdown Printer!
echo Right-click on any page and select 'Save as Markdown'
echo Files will be saved to: %USERPROFILE%\MarkdownPrints\
echo.
echo For more information, visit:
echo https://github.com/levz0r/markdown-printer
echo.

endlocal
