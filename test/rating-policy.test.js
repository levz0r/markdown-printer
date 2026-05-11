const {
  RATING_MIN_SAVES,
  RATING_MIN_DAYS,
  MS_PER_DAY,
  ISSUES_URL,
  shouldShowRating,
  detectStore,
  storeReviewUrl,
} = require('../src/rating-policy');

function daysAgo(days) {
  return new Date(Date.now() - days * MS_PER_DAY).toISOString();
}

describe('rating-policy', () => {
  describe('shouldShowRating', () => {
    const now = new Date('2026-05-11T12:00:00Z');
    const eligibleStats = {
      installedAt: new Date(now.getTime() - 10 * MS_PER_DAY).toISOString(),
      saveCount: RATING_MIN_SAVES,
    };

    test('shows when thresholds met and no prior status', () => {
      expect(shouldShowRating(eligibleStats, {}, now)).toBe(true);
    });

    test('hides when below save threshold', () => {
      const stats = { ...eligibleStats, saveCount: RATING_MIN_SAVES - 1 };
      expect(shouldShowRating(stats, {}, now)).toBe(false);
    });

    test('hides when below day threshold', () => {
      const stats = {
        installedAt: new Date(now.getTime() - (RATING_MIN_DAYS - 1) * MS_PER_DAY).toISOString(),
        saveCount: RATING_MIN_SAVES + 5,
      };
      expect(shouldShowRating(stats, {}, now)).toBe(false);
    });

    test('hides when status is done', () => {
      expect(shouldShowRating(eligibleStats, { status: 'done' }, now)).toBe(false);
    });

    test('hides while snooze is active', () => {
      const snoozedUntil = now.getTime() + 5 * MS_PER_DAY;
      expect(shouldShowRating(eligibleStats, { snoozedUntil }, now)).toBe(false);
    });

    test('shows again after snooze expires', () => {
      const snoozedUntil = now.getTime() - MS_PER_DAY;
      expect(shouldShowRating(eligibleStats, { status: 'snoozed', snoozedUntil }, now)).toBe(true);
    });

    test('hides when installedAt is missing', () => {
      const stats = { saveCount: 99 };
      expect(shouldShowRating(stats, {}, now)).toBe(false);
    });

    test('hides when installedAt is unparseable', () => {
      const stats = { installedAt: 'not-a-date', saveCount: 99 };
      expect(shouldShowRating(stats, {}, now)).toBe(false);
    });

    test('tolerates null/undefined inputs', () => {
      expect(shouldShowRating(null, null, now)).toBe(false);
      expect(shouldShowRating(undefined, undefined, now)).toBe(false);
    });

    test('uses Date.now() when no `now` is passed', () => {
      const stats = { installedAt: daysAgo(10), saveCount: RATING_MIN_SAVES };
      expect(shouldShowRating(stats, {})).toBe(true);
    });

    test('done status wins over expired snooze', () => {
      const snoozedUntil = now.getTime() - MS_PER_DAY;
      expect(shouldShowRating(eligibleStats, { status: 'done', snoozedUntil }, now)).toBe(false);
    });
  });

  describe('detectStore', () => {
    test('detects Edge from UA token', () => {
      expect(
        detectStore(
          'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/120.0 Safari/537.36 Edg/120.0',
          false
        )
      ).toBe('edge');
    });

    test('Edge wins even when hasFirefoxGlobal is true', () => {
      // Defensive: shouldn't happen in practice, but make precedence explicit.
      expect(detectStore('Mozilla/5.0 Chrome/120 Edg/120', true)).toBe('edge');
    });

    test('detects Firefox from `browser` global', () => {
      expect(detectStore('Mozilla/5.0 (X11) Gecko/20100101 Firefox/121.0', true)).toBe('firefox');
    });

    test('detects Firefox from UA when global is absent', () => {
      expect(detectStore('Mozilla/5.0 (X11) Gecko/20100101 Firefox/121.0', false)).toBe('firefox');
    });

    test('defaults to chrome on plain Chrome UA', () => {
      expect(detectStore('Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0 Safari/537.36', false)).toBe(
        'chrome'
      );
    });

    test('defaults to chrome on empty UA', () => {
      expect(detectStore('', false)).toBe('chrome');
      expect(detectStore(undefined, false)).toBe('chrome');
    });
  });

  describe('storeReviewUrl', () => {
    test('returns Firefox reviews URL', () => {
      expect(storeReviewUrl('firefox')).toMatch(/addons\.mozilla\.org/);
      expect(storeReviewUrl('firefox')).toMatch(/reviews/);
    });

    test('returns Edge product URL', () => {
      expect(storeReviewUrl('edge')).toMatch(/microsoftedge\.microsoft\.com/);
    });

    test('returns Chrome reviews URL for "chrome"', () => {
      expect(storeReviewUrl('chrome')).toMatch(/chromewebstore\.google\.com/);
      expect(storeReviewUrl('chrome')).toMatch(/reviews/);
    });

    test('defaults to Chrome reviews URL for unknown store', () => {
      expect(storeReviewUrl('something-else')).toMatch(/chromewebstore\.google\.com/);
    });
  });

  describe('ISSUES_URL', () => {
    test('points at the repo issues page', () => {
      expect(ISSUES_URL).toBe('https://github.com/levz0r/markdown-printer/issues/new');
    });
  });
});
