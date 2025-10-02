# Markdown Printer

Save web pages as Markdown files with preserved formatting. **Zero setup required** - just install and start saving!

Perfect for documentation, articles, and note-taking.

## ✨ Features

- 🚀 **No setup required** - works immediately after installation
- 📝 Preserves formatting (headers, links, code blocks, lists, tables)
- 💾 Save anywhere with familiar "Save As" dialog
- ⚡ Fast client-side conversion using Turndown.js
- 🎯 Right-click menu + extension popup
- 📊 Adds metadata (source URL, save date) to saved files

## 🎯 Installation

### Chrome Web Store (Recommended)

**[Install from Chrome Web Store](https://chromewebstore.google.com/detail/markdown-printer/pfplfifdaaaalkefgnknfgoiabegcbmf)** ⭐

### Manual Installation (For Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `extension/` directory
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

| Feature | Standard | Pro |
|---------|----------|-----|
| Installation | One-click | Requires setup script |
| Save location | Choose each time | Configurable default |
| Auto-open files | ❌ | ✅ |
| Settings | ❌ | ✅ |
| Chrome Web Store | ✅ [Available](https://chromewebstore.google.com/detail/markdown-printer/pfplfifdaaaalkefgnknfgoiabegcbmf) | ❌ Can't publish |

## 🛠️ Technical Details

- **Extension Type:** Manifest V3
- **Conversion:** Turndown.js (client-side)
- **Permissions:** activeTab, downloads, scripting, contextMenus
- **File Format:** Markdown (.md)

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

Contributions welcome! Feel free to open issues or submit pull requests.

## 🔗 Links

- [Chrome Web Store](https://chromewebstore.google.com/detail/markdown-printer/pfplfifdaaaalkefgnknfgoiabegcbmf) - Install the extension
- [GitHub Repository](https://github.com/levz0r/markdown-printer)
- [Report Issues](https://github.com/levz0r/markdown-printer/issues)

---

**Made with ❤️ by Lev Gelfenbuim**
