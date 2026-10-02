import { GROQ_CONFIG } from '../config/ai.ts';
import { getGroqApiKey, getAiProxyUrl } from '../utils/aiSecurity.ts';
import { getSystemPromptForContext } from '../ai/appGuide.ts';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  dataSentContext?: string;
}

/**
 * Code Enforcement Filter: Strips ALL URLs, web links, and domain references
 * from responses before display.
 */
export function stripUrls(text: string): string {
  if (!text) return '';
  // 1. Convert markdown links [text](http...) -> text
  let cleaned = text.replace(/\[([^\]]+)\]\((https?:\/\/|www\.)[^\)]+\)/gi, '$1');
  // 2. Strip standard URLs starting with http://, https://, www.
  cleaned = cleaned.replace(/(https?:\/\/|www\.)[^\s<>\)\]}]+/gi, '');
  // 3. Strip common domain names (e.g. google.com, example.org)
  cleaned = cleaned.replace(/\b[a-zA-Z0-9-]+\.(com|org|net|io|co|dev|ai|app|gov|edu)(\/[^\s<>\)\]}]*)?/gi, '');
  return cleaned;
}

/**
 * Streams chat completions from Groq (Mode A) or Proxy URL (Mode B).
 */
export async function streamChatCompletion(
  messages: { role: string; content: string }[],
  currentPathname: string,
  userDataContext: string,
  onChunk: (chunkText: string) => void,
  onComplete: (fullText: string) => void,
  onError: (err: Error) => void,
  signal?: AbortSignal
): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    onError(new Error('AI needs internet connection. Please connect to the internet and try again.'));
    return;
  }

  const proxyUrl = getAiProxyUrl();
  const apiKey = getGroqApiKey();

  if (!proxyUrl && !apiKey) {
    onError(new Error('Groq API Key is missing. Please enter your API key in Settings > AI.'));
    return;
  }

  const targetUrl = proxyUrl ? `${proxyUrl.replace(/\/$/, '')}/v1/chat/completions` : GROQ_CONFIG.CHAT_COMPLETIONS_ENDPOINT;

  const baseSystemPrompt = getSystemPromptForContext(currentPathname);
  const fullSystemPrompt = userDataContext
    ? `${baseSystemPrompt}\n\nUSER DATA CONTEXT:\n${userDataContext}`
    : baseSystemPrompt;

  const fullMessages = [
    { role: 'system', content: fullSystemPrompt },
    ...messages,
  ];

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (!proxyUrl && apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const candidateModels = GROQ_CONFIG.MODELS.CHAT_FALLBACKS || [
    GROQ_CONFIG.MODELS.CHAT_PRIMARY,
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'llama3-70b-8192',
    'mixtral-8x7b-32768'
  ];

  let lastError: Error | null = null;

  for (const modelToTry of candidateModels) {
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: modelToTry,
          messages: fullMessages,
          temperature: 0.3,
          max_tokens: 1024,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Groq API Rate Limit reached. Please wait a moment and try again.');
        }
        if (response.status === 401) {
          throw new Error('Invalid Groq API Key. Please verify your key in Settings > AI.');
        }
        const errText = await response.text();
        // If model not found (404) or bad model parameter, continue to next fallback model
        if (response.status === 404 || errText.includes('model') || errText.includes('does not exist')) {
          console.warn(`[AI Client] Model ${modelToTry} unavailable (${response.status}), trying fallback...`);
          lastError = new Error(`AI request failed (${response.status}): ${errText.substring(0, 100)}`);
          continue;
        }
        throw new Error(`AI request failed (${response.status}): ${errText.substring(0, 100)}`);
      }

      if (!response.body) {
        throw new Error('Response body is unavailable for streaming.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') {
              const cleanFinal = stripUrls(accumulatedText);
              onComplete(cleanFinal);
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                accumulatedText += delta;
                const cleanChunk = stripUrls(accumulatedText);
                onChunk(cleanChunk);
              }
            } catch {}
          }
        }
      }

      const cleanFinal = stripUrls(accumulatedText);
      onComplete(cleanFinal);
      return; // Successful stream completion
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      lastError = err instanceof Error ? err : new Error(String(err));
      // If error is rate limit or auth, don't keep trying models
      if (lastError.message.includes('Rate Limit') || lastError.message.includes('Invalid Groq API Key')) {
        break;
      }
    }
  }

  if (lastError) {
    onError(lastError);
  }
}

/**
 * Transcribes recorded audio blob using Groq Whisper model (Mode A or Mode B).
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('AI needs internet connection for voice transcription.');
  }

  const proxyUrl = getAiProxyUrl();
  const apiKey = getGroqApiKey();

  if (!proxyUrl && !apiKey) {
    throw new Error('Groq API Key is missing. Please enter your API key in Settings > AI.');
  }

  const targetUrl = proxyUrl ? `${proxyUrl.replace(/\/$/, '')}/v1/audio/transcriptions` : GROQ_CONFIG.TRANSCRIPTION_ENDPOINT;

  const formData = new FormData();
  formData.append('file', audioBlob, 'voice_recording.webm');
  formData.append('model', GROQ_CONFIG.MODELS.AUDIO_TRANSCRIBE);
  formData.append('response_format', 'json');

  const headers: Record<string, string> = {};
  if (!proxyUrl && apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded during voice transcription.');
    }
    throw new Error(`Voice transcription failed (${response.status}).`);
  }

  const json = await response.json();
  return json.text || '';
}
