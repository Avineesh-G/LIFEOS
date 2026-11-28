/**
 * LifeOS Adaptive Performance Engine
 * Queries native Android Build/ActivityManager hardware details on APK (exact phone model, RAM, CPU cores, StatFs storage),
 * with accurate Web Client-Hints & WebGL fallback on browsers.
 */

import { useState, useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface DeviceHardwareInfo {
  model: string;
  manufacturer: string;
  deviceName: string;
  androidVersion: string;
  totalRamBytes: number;
  totalRamGb: number;
  cores: number;
  storageFreeBytes: number;
  storageTotalBytes: number;
}

const DeviceHardware = registerPlugin< {
  getHardwareInfo(): Promise<DeviceHardwareInfo>;
}>('DeviceHardware');

export type DeviceTier = 1 | 2 | 3;

export interface PerformanceMetrics {
  tier: DeviceTier;
  deviceModel: string;
  modelNumber: string;
  isExactHardware: boolean;
  ramGb: number;
  ramDisplay: string;
  cores: number;
  gpuRenderer: string;
  cleanGpu: string;
  storageQuotaMb: number | null;
  storageUsedMb: number | null;
  storageFreeMb: number | null;
  storageFreeDisplay: string;
  isLowStorage: boolean;
  userOverride: DeviceTier | 'auto';
  isLowPower: boolean;
  canBlur: boolean;
  isLowEnd: boolean;
}

let cachedMetrics: PerformanceMetrics | null = null;
const listeners = new Set<(metrics: PerformanceMetrics) => void>();

export function cleanGpuName(raw: string): string {
  if (!raw || raw === 'unknown' || raw === 'generic webgl') return 'Integrated GPU';

  // Mobile Adreno / Mali / Immortalis / Apple dedicated fast-paths
  const adrenoMatch = raw.match(/adreno(?:\s*\(tm\))?\s*(\d{3,4}[a-z]*)/i);
  if (adrenoMatch) return `Adreno ${adrenoMatch[1].toUpperCase()}`;

  const immortalisMatch = raw.match(/immortalis[- ]?g?\d+[a-z0-9]*/i);
  if (immortalisMatch) return immortalisMatch[0].replace(/\s+/g, '-').replace(/^immortalis/i, 'Immortalis');

  const maliMatch = raw.match(/mali[- ]?([gt]?\d+[a-z0-9]*)/i);
  if (maliMatch) return `Mali-${maliMatch[1].toUpperCase()}`;

  if (/apple/i.test(raw)) return 'Apple GPU';

  // Clean ANGLE wrappers safely (preserving inner parentheses like "Intel(R)")
  let clean = raw.trim();
  const angleWrapper = clean.match(/^\s*ANGLE\s*\((.+)\)\s*$/i);
  if (angleWrapper && angleWrapper[1]) {
    const commaParts = angleWrapper[1].split(',');
    if (commaParts.length >= 2) {
      clean = commaParts.slice(1).join(' ').trim();
    }
  }

  clean = clean
    .replace(/\(\s*r\s*\)|\(\s*tm\s*\)|\(\s*c\s*\)/gi, '')
    .replace(/\(0x[0-9a-f]+\)/gi, '')
    .replace(/\b(?:direct3d\d*|d3d\d+|opengl(?:\s*es)?[\s\d.]*|vulkan[\s\d.]*|vs_\d+_\d+|ps_\d+_\d+)\b.*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return clean.length > 2 ? clean : 'Standard GPU';
}

function getInitialDeviceModelFallback(): { deviceModel: string; modelNumber: string } {
  if (typeof navigator === 'undefined') {
    return { deviceModel: 'Mobile Device', modelNumber: '' };
  }
  const ua = navigator.userAgent || '';

  // Parse explicit Android Build model token if exposed in UA (ignore Chrome UA-reduction generic "K")
  const androidMatch = ua.match(/Android\s+[^;)]+;\s*([^;)]+?)(?:\s+Build\/|[;)])/i);
  if (androidMatch && androidMatch[1]) {
    const token = androidMatch[1].trim();
    if (token && token.toUpperCase() !== 'K' && token.toLowerCase() !== 'wv') {
      return { deviceModel: token, modelNumber: token };
    }
    return { deviceModel: 'Android Device', modelNumber: '' };
  }

  if (/iphone/i.test(ua)) return { deviceModel: 'Apple iPhone', modelNumber: 'iPhone' };
  if (/ipad/i.test(ua)) return { deviceModel: 'Apple iPad', modelNumber: 'iPad' };
  if (/windows/i.test(ua)) return { deviceModel: 'Windows Desktop', modelNumber: '' };
  if (/macintosh|mac os/i.test(ua)) return { deviceModel: 'macOS', modelNumber: '' };
  if (/linux/i.test(ua)) return { deviceModel: 'Linux Device', modelNumber: '' };

  return { deviceModel: 'Web Device', modelNumber: '' };
}

