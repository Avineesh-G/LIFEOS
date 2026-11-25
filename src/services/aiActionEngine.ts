import type { Task, ShoppingList, ShoppingItem, NoteItem } from '../types';
import { createShoppingList, generateShoppingId } from '../utils/shoppingStorage';
import { saveOuting } from '../features/outings/storage/outingsIdb';
import { DEFAULT_ME_PERSON } from '../features/outings/constants';
import type { Outing } from '../features/outings/types';
import {
  extractAiActionProposals,
  isAllowListedAction,
  validateToolArguments,
  type AiActionProposal,
  type AiActionType,
} from './ai/toolRegistry.ts';

export {
  extractAiActionProposals,
  isAllowListedAction,
  validateToolArguments,
  type AiActionProposal,
  type AiActionType,
};

/**
 * Safely executes a confirmed action proposal using LifeOS data mutation routines.
 */
export async function executeConfirmedAiAction(
  proposal: AiActionProposal,
  updateData: (partial: any) => Promise<any>,
  currentData: any
): Promise<{ success: boolean; message: string; undoPayload?: any }> {
  const p = proposal.payload;
  const validation = validateToolArguments(proposal.type, p);
  if (!validation.valid) {
    return { success: false, message: validation.error || 'Invalid action arguments.' };
  }

  try {
    switch (proposal.type) {
      case 'ADD_TASK': {
        const todayStr = new Date().toISOString().split('T')[0];
        const newTask: Task = {
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text: String(p.text || p.title || 'New Task').trim(),
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
          undoPayload: { tasks: existingTasks },
        };
      }

      case 'UPDATE_TASK': {
        const existingTasks: Task[] = Array.isArray(currentData.tasks) ? currentData.tasks : [];
        const targetIdx = existingTasks.findIndex(
          (t) =>
            (typeof p.id === 'string' && t.id === p.id) ||
            (typeof p.text === 'string' && t.text.toLowerCase() === p.text.toLowerCase())
        );
        if (targetIdx === -1) {
          return { success: false, message: 'Matching task was not found in your To-Do list.' };
        }
        const updatedTasks = existingTasks.map((t, idx) =>
          idx === targetIdx
            ? {
                ...t,
                ...(typeof p.completed === 'boolean' ? { completed: p.completed } : {}),
                ...(typeof p.newText === 'string' ? { text: p.newText.trim() } : {}),
                ...(typeof p.dueDate === 'string' ? { dueDate: p.dueDate, date: p.dueDate } : {}),
              }
            : t
        );
        await updateData({ tasks: updatedTasks });
        return {
          success: true,
          message: `Updated task "${existingTasks[targetIdx].text}".`,
          undoPayload: { tasks: existingTasks },
        };
      }

      case 'ADD_NOTE': {
        const nowIso = new Date().toISOString();
        const monthKey = nowIso.slice(0, 7);
        const newNote: NoteItem = {
          id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: p.title || 'Extracted Note',
          content: p.content || '',
          pageView: 'lined',
          monthKey,
          isArchived: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const existingNotes = Array.isArray(currentData.notes) ? currentData.notes : [];
        const updatedNotes = [newNote, ...existingNotes];
        await updateData({ notes: updatedNotes });
        return {
          success: true,
          message: `Note "${newNote.title}" saved to Notes.`,
          undoPayload: { notes: existingNotes },
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
          const targetIndex = 0;
          updatedLists = existingLists.map((l, idx) =>
            idx === targetIndex ? { ...l, items: [newItem, ...l.items], updatedAt: new Date().toISOString() } : l
          );
        }

        await updateData({ shoppingLists: updatedLists });
        return {
          success: true,
          message: `Added "${newItem.name}" to shopping list.`,
          undoPayload: { shoppingLists: existingLists },
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
          undoPayload: { shoppingLists: existingLists },
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
          message: `Outing "${newOuting.name}" added to Outings planner.`,
        };
      }

      case 'ADD_EXPENSE': {
        const todayStr = new Date().toISOString().split('T')[0];
        const newExpense = {
          id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          amount: Math.abs(Number(p.amount)) || 0,
          category: p.category || 'General',
          note: p.note || p.title || 'AI Logged Expense',
          date: p.date || todayStr,
        };
        const existingExpenses = Array.isArray(currentData.expenses) ? currentData.expenses : [];
        const updatedExpenses = [newExpense, ...existingExpenses];
        await updateData({ expenses: updatedExpenses });
        return {
          success: true,
          message: `Logged ₹${newExpense.amount} (${newExpense.category}) in Spending.`,
          undoPayload: { expenses: existingExpenses },
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
          undoPayload: { nutritionLogs: existingLogs },
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
          isSaved: true,
        };
        const existingWorkouts = Array.isArray(currentData.workoutLogs)
          ? currentData.workoutLogs
          : Array.isArray(currentData.workouts)
          ? currentData.workouts
          : [];
        const updatedWorkouts = [newWorkout, ...existingWorkouts];
        await updateData({ workoutLogs: updatedWorkouts });
        return {
          success: true,
          message: `Workout "${newWorkout.type}" logged.`,
          undoPayload: { workoutLogs: existingWorkouts },
        };
      }

      default:
        return { success: false, message: 'Unsupported action type.' };
    }
  } catch (err: any) {
    return { success: false, message: `Failed to execute action: ${err.message || 'Error'}` };
  }
}
