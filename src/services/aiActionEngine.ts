import type {
  Task,
  ShoppingList,
  ShoppingItem,
  NoteItem,
  ProjectItem,
  TripPlan,
  TripPackingItem,
  DecisionRecord,
  CirclePerson,
} from '../types';
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

      case 'CREATE_PROJECT': {
        const nowIso = new Date().toISOString();
        const rawMilestones = Array.isArray(p.milestones) ? p.milestones : [];
        const newProj: ProjectItem = {
          id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: String(p.title).trim(),
          category:
            p.category === 'academic' || p.category === 'career' || p.category === 'personal'
              ? p.category
              : 'build',
          status: 'active',
          targetDate: typeof p.targetDate === 'string' ? p.targetDate : undefined,
          description: typeof p.description === 'string' ? p.description : '',
          blockerNote: '',
          milestones: rawMilestones.map((m: any, idx: number) => ({
            id: `ms_${Date.now()}_${idx}`,
            title: typeof m === 'string' ? m.trim() : String(m?.title || 'Milestone').trim(),
            completed: false,
          })),
          linkedDriveFileIds: [],
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const existingProjects: ProjectItem[] = Array.isArray(currentData.projects) ? currentData.projects : [];
        await updateData({ projects: [newProj, ...existingProjects] });
        return {
          success: true,
          message: `Created project "${newProj.title}" with ${newProj.milestones.length} milestone(s).`,
          undoPayload: { projects: existingProjects },
        };
      }

      case 'ADD_PROJECT_MILESTONE': {
        const existingProjects: ProjectItem[] = Array.isArray(currentData.projects) ? currentData.projects : [];
        const queryTitle = String(p.projectTitle || p.projectId || '').trim().toLowerCase();
        const targetIdx = existingProjects.findIndex(
          (pr) => pr.id === p.projectId || pr.title.toLowerCase().includes(queryTitle)
        );
        if (targetIdx === -1) {
          return { success: false, message: 'Matching active project was not found.' };
        }
        const target = existingProjects[targetIdx];
        const msTitle = String(p.milestone || p.title).trim();
        const updatedProjects = existingProjects.map((pr, idx) =>
          idx === targetIdx
            ? {
                ...pr,
                milestones: [
                  ...pr.milestones,
                  { id: `ms_${Date.now()}`, title: msTitle, completed: false },
                ],
                updatedAt: new Date().toISOString(),
              }
            : pr
        );
        await updateData({ projects: updatedProjects });
        return {
          success: true,
          message: `Added milestone "${msTitle}" to "${target.title}".`,
          undoPayload: { projects: existingProjects },
        };
      }

      case 'CREATE_TRIP': {
        const nowIso = new Date().toISOString();
        const todayStr = nowIso.slice(0, 10);
        const rawItems = Array.isArray(p.items) ? p.items : [];
        const packingItems: TripPackingItem[] = rawItems.map((it: any, idx: number) => ({
          id: `pack_${Date.now()}_${idx}`,
          name: typeof it === 'string' ? it.trim() : String(it?.name || 'Item').trim(),
          group:
            typeof it === 'object' &&
            (it?.group === 'documents' || it?.group === 'tech' || it?.group === 'clothing')
              ? it.group
              : 'essentials',
          packed: false,
        }));
        const newTrip: TripPlan = {
          id: `trip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: String(p.title || p.destination).trim(),
          destination: typeof p.destination === 'string' ? p.destination.trim() : '',
          category:
            p.category === 'home' ||
            p.category === 'hostel' ||
            p.category === 'weekend' ||
            p.category === 'hackathon' ||
            p.category === 'interview'
              ? p.category
              : 'other',
          departureDate: typeof p.departureDate === 'string' ? p.departureDate : todayStr,
          returnDate: typeof p.returnDate === 'string' ? p.returnDate : undefined,
          bookingRef: '',
          notes: typeof p.notes === 'string' ? p.notes : '',
          packingItems,
          isCompleted: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const existingTrips: TripPlan[] = Array.isArray(currentData.trips) ? currentData.trips : [];
        await updateData({ trips: [newTrip, ...existingTrips] });
        return {
          success: true,
          message: `Created trip "${newTrip.title}" with ${packingItems.length} packing items.`,
          undoPayload: { trips: existingTrips },
        };
      }

      case 'ADD_PACKING_ITEMS': {
        const existingTrips: TripPlan[] = Array.isArray(currentData.trips) ? currentData.trips : [];
        if (existingTrips.length === 0) {
          return { success: false, message: 'No planned trips found to add packing items.' };
        }
        const queryTitle = String(p.tripTitle || p.tripId || '').trim().toLowerCase();
        let targetIdx = existingTrips.findIndex(
          (t) => !t.isCompleted && (t.id === p.tripId || t.title.toLowerCase().includes(queryTitle))
        );
        if (targetIdx === -1) targetIdx = existingTrips.findIndex((t) => !t.isCompleted);
        if (targetIdx === -1) targetIdx = 0;

        const targetTrip = existingTrips[targetIdx];
        const existingNames = new Set(targetTrip.packingItems.map((i) => i.name.trim().toLowerCase()));
        const additions: TripPackingItem[] = (Array.isArray(p.items) ? p.items : [])
          .map((it: any, idx: number) => ({
            id: `pack_${Date.now()}_${idx}`,
            name: typeof it === 'string' ? it.trim() : String(it?.name || 'Item').trim(),
            group:
              typeof it === 'object' &&
              (it?.group === 'documents' || it?.group === 'tech' || it?.group === 'clothing')
                ? it.group
                : ('essentials' as const),
            packed: false,
          }))
          .filter((it: TripPackingItem) => it.name && !existingNames.has(it.name.toLowerCase()));

        const updatedTrips = existingTrips.map((t, idx) =>
          idx === targetIdx
            ? { ...t, packingItems: [...t.packingItems, ...additions], updatedAt: new Date().toISOString() }
            : t
        );
        await updateData({ trips: updatedTrips });
        return {
          success: true,
          message: `Added ${additions.length} packing item(s) to "${targetTrip.title}".`,
          undoPayload: { trips: existingTrips },
        };
      }

      case 'CREATE_DECISION': {
        const nowIso = new Date().toISOString();
        const critIds = [`crit_${Date.now()}_1`, `crit_${Date.now()}_2`];
        const rawCriteria = Array.isArray(p.criteria) && p.criteria.length > 0
          ? p.criteria.slice(0, 5)
          : ['Long-Term Growth', 'Cost & Effort Fit'];
        const criteria = rawCriteria.map((c: any, idx: number) => ({
          id: critIds[idx] || `crit_${Date.now()}_${idx}`,
          label: typeof c === 'string' ? c.trim() : String(c?.label || 'Criterion').trim(),
          weight: (typeof c === 'object' && Number(c?.weight) >= 1 && Number(c?.weight) <= 5
            ? Number(c.weight)
            : 3) as 1 | 2 | 3 | 4 | 5,
        }));
        const rawOpts = Array.isArray(p.options) && p.options.length >= 2 ? p.options.slice(0, 4) : ['Option A', 'Option B'];
        const options = rawOpts.map((o: any, idx: number) => ({
          id: `opt_${Date.now()}_${idx}`,
          title: typeof o === 'string' ? o.trim() : String(o?.title || `Option ${idx + 1}`).trim(),
          scores: {},
          pros: [],
          cons: [],
        }));
        const newDecision: DecisionRecord = {
          id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          question: String(p.question).trim(),
          category:
            p.category === 'career' || p.category === 'finance' || p.category === 'tech' || p.category === 'study'
              ? p.category
              : 'life',
          status: 'open',
          criteria,
          options,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        const existingDecisions: DecisionRecord[] = Array.isArray(currentData.decisions) ? currentData.decisions : [];
        await updateData({ decisions: [newDecision, ...existingDecisions] });
        return {
          success: true,
          message: `Created decision matrix "${newDecision.question}" in Decisions.`,
          undoPayload: { decisions: existingDecisions },
        };
      }

      case 'LOG_CIRCLE_CATCHUP': {
        const existingCircle: CirclePerson[] = Array.isArray(currentData.circleContacts) ? currentData.circleContacts : [];
        const queryName = String(p.name).trim().toLowerCase();
        const targetIdx = existingCircle.findIndex((c) => c.name.trim().toLowerCase() === queryName || c.name.toLowerCase().includes(queryName));
        if (targetIdx === -1) {
          return { success: false, message: `Contact "${p.name}" was not found in Inner Circle.` };
        }
        const todayStr = new Date().toISOString().slice(0, 10);
        const ixType = p.type === 'call' || p.type === 'meetup' ? p.type : 'message';
        const target = existingCircle[targetIdx];
        const updatedCircle = existingCircle.map((c, idx) =>
          idx === targetIdx
            ? {
                ...c,
                lastContactedDate: todayStr,
                interactions: [
                  {
                    id: `ix_${Date.now()}`,
                    date: todayStr,
                    type: ixType as 'call' | 'meetup' | 'message',
                    note: typeof p.note === 'string' ? p.note.trim() : undefined,
                  },
                  ...(c.interactions || []),
                ].slice(0, 30),
                updatedAt: new Date().toISOString(),
              }
            : c
        );
        await updateData({ circleContacts: updatedCircle });
        return {
          success: true,
          message: `Logged catch-up (${ixType}) with ${target.name}.`,
          undoPayload: { circleContacts: existingCircle },
        };
      }

      default:
        return { success: false, message: 'Unsupported action type.' };
    }
  } catch (err: any) {
    return { success: false, message: `Failed to execute action: ${err.message || 'Error'}` };
  }
}
