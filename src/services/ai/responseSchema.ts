import type { LunaDomain } from '../../ai/prompts/domains.ts';

export type LunaResponseType = 'answer' | 'clarification' | 'plan' | 'action_proposal';

export interface LunaCitation {
  label: string;
  sourceId?: string;
}

export interface LunaProposedAction {
  tool: string;
  arguments: Record<string, unknown>;
  requiresConfirmation: boolean;
}

export interface LunaResponse {
  version: 1;
  type: LunaResponseType;
  content: string;
  domain?: LunaDomain;
  citations?: LunaCitation[];
  proposedAction?: LunaProposedAction;
}

const VALID_TYPES = new Set<LunaResponseType>(['answer', 'clarification', 'plan', 'action_proposal']);
const VALID_DOMAINS = new Set<LunaDomain>(['study', 'travel', 'todo', 'workout', 'budget', 'general']);

/**
 * Strips raw HTML tags (script/iframe/on* handlers) from untrusted model output.
 */
export function sanitizeModelText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<\/?(?:script|iframe|object|embed|style|link|meta)[^>]*>/gi, '')
    .trim();
}

/**
 * Runtime schema validator for structured LunaResponse payloads (zero external deps).
 */
export function validateLunaResponse(raw: unknown): {
  valid: boolean;
  value?: LunaResponse;
  error?: string;
} {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Response must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;

  if (obj.version !== 1) {
    return { valid: false, error: 'Unsupported LunaResponse version.' };
  }
  if (typeof obj.type !== 'string' || !VALID_TYPES.has(obj.type as LunaResponseType)) {
    return { valid: false, error: 'Invalid response type.' };
  }
  if (typeof obj.content !== 'string' || !obj.content.trim()) {
    return { valid: false, error: 'Missing content string.' };
  }

  let domain: LunaDomain | undefined;
  if (obj.domain !== undefined) {
    if (typeof obj.domain !== 'string' || !VALID_DOMAINS.has(obj.domain as LunaDomain)) {
      return { valid: false, error: 'Invalid domain identifier.' };
    }
    domain = obj.domain as LunaDomain;
  }

  let citations: LunaCitation[] | undefined;
  if (obj.citations !== undefined) {
    if (!Array.isArray(obj.citations)) {
      return { valid: false, error: 'citations must be an array.' };
    }
    citations = obj.citations
      .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === 'object' && typeof (c as any).label === 'string'))
      .map((c) => ({
        label: sanitizeModelText(String(c.label)),
        ...(typeof c.sourceId === 'string' ? { sourceId: c.sourceId } : {}),
      }));
  }

  let proposedAction: LunaProposedAction | undefined;
  if (obj.proposedAction !== undefined) {
    if (!obj.proposedAction || typeof obj.proposedAction !== 'object') {
      return { valid: false, error: 'proposedAction must be an object.' };
    }
    const pa = obj.proposedAction as Record<string, unknown>;
    if (typeof pa.tool !== 'string' || !pa.tool.trim()) {
      return { valid: false, error: 'proposedAction.tool must be a non-empty string.' };
    }
    if (!pa.arguments || typeof pa.arguments !== 'object' || Array.isArray(pa.arguments)) {
      return { valid: false, error: 'proposedAction.arguments must be an object.' };
    }
    proposedAction = {
      tool: pa.tool.trim(),
      arguments: pa.arguments as Record<string, unknown>,
      requiresConfirmation: pa.requiresConfirmation !== false,
    };
  }

  return {
    valid: true,
    value: {
      version: 1,
      type: obj.type as LunaResponseType,
      content: sanitizeModelText(obj.content),
      ...(domain ? { domain } : {}),
      ...(citations ? { citations } : {}),
      ...(proposedAction ? { proposedAction } : {}),
    },
  };
}

/**
 * Attempts structured JSON validation first, falling back safely to plain sanitized LunaResponse.
 */
export function normalizeModelOutput(rawText: string, domain: LunaDomain = 'general'): LunaResponse {
  const safeText = sanitizeModelText(rawText);
  if (safeText.startsWith('{') && safeText.endsWith('}')) {
    try {
      const parsed = JSON.parse(safeText);
      const checked = validateLunaResponse(parsed);
      if (checked.valid && checked.value) {
        return checked.value;
      }
    } catch {}
  }

  const hasPlan = safeText.includes('```workflow');
  const hasAction = safeText.includes('```json_action');
  const isClarification = safeText.length < 260 && safeText.endsWith('?');

  return {
    version: 1,
    type: hasAction ? 'action_proposal' : hasPlan ? 'plan' : isClarification ? 'clarification' : 'answer',
    content: safeText,
    domain,
  };
}

