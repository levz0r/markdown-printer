module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'pnpm-lock.yaml',
      '**/*.zip',
      '**/.DS_Store',
      '**/turndown.js',
      'native-host/**',
      'extension-pro/**',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Promise: 'readonly',
        // Web Extension APIs
        chrome: 'readonly',
        browser: 'readonly',
        TurndownService: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-console': 'off', // Console is used for debugging in extensions
      'no-undef': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
  },
  {
    files: ['build.js', 'utils.js', 'test/**/*.js', 'eslint.config.js', 'jest.config.js'],
    languageOptions: {
      globals: {
        // Node.js globals
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        exports: 'readonly',
      },
    },
  },
];
