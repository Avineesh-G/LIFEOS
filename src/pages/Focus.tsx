import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import type { AppData, StudySession, FocusMode } from '../types';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  Segmented,
  Button,
  Badge,
  Stepper,
  Sheet,
  TextField,
  EmptyState,
  Play,
  Pause,
  Stop,
  Plus,
  Target,
  CheckCircle,
  Clock,
  Flame,
  HourglassMedium,
  NotePencil,
  RocketLaunch,
  Brain,
  SpinnerGap,
} from '../ui';
import { triggerHaptic } from '../utils/haptics';
import { recommendFocusBlock } from '../services/newInterfaceAiService';
import {
  showStudyTimerNotification,
  cancelStudyTimerNotification,
  scheduleFocusCompleteNotification,
  cancelFocusCompleteNotification,
} from '../utils/notifications';
import { useFocusTimer, FOCUS_PRESETS } from '../hooks/useFocusTimer';
import { FocusCompleteSheet } from '../components/focus/FocusCompleteSheet';

interface FocusProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function Focus({ data, updateData }: FocusProps) {
  const [targetSheetOpen, setTargetSheetOpen] = useState(false);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState('');
  const [quickNoteInput, setQuickNoteInput] = useState('');
  const [markDistraction, setMarkDistraction] = useState(false);
  const [aiPicking, setAiPicking] = useState(false);
  const [aiPickReason, setAiPickReason] = useState<string | null>(null);

