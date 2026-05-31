import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Centralized fetch interceptor for decoupled production environments (e.g. static Vercel frontend calling Render backend API)
const metaEnv = (import.meta as any).env || {};
const apiBaseUrl = metaEnv.VITE_API_URL || metaEnv.VITE_APP_URL || '';

if (apiBaseUrl) {
  const cleanBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return originalFetch(`${cleanBase}${input}`, init);
    }
    return originalFetch(input, init);
  };
  console.log(`[DIU Production Loader] Routing relative API fetches starting with /api/ to centralized cluster at: ${cleanBase}`);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
