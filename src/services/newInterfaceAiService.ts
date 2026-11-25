import type {
  CirclePerson,
  DecisionRecord,
  JournalEntry,
  PackingGroup,
  ProjectItem,
  StudySession,
  Task,
  TripPlan,
} from '../types.ts';
import {
  getLetAiReadData,
  isJournalEntryExcludedFromAi,
  redactSensitiveInformation,
} from '../utils/aiSecurity.ts';
import { executeAIRequest } from './ai/aiGateway.ts';
import { sanitizeModelText } from './ai/responseSchema.ts';

function extractJsonObject(raw: string): any {
  const cleaned = (raw || '').trim();
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : cleaned;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function runStructuredCoPilot(systemPrompt: string, userPrompt: string): Promise<any> {
  if (!getLetAiReadData()) {
    throw new Error('Enable "Let AI read my data" in Settings -> AI Coach to use smart suggestions.');
  }
  const safePrompt = redactSensitiveInformation(userPrompt);
  const res = await executeAIRequest({
    messages: [
      { role: 'system', content: `${systemPrompt} Return ONLY strict valid JSON with zero emojis and zero external URLs.` },
      { role: 'user', content: safePrompt },
    ],
    temperature: 0.3,
    maxTokens: 650,
  });
  const parsed = extractJsonObject(res.text);
  if (!parsed) {
    throw new Error('Could not parse structured AI response.');
  }
  return parsed;
}

// ── 1. Projects Co-Pilot ───────────────────────────────────────────────────────
export async function suggestProjectMilestones(
  project: ProjectItem,
  mode: 'milestones' | 'unblock'
): Promise<{ milestones: string[]; tip: string }> {
  const existing = project.milestones.map((m) => `${m.completed ? '[Done]' : '[Open]'} ${m.title}`).join('; ');
  const parsed = await runStructuredCoPilot(
    'You are Luna AI helping decompose personal projects cleanly.',
    `Mode: ${mode}
Project: "${project.title}" (${project.category})
Scope: "${project.description || 'None'}"
Blocker: "${project.blockerNote || 'None'}"
Existing Milestones: ${existing || 'None'}
Return JSON: {"milestones": ["concise step 1", "step 2", "step 3"], "tip": "1 short tactical suggestion"}`
  );
  const milestones = Array.isArray(parsed.milestones)
    ? parsed.milestones.map((x: any) => sanitizeModelText(String(x || ''))).filter(Boolean).slice(0, 5)
    : [];
  return {
    milestones,
    tip: sanitizeModelText(String(parsed.tip || '')),
  };
}

// ── 2. Focus Studio Co-Pilot ───────────────────────────────────────────────────
export async function recommendFocusBlock(
  tasks: Task[],
  projects: ProjectItem[],
  studySessions: StudySession[]
): Promise<{ label: string; minutes: 25 | 50; reason: string; linkedTaskId?: string; linkedProjectId?: string }> {
  const pending = tasks.filter((t) => !t.completed).slice(0, 8).map((t) => ({ id: t.id, text: t.text, date: t.date }));
  const activeProjs = projects
    .filter((p) => p.status === 'active')
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.title,
      next: p.milestones.find((m) => !m.completed)?.title || null,
    }));
  const recent = studySessions.slice(0, 4).map((s) => `${s.subject} (${s.duration}m)`);

  const parsed = await runStructuredCoPilot(
    'You are Luna AI recommending the highest-leverage next Focus Studio block.',
    `Pending Tasks: ${JSON.stringify(pending)}
Active Projects: ${JSON.stringify(activeProjs)}
Recent Sessions: ${JSON.stringify(recent)}
Return JSON: {"label":"topic","minutes":25 or 50,"reason":"1 short sentence","linkedTaskId":string or null,"linkedProjectId":string or null}`
  );
  return {
    label: sanitizeModelText(String(parsed.label || 'Deep Work')),
    minutes: Number(parsed.minutes) === 50 ? 50 : 25,
    reason: sanitizeModelText(String(parsed.reason || 'High-impact priority block.')),
    linkedTaskId: typeof parsed.linkedTaskId === 'string' ? parsed.linkedTaskId : undefined,
    linkedProjectId: typeof parsed.linkedProjectId === 'string' ? parsed.linkedProjectId : undefined,
  };
}

export async function summarizeFocusNotes(targetLabel: string, quickNotes: string[]): Promise<string> {
  const parsed = await runStructuredCoPilot(
    'You are Luna AI distilling rough focus-session scratch notes into clean study/work bullets.',
    `Session: "${targetLabel}"
Raw notes: ${JSON.stringify(quickNotes)}
Return JSON: {"summary":"concise 2-4 bullet plain-text summary"}`
  );
  return sanitizeModelText(String(parsed.summary || quickNotes.join('\n')));
}

// ── 3. Daily Journal Co-Pilot ──────────────────────────────────────────────────
export async function extractTasksFromBrainDump(brainDump: string): Promise<string[]> {
  const parsed = await runStructuredCoPilot(
    'You are Luna AI extracting concrete tomorrow action items from a night brain-dump.',
    `Brain dump:\n${brainDump}\nReturn JSON: {"tasks":["concrete task 1", "concrete task 2"]}`
  );
  return Array.isArray(parsed.tasks)
    ? parsed.tasks.map((x: any) => sanitizeModelText(String(x || ''))).filter(Boolean).slice(0, 6)
    : [];
}

