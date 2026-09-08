import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Pause, Square, RotateCcw, ChevronLeft, Check, Sparkles, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData, StudySession } from '../types';

interface StudyTimerProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type TimerState = 'idle' | 'running' | 'paused';

export default function StudyTimer({ data, updateData }: StudyTimerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillSubject = searchParams.get('subject') || '';

  const [subject, setSubject] = useState(prefillSubject);
  const [topic, setTopic] = useState('');
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef<string>('');

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerState]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!subject.trim()) return;
    setTimerState('running');
    startTimeRef.current = format(new Date(), 'HH:mm');
  };

  const handlePause = () => setTimerState('paused');
  const handleResume = () => setTimerState('running');

  const handleStop = async () => {
    clearInterval(intervalRef.current);
    setTimerState('idle');
    setShowSummary(true);
  };

  const handleSave = async () => {
    const session: StudySession = {
      id: crypto.randomUUID(),
      subject: subject.trim(),
      topic: topic.trim() || undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: startTimeRef.current || format(new Date(), 'HH:mm'),
      duration: Math.max(1, Math.round(seconds / 60)),
    };
    await updateData({ studySessions: [...data.studySessions, session] });
    setShowSummary(false);
    setSeconds(0);
    setSubject('');
    setTopic('');
    navigate('/study');
  };

  const handleCancel = () => {
    clearInterval(intervalRef.current);
    setTimerState('idle');
    setSeconds(0);
    setShowSummary(false);
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
          className="card p-6 space-y-5"
        >
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-[12px] bg-m3-lavender-badge/70 dark:bg-m3-lavender-darkBadge/70 text-m3-lavender-text dark:text-m3-lavender-darkText flex items-center justify-center">
              <Clock size={18} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
                Focus Session
              </p>
              <h2 className="text-xl font-black text-primary-light dark:text-primary-dark">Start Timer</h2>
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
              className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-[18px] px-4 py-3.5 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary-light dark:text-primary-dark"
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
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      subject === s
                        ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light'
                        : 'bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark'
                    }`}
                  >
                    {s}
                  </button>
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
              className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-[18px] px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary-light dark:text-primary-dark"
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!subject.trim()}
            className="w-full py-4 rounded-full bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Play size={16} fill="currentColor" /> Start Focus Session
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[32px] p-8 text-center bg-m3-lavender-container dark:bg-m3-lavender-darkContainer text-m3-lavender-text dark:text-m3-lavender-darkText border border-m3-lavender-badge/50 dark:border-m3-lavender-darkBadge/50 shadow-m3-subtle space-y-6"
        >
          <div className="space-y-1">
            <span className="rounded-full bg-white/70 dark:bg-black/25 px-3.5 py-1 text-xs font-bold inline-block shadow-sm">
              {subject} {topic ? `· ${topic}` : ''}
            </span>
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-75 font-mono pt-2">
              {timerState === 'running' ? 'Focus Session Active' : 'Session Paused'}
            </p>
          </div>

          <div className="text-6xl sm:text-7xl font-black tracking-tight font-mono py-4">
            {formatTime(seconds)}
          </div>

          <div className="flex items-center justify-center gap-4 pt-2">
            {timerState === 'running' ? (
              <button
                onClick={handlePause}
                className="w-16 h-16 rounded-[22px] bg-white dark:bg-black/30 text-m3-lavender-text dark:text-m3-lavender-darkText flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                title="Pause"
              >
                <Pause size={24} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="w-16 h-16 rounded-[22px] bg-[#4F378B] dark:bg-[#D0BCFF] text-white dark:text-[#231E2E] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
                title="Resume"
              >
                <Play size={24} fill="currentColor" />
              </button>
            )}

            <button
              onClick={handleStop}
              className="w-16 h-16 rounded-[22px] bg-rose-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
              title="Stop & Save"
            >
              <Square size={22} fill="currentColor" />
            </button>

            <button
              onClick={handleCancel}
              className="w-12 h-12 rounded-[18px] bg-white/60 dark:bg-black/20 text-m3-lavender-text dark:text-m3-lavender-darkText flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              title="Reset"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
