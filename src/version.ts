export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 74,
  versionName: '3.3.7',
  releaseDate: '2026-11-12',
  apkSize: '10.20 MB',
  apkSizeBytes: 10694542,
  releaseNotes: "LifeOS v3.3.7 (Build 74):\n• Liquid Design Evolution: Refined all interfaces so color lives on words, numbers, and glyphs while preserving pure dark liquid glass droplets.\n• Professional Apple & Google Calendar Grade System: Month grid with colored date typography, 24-hour Google Calendar timeline with hourly slots and NOW indicator, and Agenda schedule view.\n• Header Calendar Quick Popup: Replaced alerts bell with Calendar in the top-right capsule for one-tap daily schedule access.\n• Smart Nutrition & Gym Notifications: 30-minute daytime meal logging nudges (muted when meals logged), and twice-daily morning (8:00 AM) and evening (6:00 PM) workout logging reminders.\n• Outings Liquid Glass Restyle: Re-themed New Outing modals with translucent liquid glass, high-contrast inputs, and crisp typography.\n• Drive Upload Ticker & Reader Polish: Continuous progress percentage counter from 0% to 100% and resized preview images avoiding button collision.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
