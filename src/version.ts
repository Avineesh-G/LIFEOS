export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 78,
  versionName: '3.4.1',
  releaseDate: '2026-11-16',
  apkSize: '10.22 MB',
  apkSizeBytes: 10720922,
  releaseNotes: "LifeOS v3.4.1 (Build 78):\n• Liquid Glass Optics Refinement: Pristine continuous specular meniscus reflections with zero color banding or dithering artifacts.\n• Native Vector Sharpness: Removed GPU layer promotion overrides, restoring native Retina/AMOLED subpixel vector crispness across all cards and typography.\n• Pure iOS Calendar Architecture: Removed circular badge containers in favor of Apple iOS native dark typography, proportional squircle day cells, and 6px high-contrast micro-dots.\n• Mobile Viewport & Dynamic Island Geometry: Dynamic safe-area top clearance (+52px fallback) completely clearing camera hole-punches, speaker grilles, and Dynamic Island.",
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
