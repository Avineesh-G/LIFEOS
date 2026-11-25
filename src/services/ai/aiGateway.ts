import { getGroqApiKey, getAiProxyUrl } from '../../utils/aiSecurity.ts';
import { resolveActiveChatModel } from '../aiModelResolver.ts';
import { resolveCandidateModels, GEMINI_FALLBACK_MODEL } from './modelRegistry.ts';
import { groqAdapter } from './providers/groqAdapter.ts';
import { geminiAdapter } from './providers/geminiAdapter.ts';
import type {
  AIProvider,
  AIProviderId,
  AIRequest,
  AIResponse,
  AIStreamEvent,
} from './types.ts';

const PROVIDERS: Record<AIProviderId, AIProvider> = {
  groq: groqAdapter,
  gemini: geminiAdapter,
};

async function getOptionalFirebaseToken(): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  try {
    const { auth } = await import('../../firebase.ts');
    if (auth?.currentUser && typeof auth.currentUser.getIdToken === 'function') {
      return await auth.currentUser.getIdToken();
    }
  } catch {}
  return undefined;
}

export function detectProviderFromCredentials(apiKey?: string, explicit?: AIProviderId): AIProviderId {
  if (explicit) return explicit;
  if (apiKey && apiKey.trim().startsWith('AIza')) return 'gemini';
  return 'groq';
}

export async function executeAIRequest(
  request: AIRequest,
  options?: { provider?: AIProviderId; hasVision?: boolean; preferredModel?: string }
): Promise<AIResponse> {
  const apiKey = request.apiKey ?? getGroqApiKey();
  const proxyUrl = request.proxyUrl ?? getAiProxyUrl();
  const providerId = detectProviderFromCredentials(apiKey, options?.provider);
  const provider = PROVIDERS[providerId];

  let candidateModels = request.candidateModels;
  if (!candidateModels || candidateModels.length === 0) {
    if (providerId === 'gemini') {
      candidateModels = [GEMINI_FALLBACK_MODEL];
    } else {
      const resolution = options?.hasVision ? undefined : await resolveActiveChatModel(apiKey);
      candidateModels = resolveCandidateModels({
        preferredModel: options?.preferredModel ?? request.model,
        resolvedModel: resolution?.activeModel,
        hasVision: options?.hasVision,
      });
    }
  }

  const firebaseIdToken = proxyUrl ? await getOptionalFirebaseToken() : undefined;

  return provider.complete({
    ...request,
    apiKey,
    proxyUrl,
    firebaseIdToken,
    candidateModels,
  });
}

export async function streamAIRequest(
  request: AIRequest,
  onEvent: (event: AIStreamEvent) => void,
  options?: { provider?: AIProviderId; hasVision?: boolean; preferredModel?: string }
): Promise<AIResponse> {
  const apiKey = request.apiKey ?? getGroqApiKey();
  const proxyUrl = request.proxyUrl ?? getAiProxyUrl();
  const providerId = detectProviderFromCredentials(apiKey, options?.provider);
  const provider = PROVIDERS[providerId];

  let candidateModels = request.candidateModels;
  if (!candidateModels || candidateModels.length === 0) {
    if (providerId === 'gemini') {
      candidateModels = [GEMINI_FALLBACK_MODEL];
    } else {
      const resolution = options?.hasVision ? undefined : await resolveActiveChatModel(apiKey);
      candidateModels = resolveCandidateModels({
        preferredModel: options?.preferredModel ?? request.model,
        resolvedModel: resolution?.activeModel,
        hasVision: options?.hasVision,
      });
    }
  }

  const firebaseIdToken = proxyUrl ? await getOptionalFirebaseToken() : undefined;

  return provider.stream(
    {
      ...request,
      apiKey,
      proxyUrl,
      firebaseIdToken,
      candidateModels,
    },
    onEvent
  );
}
