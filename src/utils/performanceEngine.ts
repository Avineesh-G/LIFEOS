/**
 * LifeOS Adaptive Performance Engine
 * Automatically benchmarks and categorizes devices into 3 hardware tiers
 * optimized for the Indian mobile landscape (Android 13+, 3GB-8GB RAM, Mali/Adreno GPUs).
 */

export type DeviceTier = 1 | 2 | 3;

export interface PerformanceMetrics {
  tier: DeviceTier;
  ramGb: number;
  cores: number;
  gpuRenderer: string;
  isLowPower: boolean;
  canBlur: boolean;
  isLowEnd: boolean;
}

let cachedMetrics: PerformanceMetrics | null = null;
const listeners = new Set<(metrics: PerformanceMetrics) => void>();

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

export function detectDeviceTier(): PerformanceMetrics {
  if (cachedMetrics) return cachedMetrics;

  const ram = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4; // Defaults to 4GB if undetected
  const cores = navigator.hardwareConcurrency || 4;
  const gpu = getGpuRenderer().toLowerCase();

  // Check for budget GPU keywords
  const isBudgetGpu =
    gpu.includes('mali-4') ||
    gpu.includes('mali-t') ||
    gpu.includes('mali-g51') ||
    gpu.includes('mali-g52') ||
    gpu.includes('mali-g57') ||
    gpu.includes('adreno 5') ||
    gpu.includes('adreno 610') ||
    gpu.includes('adreno 612') ||
    gpu.includes('adreno 613') ||
    gpu.includes('adreno 616') ||
    gpu.includes('adreno 618') ||
    gpu.includes('adreno 619');

  const isFlagshipGpu =
    gpu.includes('apple') ||
    gpu.includes('adreno 7') ||
    gpu.includes('adreno 8') ||
    gpu.includes('mali-g710') ||
    gpu.includes('mali-g715') ||
    gpu.includes('mali-g720') ||
    gpu.includes('immortalis') ||
    gpu.includes('nvidia') ||
    gpu.includes('radeon');

  // Explicit user override stored in localStorage
  let userOverride: DeviceTier | null = null;
  try {
    const saved = localStorage.getItem('lifeos_perf_tier');
    if (saved === '1' || saved === '2' || saved === '3') {
      userOverride = parseInt(saved, 10) as DeviceTier;
    }
  } catch {}

  let tier: DeviceTier = 2; // Default to Tier 2 (Balanced)

  if (userOverride) {
    tier = userOverride;
  } else if (ram <= 3 || cores <= 4 || (isBudgetGpu && ram <= 4)) {
    // Budget Indian phone (Helio G85/G99, Snapdragon 680, 3-4GB RAM)
    tier = 3;
  } else if (ram >= 8 && cores >= 8 && (isFlagshipGpu || !isBudgetGpu)) {
    // Flagship device (8GB+ RAM, Snap 7+/8 Gen)
    tier = 1;
  } else {
    // Standard Mid-range Indian phone (6GB RAM, Dimensity 6020/7020/7050, Snap 695)
    tier = 2;
  }

  const metrics: PerformanceMetrics = {
    tier,
    ramGb: ram,
    cores,
    gpuRenderer: gpu,
    isLowPower: false,
    canBlur: tier <= 2,
    isLowEnd: tier === 3,
  };

  cachedMetrics = metrics;
  applyTierToDom(metrics);
  monitorBattery(metrics);

  return metrics;
}

function applyTierToDom(metrics: PerformanceMetrics) {
  const root = document.documentElement;
  root.classList.remove('tier-1', 'tier-2', 'tier-3', 'perf-low-power');
  root.classList.add(`tier-${metrics.tier}`);
  if (metrics.isLowPower) {
    root.classList.add('perf-low-power');
  }
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
