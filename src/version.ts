export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 33,
  versionName: '2.0.9',
  releaseDate: '2026-09-25',
  releaseNotes: 'LifeOS v2.0.9 (Build 33):\n• Fixed Spending tab colors (no more white-on-white text when toggling Money Lent)\n• Removed redundant space and unwanted second page across all interfaces\n• Centered M3 Saved & Edited feedback dialogs with official Google Material Symbols\n• Official Google Material Symbols: Delete Forever, Edit, and Save icons\n• High-performance 120 FPS greeting with 10-minute cooldown & instant in-app update popup',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
