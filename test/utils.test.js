const { sanitizeFilename } = require('../utils');

describe('sanitizeFilename', () => {
  describe('special character removal', () => {
    test('removes invalid filename characters', () => {
      expect(sanitizeFilename('Test<>:"/\\|?*File')).toBe('Test-File');
    });

    test('replaces colon with hyphen', () => {
      expect(sanitizeFilename('Test: File')).toBe('Test-File');
    });

    test('removes question marks', () => {
      expect(sanitizeFilename('What? Where?')).toBe('What-Where-');
    });

    test('removes asterisks', () => {
      expect(sanitizeFilename('File*.txt')).toBe('File-.txt');
    });
  });

  describe('whitespace handling', () => {
    test('replaces single space with hyphen', () => {
      expect(sanitizeFilename('Test File')).toBe('Test-File');
    });

    test('replaces multiple spaces with single hyphen', () => {
      expect(sanitizeFilename('Test    File')).toBe('Test-File');
    });

    test('replaces tabs with hyphen', () => {
      expect(sanitizeFilename('Test\tFile')).toBe('Test-File');
    });

    test('replaces newlines with hyphen', () => {
      expect(sanitizeFilename('Test\nFile')).toBe('Test-File');
    });
  });

  describe('hyphen collapsing', () => {
    test('collapses multiple hyphens into one', () => {
      expect(sanitizeFilename('Test---File')).toBe('Test-File');
    });

    test('collapses hyphens from special chars and spaces', () => {
      expect(sanitizeFilename('Test: File?')).toBe('Test-File-');
    });
  });

  describe('length truncation', () => {
    test('truncates to 200 characters', () => {
      const longName = 'a'.repeat(250);
      expect(sanitizeFilename(longName)).toHaveLength(200);
    });

    test('preserves short filenames', () => {
      expect(sanitizeFilename('short.md')).toBe('short.md');
    });

    test('exactly 200 characters is unchanged', () => {
      const exactName = 'a'.repeat(200);
      expect(sanitizeFilename(exactName)).toHaveLength(200);
    });
  });

  describe('edge cases', () => {
    test('handles empty string', () => {
      expect(sanitizeFilename('')).toBe('');
    });

    test('handles string with only special characters', () => {
      expect(sanitizeFilename('???')).toBe('-');
    });

    test('handles filename with extension', () => {
      expect(sanitizeFilename('My Document.md')).toBe('My-Document.md');
    });

    test('preserves periods in filename', () => {
      expect(sanitizeFilename('file.name.md')).toBe('file.name.md');
    });

    test('handles unicode characters', () => {
      expect(sanitizeFilename('Test 文件')).toBe('Test-文件');
    });

    test('handles emojis', () => {
      expect(sanitizeFilename('Test 🎉 File')).toBe('Test-🎉-File');
    });
  });

  describe('real-world examples', () => {
    test('handles typical page title', () => {
      expect(sanitizeFilename('Getting Started Guide')).toBe('Getting-Started-Guide');
    });

    test('handles URL-like filename', () => {
      expect(sanitizeFilename('https://example.com/page')).toBe('https-example.com-page');
    });

    test('handles dates in filename', () => {
      expect(sanitizeFilename('Report 2025-01-15')).toBe('Report-2025-01-15');
    });

    test('handles filename with quotes', () => {
      expect(sanitizeFilename('The "Best" Guide')).toBe('The-Best-Guide');
    });
  });
});
