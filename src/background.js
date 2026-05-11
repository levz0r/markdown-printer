// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Chrome MV3 service workers expose importScripts; Firefox loads these via
// the manifest's background.scripts array instead. Order matters:
// log-buffer.js → logger.js (logger consumes mdpLogBuffer).
if (typeof importScripts === 'function' && typeof mdpLog === 'undefined') {
  try {
    importScripts('log-buffer.js', 'logger.js');
  } catch (_e) {
    /* logger optional; ignore */
  }
}

// Safe accessors — logger may be unavailable in pathological cases.
const log = (typeof mdpLog !== 'undefined' && mdpLog) || {
  error: (...a) => console.error(...a),
  warn: (...a) => console.warn(...a),
  info: (...a) => console.info(...a),
};

// Initialize stats on first install; create context menu on every install/update.
browserAPI.runtime.onInstalled.addListener(async details => {
  try {
    if (details.reason === 'install') {
      const existing = await browserAPI.storage.local.get('mdpStats');
      if (!existing.mdpStats) {
        await browserAPI.storage.local.set({
          mdpStats: { installedAt: new Date().toISOString(), saveCount: 0 },
        });
      }
    }
  } catch (e) {
    log.error('onInstalled: failed to init stats', e);
  }

  browserAPI.contextMenus.create({
    id: 'saveAsMarkdown',
    title: browserAPI.i18n.getMessage('contextMenuTitle'),
    contexts: ['page'],
  });
});

async function bumpSaveCount() {
  try {
    const { mdpStats = {} } = await browserAPI.storage.local.get('mdpStats');
    mdpStats.saveCount = (mdpStats.saveCount || 0) + 1;
    if (!mdpStats.installedAt) {
      mdpStats.installedAt = new Date().toISOString();
    }
    await browserAPI.storage.local.set({ mdpStats });
  } catch (e) {
    log.error('bumpSaveCount failed', e);
  }
}

// Handle context menu click
browserAPI.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'saveAsMarkdown') {
    savePageAsMarkdown(tab.id);
  }
});

// Handle messages from popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveAsMarkdown') {
    browserAPI.tabs.query({ active: true, currentWindow: true }, async tabs => {
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
    await browserAPI.scripting
      .executeScript({
        target: { tabId: tabId },
        files: ['turndown.js'],
      })
      .catch(error => {
        // Better error message for protected pages
        if (
          error.message.includes('cannot be scripted') ||
          error.message.includes('Cannot access') ||
          error.message.includes('extensions gallery')
        ) {
          throw new Error(
            'Cannot save this page - extensions are blocked on browser internal pages and extension stores'
          );
        }
        throw error;
      });

    // Inject script to convert and get markdown
    const results = await browserAPI.scripting.executeScript({
      target: { tabId: tabId },
      func: extractAndConvertToMarkdown,
    });

    if (!results || !results[0]) {
      throw new Error('Failed to extract page content');
    }

    const result = results[0].result;

    // If operation was cancelled, exit without showing save dialog
    if (!result || result === null) {
      return;
    }

    const { markdown, title, url } = result;

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedTitle = sanitizeFilename(title || 'untitled');
    const filename = `${sanitizedTitle}-${timestamp}.md`;

    // Get extension version
    const version = browserAPI.runtime.getManifest().version;

    // Add metadata header with attribution
    const content = `# ${title}\n\n**Source:** ${url}\n**Saved:** ${new Date().toISOString()}\n\n*Generated with [markdown-printer](https://github.com/levz0r/markdown-printer) (v${version}) by [Lev Gelfenbuim](https://lev.engineer)*\n\n---\n\n${markdown}`;

    // For Firefox, we need to use a different approach
    // Check if we're in Firefox by checking for browser.downloads
    const isFirefox = typeof browser !== 'undefined' && browser.downloads;

    if (isFirefox) {
      // Firefox: Use blob URL approach with special handling
      // Create a temporary object URL in a way that works in Firefox background scripts
      // We'll inject a helper script into the page to create the blob URL
      await browserAPI.scripting.executeScript({
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
        args: [content, filename],
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
        saveAs: true,
      });
    }
    await bumpSaveCount();
  } catch (error) {
    log.error('Error saving markdown:', error);
    throw error;
  }
}