function computeTierFromSpecs(
  ramGb: number,
  cores: number,
  gpuLower: string,
  userOverride: DeviceTier | 'auto'
): DeviceTier {
  if (userOverride !== 'auto') return userOverride;

  const isBudgetGpu =
    gpuLower.includes('mali-4') ||
    gpuLower.includes('mali-t') ||
    gpuLower.includes('mali-g51') ||
    gpuLower.includes('mali-g52') ||
    gpuLower.includes('mali-g57') ||
    gpuLower.includes('adreno 5') ||
    gpuLower.includes('adreno 610') ||
    gpuLower.includes('adreno 612') ||
    gpuLower.includes('adreno 613') ||
    gpuLower.includes('adreno 616') ||
    gpuLower.includes('adreno 618') ||
    gpuLower.includes('adreno 619');

  const isFlagshipGpu =
    gpuLower.includes('apple') ||
    gpuLower.includes('adreno 7') ||
    gpuLower.includes('adreno 8') ||
    gpuLower.includes('mali-g710') ||
    gpuLower.includes('mali-g715') ||
    gpuLower.includes('mali-g720') ||
    gpuLower.includes('immortalis') ||
    gpuLower.includes('nvidia') ||
    gpuLower.includes('radeon') ||
    gpuLower.includes('geforce') ||
    gpuLower.includes('rtx');

  if (ramGb <= 3 || cores <= 4 || (isBudgetGpu && ramGb <= 4)) {
    return 3;
  }
  if ((ramGb >= 8 && cores >= 8) || (isFlagshipGpu && ramGb >= 6)) {
    return 1;
  }
  return 2;
}

function getGpuRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'Unknown';
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'Generic WebGL';
    return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Generic WebGL';
  } catch {
    return 'Unknown';
  }
}

export function getDeviceTierOverride(): DeviceTier | 'auto' {
  // System-managed: clear any stale manual override so tier always matches real device capability
  try {
    if (localStorage.getItem('lifeos_perf_tier') !== null) {
      localStorage.removeItem('lifeos_perf_tier');
    }
  } catch {}
  return 'auto';
}

export function detectDeviceTier(): PerformanceMetrics {
  if (cachedMetrics) return cachedMetrics;

  const isNative = Capacitor.isNativePlatform();
  const deviceMem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  const rawRam = typeof deviceMem === 'number' && deviceMem > 0 ? deviceMem : 4;
  const cores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 0
    ? navigator.hardwareConcurrency
    : 4;
  const rawGpu = getGpuRenderer();
  const gpuLower = rawGpu.toLowerCase();
  const cleanGpu = cleanGpuName(rawGpu);
  const fallbackModel = getInitialDeviceModelFallback();

  const userOverride = getDeviceTierOverride();
  const tier = computeTierFromSpecs(rawRam, cores, gpuLower, userOverride);

  // Browsers cap navigator.deviceMemory at 8GB by privacy spec; avoid fabricating "(16GB)" on web
  const ramDisplay = !isNative && rawRam >= 8 ? '8+ GB RAM' : `${rawRam} GB RAM`;

  const metrics: PerformanceMetrics = {
    tier,
    deviceModel: fallbackModel.deviceModel,
    modelNumber: fallbackModel.modelNumber,
    isExactHardware: false,
    ramGb: rawRam,
    ramDisplay,
    cores,
    gpuRenderer: rawGpu,
    cleanGpu,
    storageQuotaMb: null,
    storageUsedMb: null,
    storageFreeMb: null,
    storageFreeDisplay: 'Checking...',
    isLowStorage: false,
    userOverride,
    isLowPower: false,
    canBlur: false,
    isLowEnd: tier === 3,
  };

  cachedMetrics = metrics;
  applyTierToDom(metrics);
  monitorBattery(metrics);
  probeNativeHardwareAndModel(metrics);

  return metrics;
}

