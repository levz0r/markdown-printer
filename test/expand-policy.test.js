const { isSafeToExpand } = require('../src/expand-policy');

const PAGE = 'https://example.com/docs/page?x=1';

// Minimal stand-in for a DOM element: enough of closest()/getAttribute()
// for the policy, without pulling in a DOM implementation.
function el(tagName, attrs = {}, parent = null) {
  const node = {
    tagName: tagName.toUpperCase(),
    parent,
    attrs,
    getAttribute: name => (name in attrs ? attrs[name] : null),
    hasAttribute: name => name in attrs,
    closest(selector) {
      const [, tag, attr] = selector.match(/^(\w+)(?:\[(\w+)\])?$/);
      for (let n = node; n; n = n.parent) {
        if (n.tagName === tag.toUpperCase() && (!attr || n.hasAttribute(attr))) {
          return n;
        }
      }
      return null;
    },
  };
  if (node.tagName === 'BUTTON') {
    node.type = (attrs.type || 'submit').toLowerCase();
  }
  if (node.tagName === 'INPUT') {
    node.type = (attrs.type || 'text').toLowerCase();
  }
  return node;
}

describe('isSafeToExpand', () => {
  test('allows plain toggle buttons and divs', () => {
    expect(isSafeToExpand(el('button', { type: 'button' }), PAGE)).toBe(true);
    expect(isSafeToExpand(el('div', { class: 'accordion' }), PAGE)).toBe(true);
  });

  test('allows a button outside any form even without a type', () => {
    expect(isSafeToExpand(el('button'), PAGE)).toBe(true);
  });

  test('refuses a link to another page (menu with aria-expanded)', () => {
    expect(isSafeToExpand(el('a', { href: '/services/' }), PAGE)).toBe(false);
    expect(isSafeToExpand(el('a', { href: 'https://other.example/' }), PAGE)).toBe(false);
  });

  test('refuses an element nested inside a link to another page', () => {
    const link = el('a', { href: '/services/' });
    expect(isSafeToExpand(el('span', {}, link), PAGE)).toBe(false);
  });

  test('refuses the same path with a different query string', () => {
    expect(isSafeToExpand(el('a', { href: '/docs/page?x=2' }), PAGE)).toBe(false);
  });

  test('allows same-page fragment links', () => {
    expect(isSafeToExpand(el('a', { href: '#section-2' }), PAGE)).toBe(true);
    expect(isSafeToExpand(el('a', { href: '/docs/page?x=1#faq' }), PAGE)).toBe(true);
    expect(isSafeToExpand(el('a', { href: '' }), PAGE)).toBe(true);
  });

  test('allows javascript: pseudo-links used as toggles', () => {
    expect(isSafeToExpand(el('a', { href: 'javascript:void(0)' }), PAGE)).toBe(true);
  });

  test('refuses links that open a new tab or download', () => {
    expect(isSafeToExpand(el('a', { href: '#x', target: '_blank' }), PAGE)).toBe(false);
    expect(isSafeToExpand(el('a', { href: '#x', download: '' }), PAGE)).toBe(false);
  });

  test('allows links that explicitly target the same frame', () => {
    expect(isSafeToExpand(el('a', { href: '#x', target: '_self' }), PAGE)).toBe(true);
  });

  test('refuses buttons that would submit a form', () => {
    const form = el('form');
    expect(isSafeToExpand(el('button', {}, form), PAGE)).toBe(false);
    expect(isSafeToExpand(el('button', { type: 'submit' }, form), PAGE)).toBe(false);
    expect(isSafeToExpand(el('input', { type: 'submit' }, form), PAGE)).toBe(false);
    expect(isSafeToExpand(el('input', { type: 'image' }, form), PAGE)).toBe(false);
  });

  test('allows type="button" inside a form', () => {
    const form = el('form');
    expect(isSafeToExpand(el('button', { type: 'button' }, form), PAGE)).toBe(true);
  });

  test('refuses links with an unparseable href', () => {
    expect(isSafeToExpand(el('a', { href: 'http://[bad' }), PAGE)).toBe(false);
  });

  test('refuses missing elements', () => {
    expect(isSafeToExpand(null, PAGE)).toBe(false);
  });
});
