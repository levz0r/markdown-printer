// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Policy + URLs come from src/rating-policy.js (loaded as a separate <script>).
const policy = (typeof mdpRatingPolicy !== 'undefined' && mdpRatingPolicy) || null;

function i18n(key, fallback) {
  try {
    const msg = browserAPI.i18n.getMessage(key);
    if (msg) {
      return msg;
    }
  } catch (_e) {
    /* fall through */
  }
  return fallback;
}

async function loadRatingState() {
  const { mdpStats = {}, mdpRating = {} } = await browserAPI.storage.local.get([
    'mdpStats',
    'mdpRating',
  ]);
  return { stats: mdpStats, rating: mdpRating };
}

async function saveRatingState(patch) {
  const { mdpRating = {} } = await browserAPI.storage.local.get('mdpRating');
  await browserAPI.storage.local.set({ mdpRating: { ...mdpRating, ...patch } });
}

function openTab(url) {
  browserAPI.tabs.create({ url });
}

function clearChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function makeActionButton(label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function detectCurrentStore() {
  if (!policy) {
    return 'chrome';
  }
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  return policy.detectStore(ua, typeof browser !== 'undefined');
}

function renderHappy() {
  document.getElementById('rpTitle').textContent = i18n(
    'ratingHappyTitle',
    'Great! Mind leaving a quick review?'
  );
  const actions = document.getElementById('rpActions');
  clearChildren(actions);
  actions.appendChild(
    makeActionButton(i18n('ratingReviewBtn', 'Leave a review'), async () => {
      openTab(policy.storeReviewUrl(detectCurrentStore()));
      await saveRatingState({ status: 'done' });
      document.getElementById('ratingPrompt').hidden = true;
    })
  );
}

function renderUnhappy() {
  document.getElementById('rpTitle').textContent = i18n(
    'ratingUnhappyTitle',
    'Sorry! What went wrong?'
  );
  const actions = document.getElementById('rpActions');
  clearChildren(actions);
  actions.appendChild(
    makeActionButton(i18n('ratingReportBtn', 'Report an issue'), async () => {
      openTab(policy.ISSUES_URL);
      await saveRatingState({ status: 'done' });
      document.getElementById('ratingPrompt').hidden = true;
    })
  );
}

async function snoozeRating() {
  const days = policy ? policy.RATING_SNOOZE_DAYS : 30;
  const snoozedUntil = Date.now() + days * 86400000;
  await saveRatingState({ status: 'snoozed', snoozedUntil });
  document.getElementById('ratingPrompt').hidden = true;
}

async function maybeShowRatingPrompt() {
  if (!policy) {
    return;
  }
  try {
    const { stats, rating } = await loadRatingState();
    if (!policy.shouldShowRating(stats, rating, new Date())) {
      return;
    }
    document.getElementById('ratingPrompt').hidden = false;
    document.getElementById('rpYes').addEventListener('click', renderHappy);
    document.getElementById('rpNo').addEventListener('click', renderUnhappy);
    document.getElementById('rpDismiss').addEventListener('click', snoozeRating);
  } catch (_e) {
    // Never let the prompt break the popup.
  }
}

async function copyDiagnostics() {
  const btn = document.getElementById('diagBtn');
  const original = btn.textContent;
  try {
    const diag =
      typeof mdpGetDiagnostics === 'function'
        ? await mdpGetDiagnostics()
        : { error: 'logger unavailable' };
    const text = JSON.stringify(diag, null, 2);
    await navigator.clipboard.writeText(text);
    btn.textContent = i18n('diagnosticsCopied', 'Copied!');
  } catch (_e) {
    btn.textContent = i18n('diagnosticsCopyFailed', 'Copy failed');
  }
  setTimeout(() => {
    btn.textContent = original;
  }, 1500);
}

function applyStaticI18n() {
  document.getElementById('extensionName').textContent = i18n('extensionName', 'Markdown Printer');
  document.getElementById('saveBtn').textContent = i18n('savePageButton', 'Save Page as Markdown');
  document.getElementById('rpTitle').textContent = i18n(
    'ratingPromptTitle',
    'Enjoying Markdown Printer?'
  );
  document.getElementById('rpYes').textContent = i18n('ratingYes', '👍 Yes');
  document.getElementById('rpNo').textContent = i18n('ratingNo', '👎 Not really');
  document.getElementById('rpDismiss').setAttribute('aria-label', i18n('ratingDismiss', 'Dismiss'));
  document.getElementById('diagBtn').textContent = i18n('copyDiagnostics', 'Copy diagnostics');
}

document.addEventListener('DOMContentLoaded', () => {
  const uiLanguage = browserAPI.i18n.getUILanguage();
  const rtlLanguages = ['he', 'ar', 'fa', 'ur'];
  const isRTL = rtlLanguages.some(lang => uiLanguage.startsWith(lang));
  if (isRTL) {
    document.body.dir = 'rtl';
  }

  applyStaticI18n();

  const manifest = browserAPI.runtime.getManifest();
  document.getElementById('version').textContent = `v${manifest.version}`;

  document.getElementById('diagBtn').addEventListener('click', copyDiagnostics);
  maybeShowRatingPrompt();
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  const button = document.getElementById('saveBtn');
  const originalText = i18n('savePageButton', 'Save Page as Markdown');
  button.disabled = true;
  button.textContent = i18n('savingButton', 'Saving...');

  try {
    await browserAPI.runtime.sendMessage({ action: 'saveAsMarkdown' });
    button.textContent = i18n('savedButton', 'Saved!');
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1500);
  } catch (_error) {
    button.textContent = i18n('errorRetry', 'Error - Try again');
    button.disabled = false;
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }
});