// This function runs in the page context
async function extractAndConvertToMarkdown() {
  // Normalize HTML content for consistent hashing
  // Removes attributes, IDs, classes, and normalizes whitespace
  function normalizeContent(element) {
    const clone = element.cloneNode(true);

    // Remove all unwanted elements
    const unwantedSelectors = [
      'script',
      'style',
      'noscript',
      'iframe',
      'svg',
      'nav',
      'header',
      'footer',
      '.sidebar',
      '.navigation',
      '.menu',
      '[class*="sidebar"]',
      '[class*="navigation"]',
      'button',
      'input',
      'select',
      'textarea',
    ];

    unwantedSelectors.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Get text content and normalize whitespace
    const text = clone.textContent || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  // Function to check if element is in viewport
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // Element is in viewport if any part of it is visible
    return rect.top < windowHeight && rect.bottom > 0 && rect.left < windowWidth && rect.right > 0;
  }

  // Calculate Jaccard similarity between two strings
  function calculateSimilarity(str1, str2) {
    // Split into words and filter out very short words
    const words1 = new Set(
      str1
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2)
    );
    const words2 = new Set(
      str2
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2)
    );

    if (words1.size === 0 && words2.size === 0) {
      return 1;
    }
    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  // Function to capture currently visible content blocks
  function captureVisibleContentBlocks() {
    const capturedBlocks = [];

    try {
      // Find content blocks - prioritize semantic elements
      const blockSelectors = [
        'article',
        'section',
        'main > div',
        '[role="main"] > div',
        '.content > div',
        '.documentation-content > div',
        'main > *',
        '[role="main"] > *',
      ];

      const foundBlocks = new Set();

      // Try ALL selectors and combine results (don't stop at first match)
      for (const selector of blockSelectors) {
        const elements = document.querySelectorAll(selector);

        if (elements.length > 0) {
          elements.forEach(element => {
            // Skip if already found this element
            if (foundBlocks.has(element)) {
              return;
            }

            // Only capture if element is in viewport and has substantial content
            if (isInViewport(element)) {
              const text = element.textContent || '';
              if (text.trim().length > 100) {
                foundBlocks.add(element);

                // Clone and convert to markdown
                const cloned = element.cloneNode(true);

                // Remove unwanted elements from clone
                const unwantedSelectors = [
                  'script',
                  'style',
                  'noscript',
                  'iframe',
                  'svg',
                  'nav',
                  'header',
                  'footer',
                  'button:not([role="tab"])',
                  'input',
                  'select',
                  'textarea',
                  '#markdown-printer-overlay',
                ];

                unwantedSelectors.forEach(sel => {
                  const elements = cloned.querySelectorAll(sel);
                  elements.forEach(el => el.remove());
                });

                const tempTurndown = new TurndownService({
                  headingStyle: 'atx',
                  codeBlockStyle: 'fenced',
                  bulletListMarker: '-',
                });
                tempTurndown.remove(['script', 'style', 'noscript', 'iframe', 'svg']);

                const markdown = tempTurndown.turndown(cloned);

                if (markdown && markdown.trim().length > 100) {
                  capturedBlocks.push({
                    markdown: markdown,
                    normalizedContent: normalizeContent(element),
                  });
                }
              }
            }
          });
        }
      }

      // Fallback: If no blocks found, try capturing the entire main content area
      if (capturedBlocks.length === 0) {
        const mainSelectors = ['main', '[role="main"]', 'article', '#content', '.content', 'body'];

        for (const selector of mainSelectors) {
          const mainElement = document.querySelector(selector);
          if (mainElement) {
            const text = mainElement.textContent || '';
            if (text.trim().length > 100) {
              const cloned = mainElement.cloneNode(true);

              // Remove unwanted elements
              const unwantedSelectors = [
                'script',
                'style',
                'noscript',
                'iframe',
                'svg',
                'nav',
                'header',
                'footer',
                'aside',
                '.sidebar',
                '.navigation',
                '.menu',
                'button',
                'input',
                'select',
                'textarea',
                '#markdown-printer-overlay',
              ];

              unwantedSelectors.forEach(sel => {
                const elements = cloned.querySelectorAll(sel);
                elements.forEach(el => el.remove());
              });

              const tempTurndown = new TurndownService({
                headingStyle: 'atx',
                codeBlockStyle: 'fenced',
                bulletListMarker: '-',
              });
              tempTurndown.remove(['script', 'style', 'noscript', 'iframe', 'svg']);

              const markdown = tempTurndown.turndown(cloned);

              if (markdown && markdown.trim().length > 100) {
                capturedBlocks.push({
                  markdown: markdown,
                  normalizedContent: normalizeContent(mainElement),
                });
                break; // Found content, stop trying
              }
            }
          }
        }
      }

      return capturedBlocks;
    } catch (error) {
      console.error('Error capturing content blocks:', error);
      return [];
    }
  }

  // Function to scroll through the entire page to trigger lazy loading
  async function scrollToBottom() {
    // Arrays to store captured content
    const capturedContent = [];
    const capturedHashes = new Set();

    // First, try to expand any collapsed/hidden sections
    const expandCollapsedSections = () => {
      // Find and click on common expandable elements
      const expandableSelectors = [
        'details:not([open])',
        '[aria-expanded="false"]',
        '.collapsed',
        '.expand',
        '.accordion:not(.active)',
        '[data-collapsed="true"]',
        'button[aria-expanded="false"]',
      ];

      let expandedCount = 0;
      expandableSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          try {
            if (el.tagName === 'DETAILS') {
              el.open = true;
            } else if (el.click) {
              el.click();
            }
            expandedCount++;
          } catch (_e) {
            // Ignore errors
          }
        });
      });
      return expandedCount;
    };

    // Try to expand sections before scrolling
    expandCollapsedSections();
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create progress indicator overlay
    const overlay = document.createElement('div');
    overlay.id = 'markdown-printer-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      min-width: 300px;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    `;

    const title = document.createElement('div');
    title.textContent = 'Printing...';
    title.style.cssText = 'font-weight: bold; margin-bottom: 10px; font-size: 16px;';

    const percentageText = document.createElement('div');
    percentageText.id = 'percentage-text';
    percentageText.style.cssText =
      'font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #4CAF50;';
    percentageText.textContent = '0%';

    const status = document.createElement('div');
    status.id = 'scroll-status';
    status.style.cssText = 'margin-bottom: 10px; font-size: 14px; opacity: 0.8;';

    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 10px;
    `;

    const progressFill = document.createElement('div');
    progressFill.id = 'progress-fill';
    progressFill.style.cssText = `
      height: 100%;
      background: #4CAF50;
      width: 0%;
      transition: width 0.3s ease;
    `;
    progressBar.appendChild(progressFill);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Abort';
    cancelButton.style.cssText = `
      width: 100%;
      padding: 8px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: background 0.2s ease;
    `;
    cancelButton.onmouseover = () => (cancelButton.style.background = '#d32f2f');
    cancelButton.onmouseout = () => (cancelButton.style.background = '#f44336');

    overlay.appendChild(title);
    overlay.appendChild(percentageText);
    overlay.appendChild(status);
    overlay.appendChild(progressBar);
    overlay.appendChild(cancelButton);
    document.body.appendChild(overlay);

    // Trigger fade-in animation
    window.requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    let cancelled = false;
    cancelButton.onclick = () => {
      cancelled = true;
      status.textContent = 'Stopping...';
      cancelButton.disabled = true;
      cancelButton.style.opacity = '0.5';
    };

    // Make all hidden content sections visible (common in documentation sites)
    const makeAllContentVisible = () => {
      // Target common documentation content containers
      const contentSelectors = [
        'article',
        'section',
        'main',
        '[role="main"]',
        '[class*="content"]',
        '[class*="documentation"]',
        '[class*="api"]',
        '[class*="endpoint"]',
        '[id*="content"]',
      ];

      contentSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') {
            el.style.display = 'block';
            el.style.visibility = 'visible';
            el.style.opacity = '1';
          }
          // Also unhide all children
          el.querySelectorAll('*').forEach(child => {
            const childStyle = window.getComputedStyle(child);
            if (childStyle.display === 'none' || childStyle.visibility === 'hidden') {
              child.style.display = 'block';
              child.style.visibility = 'visible';
              child.style.opacity = '1';
            }
          });
        });
      });
    };

    // First, make content visible
    status.textContent = 'Loading content...';
    makeAllContentVisible();
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update progress display
    const updateProgress = (current, total, stableCount, sectionsCount) => {
      const percentage = Math.min(100, Math.round((current / total) * 100));
      progressFill.style.width = percentage + '%';
      percentageText.textContent = percentage + '%';
      status.textContent = `${current.toLocaleString()}px / ${total.toLocaleString()}px`;
      if (sectionsCount > 0) {
        status.textContent += ` | ${sectionsCount} sections`;
      }
      if (stableCount > 0) {
        status.textContent += ` (${stableCount}/3 stable)`;
      }
    };

    // Smooth scroll function that triggers events
    const smoothScrollTo = async targetY => {
      const startY = window.scrollY;
      const distance = targetY - startY;
      const duration = 150; // ms (reduced for faster scrolling)
      const startTime = window.performance.now();

      return new Promise(resolve => {
        const scroll = currentTime => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = progress * (2 - progress); // ease out

          window.scrollTo(0, startY + distance * easeProgress);

          // Dispatch scroll event to trigger listeners
          window.dispatchEvent(new window.Event('scroll'));

          if (progress < 1) {
            window.requestAnimationFrame(scroll);
          } else {
            resolve();
          }
        };
        window.requestAnimationFrame(scroll);
      });
    };

    // Start from the top
    await smoothScrollTo(0);
    await new Promise(resolve => setTimeout(resolve, 100));

    let lastHeight = document.documentElement.scrollHeight;
    let stableScrollCount = 0;

    // Scroll down in increments (2x viewport height for faster scrolling)
    const scrollStep = window.innerHeight * 2;
    let currentPosition = 0;

    while (!cancelled) {
      // Smooth scroll to current position
      await smoothScrollTo(currentPosition);

      // Wait for content to load (reduced for faster scrolling)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Capture visible content blocks at current position
      const blocks = captureVisibleContentBlocks();
      blocks.forEach(block => {
        // Check if this content is similar to anything we've already captured
        const isDuplicate = Array.from(capturedHashes).some(existingContent => {
          const similarity = calculateSimilarity(block.normalizedContent, existingContent);
          return similarity > 0.85; // 85% similar = duplicate
        });

        if (!isDuplicate) {
          capturedHashes.add(block.normalizedContent);
          capturedContent.push(block.markdown);
        }
      });

      const newHeight = document.documentElement.scrollHeight;
      updateProgress(currentPosition, newHeight, stableScrollCount, capturedContent.length);

      // If we've reached the bottom and height hasn't changed for 3 consecutive attempts
      if (currentPosition >= newHeight) {
        if (newHeight === lastHeight) {
          stableScrollCount++;
          if (stableScrollCount >= 3) {
            percentageText.textContent = '100%';
            progressFill.style.width = '100%';
            status.textContent = `Complete! Captured ${capturedContent.length} sections`;
            break;
          }
        } else {
          stableScrollCount = 0;
        }
      }

      // Update tracking variables
      lastHeight = newHeight;
      currentPosition += scrollStep;
    }

    // Ensure we scroll all the way to the bottom and wait for content to render
    if (!cancelled) {
      await smoothScrollTo(document.documentElement.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Expand any sections that became available during scrolling
      expandCollapsedSections();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Do a second full scroll pass - some content only loads after first pass
      currentPosition = 0;
      const secondPassHeight = document.documentElement.scrollHeight;
      status.textContent = 'Second pass: loading remaining content...';

      while (currentPosition < secondPassHeight && !cancelled) {
        await smoothScrollTo(currentPosition);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Capture any new content blocks in second pass
        const blocks = captureVisibleContentBlocks();
        blocks.forEach(block => {
          // Check if this content is similar to anything we've already captured
          const isDuplicate = Array.from(capturedHashes).some(existingContent => {
            const similarity = calculateSimilarity(block.normalizedContent, existingContent);
            return similarity > 0.85; // 85% similar = duplicate
          });

          if (!isDuplicate) {
            capturedHashes.add(block.normalizedContent);
            capturedContent.push(block.markdown);
          }
        });

        currentPosition += scrollStep;
      }

      // Final stay at bottom to ensure everything loads
      await smoothScrollTo(document.documentElement.scrollHeight);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // One more expansion attempt
      expandCollapsedSections();
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Fade out and remove overlay
    overlay.style.opacity = '0';
    await new Promise(resolve => setTimeout(resolve, 300));
    overlay.remove();

    // Return status and captured content
    return { cancelled, capturedContent };
  }

  // Scroll through the page first
  const scrollResult = await scrollToBottom();

  // If scrolling was cancelled, return null to indicate no download should occur
  if (scrollResult.cancelled) {
    return null;
  }

  // Combine all captured content sections
  const { capturedContent } = scrollResult;

  // Join all sections with double newlines for spacing
  const combinedMarkdown = capturedContent.join('\n\n---\n\n');

  return {
    markdown: combinedMarkdown,
    title: document.title,
    url: window.location.href,
  };
}

function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200);
}
