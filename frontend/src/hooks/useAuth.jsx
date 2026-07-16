import { useEffect, useState, createContext, useContext } from 'react';
import useAuthStore from '../store/authStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(() => ({
    user: useAuthStore.getState().user,
    token: useAuthStore.getState().token,
    loading: true,
  }));

  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((s) => {
      setState({ user: s.user, token: s.token, loading: s.loading });
    });

    const init = useAuthStore.getState().initialize;
    init().finally(() => {
      const s = useAuthStore.getState();
      setState({ user: s.user, token: s.token, loading: s.loading });
    });

    return unsubscribe;
  }, []);

  const isAuthenticated = Boolean(state.token && state.user);

  const value = {
    user: state.user,
    isAuthenticated,
    loading: state.loading,
    login: (email, password) => useAuthStore.getState().login(email, password),
    register: (name, email, password) =>
      useAuthStore.getState().register(name, email, password),
    logout: () => useAuthStore.getState().logout(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
