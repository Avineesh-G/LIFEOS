import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// ── 1. Dev Hygiene: Unregister any legacy/cached service workers & clear stale caches in dev ──
if (import.meta.env.DEV) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        caches.delete(key).catch(() => {});
      }
    }).catch(() => {});
  }
}

// ── 2. Vite Preload Error Guard: Auto-recover from outdated optimize-deps chunk failures ──
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const reloadKey = 'lifeos_vite_preload_reloaded';
  const hasReloaded = sessionStorage.getItem(reloadKey);
  if (!hasReloaded) {
    sessionStorage.setItem(reloadKey, '1');
    window.location.reload();
  } else {
    console.error('[LifeOS] Vite preload error occurred after retry:', event);
  }
});

// Clear reload guard on successful window load
window.addEventListener('load', () => {
  setTimeout(() => {
    sessionStorage.removeItem('lifeos_vite_preload_reloaded');
  }, 2000);
});

// ── 3. Dev Error & Unhandled Rejection Visual Feedback ──
if (import.meta.env.DEV) {
  window.addEventListener('error', (e) => {
    console.warn('[LifeOS Dev Watcher] Global Uncaught Error:', e.message, e.filename, e.lineno);
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.warn('[LifeOS Dev Watcher] Unhandled Promise Rejection:', e.reason);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary level="root" fallbackTitle="LifeOS Application Recovery">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
