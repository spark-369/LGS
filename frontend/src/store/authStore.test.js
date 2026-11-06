import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock the API layer so the store can be tested without axios or a network.
// `vi.hoisted` guarantees the spies + token holder exist before the mock
// factory runs.
// ---------------------------------------------------------------------------
const { authAPI, storage } = vi.hoisted(() => {
  const store = { token: null };
  return {
    storage: store,
    authAPI: {
      register: vi.fn(),
      login: vi.fn(),
      getMe: vi.fn(),
      refresh: vi.fn(),
    },
  };
});

vi.mock('../services/api', () => ({
  authAPI,
  tokenStorage: {
    get: () => storage.token,
    set: (t) => {
      storage.token = t;
    },
    clear: () => {
      storage.token = null;
    },
  },
  getErrorMessage: (error, fallback) => error?.response?.data?.message || fallback,
}));

const { default: useAuthStore } = await import('./authStore');

const resetStore = () => {
  useAuthStore.setState({
    user: null,
    token: null,
    initializing: false,
    loading: false,
    error: null,
  });
};

beforeEach(() => {
  localStorage.clear();
  storage.token = null;
  vi.clearAllMocks();
  resetStore();
});

describe('store/authStore', () => {
  describe('login', () => {
    it('stores token + user and returns success on valid credentials', async () => {
      authAPI.login.mockResolvedValueOnce({
        data: { token: 'jwt-1', user: { id: 'u1', email: 'a@b.com', name: 'Ada' } },
      });

      const result = await useAuthStore.getState().login('a@b.com', 'secret');

      expect(result).toEqual({ success: true });
      const state = useAuthStore.getState();
      expect(state.token).toBe('jwt-1');
      expect(state.user.email).toBe('a@b.com');
      expect(state.loading).toBe(false);
      expect(storage.token).toBe('jwt-1');
    });

    it('trims the email before sending it', async () => {
      authAPI.login.mockResolvedValueOnce({ data: { token: 't', user: {} } });
      await useAuthStore.getState().login('  a@b.com  ', 'secret');
      expect(authAPI.login).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' });
    });

    it('captures the error message and returns failure on rejection', async () => {
      authAPI.login.mockRejectedValueOnce({ response: { data: { message: 'Invalid email or password' } } });

      const result = await useAuthStore.getState().login('a@b.com', 'bad');

      expect(result).toEqual({ success: false, message: 'Invalid email or password' });
      expect(useAuthStore.getState().error).toBe('Invalid email or password');
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('register', () => {
    it('stores the session on success', async () => {
      authAPI.register.mockResolvedValueOnce({
        data: { token: 'jwt-2', user: { id: 'u2', email: 'new@b.com', name: 'Grace' } },
      });

      const result = await useAuthStore.getState().register('Grace', 'new@b.com', 'secret');

      expect(result).toEqual({ success: true });
      expect(useAuthStore.getState().token).toBe('jwt-2');
      expect(authAPI.register).toHaveBeenCalledWith({
        name: 'Grace',
        email: 'new@b.com',
        password: 'secret',
      });
    });

    it('returns a failure result on rejection', async () => {
      authAPI.register.mockRejectedValueOnce({ response: { data: { message: 'Email already registered' } } });
      const result = await useAuthStore.getState().register('Grace', 'dupe@b.com', 'secret');
      expect(result).toEqual({ success: false, message: 'Email already registered' });
    });
  });

  describe('initialize', () => {
    it('clears state immediately when there is no stored token', async () => {
      await useAuthStore.getState().initialize();
      const state = useAuthStore.getState();
      expect(state.initializing).toBe(false);
      expect(state.user).toBeNull();
      expect(authAPI.getMe).not.toHaveBeenCalled();
    });

    it('validates a stored token and hydrates the user', async () => {
      storage.token = 'persisted';
      authAPI.getMe.mockResolvedValueOnce({ data: { user: { id: 'u1', email: 'a@b.com' } } });

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.user.email).toBe('a@b.com');
      expect(state.token).toBe('persisted');
      expect(state.initializing).toBe(false);
    });

    it('drops an invalid token and falls back to anonymous', async () => {
      storage.token = 'expired';
      authAPI.getMe.mockRejectedValueOnce(new Error('401'));

      await useAuthStore.getState().initialize();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(storage.token).toBeNull();
    });
  });

  describe('logout & clearError', () => {
    it('logout clears the token, user and persisted state', async () => {
      authAPI.login.mockResolvedValueOnce({ data: { token: 't', user: { id: 'u1' } } });
      await useAuthStore.getState().login('a@b.com', 'secret');

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(storage.token).toBeNull();
    });

    it('clearError resets the error field', () => {
      useAuthStore.setState({ error: 'boom' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
