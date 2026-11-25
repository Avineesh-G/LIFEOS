import { GROQ_CONFIG } from '../config/ai.ts';
import { STT_PRIMARY, STT_FALLBACKS, GROQ_STORAGE_KEYS } from '../config/aiModels.ts';
import { getGroqApiKey, getAiProxyUrl, getLetAiReadData } from '../utils/aiSecurity.ts';
import { getLayeredSystemPrompt, getSystemPromptForContext } from '../ai/appGuide.ts';
import { classifyDomain, type LunaDomain } from '../ai/prompts/domains.ts';
import { streamAIRequest } from './ai/aiGateway.ts';
import { buildBoundedConversationWindow } from './ai/contextBudget.ts';
import { formatEnabledMemoriesForPrompt } from './ai/memoryService.ts';
import { retrieveRelevantKnowledge } from './ai/ragRetrieval.ts';
import { normalizeModelOutput } from './ai/responseSchema.ts';
import { recordLunaTelemetry } from './ai/telemetry.ts';
import {
  AIProviderError,
  type AIProviderErrorCode,
  type AiErrorPayload,
  type AIMessage,
} from './ai/types.ts';
import {
  formatAiError,
  parseSseChunkBuffer,
  redactKeys,
  stripUrls,
  toAIProviderError,
} from './ai/errors.ts';
import type { AppData } from '../types.ts';

export {
  AIProviderError,
  formatAiError,
  parseSseChunkBuffer,
  redactKeys,
  stripUrls,
  type AIProviderErrorCode,
  type AiErrorPayload,
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  dataSentContext?: string;
  images?: string[];
}

export interface StreamChatOptions {
  preferredModel?: string;
  timeoutMs?: number;
  domain?: LunaDomain;
  systemPromptOverride?: string;
  userId?: string;
  appData?: Partial<AppData>;
}

/**
 * Phase 12 feature flag allowing instant rollback to legacy prompt window if needed.
 */
export function isLunaV2PipelineEnabled(): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('lifeos_luna_v2_pipeline') !== 'false';
    }
  } catch {}
  return true;
}

/**
 * Streams chat completions through the provider-independent AI Gateway with
 * domain routing, bounded conversation window, RAG retrieval, and TTFT telemetry.
 */
