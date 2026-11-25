/**
 * LifeOS — Automated Luna AI Evaluation, Domain Routing, RAG, Schema & Telemetry Suite (Phases 2–10)
 * Exercises prompt layering, domain classification, bounded context windows, schema validation,
 * tool argument checks, permission-scoped RAG retrieval, and benchmark formatting invariants.
 */

const { classifyDomain, DOMAIN_CONFIGS } = await import('../src/ai/prompts/domains.ts');
const { getLayeredSystemPrompt } = await import('../src/ai/appGuide.ts');
const { buildBoundedConversationWindow } = await import('../src/services/ai/contextBudget.ts');
const { validateLunaResponse, normalizeModelOutput, sanitizeModelText } = await import('../src/services/ai/responseSchema.ts');
const { retrieveRelevantKnowledge } = await import('../src/services/ai/ragRetrieval.ts');
const { validateToolArguments, extractAiActionProposals } = await import('../src/services/ai/toolRegistry.ts');
const { getModelConfig, isSupportedModel, resolveCandidateModels } = await import('../src/services/ai/modelRegistry.ts');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, desc: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [TEST ${totalTests}] ${desc}`);
  } else {
    console.error(`  ✗ [TEST ${totalTests}] FAILED: ${desc}`);
    process.exitCode = 1;
  }
}

export interface EvalScenario {
  id: string;
  domain: 'study' | 'travel' | 'todo' | 'workout' | 'budget' | 'general';
  pathname: string;
  prompt: string;
  sampleResponse: string;
  expectedInvariants: {
    noEmojis: boolean;
    maxTableColumns?: number;
    requiresWorkflow?: boolean;
    requiresChart?: boolean;
    expectedActionType?: string;
  };
}

export const EVAL_SCENARIOS: EvalScenario[] = [
  {
    id: 'workout_pull_day',
    domain: 'workout',
    pathname: '/gym',
    prompt: 'Plan a 40-minute pull session for lats and bicep peaks.',
    sampleResponse: `Here is your 40-minute pull routine.\n\n| Exercise | Sets x Reps | Rest |\n| :--- | :--- | :--- |\n| Weighted Pull-Ups | 4 x 6-8 | 90s |\n| DB Row | 3 x 10-12 | 60s |\n\n\`\`\`json_action\n{"type":"LOG_WORKOUT","payload":{"type":"Pull Day","durationMinutes":40}}\n\`\`\``,
    expectedInvariants: { noEmojis: true, maxTableColumns: 3, expectedActionType: 'LOG_WORKOUT' },
  },
  {
    id: 'budget_spending_summary',
    domain: 'budget',
    pathname: '/spending',
    prompt: 'I spent 540 rupees on course printouts today, log this expense.',
    sampleResponse: `Logged Rs 540 under Education for course printouts.\n\n\`\`\`json_action\n{"type":"ADD_EXPENSE","payload":{"amount":540,"category":"Education","note":"Course printouts"}}\n\`\`\``,
    expectedInvariants: { noEmojis: true, expectedActionType: 'ADD_EXPENSE' },
  },
  {
    id: 'study_exam_workflow',
    domain: 'study',
    pathname: '/notes',
    prompt: 'Create a revision roadmap for Computer Networks Subnetting exam.',
    sampleResponse: `1. **Subnet Masks**: Review CIDR prefixes.\n\n\`\`\`workflow\n{"title":"Subnetting Revision","steps":[{"step":1,"title":"CIDR Drill","desc":"Practice /24 to /30 masks","duration":"25m"}]}\n\`\`\``,
    expectedInvariants: { noEmojis: true, requiresWorkflow: true },
  },
  {
    id: 'travel_weekend_outing',
    domain: 'travel',
    pathname: '/outings',
    prompt: 'Plan a weekend morning trip to Nandi Hills on a Rs 500 budget.',
    sampleResponse: `Estimated cost is Rs 450 per person via suburban bus and shared cab.\n\n\`\`\`json_action\n{"type":"CREATE_OUTING","payload":{"name":"Nandi Hills Trip","place":"Nandi Hills","budget":450}}\n\`\`\``,
    expectedInvariants: { noEmojis: true, expectedActionType: 'CREATE_OUTING' },
  },
  {
    id: 'todo_priority_task',
    domain: 'todo',
    pathname: '/tasks',
    prompt: 'Remind me to submit my lab assignment by tomorrow evening.',
    sampleResponse: `Added a high-priority task proposal for your lab assignment.\n\n\`\`\`json_action\n{"type":"ADD_TASK","payload":{"text":"Submit lab assignment","priority":"high"}}\n\`\`\``,
    expectedInvariants: { noEmojis: true, expectedActionType: 'ADD_TASK' },
  },
  {
    id: 'general_navigation_help',
    domain: 'general',
    pathname: '/',
    prompt: 'How do I customize my bottom navigation bar slots?',
    sampleResponse: `Long-press Slot 2 or Slot 3 on the bottom navigation dock to swap pinned modules.`,
    expectedInvariants: { noEmojis: true },
  },
];

