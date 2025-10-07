// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed, creating context menu');
  chrome.contextMenus.create({
    id: 'saveAsMarkdown',
    title: 'Save as Markdown',
    contexts: ['page'],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);
  if (info.menuItemId === 'saveAsMarkdown') {
    savePageAsMarkdown(tab.id);
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveAsMarkdown') {
    chrome.tabs.query({ active: true, currentWindow: true }, async tabs => {
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
    console.log('savePageAsMarkdown called for tab:', tabId);

    // Load settings
    const settings = await chrome.storage.sync.get({
      savePath: '',
      openAfterSave: false,
    });
    console.log('Settings loaded:', settings);

    // Inject script to get page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: extractPageContent,
    });

    if (!results || !results[0]) {
      console.error('Failed to extract page content');
      return;
    }

    const { html, title, url } = results[0].result;
    console.log('Extracted content:', { title, url, htmlLength: html.length });

    // Send to native host
    console.log('Sending message to native host...');
    const response = await chrome.runtime.sendNativeMessage('com.markdownprinter.host', {
      command: 'save',
      html: html,
      title: title,
      url: url,
      saveDir: settings.savePath || '',
      openAfterSave: settings.openAfterSave,
    });
    console.log('Native host response:', response);

    if (response.success) {
      console.log('Saved to:', response.filepath);
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon48.png'),
        title: 'Markdown Printer',
        message: `Saved to: ${response.filepath}`,
      });
    } else {
      console.error('Save failed:', response.error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon48.png'),
        title: 'Markdown Printer Error',
        message: `Failed to save: ${response.error}`,
      });
    }
  } catch (error) {
    console.error('Error:', error);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon48.png'),
      title: 'Markdown Printer Error',
      message: `Error: ${error.message}`,
    });
  }
}

// This function runs in the page context
function extractPageContent() {
  // Try to get the main content area, fall back to body
  const article =
    document.querySelector('article') ||
    document.querySelector('[role="main"]') ||
    document.querySelector('main') ||
    document.body;

  return {
    html: article.innerHTML,
    title: document.title,
    url: window.location.href,
  };
}
