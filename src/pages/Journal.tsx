import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  format,
  addDays,
  subDays,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  parseISO,
} from 'date-fns';
import type { AppData, JournalEntry, Task } from '../types';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  Segmented,
  Button,
  Badge,
  Switch,
  TextField,
  SearchPill,
  EmptyState,
  Sheet,
  CaretLeft,
  CaretRight,
  CalendarBlank,
  CheckCircle,
  CircleIcon,
  SunHorizon,
  MoonStars,
  BookBookmark,
  SmileySad,
  SmileyMeh,
  Smiley,
  Heart,
  Lightning,
  ArrowCounterClockwise,
  Plus,
  LockKey,
  Brain,
  SpinnerGap,
} from '../ui';
import { triggerHaptic } from '../utils/haptics';
import {
  extractTasksFromBrainDump,
  synthesizeWeeklyJournal,
} from '../services/newInterfaceAiService';
import {
  getDailyOutputSummary,
  calculateJournalStreak,
  getRolloverCandidates,
  getTomorrowDateStr,
  resolveEntryForDate,
} from '../utils/journalHelpers';

interface JournalProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type JournalTab = 'morning' | 'night' | 'timeline';

const ENERGY_LEVELS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: 'Drained' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Steady' },
  { value: 4, label: 'Sharp' },
  { value: 5, label: 'Peak' },
];

const MOOD_LEVELS: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { value: 1, label: 'Rough' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Calm' },
  { value: 4, label: 'Good' },
  { value: 5, label: 'Great' },
];

function renderMoodIcon(val: 1 | 2 | 3 | 4 | 5) {
  if (val <= 1) return <SmileySad size={18} weight="duotone" />;
  if (val === 2) return <SmileyMeh size={18} weight="duotone" />;
  if (val === 3) return <Smiley size={18} weight="duotone" />;
  if (val === 4) return <Smiley size={18} weight="fill" />;
  return <Heart size={18} weight="fill" />;
}

function hasJournalContent(entry?: JournalEntry): boolean {
  if (!entry) return false;
  return Boolean(
    entry.morningEnergy ||
      entry.nightMood ||
      entry.morningFocusTheme?.trim() ||
      entry.morningNote?.trim() ||
      entry.gratitude?.trim() ||
      entry.improve?.trim() ||
      entry.brainDump?.trim() ||
      (entry.morningPriorityTaskIds && entry.morningPriorityTaskIds.length > 0) ||
      (entry.wins && entry.wins.some((w) => w.trim().length > 0))
  );
}

