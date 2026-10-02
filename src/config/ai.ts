/**
 * LifeOS AI Configuration - Groq API Models, Endpoints & Rate Limits
 */
import {
  CHAT_PRIMARY,
  CHAT_FALLBACKS,
  STT_PRIMARY,
  STT_FALLBACKS,
  ALLOWED_CHAT_MODELS,
  ALLOWED_STT_MODELS,
  RETIRED_MODELS,
  GROQ_STORAGE_KEYS,
} from './aiModels.ts';

export const GROQ_CONFIG = {
  BASE_URL: 'https://api.groq.com/openai/v1',
  CHAT_COMPLETIONS_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
  TRANSCRIPTION_ENDPOINT: 'https://api.groq.com/openai/v1/audio/transcriptions',
  MODELS: {
    CHAT_PRIMARY,
    CHAT_FAST: CHAT_FALLBACKS[0],
    CHAT_FALLBACKS,
    AUDIO_TRANSCRIBE: STT_PRIMARY,
    AUDIO_TRANSCRIBE_FALLBACK: STT_FALLBACKS[0],
    ALLOWED_CHAT_MODELS,
    ALLOWED_STT_MODELS,
    RETIRED_MODELS,
  },
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 30,
    TOKENS_PER_MINUTE: 14400,
    TIMEOUT_MS: 30000,
  },
  STORAGE_KEYS: {
    GROQ_API_KEY: 'lifeos_groq_api_key',
    PROXY_URL: 'lifeos_ai_proxy_url',
    PRIVACY_READ_DATA: 'lifeos_ai_read_data',
    PRIVACY_SECTIONS: 'lifeos_ai_section_permissions',
    ACTION_ALLOW_CHANGES: 'lifeos_ai_allow_changes',
    CONSENT_AGREED: 'lifeos_ai_consent_agreed',
    CHAT_HISTORY: 'lifeos_ai_chat_history',
    ...GROQ_STORAGE_KEYS,
  },
} as const;

export const STARTER_SUGGESTION_CHIPS = [
  { id: 'spending_summary', label: 'How much did I spend this week?', icon: 'Wallet' },
  { id: 'tasks_pending', label: "What's left on my tasks today?", icon: 'CheckSquare' },
  { id: 'gym_progress', label: 'Summarize my recent workout progress', icon: 'Dumbbell' },
  { id: 'nutrition_overview', label: 'How are my calories & macros today?', icon: 'Utensils' },
];
