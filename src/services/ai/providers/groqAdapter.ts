import { GROQ_CONFIG } from '../../../config/ai.ts';
import { CHAT_PRIMARY } from '../../../config/aiModels.ts';
import { markModelFailedInSession } from '../../aiModelResolver.ts';
import { getModelConfig } from '../modelRegistry.ts';
import {
  AIProviderError,
  type AIProvider,
  type AIRequest,
  type AIResponse,
  type AIStreamEvent,
} from '../types.ts';
import {
  computeBackoffMs,
  formatAiError,
  parseSseChunkBuffer,
  stripUrls,
} from '../errors.ts';

function buildGroqMessages(request: AIRequest) {
  return request.messages.map((m) => {
    if (Array.isArray(m.images) && m.images.length > 0) {
      const textPrompt = typeof m.content === 'string' && m.content
        ? m.content
        : 'Analyze the attached image(s), identify language, transcribe content, categorize by LifeOS module, and provide action proposals.';
      return {
        role: m.role,
        content: [
          { type: 'text', text: textPrompt },
          ...m.images.map((url) => ({
            type: 'image_url',
            image_url: { url },
          })),
        ],
      };
    }
    return {
      role: m.role,
      content: m.content,
    };
  });
}

function isModelError(status: number, errMessage: string): boolean {
  const lower = errMessage.toLowerCase();
  return (
    status === 404 ||
    status === 422 ||
    (status === 400 &&
      (lower.includes('model') ||
        lower.includes('decommissioned') ||
        lower.includes('deprecated') ||
        lower.includes('does not exist') ||
        lower.includes('not found')))
  );
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

async function sleepWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export class GroqProviderAdapter implements AIProvider {
  readonly id = 'groq' as const;

  async complete(request: AIRequest): Promise<AIResponse> {
    return this.executeInternal({ ...request, stream: false });
  }

  async stream(request: AIRequest, onEvent: (event: AIStreamEvent) => void): Promise<AIResponse> {
    return this.executeInternal({ ...request, stream: true }, onEvent);
  }

  private async executeInternal(
    request: AIRequest,
    onEvent?: (event: AIStreamEvent) => void
  ): Promise<AIResponse> {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      const payload = formatAiError('Offline');
      throw new AIProviderError(payload);
    }

    const proxyUrl = request.proxyUrl?.trim();
    const apiKey = request.apiKey?.trim();
    if (!proxyUrl && !apiKey) {
      throw new AIProviderError({
        code: 'auth_invalid',
        friendlyMessage: 'Groq API Key is missing. Please enter your API key in Settings > AI.',
        statusCode: 401,
        retryable: false,
      });
    }

    const targetUrl = proxyUrl
      ? `${proxyUrl.replace(/\/$/, '')}/v1/chat/completions`
      : GROQ_CONFIG.CHAT_COMPLETIONS_ENDPOINT;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (proxyUrl) {
      if (request.firebaseIdToken) {
        headers['Authorization'] = `Bearer ${request.firebaseIdToken}`;
      }
      if (apiKey) {
        headers['X-Provider-Key'] = apiKey;
      }
    } else if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const candidates =
      request.candidateModels && request.candidateModels.length > 0
        ? request.candidateModels
        : [request.model || CHAT_PRIMARY];

    const formattedMessages = buildGroqMessages(request);
    const timeoutMs = request.timeoutMs ?? GROQ_CONFIG.RATE_LIMITS.TIMEOUT_MS;
    const maxRetries = Math.min(request.maxRetries ?? 2, 3);
    let lastError: AIProviderError | null = null;

    for (const modelId of candidates) {
      const config = getModelConfig(modelId);
      const shouldStream = Boolean(request.stream && (config ? config.supportsStreaming : true));

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const startedAt = Date.now();
        const attemptController = new AbortController();
        let timedOut = false;

        const timeoutId = setTimeout(() => {
          timedOut = true;
          attemptController.abort();
        }, timeoutMs);

        const onExternalAbort = () => attemptController.abort();
        if (request.signal) {
          if (request.signal.aborted) {
            clearTimeout(timeoutId);
            throw new AIProviderError(formatAiError(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
          }
          request.signal.addEventListener('abort', onExternalAbort, { once: true });
        }

        try {
          const payload: Record<string, any> = {
            model: modelId,
            messages: formattedMessages,
            temperature: request.temperature ?? 0.3,
            max_completion_tokens: Math.min(
              request.maxTokens ?? 1536,
              config?.maxOutputTokens ?? 4096
            ),
            stream: shouldStream,
          };

          if (config?.supportsReasoningEffort || modelId.includes('gpt-oss')) {
            payload.reasoning_effort = 'low';
          }
          if (request.responseFormat === 'json' && (config?.supportsJsonMode ?? true) && !shouldStream) {
            payload.response_format = { type: 'json_object' };
          }

          if (shouldStream) {
            onEvent?.({ type: 'start', model: modelId, provider: this.id });
          }

          const res = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: attemptController.signal,
          });

          if (!res.ok) {
            const errText = await res.text();
            let cleanErr = errText;
            try {
              cleanErr = JSON.parse(errText)?.error?.message || errText;
            } catch {}

            const errPayload = formatAiError(cleanErr, res.status, res.headers);
            const providerErr = new AIProviderError(errPayload);
            lastError = providerErr;

            // Model issue: try next candidate immediately
            if (isModelError(res.status, cleanErr)) {
              markModelFailedInSession(modelId);
              break;
            }

            // Never retry 400 / 401 / 403 / 404
            if (!isRetryableStatus(res.status)) {
              throw providerErr;
            }

            if (attempt < maxRetries) {
              const delayMs = errPayload.retryAfterSeconds
                ? Math.min(errPayload.retryAfterSeconds * 1000, 4500)
                : computeBackoffMs(attempt);
              await sleepWithAbort(delayMs, request.signal);
              continue;
            }
            throw providerErr;
          }

          if (!shouldStream) {
            const data = await res.json();
            let text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.message?.reasoning || '';
            text = stripUrls(text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim());
            if (!text) {
              throw new AIProviderError({
                code: 'empty_response',
                friendlyMessage: 'The AI returned an empty answer. Try again.',
                statusCode: 200,
              });
            }
            const usage = data?.usage
              ? {
                  promptTokens: data.usage.prompt_tokens,
                  completionTokens: data.usage.completion_tokens,
                  totalTokens: data.usage.total_tokens,
                }
              : undefined;
            const aiResp: AIResponse = {
              text,
              model: modelId,
              provider: this.id,
              usage,
              latencyMs: Date.now() - startedAt,
            };
            if (usage) onEvent?.({ type: 'usage', usage });
            onEvent?.({ type: 'complete', response: aiResp });
            return aiResp;
          }

          if (!res.body) {
            throw new AIProviderError({
              code: 'malformed_stream',
              friendlyMessage: 'Response body is unavailable for streaming.',
              statusCode: 502,
            });
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let accumulatedVisible = '';
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parsedBatch = parseSseChunkBuffer(buffer);
            buffer = parsedBatch.remainder;

            if (parsedBatch.deltas.length > 0) {
              const delta = parsedBatch.deltas.join('');
              accumulatedVisible += delta;
              const cleanAccumulated = stripUrls(accumulatedVisible);
              onEvent?.({
                type: 'token',
                delta,
                accumulated: cleanAccumulated,
                model: modelId,
              });
            }

            if (parsedBatch.done) break;
          }

          buffer += decoder.decode();
          if (buffer.trim()) {
            const tailBatch = parseSseChunkBuffer(buffer + '\n');
            if (tailBatch.deltas.length > 0) {
              accumulatedVisible += tailBatch.deltas.join('');
            }
          }

          // Fallback once to non-streaming if stream produced 0 visible characters
          if (!accumulatedVisible.trim()) {
            const nonStreamRes = await fetch(targetUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify({ ...payload, stream: false }),
              signal: attemptController.signal,
            });
            if (nonStreamRes.ok) {
              const retryData = await nonStreamRes.json();
              const rawFallback = (retryData?.choices?.[0]?.message?.content || '')
                .replace(/<think>[\s\S]*?<\/think>/gi, '')
                .trim();
              if (rawFallback) {
                const cleanFallback = stripUrls(rawFallback);
                const aiResp: AIResponse = {
                  text: cleanFallback,
                  model: modelId,
                  provider: this.id,
                  latencyMs: Date.now() - startedAt,
                };
                onEvent?.({ type: 'complete', response: aiResp });
                return aiResp;
              }
            }
            throw new AIProviderError({
              code: 'empty_response',
              friendlyMessage: 'The AI returned an empty answer. Try again.',
              statusCode: 200,
            });
          }

          const cleanFinal = stripUrls(accumulatedVisible);
          const aiResp: AIResponse = {
            text: cleanFinal,
            model: modelId,
            provider: this.id,
            latencyMs: Date.now() - startedAt,
          };
          onEvent?.({ type: 'complete', response: aiResp });
          return aiResp;
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            if (timedOut) {
              const timeoutErr = new AIProviderError(formatAiError('Request timeout', 408));
              lastError = timeoutErr;
              if (attempt < maxRetries) {
                await sleepWithAbort(computeBackoffMs(attempt), request.signal);
                continue;
              }
              throw timeoutErr;
            }
            throw new AIProviderError(formatAiError(err));
          }
          if (err instanceof AIProviderError) {
            lastError = err;
            if (!err.retryable || attempt >= maxRetries) {
              throw err;
            }
            await sleepWithAbort(computeBackoffMs(attempt), request.signal);
            continue;
          }
          const wrapped = new AIProviderError(formatAiError(err));
          lastError = wrapped;
          if (!wrapped.retryable || attempt >= maxRetries) {
            throw wrapped;
          }
          await sleepWithAbort(computeBackoffMs(attempt), request.signal);
        } finally {
          clearTimeout(timeoutId);
          if (request.signal) {
            request.signal.removeEventListener('abort', onExternalAbort);
          }
        }
      }
    }

    throw lastError || new AIProviderError(formatAiError('All candidate models failed.'));
  }
}

export const groqAdapter = new GroqProviderAdapter();

