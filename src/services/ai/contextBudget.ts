import type { AIMessage } from './types.ts';

export interface ConversationWindowResult {
  summaryBlock: string;
  recentMessages: AIMessage[];
  droppedCount: number;
  estimatedTokens: number;
}

/**
 * Rough, deterministic token estimator (~4 chars per token + overhead).
 */
export function estimateMessageTokens(msg: AIMessage): number {
  const text =
    typeof msg.content === 'string'
      ? msg.content
      : msg.content
          .map((p) => (p.type === 'text' ? p.text : '[image]'))
          .join(' ');
  const imgPenalty = Array.isArray(msg.images) ? msg.images.length * 400 : 0;
  return Math.ceil(text.length / 4) + 12 + imgPenalty;
}

/**
 * Builds a compact factual summary of older turns without fabricating facts.
 */
export function summarizeOlderTurns(olderMessages: AIMessage[]): string {
  if (olderMessages.length === 0) return '';

  const bullets: string[] = [];
  for (const m of olderMessages) {
    const raw =
      typeof m.content === 'string'
        ? m.content
        : m.content.map((p) => (p.type === 'text' ? p.text : '')).join(' ');
    const compact = raw
      .replace(/```[\s\S]*?```/g, '[structured block]')
      .replace(/\s+/g, ' ')
      .trim();
    if (!compact) continue;
    const prefix = m.role === 'user' ? 'User asked' : m.role === 'assistant' ? 'Luna answered' : 'Note';
    const clipped = compact.length > 140 ? `${compact.slice(0, 137)}...` : compact;
    bullets.push(`- ${prefix}: ${clipped}`);
    if (bullets.length >= 8) break;
  }

  if (bullets.length === 0) return '';
  return `<conversation_summary>\nEarlier turns summary (older messages compressed):\n${bullets.join('\n')}\n</conversation_summary>`;
}

/**
 * Keeps recent turns verbatim within maxHistoryTokens and compresses older turns into a bounded summary.
 */
export function buildBoundedConversationWindow(
  messages: AIMessage[],
  maxHistoryTokens: number = 3200,
  minRecentTurns: number = 4
): ConversationWindowResult {
  if (!messages || messages.length === 0) {
    return { summaryBlock: '', recentMessages: [], droppedCount: 0, estimatedTokens: 0 };
  }

  const nonSystem = messages.filter((m) => m.role !== 'system');
  const kept: AIMessage[] = [];
  let tokenTotal = 0;

  for (let i = nonSystem.length - 1; i >= 0; i--) {
    const msg = nonSystem[i];
    const cost = estimateMessageTokens(msg);
    if (kept.length >= minRecentTurns && tokenTotal + cost > maxHistoryTokens) {
      break;
    }
    kept.unshift(msg);
    tokenTotal += cost;
  }

  const cutoff = nonSystem.length - kept.length;
  const older = cutoff > 0 ? nonSystem.slice(0, cutoff) : [];
  const summaryBlock = summarizeOlderTurns(older);

  return {
    summaryBlock,
    recentMessages: kept,
    droppedCount: older.length,
    estimatedTokens: tokenTotal + Math.ceil(summaryBlock.length / 4),
  };
}

