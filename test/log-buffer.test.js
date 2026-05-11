const { stringifyArg, formatArgs, appendBounded } = require('../src/log-buffer');

describe('log-buffer', () => {
  describe('stringifyArg', () => {
    test('renders Error with name, message, and stack', () => {
      const err = new Error('boom');
      const out = stringifyArg(err);
      expect(out.startsWith('Error: boom')).toBe(true);
      expect(out).toContain('\n');
    });

    test('renders Error without stack when missing', () => {
      const err = new Error('boom');
      delete err.stack;
      expect(stringifyArg(err)).toBe('Error: boom');
    });

    test('JSON-stringifies plain objects', () => {
      expect(stringifyArg({ a: 1, b: 'x' })).toBe('{"a":1,"b":"x"}');
    });

    test('falls back to String() for non-serializable objects', () => {
      const cyclic = {};
      cyclic.self = cyclic;
      expect(stringifyArg(cyclic)).toBe('[object Object]');
    });

    test('passes primitives through String()', () => {
      expect(stringifyArg(42)).toBe('42');
      expect(stringifyArg('hello')).toBe('hello');
      expect(stringifyArg(null)).toBe('null');
      expect(stringifyArg(undefined)).toBe('undefined');
      expect(stringifyArg(true)).toBe('true');
    });
  });

  describe('formatArgs', () => {
    test('joins mixed arg types with spaces', () => {
      expect(formatArgs(['save failed:', new Error('nope'), { tabId: 7 }])).toMatch(
        /^save failed: Error: nope.*\{"tabId":7\}$/s
      );
    });

    test('returns empty string for no args', () => {
      expect(formatArgs([])).toBe('');
    });
  });

  describe('appendBounded', () => {
    test('appends when under capacity', () => {
      expect(appendBounded([1, 2], 3, 5)).toEqual([1, 2, 3]);
    });

    test('trims oldest entries when over capacity', () => {
      expect(appendBounded([1, 2, 3], 4, 3)).toEqual([2, 3, 4]);
    });

    test('handles empty initial log', () => {
      expect(appendBounded([], 'x', 5)).toEqual(['x']);
    });

    test('treats non-array log as empty', () => {
      expect(appendBounded(null, 'x', 5)).toEqual(['x']);
      expect(appendBounded(undefined, 'x', 5)).toEqual(['x']);
      expect(appendBounded('not an array', 'x', 5)).toEqual(['x']);
    });

    test('does not mutate input array', () => {
      const log = [1, 2, 3];
      appendBounded(log, 4, 3);
      expect(log).toEqual([1, 2, 3]);
    });

    test('keeps newest entry when max is 1', () => {
      expect(appendBounded([1, 2, 3], 4, 1)).toEqual([4]);
    });

    test('trims correctly when current log already exceeds max', () => {
      // Defensive case — if upstream changed MAX_ENTRIES downward.
      expect(appendBounded([1, 2, 3, 4, 5], 6, 3)).toEqual([4, 5, 6]);
    });
  });
});
