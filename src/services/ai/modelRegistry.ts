import {
  CHAT_PRIMARY,
  CHAT_FALLBACKS,
  VISION_PRIMARY,
  RETIRED_MODELS,
} from '../../config/aiModels.ts';
import type { ModelConfiguration } from './types.ts';

export const GEMINI_FALLBACK_MODEL = 'gemini-1.5-flash';

export const MODEL_REGISTRY: Record<string, ModelConfiguration> = {
  [CHAT_PRIMARY]: {
    id: CHAT_PRIMARY,
    provider: 'groq',
    displayName: 'Luna 2.0 Pro (120B)',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsJsonMode: true,
    supportsVision: false,
    supportsTools: true,
    supportsReasoningEffort: true,
  },
  [CHAT_FALLBACKS[0]]: {
    id: CHAT_FALLBACKS[0],
    provider: 'groq',
    displayName: 'Luna 2.0 Fast (20B)',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsJsonMode: true,
    supportsVision: false,
    supportsTools: true,
    supportsReasoningEffort: true,
  },
  [VISION_PRIMARY]: {
    id: VISION_PRIMARY,
    provider: 'groq',
    displayName: 'Luna Vision 27B',
    contextWindow: 32768,
    maxOutputTokens: 2048,
    supportsStreaming: true,
    supportsJsonMode: false,
    supportsVision: true,
    supportsTools: false,
  },
  [GEMINI_FALLBACK_MODEL]: {
    id: GEMINI_FALLBACK_MODEL,
    provider: 'gemini',
    displayName: 'Gemini 1.5 Flash',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supportsStreaming: false,
    supportsJsonMode: true,
    supportsVision: true,
    supportsTools: true,
  },
};

export function isRetiredModel(modelId: string): boolean {
  return (RETIRED_MODELS as readonly string[]).includes(modelId);
}

export function getModelConfig(modelId: string): ModelConfiguration | undefined {
  return MODEL_REGISTRY[modelId];
}

export function isSupportedModel(modelId: string): boolean {
  return Boolean(modelId && !isRetiredModel(modelId) && MODEL_REGISTRY[modelId]);
}

export function resolveCandidateModels(options: {
  preferredModel?: string;
  resolvedModel?: string;
  hasVision?: boolean;
}): string[] {
  if (options.hasVision) {
    return [VISION_PRIMARY];
  }

  const rawList = [
    options.preferredModel,
    options.resolvedModel,
    CHAT_PRIMARY,
    ...CHAT_FALLBACKS,
  ].filter((m): m is string => Boolean(m && isSupportedModel(m)));

  return Array.from(new Set(rawList));
}

