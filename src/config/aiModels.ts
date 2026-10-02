/**
 * LifeOS Central AI Models Configuration
 * Single Source of Truth for all AI features across the application.
 */

export const CHAT_PRIMARY = 'openai/gpt-oss-120b';
export const CHAT_FALLBACKS = ['openai/gpt-oss-20b'] as const;

export const STT_PRIMARY = 'whisper-large-v3-turbo';
export const STT_FALLBACKS = ['whisper-large-v3'] as const;

export const ALLOWED_CHAT_MODELS = [
  CHAT_PRIMARY,
  ...CHAT_FALLBACKS,
] as const;

export const ALLOWED_STT_MODELS = [
  STT_PRIMARY,
  ...STT_FALLBACKS,
] as const;

/**
 * Blocklist of retired / decommissioned / unsupported models
 */
export const RETIRED_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'llama-3.1-70b-versatile',
  'llama-3.2-1b-preview',
  'llama-3.2-3b-preview',
  'llama-3.2-11b-vision-preview',
  'llama-3.2-90b-vision-preview',
  'mixtral-8x7b-32768',
  'gemma-7b-it',
  'gemma2-9b-it',
  'deepseek-r1-distill-llama-70b',
  'deepseek-r1-distill-qwen-32b',
  'qwen/qwen3-32b',
  'qwen/qwen3.6-27b',
  'qwen/qwen3.8-27b',
  'groq/compound-mini',
] as const;

export type AllowedChatModel = (typeof ALLOWED_CHAT_MODELS)[number];
export type AllowedSttModel = (typeof ALLOWED_STT_MODELS)[number];

export const GROQ_STORAGE_KEYS = {
  ACTIVE_CHAT_MODEL: 'lifeos_groq_active_chat_model',
  CACHED_MODELS_LIST: 'lifeos_groq_cached_models_list',
  LAST_MODELS_CHECK: 'lifeos_groq_last_models_check',
  SETTINGS_SCHEMA_VERSION: 'lifeos_ai_settings_schema_version',
  LAST_AI_ERROR: 'lifeos_ai_last_error',
} as const;

export const CURRENT_AI_SCHEMA_VERSION = 3;