function applyTierToDom(metrics: PerformanceMetrics) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('tier-1', 'tier-2', 'tier-3', 'perf-low-power', 'perf-low-storage', 'perf-lite');
  root.classList.add(`tier-${metrics.tier}`);
  if (metrics.tier === 3) {
    root.classList.add('perf-lite');
  }
  if (metrics.isLowPower) {
    root.classList.add('perf-low-power');
  }
  if (metrics.isLowStorage) {
    root.classList.add('perf-low-storage');
  }
}

async function probeNativeHardwareAndModel(currentMetrics: PerformanceMetrics) {
  // 1. On Capacitor Android APK, read exact physical hardware specs from native Build + ActivityManager + StatFs
  if (Capacitor.isNativePlatform()) {
    try {
      const hw = await DeviceHardware.getHardwareInfo();
      if (hw) {
        if (hw.deviceName) currentMetrics.deviceModel = hw.deviceName;
        if (hw.model) currentMetrics.modelNumber = hw.model;
        if (hw.totalRamGb > 0) {
          currentMetrics.ramGb = hw.totalRamGb;
          currentMetrics.ramDisplay = `${hw.totalRamGb} GB RAM`;
        }
        if (hw.cores > 0) {
          currentMetrics.cores = hw.cores;
        }
        if (hw.storageFreeBytes > 0) {
          const freeMb = Math.round(hw.storageFreeBytes / (1024 * 1024));
          currentMetrics.storageFreeMb = freeMb;
          currentMetrics.storageFreeDisplay =
            freeMb >= 1024 ? `${(freeMb / 1024).toFixed(1)} GB free` : `${freeMb} MB free`;
          currentMetrics.isLowStorage = freeMb < 500;
        }
        currentMetrics.isExactHardware = true;

        const nextTier = computeTierFromSpecs(
          currentMetrics.ramGb,
          currentMetrics.cores,
          currentMetrics.gpuRenderer.toLowerCase(),
          currentMetrics.userOverride
        );
        currentMetrics.tier =
          currentMetrics.isLowStorage && currentMetrics.userOverride === 'auto' && nextTier === 1
            ? 2
            : nextTier;
        currentMetrics.isLowEnd = currentMetrics.tier === 3;

        applyTierToDom(currentMetrics);
        listeners.forEach((cb) => cb({ ...currentMetrics }));
        return;
      }
    } catch {
      // Fall through cleanly to browser storage & Client Hints
    }
  }

  // 2. Web / Browser Client Hints for accurate Android/Chrome model (when UA is frozen/reduced)
  try {
    const uaData = (navigator as unknown as {
      userAgentData?: {
        getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string; platform?: string }>;
      };
    }).userAgentData;
    if (uaData?.getHighEntropyValues) {
      const hv = await uaData.getHighEntropyValues(['model', 'platform']);
      if (hv?.model && hv.model.trim()) {
        currentMetrics.deviceModel = hv.model.trim();
        currentMetrics.modelNumber = hv.model.trim();
        currentMetrics.isExactHardware = true;
        listeners.forEach((cb) => cb({ ...currentMetrics }));
      }
    }
  } catch {}

  await probeDeviceStorage(currentMetrics);
}

