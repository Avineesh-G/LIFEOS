/**
 * LifeOS — Luna AI Phase 1 Stabilization Tests
 * Covers typed error normalization, SSE chunk parsing, action JSON recovery,
 * and system prompt hygiene without external network calls or secrets.
 */

const aiClientModule = await import('../src/services/aiClient.ts');
const { formatAiError, parseSseChunkBuffer, AIProviderError } = aiClientModule;

const appGuideModule = await import('../src/ai/appGuide.ts');
const { getSystemPromptForContext } = appGuideModule;

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, description: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [TEST ${totalTests}] ${description}`);
  } else {
    console.error(`  ✗ [TEST ${totalTests}] FAILED: ${description}`);
    process.exitCode = 1;
  }
}

console.log('=== LUNA AI PHASE 1 STABILIZATION TEST SUITE ===\n');

// Simulate online browser environment for Node tests
try {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value: true,
    writable: true,
    configurable: true,
  });
} catch {}

// 1. Typed error classification
console.log('1. Typed AIProviderError Mapping');
const err401 = formatAiError('Unauthorized: invalid api key gsk_secret_1234567890', 401);
assert(err401.code === 'auth_invalid', '401 maps to auth_invalid');
assert(!err401.rawDetails?.includes('gsk_secret_1234567890'), '401 rawDetails redacts Groq key');

const err429 = formatAiError('Rate limit exceeded', 429, new Headers({ 'retry-after': '12' }));
assert(err429.code === 'rate_limited' && err429.retryAfterSeconds === 12, '429 maps to rate_limited with retryAfterSeconds');

const err404 = formatAiError('model_decommissioned', 404);
assert(err404.code === 'model_unavailable', '404 maps to model_unavailable');

const err400 = formatAiError('Bad schema', 400);
assert(err400.code === 'invalid_request', '400 maps to invalid_request');

const errTimeout = formatAiError('Request timeout after 30s', 408);
assert(errTimeout.code === 'timeout', '408 maps to timeout');

const abortObj = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
const errAbort = formatAiError(abortObj);
assert(errAbort.code === 'aborted', 'AbortError maps to aborted');

const providerErrInstance = new AIProviderError(errTimeout);
assert(providerErrInstance instanceof Error && providerErrInstance.code === 'timeout', 'AIProviderError preserves Error prototype and code');

try {
  Object.defineProperty(globalThis.navigator, 'onLine', { value: false, configurable: true });
} catch {}
const errOffline = formatAiError('Network error');
assert(errOffline.code === 'offline' && errOffline.friendlyMessage === 'AI needs internet.', 'navigator.onLine === false maps to offline');
try {
  Object.defineProperty(globalThis.navigator, 'onLine', { value: true, configurable: true });
} catch {}

// 2. SSE streaming chunk & partial line parsing
console.log('\n2. SSE Incremental Chunk & Partial Buffer Parsing');
const chunk1 = 'data: {"choices":[{"delta":{"content":"Hello "}}]}\r\ndata: {"choices":[{"delta":{"con';
const batch1 = parseSseChunkBuffer(chunk1);
assert(batch1.deltas.join('') === 'Hello ', 'Extracts complete delta from partial CRLF SSE chunk');
assert(batch1.remainder.includes('"con'), 'Preserves incomplete trailing SSE line in remainder');
assert(batch1.done === false && batch1.malformedCount === 0, 'First batch reports done=false and malformedCount=0');

const chunk2 = batch1.remainder + 'tent":"Luna"}}]}\r\ndata: {bad_json}\r\ndata: [DONE]\r\n';
const batch2 = parseSseChunkBuffer(chunk2);
assert(batch2.deltas.join('') === 'Luna', 'Completes split JSON delta across chunks');
assert(batch2.malformedCount === 1, 'Counts malformed JSON chunk cleanly without throwing');
assert(batch2.done === true, 'Detects [DONE] sentinel accurately');

// 3. System prompt metadata hygiene
console.log('\n3. System Prompt Numbering & Guardrails');
const notesPrompt = getSystemPromptForContext('/notes');
assert(notesPrompt.includes('Luna Prompt Architecture v2.0.0'), 'Prompt declares versioned architecture header');
assert(notesPrompt.includes('DOMAIN: STUDY & ACADEMICS'), 'Notes route loads Study domain layer cleanly');
assert(notesPrompt.includes('PROMPT INJECTION PROTECTION'), 'Prompt retains injection protection clause');

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
