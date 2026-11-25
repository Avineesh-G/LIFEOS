export type AIProviderId = 'groq' | 'gemini';

export type AIProviderErrorCode =
  | 'offline'
  | 'auth_invalid'
  | 'rate_limited'
  | 'model_unavailable'
  | 'invalid_request'
  | 'timeout'
  | 'aborted'
  | 'malformed_stream'
  | 'empty_response'
  | 'invalid_output'
  | 'provider_error';

export interface AiErrorPayload {
  code: AIProviderErrorCode;
  friendlyMessage: string;
  rawDetails?: string;
  statusCode?: number;
  retryAfterSeconds?: number;
  retryable?: boolean;
}

export class AIProviderError extends Error {
  readonly code: AIProviderErrorCode;
  readonly statusCode?: number;
  readonly retryAfterSeconds?: number;
  readonly rawDetails?: string;
  readonly retryable: boolean;

  constructor(payload: AiErrorPayload) {
    super(payload.friendlyMessage);
    this.name = 'AIProviderError';
    this.code = payload.code;
    this.statusCode = payload.statusCode;
    this.retryAfterSeconds = payload.retryAfterSeconds;
    this.rawDetails = payload.rawDetails;
    this.retryable = Boolean(payload.retryable);
  }
}

export type AIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | AIContentPart[];
  images?: string[];
}

export interface AIUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ModelConfiguration {
  id: string;
  provider: AIProviderId;
  displayName: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsJsonMode: boolean;
  supportsVision: boolean;
  supportsTools: boolean;
  supportsReasoningEffort?: boolean;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  candidateModels?: string[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  responseFormat?: 'text' | 'json';
  timeoutMs?: number;
  signal?: AbortSignal;
  apiKey?: string;
  proxyUrl?: string;
  firebaseIdToken?: string;
  maxRetries?: number;
}

export interface AIResponse {
  text: string;
  model: string;
  provider: AIProviderId;
  usage?: AIUsage;
  latencyMs: number;
}

export type AIStreamEvent =
  | { type: 'start'; model: string; provider: AIProviderId }
  | { type: 'token'; delta: string; accumulated: string; model: string }
  | { type: 'usage'; usage: AIUsage }
  | { type: 'complete'; response: AIResponse }
  | { type: 'error'; error: AIProviderError; payload: AiErrorPayload };

export interface AIProvider {
  readonly id: AIProviderId;
  complete(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest, onEvent: (event: AIStreamEvent) => void): Promise<AIResponse>;
}

