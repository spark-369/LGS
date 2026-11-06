import { create } from 'zustand';
import { authAPI, tokenStorage, getErrorMessage } from '../services/api';

const USER_KEY = 'lgs.user';

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistUser = (user) => {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
};

const useAuthStore = create((set) => ({
  user: readStoredUser(),
  token: tokenStorage.get(),
  // `initializing` covers the silent session-restore on first paint; `loading`
  // covers user-triggered submit actions.
  initializing: Boolean(tokenStorage.get()),
  loading: false,
  error: null,

  /** Validate any persisted token against the API on boot. */
  initialize: async () => {
    const token = tokenStorage.get();
    if (!token) {
      set({ initializing: false, user: null, token: null });
      return;
    }

    try {
      const { data } = await authAPI.getMe();
      persistUser(data.user);
      set({ user: data.user, token, initializing: false, error: null });
    } catch {
      tokenStorage.clear();
      persistUser(null);
      set({ token: null, user: null, initializing: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.login({ email: email.trim(), password });
      tokenStorage.set(data.token);
      persistUser(data.user);
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error, 'Login failed');
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.register({ name: name.trim(), email: email.trim(), password });
      tokenStorage.set(data.token);
      persistUser(data.user);
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (error) {
      const message = getErrorMessage(error, 'Registration failed');
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  logout: () => {
    tokenStorage.clear();
    persistUser(null);
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;

