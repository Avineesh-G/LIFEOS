import { getLetAiMakeChanges } from '../utils/aiSecurity';
import type { Task, ShoppingList, ShoppingItem } from '../types';
import { createShoppingList, generateShoppingId } from '../utils/shoppingStorage';
import { saveOuting } from '../features/outings/storage/outingsIdb';
import { DEFAULT_ME_PERSON } from '../features/outings/constants';
import type { Outing } from '../features/outings/types';

export type AiActionType = 
  | 'ADD_TASK' 
  | 'LOG_MEAL' 
  | 'LOG_WORKOUT' 
  | 'ADD_SHOPPING_ITEM'
  | 'ADD_MULTIPLE_SHOPPING_ITEMS'
  | 'CREATE_OUTING';

export interface AiActionProposal {
  id: string;
  type: AiActionType;
  title: string;
  description: string;
  payload: Record<string, any>;
  confirmed: boolean;
  executed: boolean;
}

/**
 * Parses structured JSON block enclosed in ```json_action ... ``` from assistant text if AI changes are enabled.
 */
export function extractAiActionProposals(text: string): { cleanText: string; proposals: AiActionProposal[] } {
  if (!getLetAiMakeChanges()) {
    return { cleanText: text, proposals: [] };
  }

  const proposals: AiActionProposal[] = [];
  const actionRegex = /```json_action\s*([\s\S]*?)\s*```/g;
  let match;
  let cleanText = text;

  while ((match = actionRegex.exec(text)) !== null) {
    try {
      const rawJson = match[1];
      const parsed = JSON.parse(rawJson);
      
      if (parsed && typeof parsed.type === 'string' && isAllowListedAction(parsed.type)) {
        const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        proposals.push({
          id,
          type: parsed.type as AiActionType,
          title: buildActionTitle(parsed),
          description: buildActionDescription(parsed),
          payload: parsed.payload || {},
          confirmed: false,
          executed: false,
        });
      }
    } catch (err) {
      console.warn('Failed to parse AI action proposal JSON:', err);
    }
  }

  // Strip action blocks from visual message text
  cleanText = cleanText.replace(actionRegex, '').trim();

  return { cleanText, proposals };
}

function isAllowListedAction(type: string): boolean {
  return [
    'ADD_TASK', 
    'LOG_MEAL', 
    'LOG_WORKOUT', 
    'ADD_SHOPPING_ITEM', 
    'ADD_MULTIPLE_SHOPPING_ITEMS',
    'CREATE_OUTING'
  ].includes(type);
}

function buildActionTitle(parsed: any): string {
  const p = parsed.payload || {};
  switch (parsed.type) {
    case 'ADD_TASK':
      return `Add Task: ${p.text || p.title || 'New Task'}`;
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
    default:
      return 'Proposed Action';
  }
}

function buildActionDescription(parsed: any): string {
  const p = parsed.payload || {};
  switch (parsed.type) {
    case 'ADD_TASK': {
      const due = p.dueDate || p.date || 'Today';
      const timeStr = p.startTime ? ` at ${p.startTime}` : '';
      const prio = p.priority ? ` • Priority: ${p.priority}` : '';
      return `Due: ${due}${timeStr}${prio}`;
    }
    case 'ADD_SHOPPING_ITEM':
      return `Item: "${p.name || 'Item'}" ${p.quantity ? `(${p.quantity})` : ''} ${p.estimatedCost ? `• Est: ₹${p.estimatedCost}` : ''}`;
    case 'ADD_MULTIPLE_SHOPPING_ITEMS': {
      const itemsList = Array.isArray(p.items) 
        ? p.items.map((i: any) => typeof i === 'string' ? i : i.name).slice(0, 4).join(', ') 
        : '';
      return `Items: ${itemsList}${p.items && p.items.length > 4 ? ` + ${p.items.length - 4} more` : ''}`;
    }
    case 'CREATE_OUTING': {
      const date = p.startDate || p.date || 'Upcoming';
      const place = p.place ? ` @ ${p.place}` : '';
      const budget = p.budget ? ` • Budget: ₹${p.budget}` : '';
      return `Date: ${date}${place}${budget}`;
    }
    case 'LOG_MEAL':
      return `Calories: ${p.calories || 0} kcal • Protein: ${p.protein || 0}g • Type: ${p.mealType || 'General'}`;
    case 'LOG_WORKOUT':
      return `Duration: ${p.durationMinutes || 30} mins • Notes: ${p.notes || 'None'}`;
    default:
      return '';
  }
}

/**
 * Safely executes a confirmed action proposal using LifeOS data mutation routines.
 */
