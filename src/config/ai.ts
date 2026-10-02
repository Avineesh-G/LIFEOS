/**
 * LifeOS AI Configuration - Groq API Models, Endpoints & Rate Limits
 * Verification Date: 2026-10-01
 * 
 * Verified Groq API Specifications:
 * - OpenAI-compatible Chat Completions: https://api.groq.com/openai/v1/chat/completions
 * - OpenAI-compatible Transcriptions (STT): https://api.groq.com/openai/v1/audio/transcriptions
 * - Streaming Format: Server-Sent Events (SSE) data: { ... }, ended by data: [DONE]
 * - Chat Models: llama-3.3-70b-versatile (Primary high intelligence), llama-3.1-8b-instant (Fast response)
 * - Audio Model: whisper-large-v3-turbo (Ultra-fast speech-to-text)
 */

export const GROQ_CONFIG = {
  BASE_URL: 'https://api.groq.com/openai/v1',
  CHAT_COMPLETIONS_ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
  TRANSCRIPTION_ENDPOINT: 'https://api.groq.com/openai/v1/audio/transcriptions',
  MODELS: {
    CHAT_PRIMARY: 'llama-3.1-8b-instant',
    CHAT_FAST: 'llama-3.1-8b-instant',
    CHAT_FALLBACKS: [
      'llama-3.1-8b-instant',
      'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'llama3-70b-8192',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ] as const,
    AUDIO_TRANSCRIBE: 'whisper-large-v3-turbo',
    AUDIO_TRANSCRIBE_FALLBACK: 'whisper-large-v3',
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
  },
} as const;

export const STARTER_SUGGESTION_CHIPS = [
  { id: 'spending_summary', label: 'How much did I spend this week?', icon: 'Wallet' },
  { id: 'tasks_pending', label: "What's left on my tasks today?", icon: 'CheckSquare' },
  { id: 'gym_progress', label: 'Summarize my recent workout progress', icon: 'Dumbbell' },
  { id: 'nutrition_overview', label: 'How are my calories & macros today?', icon: 'Utensils' },
];
