export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 77,
  versionName: '3.4.0',
  releaseDate: '2026-11-14',
  apkSize: '10.22 MB',
  apkSizeBytes: 10721259,
  releaseNotes: "LifeOS v3.4.0 (Build 77):\n• Zero-Lag Compositor Engine: Completely eliminated dock backdrop blur for butter-smooth 60/120 FPS scrolling across all devices.\n• Hardware-Accelerated Calorie Ring: Precomputed SVG paths and removed SVG filters for 100% GPU rendering.\n• GPU Native TabBar Slider: Replaced layout projection with GPU-accelerated CSS translate3d spring transitions.\n• Mobile Viewport Meal Card Refinement: Streamlined actions and non-wrapping meal time intervals for perfect clearance on narrow screens.\n• Tier 1 Flagship OLED Polish: Ultra-deep ambient drop shadows and seamless borderless surfaces.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
