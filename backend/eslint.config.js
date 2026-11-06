// ESLint 9 flat config — no extra plugins required.
export default [
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^next$' }],
      'no-var': 'error',
      'prefer-const': 'warn',
      eqeqeq: ['warn', 'smart'],
    },
  },
  {
    ignores: ['node_modules/**', 'coverage/**'],
  },
];
