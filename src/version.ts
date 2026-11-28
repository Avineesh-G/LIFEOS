export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 94,
  versionName: '4.1.0',
  releaseDate: '2026-11-28',
  apkSize: '15.1 MB',
  releaseNotes: "LifeOS v4.1.0 (4.1.0 · Build 94):\n• Unified Floating Capsule Header: Added centered interface CapsuleHeader with quick Back/Directory and Sync/Reload controls seamlessly matched across Home, primary, and sub-interfaces.\n• Nutrition Engine Upgrade: Warm Brown 5-arc calorie ring with crisp text contrast, Skip lock whenever a meal item is logged, AI-computed per-item protein (g P) across mess & outside meals, and lazy-loaded mess menu.\n• Accurate Hardware & System-Managed Performance Tiers: Native Android DeviceHardware plugin reporting real device model, RAM, CPU cores, GPU, and storage with read-only Auto-Selected T1/T2/T3 tiers.\n• Zero-Lag 120Hz Mobile Smoothness: Removed layout animations, transition-all, and blurs; added routePrefetch pre-warming and 2-phase hydration with 0px mobile overflow across all 22 routes.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
