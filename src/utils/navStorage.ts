import { NavConfig, DEFAULT_NAV_CONFIG } from '../config/navRegistry';

const STORAGE_KEY = 'lifeos_nav_config';

export function loadNavConfig(): NavConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_NAV_CONFIG;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.slot1 === 'string' && typeof parsed.slot2 === 'string') {
        return {
          slot1: parsed.slot1,
          slot2: parsed.slot2,
        };
      }
    }
  } catch (error) {
    console.warn('Failed to parse nav config from local storage:', error);
  }

  return DEFAULT_NAV_CONFIG;
}

export function saveNavConfig(config: NavConfig): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save nav config to local storage:', error);
  }
}
