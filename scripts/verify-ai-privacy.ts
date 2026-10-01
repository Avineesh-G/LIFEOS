import { redactSensitiveInformation, isNoteExcludedFromAi, DEFAULT_SECTION_PERMISSIONS } from '../src/utils/aiSecurity.ts';
import { buildTargetedAiContext } from '../src/services/aiContextBuilder.ts';
import { stripUrls } from '../src/services/aiClient.ts';
import { getSystemPromptForContext } from '../src/ai/appGuide.ts';
import type { AppData, NoteItem } from '../src/types.ts';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, description: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASSED: ${description}`);
  } else {
    console.error(`  ✕ FAILED: ${description}`);
  }
}

console.log('=== RUNNING AI PRIVACY & SAFETY VERIFICATION SUITE ===\n');

// 1. Vault Exclusion Test
console.log('1. Vault Permanent Exclusion Test');
assert(DEFAULT_SECTION_PERMISSIONS.vault === false, 'Vault permission default is strictly false');

// 2. Redaction Layer Test
console.log('\n2. Redaction Layer Tests');
const testInput = 'My Groq key is gsk_abcdef123456789, password = secretpass123, PIN: 9876, OTP: 456789, Card: 4532 1234 5678 9012, Aadhaar: 1234 5678 9012, PAN: ABCDE1234F, Account #: 123456789012';
const redactedOutput = redactSensitiveInformation(testInput);

assert(!redactedOutput.includes('gsk_abcdef123456789'), 'Groq API key redacted');
assert(!redactedOutput.includes('secretpass123'), 'Password redacted');
assert(!redactedOutput.includes('456789'), 'OTP code redacted');
assert(!redactedOutput.includes('4532 1234 5678 9012'), 'Credit card redacted');
assert(!redactedOutput.includes('1234 5678 9012'), 'Aadhaar ID redacted');
assert(!redactedOutput.includes('ABCDE1234F'), 'PAN ID redacted');
assert(redactedOutput.includes('[REDACTED_API_KEY]'), 'Contains REDACTED_API_KEY placeholder');

// 3. Notes Exclusion Test (Lock, Hide, Archive)
console.log('\n3. Note Privacy Exclusion Tests');
const normalNote: NoteItem = { id: '1', title: 'Public Idea', content: 'Normal note', createdAt: '2026-10-01' };
const hiddenNote: NoteItem = { id: '2', title: 'Private Journal', content: 'Hidden note', hideFromAi: true, createdAt: '2026-10-01' };
const lockedNote: NoteItem = { id: '3', title: 'Secret Recipe', content: 'Locked note', isLocked: true, createdAt: '2026-10-01' };
const archivedNote: NoteItem = { id: '4', title: 'Old Archive', content: 'Archived note', isArchived: true, createdAt: '2026-10-01' };

assert(isNoteExcludedFromAi(normalNote) === false, 'Normal active note is allowed');
assert(isNoteExcludedFromAi(hiddenNote) === true, 'hideFromAi note is excluded');
assert(isNoteExcludedFromAi(lockedNote) === true, 'isLocked note is excluded');
assert(isNoteExcludedFromAi(archivedNote) === true, 'isArchived note is excluded');

// 4. Context Builder & Outings Link Stripping Test
console.log('\n4. Context Builder & Outings Link Safety Tests');
const mockAppData: Partial<AppData> = {
  notes: [normalNote, hiddenNote, lockedNote, archivedNote],
  outings: [
    {
      id: 'out_1',
      title: 'Beach Trip',
      date: '2026-10-05',
      participants: ['Alice', 'Bob'],
      url: 'https://example.com/beach-location-map',
    },
  ],
};

const contextOutput = buildTargetedAiContext('tell me about my notes and outing plans', mockAppData as AppData);

assert(contextOutput.includes('Public Idea'), 'Allowed note title appears in context');
assert(!contextOutput.includes('Private Journal'), 'Hidden note title excluded from context');
assert(!contextOutput.includes('Secret Recipe'), 'Locked note title excluded from context');
assert(!contextOutput.includes('https://example.com/beach-location-map'), 'Outing URL stripped from context');
assert(contextOutput.includes('open the Outings screen to view it'), 'Outing URL replaced with UI navigation prompt');

// 5. Code Enforcement URL Stripping Test
console.log('\n5. Code Enforcement URL Striper Tests');
const rawAiResponse = 'Check out [My Portfolio](https://mywebsite.com/home) or visit https://google.com and example.org!';
const cleanedResponse = stripUrls(rawAiResponse);
assert(!cleanedResponse.includes('https://'), 'No http/https links remaining');
assert(!cleanedResponse.includes('google.com'), 'No domain names remaining');
assert(!cleanedResponse.includes('example.org'), 'No .org domain remaining');

// 6. Prompt Injection Defense Rules in System Prompt Test
console.log('\n6. System Prompt Safety Rules Test');
const systemPrompt = getSystemPromptForContext('/notes');
assert(systemPrompt.includes('PROMPT INJECTION PROTECTION'), 'System prompt contains prompt injection protection clause');
assert(systemPrompt.includes('STRICTLY AS PASSIVE DATA'), 'System prompt instructs AI to treat user data as passive data');
assert(systemPrompt.includes('EXCLUDED / PROTECTED DATA'), 'System prompt includes blocked data refusal rules');

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
if (passedTests !== totalTests) {
  process.exit(1);
}
