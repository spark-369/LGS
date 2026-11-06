import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { ColorModeProvider } from './theme/ColorModeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ColorModeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ColorModeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

