import { GROQ_CONFIG } from '../config/ai.ts';
import {
  CHAT_PRIMARY,
  CHAT_FALLBACKS,
  STT_PRIMARY,
  STT_FALLBACKS,
  GROQ_STORAGE_KEYS,
} from '../config/aiModels.ts';
import { getGroqApiKey, getAiProxyUrl } from '../utils/aiSecurity.ts';
import { getSystemPromptForContext } from '../ai/appGuide.ts';
import { resolveActiveChatModel, markModelFailedInSession } from './aiModelResolver.ts';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  dataSentContext?: string;
}

export interface AiErrorPayload {
  friendlyMessage: string;
  rawDetails?: string;
  statusCode?: number;
  retryAfterSeconds?: number;
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
 * Redacts any API keys from error messages and debug outputs
 */
export function redactKeys(text: string): string {
  if (!text) return '';
  return text
    .replace(/gsk_[a-zA-Z0-9_-]{10,}/g, 'gsk_***[REDACTED]***')
    .replace(/AIza[a-zA-Z0-9_-]{10,}/g, 'AIza***[REDACTED]***')
    .replace(/Bearer\s+[a-zA-Z0-9_\.-]+/gi, 'Bearer ***[REDACTED]***');
}

/**
 * Parses upstream Groq error and returns friendly message + sanitized details
 */
export function formatAiError(err: any, status?: number, headers?: Headers): AiErrorPayload {
  const raw = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
  const sanitizedDetails = redactKeys(raw);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      friendlyMessage: 'AI needs internet.',
      rawDetails: 'Browser is currently offline.',
      statusCode: 0,
    };
  }

  if (status === 401 || sanitizedDetails.toLowerCase().includes('invalid api key') || sanitizedDetails.toLowerCase().includes('unauthorized')) {
    return {
      friendlyMessage: 'Your Groq key was rejected. Check it in Settings > AI.',
      rawDetails: sanitizedDetails,
      statusCode: 401,
    };
  }

  if (status === 429 || sanitizedDetails.toLowerCase().includes('rate limit') || sanitizedDetails.toLowerCase().includes('rate_limit_exceeded')) {
    let retrySec = 10;
    if (headers?.get('retry-after')) {
      const parsed = parseInt(headers.get('retry-after') || '', 10);
      if (!isNaN(parsed) && parsed > 0) retrySec = parsed;
    }
    return {
      friendlyMessage: `Rate limit reached. Try again in ${retrySec} seconds.`,
      rawDetails: sanitizedDetails,
      statusCode: 429,
      retryAfterSeconds: retrySec,
    };
  }

  if (status === 404 || sanitizedDetails.toLowerCase().includes('does not exist') || sanitizedDetails.toLowerCase().includes('model_not_found') || sanitizedDetails.toLowerCase().includes('model_decommissioned')) {
    return {
      friendlyMessage: 'No supported AI model is available.',
      rawDetails: sanitizedDetails,
      statusCode: 404,
    };
  }

  if (status === 400) {
    return {
      friendlyMessage: 'The AI request was rejected.',
      rawDetails: sanitizedDetails,
      statusCode: 400,
    };
  }

  if (sanitizedDetails.toLowerCase().includes('timeout') || sanitizedDetails.toLowerCase().includes('abort')) {
    return {
      friendlyMessage: 'The AI took too long. Try again.',
      rawDetails: sanitizedDetails,
      statusCode: 408,
    };
  }

  return {
    friendlyMessage: sanitizedDetails.length > 80 ? 'An error occurred while calling Groq AI.' : sanitizedDetails,
    rawDetails: sanitizedDetails,
    statusCode: status || 500,
  };
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
  onError: (err: Error, errorPayload?: AiErrorPayload) => void,
  signal?: AbortSignal
): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const payload = formatAiError('Offline');
    onError(new Error(payload.friendlyMessage), payload);
    return;
  }

  const proxyUrl = getAiProxyUrl();
  const apiKey = getGroqApiKey();

  if (!proxyUrl && !apiKey) {
    const payload: AiErrorPayload = {
      friendlyMessage: 'Groq API Key is missing. Please enter your API key in Settings > AI.',
      rawDetails: 'No API key or Proxy URL configured in user storage.',
      statusCode: 401,
    };
    onError(new Error(payload.friendlyMessage), payload);
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

  // Resolve best active model dynamically
  const resolution = await resolveActiveChatModel(apiKey);
  const initialModel = resolution.activeModel;

  const candidateModels = [
    initialModel,
    ...CHAT_FALLBACKS.filter(m => m !== initialModel),
    CHAT_PRIMARY,
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastErrorPayload: AiErrorPayload | null = null;
  let lastErrorObj: Error | null = null;

  for (const modelToTry of candidateModels) {
    try {
      const requestPayload: any = {
        model: modelToTry,
        messages: fullMessages,
        temperature: 0.3,
        max_completion_tokens: 2048,
        stream: true,
      };

      if (modelToTry.includes('gpt-oss')) {
        requestPayload.reasoning_effort = 'low';
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
        signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        let cleanErrorMessage = errText;
        try {
          const parsed = JSON.parse(errText);
          cleanErrorMessage = parsed.error?.message || errText;
        } catch {}

        const parsedPayload = formatAiError(cleanErrorMessage, response.status, response.headers);
        lastErrorPayload = parsedPayload;
        lastErrorObj = new Error(parsedPayload.friendlyMessage);

        try {
          localStorage.setItem(GROQ_STORAGE_KEYS.LAST_AI_ERROR, JSON.stringify(parsedPayload));
        } catch {}

        // Model not found, decommissioned, or invalid model 404/400 -> mark failed for session and fallback
        if (
          response.status === 404 ||
          (response.status === 400 && (cleanErrorMessage.toLowerCase().includes('model') || cleanErrorMessage.toLowerCase().includes('decommissioned') || cleanErrorMessage.toLowerCase().includes('deprecated') || cleanErrorMessage.toLowerCase().includes('does not exist')))
        ) {
          console.warn(`[AI Client] Model ${modelToTry} unavailable: ${cleanErrorMessage}, marking bad and trying fallback...`);
          markModelFailedInSession(modelToTry);
          continue;
        }

        // Fatal errors (401 invalid key, rate limits) should stop trying
        onError(lastErrorObj, parsedPayload);
        return;
      }

      if (!response.body) {
        throw new Error('Response body is unavailable for streaming.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedVisibleText = '';
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
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              // Ignore reasoning chunks in delta (gpt-oss reasoning)
              // Only collect delta.content (visible text)
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent && typeof deltaContent === 'string') {
                accumulatedVisibleText += deltaContent;
                const cleanChunk = stripUrls(accumulatedVisibleText);
                onChunk(cleanChunk);
              }
            } catch {}
          }
        }
      }

      // Step 5: If stream ended with no visible text, fallback once to non-streaming
      if (!accumulatedVisibleText.trim()) {
        console.warn(`[AI Client] Stream finished with 0 visible text. Attempting non-streaming retry on ${modelToTry}...`);
        const nonStreamPayload = {
          ...requestPayload,
          stream: false,
        };

        const retryRes = await fetch(targetUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(nonStreamPayload),
          signal,
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          let fallbackReply = retryData.choices?.[0]?.message?.content || '';
          fallbackReply = fallbackReply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

          if (fallbackReply) {
            const cleanFinal = stripUrls(fallbackReply);
            onComplete(cleanFinal);
            return;
          }
        }

        const emptyPayload: AiErrorPayload = {
          friendlyMessage: 'The AI returned an empty answer. Try again.',
          rawDetails: 'Both streaming and non-streaming responses contained 0 visible completion characters.',
          statusCode: 200,
        };
        onError(new Error(emptyPayload.friendlyMessage), emptyPayload);
        return;
      }

      const cleanFinal = stripUrls(accumulatedVisibleText);
      onComplete(cleanFinal);
      return; // Successful completion
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const parsedPayload = formatAiError(err);
      lastErrorPayload = parsedPayload;
      lastErrorObj = new Error(parsedPayload.friendlyMessage);
    }
  }

  if (lastErrorPayload && lastErrorObj) {
    onError(lastErrorObj, lastErrorPayload);
  } else {
    const generic = formatAiError('No response received from AI');
    onError(new Error(generic.friendlyMessage), generic);
  }
}

/**
 * Transcribes recorded audio blob using Groq Whisper model (Mode A or Mode B).
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('AI needs internet.');
  }

  const proxyUrl = getAiProxyUrl();
  const apiKey = getGroqApiKey();

  if (!proxyUrl && !apiKey) {
    throw new Error('Your Groq key was rejected. Check it in Settings > AI.');
  }

  const targetUrl = proxyUrl ? `${proxyUrl.replace(/\/$/, '')}/v1/audio/transcriptions` : GROQ_CONFIG.TRANSCRIPTION_ENDPOINT;

  const candidateAudioModels = [STT_PRIMARY, ...STT_FALLBACKS];
  let lastError: Error | null = null;

  for (const modelToTry of candidateAudioModels) {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_recording.webm');
      formData.append('model', modelToTry);
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
        const errText = await response.text();
        if (response.status === 404 || response.status === 400) {
          lastError = new Error(errText);
          continue;
        }
        if (response.status === 429) {
          throw new Error('Rate limit reached during voice transcription.');
        }
        throw new Error(`Voice transcription failed (${response.status}).`);
      }

      const json = await response.json();
      return json.text || '';
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Voice transcription failed with all available models.');
}
