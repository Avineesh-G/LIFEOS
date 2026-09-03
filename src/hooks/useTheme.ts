import { useEffect, useState } from 'react';
import { getData, saveData } from '../db';
import type { AppSettings } from '../types';

export function useTheme() {
  const [theme, setThemeState] = useState<AppSettings['theme']>('system');
  const [accentColor, setAccentColorState] = useState('#6366F1');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    getData().then((data) => {
      setThemeState(data.settings.theme);
      setAccentColorState(data.settings.accentColor);
      setMounted(true);
    });
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

    saveData({ settings: { theme, accentColor } });
  }, [theme, accentColor, mounted]);

  const setTheme = (t: AppSettings['theme']) => {
    setThemeState(t);
    getData().then(d => saveData({ settings: { ...d.settings, theme: t } }));
  };

  const setAccentColor = (c: string) => {
    setAccentColorState(c);
    getData().then(d => saveData({ settings: { ...d.settings, accentColor: c } }));
  };

  return { theme, setTheme, accentColor, setAccentColor, mounted };
}
