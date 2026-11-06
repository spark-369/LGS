import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest configuration for the React frontend.
//
// Mirrors the plugin setup from vite.config.js so JSX transforms and MUI/test
// tooling resolve the same way they do in the real build, and runs the component
// tests against a jsdom environment.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    // React Flow + MUI ship large chunks; give slow CI machines room.
    testTimeout: 20_000,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        'src/main.jsx',
        'src/setupTests.js',
        'src/**/*.css',
      ],
    },
  },
});
