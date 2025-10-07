// Load and display current save path
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const settings = await chrome.storage.sync.get({
      savePath: '',
      openAfterSave: false,
    });

    const savePath = settings.savePath || '~/MarkdownPrints/';
    const infoText = document.getElementById('infoText');

    if (settings.openAfterSave) {
      infoText.textContent = `Saves to ${savePath} and opens the file automatically`;
    } else {
      infoText.textContent = `Saves to ${savePath}`;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  const button = document.getElementById('saveBtn');
  button.disabled = true;
  button.textContent = 'Saving...';

  try {
    await chrome.runtime.sendMessage({ action: 'saveAsMarkdown' });
    button.textContent = 'Saved!';
    setTimeout(() => window.close(), 500);
  } catch (error) {
    button.textContent = 'Error - Try again';
    button.disabled = false;
  }
});
