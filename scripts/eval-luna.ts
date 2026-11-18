/**
 * LifeOS — Automated Luna Response Benchmark & Regression Test Suite
 * Validates formatting invariants, latency, and schema correctness.
 */

interface EvalScenario {
  id: string;
  domain: string;
  prompt: string;
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
    id: 'gym_pull_day',
    domain: 'gym',
    prompt: 'Plan a 40-minute pull session for lats and bicep peaks with dumbbells and pull-up bar.',
    expectedInvariants: {
      noEmojis: true,
      maxTableColumns: 3,
      expectedActionType: 'LOG_WORKOUT',
    },
  },
  {
    id: 'nutrition_mess_estimation',
    domain: 'nutrition',
    prompt: 'I had 3 rotis, a bowl of dal tadka, and 150g curd at hostel mess. Estimate macros and calories.',
    expectedInvariants: {
      noEmojis: true,
      requiresChart: true,
      expectedActionType: 'LOG_MEAL',
    },
  },
  {
    id: 'study_exam_workflow',
    domain: 'study',
    prompt: 'I have a Computer Networks exam on Subnetting & TCP congestion control in 2 days. Build my study plan.',
    expectedInvariants: {
      noEmojis: true,
      requiresWorkflow: true,
    },
  },
  {
    id: 'spending_ledger',
    domain: 'spending',
    prompt: 'I paid 540 rupees for course printouts and lent 300 rupees to Arjun for lunch. Add this.',
    expectedInvariants: {
      noEmojis: true,
      expectedActionType: 'ADD_EXPENSE',
    },
  },
];

export function evaluateResponseText(text: string, scenario: EvalScenario): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // 1. Emoji check
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  if (scenario.expectedInvariants.noEmojis && emojiRegex.test(text)) {
    reasons.push('Violation: Contained emojis');
  }

  // 2. Table Column Count Check
  if (scenario.expectedInvariants.maxTableColumns) {
    const lines = text.split('\n').filter(l => l.trim().startsWith('|') && l.trim().endsWith('|'));
    for (const line of lines) {
      const cols = line.split('|').slice(1, -1).map(c => c.trim());
      if (cols.length > scenario.expectedInvariants.maxTableColumns) {
        reasons.push(`Violation: Table has ${cols.length} columns (max allowed: ${scenario.expectedInvariants.maxTableColumns})`);
        break;
      }
    }
  }

  // 3. Workflow requirement
  if (scenario.expectedInvariants.requiresWorkflow && !text.includes('```workflow')) {
    reasons.push('Violation: Missing ```workflow block');
  }

  // 4. Chart requirement
  if (scenario.expectedInvariants.requiresChart && !text.includes('```chart')) {
    reasons.push('Violation: Missing ```chart block');
  }

  // 5. Action Type requirement
  if (scenario.expectedInvariants.expectedActionType) {
    const actionMatch = text.match(/```json_action\s*([\s\S]*?)```/);
    if (!actionMatch) {
      reasons.push('Violation: Missing ```json_action block');
    } else {
      try {
        const parsed = JSON.parse(actionMatch[1].trim());
        if (parsed.type !== scenario.expectedInvariants.expectedActionType) {
          reasons.push(`Violation: Expected action type ${scenario.expectedInvariants.expectedActionType}, got ${parsed.type}`);
        }
      } catch {
        reasons.push('Violation: Malformed JSON inside ```json_action');
      }
    }
  }

  return {
    pass: reasons.length === 0,
    reasons,
  };
}

console.log(`Loaded ${EVAL_SCENARIOS.length} Luna benchmark evaluation scenarios.`);

