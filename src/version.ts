export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 63,
  versionName: '3.2.6',
  releaseDate: '2026-10-06',
  apkSize: '13.85 MB',
  apkSizeBytes: 14520000,
  releaseNotes: 'LifeOS v3.2.6 (Build 63):\n• Status Bar Safe Area Clearance: Fixed header collision and brought Back options safely below notch/status bar in Gym and all sub-interfaces\n• Bottom Spacing Optimization: Eliminated oversized trailing gaps for a tight, natural interface flow\n• Hardware Performance Specifications: Added clear auto-detected RAM, CPU Cores, clean GPU rendering profile, and interactive Tier selection\n• Adaptive Tier Calibration: Guaranteed Tier 1 High-Fidelity for 8GB+ RAM devices with seamless fluid animations',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
