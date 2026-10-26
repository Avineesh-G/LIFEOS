export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 67,
  versionName: '3.3.0',
  releaseDate: '2026-10-26',
  apkSize: '8.93 MB',
  apkSizeBytes: 9362492,
  releaseNotes: "LifeOS v3.3.0 (Build 67):\n• Luna Chatbot Branding: Added official Luna icon across Mess Menu food logging & AI analysis badges\n• Smart Dietary Nutrition: Fixed paneer biryani auto-resolution with vegetarian guard protection and preserved custom meal names\n• Instant Interface Navigation: Core interfaces eager-loaded in memory for zero-latency, 100% reliable page switching without blank screens or chunk lags\n• Fixed Sleep/Resume Freeze: Pure OLED black native canvas & instant compositor wake-up eliminating white screen flash and double-tap requirement\n• Instant Cached Profile Avatar: 0ms profile photo rendering from local credentials, eliminating the \"U\" letter fallback flash\n• Seamless Navigation Retracing: Reliable History-to-Home and deep route navigation without stuck animation transitions",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
