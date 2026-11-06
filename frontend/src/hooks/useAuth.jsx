import { useEffect, useState, createContext, useContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [state, setState] = useState(() => {
    const s = useAuthStore.getState();
    return { user: s.user, token: s.token, initializing: s.initializing, loading: s.loading, error: s.error };
  });

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((s) =>
      setState({ user: s.user, token: s.token, initializing: s.initializing, loading: s.loading, error: s.error })
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  // Session expiry is handled by the API interceptor; react with the router
  // rather than a hard page reload so in-flight state survives.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      useAuthStore.getState().logout();
      navigate('/login', { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  const isAuthenticated = Boolean(state.token && state.user);

  const login = useCallback((email, password) => useAuthStore.getState().login(email, password), []);
  const register = useCallback((name, email, password) =>
    useAuthStore.getState().register(name, email, password), []);
  const logout = useCallback(() => useAuthStore.getState().logout(), []);
  const clearError = useCallback(() => useAuthStore.getState().clearError(), []);

  const value = useMemo(
    () => ({
      user: state.user,
      token: state.token,
      isAuthenticated,
      loading: state.loading,
      initializing: state.initializing,
      error: state.error,
      login,
      register,
      logout,
      clearError,
    }),
    [state.user, state.token, state.loading, state.initializing, state.error, isAuthenticated, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

