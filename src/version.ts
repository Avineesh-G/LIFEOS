export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 56,
  versionName: '3.1.1',
  releaseDate: '2026-10-03',
  apkSize: '13.78 MB',
  apkSizeBytes: 14453581,
  releaseNotes: 'LifeOS v3.1.1 (Build 56):\n• Expressive Burgundy Material 3 Seed Theme & System-wide Palette Engine\n• AI Chat Mobile Layout & Responsive Card Positioning\n• Interactive Response Table with Touch Slider & Nudge Controls\n• In-Message Interactive Task & Itinerary Checklists\n• 1-Tap WhatsApp & Native Response Sharing\n• Native Web Speech TTS Voice Read-Aloud\n• Dynamic Contextual Smart Follow-Up Suggestions\n• 1-Tap Expense Quick-Logging',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
