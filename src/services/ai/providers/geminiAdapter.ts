import { GROQ_CONFIG } from '../../../config/ai.ts';
import { GEMINI_FALLBACK_MODEL } from '../modelRegistry.ts';
import {
  AIProviderError,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AIStreamEvent,
} from '../types.ts';
import { formatAiError, stripUrls } from '../errors.ts';

export class GeminiProviderAdapter implements AIProvider {
  readonly id = 'gemini' as const;

  async complete(request: AIRequest): Promise<AIResponse> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new AIProviderError(formatAiError('Offline'));
    }

    const apiKey = request.apiKey?.trim();
    if (!apiKey) {
      throw new AIProviderError({
        code: 'auth_invalid',
        friendlyMessage: 'Gemini API Key is missing.',
        statusCode: 401,
      });
    }

    const modelId = request.model || GEMINI_FALLBACK_MODEL;
    const timeoutMs = request.timeoutMs ?? GROQ_CONFIG.RATE_LIMITS.TIMEOUT_MS;
    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    const onAbort = () => controller.abort();
    if (request.signal) {
      if (request.signal.aborted) {
        clearTimeout(timeoutId);
        throw new AIProviderError(formatAiError(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
      }
      request.signal.addEventListener('abort', onAbort, { once: true });
    }

    const startedAt = Date.now();
    try {
      const promptText = request.messages
        .map((m) => (typeof m.content === 'string' ? `${m.role}: ${m.content}` : ''))
        .filter(Boolean)
        .join('\n\n');

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: request.temperature ?? (request.responseFormat === 'json' ? 0.1 : 0.7),
            ...(request.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new AIProviderError(formatAiError(txt, res.status, res.headers));
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanText = stripUrls(rawText.trim());
      if (!cleanText) {
        throw new AIProviderError({
          code: 'empty_response',
          friendlyMessage: 'Empty response from Gemini.',
          statusCode: 200,
        });
      }

      return {
        text: cleanText,
        model: modelId,
        provider: this.id,
        latencyMs: Date.now() - startedAt,
      };
    } catch (err: any) {
      if (err?.name === 'AbortError' && timedOut) {
        throw new AIProviderError(formatAiError('Request timeout', 408));
      }
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError(formatAiError(err));
    } finally {
      clearTimeout(timeoutId);
      request.signal?.removeEventListener('abort', onAbort);
    }
  }

  async stream(request: AIRequest, onEvent: (event: AIStreamEvent) => void): Promise<AIResponse> {
    const modelId = request.model || GEMINI_FALLBACK_MODEL;
    onEvent({ type: 'start', model: modelId, provider: this.id });
    const response = await this.complete(request);
    onEvent({ type: 'token', delta: response.text, accumulated: response.text, model: modelId });
    onEvent({ type: 'complete', response });
    return response;
  }
}

export const geminiAdapter = new GeminiProviderAdapter();

