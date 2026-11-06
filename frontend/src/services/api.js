import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'lgs.token';

// ---------------------------------------------------------------------------
// Token storage — a single place so the interceptor, store and logout all
// agree on the key. Wrapped in try/catch because Safari private mode throws.
// ---------------------------------------------------------------------------
export const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Callback registered by the auth layer. Fired on a *genuine* session expiry so
// the app can react with router navigation instead of a full page reload.
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    // A 401 from the login/register endpoints is a credential failure, not an
    // expired session — never treat it as a logout.
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthAttempt) {
      tokenStorage.clear();
      if (onUnauthorized) onUnauthorized();
    }

    return Promise.reject(error);
  }
);

/** Normalise an axios error into a human-readable message. */
export const getErrorMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback;

/** Normalise a validation error into a { field: message } map. */
export const getFieldErrors = (error) => {
  const list = error?.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return list.reduce((acc, item) => {
    if (item?.field) acc[item.field] = item.message;
    return acc;
  }, {});
};

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
};

export const circuitAPI = {
  getAll: (params) => api.get('/circuits', { params }),
  getPublic: (params) => api.get('/circuits/public', { params }),
  getOne: (id) => api.get(`/circuits/${id}`),
  create: (data) => api.post('/circuits', data),
  update: (id, data) => api.put(`/circuits/${id}`, data),
  delete: (id) => api.delete(`/circuits/${id}`),
  duplicate: (id) => api.post(`/circuits/${id}/duplicate`),
  togglePublic: (id, isPublic) => api.patch(`/circuits/${id}/public`, { isPublic }),
  simulate: (id) => api.post(`/circuits/${id}/simulate`),
};

export const healthAPI = {
  check: () => api.get('/health/health'),
  meta: () => api.get('/health/meta'),
};

export default api;

