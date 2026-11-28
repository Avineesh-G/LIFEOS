export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 95,
  versionName: '4.2.0',
  releaseDate: '2026-11-28',
  apkSize: '15.15 MB',
  releaseNotes: "LifeOS v4.2.0 (4.2.0 · Build 95):\n• Top Header Progressive Scrim: Fixed top header status-bar bleeding across CapsuleHeader and Luna Chat with a smooth 8-stop OLED edge fade that dissolves scrolling cards cleanly beneath the floating pill.\n• Meal Card Mobile Arrangement: Rearranged MealSlotCard headers into a balanced two-tier layout so full meal names (Breakfast, Lunch, Night Canteen) never truncate, with a dedicated summary & AI Log bar.\n• Cleaner Logged Food Cards: Expanded each logged meal row into a spacious two-row layout showing full food titles, kcal & protein (g P) totals, per-serving stats, and portion steppers without cramped ellipsis.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
