import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Pause, Square, RotateCcw, ChevronLeft, Check } from 'lucide-react';
import { format } from 'date-fns';
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
  const prefillDuration = searchParams.get('duration') || '';

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
      duration: Math.round(seconds / 60),
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
      <div className="max-w-md mx-auto space-y-6 pt-10">
        <button onClick={() => navigate('/study')} className="flex items-center gap-2 text-sm text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors">
          <ChevronLeft size={16} /> Back to Study
        </button>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-accent" />
          </div>
          <h2 className="text-2xl font-semibold mb-1">Session Complete</h2>
          <p className="text-secondary-light dark:text-secondary-dark mb-6">{subject} {topic ? `· ${topic}` : ''}</p>
          <div className="text-5xl font-semibold tracking-tight mb-2">{formatTime(seconds)}</div>
          <div className="text-sm text-secondary-light dark:text-secondary-dark mb-8">{Math.round(seconds / 60)} minutes</div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="flex-1 bg-accent text-white py-3 rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all">Save Session</button>
            <button onClick={handleCancel} className="flex-1 border border-border-light dark:border-border-dark py-3 rounded-xl font-medium hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all">Discard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8 pt-4">
      <button onClick={() => navigate('/study')} className="flex items-center gap-2 text-sm text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors">
        <ChevronLeft size={16} /> Back to Study
      </button>

      {timerState === 'idle' ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Start Study Session</h2>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. DSA, DBMS, Math"
              list="subjects"
              className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
            <datalist id="subjects">
              {subjects.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-2">Topic (optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Binary Trees, Chapter 3"
              className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
          </div>
          <button
            onClick={handleStart}
            disabled={!subject.trim()}
            className="w-full bg-accent text-white py-3.5 rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play size={18} fill="white" /> Start Timer
          </button>
        </div>
      ) : (
        <div className="text-center space-y-8">
          <div>
            <div className="text-sm text-secondary-light dark:text-secondary-dark mb-2">{subject} {topic ? `· ${topic}` : ''}</div>
            <div className="text-6xl md:text-7xl font-semibold tracking-tight tabular-nums">{formatTime(seconds)}</div>
          </div>
          <div className="flex items-center justify-center gap-4">
            {timerState === 'running' ? (
              <button onClick={handlePause} className="w-16 h-16 rounded-full border-2 border-accent text-accent flex items-center justify-center hover:bg-accent/5 active:scale-[0.95] transition-all">
                <Pause size={24} fill="currentColor" />
              </button>
            ) : (
              <button onClick={handleResume} className="w-16 h-16 rounded-full bg-accent text-white flex items-center justify-center hover:opacity-90 active:scale-[0.95] transition-all">
                <Play size={24} fill="white" />
              </button>
            )}
            <button onClick={handleStop} className="w-16 h-16 rounded-full border-2 border-red-400 text-red-400 flex items-center justify-center hover:bg-red-400/5 active:scale-[0.95] transition-all">
              <Square size={20} fill="currentColor" />
            </button>
            <button onClick={handleCancel} className="w-12 h-12 rounded-full border border-border-light dark:border-border-dark flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.95] transition-all">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
