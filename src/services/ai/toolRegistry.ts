import { getLetAiMakeChanges } from '../../utils/aiSecurity.ts';

export type AiActionType =
  | 'ADD_TASK'
  | 'UPDATE_TASK'
  | 'LOG_MEAL'
  | 'LOG_WORKOUT'
  | 'ADD_SHOPPING_ITEM'
  | 'ADD_MULTIPLE_SHOPPING_ITEMS'
  | 'CREATE_OUTING'
  | 'ADD_EXPENSE'
  | 'ADD_NOTE'
  | 'CREATE_PROJECT'
  | 'ADD_PROJECT_MILESTONE'
  | 'CREATE_TRIP'
  | 'ADD_PACKING_ITEMS'
  | 'CREATE_DECISION'
  | 'LOG_CIRCLE_CATCHUP';

export interface AiActionProposal {
  id: string;
  type: AiActionType;
  title: string;
  description: string;
  payload: Record<string, any>;
  confirmed: boolean;
  executed: boolean;
  requiresConfirmation?: boolean;
}

const ALLOWLISTED_ACTIONS = new Set<AiActionType>([
  'ADD_TASK',
  'UPDATE_TASK',
  'LOG_MEAL',
  'LOG_WORKOUT',
  'ADD_SHOPPING_ITEM',
  'ADD_MULTIPLE_SHOPPING_ITEMS',
  'CREATE_OUTING',
  'ADD_EXPENSE',
  'ADD_NOTE',
  'CREATE_PROJECT',
  'ADD_PROJECT_MILESTONE',
  'CREATE_TRIP',
  'ADD_PACKING_ITEMS',
  'CREATE_DECISION',
  'LOG_CIRCLE_CATCHUP',
]);

export function isAllowListedAction(type: string): boolean {
  return ALLOWLISTED_ACTIONS.has(type as AiActionType);
}

export function validateToolArguments(
  type: AiActionType,
  payload: unknown
): { valid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, error: 'Action payload must be an object.' };
  }
  const p = payload as Record<string, unknown>;

  switch (type) {
    case 'ADD_TASK': {
      const text = (p.text || p.title) as unknown;
      if (typeof text !== 'string' || !text.trim()) {
        return { valid: false, error: 'ADD_TASK requires non-empty text/title.' };
      }
      return { valid: true };
    }
    case 'UPDATE_TASK': {
      if (typeof p.id !== 'string' && typeof p.text !== 'string') {
        return { valid: false, error: 'UPDATE_TASK requires task id or matching text.' };
      }
      return { valid: true };
    }
    case 'ADD_EXPENSE': {
      const amount = Number(p.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
        return { valid: false, error: 'ADD_EXPENSE requires a positive finite amount.' };
      }
      return { valid: true };
    }
    case 'ADD_NOTE': {
      if (typeof p.title !== 'string' && typeof p.content !== 'string') {
        return { valid: false, error: 'ADD_NOTE requires title or content.' };
      }
      return { valid: true };
    }
    case 'LOG_MEAL': {
      if (typeof p.name !== 'string' || !p.name.trim()) {
        return { valid: false, error: 'LOG_MEAL requires meal name.' };
      }
      if (p.calories !== undefined && (!Number.isFinite(Number(p.calories)) || Number(p.calories) < 0)) {
        return { valid: false, error: 'LOG_MEAL calories must be non-negative.' };
      }
      return { valid: true };
    }
    case 'ADD_MULTIPLE_SHOPPING_ITEMS': {
      if (!Array.isArray(p.items) || p.items.length === 0) {
        return { valid: false, error: 'ADD_MULTIPLE_SHOPPING_ITEMS requires non-empty items array.' };
      }
      return { valid: true };
    }
    case 'ADD_SHOPPING_ITEM': {
      if (typeof p.name !== 'string' || !p.name.trim()) {
        return { valid: false, error: 'ADD_SHOPPING_ITEM requires item name.' };
      }
      return { valid: true };
    }
    case 'CREATE_OUTING':
    case 'LOG_WORKOUT':
      return { valid: true };
    case 'CREATE_PROJECT': {
      const title = p.title as unknown;
      if (typeof title !== 'string' || !title.trim()) {
        return { valid: false, error: 'CREATE_PROJECT requires a non-empty title.' };
      }
      return { valid: true };
    }
    case 'ADD_PROJECT_MILESTONE': {
      const ms = (p.milestone || p.title) as unknown;
      const proj = (p.projectTitle || p.projectId) as unknown;
      if (typeof ms !== 'string' || !ms.trim() || typeof proj !== 'string' || !proj.trim()) {
        return { valid: false, error: 'ADD_PROJECT_MILESTONE requires milestone title and projectTitle.' };
      }
      return { valid: true };
    }
    case 'CREATE_TRIP': {
      const title = (p.title || p.destination) as unknown;
      if (typeof title !== 'string' || !title.trim()) {
        return { valid: false, error: 'CREATE_TRIP requires title or destination.' };
      }
      return { valid: true };
    }
    case 'ADD_PACKING_ITEMS': {
      if (!Array.isArray(p.items) || p.items.length === 0) {
        return { valid: false, error: 'ADD_PACKING_ITEMS requires non-empty items array.' };
      }
      return { valid: true };
    }
    case 'CREATE_DECISION': {
      if (typeof p.question !== 'string' || !p.question.trim()) {
        return { valid: false, error: 'CREATE_DECISION requires a decision question.' };
      }
      return { valid: true };
    }
    case 'LOG_CIRCLE_CATCHUP': {
      if (typeof p.name !== 'string' || !p.name.trim()) {
        return { valid: false, error: 'LOG_CIRCLE_CATCHUP requires a contact name.' };
      }
      return { valid: true };
    }
    default:
      return { valid: false, error: 'Action type is not allowlisted.' };
  }
}