export function evaluateResponseText(text: string, scenario: EvalScenario): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

  if (scenario.expectedInvariants.noEmojis && emojiRegex.test(text)) {
    reasons.push('Contained emojis');
  }
  if (scenario.expectedInvariants.maxTableColumns) {
    const lines = text.split('\n').filter((l) => l.trim().startsWith('|') && l.trim().endsWith('|'));
    for (const line of lines) {
      const cols = line.split('|').slice(1, -1).map((c) => c.trim());
      if (cols.length > scenario.expectedInvariants.maxTableColumns) {
        reasons.push(`Table exceeded ${scenario.expectedInvariants.maxTableColumns} columns`);
        break;
      }
    }
  }
  if (scenario.expectedInvariants.requiresWorkflow && !text.includes('```workflow')) {
    reasons.push('Missing workflow block');
  }
  if (scenario.expectedInvariants.requiresChart && !text.includes('```chart')) {
    reasons.push('Missing chart block');
  }
  if (scenario.expectedInvariants.expectedActionType) {
    const extracted = extractAiActionProposals(text);
    const hasMatch = extracted.proposals.some((p: any) => p.type === scenario.expectedInvariants.expectedActionType);
    if (!hasMatch) {
      reasons.push(`Missing valid ${scenario.expectedInvariants.expectedActionType} action`);
    }
  }
  return { pass: reasons.length === 0, reasons };
}

console.log('=== RUNNING LUNA AI PHASES 2-10 EVALUATION & REGRESSION SUITE ===\n');

// 1. Domain Routing & Scoped Prompts (Phase 4)
console.log('1. Domain Routing & Layered Prompt Scoping');
for (const scenario of EVAL_SCENARIOS) {
  const routed = classifyDomain(scenario.prompt, scenario.pathname);
  assert(routed === scenario.domain, `Routes "${scenario.id}" to domain "${scenario.domain}" (got "${routed}")`);
  const prompt = getLayeredSystemPrompt({ pathname: scenario.pathname, domain: routed, userQuery: scenario.prompt });
  assert(prompt.includes(DOMAIN_CONFIGS[scenario.domain].instructions), `Prompt loads "${scenario.domain}" rules cleanly`);
}

// Check scoping: budget domain should NOT inject gym/nutrition guides unnecessarily
const budgetPrompt = getLayeredSystemPrompt({ pathname: '/spending', domain: 'budget', userQuery: 'Check spending' });
assert(!budgetPrompt.includes('MealSlot') && !budgetPrompt.includes('Gym & Workouts'), 'Budget prompt isolates unrelated health guides');

// 2. Model Capability Registry (Phase 2)
console.log('\n2. Provider Model Registry & Capabilities');
const primaryCfg = getModelConfig('openai/gpt-oss-120b');
assert(Boolean(primaryCfg && primaryCfg.contextWindow >= 128000 && primaryCfg.supportsStreaming), 'Primary model capability metadata verified');
assert(!isSupportedModel('deepseek-r1-distill-llama-70b'), 'Retired DeepSeek model blocked by registry');
const candidates = resolveCandidateModels({ preferredModel: 'openai/gpt-oss-20b' });
assert(candidates[0] === 'openai/gpt-oss-20b' && candidates.includes('openai/gpt-oss-120b'), 'Preferred model ordered first with primary fallback');

