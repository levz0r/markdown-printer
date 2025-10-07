const fs = require('fs');
const path = require('path');

describe('Manifest Validation', () => {
  let chromeManifest;
  let firefoxManifest;
  let packageJson;

  beforeAll(() => {
    chromeManifest = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../extension-chrome/manifest.json'), 'utf8')
    );
    firefoxManifest = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../extension-firefox/manifest.json'), 'utf8')
    );
    packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
    );
  });

  describe('Version Consistency', () => {
    test('Chrome manifest version matches package.json', () => {
      expect(chromeManifest.version).toBe(packageJson.version);
    });

    test('Firefox manifest version matches package.json', () => {
      expect(firefoxManifest.version).toBe(packageJson.version);
    });

    test('version follows semver format', () => {
      const semverRegex = /^\d+\.\d+\.\d+$/;
      expect(packageJson.version).toMatch(semverRegex);
    });
  });

  describe('Common Fields', () => {
    test('both manifests have same name', () => {
      expect(chromeManifest.name).toBe(firefoxManifest.name);
      expect(chromeManifest.name).toBe('Markdown Printer');
    });

    test('both manifests have same description', () => {
      expect(chromeManifest.description).toBe(firefoxManifest.description);
    });

    test('both manifests use Manifest V3', () => {
      expect(chromeManifest.manifest_version).toBe(3);
      expect(firefoxManifest.manifest_version).toBe(3);
    });

    test('both manifests have same permissions', () => {
      expect(chromeManifest.permissions).toEqual(firefoxManifest.permissions);
      expect(chromeManifest.permissions).toEqual([
        'activeTab',
        'contextMenus',
        'downloads',
        'scripting'
      ]);
    });

    test('both manifests have same author', () => {
      expect(chromeManifest.author).toBe('Lev Gelfenbuim');
      expect(firefoxManifest.author).toBe('Lev Gelfenbuim');
    });

    test('both manifests have same homepage_url', () => {
      expect(chromeManifest.homepage_url).toBe('https://github.com/levz0r/markdown-printer');
      expect(firefoxManifest.homepage_url).toBe('https://github.com/levz0r/markdown-printer');
    });
  });

  describe('Icons', () => {
    test('both manifests have required icon sizes', () => {
      const expectedSizes = ['16', '48', '128'];

      expectedSizes.forEach(size => {
        expect(chromeManifest.icons).toHaveProperty(size);
        expect(firefoxManifest.icons).toHaveProperty(size);
      });
    });

    test('icon files exist', () => {
      const chromeIconPath = path.join(__dirname, '../extension-chrome');
      const firefoxIconPath = path.join(__dirname, '../extension-firefox');

      ['icon16.png', 'icon48.png', 'icon128.png'].forEach(icon => {
        expect(fs.existsSync(path.join(chromeIconPath, icon))).toBe(true);
        expect(fs.existsSync(path.join(firefoxIconPath, icon))).toBe(true);
      });
    });
  });

  describe('Chrome-Specific Fields', () => {
    test('has service_worker background', () => {
      expect(chromeManifest.background).toHaveProperty('service_worker');
      expect(chromeManifest.background.service_worker).toBe('background.js');
    });

    test('does not have browser_specific_settings', () => {
      expect(chromeManifest.browser_specific_settings).toBeUndefined();
    });

    test('has action with popup', () => {
      expect(chromeManifest.action).toHaveProperty('default_popup');
      expect(chromeManifest.action.default_popup).toBe('popup.html');
    });
  });

  describe('Firefox-Specific Fields', () => {
    test('has scripts background', () => {
      expect(firefoxManifest.background).toHaveProperty('scripts');
      expect(firefoxManifest.background.scripts).toEqual(['background.js']);
    });

    test('has browser_specific_settings', () => {
      expect(firefoxManifest.browser_specific_settings).toBeDefined();
      expect(firefoxManifest.browser_specific_settings.gecko).toBeDefined();
    });

    test('has extension ID', () => {
      expect(firefoxManifest.browser_specific_settings.gecko.id).toBe('markdown-printer@lev.engineer');
    });

    test('has minimum Firefox version', () => {
      expect(firefoxManifest.browser_specific_settings.gecko.strict_min_version).toBe('121.0');
    });

    test('has data collection permissions', () => {
      expect(firefoxManifest.browser_specific_settings.gecko.data_collection_permissions).toEqual({
        required: ['none']
      });
    });
  });

  describe('Required Files', () => {
    test('Chrome extension has all required files', () => {
      const chromeDir = path.join(__dirname, '../extension-chrome');
      const requiredFiles = [
        'manifest.json',
        'background.js',
        'popup.html',
        'popup.js',
        'turndown.js',
        'icon16.png',
        'icon48.png',
        'icon128.png'
      ];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(path.join(chromeDir, file))).toBe(true);
      });
    });

    test('Firefox extension has all required files', () => {
      const firefoxDir = path.join(__dirname, '../extension-firefox');
      const requiredFiles = [
        'manifest.json',
        'background.js',
        'popup.html',
        'popup.js',
        'turndown.js',
        'icon16.png',
        'icon48.png',
        'icon128.png'
      ];

      requiredFiles.forEach(file => {
        expect(fs.existsSync(path.join(firefoxDir, file))).toBe(true);
      });
    });
  });
});
