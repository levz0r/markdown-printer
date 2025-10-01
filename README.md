# Markdown Printer

A Chrome extension that saves web pages as Markdown files with preserved formatting, including headers, links, code blocks, and more.

## Features

- 🎯 Right-click context menu to save any page as Markdown
- 📝 Preserves document structure (headings, lists, tables, code blocks)
- 🔗 Maintains hyperlinks
- 📅 Adds metadata (source URL, save date)
- 💾 Saves to `~/MarkdownPrints/` by default
- ⚡ Fast HTML-to-Markdown conversion using Turndown.js

## Architecture

- **Chrome Extension**: Captures page content and communicates with native host
- **Native Host**: Node.js application that converts HTML to Markdown and saves files
- **Communication**: Chrome Native Messaging API

## Installation

### Prerequisites

- Google Chrome
- Node.js (v14 or higher)
- macOS or Linux

### Setup

1. Clone or download this repository

2. Run the installation script:
   ```bash
   ./install.sh
   ```

3. Load the Chrome extension:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `extension/` directory

4. Update the native messaging manifest:
   - Copy the Extension ID from the Chrome extensions page
   - Open the manifest file:
     - macOS: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.markdownprinter.host.json`
     - Linux: `~/.config/google-chrome/NativeMessagingHosts/com.markdownprinter.host.json`
   - Replace `EXTENSION_ID_PLACEHOLDER` with your actual extension ID

5. Reload the extension in Chrome

## Usage

### Method 1: Context Menu
1. Navigate to any webpage
2. Right-click anywhere on the page
3. Select "Save as Markdown"
4. File will be saved to `~/MarkdownPrints/`

### Method 2: Extension Icon
1. Navigate to any webpage
2. Click the Markdown Printer icon in the toolbar
3. Click "Save Page as Markdown"

## Output Format

Files are saved with:
- Sanitized title from page + date (e.g., `Documentation-Page-2025-10-01.md`)
- Metadata header with source URL and save date
- Converted Markdown content

Example output:
```markdown
# Documentation Page

**Source:** https://example.com/docs
**Saved:** 2025-10-01T12:00:00.000Z

---

[Your page content in Markdown format]
```

## Customization

### Change Save Directory

Edit `native-host/host.js` and modify the `saveMarkdown` function to use a different default directory.

### Turndown Options

Edit `native-host/host.js` and customize the `TurndownService` configuration for different Markdown formatting preferences.

## Troubleshooting

### Extension shows "Native host not found" error

1. Verify the native host is installed:
   ```bash
   cat ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.markdownprinter.host.json
   ```

2. Check that the path in the manifest points to the correct `host.js` location

3. Ensure `host.js` is executable:
   ```bash
   chmod +x native-host/host.js
   ```

### No notification appears

Check the Chrome DevTools console (right-click extension icon → Inspect) for error messages.

### Files not being saved

1. Check that `~/MarkdownPrints/` directory exists and is writable
2. Look at the native host logs (coming from stdout/stderr)

## Project Structure

```
markdown-printer/
├── extension/
│   ├── manifest.json       # Extension configuration
│   ├── background.js       # Service worker, handles messaging
│   ├── popup.html          # Extension popup UI
│   └── popup.js            # Popup interaction logic
├── native-host/
│   ├── host.js             # Native messaging host application
│   ├── host.json           # Native host manifest template
│   └── package.json        # Node.js dependencies
├── install.sh              # Installation script
└── README.md
```

## License

MIT
