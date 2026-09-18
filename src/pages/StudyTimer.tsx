import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Pause, Square, RotateCcw, ChevronLeft, Check, Sparkles, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { Capacitor } from '@capacitor/core';
import { TimerNotification } from '../plugins/timerNotification';
import type { AppData, StudySession } from '../types';

const isNative = Capacitor.isNativePlatform();

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

  // Initialize from persisted storage if an active timer was running
  const [persisted] = useState<PersistedTimer | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [subject, setSubject] = useState(() => persisted?.subject || prefillSubject);
  const [topic, setTopic] = useState(() => persisted?.topic || '');
  const [timerState, setTimerState] = useState<TimerState>(() => persisted?.timerState || 'idle');

  // Calculate initial seconds based on wall-clock elapsed time
  const [seconds, setSeconds] = useState<number>(() => {
    if (!persisted) return 0;
    if (persisted.timerState === 'running' && persisted.lastStartTimestamp) {
      const elapsed = Math.floor((Date.now() - persisted.lastStartTimestamp) / 1000);
      return Math.max(0, persisted.accumulatedSeconds + elapsed);
    }
    return persisted.accumulatedSeconds || 0;
  });

  const [showSummary, setShowSummary] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef<string>(persisted?.startTimeStr || '');
  const accumulatedRef = useRef<number>(persisted?.accumulatedSeconds || 0);
  const lastStartRef = useRef<number | null>(persisted?.lastStartTimestamp || null);

  // on mount, once — Android 13+ needs explicit permission
  useEffect(() => {
    if (isNative) TimerNotification.requestPermission();
  }, []);

  // Sync state to localStorage
  const saveTimerState = useCallback((state: TimerState, acc: number, startTs: number | null, subj: string, top: string, startStr: string) => {
    try {
      if (state === 'idle') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        const payload: PersistedTimer = {
          timerState: state,
          subject: subj,
          topic: top,
          accumulatedSeconds: acc,
          lastStartTimestamp: startTs,
          startTimeStr: startStr,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      }
    } catch {}
  }, []);

  // Recalculate true elapsed seconds from wall clock
  const syncElapsedSeconds = useCallback(() => {
    if (timerState === 'running' && lastStartRef.current) {
      const elapsed = Math.floor((Date.now() - lastStartRef.current) / 1000);
      const currentTotal = accumulatedRef.current + Math.max(0, elapsed);
      setSeconds(currentTotal);
    }
  }, [timerState]);

  // Main timer loop based on Wall-Clock time so it never stops when phone screen turns off
  useEffect(() => {
    if (timerState === 'running') {
      if (!lastStartRef.current) {
        lastStartRef.current = Date.now();
      }
      syncElapsedSeconds();

      intervalRef.current = setInterval(() => {
        syncElapsedSeconds();
      }, 500); // 500ms intervals for smooth, drift-free display
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [timerState, syncElapsedSeconds]);

  // Handle phone screen off / on (visibilitychange & window focus)
  useEffect(() => {
    const handleWake = () => {
      syncElapsedSeconds();
    };

    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);
    window.addEventListener('pageshow', handleWake);

    return () => {
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', handleWake);
      window.removeEventListener('pageshow', handleWake);
    };
  }, [syncElapsedSeconds]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!subject.trim()) return;
    triggerHaptic('light');
    const now = Date.now();
    const startStr = format(new Date(), 'HH:mm');
    startTimeRef.current = startStr;
    accumulatedRef.current = 0;
    lastStartRef.current = now;
    setSeconds(0);
    setTimerState('running');
    saveTimerState('running', 0, now, subject.trim(), topic.trim(), startStr);
    
    if (isNative) {
      const sessionLabel = topic.trim() ? `${subject.trim()}: ${topic.trim()}` : subject.trim();
      TimerNotification.start({ label: sessionLabel || 'Deep Work', elapsedBaseMs: 0 });
    }
  };

  const handlePause = () => {
    triggerHaptic('light');
    if (lastStartRef.current) {
      const elapsed = Math.floor((Date.now() - lastStartRef.current) / 1000);
      accumulatedRef.current += Math.max(0, elapsed);
      lastStartRef.current = null;
    }
    setSeconds(accumulatedRef.current);
    setTimerState('paused');
    saveTimerState('paused', accumulatedRef.current, null, subject, topic, startTimeRef.current);
    
    if (isNative) {
      const sessionLabel = topic.trim() ? `${subject.trim()}: ${topic.trim()}` : subject.trim();
      TimerNotification.pause({ label: sessionLabel || 'Deep Work', elapsedBaseMs: accumulatedRef.current * 1000 });
    }
  };

  const handleResume = () => {
    triggerHaptic('light');
    const now = Date.now();
    lastStartRef.current = now;
    setTimerState('running');
    saveTimerState('running', accumulatedRef.current, now, subject, topic, startTimeRef.current);
    
    if (isNative) {
      const sessionLabel = topic.trim() ? `${subject.trim()}: ${topic.trim()}` : subject.trim();
      TimerNotification.resume({ label: sessionLabel || 'Deep Work', elapsedBaseMs: accumulatedRef.current * 1000 });
    }
    syncElapsedSeconds();
  };

  const handleStop = async () => {
    triggerHaptic('medium');
    clearInterval(intervalRef.current);
    if (lastStartRef.current) {
      const elapsed = Math.floor((Date.now() - lastStartRef.current) / 1000);
      accumulatedRef.current += Math.max(0, elapsed);
    }
    setSeconds(accumulatedRef.current);
    setTimerState('idle');
    saveTimerState('idle', 0, null, '', '', '');
    if (isNative) TimerNotification.stop();
    setShowSummary(true);
  };

  const handleSave = async () => {
    triggerHaptic('save');
    const finalMinutes = Math.max(1, Math.round(seconds / 60));
    const session: StudySession = {
      id: crypto.randomUUID(),
      subject: subject.trim(),
      topic: topic.trim() || undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: startTimeRef.current || format(new Date(), 'HH:mm'),
      duration: finalMinutes,
    };
    await updateData({ studySessions: [...data.studySessions, session] });
    triggerHaptic('success');
    setShowSummary(false);
    setSeconds(0);
    accumulatedRef.current = 0;
    lastStartRef.current = null;
    setSubject('');
    setTopic('');
    if (isNative) TimerNotification.stop();
    localStorage.removeItem(STORAGE_KEY);
    navigate('/study');
  };

  const handleCancel = () => {
    triggerHaptic('light');
    clearInterval(intervalRef.current);
    if (isNative) TimerNotification.stop();
    setTimerState('idle');
    setSeconds(0);
    accumulatedRef.current = 0;
    lastStartRef.current = null;
    setShowSummary(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const subjects = [...new Set(data.studySessions.map(s => s.subject))];

  if (showSummary) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-4">
        <button
          onClick={() => navigate('/study')}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors font-sans"
        >
          <ChevronLeft size={16} /> Back to Study
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[32px] p-8 text-center bg-m3-lavender-container dark:bg-m3-lavender-darkContainer text-m3-lavender-text dark:text-m3-lavender-darkText border border-m3-lavender-badge/50 dark:border-m3-lavender-darkBadge/50 shadow-m3-subtle"
        >
          <div className="w-16 h-16 rounded-[20px] bg-white/90 dark:bg-black/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Check size={32} className="text-emerald-600 dark:text-emerald-400 stroke-[3]" />
          </div>

          <h2 className="text-2xl font-black mb-1 font-sans">Session Completed</h2>
          <p className="text-sm font-semibold opacity-85 mb-6">
            {subject} {topic ? `· ${topic}` : ''}
          </p>

          <div className="text-5xl sm:text-6xl font-black tracking-tight mb-2 font-mono">
            {formatTime(seconds)}
          </div>
          <p className="text-xs font-bold tracking-wider uppercase opacity-75 mb-8 font-mono">
            {Math.max(1, Math.round(seconds / 60))} total minutes logged
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3.5 rounded-full bg-[#4F378B] dark:bg-[#D0BCFF] text-white dark:text-[#231E2E] font-bold text-sm shadow-md active:scale-[0.97] transition-all"
            >
              Save Session
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-3.5 rounded-full bg-white/80 dark:bg-black/25 text-primary-light dark:text-primary-dark font-bold text-sm hover:opacity-90 active:scale-[0.97] transition-all"
            >
              Discard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pt-2">
      <button
        onClick={() => navigate('/study')}
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors font-mono"
      >
        <ChevronLeft size={16} /> Back to Study
      </button>

      {timerState === 'idle' ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] p-6 sm:p-7 liquid-glass border border-[var(--card-border)] shadow-sm space-y-5"
        >
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[14px] bg-indigo-500/15 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-xs">
              <Clock size={19} strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
                Focus Session
              </p>
              <h2 className="text-xl font-black text-primary-light dark:text-primary-dark font-sans">Start Timer</h2>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-2 font-mono">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. DSA, Operating Systems, Math"
              list="subjects"
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-4 py-3.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary-light dark:text-primary-dark"
            />
            <datalist id="subjects">
              {subjects.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>

          {subjects.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-light dark:text-muted-dark mb-2 font-mono">
                Quick Select
              </p>
              <div className="flex flex-wrap gap-2">
                {subjects.slice(0, 5).map(s => (
                  <motion.button
                    key={s}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      triggerHaptic('light');
                      setSubject(s);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      subject === s
                        ? 'bg-accent text-white shadow-xs'
                        : 'bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
                    }`}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-2 font-mono">
              Topic / Chapter (Optional)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Binary Search Trees, Chapter 4"
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary-light dark:text-primary-dark"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={!subject.trim()}
            className="w-full py-4 rounded-full bg-accent text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-accent/25 flex items-center justify-center gap-2"
          >
            <Play size={16} fill="currentColor" /> Start Focus Session
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[36px] p-8 text-center liquid-glass glow-lavender border border-indigo-200/50 dark:border-indigo-800/40 text-m3-lavender-text dark:text-m3-lavender-darkText shadow-sm space-y-6 relative overflow-hidden"
        >
          <div className="space-y-1 relative z-10">
            <span className="rounded-full bg-indigo-500/15 border border-indigo-500/25 px-4 py-1.5 text-xs font-bold inline-block shadow-xs text-indigo-900 dark:text-indigo-200">
              {subject} {topic ? `· ${topic}` : ''}
            </span>
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-75 font-mono pt-2">
              {timerState === 'running' ? 'Focus Session Active' : 'Session Paused'}
            </p>
          </div>

          <div className="text-6xl sm:text-7xl font-black tracking-tight font-mono py-4 text-primary-light dark:text-primary-dark relative z-10">
            {formatTime(seconds)}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2 relative z-10">
            {timerState === 'running' ? (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handlePause}
                className="w-16 h-16 rounded-[24px] bg-white dark:bg-white/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center transition-colors shadow-sm"
                title="Pause"
              >
                <Pause size={24} fill="currentColor" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleResume}
                className="w-16 h-16 rounded-[24px] bg-indigo-600 dark:bg-indigo-400 text-white dark:text-indigo-950 flex items-center justify-center transition-colors shadow-md shadow-indigo-500/25"
                title="Resume"
              >
                <Play size={24} fill="currentColor" />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleStop}
              className="w-16 h-16 rounded-[24px] bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-md shadow-rose-500/25"
              title="Stop & Save"
            >
              <Square size={22} fill="currentColor" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleCancel}
              className="w-12 h-12 rounded-[20px] bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 text-secondary-light dark:text-secondary-dark flex items-center justify-center transition-colors"
              title="Reset"
            >
              <RotateCcw size={18} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
