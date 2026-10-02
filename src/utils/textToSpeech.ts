/**
 * Text-to-Speech (TTS) Utility for LifeOS AI Chat
 * Uses the Web Speech Synthesis API to read AI responses aloud.
 */

let activeUtterance: SpeechSynthesisUtterance | null = null;
let onStateChangeCallback: ((speaking: boolean) => void) | null = null;

/**
 * Strips markdown symbols, code blocks, URLs, and action tags so speech sounds natural.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, '') // remove code blocks
    .replace(/`([^`]+)`/g, '$1') // remove inline code ticks
    .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
    .replace(/\*(.*?)\*/g, '$1') // remove italic
    .replace(/#{1,6}\s+/g, '') // remove markdown headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // link text only
    .replace(/[-*•]\s+/g, '') // remove list bullets
    .replace(/\|/g, ' ') // remove table pipes
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '') // remove emojis
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if speech synthesis is currently active.
 */
export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  return window.speechSynthesis.speaking;
}

/**
 * Reads the given text aloud using the best available local voice.
 */
export function speakText(text: string, onStateChange?: (speaking: boolean) => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return false;

  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Try to pick a natural English voice
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.localService)
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  onStateChangeCallback = onStateChange || null;

  utterance.onstart = () => {
    onStateChangeCallback?.(true);
  };

  utterance.onend = () => {
    activeUtterance = null;
    onStateChangeCallback?.(false);
  };

  utterance.onerror = () => {
    activeUtterance = null;
    onStateChangeCallback?.(false);
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Stops any ongoing speech synthesis.
 */
export function stopSpeaking(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
  }
  activeUtterance = null;
  onStateChangeCallback?.(false);
}