export async function synthesizeWeeklyJournal(
  entries: JournalEntry[]
): Promise<{ observations: string[]; tomorrowCue: string }> {
  const safeEntries = entries
    .filter((e) => !isJournalEntryExcludedFromAi(e))
    .slice(0, 7)
    .map((e) => ({
      date: e.date,
      energy: e.morningEnergy,
      mood: e.nightMood,
      theme: e.morningFocusTheme,
      wins: e.wins,
      improve: e.improve,
    }));

  if (safeEntries.length === 0) {
    throw new Error('No unhidden journal entries available to analyze.');
  }

  const parsed = await runStructuredCoPilot(
    'You are Luna AI synthesizing recent non-private journal reflections calmly and factually.',
    `Entries: ${JSON.stringify(safeEntries)}
Return JSON: {"observations":["pattern 1","pattern 2"],"tomorrowCue":"1 concise practical adjustment"}`
  );
  return {
    observations: Array.isArray(parsed.observations)
      ? parsed.observations.map((x: any) => sanitizeModelText(String(x || ''))).filter(Boolean).slice(0, 3)
      : [],
    tomorrowCue: sanitizeModelText(String(parsed.tomorrowCue || '')),
  };
}

// ── 4. Inner Circle Co-Pilot ───────────────────────────────────────────────────
export async function suggestCircleAssistant(
  person: CirclePerson,
  mode: 'gifts' | 'opener',
  budgetHint?: string
): Promise<{ gifts: string[]; message: string }> {
  const lastNote = person.interactions?.[0]?.note || '';
  const existingGifts = (person.giftIdeas || []).map((g) => g.text);
  // Strictly omit person.phone
  const parsed = await runStructuredCoPilot(
    'You are Luna AI helping keep personal friendships thoughtful without sounding robotic.',
    `Mode: ${mode}
Name: "${person.name}" (${person.relation})
Budget hint: "${budgetHint || 'moderate'}"
Existing gift ideas: ${JSON.stringify(existingGifts)}
Personal notes: "${person.notes || ''}"
Last catch-up note: "${lastNote}"
Return JSON: {"gifts":["idea 1","idea 2","idea 3"],"message":"short natural text opener"}`
  );
  return {
    gifts: Array.isArray(parsed.gifts)
      ? parsed.gifts.map((x: any) => sanitizeModelText(String(x || ''))).filter(Boolean).slice(0, 4)
      : [],
    message: sanitizeModelText(String(parsed.message || '')),
  };
}

// ── 5. Trips & Packing Co-Pilot ────────────────────────────────────────────────
export async function auditTripPackingList(
  trip: TripPlan
): Promise<{ missing: { name: string; group: PackingGroup }[]; note: string }> {
  const existing = trip.packingItems.map((i) => i.name);
  // Strictly omit trip.bookingRef
  const parsed = await runStructuredCoPilot(
    'You are Luna AI auditing a travel packing checklist to catch forgotten essentials.',
    `Trip: "${trip.title}" (${trip.category})
Destination: "${trip.destination || 'Unspecified'}"
Dates: ${trip.departureDate}${trip.returnDate ? ` to ${trip.returnDate}` : ''}
Already packed/listed: ${JSON.stringify(existing)}
Return JSON: {"missing":[{"name":"item","group":"documents|tech|clothing|essentials"}],"note":"1 short travel readiness tip"}`
  );
  const missing = Array.isArray(parsed.missing)
    ? parsed.missing
        .map((m: any) => ({
          name: sanitizeModelText(String(m?.name || '')),
          group: (
            m?.group === 'documents' || m?.group === 'tech' || m?.group === 'clothing'
              ? m.group
              : 'essentials'
          ) as PackingGroup,
        }))
        .filter((m: { name: string }) => m.name.length > 0)
        .slice(0, 6)
    : [];
  return {
    missing,
    note: sanitizeModelText(String(parsed.note || '')),
  };
}

// ── 6. Decision Workbench Co-Pilot ─────────────────────────────────────────────
export async function auditDecisionBlindSpots(decision: DecisionRecord): Promise<{
  missingCriteria: { label: string; weight: 1 | 2 | 3 | 4 | 5 }[];
  riskCheck: string;
  synthesis: string;
}> {
  const parsed = await runStructuredCoPilot(
    'You are Luna AI performing a neutral steelman and blind-spot check on a weighted decision matrix. Do not command a choice.',
    `Question: "${decision.question}" (${decision.category})
Criteria: ${JSON.stringify(decision.criteria.map((c) => `${c.label} (wt ${c.weight})`))}` +
      `\nOptions: ${JSON.stringify(decision.options.map((o) => ({ title: o.title, pros: o.pros, cons: o.cons })))}\n` +
      `Expected outcome note: "${decision.expectedOutcome || ''}"\n` +
      `Return JSON: {"missingCriteria":[{"label":"criterion","weight":4}],"riskCheck":"1 strong counterargument against leading option","synthesis":"2-sentence neutral reflection"}`
  );
  const missingCriteria = Array.isArray(parsed.missingCriteria)
    ? parsed.missingCriteria
        .map((c: any) => ({
          label: sanitizeModelText(String(c?.label || '')),
          weight: (Number(c?.weight) >= 1 && Number(c?.weight) <= 5 ? Math.round(Number(c.weight)) : 3) as
            | 1
            | 2
            | 3
            | 4
            | 5,
        }))
        .filter((c: { label: string }) => c.label.length > 0)
        .slice(0, 3)
    : [];
  return {
    missingCriteria,
    riskCheck: sanitizeModelText(String(parsed.riskCheck || '')),
    synthesis: sanitizeModelText(String(parsed.synthesis || '')),
  };
}

