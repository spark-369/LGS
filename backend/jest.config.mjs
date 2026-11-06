// Jest configuration for the ESM backend.
//
// The API is authored as native ES modules ("type": "module") and every import
// uses an explicit `.js` extension, so Jest runs on Node's own module loader
// (the `--experimental-vm-modules` flag, see the `test` scripts in package.json)
// instead of going through Babel. The `.mjs` extension keeps this config itself
// unambiguously ESM.
export default {
  testEnvironment: 'node',
  // Native ESM: disable transforms so Jest uses Node's loader directly.
  transform: {},
  clearMocks: true,
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    // Boots the HTTP server + opens a MongoDB connection on import.
    '!src/server.js',
    // Thin wrapper around mongoose.connect — needs a live database.
    '!src/config/db.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  moduleFileExtensions: ['js', 'json'],
  verbose: true,
};
