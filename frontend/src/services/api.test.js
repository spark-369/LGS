import { describe, it, expect, vi, beforeEach } from 'vitest';

// `vi.hoisted` runs before any import (including the mocked axios) so these spies
// are guaranteed to exist when the mock factory + the api module are evaluated.
const mocks = vi.hoisted(() => ({
  requestUse: vi.fn(),
  responseUse: vi.fn(),
  post: vi.fn(() => Promise.resolve({ data: {} })),
  get: vi.fn(() => Promise.resolve({ data: {} })),
  put: vi.fn(() => Promise.resolve({ data: {} })),
  patch: vi.fn(() => Promise.resolve({ data: {} })),
  del: vi.fn(() => Promise.resolve({ data: {} })),
}));

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: mocks.requestUse },
        response: { use: mocks.responseUse },
      },
      post: mocks.post,
      get: mocks.get,
      put: mocks.put,
      patch: mocks.patch,
      delete: mocks.del,
    })),
  },
}));

const { post, get, put, patch, del } = mocks;

const {
  tokenStorage,
  getErrorMessage,
  getFieldErrors,
  setUnauthorizedHandler,
  authAPI,
  circuitAPI,
  healthAPI,
} = await import('./api');

// Capture the interceptor callbacks NOW (they are registered once at import
// time). Capturing before any `clearAllMocks()` avoids losing the reference.
const requestHandler = mocks.requestUse.mock.calls[0][0];
const responseRejected = mocks.responseUse.mock.calls[0][1];

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('services/api · tokenStorage', () => {
  it('stores, reads and clears the token under the lgs.token key', () => {
    expect(tokenStorage.get()).toBeNull();
    tokenStorage.set('abc123');
    expect(localStorage.getItem('lgs.token')).toBe('abc123');
    expect(tokenStorage.get()).toBe('abc123');
    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
  });
});

describe('services/api · request interceptor', () => {
  it('attaches the bearer token when one is stored', () => {
    tokenStorage.set('token-xyz');
    const config = requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer token-xyz');
  });

  it('adds no Authorization header when there is no token', () => {
    const config = requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe('services/api · response interceptor', () => {
  it('clears the token and fires the handler on a 401 session expiry', () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    tokenStorage.set('stale');

    const error = { response: { status: 401 }, config: { url: '/circuits' } };
    return responseRejected(error).catch(() => {
      expect(tokenStorage.get()).toBeNull();
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
    });
  });

  it('does NOT treat a 401 from login/register as a session expiry', () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    tokenStorage.set('keep-me');

    const error = { response: { status: 401 }, config: { url: '/auth/login' } };
    return responseRejected(error).catch(() => {
      expect(tokenStorage.get()).toBe('keep-me');
      expect(onUnauthorized).not.toHaveBeenCalled();
    });
  });
});


describe('services/api · error helpers', () => {
  it('getErrorMessage prefers the API message then the fallback', () => {
    expect(getErrorMessage({ response: { data: { message: 'Bad input' } } })).toBe('Bad input');
    expect(getErrorMessage({ message: 'Network down' })).toBe('Network down');
    expect(getErrorMessage({}, 'Fallback')).toBe('Fallback');
  });

  it('getFieldErrors reduces the errors array to a { field: message } map', () => {
    const error = {
      response: {
        data: {
          errors: [
            { field: 'email', message: 'Invalid' },
            { field: 'name', message: 'Too short' },
            { message: 'orphan' }, // ignored — no field
          ],
        },
      },
    };
    expect(getFieldErrors(error)).toEqual({ email: 'Invalid', name: 'Too short' });
    expect(getFieldErrors({})).toEqual({});
  });
});

describe('services/api · endpoint surface', () => {
  it('authAPI targets the /auth routes', () => {
    authAPI.register({});
    authAPI.login({});
    authAPI.getMe();
    authAPI.refresh();
    expect(post).toHaveBeenCalledWith('/auth/register', {});
    expect(post).toHaveBeenCalledWith('/auth/login', {});
    expect(get).toHaveBeenCalledWith('/auth/me');
    expect(post).toHaveBeenCalledWith('/auth/refresh');
  });

  it('circuitAPI targets the /circuits routes with ids and params', () => {
    circuitAPI.getAll({ page: 1 });
    circuitAPI.getPublic({ search: 'alu' });
    circuitAPI.getOne('id1');
    circuitAPI.create({ name: 'x' });
    circuitAPI.update('id1', { name: 'x' });
    circuitAPI.delete('id1');
    circuitAPI.duplicate('id1');
    circuitAPI.togglePublic('id1', true);
    circuitAPI.simulate('id1');

    expect(get).toHaveBeenCalledWith('/circuits', { params: { page: 1 } });
    expect(get).toHaveBeenCalledWith('/circuits/public', { params: { search: 'alu' } });
    expect(get).toHaveBeenCalledWith('/circuits/id1');
    expect(post).toHaveBeenCalledWith('/circuits', { name: 'x' });
    expect(put).toHaveBeenCalledWith('/circuits/id1', { name: 'x' });
    expect(post).toHaveBeenCalledWith('/circuits/id1/duplicate');
    expect(post).toHaveBeenCalledWith('/circuits/id1/simulate');
    expect(patch).toHaveBeenCalledWith('/circuits/id1/public', { isPublic: true });
    expect(del).toHaveBeenCalledWith('/circuits/id1');
  });

  it('healthAPI targets the health routes', () => {
    healthAPI.check();
    healthAPI.meta();
    expect(get).toHaveBeenCalledWith('/health/health');
    expect(get).toHaveBeenCalledWith('/health/meta');
  });
});
