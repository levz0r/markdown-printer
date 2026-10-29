// Decides whether the page capture may click an element to expand it.
// Injected into the page before extractAndConvertToMarkdown (which can't
// import anything, since it is serialized by scripting.executeScript).
// Clicking a link or a submit button navigates the tab away mid-capture,
// which kills the capture script and loses the save. No DOM globals used
// here, so it stays testable in Node.
(function (root, factory) {
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = mod;
  } else {
    root.mdpExpandPolicy = mod;
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  function withoutHash(url) {
    return url.split('#')[0];
  }

  function isSafeLink(link, pageHref) {
    if (link.hasAttribute('download')) {
      return false;
    }
    const target = (link.getAttribute('target') || '').toLowerCase();
    if (target && target !== '_self') {
      return false;
    }
    let url;
    try {
      url = new URL(link.getAttribute('href') || '', pageHref);
    } catch (_e) {
      return false;
    }
    if (url.protocol === 'javascript:') {
      return true;
    }
    return withoutHash(url.href) === withoutHash(new URL(pageHref).href);
  }

  function submitsForm(el) {
    const tag = el.tagName;
    const type = (el.type || '').toLowerCase();
    const isSubmit =
      (tag === 'BUTTON' && type === 'submit') ||
      (tag === 'INPUT' && (type === 'submit' || type === 'image'));
    return isSubmit && !!(el.form || el.closest('form'));
  }

  function isSafeToExpand(el, pageHref) {
    if (!el) {
      return false;
    }
    const link = el.closest('a[href]');
    if (link && !isSafeLink(link, pageHref)) {
      return false;
    }
    return !submitsForm(el);
  }

  return { isSafeToExpand };
});
