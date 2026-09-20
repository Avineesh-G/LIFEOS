import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { applyPerformanceMode } from './utils/performanceMode';
import './index.css';

// Apply performance mode (Auto / Full / Lite) immediately before first paint
applyPerformanceMode();

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

// ── 1b. Inside the native Capacitor APK, skip SW entirely. ──
// Assets are bundled locally; the SW only adds stale-cache risk + startup overhead.
// The web version still benefits from SW caching (handled by vite-plugin-pwa).
if (typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
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

// ── 4. Responsive Viewport Metrics & Width Classes ──
const updateViewportMetrics = () => {
  const w = window.innerWidth || document.documentElement.clientWidth;
  const widthClass = w < 340 ? 'micro' : w < 600 ? 'compact' : w < 840 ? 'medium' : 'expanded';
  document.documentElement.setAttribute('data-width', widthClass);
  const vh = ((window.visualViewport?.height || window.innerHeight) * 0.01).toFixed(3);
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};
updateViewportMetrics();
window.addEventListener('resize', updateViewportMetrics, { passive: true });
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', updateViewportMetrics, { passive: true });
}

// ── 5. Native Shell Guards: Prevent browser context menus & text toolbars on non-inputs ──
const isEditableElement = (el: EventTarget | null): boolean => {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return true;
  if (el.closest('input, textarea, [contenteditable="true"], .allow-select')) return true;
  return false;
};

window.addEventListener('contextmenu', (e) => {
  if (!isEditableElement(e.target)) {
    e.preventDefault();
  }
}, { capture: true });

window.addEventListener('selectstart', (e) => {
  if (!isEditableElement(e.target)) {
    e.preventDefault();
  }
}, { capture: true });

// Prevent WebView hijacking from external links
window.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement)?.closest('a');
  if (target && target.href && /^https?:\/\//i.test(target.href)) {
    try {
      const url = new URL(target.href);
      if (url.origin !== window.location.origin) {
        target.setAttribute('target', '_blank');
        target.setAttribute('rel', 'noopener noreferrer');
      }
    } catch {}
  }
}, { capture: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary level="root" fallbackTitle="LifeOS Application Recovery">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