async function probeDeviceStorage(currentMetrics: PerformanceMetrics) {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.estimate === 'function') {
      const estimate = await navigator.storage.estimate();
      const quotaBytes = estimate.quota || 0;
      const usageBytes = estimate.usage || 0;
      if (quotaBytes > 0) {
        const quotaMb = Math.round(quotaBytes / (1024 * 1024));
        const usedMb = Math.round(usageBytes / (1024 * 1024));
        const freeMb = Math.max(0, quotaMb - usedMb);
        const freeDisplay = freeMb >= 1024 ? `${(freeMb / 1024).toFixed(1)} GB free` : `${freeMb} MB free`;
        const usageRatio = usageBytes / quotaBytes;
        const lowStorage = freeMb < 250 || usageRatio > 0.88;

        currentMetrics.storageQuotaMb = quotaMb;
        currentMetrics.storageUsedMb = usedMb;
        currentMetrics.storageFreeMb = freeMb;
        currentMetrics.storageFreeDisplay = freeDisplay;
        currentMetrics.isLowStorage = lowStorage;

        // If device is under storage pressure in auto mode, step down Tier 1 -> Tier 2 to prevent disk I/O stalls
        if (lowStorage && currentMetrics.userOverride === 'auto' && currentMetrics.tier === 1) {
          currentMetrics.tier = 2;
          currentMetrics.canBlur = false;
        }

        applyTierToDom(currentMetrics);
        listeners.forEach((cb) => cb({ ...currentMetrics }));
        return;
      }
    }
  } catch {}
  currentMetrics.storageFreeDisplay = 'Standard Storage';
}

export function shouldTrimCaches(): boolean {
  const m = cachedMetrics ?? detectDeviceTier();
  return m.isLowStorage || m.tier === 3 || m.isLowPower;
}

async function monitorBattery(currentMetrics: PerformanceMetrics) {
  try {
    if ('getBattery' in navigator) {
      const battery = await (navigator as unknown as { getBattery: () => Promise<{ level: number; charging: boolean; addEventListener: (type: string, fn: () => void) => void }> }).getBattery();
      const updateBattery = () => {
        const isLow = !battery.charging && battery.level <= 0.20;
        if (currentMetrics.isLowPower !== isLow) {
          currentMetrics.isLowPower = isLow;
          if (isLow && currentMetrics.tier < 3) {
            // Drop down one tier when battery is under 20% to preserve smoothness
            currentMetrics.tier = Math.min(3, currentMetrics.tier + 1) as DeviceTier;
          }
          applyTierToDom(currentMetrics);
          listeners.forEach((cb) => cb(currentMetrics));
        }
      };

      battery.addEventListener('levelchange', updateBattery);
      battery.addEventListener('chargingchange', updateBattery);
      updateBattery();
    }
  } catch {}
}

export function subscribeToPerformanceMetrics(callback: (metrics: PerformanceMetrics) => void): () => void {
  listeners.add(callback);
  if (cachedMetrics) callback(cachedMetrics);
  return () => listeners.delete(callback);
}

export function setDeviceTierOverride(_tier: DeviceTier | 'auto') {
  // Manual overrides are disabled: tier is strictly auto-selected from device capability.
  try {
    localStorage.removeItem('lifeos_perf_tier');
    cachedMetrics = null;
    detectDeviceTier();
  } catch {}
}

/**
 * Returns true if the device is currently operating at Tier 1 (Flagship).
 * Used to gate intense visual effects, specular shaders, and complex blur layers.
 */
export function isTopTier(): boolean {
  return (cachedMetrics ?? detectDeviceTier()).tier === 1;
}

/**
 * React hook to reactively consume hardware performance tier in components.
 */
export function useDeviceTier(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(() => cachedMetrics ?? detectDeviceTier());

  useEffect(() => {
    return subscribeToPerformanceMetrics(setMetrics);
  }, []);

  return metrics;
}
