import {
  CHAT_PRIMARY,
  CHAT_FALLBACKS,
  STT_PRIMARY,
  STT_FALLBACKS,
  ALLOWED_CHAT_MODELS,
  ALLOWED_STT_MODELS,
  RETIRED_MODELS,
  GROQ_STORAGE_KEYS,
  CURRENT_AI_SCHEMA_VERSION,
} from '../config/aiModels.ts';
import type { AllowedChatModel } from '../config/aiModels.ts';
import { getGroqApiKey, getAiProxyUrl } from '../utils/aiSecurity.ts';

// In-memory bad models for the current app session
const sessionBadModels = new Set<string>();

export interface ModelResolutionResult {
  activeModel: string;
  source: 'live' | 'cache' | 'fallback';
  availableAllowedModels: string[];
  rawLiveModels?: string[];
}

/**
 * Migrates old or retired models stored in localStorage on app startup
 */
export function migrateAiSettings(): void {
  try {
    const savedVersion = parseInt(localStorage.getItem(GROQ_STORAGE_KEYS.SETTINGS_SCHEMA_VERSION) || '0', 10);
    const activeModel = localStorage.getItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL);

    if (savedVersion < CURRENT_AI_SCHEMA_VERSION || !activeModel || (RETIRED_MODELS as readonly string[]).includes(activeModel)) {
      console.log('[AI Migration] Purging outdated/retired AI model settings and setting to default primary...');
      localStorage.setItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL, CHAT_PRIMARY);
      localStorage.removeItem(GROQ_STORAGE_KEYS.CACHED_MODELS_LIST);
      localStorage.removeItem(GROQ_STORAGE_KEYS.LAST_MODELS_CHECK);
      localStorage.setItem(GROQ_STORAGE_KEYS.SETTINGS_SCHEMA_VERSION, CURRENT_AI_SCHEMA_VERSION.toString());
    }
  } catch (err) {
    console.warn('[AI Migration] Error migrating settings:', err);
  }
}

/**
 * Resolves the best active chat model dynamically from Groq's live models API
 */
export async function resolveActiveChatModel(
  customApiKey?: string,
  forceRefresh = false
): Promise<ModelResolutionResult> {
  // 1. Run migration if needed
  migrateAiSettings();

  const apiKey = (customApiKey && customApiKey.trim()) || getGroqApiKey();
  const proxyUrl = getAiProxyUrl();

  // If offline or no credentials, return cached or primary
  if ((typeof navigator !== 'undefined' && !navigator.onLine) || (!apiKey && !proxyUrl)) {
    const cached = localStorage.getItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL) || CHAT_PRIMARY;
    return {
      activeModel: (RETIRED_MODELS as readonly string[]).includes(cached) ? CHAT_PRIMARY : cached,
      source: 'fallback',
      availableAllowedModels: [CHAT_PRIMARY, ...CHAT_FALLBACKS].filter(m => !sessionBadModels.has(m)),
    };
  }

  // 2. Check 24-hour cache
  if (!forceRefresh) {
    try {
      const lastCheck = parseInt(localStorage.getItem(GROQ_STORAGE_KEYS.LAST_MODELS_CHECK) || '0', 10);
      const cachedActive = localStorage.getItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL);
      const isCacheValid = Date.now() - lastCheck < 24 * 60 * 60 * 1000;

      if (isCacheValid && cachedActive && !sessionBadModels.has(cachedActive) && !(RETIRED_MODELS as readonly string[]).includes(cachedActive)) {
        return {
          activeModel: cachedActive,
          source: 'cache',
          availableAllowedModels: [CHAT_PRIMARY, ...CHAT_FALLBACKS].filter(m => !sessionBadModels.has(m)),
        };
      }
    } catch {}
  }

  // 3. Query GET https://api.groq.com/openai/v1/models
  try {
    const endpoint = proxyUrl ? `${proxyUrl.replace(/\/$/, '')}/v1/models` : 'https://api.groq.com/openai/v1/models';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!proxyUrl && apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(endpoint, { method: 'GET', headers });
    if (res.ok) {
      const data = await res.json();
      const liveModelIds: string[] = (data?.data || []).map((m: any) => m.id);

      // Intersect live models with our ALLOWED_CHAT_MODELS (preserving priority order)
      const matchedAllowed = (ALLOWED_CHAT_MODELS as readonly string[]).filter(
        id => liveModelIds.includes(id) && !sessionBadModels.has(id) && !(RETIRED_MODELS as readonly string[]).includes(id)
      );

      if (matchedAllowed.length > 0) {
        const bestModel = matchedAllowed[0];
        localStorage.setItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL, bestModel);
        localStorage.setItem(GROQ_STORAGE_KEYS.CACHED_MODELS_LIST, JSON.stringify(liveModelIds));
        localStorage.setItem(GROQ_STORAGE_KEYS.LAST_MODELS_CHECK, Date.now().toString());

        return {
          activeModel: bestModel,
          source: 'live',
          availableAllowedModels: matchedAllowed,
          rawLiveModels: liveModelIds,
        };
      } else {
        console.warn('[AI Resolver] No allowed models matched live list:', liveModelIds);
      }
    }
  } catch (err) {
    console.warn('[AI Resolver] Failed to fetch live models from Groq:', err);
  }

  // Fallback to first available allowed model not marked bad
  const fallbackCandidates = [CHAT_PRIMARY, ...CHAT_FALLBACKS].filter(m => !sessionBadModels.has(m));
  const chosenFallback = fallbackCandidates[0] || CHAT_PRIMARY;
  localStorage.setItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL, chosenFallback);

  return {
    activeModel: chosenFallback,
    source: 'fallback',
    availableAllowedModels: fallbackCandidates,
  };
}

