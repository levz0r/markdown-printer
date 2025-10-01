# Markdown Printer - Pro Version

Advanced version with custom save locations, auto-open files, and persistent settings.

## ✨ Pro Features

- ✅ **Custom save location** - Set a default folder, no dialog every time
- ✅ **Auto-open files** - Automatically open saved files in your default editor
- ✅ **Folder browser** - Native folder picker to choose save location
- ✅ **Persistent settings** - Saves your preferences

## ⚠️ Trade-offs

- ❌ Requires additional setup (native messaging host)
- ❌ Cannot be published to Chrome Web Store easily
- ❌ Users must manually install and configure

## 📦 Installation

### Prerequisites

- Google Chrome
- Node.js (v14 or higher)
- **Platform**: Windows, macOS, or Linux

### Windows

1. Clone or download this repository

2. Run the installation script:
   ```cmd
   install.bat
   ```

3. Load the Chrome extension:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `extension-pro/` directory

4. Update the native messaging manifest:
   - Copy the Extension ID from the Chrome extensions page
   - Open the manifest file at:
     `%LOCALAPPDATA%\Google\Chrome\NativeMessagingHosts\com.markdownprinter.host.json`
   - Replace `EXTENSION_ID_PLACEHOLDER` with your actual extension ID

### macOS / Linux

1. Clone or download this repository

2. Run the installation script:
   ```bash
   ./install.sh
   ```

3. Load the Chrome extension:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `extension-pro/` directory

4. Update the native messaging manifest:
   - Copy the Extension ID from the Chrome extensions page
   - Open the manifest file:
     - **macOS**: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.markdownprinter.host.json`
     - **Linux**: `~/.config/google-chrome/NativeMessagingHosts/com.markdownprinter.host.json`
   - Replace `EXTENSION_ID_PLACEHOLDER` with your actual extension ID

5. Reload the extension in Chrome

## ⚙️ Configuration

Right-click the extension icon → "Options" to configure:

1. **Save Location** - Browse and select a default folder
2. **Open After Save** - Toggle to auto-open files in your default editor

## 📖 Usage

Same as the standard version, but files save to your configured location without showing a dialog each time.

## 🔙 Want Simpler?

If the setup is too complex, try the [Standard Version](../README.md) - no setup required!
