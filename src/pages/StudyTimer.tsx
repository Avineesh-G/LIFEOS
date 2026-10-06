import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Play,
  Pause,
  ArrowClockwise,
  CaretLeft,
  Check,
  BookOpen,
  NotePencil,
  Clock,
} from '../ui/tokens/icons';
import { Toolbar } from '../ui/navigation/Toolbar';
import { Button } from '../ui/controls/Button';
import { TextField } from '../ui/controls/TextField';
import { GroupedList } from '../ui/grouped/GroupedList';
import { ListRow } from '../ui/grouped/ListRow';
import { GlassSurface } from '../ui/glass/GlassSurface';
import { format } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import { handleAppBack } from '../utils/backNavigation';
import type { AppData, StudySession } from '../types';

interface StudyTimerProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type TimerState = 'idle' | 'running' | 'paused';
const STORAGE_KEY = 'lifeos_active_study_timer_v2';

interface PersistedTimer {
  timerState: TimerState;
  subject: string;
  topic: string;
  accumulatedSeconds: number;
  lastStartTimestamp: number | null;
  startTimeStr: string;
}

export default function StudyTimer({ data, updateData }: StudyTimerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillSubject = searchParams.get('subject') || '';

  const [persisted] = useState<PersistedTimer | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const availableSubjects = Array.from(
    new Set((data.timetable || []).map((item) => item.subject).filter(Boolean))
  );

  const [timerState, setTimerState] = useState<TimerState>(persisted?.timerState || 'idle');
  const [subject, setSubject] = useState<string>(persisted?.subject || prefillSubject || (availableSubjects[0] || 'Deep Work'));
  const [topic, setTopic] = useState<string>(persisted?.topic || '');
  const [accumulatedSeconds, setAccumulatedSeconds] = useState<number>(persisted?.accumulatedSeconds || 0);
  const [lastStartTimestamp, setLastStartTimestamp] = useState<number | null>(persisted?.lastStartTimestamp || null);
  const [startTimeStr, setStartTimeStr] = useState<string>(persisted?.startTimeStr || format(new Date(), 'HH:mm'));
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sync elapsed seconds
  useEffect(() => {
    if (timerState === 'running' && lastStartTimestamp) {
      const interval = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - lastStartTimestamp) / 1000);
        setElapsedSeconds(accumulatedSeconds + Math.max(0, currentElapsed));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setElapsedSeconds(accumulatedSeconds);
    }
  }, [timerState, lastStartTimestamp, accumulatedSeconds]);

  // Save active timer state
  useEffect(() => {
    if (timerState === 'idle' && accumulatedSeconds === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const snapshot: PersistedTimer = {
      timerState,
      subject,
      topic,
      accumulatedSeconds,
      lastStartTimestamp,
      startTimeStr,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {}
  }, [timerState, subject, topic, accumulatedSeconds, lastStartTimestamp, startTimeStr]);

  const handleStart = () => {
    triggerHaptic('medium');
    setLastStartTimestamp(Date.now());
    if (timerState === 'idle') {
      setStartTimeStr(format(new Date(), 'HH:mm'));
    }
    setTimerState('running');
  };

  const handlePause = () => {
    triggerHaptic('light');
    if (lastStartTimestamp) {
      const currentRun = Math.floor((Date.now() - lastStartTimestamp) / 1000);
      setAccumulatedSeconds((prev) => prev + Math.max(0, currentRun));
    }
    setLastStartTimestamp(null);
    setTimerState('paused');
  };

  const handleReset = () => {
    triggerHaptic('error');
    setTimerState('idle');
    setAccumulatedSeconds(0);
    setLastStartTimestamp(null);
    setElapsedSeconds(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleFinish = async () => {
    triggerHaptic('medium');
    let totalSec = accumulatedSeconds;
    if (timerState === 'running' && lastStartTimestamp) {
      const currentRun = Math.floor((Date.now() - lastStartTimestamp) / 1000);
      totalSec += Math.max(0, currentRun);
    }

    const durationMinutes = Math.max(1, Math.round(totalSec / 60));
    const newSession: StudySession = {
      id: `session_${Date.now()}`,
      subject: subject.trim() || 'General Study',
      topic: topic.trim() || undefined,
      duration: durationMinutes,
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: startTimeStr,
    };

    const existingSessions = data.studySessions || [];
    await updateData({
      studySessions: [newSession, ...existingSessions],
    });

    handleReset();
    setFeedback(`Logged ${durationMinutes}m study session!`);
    setTimeout(() => {
      navigate('/study');
    }, 1200);
  };

  const h = Math.floor(elapsedSeconds / 3600);
  const m = Math.floor((elapsedSeconds % 3600) / 60);
  const s = elapsedSeconds % 60;
  const formattedTime = `${h.toString().padStart(2, '0')}:${m
    .toString()
    .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <div className="w-full text-white selection:bg-[#64D2FF]/30 pb-4">
      <header
        className="sticky top-0 z-30 w-full bg-black/85 backdrop-blur-md"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 14px)',
          paddingBottom: '6px',
        }}
      >
        <Toolbar
          leading={
            <button
              type="button"
              onClick={() => handleAppBack(navigate)}
              className="flex items-center justify-center w-10 h-10 rounded-full glass-nav nav-rim-light text-white active:scale-95 transition-all cursor-pointer"
              aria-label="Back"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
          }
          center={<span className="font-semibold text-white text-[17px] tracking-tight">Study Timer</span>}
        />
      </header>

      {/* ── Big Stopwatch Display (glass-hero with Cyan accent) ── */}
      <div
        style={{ '--hero-accent': '#64D2FF' } as React.CSSProperties}
        className="glass-hero my-4 p-8 text-center flex flex-col items-center justify-center select-none"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-[#64D2FF] mb-2">
          {timerState === 'running' ? 'Focus Mode Active' : timerState === 'paused' ? 'Session Paused' : 'Ready to Focus'}
        </span>

        <div className="text-6xl sm:text-7xl font-mono font-black text-white tracking-tight my-2">
          {formattedTime}
        </div>

        <p className="text-xs text-[rgba(235,235,245,0.60)] font-medium mt-1">
          {subject} {topic ? `· ${topic}` : ''}
        </p>

        {/* Primary Controls */}
        <div className="flex items-center gap-4 mt-6">
          {timerState === 'running' ? (
            <button
              type="button"
              onClick={handlePause}
              className="w-16 h-16 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
              title="Pause"
            >
              <Pause size={28} weight="fill" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="w-16 h-16 rounded-full bg-[#64D2FF] text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
              title="Start"
            >
              <Play size={28} weight="fill" className="ml-1" />
            </button>
          )}

          {elapsedSeconds > 0 && (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="w-12 h-12 rounded-full glass-flat text-white/80 hover:text-white flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                title="Reset"
              >
                <ArrowClockwise size={20} weight="bold" />
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="px-5 h-12 rounded-full bg-emerald-500 text-black font-bold text-sm flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                <Check size={18} weight="bold" />
                <span>Save Session</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Subject & Topic Details Inset */}
      <GroupedList header="Session Details">
        {availableSubjects.length > 0 && (
          <div className="p-3">
            <span className="text-[11px] font-bold text-[rgba(235,235,245,0.50)] block mb-2 uppercase tracking-wider">
              Select Subject
            </span>
            <div className="flex flex-wrap gap-2">
              {availableSubjects.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSubject(sub);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    subject === sub
                      ? 'bg-[#64D2FF] text-black font-bold shadow-md'
                      : 'glass-flat text-white/70 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 space-y-3">
          <TextField
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Mathematics"
          />
          <TextField
            label="Topic / Chapter"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Differential Equations"
          />
        </div>
      </GroupedList>

      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-20 inset-x-4 max-w-xs mx-auto p-3 rounded-2xl bg-white text-black font-semibold text-xs shadow-2xl flex items-center justify-center gap-2 z-50 animate-bounce">
          <Check size={16} weight="bold" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}

