import { getLetAiMakeChanges } from '../utils/aiSecurity';

export type AiActionType = 'ADD_TASK' | 'LOG_MEAL' | 'LOG_WORKOUT' | 'ADD_SHOPPING_ITEM';

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
  return ['ADD_TASK', 'LOG_MEAL', 'LOG_WORKOUT', 'ADD_SHOPPING_ITEM'].includes(type);
}

function buildActionTitle(parsed: any): string {
  switch (parsed.type) {
    case 'ADD_TASK':
      return `Add Task: ${parsed.payload?.text || 'New Task'}`;
    case 'LOG_MEAL':
      return `Log Meal: ${parsed.payload?.name || 'Meal'} (${parsed.payload?.calories || 0} kcal)`;
    case 'LOG_WORKOUT':
      return `Log Workout: ${parsed.payload?.type || 'Session'}`;
    case 'ADD_SHOPPING_ITEM':
      return `Add to Shopping: ${parsed.payload?.name || 'Item'}`;
    default:
      return 'Proposed Action';
  }
}

function buildActionDescription(parsed: any): string {
  const p = parsed.payload || {};
  switch (parsed.type) {
    case 'ADD_TASK':
      return `Due: ${p.dueDate || 'Today'} • Priority: ${p.priority || 'Medium'}`;
    case 'LOG_MEAL':
      return `Calories: ${p.calories || 0} kcal • Protein: ${p.protein || 0}g • Type: ${p.mealType || 'General'}`;
    case 'LOG_WORKOUT':
      return `Duration: ${p.durationMinutes || 30} mins • Notes: ${p.notes || 'None'}`;
    case 'ADD_SHOPPING_ITEM':
      return `Category: ${p.category || 'General'} ${p.estimatedCost ? `• Est: ₹${p.estimatedCost}` : ''}`;
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
        const newTask = {
          id: `task_${Date.now()}`,
          text: p.text || 'New Task',
          completed: false,
          createdAt: new Date().toISOString(),
          dueDate: p.dueDate || new Date().toISOString().split('T')[0],
          priority: p.priority || 'medium',
        };
        const updatedTodos = [newTask, ...(currentData.todos || [])];
        await updateData({ todos: updatedTodos });
        return { success: true, message: `Task "${newTask.text}" added.`, undoPayload: { todos: currentData.todos } };
      }

      case 'LOG_MEAL': {
        const newMeal = {
          id: `meal_${Date.now()}`,
          name: p.name || 'Meal',
          calories: Number(p.calories) || 0,
          protein: Number(p.protein) || 0,
          date: new Date().toISOString(),
          mealType: p.mealType || 'snack',
        };
        const updatedLogs = [newMeal, ...(currentData.nutritionLogs || [])];
        await updateData({ nutritionLogs: updatedLogs });
        return { success: true, message: `Logged "${newMeal.name}" (${newMeal.calories} kcal).`, undoPayload: { nutritionLogs: currentData.nutritionLogs } };
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
        const updatedWorkouts = [newWorkout, ...(currentData.workouts || [])];
        await updateData({ workouts: updatedWorkouts });
        return { success: true, message: `Workout "${newWorkout.type}" logged.`, undoPayload: { workouts: currentData.workouts } };
      }

      case 'ADD_SHOPPING_ITEM': {
        const newItem = {
          id: `shop_${Date.now()}`,
          name: p.name || 'Item',
          category: p.category || 'General',
          completed: false,
          estimatedCost: Number(p.estimatedCost) || 0,
          createdAt: new Date().toISOString(),
        };
        const updatedItems = [newItem, ...(currentData.shoppingItems || [])];
        await updateData({ shoppingItems: updatedItems });
        return { success: true, message: `Added "${newItem.name}" to shopping list.`, undoPayload: { shoppingItems: currentData.shoppingItems } };
      }

      default:
        return { success: false, message: 'Unsupported action type.' };
    }
  } catch (err: any) {
    return { success: false, message: `Failed to execute action: ${err.message || 'Error'}` };
  }
}
