# Markdown Printer

Save web pages as Markdown files with preserved formatting. **Zero setup required** - just install and start saving!

Perfect for documentation, articles, and note-taking.

[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/pfplfifdaaaalkefgnknfgoiabegcbmf?logo=googlechrome&logoColor=white&label=Chrome%20Users&style=for-the-badge)](https://chromewebstore.google.com/detail/markdown-printer/pfplfifdaaaalkefgnknfgoiabegcbmf)
[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/pfplfifdaaaalkefgnknfgoiabegcbmf?logo=googlechrome&logoColor=white&label=Chrome&style=for-the-badge)](https://chromewebstore.google.com/detail/markdown-printer/pfplfifdaaaalkefgnknfgoiabegcbmf)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/pfplfifdaaaalkefgnknfgoiabegcbmf?logo=googlechrome&logoColor=white&label=Rating&style=for-the-badge)](https://chromewebstore.google.com/detail/markdown-printer/pfplfifdaaaalkefgnknfgoiabegcbmf)

[![Mozilla Add-on Users](https://img.shields.io/amo/users/markdown-printer?logo=firefox&logoColor=white&label=Firefox%20Users&style=for-the-badge)](https://addons.mozilla.org/en-US/firefox/addon/markdown-printer/)
[![Mozilla Add-on Version](https://img.shields.io/amo/v/markdown-printer?logo=firefox&logoColor=white&label=Firefox&style=for-the-badge)](https://addons.mozilla.org/en-US/firefox/addon/markdown-printer/)
[![Mozilla Add-on Rating](https://img.shields.io/amo/rating/markdown-printer?logo=firefox&logoColor=white&label=Rating&style=for-the-badge)](https://addons.mozilla.org/en-US/firefox/addon/markdown-printer/)

## ✨ Features

- 🚀 **No setup required** - works immediately after installation
- 📝 Preserves formatting (headers, links, code blocks, lists, tables)
- 💾 Save anywhere with familiar "Save As" dialog
- ⚡ Fast client-side conversion using Turndown.js
- 🎯 Right-click menu + extension popup
- 📊 Adds metadata (source URL, save date) to saved files

## 🎯 Installation

### Chrome

**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/markdown-printer/pfplfifdaaaalkefgnknfgoiabegcbmf)** ⭐

### Edge

**[Install from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/mlmakmhfnkbabnhhcnekleemamhpnmgk)** ⭐

### Firefox

**[Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/markdown-printer/)** ⭐

### Manual Installation (For Development)

#### Chrome/Edge:

1. Clone or download this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `extension-chrome/` directory
6. Done! 🎉

#### Firefox:

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the `extension-firefox/` directory and select `manifest.json`
6. Done! 🎉

## 📖 Usage

### Method 1: Right-Click Menu

1. Navigate to any webpage
2. Right-click anywhere on the page
3. Select "Save as Markdown"
4. Choose where to save in the dialog

### Method 2: Extension Icon

1. Navigate to any webpage
2. Click the Markdown Printer icon in the toolbar
3. Click "Save Page as Markdown"
4. Choose where to save in the dialog

## 📂 Output Format

Files are saved with the format: `Page-Title-YYYY-MM-DD.md`

Example:

```markdown
# Getting Started Guide

**Source:** https://example.com/docs/getting-started
**Saved:** 2025-10-01T12:00:00.000Z

---

[Your page content in Markdown format]
```

## 🔧 Pro Version

Need advanced features? Check out the **Pro Version** in the `extension-pro/` folder:

- ✅ Custom save location (no dialog every time)
- ✅ Auto-open files in your editor after saving
- ✅ Folder browser to pick save location
- ✅ Persistent settings

**Trade-off:** Requires additional setup (native messaging host installation)

See [Pro Version README](extension-pro/README.md) for installation instructions.

## 🆚 Comparison

| Feature          | Standard                                                                                                   | Pro                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | --------------------- |
| Installation     | One-click                                                                                                  | Requires setup script |
| Browser Support  | Chrome, Edge, Firefox                                                                                      | Chrome, Edge, Firefox |
| Save location    | Choose each time                                                                                           | Configurable default  |
| Auto-open files  | ❌                                                                                                         | ✅                    |
| Settings         | ❌                                                                                                         | ✅                    |
| Chrome Web Store | ✅ [Available](https://chromewebstore.google.com/detail/markdown-printer/pfplfifdaaaalkefgnknfgoiabegcbmf) | ❌ Can't publish      |
| Edge Add-ons     | ✅ [Available](https://microsoftedge.microsoft.com/addons/detail/mlmakmhfnkbabnhhcnekleemamhpnmgk)         | ❌ Can't publish      |
| Firefox Add-ons  | ✅ [Available](https://addons.mozilla.org/en-US/firefox/addon/markdown-printer/)                           | ❌ Can't publish      |

## 🛠️ Technical Details

- **Extension Type:** Manifest V3
- **Conversion:** Turndown.js (client-side)
- **Permissions:** activeTab, downloads, scripting, contextMenus
- **File Format:** Markdown (.md)
- **Browser Support:** Chrome, Edge, Firefox (121+)
- **Cross-browser:** Separate builds for Chrome and Firefox due to Manifest V3 differences

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions welcome! Feel free to open issues or submit pull requests.

## 🔗 Links

- [Chrome Web Store](https://chromewebstore.google.com/detail/markdown-printer/pfplfifdaaaalkefgnknfgoiabegcbmf) - Install for Chrome
- [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/mlmakmhfnkbabnhhcnekleemamhpnmgk) - Install for Edge
- [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/markdown-printer/) - Install for Firefox
- [GitHub Repository](https://github.com/levz0r/markdown-printer)
- [Report Issues](https://github.com/levz0r/markdown-printer/issues)

---

**Made with ❤️ by Lev Gelfenbuim**
