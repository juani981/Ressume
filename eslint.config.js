import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'cypress/videos/**', 'cypress/screenshots/**'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        structuredClone: 'readonly',
        indexedDB: 'readonly',
        crypto: 'readonly',
        process: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        DOMParser: 'readonly',
        NodeFilter: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-empty': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Pre-existing tech debt: emoji/CJK regexes and legacy escapes — warn, fix incrementally
      'no-misleading-character-class': 'warn',
      'no-useless-escape': 'warn',
      'no-control-regex': 'warn',
    },
  },
  {
    files: ['src/tests/**', '**/*.test.{js,jsx}', '**/*.spec.{js,jsx}', 'cypress/**'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        cy: 'readonly',
        Cypress: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },
];