  const handleTimerZero = useCallback((phase: 'focus' | 'break', label: string, mins: number) => {
    triggerHaptic('success');
    cancelStudyTimerNotification().catch(() => {});
    cancelFocusCompleteNotification().catch(() => {});
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([120, 80, 120]);
      } catch {}
    }
    if (phase === 'focus' && typeof document !== 'undefined' && document.visibilityState === 'visible') {
      // Visual completion sheet auto-appears via state.status === 'completed'
      void label;
      void mins;
    }
  }, []);

  const timer = useFocusTimer({ onTimerReachedZero: handleTimerZero });
  const { state, remainingMs, progressRatio } = timer;

  // Sync ongoing native notification when status or target changes
  useEffect(() => {
    if (state.status === 'running' && state.targetEndMs) {
      const secsLeft = Math.max(1, Math.round((state.targetEndMs - Date.now()) / 1000));
      showStudyTimerNotification(
        state.phase === 'break' ? 'Recovery Break' : state.targetLabel,
        secsLeft,
        state.phase === 'break' ? 'Rest & recharge' : 'Focus Studio',
        false
      ).catch(() => {});
      scheduleFocusCompleteNotification(
        state.phase === 'break' ? 'Break Complete' : `Focus Complete: ${state.targetLabel}`,
        state.targetEndMs
      ).catch(() => {});
    } else if (state.status === 'paused') {
      showStudyTimerNotification(
        state.targetLabel,
        Math.max(1, Math.round(state.pausedRemainingMs / 1000)),
        'Paused',
        true
      ).catch(() => {});
      cancelFocusCompleteNotification().catch(() => {});
    } else {
      cancelStudyTimerNotification().catch(() => {});
      cancelFocusCompleteNotification().catch(() => {});
    }
  }, [state.status, state.targetEndMs, state.phase, state.targetLabel, state.pausedRemainingMs]);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayDayShort = useMemo(() => format(new Date(), 'EEE'), []);

  const pendingTasks = useMemo(
    () => (data.tasks || []).filter((t) => !t.completed).slice(0, 15),
    [data.tasks]
  );

  const todaySubjects = useMemo(() => {
    const set = new Set<string>();
    (data.timetable || []).forEach((b) => {
      if (b.subject && (b.day?.toLowerCase().startsWith(todayDayShort.toLowerCase()) || !b.day)) {
        set.add(b.subject);
      }
    });
    if (set.size === 0) {
      (data.timetable || []).forEach((b) => {
        if (b.subject) set.add(b.subject);
      });
    }
    return Array.from(set).slice(0, 10);
  }, [data.timetable, todayDayShort]);

  const stats = useMemo(() => {
    const sessions = data.studySessions || [];
    const todayMinutes = sessions
      .filter((s) => s.date === todayStr)
      .reduce((acc, s) => acc + (Number(s.duration) || 0), 0);

    const activeDates = new Set(sessions.filter((s) => (Number(s.duration) || 0) > 0).map((s) => s.date));
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
      if (activeDates.has(checkDate)) {
        streak += 1;
      } else if (i > 0) {
        break;
      }
    }

    const recentSessions = [...sessions]
      .sort((a, b) => (b.completedAt || b.date).localeCompare(a.completedAt || a.date))
      .slice(0, 10);

    return {
      todayMinutes,
      todayCount: sessions.filter((s) => s.date === todayStr).length,
      streak,
      recentSessions,
    };
  }, [data.studySessions, todayStr]);

  const currentPreset = useMemo(
    () => FOCUS_PRESETS.find((p) => p.mode === state.mode) || FOCUS_PRESETS[0],
    [state.mode]
  );

  const handleSaveCompletedSession = async ({
    notes,
    markTaskComplete,
    startBreakAfter,
  }: {
    notes: string;
    markTaskComplete: boolean;
    startBreakAfter: boolean;
  }) => {
    const now = new Date();
    const duration = Math.max(1, state.lastCompletedMinutes || currentPreset.focusMinutes);
    const newSession: StudySession = {
      id: `focus_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      subject: state.targetLabel || 'Open Deep Work',
      topic: currentPreset.label,
      date: format(now, 'yyyy-MM-dd'),
      startTime: state.startedAtIso || format(now, 'HH:mm'),
      duration,
      notes: notes.trim() || undefined,
      mode: state.mode as FocusMode,
      linkedTaskId: state.linkedTaskId,
      linkedProjectId: state.linkedProjectId,
      distractionsLogged: state.distractionsLogged || undefined,
      completedAt: now.toISOString(),
    };

    const nextTasks =
      markTaskComplete && state.linkedTaskId
        ? (data.tasks || []).map((t) => (t.id === state.linkedTaskId ? { ...t, completed: true } : t))
        : data.tasks;

    await updateData({
      studySessions: [newSession, ...(data.studySessions || [])],
      ...(nextTasks !== data.tasks ? { tasks: nextTasks } : {}),
    });

    if (startBreakAfter) {
      timer.startBreak(currentPreset.breakMinutes);
    } else {
      timer.resetToFocusIdle(true);
    }
  };

  // Ring geometry
  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);
  const accentText = 'var(--app-accent-text, #D29B7E)';

  return (
    <div className="pb-28 px-4 max-w-2xl mx-auto">
      <LargeTitleHeader
        title="Focus Studio"
        subtitle="Timed deep work synced to Tasks & History"
        actions={
          <Badge
            count={`${stats.todayMinutes}m`}
            label="Today"
          />
        }
      />

      {/* ── Hero Liquid Glass Timer Stage ── */}
      <section className="mt-2 p-5 rounded-[28px] liquid-glass space-y-5">
        <Segmented
          value={state.mode}
          onChange={(m) => {
            if (state.status === 'idle') timer.selectMode(m);
          }}
          options={FOCUS_PRESETS.map((p) => ({
            value: p.mode,
            label: p.shortLabel,
          }))}
        />

        {/* Circular Progress Ring & Tabular Countdown */}
        <div className="relative flex flex-col items-center justify-center py-2">
          <div className="relative w-[240px] h-[240px] flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="10"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke={accentText}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <span
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: accentText }}
              >
                {state.phase === 'break' ? 'Recovery Break' : state.status === 'paused' ? 'Paused' : 'Deep Focus'}
              </span>
              <div className="text-value-hero text-white mt-1 tabular-nums">
                {formatCountdown(remainingMs)}
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setTargetSheetOpen(true);
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] max-w-[180px] transition-colors"
              >
                <Target size={13} weight="duotone" style={{ color: accentText }} className="shrink-0" />
                <span className="text-xs font-medium text-white truncate">{state.targetLabel}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Duration Stepper when Custom mode & idle */}
        {state.mode === 'custom' && state.status === 'idle' && (
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-label">Custom Block Length</span>
            <Stepper
              value={state.customMinutes}
              min={5}
              max={180}
              step={5}
              unit="min"
              size="md"
              onChange={(val) => timer.setCustomDuration(val)}
            />
          </div>
        )}

        {/* Primary Timer Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {state.status === 'idle' && (
            <>
              <Button
                variant="prominent"
                size="lg"
                className="min-w-[176px]"
                icon={<Play size={18} weight="fill" />}
                onClick={() => {
                  triggerHaptic('medium');
                  timer.start();
                }}
              >
                Start Focus
              </Button>
              <Button
                variant="glass"
                size="lg"
                icon={<Target size={18} weight="duotone" />}
                onClick={() => setTargetSheetOpen(true)}
              >
                Link
              </Button>
              <Button
                variant="glass"
                size="lg"
                disabled={aiPicking}
                icon={aiPicking ? <SpinnerGap size={17} className="animate-spin" /> : <Brain size={17} weight="duotone" />}
                onClick={async () => {
                  triggerHaptic('selection');
                  setAiPicking(true);
                  try {
                    const rec = await recommendFocusBlock(
                      data.tasks || [],
                      data.projects || [],
                      data.studySessions || []
                    );
                    timer.selectMode(rec.minutes === 50 ? 'deep' : 'pomodoro');
                    timer.setTarget(rec.label, rec.linkedTaskId, rec.linkedProjectId);
                    setAiPickReason(rec.reason);
                  } catch (err: any) {
                    setAiPickReason(err?.message || 'Configure Groq/Gemini key in Settings to enable smart picks.');
                  } finally {
                    setAiPicking(false);
                  }
                }}
              >
                Pick
              </Button>
            </>
          )}

          {state.status === 'running' && (
            <>
              <Button
                variant="prominent"
                size="md"
                icon={<Pause size={18} weight="fill" />}
                onClick={() => {
                  triggerHaptic('light');
                  timer.pause();
                }}
              >
                Pause
              </Button>
              <Button
                variant="glass"
                size="md"
                icon={<Plus size={16} weight="bold" />}
                onClick={() => {
                  triggerHaptic('light');
                  timer.extend(5);
                }}
              >
                +5m
              </Button>
              <Button
                variant="glass"
                size="md"
                icon={<NotePencil size={16} weight="duotone" />}
                onClick={() => setNoteSheetOpen(true)}
              >
                Note
              </Button>
              <Button
                variant="glass"
                size="md"
                icon={<Stop size={16} weight="fill" />}
                onClick={() => {
                  triggerHaptic('medium');
                  if (state.phase === 'break') {
                    timer.resetToFocusIdle(false);
                  } else {
                    timer.finishEarly();
                  }
                }}
              >
                {state.phase === 'break' ? 'Skip Break' : 'Finish'}
              </Button>
            </>
          )}

          {state.status === 'paused' && (
            <>
              <Button
                variant="prominent"
                size="md"
                icon={<Play size={18} weight="fill" />}
                onClick={() => {
                  triggerHaptic('medium');
                  timer.start();
                }}
              >
                Resume
              </Button>
              <Button
                variant="glass"
                size="md"
                icon={<CheckCircle size={16} weight="duotone" />}
                onClick={() => {
                  triggerHaptic('success');
                  if (state.phase === 'break') {
                    timer.resetToFocusIdle(false);
                  } else {
                    timer.finishEarly();
                  }
                }}
              >
                {state.phase === 'break' ? 'End Break' : 'Save Early'}
              </Button>
              <Button
                variant="glass"
                size="md"
                onClick={() => {
                  triggerHaptic('light');
                  timer.resetToFocusIdle(false);
                }}
              >
                Reset
              </Button>
            </>
          )}
        </div>

        {state.status === 'idle' && aiPickReason && (
          <p className="text-xs text-center text-[rgba(240,240,245,0.72)] px-3">{aiPickReason}</p>
        )}
      </section>

      {/* ── Daily Output Metrics ── */}
      <div className="grid grid-cols-3 gap-2.5 mt-4">
        <div className="p-3.5 rounded-[22px] glow-card">
          <span className="text-sub flex items-center gap-1">
            <Clock size={13} weight="duotone" style={{ color: accentText }} />
            Focused Today
          </span>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">{stats.todayMinutes}m</p>
        </div>
        <div className="p-3.5 rounded-[22px] glow-card">
          <span className="text-sub flex items-center gap-1">
            <Flame size={13} weight="duotone" style={{ color: accentText }} />
            Focus Streak
          </span>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">{stats.streak}d</p>
        </div>
        <div className="p-3.5 rounded-[22px] glow-card">
          <span className="text-sub flex items-center gap-1">
            <HourglassMedium size={13} weight="duotone" style={{ color: accentText }} />
            Sessions
          </span>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">{stats.todayCount}</p>
        </div>
      </div>

      {/* ── Quick Focus Targets from Tasks & Timetable ── */}
      {(pendingTasks.length > 0 || todaySubjects.length > 0) && state.status === 'idle' && (
        <div className="mt-5 space-y-2">
          <span className="text-section-header px-2 block">Quick Anchor from Today</span>
          <div className="flex flex-wrap gap-2 px-1">
            {todaySubjects.map((subj) => {
              const active = state.targetLabel === subj && !state.linkedTaskId;
              return (
                <button
                  key={`subj_${subj}`}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    timer.setTarget(subj, undefined);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    active ? 'droplet-active' : 'glass-flat text-[rgba(240,240,245,0.75)] hover:text-white'
                  }`}
                  style={active ? { color: accentText } : undefined}
                >
                  {subj}
                </button>
              );
            })}
            {pendingTasks.slice(0, 5).map((task) => {
              const active = state.linkedTaskId === task.id;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    timer.setTarget(task.text, task.id);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold max-w-[200px] truncate transition-colors ${
                    active ? 'droplet-active' : 'glass-flat text-[rgba(240,240,245,0.75)] hover:text-white'
                  }`}
                  style={active ? { color: accentText } : undefined}
                >
                  {task.text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent Focus Log ── */}
      <div className="mt-6">
        {stats.recentSessions.length === 0 ? (
          <EmptyState
            icon={<HourglassMedium size={32} weight="duotone" />}
            title="No focus sessions logged yet"
            description="Pick a preset above or link a task to record your first deep work block."
          />
        ) : (
          <GroupedList header="RECENT FOCUS SESSIONS">
            {stats.recentSessions.map((session, idx) => (
              <ListRow
                key={session.id}
                icon={<HourglassMedium size={18} weight="duotone" />}
                title={session.subject || 'Deep Work'}
                subtitle={`${session.date}${session.startTime ? ` • ${session.startTime}` : ''}${
                  session.notes ? ` — ${session.notes}` : ''
                }`}
                trailing={
                  <span
                    className="text-sm font-bold tabular-nums px-2.5 py-1 rounded-full bg-white/[0.06]"
                    style={{ color: accentText }}
                  >
                    {session.duration}m
                  </span>
                }
                showSeparator={idx < stats.recentSessions.length - 1}
              />
            ))}
          </GroupedList>
        )}
      </div>

      {/* ── Target Picker Sheet ── */}
      <Sheet
        isOpen={targetSheetOpen}
        onClose={() => setTargetSheetOpen(false)}
        detent="half"
        title="Link Task or Subject"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <TextField
              placeholder="Custom focus topic..."
              value={customTargetInput}
              onChange={(e) => setCustomTargetInput(e.target.value)}
              onClear={() => setCustomTargetInput('')}
            />
            <Button
              variant="prominent"
              onClick={() => {
                if (customTargetInput.trim()) {
                  timer.setTarget(customTargetInput.trim(), undefined);
                  setCustomTargetInput('');
                  setTargetSheetOpen(false);
                }
              }}
            >
              Set
            </Button>
          </div>

          {pendingTasks.length > 0 && (
            <GroupedList header="PENDING TO-DO TASKS">
              {pendingTasks.map((task, idx) => (
                <ListRow
                  key={task.id}
                  icon={<CheckCircle size={18} weight="duotone" />}
                  title={task.text}
                  subtitle={task.subtask || task.date}
                  onClick={() => {
                    timer.setTarget(task.text, task.id, undefined);
                    setTargetSheetOpen(false);
                  }}
                  showSeparator={idx < pendingTasks.length - 1}
                />
              ))}
            </GroupedList>
          )}

          {(data.projects || []).filter((p) => p.status === 'active').length > 0 && (
            <GroupedList header="ACTIVE PROJECTS">
              {(data.projects || [])
                .filter((p) => p.status === 'active')
                .slice(0, 10)
                .map((proj, idx, arr) => {
                  const nextMs = proj.milestones.find((m) => !m.completed);
                  const label = nextMs ? `${proj.title} — ${nextMs.title}` : proj.title;
                  return (
                    <ListRow
                      key={proj.id}
                      icon={<RocketLaunch size={18} weight="duotone" />}
                      title={proj.title}
                      subtitle={nextMs ? `Next: ${nextMs.title}` : `${proj.milestones.length} milestones`}
                      onClick={() => {
                        timer.setTarget(label, undefined, proj.id);
                        setTargetSheetOpen(false);
                      }}
                      showSeparator={idx < arr.length - 1}
                    />
                  );
                })}
            </GroupedList>
          )}

          {todaySubjects.length > 0 && (
            <GroupedList header="TIMETABLE SUBJECTS">
              {todaySubjects.map((subj, idx) => (
                <ListRow
                  key={subj}
                  icon={<Clock size={18} weight="duotone" />}
                  title={subj}
                  onClick={() => {
                    timer.setTarget(subj, undefined);
                    setTargetSheetOpen(false);
                  }}
                  showSeparator={idx < todaySubjects.length - 1}
                />
              ))}
            </GroupedList>
          )}
        </div>
      </Sheet>

      {/* ── Distraction / Thought Capture Sheet ── */}
      <Sheet
        isOpen={noteSheetOpen}
        onClose={() => setNoteSheetOpen(false)}
        detent="half"
        title="Capture Thought Without Breaking Flow"
      >
        <div className="space-y-4 py-1">
          <TextField
            label="Quick note or parked idea"
            placeholder="e.g., Check assignment submission format after block"
            value={quickNoteInput}
            onChange={(e) => setQuickNoteInput(e.target.value)}
            onClear={() => setQuickNoteInput('')}
          />
          <div className="flex items-center justify-between p-3 rounded-2xl glow-card">
            <span className="text-sm text-white font-medium">Log as distraction interruption</span>
            <button
              type="button"
              onClick={() => setMarkDistraction((v) => !v)}
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: markDistraction
                  ? 'color-mix(in srgb, var(--app-accent-text, #D29B7E) 22%, #1C1C22)'
                  : 'rgba(255,255,255,0.06)',
                color: markDistraction ? accentText : 'rgba(240,240,245,0.7)',
              }}
            >
              {markDistraction ? 'Counted' : 'Note Only'}
            </button>
          </div>
          <Button
            variant="prominent"
            className="w-full"
            onClick={() => {
              if (quickNoteInput.trim()) {
                timer.addQuickNote(quickNoteInput, markDistraction);
                setQuickNoteInput('');
                setMarkDistraction(false);
                setNoteSheetOpen(false);
              }
            }}
          >
            Save Note & Stay Focused
          </Button>
        </div>
      </Sheet>

      {/* ── Session Completion Sheet ── */}
      <FocusCompleteSheet
        isOpen={state.status === 'completed'}
        onClose={() => timer.resetToFocusIdle(false)}
        phase={state.phase}
        targetLabel={state.targetLabel}
        durationMinutes={state.lastCompletedMinutes || currentPreset.focusMinutes}
        hasLinkedTask={Boolean(state.linkedTaskId)}
        initialNotes={state.quickNotes}
        breakMinutes={currentPreset.breakMinutes}
        onSaveFocus={handleSaveCompletedSession}
        onDiscard={() => timer.resetToFocusIdle(false)}
      />
    </div>
  );
}
