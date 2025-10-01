// Default settings
const DEFAULT_SETTINGS = {
  savePath: '',
  openAfterSave: false
};

// Load settings when page opens
document.addEventListener('DOMContentLoaded', async () => {
  const settings = await loadSettings();
  document.getElementById('savePath').value = settings.savePath || '';
  document.getElementById('openAfterSave').checked = settings.openAfterSave;
});

// Browse for folder
document.getElementById('browseBtn').addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendNativeMessage(
      'com.markdownprinter.host',
      { command: 'browsefolder' }
    );

    if (response.success && response.path) {
      document.getElementById('savePath').value = response.path;
    } else if (response.error) {
      showStatus('Error selecting folder: ' + response.error, 'error');
    }
  } catch (error) {
    showStatus('Error opening folder browser: ' + error.message, 'error');
  }
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', async () => {
  const settings = {
    savePath: document.getElementById('savePath').value.trim(),
    openAfterSave: document.getElementById('openAfterSave').checked
  };

  try {
    await chrome.storage.sync.set(settings);
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    showStatus('Error saving settings: ' + error.message, 'error');
  }
});

// Reset to defaults
document.getElementById('resetBtn').addEventListener('click', async () => {
  try {
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
    document.getElementById('savePath').value = '';
    document.getElementById('openAfterSave').checked = false;
    showStatus('Settings reset to defaults!', 'success');
  } catch (error) {
    showStatus('Error resetting settings: ' + error.message, 'error');
  }
});

// Helper functions
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';

  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}
