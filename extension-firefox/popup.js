// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Set localized text on load
document.addEventListener('DOMContentLoaded', () => {
  // Set text direction for RTL languages
  const uiLanguage = browserAPI.i18n.getUILanguage();
  const rtlLanguages = ['he', 'ar', 'fa', 'ur'];
  const isRTL = rtlLanguages.some(lang => uiLanguage.startsWith(lang));

  if (isRTL) {
    document.body.dir = 'rtl';
  }

  document.getElementById('extensionName').textContent =
    browserAPI.i18n.getMessage('extensionName');
  document.getElementById('saveBtn').textContent = browserAPI.i18n.getMessage('savePageButton');

  // Display version number
  const manifest = browserAPI.runtime.getManifest();
  document.getElementById('version').textContent = `v${manifest.version}`;
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  const button = document.getElementById('saveBtn');
  const originalText = browserAPI.i18n.getMessage('savePageButton');
  button.disabled = true;
  button.textContent = 'Saving...';

  try {
    await browserAPI.runtime.sendMessage({ action: 'saveAsMarkdown' });
    button.textContent = 'Saved!';
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1500);
  } catch (_error) {
    button.textContent = 'Error - Try again';
    button.disabled = false;
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }
});
