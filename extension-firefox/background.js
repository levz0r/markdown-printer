// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Create context menu on installation
browserAPI.runtime.onInstalled.addListener(() => {
  browserAPI.contextMenus.create({
    id: 'saveAsMarkdown',
    title: 'Save as Markdown',
    contexts: ['page']
  });
});

// Handle context menu click
browserAPI.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'saveAsMarkdown') {
    savePageAsMarkdown(tab.id);
  }
});

// Handle messages from popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveAsMarkdown') {
    browserAPI.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        try {
          await savePageAsMarkdown(tabs[0].id);
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      }
    });
    return true; // Keep the message channel open for async response
  }
});

async function savePageAsMarkdown(tabId) {
  try {
    // Inject Turndown library and conversion script
    await browserAPI.scripting.executeScript({
      target: { tabId: tabId },
      files: ['turndown.js']
    }).catch(error => {
      // Better error message for protected pages
      if (error.message.includes('cannot be scripted') ||
          error.message.includes('Cannot access') ||
          error.message.includes('extensions gallery')) {
        throw new Error('Cannot save this page - extensions are blocked on browser internal pages and extension stores');
      }
      throw error;
    });

    // Inject script to convert and get markdown
    const results = await browserAPI.scripting.executeScript({
      target: { tabId: tabId },
      func: extractAndConvertToMarkdown
    });

    if (!results || !results[0]) {
      throw new Error('Failed to extract page content');
    }

    const { markdown, title, url } = results[0].result;

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedTitle = sanitizeFilename(title || 'untitled');
    const filename = `${sanitizedTitle}-${timestamp}.md`;

    // Add metadata header
    const content = `# ${title}\n\n**Source:** ${url}\n**Saved:** ${new Date().toISOString()}\n\n---\n\n${markdown}`;

    // For Firefox, we need to use a different approach
    // Check if we're in Firefox by checking for browser.downloads
    const isFirefox = typeof browser !== 'undefined' && browser.downloads;

    if (isFirefox) {
      // Firefox: Use blob URL approach with special handling
      const blob = new Blob([content], { type: 'text/plain' });

      // Create a temporary object URL in a way that works in Firefox background scripts
      // We'll inject a helper script into the page to create the blob URL
      const [result] = await browserAPI.scripting.executeScript({
        target: { tabId: tabId },
        func: (content, filename) => {
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          // Trigger download from page context
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          URL.revokeObjectURL(url);
          return true;
        },
        args: [content, filename]
      });
    } else {
      // Chrome: Use data URL
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const reader = new FileReader();

      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      await browserAPI.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: true
      });
    }

  } catch (error) {
    console.error('Error saving markdown:', error);
    throw error;
  }
}

// This function runs in the page context
function extractAndConvertToMarkdown() {
  // Try to get the main content area, fall back to body
  const article = document.querySelector('article') ||
                  document.querySelector('[role="main"]') ||
                  document.querySelector('main') ||
                  document.body;

  // Convert HTML to Markdown using Turndown
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
  });

  // Remove unwanted elements (scripts, styles, etc.)
  turndownService.remove(['script', 'style', 'noscript', 'iframe', 'svg']);

  const markdown = turndownService.turndown(article.innerHTML);

  return {
    markdown: markdown,
    title: document.title,
    url: window.location.href
  };
}

function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200);
}