export function cleanAndParseJsonAction(raw: string): any {
  if (!raw) return null;
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    let sanitized = trimmed.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(sanitized);
    } catch {
      if (sanitized.startsWith('{') && !sanitized.endsWith('}')) {
        try {
          return JSON.parse(sanitized + '}');
        } catch {}
      }
      return null;
    }
  }
}

export function buildActionTitle(parsed: any): string {
  const p = parsed.payload || {};
  switch (parsed.type) {
    case 'ADD_TASK':
      return `Add Task: ${p.text || p.title || 'New Task'}`;
    case 'UPDATE_TASK':
      return `Update Task: ${p.text || p.id || 'Task'}`;
    case 'ADD_EXPENSE':
      return `Log Expense: Rs ${p.amount || 0} (${p.category || 'General'})`;
    case 'ADD_SHOPPING_ITEM':
      return `Add to Shopping: ${p.name || 'Item'}`;
    case 'ADD_MULTIPLE_SHOPPING_ITEMS':
      return `Create Shopping List: ${p.listName || 'Outing Checklist'} (${p.items?.length || 0} items)`;
    case 'CREATE_OUTING':
      return `Plan Outing: ${p.name || 'Weekend Outing'}`;
    case 'LOG_MEAL':
      return `Log Meal: ${p.name || 'Meal'} (${p.calories || 0} kcal)`;
    case 'LOG_WORKOUT':
      return `Log Workout: ${p.type || 'Session'}`;
    case 'ADD_NOTE':
      return `Create Note: ${p.title || 'Untitled Note'}`;
    case 'CREATE_PROJECT':
      return `Create Project: ${p.title || 'New Project'}`;
    case 'ADD_PROJECT_MILESTONE':
      return `Add Milestone: ${p.milestone || p.title || 'Milestone'}`;
    case 'CREATE_TRIP':
      return `Plan Trip: ${p.title || p.destination || 'Trip'}`;
    case 'ADD_PACKING_ITEMS':
      return `Add Packing Items (${Array.isArray(p.items) ? p.items.length : 0})`;
    case 'CREATE_DECISION':
      return `New Decision Matrix: ${p.question || 'Decision'}`;
    case 'LOG_CIRCLE_CATCHUP':
      return `Log Catch-Up: ${p.name || 'Contact'}`;
    default:
      return 'Proposed Action';
  }
}

export function buildActionDescription(parsed: any): string {
  const p = parsed.payload || {};
  switch (parsed.type) {
    case 'ADD_TASK': {
      const due = p.dueDate || p.date || 'Today';
      const timeStr = p.startTime ? ` at ${p.startTime}` : '';
      const prio = p.priority ? ` • Priority: ${p.priority}` : '';
      return `Due: ${due}${timeStr}${prio}`;
    }
    case 'UPDATE_TASK':
      return p.completed ? 'Mark task as completed' : 'Update task details';
    case 'ADD_EXPENSE': {
      const cat = p.category ? `Category: ${p.category}` : 'General';
      const note = p.note ? ` • Note: ${p.note}` : '';
      const date = p.date ? ` • Date: ${p.date}` : '';
      return `${cat}${note}${date}`;
    }
    case 'ADD_SHOPPING_ITEM':
      return `Item: "${p.name || 'Item'}" ${p.quantity ? `(${p.quantity})` : ''} ${p.estimatedCost ? `• Est: Rs ${p.estimatedCost}` : ''}`;
    case 'ADD_MULTIPLE_SHOPPING_ITEMS': {
      const itemsList = Array.isArray(p.items)
        ? p.items.map((i: any) => (typeof i === 'string' ? i : i.name)).slice(0, 4).join(', ')
        : '';
      return `Items: ${itemsList}${p.items && p.items.length > 4 ? ` + ${p.items.length - 4} more` : ''}`;
    }
    case 'CREATE_OUTING': {
      const date = p.startDate || p.date || 'Upcoming';
      const place = p.place ? ` @ ${p.place}` : '';
      const budget = p.budget ? ` • Budget: Rs ${p.budget}` : '';
      return `Date: ${date}${place}${budget}`;
    }
    case 'LOG_MEAL':
      return `Calories: ${p.calories || 0} kcal • Protein: ${p.protein || 0}g • Type: ${p.mealType || 'General'}`;
    case 'LOG_WORKOUT':
      return `Duration: ${p.durationMinutes || 30} mins • Notes: ${p.notes || 'None'}`;
    case 'ADD_NOTE': {
      const preview = p.content ? (p.content.length > 60 ? p.content.slice(0, 57) + '...' : p.content) : 'Empty note';
      return `Note: ${preview}`;
    }
    case 'CREATE_PROJECT':
      return `${p.category || 'build'} project${Array.isArray(p.milestones) ? ` • ${p.milestones.length} milestones` : ''}`;
    case 'ADD_PROJECT_MILESTONE':
      return `Target Project: ${p.projectTitle || p.projectId || 'Project'}`;
    case 'CREATE_TRIP':
      return `${p.destination || 'Destination'} • ${p.departureDate || 'Upcoming'}`;
    case 'ADD_PACKING_ITEMS': {
      const list = Array.isArray(p.items)
        ? p.items.map((x: any) => (typeof x === 'string' ? x : x?.name)).filter(Boolean).slice(0, 4).join(', ')
        : '';
      return `Bag Checklist: ${list}`;
    }
    case 'CREATE_DECISION':
      return `${Array.isArray(p.options) ? p.options.length : 2} options • Weighted matrix`;
    case 'LOG_CIRCLE_CATCHUP':
      return `${p.type || 'message'}${p.note ? ` • ${p.note}` : ''}`;
    default:
      return '';
  }
}