export default function Journal({ data, updateData }: JournalProps) {
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<JournalTab>(() =>
    new Date().getHours() >= 16 ? 'night' : 'morning'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [quickTaskText, setQuickTaskText] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [calendarSheetOpen, setCalendarSheetOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [aiJournalLoading, setAiJournalLoading] = useState(false);
  const [weeklyPulse, setWeeklyPulse] = useState<{ observations: string[]; tomorrowCue: string } | null>(null);
  const [aiJournalError, setAiJournalError] = useState<string | null>(null);

  const [draft, setDraft] = useState<JournalEntry>(() =>
    resolveEntryForDate(data.journalEntries, data.reviews, todayStr)
  );
  const [isDirty, setIsDirty] = useState(false);
  const draftRef = useRef(draft);
  const isDirtyRef = useRef(isDirty);
  draftRef.current = draft;
  isDirtyRef.current = isDirty;

  // Sync incoming stored changes ONLY when switching dates or when user doesn't have local unsaved edits
  useEffect(() => {
    if (!isDirtyRef.current) {
      setDraft(resolveEntryForDate(data.journalEntries, data.reviews, selectedDate));
    }
  }, [selectedDate, data.journalEntries, data.reviews]);

  const updateDraft = useCallback((updater: (prev: JournalEntry) => JournalEntry) => {
    setIsDirty(true);
    setDraft((prev) => updater(prev));
  }, []);

  const showToast = useCallback((msg: string) => {
    setFeedbackBanner(msg);
    window.setTimeout(() => setFeedbackBanner((cur) => (cur === msg ? null : cur)), 2400);
  }, []);

  // Index of all dates with saved reflections (entries + legacy reviews)
  const loggedDatesSet = useMemo(() => {
    const set = new Set<string>();
    (data.journalEntries || []).forEach((e) => {
      if (e.date && hasJournalContent(e)) set.add(e.date);
    });
    (data.reviews || []).forEach((r) => {
      if (r.date) set.add(r.date);
    });
    return set;
  }, [data.journalEntries, data.reviews]);

  const persistEntryObject = useCallback(
    async (entryToSave: JournalEntry) => {
      const nowIso = new Date().toISOString();
      const cleanedWins = (entryToSave.wins || []).map((w) => w.trim()).filter(Boolean);
      const updatedEntry: JournalEntry = {
        ...entryToSave,
        id: entryToSave.id || `journal_${entryToSave.date}`,
        wins: cleanedWins,
        updatedAt: nowIso,
      };
      const existingList = data.journalEntries || [];
      const idx = existingList.findIndex((e) => e.date === updatedEntry.date);
      const nextList =
        idx >= 0
          ? existingList.map((e, i) => (i === idx ? updatedEntry : e))
          : [updatedEntry, ...existingList];

      await updateData({ journalEntries: nextList });
      return updatedEntry;
    },
    [data.journalEntries, updateData]
  );

  // Switch dates without losing any edits typed on the previous date
  const switchToDate = useCallback(
    async (nextDate: string, targetTab?: JournalTab) => {
      if (nextDate === selectedDate && !targetTab) return;
      triggerHaptic('selection');

      if (isDirtyRef.current) {
        const snapshot = draftRef.current;
        if (hasJournalContent(snapshot)) {
          await persistEntryObject(snapshot);
        }
        setIsDirty(false);
        isDirtyRef.current = false;
      }

      setSelectedDate(nextDate);
      setDraft(resolveEntryForDate(data.journalEntries, data.reviews, nextDate));
      try {
        setCalendarMonth(parseISO(nextDate));
      } catch {}
      if (targetTab) setActiveTab(targetTab);
    },
    [selectedDate, persistEntryObject, data.journalEntries, data.reviews]
  );

  const selectedDateObj = useMemo(() => {
    try {
      return parseISO(selectedDate);
    } catch {
      return new Date();
    }
  }, [selectedDate]);

  // 7-day Monday..Sunday week containing selectedDate
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDateObj, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDateObj, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDateObj]);

  // Month grid for Calendar Jump Sheet
  const monthGridDays = useMemo(() => {
    const mStart = startOfMonth(calendarMonth);
    const mEnd = endOfMonth(mStart);
    const start = startOfWeek(mStart, { weekStartsOn: 1 });
    const end = endOfWeek(mEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [calendarMonth]);

  const streak = useMemo(
    () => calculateJournalStreak(data.journalEntries, data.reviews),
    [data.journalEntries, data.reviews]
  );

  const dailySummary = useMemo(
    () => getDailyOutputSummary(data, selectedDate),
    [data, selectedDate]
  );

  const pendingTasksForDate = useMemo(
    () => (data.tasks || []).filter((t) => !t.completed && t.date <= selectedDate),
    [data.tasks, selectedDate]
  );

  const rolloverCandidates = useMemo(
    () => getRolloverCandidates(data.tasks, selectedDate),
    [data.tasks, selectedDate]
  );

  const formattedDateLabel = useMemo(() => format(selectedDateObj, 'EEE, d MMM yyyy'), [selectedDateObj]);
  const formattedMonthLabel = useMemo(() => format(selectedDateObj, 'MMMM yyyy'), [selectedDateObj]);
  const accentText = 'var(--app-accent-text, #D29B7E)';

  const handleSaveEntry = async (customBanner?: string) => {
    triggerHaptic('success');
    const saved = await persistEntryObject(draftRef.current);
    setDraft({
      ...saved,
      wins: saved.wins && saved.wins.length > 0 ? saved.wins : ['', '', ''],
    });
    setIsDirty(false);
    isDirtyRef.current = false;
    showToast(customBanner || (activeTab === 'morning' ? 'Morning reset saved' : 'Night reflection saved'));
  };

  const togglePriorityTask = (taskId: string) => {
    triggerHaptic('selection');
    updateDraft((prev) => {
      const current = prev.morningPriorityTaskIds || [];
      if (current.includes(taskId)) {
        return { ...prev, morningPriorityTaskIds: current.filter((id) => id !== taskId) };
      }
      if (current.length >= 3) {
        return { ...prev, morningPriorityTaskIds: [...current.slice(1), taskId] };
      }
      return { ...prev, morningPriorityTaskIds: [...current, taskId] };
    });
  };

  const handleAddQuickPriorityTask = async () => {
    const trimmed = quickTaskText.trim();
    if (!trimmed) return;
    triggerHaptic('light');
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: trimmed,
      completed: false,
      date: selectedDate,
    };
    const nextTasks = [newTask, ...(data.tasks || [])];
    const nextPriorityIds = [...(draft.morningPriorityTaskIds || []).slice(-2), newTask.id];
    setQuickTaskText('');
    updateDraft((prev) => ({ ...prev, morningPriorityTaskIds: nextPriorityIds }));
    await updateData({ tasks: nextTasks });
    showToast('Added priority task');
  };

  const handleRolloverUnfinishedTasks = async () => {
    if (rolloverCandidates.length === 0) return;
    triggerHaptic('success');
    const tomorrowStr = getTomorrowDateStr(selectedDate);
    const candidateIds = new Set(rolloverCandidates.map((t) => t.id));
    const nextTasks = (data.tasks || []).map((t) =>
      candidateIds.has(t.id) ? { ...t, date: tomorrowStr } : t
    );

    const nowIso = new Date().toISOString();
    const updatedEntry: JournalEntry = {
      ...draftRef.current,
      id: draftRef.current.id || `journal_${selectedDate}`,
      date: selectedDate,
      rolledOverAt: nowIso,
      updatedAt: nowIso,
    };
    const existingList = data.journalEntries || [];
    const idx = existingList.findIndex((e) => e.date === selectedDate);
    const nextEntries =
      idx >= 0
        ? existingList.map((e, i) => (i === idx ? updatedEntry : e))
        : [updatedEntry, ...existingList];

    setDraft(updatedEntry);
    setIsDirty(false);
    isDirtyRef.current = false;
    await updateData({ tasks: nextTasks, journalEntries: nextEntries });
    showToast(`Moved ${rolloverCandidates.length} unfinished task(s) to ${tomorrowStr}`);
  };

  const timelineItems = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    (data.reviews || []).forEach((r) => {
      if (r.date) map.set(r.date, resolveEntryForDate([], [r], r.date));
    });
    (data.journalEntries || []).forEach((e) => {
      if (e.date && hasJournalContent(e)) map.set(e.date, e);
    });
    const list = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.date.includes(q) ||
        (item.morningFocusTheme || '').toLowerCase().includes(q) ||
        (item.morningNote || '').toLowerCase().includes(q) ||
        (item.gratitude || '').toLowerCase().includes(q) ||
        (item.improve || '').toLowerCase().includes(q) ||
        (item.brainDump || '').toLowerCase().includes(q) ||
        (item.wins || []).some((w) => w.toLowerCase().includes(q))
    );
  }, [data.journalEntries, data.reviews, searchQuery]);

  const shiftWeek = (weeks: number) => {
    const next = weeks > 0 ? addDays(selectedDateObj, weeks * 7) : subDays(selectedDateObj, Math.abs(weeks) * 7);
    void switchToDate(format(next, 'yyyy-MM-dd'));
  };

  const winsList = [0, 1, 2].map((i) => (draft.wins && draft.wins[i]) || '');

  return (
    <div className="w-full text-white">
      <LargeTitleHeader
        title="Daily Journal"
        subtitle={activeTab === 'timeline' ? `${timelineItems.length} logged reflections` : formattedDateLabel}
        actions={<Badge count={`${streak}d`} label="Streak" />}
      />

      <div className="flex flex-col gap-3.5 pb-2">
        {/* ── Mode Switcher ── */}
        <Segmented
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: 'morning', label: 'Morning', icon: <SunHorizon size={15} weight="duotone" /> },
            { value: 'night', label: 'Night', icon: <MoonStars size={15} weight="duotone" /> },
            { value: 'timeline', label: 'Timeline', icon: <BookBookmark size={15} weight="duotone" /> },
          ]}
        />

        {/* ── Fluid 7-Day Week Switcher (Only in Morning / Night views) ── */}
        {activeTab !== 'timeline' && (
          <section className="p-3.5 rounded-[24px] liquid-glass space-y-3 select-none">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setCalendarMonth(selectedDateObj);
                    setCalendarSheetOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-white hover:opacity-85 transition-opacity"
                >
                  <CalendarBlank size={16} weight="duotone" style={{ color: accentText }} />
                  <span>{formattedMonthLabel}</span>
                </button>
                {selectedDate !== todayStr && (
                  <button
                    type="button"
                    onClick={() => void switchToDate(todayStr)}
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] transition-colors"
                    style={{ color: accentText }}
                  >
                    Today
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {isDirty && (
                  <span className="text-[11px] font-medium text-[rgba(240,240,245,0.55)] mr-1">
                    Unsaved
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => shiftWeek(-1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.06] text-white hover:bg-white/[0.12] transition-colors"
                  aria-label="Previous week"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftWeek(1)}
                  className="w-7 h-7 rounded-full flex items-center justify-center bg-white/[0.06] text-white hover:bg-white/[0.12] transition-colors"
                  aria-label="Next week"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((dayDate) => {
                const dateKey = format(dayDate, 'yyyy-MM-dd');
                const isSelected = dateKey === selectedDate;
                const isTodayCell = dateKey === todayStr;
                const hasEntry = loggedDatesSet.has(dateKey);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => void switchToDate(dateKey)}
                    className={`py-2 rounded-[16px] flex flex-col items-center justify-center gap-1 transition-colors ${
                      isSelected
                        ? 'droplet-active'
                        : 'bg-white/[0.03] hover:bg-white/[0.07] text-[rgba(240,240,245,0.72)]'
                    }`}
                  >
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{
                        color: isSelected
                          ? accentText
                          : isTodayCell
                          ? '#FFFFFF'
                          : 'rgba(235, 235, 245, 0.5)',
                      }}
                    >
                      {format(dayDate, 'EEE').slice(0, 2)}
                    </span>
                    <span
                      className={`text-[15px] leading-none font-bold tabular-nums ${
                        isSelected ? 'text-white' : isTodayCell ? 'text-white' : 'text-[rgba(240,240,245,0.85)]'
                      }`}
                    >
                      {format(dayDate, 'd')}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: hasEntry
                          ? accentText
                          : isTodayCell
                          ? 'rgba(255, 255, 255, 0.35)'
                          : 'transparent',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Feedback Pill ── */}
        {feedbackBanner && (
          <div
            className="px-4 py-2.5 rounded-2xl glass-surface flex items-center gap-2 text-xs font-semibold"
            style={{ color: accentText }}
          >
            <CheckCircle size={16} weight="fill" />
            <span className="text-white">{feedbackBanner}</span>
          </div>
        )}

        {/* ═════════ MORNING RESET TAB ═════════ */}
        {activeTab === 'morning' && (
          <div className="space-y-3.5">
            {/* Energy Level */}
            <section className="p-4 rounded-[24px] glow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-section-header">Morning Energy</span>
                {draft.morningEnergy && (
                  <span className="text-badge" style={{ color: accentText }}>
                    {ENERGY_LEVELS.find((l) => l.value === draft.morningEnergy)?.label}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {ENERGY_LEVELS.map((lvl) => {
                  const selected = draft.morningEnergy === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        updateDraft((prev) => ({ ...prev, morningEnergy: lvl.value }));
                      }}
                      className={`py-2.5 px-1 rounded-[16px] flex flex-col items-center gap-1 transition-colors ${
                        selected ? 'droplet-active' : 'bg-white/[0.04] text-[rgba(240,240,245,0.68)] hover:text-white'
                      }`}
                      style={selected ? { color: accentText } : undefined}
                    >
                      <Lightning size={16} weight={selected ? 'fill' : 'duotone'} />
                      <span className="text-[11px] font-semibold">{lvl.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Focus Theme */}
            <section className="p-4 rounded-[24px] glow-card space-y-2.5">
              <TextField
                label="Main Focus Theme"
                placeholder="What single outcome makes this day a win?"
                value={draft.morningFocusTheme || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({ ...prev, morningFocusTheme: e.target.value }))
                }
                onClear={() => updateDraft((prev) => ({ ...prev, morningFocusTheme: '' }))}
              />
            </section>

            {/* Top 3 Task Picks */}
            <section className="p-4 rounded-[24px] glow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-section-header">Top 3 Priorities</span>
                <span className="text-sub tabular-nums">
                  {(draft.morningPriorityTaskIds || []).length}/3 selected
                </span>
              </div>

              <div className="flex gap-2">
                <TextField
                  placeholder="Add a quick priority task..."
                  value={quickTaskText}
                  onChange={(e) => setQuickTaskText(e.target.value)}
                  onClear={() => setQuickTaskText('')}
                />
                <Button
                  variant="glass"
                  icon={<Plus size={16} weight="bold" />}
                  onClick={handleAddQuickPriorityTask}
                >
                  Add
                </Button>
              </div>

              {pendingTasksForDate.length === 0 ? (
                <p className="text-sub py-1">No pending tasks scheduled for {selectedDate}.</p>
              ) : (
                <div className="space-y-1.5">
                  {pendingTasksForDate.slice(0, 8).map((task) => {
                    const isPicked = (draft.morningPriorityTaskIds || []).includes(task.id);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => togglePriorityTask(task.id)}
                        className={`w-full px-3.5 py-2.5 rounded-[16px] flex items-center gap-3 text-left transition-colors ${
                          isPicked ? 'droplet-active' : 'bg-white/[0.04] text-white hover:bg-white/[0.07]'
                        }`}
                      >
                        <span style={{ color: isPicked ? accentText : 'rgba(240,240,245,0.45)' }}>
                          {isPicked ? <CheckCircle size={18} weight="fill" /> : <CircleIcon size={18} weight="regular" />}
                        </span>
                        <span className="text-sm font-medium text-white truncate flex-1">{task.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Morning Intention Note */}
            <section className="p-4 rounded-[24px] glow-card space-y-2">
              <label className="text-section-header block">Morning Intention</label>
              <textarea
                value={draft.morningNote || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({ ...prev, morningNote: e.target.value }))
                }
                rows={3}
                placeholder="Clear your mind before the day starts..."
                className="w-full rounded-[16px] bg-[#222228] px-3.5 py-2.5 text-body text-white placeholder-[rgba(235,235,245,0.34)] focus:outline-none resize-none"
              />
            </section>

            <Button
              variant="prominent"
              size="lg"
              className="w-full"
              icon={<CheckCircle size={18} weight="fill" />}
              onClick={() => handleSaveEntry('Morning reset saved')}
            >
              Save Morning Reset
            </Button>
          </div>
        )}

        {/* ═════════ NIGHT WIND-DOWN TAB ═════════ */}
        {activeTab === 'night' && (
          <div className="space-y-3.5">
            {/* Today in Numbers Auto-Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-[20px] glow-card">
                <span className="text-sub">Tasks Done</span>
                <p className="text-lg font-bold text-white mt-0.5 tabular-nums">
                  {dailySummary.tasksDone}/{dailySummary.tasksTotal}
                </p>
              </div>
              <div className="p-3 rounded-[20px] glow-card">
                <span className="text-sub">Focus Time</span>
                <p className="text-lg font-bold text-white mt-0.5 tabular-nums">
                  {dailySummary.focusMinutes}m
                </p>
              </div>
              <div className="p-3 rounded-[20px] glow-card">
                <span className="text-sub">Workout</span>
                <p className="text-lg font-bold text-white mt-0.5 truncate">
                  {dailySummary.workoutDone ? dailySummary.workoutType || 'Done' : 'Rest'}
                </p>
              </div>
              <div className="p-3 rounded-[20px] glow-card">
                <span className="text-sub">Nutrition</span>
                <p className="text-lg font-bold text-white mt-0.5 tabular-nums">
                  {dailySummary.caloriesLogged > 0 ? `${dailySummary.caloriesLogged} kcal` : 'Not logged'}
                </p>
              </div>
            </div>

            {/* Mood Rating */}
            <section className="p-4 rounded-[24px] glow-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-section-header">How Did This Day Feel?</span>
                {draft.nightMood && (
                  <span className="text-badge" style={{ color: accentText }}>
                    {MOOD_LEVELS.find((m) => m.value === draft.nightMood)?.label}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {MOOD_LEVELS.map((lvl) => {
                  const selected = draft.nightMood === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        updateDraft((prev) => ({ ...prev, nightMood: lvl.value }));
                      }}
                      className={`py-2.5 px-1 rounded-[16px] flex flex-col items-center gap-1 transition-colors ${
                        selected ? 'droplet-active' : 'bg-white/[0.04] text-[rgba(240,240,245,0.68)] hover:text-white'
                      }`}
                      style={selected ? { color: accentText } : undefined}
                    >
                      {renderMoodIcon(lvl.value)}
                      <span className="text-[11px] font-semibold">{lvl.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 3 Wins */}
            <section className="p-4 rounded-[24px] glow-card space-y-2.5">
              <span className="text-section-header block">Day's Wins</span>
              {winsList.map((winText, idx) => (
                <TextField
                  key={`win_${idx}`}
                  placeholder={`Win #${idx + 1}...`}
                  value={winText}
                  onChange={(e) => {
                    const next = [...winsList];
                    next[idx] = e.target.value;
                    updateDraft((prev) => ({ ...prev, wins: next }));
                  }}
                />
              ))}
            </section>

            {/* Gratitude, Improve & Brain Dump */}
            <section className="p-4 rounded-[24px] glow-card space-y-3">
              <TextField
                label="Highlight / Gratitude"
                placeholder="One person or moment you appreciated"
                value={draft.gratitude || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({ ...prev, gratitude: e.target.value }))
                }
                onClear={() => updateDraft((prev) => ({ ...prev, gratitude: '' }))}
              />
              <TextField
                label="Next-Day Small Adjustment"
                placeholder="One thing to improve or protect tomorrow"
                value={draft.improve || ''}
                onChange={(e) =>
                  updateDraft((prev) => ({ ...prev, improve: e.target.value }))
                }
                onClear={() => updateDraft((prev) => ({ ...prev, improve: '' }))}
              />
              <div className="space-y-1.5">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-label">Night Brain-Dump</label>
                  {(draft.brainDump || '').trim().length > 12 && (
                    <button
                      type="button"
                      disabled={aiJournalLoading}
                      onClick={async () => {
                        triggerHaptic('selection');
                        setAiJournalLoading(true);
                        setAiJournalError(null);
                        try {
                          const extracted = await extractTasksFromBrainDump(draft.brainDump || '');
                          if (extracted.length > 0) {
                            const tomorrowStr = getTomorrowDateStr(selectedDate);
                            const newTasks: Task[] = extracted.map((text, idx) => ({
                              id: `task_${Date.now()}_${idx}`,
                              text,
                              completed: false,
                              date: tomorrowStr,
                            }));
                            await updateData({ tasks: [...newTasks, ...(data.tasks || [])] });
                            showToast(`Added ${newTasks.length} extracted task(s) for ${tomorrowStr}`);
                          }
                        } catch (err: any) {
                          setAiJournalError(err?.message || 'Could not extract tasks.');
                        } finally {
                          setAiJournalLoading(false);
                        }
                      }}
                      className="text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
                      style={{ color: accentText }}
                    >
                      {aiJournalLoading ? <SpinnerGap size={12} className="animate-spin" /> : <Brain size={12} weight="duotone" />}
                      <span>Extract Tomorrow Tasks</span>
                    </button>
                  )}
                </div>
                {aiJournalError && <p className="text-xs text-[#FF453A] pl-1">{aiJournalError}</p>}
                <textarea
                  value={draft.brainDump || ''}
                  onChange={(e) =>
                    updateDraft((prev) => ({ ...prev, brainDump: e.target.value }))
                  }
                  rows={3}
                  placeholder="Unload lingering thoughts before sleeping..."
                  className="w-full rounded-[16px] bg-[#222228] px-3.5 py-2.5 text-body text-white placeholder-[rgba(235,235,245,0.34)] focus:outline-none resize-none"
                />
              </div>
            </section>

            {/* Unfinished Task Rollover */}
            {rolloverCandidates.length > 0 && (
              <section className="p-4 rounded-[24px] liquid-glass flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">
                    {rolloverCandidates.length} unfinished task{rolloverCandidates.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sub">Shift open tasks cleanly to the next day so tonight stays calm.</p>
                </div>
                <Button
                  variant="glass"
                  size="sm"
                  icon={<ArrowCounterClockwise size={15} weight="bold" />}
                  onClick={handleRolloverUnfinishedTasks}
                >
                  Roll Over
                </Button>
              </section>
            )}

            {/* Luna AI Privacy Toggle */}
            <div className="p-4 rounded-[22px] glow-card flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <LockKey size={18} weight="duotone" style={{ color: accentText }} />
                <div>
                  <p className="text-sm font-semibold text-white">Hide entry from Luna AI</p>
                  <p className="text-sub">Keep this reflection strictly private on-device & cloud</p>
                </div>
              </div>
              <Switch
                checked={Boolean(draft.hideFromAi)}
                onChange={(checked) => updateDraft((prev) => ({ ...prev, hideFromAi: checked }))}
              />
            </div>

            <Button
              variant="prominent"
              size="lg"
              className="w-full"
              icon={<CheckCircle size={18} weight="fill" />}
              onClick={() => handleSaveEntry('Night reflection saved')}
            >
              Save Night Reflection
            </Button>
          </div>
        )}

        {/* ═════════ TIMELINE TAB ═════════ */}
        {activeTab === 'timeline' && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchPill
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search wins, focus themes, notes..."
                />
              </div>
              {timelineItems.length > 0 && (
                <Button
                  variant="glass"
                  size="sm"
                  disabled={aiJournalLoading}
                  icon={aiJournalLoading ? <SpinnerGap size={14} className="animate-spin" /> : <Brain size={14} weight="duotone" />}
                  onClick={async () => {
                    triggerHaptic('selection');
                    setAiJournalLoading(true);
                    setAiJournalError(null);
                    try {
                      const pulse = await synthesizeWeeklyJournal(data.journalEntries || []);
                      setWeeklyPulse(pulse);
                    } catch (err: any) {
                      setAiJournalError(err?.message || 'Could not summarize reflections.');
                    } finally {
                      setAiJournalLoading(false);
                    }
                  }}
                >
                  Pulse
                </Button>
              )}
            </div>

            {aiJournalError && <p className="text-xs text-[#FF453A] px-1">{aiJournalError}</p>}

            {weeklyPulse && (
              <section className="p-4 rounded-[22px] liquid-glass space-y-2">
                <span className="text-section-header block">Luna Weekly Reflection Pulse</span>
                {weeklyPulse.observations.map((obs, idx) => (
                  <p key={`obs_${idx}`} className="text-xs text-white leading-relaxed">
                    • {obs}
                  </p>
                ))}
                {weeklyPulse.tomorrowCue && (
                  <p className="text-xs font-semibold pt-1" style={{ color: accentText }}>
                    Adjustment: {weeklyPulse.tomorrowCue}
                  </p>
                )}
              </section>
            )}

            {timelineItems.length === 0 ? (
              <EmptyState
                icon={<BookBookmark size={32} weight="duotone" />}
                title="No journal entries yet"
                description="Complete a Morning Reset or Night Wind-Down to start your timeline."
              />
            ) : (
              <GroupedList header={`PAST REFLECTIONS (${timelineItems.length})`}>
                {timelineItems.map((item, idx) => {
                  const moodLabel = item.nightMood
                    ? MOOD_LEVELS.find((m) => m.value === item.nightMood)?.label
                    : undefined;
                  const summaryLine =
                    item.morningFocusTheme ||
                    (item.wins && item.wins[0]) ||
                    item.gratitude ||
                    item.improve ||
                    item.brainDump ||
                    'Tap to open entry';

                  return (
                    <ListRow
                      key={item.id || item.date}
                      icon={<BookBookmark size={18} weight="duotone" />}
                      title={item.date}
                      subtitle={summaryLine}
                      trailing={
                        moodLabel ? (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/[0.06]"
                            style={{ color: accentText }}
                          >
                            {moodLabel}
                          </span>
                        ) : undefined
                      }
                      showChevron
                      onClick={() => {
                        const targetMode: JournalTab =
                          item.nightMood || item.wins?.length ? 'night' : 'morning';
                        void switchToDate(item.date, targetMode);
                      }}
                      showSeparator={idx < timelineItems.length - 1}
                    />
                  );
                })}
              </GroupedList>
            )}
          </div>
        )}
      </div>

      {/* ── Month Calendar Jump Sheet ── */}
      <Sheet
        isOpen={calendarSheetOpen}
        onClose={() => setCalendarSheetOpen(false)}
        detent="half"
        title="Jump to Date"
      >
        <div className="space-y-3.5 pb-4 select-none">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] text-white hover:bg-white/[0.12]"
              aria-label="Previous month"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <span className="text-base font-bold text-white">{format(calendarMonth, 'MMMM yyyy')}</span>
            <button
              type="button"
              onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.06] text-white hover:bg-white/[0.12]"
              aria-label="Next month"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((lbl) => (
              <span key={lbl} className="text-[11px] font-semibold text-[rgba(235,235,245,0.45)] py-1">
                {lbl}
              </span>
            ))}
            {monthGridDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const inMonth = isSameMonth(day, calendarMonth);
              const isSelected = dateKey === selectedDate;
              const isTodayCell = dateKey === todayStr;
              const hasEntry = loggedDatesSet.has(dateKey);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => {
                    setCalendarSheetOpen(false);
                    void switchToDate(dateKey);
                  }}
                  className={`h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isSelected
                      ? 'droplet-active'
                      : inMonth
                      ? 'hover:bg-white/[0.08] text-white'
                      : 'text-[rgba(235,235,245,0.22)]'
                  }`}
                >
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={
                      isSelected
                        ? { color: accentText }
                        : isTodayCell
                        ? { color: '#FFFFFF' }
                        : undefined
                    }
                  >
                    {format(day, 'd')}
                  </span>
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: hasEntry ? accentText : 'transparent' }}
                  />
                </button>
              );
            })}
          </div>

          <Button
            variant="glass"
            className="w-full"
            onClick={() => {
              setCalendarSheetOpen(false);
              void switchToDate(todayStr);
            }}
          >
            Jump to Today
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