// 3. Bounded Conversation Context Window (Phase 5)
console.log('\n3. Conversation Context Budget & Summarization');
const longHistory = Array.from({ length: 20 }, (_, i) => ({
  role: (i % 2 === 0 ? 'user' : 'assistant') as 'user' | 'assistant',
  content: `Turn ${i + 1}: ` + 'Detailed planning message content '.repeat(12),
}));
const bounded = buildBoundedConversationWindow(longHistory, 900, 4);
assert(bounded.recentMessages.length >= 4 && bounded.droppedCount > 0, `Compressed ${bounded.droppedCount} older turns within token budget`);
assert(bounded.summaryBlock.includes('<conversation_summary>'), 'Generated compact <conversation_summary> block');

// 4. Runtime Output Schema & XSS Sanitization (Phase 6)
console.log('\n4. Structured Output Validation & Sanitization');
const validJsonRes = validateLunaResponse({
  version: 1,
  type: 'answer',
  content: 'Your spending this week is Rs 540.',
  domain: 'budget',
  citations: [{ label: 'Spending Ledger' }],
});
assert(validJsonRes.valid === true && validJsonRes.value?.domain === 'budget', 'Validates structured v1 LunaResponse');
const invalidRes = validateLunaResponse({ version: 2, type: 'invalid', content: '' });
assert(invalidRes.valid === false, 'Rejects malformed schema safely');
const xssCleaned = sanitizeModelText('Hello <script>alert(1)</script><iframe src="bad"></iframe>world');
assert(xssCleaned === 'Hello world', 'Strips raw untrusted script/iframe HTML');
const fallbackRes = normalizeModelOutput('Plain fallback answer', 'general');
assert(fallbackRes.type === 'answer' && fallbackRes.version === 1, 'Normalizes plain text fallback safely');

// 5. RAG Permission-Scoped Knowledge Retrieval (Phase 7)
console.log('\n5. RAG Knowledge Retrieval & Exclusion');
const mockRagData = {
  notes: [
    { id: 'n1', title: 'CN Subnetting Notes', content: 'CIDR /24 has 254 usable hosts in TCP/IP subnetting.', pageView: 'white' as const, monthKey: '2026-11', isArchived: false, createdAt: '', updatedAt: '' },
    { id: 'n2', title: 'Locked Secret Note', content: 'Subnetting secret password 9999', pageView: 'white' as const, monthKey: '2026-11', isArchived: false, isLocked: true, createdAt: '', updatedAt: '' },
    { id: 'n3', title: 'Hidden Private Note', content: 'Hidden subnetting draft', pageView: 'white' as const, monthKey: '2026-11', isArchived: false, hideFromAi: true, createdAt: '', updatedAt: '' },
  ],
};
const ragRes = retrieveRelevantKnowledge('Explain TCP subnetting CIDR', mockRagData as any, 3, 0.2);
assert(ragRes.chunks.length === 1 && ragRes.chunks[0].docId === 'n1', 'Retrieves only permitted CN Subnetting note');
assert(!ragRes.contextBlock.includes('9999') && !ragRes.contextBlock.includes('Hidden subnetting'), 'Excludes locked and hidden notes from RAG');

// 6. Tool Argument Validation & Scenario Benchmark (Phase 8 & 9)
console.log('\n6. Tool Validation & End-to-End Scenarios');
assert(!validateToolArguments('ADD_EXPENSE', { amount: -100 }).valid, 'Rejects negative expense amount');
assert(validateToolArguments('ADD_EXPENSE', { amount: 250, category: 'Food' }).valid, 'Accepts valid expense payload');
assert(!validateToolArguments('ADD_TASK', { text: '   ' }).valid, 'Rejects blank task text');

for (const scenario of EVAL_SCENARIOS) {
  const evalResult = evaluateResponseText(scenario.sampleResponse, scenario);
  assert(evalResult.pass, `Benchmark scenario "${scenario.id}" invariants passed (${evalResult.reasons.join(', ') || 'ok'})`);
}

console.log(`\n=== SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
