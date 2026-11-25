import type { AIProviderErrorCode, AIProviderId } from './types.ts';
import type { LunaDomain } from '../../ai/prompts/domains.ts';

export interface LunaTelemetryEvent {
  timestamp: string;
  provider: AIProviderId;
  model: string;
  domain: LunaDomain;
  ttftMs: number | null;
  totalMs: number;
  contextTokensEst: number;
  success: boolean;
  aborted: boolean;
  errorCode?: AIProviderErrorCode;
}

const TELEMETRY_KEY = 'lifeos_luna_telemetry_v1';
const MAX_EVENTS = 100;

function readEvents(): LunaTelemetryEvent[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TELEMETRY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordLunaTelemetry(event: LunaTelemetryEvent): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const events = readEvents();
    events.unshift(event);
    localStorage.setItem(TELEMETRY_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch {}
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)));
  return sorted[idx];
}

export function getLunaTelemetrySummary() {
  const events = readEvents();
  const totalCount = events.length;
  const ttfts = events.map((e) => e.ttftMs).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const totals = events.filter((e) => e.success).map((e) => e.totalMs).sort((a, b) => a - b);
  const successCount = events.filter((e) => e.success).length;
  const abortCount = events.filter((e) => e.aborted).length;
  const errorCount = events.filter((e) => !e.success && !e.aborted).length;

  return {
    totalRequests: totalCount,
    successRate: totalCount > 0 ? Number((successCount / totalCount).toFixed(2)) : 1,
    cancellationRate: totalCount > 0 ? Number((abortCount / totalCount).toFixed(2)) : 0,
    errorRate: totalCount > 0 ? Number((errorCount / totalCount).toFixed(2)) : 0,
    ttftP50Ms: percentile(ttfts, 0.5),
    ttftP95Ms: percentile(ttfts, 0.95),
    totalP50Ms: percentile(totals, 0.5),
    totalP95Ms: percentile(totals, 0.95),
  };
}

