// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveAsMarkdown',
    title: 'Save as Markdown',
    contexts: ['page']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'saveAsMarkdown') {
    savePageAsMarkdown(tab.id);
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveAsMarkdown') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
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
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['turndown.js']
    });

    // Inject script to convert and get markdown
    const results = await chrome.scripting.executeScript({
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

    // Convert to data URL (service workers don't have URL.createObjectURL)
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    const dataUrl = `data:text/markdown;base64,${base64Content}`;

    // Download the file
    await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true  // Show save dialog to let user choose location
    });

  } catch (error) {
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
