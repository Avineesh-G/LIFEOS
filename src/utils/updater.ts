import { registerPlugin, Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { CURRENT_VERSION_CODE, CURRENT_VERSION_NAME, APP_VERSION } from '../version.ts';

export { CURRENT_VERSION_CODE, CURRENT_VERSION_NAME, APP_VERSION };

export const VERCEL_APK_URL = 'https://lifeos-gujjeti-avineeshs-projects.vercel.app/LifeOS.apk';
export const GITHUB_RAW_APK_URL = VERCEL_APK_URL;

export const REMOTE_VERSION_URLS = [
  'https://lifeos-gujjeti-avineeshs-projects.vercel.app/version.json',
  'https://raw.githubusercontent.com/Avineesh-G/LIFEOS/main/public/version.json'
];

export interface AppVersionInfo {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkUrl: string;
  sha256?: string;
}

export interface InstalledVersionInfo {
  versionCode: number;
  versionName: string;
  isNative: boolean;
}

export interface DownloadProgressEvent {
  progress: number; // 0 - 100, or -1 if content length unknown
  bytesRead: number;
  totalBytes: number;
  status?: number;
}

export interface DownloadErrorEvent {
  error: string;
  message?: string;
  expected?: string;
  actual?: string;
}

export interface ApkInstallerPluginType {
  canRequestPackageInstalls(): Promise<{ canInstall: boolean }>;
  openInstallPermissionSettings(): Promise<void>;
  downloadAndInstall(options: { url: string; sha256?: string }): Promise<{ status: string; message?: string }>;
  installDownloadedApk(): Promise<{ success?: boolean; status?: string; message?: string }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (data: DownloadProgressEvent) => void
  ): Promise<any>;
  addListener(
    eventName: 'downloadError',
    listenerFunc: (data: DownloadErrorEvent) => void
  ): Promise<any>;
  addListener(
    eventName: 'permissionNeeded',
    listenerFunc: (data: any) => void
  ): Promise<any>;
}

export const ApkInstaller = registerPlugin<ApkInstallerPluginType>('ApkInstaller');

/**
 * Checks if the app is running as a native Android Capacitor app
 */
export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

/**
 * Dynamically queries the native Android app for installed version and build number.
 * Falls back to bundled web configuration if running on Web/PWA or native info is unavailable.
 */
export async function getInstalledVersion(): Promise<InstalledVersionInfo> {
  if (isNativeAndroid()) {
    try {
      const info = await CapApp.getInfo();
      const parsedBuild = parseInt(info.build, 10);
      return {
        versionCode: isNaN(parsedBuild) ? CURRENT_VERSION_CODE : parsedBuild,
        versionName: info.version || CURRENT_VERSION_NAME,
        isNative: true,
      };
    } catch (e) {
      console.warn('[LifeOS Updater] Failed to read native App.getInfo, falling back to bundled constants:', e);
    }
  }
  return {
    versionCode: CURRENT_VERSION_CODE,
    versionName: CURRENT_VERSION_NAME,
    isNative: false,
  };
}

/**
 * Pure helper function to evaluate version comparison outcomes
 */
export function evaluateUpdateAvailable(installedCode: number, remoteCode: number): {
  hasUpdate: boolean;
  isDowngrade: boolean;
  isEqual: boolean;
} {
  if (isNaN(installedCode) || isNaN(remoteCode)) {
    return { hasUpdate: false, isDowngrade: false, isEqual: false };
  }
  return {
    hasUpdate: remoteCode > installedCode,
    isDowngrade: remoteCode < installedCode,
    isEqual: remoteCode === installedCode,
  };
}

/**
 * Fetches version metadata from remote endpoints with fast fallback & timeout.
 */
