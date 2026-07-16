import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
};

export const circuitAPI = {
  getAll: (params) => api.get('/circuits', { params }),
  getPublic: () => api.get('/circuits/public'),
  getOne: (id) => api.get(`/circuits/${id}`),
  create: (data) => api.post('/circuits', data),
  update: (id, data) => api.put(`/circuits/${id}`, data),
  patch: (id, data) => api.patch(`/circuits/${id}`, data),
  delete: (id) => api.delete(`/circuits/${id}`),
  duplicate: (id) => api.post(`/circuits/${id}/duplicate`),
  togglePublic: (id) => api.patch(`/circuits/${id}/public`),
};

export default api;