/**
 * Mark a model as failed/unavailable in the current session and switch to next fallback
 */
export function markModelFailedInSession(modelId: string): string {
  sessionBadModels.add(modelId);
  console.warn(`[AI Resolver] Model ${modelId} marked bad for this session. Available fallbacks:`, 
    [CHAT_PRIMARY, ...CHAT_FALLBACKS].filter(m => !sessionBadModels.has(m))
  );

  const remaining = [CHAT_PRIMARY, ...CHAT_FALLBACKS].filter(m => !sessionBadModels.has(m));
  const nextModel = remaining[0] || CHAT_FALLBACKS[0] || CHAT_PRIMARY;
  localStorage.setItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL, nextModel);
  return nextModel;
}

/**
 * Resets AI settings & cache to pristine state without touching app data or user key
 */
export function resetAiSettings(): void {
  sessionBadModels.clear();
  localStorage.setItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL, CHAT_PRIMARY);
  localStorage.removeItem(GROQ_STORAGE_KEYS.CACHED_MODELS_LIST);
  localStorage.removeItem(GROQ_STORAGE_KEYS.LAST_MODELS_CHECK);
  localStorage.removeItem(GROQ_STORAGE_KEYS.LAST_AI_ERROR);
  localStorage.setItem(GROQ_STORAGE_KEYS.SETTINGS_SCHEMA_VERSION, CURRENT_AI_SCHEMA_VERSION.toString());
}

/**
 * Comprehensive connection test for Settings > AI
 */
export async function testAiConnection(customApiKey?: string): Promise<{
  step1Models: { success: boolean; message: string; details?: string; modelCount?: number };
  step2Chat: { success: boolean; message: string; details?: string; modelUsed?: string; latencyMs?: number };
}> {
  const apiKey = (customApiKey && customApiKey.trim()) || getGroqApiKey();
  const proxyUrl = getAiProxyUrl();

  if (!apiKey && !proxyUrl) {
    return {
      step1Models: { success: false, message: 'API Key missing', details: 'Please enter your Groq API Key first.' },
      step2Chat: { success: false, message: 'Skipped', details: 'Cannot run test without API Key.' },
    };
  }

  // Step 1: Query Models List
  let step1Result = { success: false, message: '', details: '', modelCount: 0 };
  let resolvedModel = CHAT_PRIMARY;

  try {
    const resolution = await resolveActiveChatModel(apiKey, true);
    resolvedModel = resolution.activeModel;
    step1Result = {
      success: true,
      message: `Connected! Resolved: ${resolvedModel}`,
      details: resolution.rawLiveModels ? `Found ${resolution.rawLiveModels.length} models on Groq.` : 'Using primary verified model.',
      modelCount: resolution.rawLiveModels?.length || 1,
    };
  } catch (err: any) {
    step1Result = {
      success: false,
      message: 'Failed to query models',
      details: err?.message || 'Connection error',
      modelCount: 0,
    };
  }

  // Step 2: Test Mini Chat Completion ("hello")
  let step2Result = { success: false, message: '', details: '', modelUsed: resolvedModel, latencyMs: 0 };
  const startTime = Date.now();

  try {
    const endpoint = proxyUrl ? `${proxyUrl.replace(/\/$/, '')}/v1/chat/completions` : 'https://api.groq.com/openai/v1/chat/completions';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (!proxyUrl && apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const payload: any = {
      model: resolvedModel,
      messages: [{ role: 'user', content: 'Say "Connection successful"' }],
      max_completion_tokens: 100,
    };

    if (resolvedModel.includes('gpt-oss')) {
      payload.reasoning_effort = 'low';
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const latencyMs = Date.now() - startTime;

    if (res.ok) {
      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content || '';
      step2Result = {
        success: true,
        message: `Chat OK (${latencyMs}ms)`,
        details: `Response: "${reply.trim().slice(0, 60)}"`,
        modelUsed: resolvedModel,
        latencyMs,
      };
    } else {
      const errText = await res.text();
      let cleanMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        cleanMsg = parsed.error?.message || errText;
      } catch {}
      step2Result = {
        success: false,
        message: `HTTP ${res.status} error`,
        details: cleanMsg,
        modelUsed: resolvedModel,
        latencyMs,
      };
    }
  } catch (err: any) {
    step2Result = {
      success: false,
      message: 'Chat request failed',
      details: err?.message || 'Network error',
      modelUsed: resolvedModel,
      latencyMs: Date.now() - startTime,
    };
  }

  return {
    step1Models: step1Result,
    step2Chat: step2Result,
  };
}
