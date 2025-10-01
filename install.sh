#!/bin/bash

set -e

echo "Installing Markdown Printer..."

# Check if running on Windows (Git Bash, WSL, etc.)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
  echo "Error: This script is for macOS and Linux."
  echo "For Windows, please run install.bat instead."
  exit 1
fi

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NATIVE_HOST_DIR="$SCRIPT_DIR/native-host"
HOST_MANIFEST="$NATIVE_HOST_DIR/host.json"

# Install npm dependencies
echo "Installing Node.js dependencies..."
cd "$NATIVE_HOST_DIR"
npm install

# Make scripts executable
chmod +x host.js
chmod +x host-wrapper.sh

# Get the full path to the wrapper script
HOST_PATH="$NATIVE_HOST_DIR/host-wrapper.sh"

# Create a temporary manifest with the correct path
TEMP_MANIFEST=$(mktemp)
sed "s|HOST_PATH_PLACEHOLDER|$HOST_PATH|g" "$HOST_MANIFEST" > "$TEMP_MANIFEST"

# Determine the native messaging manifest location based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
else
  echo "Unsupported OS: $OSTYPE"
  exit 1
fi

# Create manifest directory if it doesn't exist
mkdir -p "$MANIFEST_DIR"

# Copy manifest to the correct location
FINAL_MANIFEST="$MANIFEST_DIR/com.markdownprinter.host.json"
cp "$TEMP_MANIFEST" "$FINAL_MANIFEST"
rm "$TEMP_MANIFEST"

echo ""
echo "✓ Native host installed successfully"
echo ""
echo "Next steps:"
echo "1. Open Chrome and navigate to chrome://extensions/"
echo "2. Enable 'Developer mode' in the top right"
echo "3. Click 'Load unpacked'"
echo "4. Select the directory: $SCRIPT_DIR/extension"
echo "5. Note the Extension ID and update it in: $FINAL_MANIFEST"
echo "   (Replace EXTENSION_ID_PLACEHOLDER with the actual ID)"
echo ""
echo "After updating the extension ID, you can use Markdown Printer!"
echo "Right-click on any page and select 'Save as Markdown'"
echo "Files will be saved to: ~/MarkdownPrints/"
echo ""
echo "For more information, visit:"
echo "https://github.com/levz0r/markdown-printer"
echo ""
