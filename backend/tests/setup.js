// ---------------------------------------------------------------------------
// Global test environment.
//
// Loaded before every test file (see `setupFiles` in jest.config.js) so modules
// that read configuration at import time — JWT signing, CORS origin, the error
// handler's development checks — see deterministic values.
// ---------------------------------------------------------------------------

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jest';
process.env.JWT_EXPIRE = '1h';
process.env.CLIENT_URL = 'http://localhost:5173';
