# Changelog

All notable changes to Markdown Printer.

## v1.2.2 (2026-10-25)

- Fixed the popup showing "Saved!" when nothing was saved — a failed save now says what went wrong (for example, on browser internal pages and extension stores, which browsers don't let extensions read)
- Fixed pages being left without saving on sites whose menus are links: while expanding collapsed sections, the capture no longer clicks links to other pages or buttons that submit a form
- A save started from the right-click menu that fails now shows a "!" on the toolbar icon; open the popup to see the reason

## v1.2.1 (2026-10-25)

- Fixed save statistics, rating preferences, and "Copy diagnostics" not being remembered — the extension now declares the `storage` permission it needs (data stays local in your browser)

## v1.2.0 (2026-05-11)

- Added "Copy diagnostics" button in the popup — captures recent activity for bug reports without sharing any browsing data
- New optional in-popup feedback prompt that only appears after extended use
- Pro version: improved log rotation under `~/.markdown-printer/logs/` for easier troubleshooting
- Background error tracking to help diagnose silent failures
- Localized all new strings in English, French, Hebrew, and Hindi

## v1.1.1 (2025-11-24)

- Improved content capture for documentation sites (API docs, tutorials)
- 2x faster scrolling during page capture
- Added attribution line with version and author link
- Fixed progress overlay appearing in output

## v1.1.0 (2025-10-10)

- Added internationalization support for Hebrew, Hindi, and French
- Added RTL (right-to-left) language support for Hebrew and other RTL languages
- Added version number display in popup
- Improved build system to include localization files

## v1.0.3 (2025-10-06)

- Fixed content extraction to work reliably across all site layouts
- Improved capture of complex documentation sites (Microsoft Learn, etc.)
- Simplified content selection for better compatibility

## v1.0.2 (2025-10-06)

- Added full-page capture with automatic scrolling
- Automatically loads lazy-loaded content before conversion
- Scrolls through entire page to trigger dynamic content
- 3x faster scrolling performance

## v1.0.1 (2025-10-05)

- Added Firefox support with cross-browser compatibility
- Improved markdown output by removing unwanted elements (scripts, styles, iframes, SVGs)
- Added automated build system with version management
- Better error handling for protected pages

## v1.0.0 (2025-10-01)

- Initial release
- One-click markdown conversion
- Right-click context menu support
- Toolbar popup interface
- Metadata insertion (source URL, save date)
- Save As dialog integration
