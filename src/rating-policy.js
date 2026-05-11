// Pure rating-prompt policy. Decides *whether* to show the prompt and
// which store to deep-link to. No DOM, no storage, no chrome APIs —
// kept testable in Node.
(function (root, factory) {
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = mod;
  } else {
    root.mdpRatingPolicy = mod;
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const RATING_MIN_SAVES = 10;
  const RATING_MIN_DAYS = 7;
  const RATING_SNOOZE_DAYS = 30;
  const MS_PER_DAY = 86400000;

  const CHROME_REVIEWS_URL =
    'https://chromewebstore.google.com/detail/pfplfifdaaaalkefgnknfgoiabegcbmf/reviews';
  const FIREFOX_REVIEWS_URL =
    'https://addons.mozilla.org/en-US/firefox/addon/markdown-printer/reviews/';
  const EDGE_PRODUCT_URL =
    'https://microsoftedge.microsoft.com/addons/detail/mlmakmhfnkbabnhhcnekleemamhpnmgk';
  const ISSUES_URL = 'https://github.com/levz0r/markdown-printer/issues/new';

  function shouldShowRating(stats, rating, now) {
    const s = stats || {};
    const r = rating || {};
    const nowMs = (now instanceof Date ? now : new Date(now || Date.now())).getTime();
    if (r.status === 'done') {
      return false;
    }
    if (r.snoozedUntil && nowMs < r.snoozedUntil) {
      return false;
    }
    if ((s.saveCount || 0) < RATING_MIN_SAVES) {
      return false;
    }
    if (!s.installedAt) {
      return false;
    }
    const installedMs = new Date(s.installedAt).getTime();
    if (Number.isNaN(installedMs)) {
      return false;
    }
    if ((nowMs - installedMs) / MS_PER_DAY < RATING_MIN_DAYS) {
      return false;
    }
    return true;
  }

  // Pure detection from a user-agent string + Firefox `browser` global presence.
  // Pass `hasFirefoxGlobal = typeof browser !== 'undefined'` from the caller.
  function detectStore(userAgent, hasFirefoxGlobal) {
    const ua = userAgent || '';
    if (/Edg\//.test(ua)) {
      return 'edge';
    }
    if (hasFirefoxGlobal || /Firefox\//.test(ua)) {
      return 'firefox';
    }
    return 'chrome';
  }

  function storeReviewUrl(store) {
    switch (store) {
      case 'firefox':
        return FIREFOX_REVIEWS_URL;
      case 'edge':
        return EDGE_PRODUCT_URL;
      default:
        return CHROME_REVIEWS_URL;
    }
  }

  return {
    RATING_MIN_SAVES,
    RATING_MIN_DAYS,
    RATING_SNOOZE_DAYS,
    MS_PER_DAY,
    ISSUES_URL,
    shouldShowRating,
    detectStore,
    storeReviewUrl,
  };
});
