import { NavConfig, DEFAULT_NAV, validateNavConfig } from '../config/navRegistry';

const STORAGE_KEY = 'lifeos_nav_config';

export function loadNavConfig(): NavConfig {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_NAV;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return validateNavConfig(parsed);
    }
  } catch (error) {
    console.warn('Failed to parse nav config from local storage:', error);
  }

  return DEFAULT_NAV;
}

export function saveNavConfig(config: NavConfig): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const validated = validateNavConfig(config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
  } catch (error) {
    console.warn('Failed to save nav config to local storage:', error);
  }
}
