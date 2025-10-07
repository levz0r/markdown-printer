const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Build Validation', () => {
  const distDir = path.join(__dirname, '../dist');
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
  );
  const version = packageJson.version;

  // Run build before tests
  beforeAll(() => {
    // Ensure dist directory exists (build.js creates it)
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
  });

  describe('Build Script', () => {
    test('build.js exists and is executable', () => {
      const buildScript = path.join(__dirname, '../build.js');
      expect(fs.existsSync(buildScript)).toBe(true);

      // Check if it's executable (has shebang)
      const content = fs.readFileSync(buildScript, 'utf8');
      expect(content.startsWith('#!/usr/bin/env node')).toBe(true);
    });

    test('build.js reads version from package.json', () => {
      const buildScript = fs.readFileSync(path.join(__dirname, '../build.js'), 'utf8');
      expect(buildScript).toContain('packageJson.version');
    });

    test('build script can be executed', () => {
      expect(() => {
        execSync('node build.js', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      }).not.toThrow();
    });
  });

  describe('Dist Directory', () => {
    test('dist directory is created', () => {
      expect(fs.existsSync(distDir)).toBe(true);
    });

    test('Chrome package exists with correct name', () => {
      const chromePkg = path.join(distDir, `markdown-printer-chrome-v${version}.zip`);
      expect(fs.existsSync(chromePkg)).toBe(true);
    });

    test('Firefox package exists with correct name', () => {
      const firefoxPkg = path.join(distDir, `markdown-printer-firefox-v${version}.zip`);
      expect(fs.existsSync(firefoxPkg)).toBe(true);
    });

    test('packages are not empty', () => {
      const chromePkg = path.join(distDir, `markdown-printer-chrome-v${version}.zip`);
      const firefoxPkg = path.join(distDir, `markdown-printer-firefox-v${version}.zip`);

      const chromeStat = fs.statSync(chromePkg);
      const firefoxStat = fs.statSync(firefoxPkg);

      expect(chromeStat.size).toBeGreaterThan(1000); // At least 1KB
      expect(firefoxStat.size).toBeGreaterThan(1000); // At least 1KB
    });

    test('packages are under size limit', () => {
      const chromePkg = path.join(distDir, `markdown-printer-chrome-v${version}.zip`);
      const firefoxPkg = path.join(distDir, `markdown-printer-firefox-v${version}.zip`);

      const chromeStat = fs.statSync(chromePkg);
      const firefoxStat = fs.statSync(firefoxPkg);

      const maxSize = 200 * 1024 * 1024; // 200MB limit
      expect(chromeStat.size).toBeLessThan(maxSize);
      expect(firefoxStat.size).toBeLessThan(maxSize);
    });
  });

  describe('Manifest Updates', () => {
    test('Chrome manifest has correct version', () => {
      const chromeManifest = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../extension-chrome/manifest.json'), 'utf8')
      );
      expect(chromeManifest.version).toBe(version);
    });

    test('Firefox manifest has correct version', () => {
      const firefoxManifest = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../extension-firefox/manifest.json'), 'utf8')
      );
      expect(firefoxManifest.version).toBe(version);
    });
  });

  describe('File Exclusions', () => {
    test('no .DS_Store files in extensions', () => {
      const chromeDSStore = path.join(__dirname, '../extension-chrome/.DS_Store');
      const firefoxDSStore = path.join(__dirname, '../extension-firefox/.DS_Store');

      expect(fs.existsSync(chromeDSStore)).toBe(false);
      expect(fs.existsSync(firefoxDSStore)).toBe(false);
    });

    test('.gitignore includes dist directory', () => {
      const gitignore = fs.readFileSync(path.join(__dirname, '../.gitignore'), 'utf8');
      expect(gitignore).toContain('dist/');
    });

    test('.gitignore includes zip files', () => {
      const gitignore = fs.readFileSync(path.join(__dirname, '../.gitignore'), 'utf8');
      expect(gitignore).toContain('*.zip');
    });
  });

  describe('Package.json Scripts', () => {
    test('has build script', () => {
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts.build).toBe('node build.js');
    });

    test('has build:chrome script', () => {
      expect(packageJson.scripts).toHaveProperty('build:chrome');
      expect(packageJson.scripts['build:chrome']).toBe('node build.js chrome');
    });

    test('has build:firefox script', () => {
      expect(packageJson.scripts).toHaveProperty('build:firefox');
      expect(packageJson.scripts['build:firefox']).toBe('node build.js firefox');
    });

    test('has version bump scripts', () => {
      expect(packageJson.scripts).toHaveProperty('version:patch');
      expect(packageJson.scripts).toHaveProperty('version:minor');
      expect(packageJson.scripts).toHaveProperty('version:major');
    });
  });
});
