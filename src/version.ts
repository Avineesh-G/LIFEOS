export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 60,
  versionName: '3.2.2',
  releaseDate: '2026-10-04',
  apkSize: '13.85 MB',
  apkSizeBytes: 14520000,
  releaseNotes: 'LifeOS v3.2.2 (Build 60):\n• Navigation Hub Fix: Removed frozen background shift so More menu opens instantly without jumping the page\n• Hub Grid Polish: Fixed word cropping across 2-line destination titles (Active Recall, To-Do Tasks, Shopping Lists, etc.)\n• Google Sans Flex & Letter Depth: Enhanced global typography, optical depth, and crisp headers across all interfaces\n• AI Action Automation: Resolved AI action proposal execution so commands to add tasks/expenses/lists directly commit to their interfaces',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
