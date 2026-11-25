import assert from 'node:assert/strict';
import {
  isJournalEntryExcludedFromAi,
  redactSensitiveInformation,
  getSectionPermissions,
} from '../src/utils/aiSecurity.ts';
import { classifyDomain } from '../src/ai/prompts/domains.ts';
import {
  isAllowListedAction,
  validateToolArguments,
  extractAiActionProposals,
} from '../src/services/ai/toolRegistry.ts';
import { retrieveRelevantKnowledge } from '../src/services/ai/ragRetrieval.ts';

console.log('Running Luna AI New-Interface Safety & Routing Tests...');

// 1. Journal hideFromAi exclusion
assert.equal(
  isJournalEntryExcludedFromAi({
    id: 'j1',
    date: '2026-11-25',
    hideFromAi: true,
    createdAt: '',
    updatedAt: '',
  }),
  true
);
assert.equal(
  isJournalEntryExcludedFromAi({
    id: 'j2',
    date: '2026-11-25',
    hideFromAi: false,
    createdAt: '',
    updatedAt: '',
  }),
  false
);

// 2. RAG strictly skips hideFromAi journal entries
const rag = retrieveRelevantKnowledge('secret therapy reflection', {
  journalEntries: [
    {
      id: 'j_hidden',
      date: '2026-11-24',
      brainDump: 'secret therapy reflection private thoughts',
      hideFromAi: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'j_public',
      date: '2026-11-25',
      brainDump: 'completed public algorithm practice today',
      hideFromAi: false,
      createdAt: '',
      updatedAt: '',
    },
  ],
});
assert.equal(rag.chunks.some((c) => c.docId === 'j_hidden'), false, 'Hidden journal leaked to RAG');

// 3. Phone & PNR redaction
const scrubbed = redactSensitiveInformation(
  'Call Rohan phone: +91 9876543210 and ticket PNR: AB12CD9876 for travel'
);
assert.equal(scrubbed.includes('9876543210'), false, 'Phone number not redacted');
assert.equal(scrubbed.includes('AB12CD9876'), false, 'PNR ref not redacted');

// 4. Vault remains hard-locked false
assert.equal(getSectionPermissions().vault, false);

// 5. Domain routing for new interfaces
assert.equal(classifyDomain('what next', '/projects'), 'todo');
assert.equal(classifyDomain('what next', '/trips'), 'travel');
assert.equal(classifyDomain('what next', '/focus'), 'study');
assert.equal(classifyDomain('who owes me money', '/circle'), 'budget');
assert.equal(classifyDomain('build packing checklist', '/home'), 'travel');

// 6. Tool registry validation for new actions
const newTypes = [
  'CREATE_PROJECT',
  'ADD_PROJECT_MILESTONE',
  'CREATE_TRIP',
  'ADD_PACKING_ITEMS',
  'CREATE_DECISION',
  'LOG_CIRCLE_CATCHUP',
] as const;

for (const t of newTypes) {
  assert.equal(isAllowListedAction(t), true, `${t} must be allowlisted`);
  assert.equal(validateToolArguments(t, {}).valid, false, `${t} should reject empty payload`);
}

assert.equal(validateToolArguments('CREATE_PROJECT', { title: 'LifeOS v4' }).valid, true);
assert.equal(
  validateToolArguments('ADD_PROJECT_MILESTONE', { projectTitle: 'LifeOS', milestone: 'Ship APK' }).valid,
  true
);
assert.equal(validateToolArguments('CREATE_TRIP', { title: 'Goa', departureDate: '2026-12-01' }).valid, true);
assert.equal(validateToolArguments('ADD_PACKING_ITEMS', { items: ['Passport'] }).valid, true);
assert.equal(validateToolArguments('CREATE_DECISION', { question: 'Offer A vs B' }).valid, true);
assert.equal(validateToolArguments('LOG_CIRCLE_CATCHUP', { name: 'Rohan', type: 'call' }).valid, true);

const extracted = extractAiActionProposals(
  'Here is a matrix:\n```json_action\n{"type":"CREATE_DECISION","payload":{"question":"Offer A vs Offer B","options":["Offer A","Offer B"]}}\n```'
);
assert.equal(extracted.proposals.length, 1);
assert.equal(extracted.proposals[0].requiresConfirmation, true);

console.log('ALL LUNA AI NEW-INTERFACE SAFETY & ROUTING TESTS PASSED!');