export async function executeConfirmedAiAction(
  proposal: AiActionProposal,
  updateData: (partial: any) => Promise<any>,
  currentData: any
): Promise<{ success: boolean; message: string; undoPayload?: any }> {
  const p = proposal.payload;
  try {
    switch (proposal.type) {
      case 'ADD_TASK': {
        const todayStr = new Date().toISOString().split('T')[0];
        const newTask: Task = {
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: p.text || p.title || 'New Task',
          subtask: p.subtask || '',
          completed: false,
          date: p.dueDate || p.date || todayStr,
          dueDate: p.dueDate || p.date || todayStr,
          startTime: p.startTime || '',
          endTime: p.endTime || '',
          reminderTime: p.reminderTime || '',
        };
        const existingTasks = Array.isArray(currentData.tasks) ? currentData.tasks : [];
        const updatedTasks = [newTask, ...existingTasks];
        await updateData({ tasks: updatedTasks });
        return { 
          success: true, 
          message: `Task "${newTask.text}" successfully added to To-Do Tasks.`, 
          undoPayload: { tasks: existingTasks } 
        };
      }

      case 'ADD_SHOPPING_ITEM': {
        const existingLists: ShoppingList[] = Array.isArray(currentData.shoppingLists) ? currentData.shoppingLists : [];
        const newItem: ShoppingItem = {
          id: generateShoppingId('item'),
          name: p.name || 'New Item',
          quantity: p.quantity || undefined,
          checked: false,
          notes: p.notes || undefined,
        };

        let updatedLists: ShoppingList[];
        if (existingLists.length === 0) {
          const newList = createShoppingList('Shopping List', false, [newItem]);
          updatedLists = [newList];
        } else {
          // Add to first active list
          const targetIndex = 0;
          updatedLists = existingLists.map((l, idx) => 
            idx === targetIndex ? { ...l, items: [newItem, ...l.items], updatedAt: new Date().toISOString() } : l
          );
        }

        await updateData({ shoppingLists: updatedLists });
        return { 
          success: true, 
          message: `Added "${newItem.name}" to shopping list.`, 
          undoPayload: { shoppingLists: existingLists } 
        };
      }

      case 'ADD_MULTIPLE_SHOPPING_ITEMS': {
        const existingLists: ShoppingList[] = Array.isArray(currentData.shoppingLists) ? currentData.shoppingLists : [];
        const listName = p.listName || 'Outing Preparation Checklist';
        const rawItems = Array.isArray(p.items) ? p.items : [];
        
        const shoppingItems: ShoppingItem[] = rawItems.map((item: any) => ({
          id: generateShoppingId('item'),
          name: typeof item === 'string' ? item : item.name || 'Item',
          quantity: typeof item === 'object' && item.quantity ? String(item.quantity) : undefined,
          checked: false,
          notes: typeof item === 'object' && item.category ? `Category: ${item.category}` : undefined,
        }));

        const newList = createShoppingList(listName, false, shoppingItems);
        const updatedLists = [newList, ...existingLists];

        await updateData({ shoppingLists: updatedLists });
        return { 
          success: true, 
          message: `Created shopping checklist "${listName}" with ${shoppingItems.length} items.`, 
          undoPayload: { shoppingLists: existingLists } 
        };
      }

      case 'CREATE_OUTING': {
        const todayStr = new Date().toISOString().split('T')[0];
        const outingBudgetPaise = p.budget ? Math.round(Number(p.budget) * 100) : 0;
        
        const newOuting: Outing = {
          id: `outing_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: p.name || p.title || 'Weekend Outing',
          place: p.place || '',
          startDate: p.startDate || p.date || todayStr,
          endDate: p.endDate || undefined,
          notes: p.notes || '',
          budget: outingBudgetPaise > 0 ? outingBudgetPaise : undefined,
          budgetBasis: 'myShare',
          currency: 'INR',
          status: 'planned',
          participantIds: [DEFAULT_ME_PERSON.id],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await saveOuting(newOuting);
        } catch (idbErr) {
          console.warn('Could not write outing to IDB directly:', idbErr);
        }

        return { 
          success: true, 
          message: `Outing "${newOuting.name}" added to Outings planner.` 
        };
      }

      case 'LOG_MEAL': {
        const newMeal = {
          id: `meal_${Date.now()}`,
          name: p.name || 'Meal',
          calories: Number(p.calories) || 0,
          protein: Number(p.protein) || 0,
          date: new Date().toISOString().split('T')[0],
          mealType: p.mealType || 'snack',
        };
        const existingLogs = Array.isArray(currentData.nutritionLogs) ? currentData.nutritionLogs : [];
        const updatedLogs = [newMeal, ...existingLogs];
        await updateData({ nutritionLogs: updatedLogs });
        return { 
          success: true, 
          message: `Logged "${newMeal.name}" (${newMeal.calories} kcal).`, 
          undoPayload: { nutritionLogs: existingLogs } 
        };
      }

      case 'LOG_WORKOUT': {
        const newWorkout = {
          id: `w_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: p.type || 'Workout Session',
          durationMinutes: Number(p.durationMinutes) || 30,
          notes: p.notes || 'AI logged session',
          exercises: [],
        };
        const existingWorkouts = Array.isArray(currentData.workouts) ? currentData.workouts : [];
        const updatedWorkouts = [newWorkout, ...existingWorkouts];
        await updateData({ workouts: updatedWorkouts });
        return { 
          success: true, 
          message: `Workout "${newWorkout.type}" logged.`, 
          undoPayload: { workouts: existingWorkouts } 
        };
      }

      default:
        return { success: false, message: 'Unsupported action type.' };
    }
  } catch (err: any) {
    return { success: false, message: `Failed to execute action: ${err.message || 'Error'}` };
  }
}
