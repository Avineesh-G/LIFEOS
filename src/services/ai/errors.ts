import { AIProviderError, type AiErrorPayload } from './types.ts';

/**
 * Strips web URLs and external domain links from assistant output before UI rendering.
 */
export function stripUrls(text: string): string {
  if (!text) return '';
  let cleaned = text.replace(/\[([^\]]+)\]\((https?:\/\/|www\.)[^\)]+\)/gi, '$1');
  cleaned = cleaned.replace(/(https?:\/\/|www\.)[^\s<>\)\]}]+/gi, '');
  cleaned = cleaned.replace(/\b[a-zA-Z0-9-]+\.(com|org|net|io|co|dev|ai|app|gov|edu)(\/[^\s<>\)\]}]*)?/gi, '');
  return cleaned;
}

/**
 * Redacts Groq, Google, OpenAI, and Bearer API keys from error messages and telemetry.
 */
export function redactKeys(text: string): string {
  if (!text) return '';
  return text
    .replace(/gsk_[a-zA-Z0-9_-]{10,}/g, 'gsk_***[REDACTED]***')
    .replace(/AIza[a-zA-Z0-9_-]{10,}/g, 'AIza***[REDACTED]***')
    .replace(/sk-[a-zA-Z0-9_-]{10,}/g, 'sk-***[REDACTED]***')
    .replace(/Bearer\s+[a-zA-Z0-9_\.-]+/gi, 'Bearer ***[REDACTED]***');
}

/**
 * Maps upstream provider HTTP statuses and network failures to safe, typed payloads.
 */
export function formatAiError(err: any, status?: number, headers?: Headers): AiErrorPayload {
  const raw = typeof err === 'string' ? err : err?.message || JSON.stringify(err);
  const sanitizedDetails = redactKeys(raw);

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      code: 'offline',
      friendlyMessage: 'AI needs internet.',
      rawDetails: 'Browser is currently offline.',
      statusCode: 0,
      retryable: false,
    };
  }

  if (status === 401 || status === 403 || sanitizedDetails.toLowerCase().includes('invalid api key') || sanitizedDetails.toLowerCase().includes('unauthorized')) {
    return {
      code: 'auth_invalid',
      friendlyMessage: 'Your Groq key was rejected. Check it in Settings > AI.',
      rawDetails: sanitizedDetails,
      statusCode: status || 401,
      retryable: false,
    };
  }

  if (status === 429 || sanitizedDetails.toLowerCase().includes('rate limit') || sanitizedDetails.toLowerCase().includes('rate_limit_exceeded')) {
    let retrySec = 10;
    if (headers?.get('retry-after')) {
      const parsed = parseInt(headers.get('retry-after') || '', 10);
      if (!isNaN(parsed) && parsed > 0) retrySec = parsed;
    }
    return {
      code: 'rate_limited',
      friendlyMessage: `Rate limit reached. Try again in ${retrySec} seconds.`,
      rawDetails: sanitizedDetails,
      statusCode: 429,
      retryAfterSeconds: retrySec,
      retryable: true,
    };
  }

  if (status === 404 || sanitizedDetails.toLowerCase().includes('does not exist') || sanitizedDetails.toLowerCase().includes('model_not_found') || sanitizedDetails.toLowerCase().includes('model_decommissioned')) {
    return {
      code: 'model_unavailable',
      friendlyMessage: 'No supported AI model is available.',
      rawDetails: sanitizedDetails,
      statusCode: 404,
      retryable: false,
    };
  }

  if (status === 400) {
    return {
      code: 'invalid_request',
      friendlyMessage: 'The AI request was rejected.',
      rawDetails: sanitizedDetails,
      statusCode: 400,
      retryable: false,
    };
  }

  const lowerDetails = sanitizedDetails.toLowerCase();
  if (status === 408 || lowerDetails.includes('timeout') || lowerDetails.includes('timed out')) {
    return {
      code: 'timeout',
      friendlyMessage: 'The AI took too long. Try again.',
      rawDetails: sanitizedDetails,
      statusCode: 408,
      retryable: true,
    };
  }

  if (err?.name === 'AbortError' || lowerDetails.includes('abort')) {
    return {
      code: 'aborted',
      friendlyMessage: 'Query cancelled.',
      rawDetails: sanitizedDetails,
      statusCode: 499,
      retryable: false,
    };
  }

  const isServerErr = (status !== undefined && status >= 500) || lowerDetails.includes('failed to fetch') || lowerDetails.includes('network');
  return {
    code: 'provider_error',
    friendlyMessage: sanitizedDetails.length > 80 ? 'An error occurred while calling Groq AI.' : sanitizedDetails,
    rawDetails: sanitizedDetails,
    statusCode: status || 500,
    retryable: isServerErr,
  };
}

export function toAIProviderError(err: unknown): AIProviderError {
  if (err instanceof AIProviderError) return err;
  return new AIProviderError(formatAiError(err));
}

/**
 * Parses an incremental SSE buffer into text deltas, remaining partial line, and completion flag.
 */
export function parseSseChunkBuffer(buffer: string): {
  deltas: string[];
  remainder: string;
  done: boolean;
  malformedCount: number;
} {
  const lines = buffer.split(/\r?\n/);
  const remainder = lines.pop() ?? '';
  const deltas: string[] = [];
  let done = false;
  let malformedCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('data:')) continue;
    const dataStr = trimmed.replace(/^data:\s*/, '');
    if (dataStr === '[DONE]') {
      done = true;
      break;
    }
    try {
      const parsed = JSON.parse(dataStr);
      const deltaContent = parsed.choices?.[0]?.delta?.content;
      if (deltaContent && typeof deltaContent === 'string') {
        deltas.push(deltaContent);
      }
    } catch {
      malformedCount++;
    }
  }

  return { deltas, remainder, done, malformedCount };
}

/**
 * Computes bounded exponential backoff with full jitter for retryable failures.
 */
export function computeBackoffMs(attempt: number, baseMs = 450, maxMs = 4000): number {
  const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  return Math.round(exp * (0.65 + Math.random() * 0.35));
}

