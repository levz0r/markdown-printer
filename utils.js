/**
 * Utility functions for Markdown Printer extension
 */

/**
 * Sanitizes a filename by removing invalid characters and limiting length
 * @param {string} filename - The filename to sanitize
 * @returns {string} - The sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 200);
}

// Export for CommonJS (Node.js/Jest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sanitizeFilename };
}
