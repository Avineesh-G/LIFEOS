/**
 * Comprehensive AI Models & Fallback Verification Suite
 * Tests all 8 core capabilities specified in Step 10
 */

import * as fs from 'fs';
import * as path from 'path';

// Mock localStorage for Node environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

(global as any).localStorage = new MockLocalStorage();
try {
  Object.defineProperty(globalThis.navigator, 'onLine', {
    value: true,
    writable: true,
    configurable: true,
  });
} catch {}

// Import after setting up globals
const aiModelsModule = await import('../src/config/aiModels.ts');
const {
  CHAT_PRIMARY,
  CHAT_FALLBACKS,
  STT_PRIMARY,
  STT_FALLBACKS,
  ALLOWED_CHAT_MODELS,
  RETIRED_MODELS,
  GROQ_STORAGE_KEYS,
  CURRENT_AI_SCHEMA_VERSION,
} = aiModelsModule;

const aiResolverModule = await import('../src/services/aiModelResolver.ts');
const { migrateAiSettings, resolveActiveChatModel, markModelFailedInSession, resetAiSettings } = aiResolverModule;

const aiClientModule = await import('../src/services/aiClient.ts');
const { formatAiError, stripUrls, redactKeys } = aiClientModule;

async function runTests() {
  console.log('🤖 LifeOS AI Model Resolution & Response Suite');
  console.log('===============================================\n');

  let passedCount = 0;
  let totalTests = 0;

  function assert(condition: boolean, desc: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✓ [TEST ${totalTests}] ${desc}`);
      passedCount++;
    } else {
      console.error(`  ✗ [TEST ${totalTests}] FAILED: ${desc}`);
      process.exitCode = 1;
    }
  }

  // ── TEST 1: Saved retired ID migrates to primary on startup ──
  console.log('--- Test 1: Migration of Stale / Retired Settings ---');
  localStorage.setItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL, 'llama-3.1-8b-instant');
  localStorage.setItem(GROQ_STORAGE_KEYS.SETTINGS_SCHEMA_VERSION, '1');

  migrateAiSettings();

  const migratedModel = localStorage.getItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL);
  const migratedVersion = localStorage.getItem(GROQ_STORAGE_KEYS.SETTINGS_SCHEMA_VERSION);

  assert(migratedModel === CHAT_PRIMARY, `Retired model migrated to CHAT_PRIMARY (${CHAT_PRIMARY}), got: ${migratedModel}`);
  assert(migratedVersion === CURRENT_AI_SCHEMA_VERSION.toString(), `Schema version bumped to ${CURRENT_AI_SCHEMA_VERSION}`);

  // ── TEST 2: Fallback logic when primary is marked bad ──
  console.log('\n--- Test 2: Runtime Fallback on 404 / Decommissioned ---');
  const fallbackModel = markModelFailedInSession(CHAT_PRIMARY);
  assert(fallbackModel === CHAT_FALLBACKS[0], `Fallback resolved to ${CHAT_FALLBACKS[0]}, got: ${fallbackModel}`);

  // ── TEST 3: URL Stripping and Key Redaction ──
  console.log('\n--- Test 3: Data Security & Response Sanitization ---');
  const sampleWithUrl = 'Check this guide at https://groq.com/docs or www.google.com for more info.';
  const cleaned = stripUrls(sampleWithUrl);
  assert(!cleaned.includes('https://') && !cleaned.includes('www.'), `URLs stripped cleanly: "${cleaned}"`);

  const sampleWithKey = 'Error with key gsk_1234567890abcdef1234567890';
  const redacted = redactKeys(sampleWithKey);
  assert(!redacted.includes('1234567890abcdef'), `API key redacted safely: "${redacted}"`);

  // ── TEST 4: Friendly Error Parsing ──
  console.log('\n--- Test 4: Upstream Status Code Error Handling ---');
  const err401 = formatAiError('Invalid API Key', 401);
  assert(err401.friendlyMessage.includes('Your Groq key was rejected'), `401 friendly message: "${err401.friendlyMessage}"`);

  const headers429 = new Headers({ 'retry-after': '15' });
  const err429 = formatAiError('Rate limit exceeded', 429, headers429);
  assert(err429.friendlyMessage.includes('15 seconds'), `429 retry-after message: "${err429.friendlyMessage}"`);

  const err404 = formatAiError('model_decommissioned', 404);
  assert(err404.friendlyMessage.includes('No supported AI model is available'), `404 model message: "${err404.friendlyMessage}"`);

  try {
    Object.defineProperty(globalThis.navigator, 'onLine', { value: false, configurable: true });
  } catch {}
  const errOffline = formatAiError('Network failure');
  assert(errOffline.friendlyMessage === 'AI needs internet.', `Offline message: "${errOffline.friendlyMessage}"`);
  try {
    Object.defineProperty(globalThis.navigator, 'onLine', { value: true, configurable: true });
  } catch {}

  // ── TEST 5: Reset AI Settings ──
  console.log('\n--- Test 5: Reset AI Settings ---');
  resetAiSettings();
  const resetModel = localStorage.getItem(GROQ_STORAGE_KEYS.ACTIVE_CHAT_MODEL);
  assert(resetModel === CHAT_PRIMARY, `Reset restored model to CHAT_PRIMARY (${CHAT_PRIMARY})`);

  // ── TEST 6: Codebase Lint Rule - No hardcoded retired model strings outside aiModels.ts ──
  console.log('\n--- Test 6: Codebase Guard for Retired Models ---');
  const srcDir = path.resolve(process.cwd(), 'src');

  function scanDir(dir: string, foundViolations: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!f.startsWith('.')) scanDir(fullPath, foundViolations);
      } else if (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js')) {
        // Skip aiModels.ts itself (which defines the blocklist)
        if (fullPath.endsWith('aiModels.ts')) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const retired of RETIRED_MODELS) {
          if (content.includes(`'${retired}'`) || content.includes(`"${retired}"`)) {
            foundViolations.push(`Found retired model "${retired}" in ${path.relative(process.cwd(), fullPath)}`);
          }
        }
      }
    }
    return foundViolations;
  }

  const violations = scanDir(srcDir);
  assert(violations.length === 0, `Zero retired model strings in src outside aiModels.ts (Violations: ${violations.length})`);
  if (violations.length > 0) {
    console.error('Violations details:', violations);
  }

  // ── TEST 7: Speech Model verification ──
  console.log('\n--- Test 7: Speech STT Model Configuration ---');
  assert(STT_PRIMARY === 'whisper-large-v3-turbo', `STT primary is whisper-large-v3-turbo`);
  assert(STT_FALLBACKS.includes('whisper-large-v3'), `STT fallback includes whisper-large-v3`);

  // ── TEST 8: All AI features use ALLOWED_CHAT_MODELS ──
  console.log('\n--- Test 8: Central Models Allowlist ---');
  assert(ALLOWED_CHAT_MODELS.includes('openai/gpt-oss-120b'), `Allowed models include openai/gpt-oss-120b`);
  assert(ALLOWED_CHAT_MODELS.includes('openai/gpt-oss-20b'), `Allowed models include openai/gpt-oss-20b`);

  console.log(`\n===============================================`);
  console.log(`🎉 Suite Finished: ${passedCount}/${totalTests} Tests Passed!`);
}

runTests().catch(err => {
  console.error('Test suite runner failed:', err);
  process.exit(1);
});
