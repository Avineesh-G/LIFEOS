export interface AppVersionConfig {
  versionCode: number;
  versionName: string;
  releaseDate: string;
  releaseNotes: string;
  apkSize?: string;
  apkSizeBytes?: number;
}

export const APP_VERSION: AppVersionConfig = {
  versionCode: 58,
  versionName: '3.2.0',
  releaseDate: '2026-10-04',
  apkSize: '13.82 MB',
  apkSizeBytes: 14490000,
  releaseNotes: 'LifeOS v3.2.0 (Build 58):\n• Spaced Repetition Active Recall Deck: Interactive 3D flip flashcards, Leitner review intervals (Again, Hard, Good, Easy), and deck creator\n• Voice Lecture & Meeting Smart Transcriber: Real-time waveform audio recorder, Groq Whisper transcription, Luna 3-bullet executive summary, and 1-tap task extraction into To-Do & Notes\n• Luna AI Conversational Assistant Revamp: Scaled companion mascot doll, compact quick-action suggestion chips, and high-speed Groq API integration\n• Study Suite Ecosystem: Integrated Active Recall & Voice Transcriber into the Study Hub\n• App-Wide Mobile Layout Optimization: Zero empty gaps, refined card padding, and optimized responsive layouts across all interfaces',
};

export const CURRENT_VERSION_CODE = APP_VERSION.versionCode;
export const CURRENT_VERSION_NAME = APP_VERSION.versionName;
