import { useEffect, useState } from 'react';
import type { AppSettings } from '../types';

export function useTheme() {
  const [theme, setThemeState] = useState<AppSettings['theme']>(
    () => (localStorage.getItem('theme') as AppSettings['theme']) || 'system'
  );
  const [accentColor, setAccentColorState] = useState(
    () => localStorage.getItem('accentColor') || '#6366F1'
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    root.style.setProperty('--accent', accentColor);
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);

    localStorage.setItem('theme', theme);
    localStorage.setItem('accentColor', accentColor);
  }, [theme, accentColor, mounted]);

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