export async function streamChatCompletion(
  messages: { role: string; content: string; images?: string[] }[],
  currentPathname: string,
  userDataContext: string,
  onChunk: (chunkText: string) => void,
  onComplete: (fullText: string) => void,
  onError: (err: Error, errorPayload?: AiErrorPayload) => void,
  signal?: AbortSignal,
  options?: StreamChatOptions
): Promise<void> {
  const startedAt = Date.now();
  let firstTokenAt: number | null = null;
  let activeModel = options?.preferredModel || 'unknown';

  const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const latestQueryText = latestUserMsg?.content || '';
  const domain: LunaDomain = options?.domain ?? classifyDomain(latestQueryText, currentPathname);
  const v2Enabled = isLunaV2PipelineEnabled();

  const rawAiMessages: AIMessage[] = messages.map((m) => ({
    role: (m.role === 'system' || m.role === 'assistant' ? m.role : 'user') as AIMessage['role'],
    content: m.content,
    images: m.images,
  }));

  const bounded = v2Enabled
    ? buildBoundedConversationWindow(rawAiMessages, 3200, 4)
    : { summaryBlock: '', recentMessages: rawAiMessages, droppedCount: 0, estimatedTokens: 0 };

  const memoryContext =
    v2Enabled && options?.userId ? formatEnabledMemoriesForPrompt(options.userId) : '';

  const shouldRunRag =
    v2Enabled &&
    getLetAiReadData() &&
    Boolean(options?.appData) &&
    (domain === 'study' || domain === 'general') &&
    latestQueryText.trim().length > 4;

  const ragResult = shouldRunRag
    ? retrieveRelevantKnowledge(latestQueryText, options!.appData!, 3, 0.25)
    : { chunks: [], citations: [], contextBlock: '' };

  const fullSystemPrompt = options?.systemPromptOverride
    ? userDataContext
      ? `${options.systemPromptOverride}\n\nUSER DATA CONTEXT:\n${userDataContext}`
      : options.systemPromptOverride
    : v2Enabled
    ? getLayeredSystemPrompt({
        pathname: currentPathname,
        domain,
        userQuery: latestQueryText,
        userDataContext,
        memoryContext,
        ragContext: ragResult.contextBlock,
        summaryContext: bounded.summaryBlock,
      })
    : (() => {
        const base = getSystemPromptForContext(currentPathname, latestQueryText);
        return userDataContext ? `${base}\n\nUSER DATA CONTEXT:\n${userDataContext}` : base;
      })();

  const hasImages = bounded.recentMessages.some((m) => Array.isArray(m.images) && m.images.length > 0);
  const aiMessages: AIMessage[] = [
    { role: 'system', content: fullSystemPrompt },
    ...bounded.recentMessages,
  ];

  try {
    const response = await streamAIRequest(
      {
        messages: aiMessages,
        temperature: hasImages ? 0.2 : 0.3,
        maxTokens: hasImages ? 2048 : 1536,
        timeoutMs: options?.timeoutMs,
        signal,
      },
      (event) => {
        if (event.type === 'start') {
          activeModel = event.model;
        } else if (event.type === 'token') {
          if (firstTokenAt === null) {
            firstTokenAt = Date.now();
          }
          onChunk(event.accumulated);
        }
      },
      {
        hasVision: hasImages,
        preferredModel: options?.preferredModel,
      }
    );

    const normalized = normalizeModelOutput(response.text, domain);
    recordLunaTelemetry({
      timestamp: new Date().toISOString(),
      provider: response.provider,
      model: response.model,
      domain,
      ttftMs: firstTokenAt !== null ? firstTokenAt - startedAt : null,
      totalMs: Date.now() - startedAt,
      contextTokensEst: bounded.estimatedTokens + Math.ceil(fullSystemPrompt.length / 4),
      success: true,
      aborted: false,
    });

    onComplete(normalized.content);
  } catch (err: unknown) {
    const providerErr = toAIProviderError(err);
    const isAborted = providerErr.code === 'aborted';

    recordLunaTelemetry({
      timestamp: new Date().toISOString(),
      provider: 'groq',
      model: activeModel,
      domain,
      ttftMs: firstTokenAt !== null ? firstTokenAt - startedAt : null,
      totalMs: Date.now() - startedAt,
      contextTokensEst: bounded.estimatedTokens,
      success: false,
      aborted: isAborted,
      errorCode: providerErr.code,
    });

    if (isAborted) {
      return;
    }

    const payload: AiErrorPayload = {
      code: providerErr.code,
      friendlyMessage: providerErr.message,
      rawDetails: providerErr.rawDetails,
      statusCode: providerErr.statusCode,
      retryAfterSeconds: providerErr.retryAfterSeconds,
      retryable: providerErr.retryable,
    };

    try {
      localStorage.setItem(GROQ_STORAGE_KEYS.LAST_AI_ERROR, JSON.stringify(payload));
    } catch {}

    onError(providerErr, payload);
  }
}

export interface AudioTranscriptionResult {
  text: string;
  language?: string;
}

/**
 * Transcribes recorded audio blob using Groq Whisper model with automatic language detection.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<AudioTranscriptionResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
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

  const mime = audioBlob.type || 'audio/webm';
  let ext = 'webm';
  if (mime.includes('mp4') || mime.includes('m4a')) ext = 'm4a';
  else if (mime.includes('ogg')) ext = 'ogg';
  else if (mime.includes('wav')) ext = 'wav';
  else if (mime.includes('aac')) ext = 'aac';

  const conditioningPrompt =
    'LifeOS speech recognition: Automatically transcribe in the exact spoken language and script: English, Telugu (తెలుగు), Hindi (हिंदी), Tamil (தமிழ்), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Marathi (मराठी), Bengali (বাংলা), Gujarati (ગુજરાતી), and global languages.';

  for (const modelToTry of candidateAudioModels) {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, `voice_recording.${ext}`);
      formData.append('model', modelToTry);
      formData.append('response_format', 'verbose_json');
      formData.append('temperature', '0');
      formData.append('prompt', conditioningPrompt);

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
      return {
        text: json.text || '',
        language: json.language || undefined,
      };
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError || new Error('Voice transcription failed with all available models.');
}
