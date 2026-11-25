/**
 * LifeOS Adaptive Performance Engine
 * Automatically benchmarks and categorizes devices into 3 hardware tiers
 * optimized for the Indian mobile landscape (Android 13+, 3GB-8GB RAM, Mali/Adreno GPUs).
 */

import { useState, useEffect } from 'react';

export type DeviceTier = 1 | 2 | 3;

export interface PerformanceMetrics {
  tier: DeviceTier;
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
  if (!raw || raw === 'unknown' || raw === 'generic webgl') return 'Integrated Graphics';
  
  // Clean ANGLE wrappers: ANGLE (Vendor, Device Name Direct3D..., ...)
  let clean = raw;
  const angleMatch = raw.match(/angle\s*\([^,]+,\s*([^,)]+)/i);
  if (angleMatch && angleMatch[1]) {
    clean = angleMatch[1];
  }
  
  // Remove direct3d/opengl/vulkan build noise
  clean = clean
    .replace(/direct3d.*$/i, '')
    .replace(/vs_\d+_\d+.*$/i, '')
    .replace(/ps_\d+_\d+.*$/i, '')
    .replace(/opengl.*$/i, '')
    .replace(/vulkan.*$/i, '')
    .replace(/\(tm\)/gi, '')
    .replace(/\(r\)/gi, '')
    .replace(/device.*$/i, '')
    .trim();

  // Mobile Adreno detection
  if (/adreno\s*\d+/i.test(raw)) {
    const match = raw.match(/adreno\s*\d+/i);
    if (match) return `Adreno ${match[0].replace(/adreno\s*/i, '').trim()}`;
  }
  // Mobile Mali detection
  if (/mali-[a-z0-9]+/i.test(raw)) {
    const match = raw.match(/mali-[a-z0-9]+/i);
    if (match) return `Mali-${match[0].replace(/mali-/i, '').toUpperCase()}`;
  }
  if (/apple/i.test(raw)) {
    return 'Apple Neural GPU';
  }
  if (/immortalis/i.test(raw)) {
    const match = raw.match(/immortalis-[a-z0-9]+/i);
    return match ? match[0].toUpperCase() : 'Immortalis GPU';
  }
  
  return clean.length > 2 ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Standard GPU';
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
  try {
    const saved = localStorage.getItem('lifeos_perf_tier');
    if (saved === '1' || saved === '2' || saved === '3') {
      return parseInt(saved, 10) as DeviceTier;
    }
  } catch {}
  return 'auto';
}

export function detectDeviceTier(): PerformanceMetrics {
  if (cachedMetrics) return cachedMetrics;

  const rawRam = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4; // Browser reports 2, 4, 8 max
  const cores = navigator.hardwareConcurrency || 4;
  const rawGpu = getGpuRenderer();
  const gpuLower = rawGpu.toLowerCase();
  const cleanGpu = cleanGpuName(rawGpu);

  // Check for budget GPU keywords
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

  // Explicit user override stored in localStorage
  const userOverride = getDeviceTierOverride();
  let tier: DeviceTier = 2; // Default to Tier 2 (Balanced)

  if (userOverride !== 'auto') {
    tier = userOverride;
  } else if (rawRam <= 3 || cores <= 4 || (isBudgetGpu && rawRam <= 4)) {
    // Budget phone (Helio G85/G99, Snapdragon 680, 3-4GB RAM)
    tier = 3;
  } else if (rawRam >= 8 || cores >= 8 || isFlagshipGpu) {
    // Flagship / High-Spec device (8GB+ RAM, 8+ Cores, Flagship GPU)
    tier = 1;
  } else {
    // Standard Mid-range (6GB RAM, Dimensity 6020/7020, Snap 695)
    tier = 2;
  }

  // RAM Display string
  const ramDisplay = rawRam >= 8 ? '8GB+ (16GB)' : `${rawRam}GB`;

  const metrics: PerformanceMetrics = {
    tier,
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
    canBlur: tier === 1,
    isLowEnd: tier === 3,
  };

  cachedMetrics = metrics;
  applyTierToDom(metrics);
  monitorBattery(metrics);
  probeDeviceStorage(metrics);

  return metrics;
}

function applyTierToDom(metrics: PerformanceMetrics) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('tier-1', 'tier-2', 'tier-3', 'perf-low-power', 'perf-low-storage');
  root.classList.add(`tier-${metrics.tier}`);
  if (metrics.isLowPower) {
    root.classList.add('perf-low-power');
  }
  if (metrics.isLowStorage) {
    root.classList.add('perf-low-storage');
  }
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

export function setDeviceTierOverride(tier: DeviceTier | 'auto') {
  try {
    if (tier === 'auto') {
      localStorage.removeItem('lifeos_perf_tier');
    } else {
      localStorage.setItem('lifeos_perf_tier', tier.toString());
    }
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
