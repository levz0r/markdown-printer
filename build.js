#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

console.log(`Building Markdown Printer v${version}...`);

// Determine which builds to create
const args = process.argv.slice(2);
const buildChrome = args.length === 0 || args.includes('chrome');
const buildFirefox = args.length === 0 || args.includes('firefox');

// Common files to copy
const commonFiles = [
  'background.js',
  'popup.html',
  'popup.js',
  'turndown.js',
  'icon16.png',
  'icon48.png',
  'icon128.png',
];

// Manifest templates
const chromeManifest = {
  manifest_version: 3,
  name: 'Markdown Printer',
  version: version,
  description: 'Save web pages as Markdown files to your Downloads folder. No setup required!',
  author: 'Lev Gelfenbuim',
  homepage_url: 'https://github.com/levz0r/markdown-printer',
  permissions: ['activeTab', 'contextMenus', 'downloads', 'scripting'],
  background: {
    service_worker: 'background.js',
  },
  icons: {
    16: 'icon16.png',
    48: 'icon48.png',
    128: 'icon128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: {
      16: 'icon16.png',
      48: 'icon48.png',
      128: 'icon128.png',
    },
  },
};

const firefoxManifest = {
  ...chromeManifest,
  browser_specific_settings: {
    gecko: {
      id: 'markdown-printer@lev.engineer',
      strict_min_version: '121.0',
      data_collection_permissions: {
        required: ['none'],
      },
    },
  },
  background: {
    scripts: ['background.js'],
  },
};

// Function to ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Function to copy files
function copyFiles(sourceDir, destDir, files) {
  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);

    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`  ✓ Copied ${file}`);
    } else {
      console.warn(`  ⚠ Warning: ${file} not found in ${sourceDir}`);
    }
  });
}

// Function to create zip package
function createZip(sourceDir, outputName) {
  try {
    const command = `cd ${sourceDir} && zip -r ../${outputName} . -x "*.DS_Store"`;
    execSync(command, { stdio: 'inherit' });
    console.log(`  ✓ Created ${outputName}`);
  } catch (error) {
    console.error(`  ✗ Failed to create ${outputName}:`, error.message);
  }
}

// Build Chrome version
if (buildChrome) {
  console.log('\n📦 Building Chrome version...');
  const chromeDir = 'extension-chrome';
  ensureDir(chromeDir);

  // Use existing files or copy from a source
  const sourceDir = fs.existsSync(chromeDir) ? chromeDir : 'extension-firefox';
  if (sourceDir !== chromeDir) {
    copyFiles(sourceDir, chromeDir, commonFiles);
  }

  // Write manifest
  fs.writeFileSync(path.join(chromeDir, 'manifest.json'), JSON.stringify(chromeManifest, null, 2));
  console.log('  ✓ Updated manifest.json');

  // Create dist directory
  ensureDir('dist');

  // Create zip package
  createZip(chromeDir, `dist/markdown-printer-chrome-v${version}.zip`);
}

// Build Firefox version
if (buildFirefox) {
  console.log('\n🦊 Building Firefox version...');
  const firefoxDir = 'extension-firefox';
  ensureDir(firefoxDir);

  // Use existing files or copy from a source
  const sourceDir = fs.existsSync(firefoxDir) ? firefoxDir : 'extension-chrome';
  if (sourceDir !== firefoxDir) {
    copyFiles(sourceDir, firefoxDir, commonFiles);
  }

  // Write manifest
  fs.writeFileSync(
    path.join(firefoxDir, 'manifest.json'),
    JSON.stringify(firefoxManifest, null, 2)
  );
  console.log('  ✓ Updated manifest.json');

  // Create dist directory
  ensureDir('dist');

  // Create zip package
  createZip(firefoxDir, `dist/markdown-printer-firefox-v${version}.zip`);
}

console.log('\n✅ Build complete!\n');
console.log('📦 Packages created in dist/ directory');
console.log(`   Version: ${version}`);
if (buildChrome) {
  console.log(`   - markdown-printer-chrome-v${version}.zip`);
}
if (buildFirefox) {
  console.log(`   - markdown-printer-firefox-v${version}.zip`);
}
console.log('\nTo bump version and rebuild:');
console.log('  npm run version:patch   # 1.0.0 -> 1.0.1');
console.log('  npm run version:minor   # 1.0.0 -> 1.1.0');
console.log('  npm run version:major   # 1.0.0 -> 2.0.0');
