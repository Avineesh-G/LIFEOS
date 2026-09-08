import { useEffect, useState, useCallback } from 'react';
import type { AppSettings } from '../types';

export function useTheme() {
  const [theme, setThemeState] = useState<AppSettings['theme']>(
    () => (localStorage.getItem('theme') as AppSettings['theme']) || 'system'
  );
  const [accentColor, setAccentColorState] = useState(
    () => localStorage.getItem('accentColor') || '#6366F1'
  );
  const [mounted, setMounted] = useState(false);
  const [systemIsDark, setSystemIsDark] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    } else {
      // Legacy browser support
      (mediaQuery as any).addListener(handleSystemChange);
      return () => (mediaQuery as any).removeListener(handleSystemChange);
    }
  }, []);

  const applyTheme = useCallback(() => {
    if (!mounted || typeof window === 'undefined') return;
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && systemIsDark);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Update meta theme-color to seamlessly match phone status bar
    const metaTheme = document.querySelector('meta[name="theme-color"]:not([media])');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#09090B' : '#FAFAF9');
    }

    root.style.setProperty('--accent', accentColor);
    const r = parseInt(accentColor.slice(1, 3), 16) || 99;
    const g = parseInt(accentColor.slice(3, 5), 16) || 102;
    const b = parseInt(accentColor.slice(5, 7), 16) || 241;
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);

    localStorage.setItem('theme', theme);
    localStorage.setItem('accentColor', accentColor);
  }, [theme, accentColor, systemIsDark, mounted]);

  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  const setTheme = (t: AppSettings['theme']) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
  };

  const setAccentColor = (c: string) => {
    setAccentColorState(c);
    localStorage.setItem('accentColor', c);
  };

  return { theme, setTheme, accentColor, setAccentColor, mounted };
}
