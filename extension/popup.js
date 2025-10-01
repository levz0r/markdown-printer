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
