// Markdown Printer diagnostic logger.
// Ring-buffered structured log in chrome.storage.local. Works in service
// workers, event pages, and popup windows. Never throws — logging must
// never break the extension.
//
// Depends on mdpLogBuffer (src/log-buffer.js) being loaded first.
(function () {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  const STORAGE_KEY = 'mdpDiagnosticLog';
  const MAX_ENTRIES = 200;

  // Resolve buffer helpers. In tests, log-buffer is required via CommonJS;
  // in the extension, it attaches to the global before this script runs.
  const buf =
    (typeof mdpLogBuffer !== 'undefined' && mdpLogBuffer) ||
    (typeof self !== 'undefined' && self.mdpLogBuffer) ||
    null;

  async function append(level, args) {
    if (!buf) {
      return;
    }
    try {
      const entry = {
        t: new Date().toISOString(),
        level,
        msg: buf.formatArgs(args),
      };
      const stored = await browserAPI.storage.local.get(STORAGE_KEY);
      const next = buf.appendBounded(stored[STORAGE_KEY], entry, MAX_ENTRIES);
      await browserAPI.storage.local.set({ [STORAGE_KEY]: next });
    } catch (_e) {
      // Swallow — logger must never break the caller.
    }
  }

  function wrap(level, fallback) {
    return function (...args) {
      try {
        fallback.apply(console, args);
      } catch (_e) {
        /* noop */
      }
      append(level, args);
    };
  }

  const mdpLog = {
    error: wrap('error', console.error),
    warn: wrap('warn', console.warn),
    info: wrap('info', console.info || console.log),
  };

  async function mdpGetDiagnostics() {
    let log = [];
    let stats = {};
    try {
      const stored = await browserAPI.storage.local.get([STORAGE_KEY, 'mdpStats']);
      log = stored[STORAGE_KEY] || [];
      stats = stored.mdpStats || {};
    } catch (_e) {
      /* noop */
    }
    const manifest = browserAPI.runtime.getManifest();
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'n/a';
    const lang = typeof navigator !== 'undefined' ? navigator.language : 'n/a';
    return {
      extension: { name: manifest.name, version: manifest.version },
      browser: ua,
      language: lang,
      stats,
      log,
      capturedAt: new Date().toISOString(),
    };
  }

  function installGlobalHandlers(scope) {
    if (!scope || typeof scope.addEventListener !== 'function') {
      return;
    }
    scope.addEventListener('error', event => {
      mdpLog.error('uncaught', event.error || event.message || event);
    });
    scope.addEventListener('unhandledrejection', event => {
      mdpLog.error('unhandledrejection', event.reason);
    });
  }

  const g = typeof self !== 'undefined' ? self : globalThis;
  g.mdpLog = mdpLog;
  g.mdpGetDiagnostics = mdpGetDiagnostics;
  installGlobalHandlers(g);
})();
