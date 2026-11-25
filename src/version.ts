export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 89,
  versionName: '3.4.12',
  releaseDate: '2026-11-25',
  apkSize: '15.04 MB',
  apkSizeBytes: 15771219,
  releaseNotes: "LifeOS v3.4.12 (Build 89):\n• Royal Burgundy Single-Hue Theme: Fixed pink washout across M3 tones and set Royal Burgundy (#8B1E3F → #B52B4D) with subtle gradient depth across every interface, card, and pop-up while preserving iOS Liquid Blue as a preset.\n• Unified Theme Icons & Controls: Replaced stray blue, green, amber, and purple hardcoded icons, spinners, badges, AI logos, and custom interactive vectors across Home, Gym, Nutrition, Spending, Drive, Vault, Laundry, Calendar, Tasks, Shopping, Outings, Luna AI, Settings, and modals with active theme tokens.\n• What's New & Updater Visual Refresh: Replaced Gemini-style star glyphs in What's New updates and the In-App Updater modal with interface-matched Phosphor icons and unified theme styling.\n• Pure iOS Water Liquid Glass Refinement: Preserved borderless meniscus water refraction, dock droplet glass sheen, and crisp white legibility on obsidian surfaces.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
