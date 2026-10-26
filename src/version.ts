export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 68,
  versionName: '3.3.1',
  releaseDate: '2026-10-26',
  apkSize: '8.93 MB',
  apkSizeBytes: 9365670,
  releaseNotes: "LifeOS v3.3.1 (Build 68):\n• Premium Horizontal Card Stacking: Natural gesture-driven horizontal card stacks with subtle 3D perspective depth and fluid pagination across Nutrition meal slots, Shopping active lists & templates, Laundry batches, and Outings\n• Seamless Detail Transitions: Integrated hero layout continuity between card stacks and detail views\n• High-Efficiency Home Layout: Kept Home page in its pure high-speed 2x2 Bento grid\n• Performance Hardening: 120fps Android WebView GPU composited animations strictly utilizing transforms and opacities",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
