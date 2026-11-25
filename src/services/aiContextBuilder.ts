import type { AppData, NoteItem } from '../types.ts';
import {
  getLetAiReadData,
  getSectionPermissions,
  isJournalEntryExcludedFromAi,
  isNoteExcludedFromAi,
  redactSensitiveInformation,
} from '../utils/aiSecurity.ts';
import { getAggregatedUsageSummary } from './aiUsageTracker.ts';
import { getStoredLocation } from '../utils/geolocation.ts';
import { format } from 'date-fns';
import { getProjectMetrics } from '../utils/projectHelpers.ts';
import { computeOptionScores } from '../utils/decisionMath.ts';
import { getCatchUpStatus, getDaysUntilBirthday, getPersonFinanceSummary } from '../utils/circleHelpers.ts';

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

  // 6. Notes & Ideas (if permitted & relevant, excluding hidden/locked/archived notes)
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

  // 7. Outings & Location Context (if permitted & relevant)
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

  // 10. Projects & Milestones (if permitted & relevant)
  if (
    perms.projects !== false &&
    (isGeneralQuery ||
      /\b(project|milestone|blocker|build|hackathon|deadline|roadmap|focus)\b/.test(lowerQuery))
  ) {
    const activeProjects = (data.projects || []).filter((p) => p.status === 'active');
    if (activeProjects.length > 0) {
      const summaries = activeProjects.slice(0, 4).map((p) => {
        const m = getProjectMetrics(p, data.studySessions || []);
        const nextStr = m.nextMilestoneTitle ? ` | next: "${m.nextMilestoneTitle}"` : '';
        const blockerStr = p.blockerNote?.trim() ? ` | blocker: ${p.blockerNote.trim().slice(0, 60)}` : '';
        return `"${p.title}" (${Math.round(m.progressRatio * 100)}%, ${m.doneMilestones}/${m.totalMilestones} milestones, ${m.focusMinutes}m focus${nextStr}${blockerStr})`;
      });
      contextBlocks.push(`Active Projects (${activeProjects.length}): ${summaries.join('; ')}`);
    }
  }

  // 11. Focus Studio Summary (if permitted & relevant)
  if (
    perms.focus !== false &&
    (isGeneralQuery || /\b(focus|pomodoro|deep work|study|session|timer|hours)\b/.test(lowerQuery))
  ) {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const sessions = data.studySessions || [];
    const todayFocusMins = sessions
      .filter((s) => s.date === todayKey)
      .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    const recentStr = sessions
      .slice(0, 3)
      .map((s) => `${s.subject} (${s.duration}m on ${s.date})`)
      .join(', ');
    contextBlocks.push(`Focus Studio: ${todayFocusMins}m focused today. Recent sessions: ${recentStr || 'None'}`);
  }

  // 12. Daily Journal (if permitted & relevant, strictly excluding hideFromAi entries)
  if (
    perms.journal !== false &&
    (isGeneralQuery || /\b(journal|mood|energy|reflect|reflection|win|wins|gratitude|yesterday|day)\b/.test(lowerQuery))
  ) {
    const visibleEntries = (data.journalEntries || [])
      .filter((e) => !isJournalEntryExcludedFromAi(e))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
    if (visibleEntries.length > 0) {
      const lines = visibleEntries.map((e) => {
        const parts: string[] = [e.date];
        if (e.morningEnergy) parts.push(`energy ${e.morningEnergy}/5`);
        if (e.nightMood) parts.push(`mood ${e.nightMood}/5`);
        if (e.morningFocusTheme?.trim()) parts.push(`theme "${e.morningFocusTheme.trim().slice(0, 50)}"`);
        if (e.wins && e.wins.length > 0) parts.push(`${e.wins.length} wins`);
        return parts.join(', ');
      });
      contextBlocks.push(`Recent Journal Entries (${visibleEntries.length}): ${lines.join(' | ')}`);
    }
  }

  // 13. Inner Circle CRM (if permitted & relevant — phone numbers strictly omitted)
  if (
    perms.circle !== false &&
    (isGeneralQuery || /\b(circle|friend|family|birthday|gift|catch up|catchup|owe|owed|lent|balance)\b/.test(lowerQuery))
  ) {
    const contacts = data.circleContacts || [];
    if (contacts.length > 0) {
      const dueOrUpcoming = contacts
        .map((p) => {
          const bday = getDaysUntilBirthday(p.birthday);
          const cu = getCatchUpStatus(p);
          const fin = getPersonFinanceSummary(p, data.moneyLent || [], null);
          return { p, bday, cu, fin };
        })
        .filter((x) => (x.bday !== null && x.bday <= 14) || x.cu.isDue || x.fin.totalNetRupees !== 0)
        .slice(0, 5);
      if (dueOrUpcoming.length > 0) {
        const lines = dueOrUpcoming.map(({ p, bday, cu, fin }) => {
          const tags: string[] = [p.relation];
          if (bday !== null && bday <= 14) tags.push(bday === 0 ? 'bday today' : `bday in ${bday}d`);
          if (cu.isDue) tags.push('catch-up due');
          if (fin.moneyLentNetRupees !== 0) tags.push(`loan net Rs ${fin.moneyLentNetRupees}`);
          return `${p.name} (${tags.join(', ')})`;
        });
        contextBlocks.push(`Inner Circle Attention (${contacts.length} contacts): ${lines.join('; ')}`);
      }
    }
  }

  // 14. Trips & Smart Packing (if permitted & relevant — bookingRef/PNR strictly omitted)
  if (
    perms.trips !== false &&
    (isGeneralQuery || /\b(trip|travel|pack|packing|bag|luggage|hostel|home|flight|train|hackathon)\b/.test(lowerQuery))
  ) {
    const upcomingTrips = (data.trips || []).filter((t) => !t.isCompleted).slice(0, 3);
    if (upcomingTrips.length > 0) {
      const lines = upcomingTrips.map((t) => {
        const packed = t.packingItems.filter((i) => i.packed).length;
        return `"${t.title}"${t.destination ? ` -> ${t.destination}` : ''} on ${t.departureDate} (${packed}/${t.packingItems.length} packed)`;
      });
      contextBlocks.push(`Upcoming Trips (${upcomingTrips.length}): ${lines.join('; ')}`);
    }
  }

  // 15. Decision Workbench (if permitted & relevant)
  if (
    perms.decisions !== false &&
    (isGeneralQuery || /\b(decision|decide|choose|option|pros|cons|tradeoff|trade-off|matrix|review)\b/.test(lowerQuery))
  ) {
    const activeDecisions = (data.decisions || []).filter((d) => d.status !== 'revisited').slice(0, 4);
    if (activeDecisions.length > 0) {
      const lines = activeDecisions.map((d) => {
        const ranked = computeOptionScores(d);
        const top = ranked[0] ? `leader "${ranked[0].title}" (${ranked[0].percentage}%)` : 'no scores';
        return `"${d.question}" [${d.status}, ${top}]`;
      });
      contextBlocks.push(`Decisions (${activeDecisions.length}): ${lines.join('; ')}`);
    }
  }

  const rawSummary = contextBlocks.join('\n');
  const redactedSummary = redactSensitiveInformation(rawSummary);

  return `<user_data_context>\n${redactedSummary}\n</user_data_context>`;
}
