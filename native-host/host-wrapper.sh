#!/bin/bash

# This wrapper ensures Node.js can be found regardless of installation method
# (nvm, Homebrew, system install, etc.)

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Try to find Node.js in common locations
if command -v node &> /dev/null; then
    # Node is in PATH
    NODE_PATH="$(command -v node)"
elif [ -f "$HOME/.nvm/nvm.sh" ]; then
    # Load nvm if available
    source "$HOME/.nvm/nvm.sh"
    NODE_PATH="$(command -v node)"
elif [ -f "/usr/local/bin/node" ]; then
    # Homebrew or manual install
    NODE_PATH="/usr/local/bin/node"
elif [ -f "/opt/homebrew/bin/node" ]; then
    # Apple Silicon Homebrew
    NODE_PATH="/opt/homebrew/bin/node"
elif [ -f "/usr/bin/node" ]; then
    # System install
    NODE_PATH="/usr/bin/node"
else
    # Fallback - try to execute node directly
    NODE_PATH="node"
fi

# Execute host.js with the found Node.js
exec "$NODE_PATH" "$SCRIPT_DIR/host.js"
