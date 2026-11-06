import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import PageTransition from './components/PageTransition';
import LoadingScreen from './components/common/LoadingScreen';

// Route-level code splitting keeps the initial bundle small; the React Flow
// editor is by far the heaviest chunk and is only fetched when opened.
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PublicCircuits = lazy(() => import('./pages/PublicCircuits'));
const Editor = lazy(() => import('./pages/Editor'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Routes that render their own full-bleed chrome (no global header).
const HEADERLESS = ['/login', '/register', '/editor'];

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingScreen label="Restoring your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

/** Sends signed-in users away from the auth pages. */
const GuestOnlyRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return <LoadingScreen label="Checking your session…" />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function App() {
  const { pathname } = useLocation();
  const showHeader = !HEADERLESS.some((p) => pathname.startsWith(p));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <ScrollToTop />
      {showHeader && <Header />}
      <Box component="main" sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestOnlyRoute>
                  <PageTransition>
                    <Login />
                  </PageTransition>
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestOnlyRoute>
                  <PageTransition>
                    <Register />
                  </PageTransition>
                </GuestOnlyRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            {/* Public gallery — reachable signed in or out. */}
            <Route
              path="/public"
              element={
                <PageTransition>
                  <PublicCircuits />
                </PageTransition>
              }
            />
            <Route
              path="/editor/:id?"
              element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Box>
    </Box>
  );
}

export default App;

