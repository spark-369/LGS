// ESLint 9 flat config for the React frontend.
import reactPlugin from 'eslint-plugin-react';

export default [
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        alert: 'readonly',
        ResizeObserver: 'readonly',
      },
    },
    plugins: { react: reactPlugin },
    settings: { react: { version: 'detect' } },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$' }],
      'no-var': 'error',
      'prefer-const': 'warn',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
    },
  },
  {
    files: ['src/**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        // Vitest exposes these globally (globals: true in vitest.config.js).
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    plugins: { react: reactPlugin },
    settings: { react: { version: 'detect' } },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$' }],
      'react/jsx-uses-vars': 'error',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
];
