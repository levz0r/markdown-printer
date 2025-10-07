# Build Instructions for Markdown Printer (Firefox)

This document provides step-by-step instructions to build the Firefox version of Markdown Printer from source.

## Requirements

- **Operating System**: macOS, Linux, or Windows
- **Node.js**: v18 or higher
- **npm**: v9 or higher (comes with Node.js)
- **zip utility**: Built into macOS/Linux, available on Windows via PowerShell

## Third-Party Libraries

This extension uses the following open-source library:

- **Turndown.js v7.2.0** - HTML to Markdown converter
  - License: MIT
  - Source: https://github.com/mixmark-io/turndown
  - Downloaded from: https://cdn.jsdelivr.net/npm/turndown@7.2.0/dist/turndown.js

## Build Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/levz0r/markdown-printer.git
   cd markdown-printer
   ```

2. **Run the build script**

   ```bash
   npm run build:firefox
   ```

   This command will:
   - Read the version from `package.json`
   - Generate the Firefox manifest with proper browser-specific settings
   - Copy all source files to `extension-firefox/` directory
   - Create a zip package in `dist/markdown-printer-firefox-v{version}.zip`

3. **Verify the build**

   The output package will be located at:

   ```
   dist/markdown-printer-firefox-v{version}.zip
   ```

   This zip file contains:
   - `manifest.json` - Firefox-specific manifest (generated from build.js)
   - `background.js` - Background script (source file, not minified)
   - `popup.html` - Extension popup UI
   - `popup.js` - Popup script (source file, not minified)
   - `turndown.js` - Third-party library (see above)
   - Icon files (16px, 48px, 128px)

## Source File Locations

All source files are in the repository root and `extension-firefox/` directory:

- `/build.js` - Build automation script
- `/package.json` - Version and build configuration
- `/extension-firefox/background.js` - Main extension logic
- `/extension-firefox/popup.html` - Popup UI
- `/extension-firefox/popup.js` - Popup script
- `/extension-firefox/turndown.js` - Third-party library (Turndown.js v7.2.0)
- `/extension-firefox/icon*.png` - Extension icons

## Notes

- No transpilation, minification, or obfuscation is used for any source files
- The only "build" step is copying files and generating the manifest.json with version information
- `turndown.js` is included as-is from the official CDN (see Third-Party Libraries section)