export function extractAiActionProposals(text: string): { cleanText: string; proposals: AiActionProposal[] } {
  if (!getLetAiMakeChanges()) {
    return { cleanText: text, proposals: [] };
  }

  const proposals: AiActionProposal[] = [];
  let cleanText = text;

  const actionRegex =
    /```(?:json_action|json|action)?\s*([\s\S]*?(?:\{|\[)[\s\S]*?"type"\s*:\s*"(?:ADD_TASK|UPDATE_TASK|ADD_EXPENSE|ADD_SHOPPING_ITEM|ADD_MULTIPLE_SHOPPING_ITEMS|CREATE_OUTING|LOG_MEAL|LOG_WORKOUT|ADD_NOTE|CREATE_PROJECT|ADD_PROJECT_MILESTONE|CREATE_TRIP|ADD_PACKING_ITEMS|CREATE_DECISION|LOG_CIRCLE_CATCHUP)"[\s\S]*?(?:\}|\]))\s*```/gi;
  let match;

  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const parsed = cleanAndParseJsonAction(match[1]);
      const items = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

      for (const item of items) {
        if (item && typeof item.type === 'string' && isAllowListedAction(item.type.toUpperCase())) {
          const type = item.type.toUpperCase() as AiActionType;
          const payload = item.payload || {};
          if (!validateToolArguments(type, payload).valid) continue;
          const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          proposals.push({
            id,
            type,
            title: buildActionTitle({ ...item, type }),
            description: buildActionDescription({ ...item, type }),
            payload,
            confirmed: false,
            executed: false,
            requiresConfirmation: true,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to parse AI action proposal JSON:', err);
    }
  }

  cleanText = cleanText.replace(actionRegex, '').trim();

  if (proposals.length === 0) {
    const rawJsonRegex =
      /((?:\{|\[)\s*"type"\s*:\s*"(?:ADD_TASK|UPDATE_TASK|ADD_EXPENSE|ADD_SHOPPING_ITEM|ADD_MULTIPLE_SHOPPING_ITEMS|CREATE_OUTING|LOG_MEAL|LOG_WORKOUT|ADD_NOTE|CREATE_PROJECT|ADD_PROJECT_MILESTONE|CREATE_TRIP|ADD_PACKING_ITEMS|CREATE_DECISION|LOG_CIRCLE_CATCHUP)"[\s\S]*?(?:\}|\]))\s*$/i;
    const rawMatch = rawJsonRegex.exec(cleanText);
    if (rawMatch) {
      try {
        const parsed = cleanAndParseJsonAction(rawMatch[1]);
        const items = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

        for (const item of items) {
          if (item && typeof item.type === 'string' && isAllowListedAction(item.type.toUpperCase())) {
            const type = item.type.toUpperCase() as AiActionType;
            const payload = item.payload || {};
            if (!validateToolArguments(type, payload).valid) continue;
            const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            proposals.push({
              id,
              type,
              title: buildActionTitle({ ...item, type }),
              description: buildActionDescription({ ...item, type }),
              payload,
              confirmed: false,
              executed: false,
              requiresConfirmation: true,
            });
          }
        }
        cleanText = cleanText.replace(rawJsonRegex, '').trim();
      } catch (err) {
        console.warn('Failed to parse fallback AI action JSON:', err);
      }
    }
  }

  return { cleanText, proposals };
}