export async function fetchRemoteVersion(): Promise<AppVersionInfo | null> {
  const timestamp = Date.now();
  for (const baseUrl of REMOTE_VERSION_URLS) {
    try {
      const url = `${baseUrl}?t=${timestamp}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.versionCode === 'number') {
          return data as AppVersionInfo;
        }
      }
    } catch (err) {
      console.warn(`[LifeOS Updater] Failed to check ${baseUrl}:`, err);
    }
  }
  return null;
}

/**
 * Compares remote version with current native/bundled installation
 */
export async function checkForAppUpdate(): Promise<{
  hasUpdate: boolean;
  currentVersion: string;
  currentVersionCode: number;
  isDowngradeRejected?: boolean;
  remoteVersion: AppVersionInfo | null;
}> {
  const installed = await getInstalledVersion();
  const remote = await fetchRemoteVersion();
  if (!remote) {
    return {
      hasUpdate: false,
      currentVersion: installed.versionName,
      currentVersionCode: installed.versionCode,
      remoteVersion: null,
    };
  }

  const comparison = evaluateUpdateAvailable(installed.versionCode, remote.versionCode);

  return {
    hasUpdate: comparison.hasUpdate,
    currentVersion: installed.versionName,
    currentVersionCode: installed.versionCode,
    isDowngradeRejected: comparison.isDowngrade,
    remoteVersion: remote,
  };
}

/**
 * Check if Android has permission to install unknown apps / self-update
 */
export async function checkCanInstallApk(): Promise<boolean> {
  if (!isNativeAndroid()) return true;
  try {
    const res = await ApkInstaller.canRequestPackageInstalls();
    return res.canInstall;
  } catch {
    return true;
  }
}

/**
 * Opens system settings page to grant install permission for this app package
 */
export async function openInstallSettings(): Promise<void> {
  if (!isNativeAndroid()) return;
  try {
    await ApkInstaller.openInstallPermissionSettings();
  } catch (e) {
    console.error('Failed to open install settings', e);
  }
}

/**
 * Installs already downloaded and checksum-verified APK (e.g. after permission was granted)
 */
export async function installVerifiedApk(): Promise<{ success: boolean; needPermission?: boolean }> {
  if (!isNativeAndroid()) return { success: true };
  try {
    const res = await ApkInstaller.installDownloadedApk();
    if (res.status === 'permission_needed') {
      return { success: false, needPermission: true };
    }
    return { success: true };
  } catch (e) {
    console.error('Failed to trigger install of downloaded APK', e);
    return { success: false };
  }
}

/**
 * Starts in-app download using Android's native DownloadManager and triggers installation
 */
export async function startApkUpdate(
  versionInfo: AppVersionInfo,
  onProgress: (prog: DownloadProgressEvent) => void,
  onError: (err: string, isChecksumError?: boolean) => void,
  onPermissionNeeded?: () => void
): Promise<void> {
  // Determine target primary URL: prioritize Vercel static hosting or versionInfo.apkUrl
  let targetUrl = versionInfo.apkUrl;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    targetUrl = VERCEL_APK_URL;
  }

  // If raw GitHub URL was accidentally passed in versionInfo, replace with Vercel direct static file
  if (targetUrl.includes('raw.githubusercontent.com') || targetUrl.includes('/raw/main/')) {
    targetUrl = VERCEL_APK_URL;
  }

  if (isNativeAndroid()) {
    let progressSub: any;
    let errorSub: any;
    let permSub: any;

    try {
      progressSub = await ApkInstaller.addListener('downloadProgress', (data) => {
        onProgress(data);
      });

      errorSub = await ApkInstaller.addListener('downloadError', (err) => {
        const isChecksum = err.error === 'checksum_mismatch';
        onError(err.message || err.error || 'Download failed', isChecksum);
      });

      if (onPermissionNeeded) {
        permSub = await ApkInstaller.addListener('permissionNeeded', () => {
          onPermissionNeeded();
        });
      }

      // Trigger native DownloadManager enqueue & verification
      const res = await ApkInstaller.downloadAndInstall({
        url: targetUrl,
        sha256: versionInfo.sha256
      });

      if (res.status === 'permission_needed' && onPermissionNeeded) {
        onPermissionNeeded();
      }
    } catch (err: any) {
      const isChecksum = err?.message === 'checksum_mismatch' || String(err).includes('checksum_mismatch');
      onError(err?.message || 'Failed to start in-app installer', isChecksum);
    } finally {
      if (progressSub) progressSub.remove();
      if (errorSub) errorSub.remove();
      if (permSub) permSub.remove();
    }
  } else {
    // Web / PWA fallback: direct anchor download
    try {
      onProgress({ progress: 100, bytesRead: 1, totalBytes: 1 });
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = 'LifeOS.apk';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      onError(err?.message || 'Web download failed', false);
    }
  }
}
