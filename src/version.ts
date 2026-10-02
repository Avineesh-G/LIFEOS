export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 57,
  versionName: '3.1.2',
  releaseDate: '2026-10-03',
  apkSize: '13.78 MB',
  apkSizeBytes: 14453581,
  releaseNotes: 'LifeOS v3.1.2 (Build 57):\n• Floating Popups & Modals: React Portal rendering & gesture isolation (fluid 120fps, zero lag or touch freezing)\n• Top Space Fix: Optimized main layout padding across all pages\n• Theme Color Synchronization: Unified Material 3 dynamic tokens for Tasks, Navigation Hub, and sub-interfaces\n• Ask LifeOS Mobile Polish: Full responsiveness with zero horizontal cutoff\n• Interactive Checklists & Table Sliders',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
