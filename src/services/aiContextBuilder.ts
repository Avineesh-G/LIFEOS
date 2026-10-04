import type { AppData, NoteItem } from '../types.ts';
import { getLetAiReadData, getSectionPermissions, isNoteExcludedFromAi, redactSensitiveInformation } from '../utils/aiSecurity.ts';
import { getAggregatedUsageSummary } from './aiUsageTracker.ts';
import { getStoredLocation } from '../utils/geolocation.ts';
import { format } from 'date-fns';

/**
 * Builds a compact, targeted context summary of the user's LifeOS data.
 * Sent to Groq ONLY if "Let AI read my data" is enabled and the section is permitted.
 * Vault data is STRICTLY hard-excluded under all circumstances.
 * All outgoing context passes through the redaction layer before transmission.
 */
export function buildTargetedAiContext(query: string, data: AppData): string {
  if (!getLetAiReadData()) {
    return 'User privacy setting: AI data reading is currently DISABLED by user.';
  }

  const perms = getSectionPermissions();
  const lowerQuery = query.toLowerCase();
  const isGeneralQuery = lowerQuery.length < 5 || lowerQuery.includes('overview') || lowerQuery.includes('summary') || lowerQuery.includes('today');

  const contextBlocks: string[] = [];

  // Today's Date Anchor
  const todayStr = format(new Date(), 'EEEE, MMMM d, yyyy');
  contextBlocks.push(`Current Date: ${todayStr}`);

  // 1. App Usage Metrics (if asked)
  if (lowerQuery.includes('most') || lowerQuery.includes('usage') || lowerQuery.includes('frequently') || lowerQuery.includes('screen') || lowerQuery.includes('open')) {
    contextBlocks.push(getAggregatedUsageSummary(30));
  }

  // 2. Tasks / TO-DOs (if permitted & relevant)
  if (perms.todo && (isGeneralQuery || lowerQuery.includes('task') || lowerQuery.includes('todo') || lowerQuery.includes('pending') || lowerQuery.includes('work') || lowerQuery.includes('due'))) {
    const activeTasks = (data.tasks || []).filter((t: any) => !t.completed);
    const completedToday = (data.tasks || []).filter((t: any) => t.completed && t.date === format(new Date(), 'yyyy-MM-dd'));

    let taskSummary = `Pending Tasks (${activeTasks.length}): `;
    if (activeTasks.length === 0) {
      taskSummary += 'None pending.';
    } else {
      taskSummary += activeTasks.slice(0, 8).map((t: any) => `"${t.text}" (due ${t.dueDate || t.date || 'today'})`).join('; ');
    }
    taskSummary += ` | Completed Today: ${completedToday.length}`;
    contextBlocks.push(taskSummary);
  }

  // 3. Nutrition & Calories (if permitted & relevant)
  if (perms.nutrition && (isGeneralQuery || lowerQuery.includes('nutrition') || lowerQuery.includes('eat') || lowerQuery.includes('calorie') || lowerQuery.includes('food') || lowerQuery.includes('meal') || lowerQuery.includes('protein'))) {
    const todayLogs = (data.nutritionLogs || []).filter((n: any) => n.date === format(new Date(), 'yyyy-MM-dd'));
    const totalCal = todayLogs.reduce((acc: number, n: any) => acc + (n.dailyTotal || 0), 0);
    const targetCal = data.profile?.currentCalorieTarget || 2000;
    const targetProt = data.profile?.dailyProteinTarget || 140;

    contextBlocks.push(`Nutrition Today: ${totalCal}/${targetCal} kcal target (${targetProt}g protein target). Meals logged: ${todayLogs.length} logs today.`);
  }

  // 4. Gym & Workouts (if permitted & relevant)
  if (perms.gym && (isGeneralQuery || lowerQuery.includes('gym') || lowerQuery.includes('workout') || lowerQuery.includes('exercise') || lowerQuery.includes('lift') || lowerQuery.includes('push') || lowerQuery.includes('pull') || lowerQuery.includes('leg'))) {
    const recentWorkouts = (data.workoutLogs || []).slice(0, 5);
    if (recentWorkouts.length === 0) {
      contextBlocks.push('Gym: No recent workout logs.');
    } else {
      const latest = recentWorkouts[0];
      contextBlocks.push(`Gym Recent Workouts: Latest on ${latest.date || 'recent'} (${latest.type || 'Session'}, ${latest.exercises?.length || 0} exercises). Total logged workouts: ${data.workoutLogs.length}`);
    }
  }

  // 5. Spending & Budget (if permitted & relevant)
  if (perms.spending && (isGeneralQuery || lowerQuery.includes('spend') || lowerQuery.includes('expense') || lowerQuery.includes('budget') || lowerQuery.includes('money') || lowerQuery.includes('rupee') || lowerQuery.includes('cost') || lowerQuery.includes('bought'))) {
    const monthlyExpenses = (data.expenses || []).slice(0, 10);
    const totalSpent = (data.expenses || []).reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);
    contextBlocks.push(`Spending Summary: Total logged expenses ₹${Math.round(totalSpent)}. Recent entries: ${monthlyExpenses.slice(0, 5).map((e: any) => `₹${e.amount} (${e.category || 'General'})`).join(', ') || 'None'}`);
  }

  // 6. Study & Sessions (if permitted & relevant)
  if (perms.study && (isGeneralQuery || lowerQuery.includes('study') || lowerQuery.includes('session') || lowerQuery.includes('focus') || lowerQuery.includes('hours') || lowerQuery.includes('subject'))) {
    const todayStudy = (data.studySessions || []).filter((s: any) => s.date === format(new Date(), 'yyyy-MM-dd'));
    const totalMinsToday = todayStudy.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
    contextBlocks.push(`Study Today: ${totalMinsToday} mins logged across ${todayStudy.length} sessions.`);
  }

  // 7. Notes & Ideas (if permitted & relevant, excluding hidden/locked/archived notes)
  if (perms.notes && (lowerQuery.includes('note') || lowerQuery.includes('idea') || lowerQuery.includes('thought') || lowerQuery.includes('brainstorm'))) {
    const activeAllowedNotes = (data.notes || [])
      .filter((n: NoteItem) => !isNoteExcludedFromAi(n))
      .slice(0, 5);

    if (activeAllowedNotes.length === 0) {
      contextBlocks.push('Notes & Ideas: No unhidden active notes available.');
    } else {
      contextBlocks.push(`Notes & Ideas (${activeAllowedNotes.length}): ${activeAllowedNotes.map((n: NoteItem) => `"${n.title || 'Untitled'}"`).join(', ')}`);
    }
  }

  // 8. Outings & Location Context (if permitted & relevant)
  if (perms.outings && (isGeneralQuery || lowerQuery.includes('outing') || lowerQuery.includes('trip') || lowerQuery.includes('plan') || lowerQuery.includes('travel') || lowerQuery.includes('weekend') || lowerQuery.includes('saturday') || lowerQuery.includes('sunday') || lowerQuery.includes('place') || lowerQuery.includes('visit') || lowerQuery.includes('food') || lowerQuery.includes('spot') || lowerQuery.includes('cafe'))) {
    const loc = getStoredLocation();
    const locStr = loc.city
      ? `${loc.city}${loc.region ? `, ${loc.region}` : ''}${loc.country ? `, ${loc.country}` : ''}`
      : 'Current Local City';
    contextBlocks.push(`User Location Context: Base city is ${locStr}. Ground all travel times, transit (metro/bus/cabs), and outing places in and around this location.`);

    const outingsList = (data as any).outings || [];
    if (outingsList.length === 0) {
      contextBlocks.push('Outings: No upcoming outing plans logged.');
    } else {
      const summaryList = outingsList.slice(0, 3).map((o: any) => {
        const title = o.title || o.name || 'Outing Plan';
        const date = o.date || 'Scheduled';
        const friends = Array.isArray(o.participants) ? o.participants.join(', ') : 'Friends';
        const hasLink = Boolean(o.url || o.link || o.webLink);
        const linkNotice = hasLink ? ' [Note: A web link is saved in this outing plan — open the Outings screen to view it]' : '';
        return `Title: "${title}", Date: ${date}, People: ${friends}${linkNotice}`;
      });
      contextBlocks.push(`Outing Plans (${outingsList.length}): ${summaryList.join('; ')}`);
    }
  }

  // 9. Shopping Lists (if permitted & relevant)
  if (perms.shopping && (lowerQuery.includes('shop') || lowerQuery.includes('buy') || lowerQuery.includes('cart') || lowerQuery.includes('item') || lowerQuery.includes('gear') || lowerQuery.includes('checklist'))) {
    const lists = data.shoppingLists || [];
    const allItems = lists.flatMap(l => l.items || []);
    const pendingItems = allItems.filter(i => !i.checked);
    contextBlocks.push(`Shopping List Pending (${pendingItems.length}): ${pendingItems.map((i: any) => i.name).join(', ') || 'Empty'}`);
  }

  const rawSummary = contextBlocks.join('\n');
  const redactedSummary = redactSensitiveInformation(rawSummary);

  return `<user_data_context>\n${redactedSummary}\n</user_data_context>`;
}
