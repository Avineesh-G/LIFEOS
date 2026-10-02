/**
 * LifeOS — Native Web Speech Recognition Wrapper
 * 
 * Provides real-time, low-latency, zero-cost voice transcription
 * using the browser's native SpeechRecognition API (Chrome, Edge, Android).
 */

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
}

export type SpeechCallback = (result: SpeechRecognitionResultState) => void;
export type SpeechErrorCallback = (error: string) => void;
export type SpeechEndCallback = () => void;

// Safe global typing for browser SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export class LifeOSSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private onResultCb: SpeechCallback | null = null;
  private onErrorCb: SpeechErrorCallback | null = null;
  private onEndCb: SpeechEndCallback | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          const combined = (finalTranscript || interimTranscript).trim();
          if (this.onResultCb && combined) {
            this.onResultCb({
              transcript: combined,
              isFinal: Boolean(finalTranscript),
            });
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('[LifeOS Speech] Recognition error:', event.error);
          if (event.error === 'no-speech') {
            return;
          }
          if (this.onErrorCb) {
            this.onErrorCb(event.error || 'Speech recognition failed.');
          }
          this.isListening = false;
        };

        this.recognition.onend = () => {
          this.isListening = false;
          if (this.onEndCb) {
            this.onEndCb();
          }
        };
      }
    }
  }

  public isSupported(): boolean {
    return Boolean(this.recognition);
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public start(
    onResult: SpeechCallback,
    onError?: SpeechErrorCallback,
    onEnd?: SpeechEndCallback
  ): boolean {
    if (!this.recognition) return false;
    if (this.isListening) {
      this.stop();
    }

    this.onResultCb = onResult;
    this.onErrorCb = onError || null;
    this.onEndCb = onEnd || null;

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (err: any) {
      console.warn('[LifeOS Speech] Start failed:', err);
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  public abort(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch {}
      this.isListening = false;
    }
  }
}

export const speechRecognizer = new LifeOSSpeechRecognizer();
