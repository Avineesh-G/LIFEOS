import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Minus, Check, Save, Brain, TrendingUp, Activity, Award, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import {
  WORKOUT_MUSCLES,
  getPreWorkoutTip,
  getProgressionAdvice,
  getRecoveryCheck,
  getPostWorkoutSummary,
  getSplitTweakAdvice,
  GEMINI_API_KEY,
} from '../utils/geminiCoach';
import type { AppData, WorkoutLog } from '../types';

interface GymWorkoutProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

// ── Animated category dot ──────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${color}`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${color}`} />
    </span>
  );
}

// ── AI insight panel ───────────────────────────────────────────────────────
interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  content: string;
  loading: boolean;
  error: string;
  accentClass: string;
  onRefresh?: () => void;
}

function InsightCard({ icon, title, subtitle, content, loading, error, accentClass, onRefresh }: InsightCardProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 text-left active:bg-bg-light dark:active:bg-bg-dark transition-all"
        onClick={() => { triggerHaptic(5); setOpen(v => !v); }}
      >
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${accentClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-primary-light dark:text-primary-dark">{title}</p>
          <p className="label-mono text-muted-light dark:text-muted-dark truncate">{subtitle}</p>
        </div>
        {loading && <Loader2 size={14} className="animate-spin text-muted-light dark:text-muted-dark flex-shrink-0" />}
        {!loading && (open
          ? <ChevronUp size={14} className="text-muted-light dark:text-muted-dark flex-shrink-0" />
          : <ChevronDown size={14} className="text-muted-light dark:text-muted-dark flex-shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="border-t border-border-light dark:border-border-dark mb-3" />
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-bg-light dark:bg-bg-dark rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${accentClass.includes('purple') ? 'bg-purple-500' : accentClass.includes('emerald') ? 'bg-emerald-500' : accentClass.includes('amber') ? 'bg-amber-500' : 'bg-blue-500'}`}
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                    />
                  </div>
                  <span className="label-mono text-muted-light dark:text-muted-dark">Thinking...</span>
                </div>
              )}
              {!loading && error && <p className="text-xs text-red-500">{error}</p>}
              {!loading && !error && content && (
                <p className="text-sm text-secondary-light dark:text-secondary-dark leading-relaxed">{content}</p>
              )}
              {onRefresh && !loading && (
                <button
                  onClick={onRefresh}
                  className={`mt-3 label-mono text-[10px] px-3 py-1.5 rounded-full border transition-all active:scale-95 ${accentClass.includes('purple') ? 'text-purple-500 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/30' : accentClass.includes('emerald') ? 'text-emerald-600 border-emerald-200 dark:border-emerald-800' : accentClass.includes('amber') ? 'text-amber-600 border-amber-200 dark:border-amber-800' : 'text-blue-500 border-blue-200 dark:border-blue-800'}`}
                >
                  Refresh
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GymWorkout({ data, updateData }: GymWorkoutProps) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const shortDay = { 'Monday': 'Mon', 'Tuesday': 'Tue', 'Wednesday': 'Wed', 'Thursday': 'Thu', 'Friday': 'Fri', 'Saturday': 'Sat', 'Sunday': 'Sun' }[format(new Date(), 'EEEE')] || '';
  const todayPlan = data.workoutPlans.find(p => p.day === shortDay);
  const existingLog = data.workoutLogs.find(w => w.date === today);
  const workoutType = todayPlan?.type || 'CUSTOM';
  const isRest = workoutType === 'REST';
  const currentApiKey = data.geminiApiKey || GEMINI_API_KEY;
  const hasAi = !!currentApiKey && currentApiKey !== 'PASTE_YOUR_KEY_HERE';

  const [exercises, setExercises] = useState(() => {
    if (existingLog) return existingLog.exercises;
    if (todayPlan && todayPlan.type !== 'REST') {
      return todayPlan.exercises.map(ex => ({
        name: ex.name,
        howTo: ex.howTo,
        rest: ex.rest,
        sets: Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weight: ex.weight, completed: false }))
      }));
    }
    return [] as { name: string; howTo?: string; rest?: string; sets: { reps: number; weight: number; completed: boolean }[] }[];
  });
  const [newExName, setNewExName] = useState('');
  const [saved, setSaved] = useState(false);
  const [startTime] = useState<number>(existingLog?.startTime || Date.now());
  const [endTime, setEndTime] = useState<number | undefined>(existingLog?.endTime);

  // AI state
  const [preTip, setPreTip] = useState('');
  const [preLoading, setPreLoading] = useState(false);
  const [preError, setPreError] = useState('');

  const [progressTip, setProgressTip] = useState('');
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState('');

  const [recoveryTip, setRecoveryTip] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  const [postTip, setPostTip] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState('');

  const [tweakTip, setTweakTip] = useState('');
  const [tweakLoading, setTweakLoading] = useState(false);
  const [tweakError, setTweakError] = useState('');

  // ── Auto-fetch AI tips on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!hasAi || isRest) return;
    fetchPreTip();
    fetchProgressTip();
    fetchRecoveryTip();
    fetchTweakTip();
  }, [workoutType, hasAi, isRest]);

  async function fetchPreTip() {
    setPreLoading(true); setPreError('');
    try {
      const exNames = todayPlan?.exercises.map(e => e.name) ?? [];
      setPreTip(await getPreWorkoutTip(workoutType, exNames, currentApiKey));
    } catch (e: unknown) { setPreError(e instanceof Error ? e.message : 'Failed'); }
    finally { setPreLoading(false); }
  }

  async function fetchProgressTip() {
    // Find last log of same workout type
    const sorted = [...data.workoutLogs]
      .filter(l => l.type === workoutType && l.date !== today)
      .sort((a, b) => b.date.localeCompare(a.date));
    const last = sorted[0];
    if (!last) { setProgressTip('No previous session found. Start logging to unlock progression tracking.'); return; }
    setProgressLoading(true); setProgressError('');
    try {
      const exData = last.exercises.map(e => ({
        name: e.name,
        topWeight: Math.max(...e.sets.map(s => s.weight), 0),
        topReps: Math.max(...e.sets.map(s => s.reps), 0),
      }));
      setProgressTip(await getProgressionAdvice({ workoutType, lastSessionExercises: exData }, currentApiKey));
    } catch (e: unknown) { setProgressError(e instanceof Error ? e.message : 'Failed'); }
    finally { setProgressLoading(false); }
  }

  async function fetchRecoveryTip() {
    const recent = [...data.workoutLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(l => l.type);
    if (recent.length === 0) { setRecoveryTip('No workout history yet. Start logging to unlock recovery analysis.'); return; }
    setRecoveryLoading(true); setRecoveryError('');
    try { setRecoveryTip(await getRecoveryCheck(recent, currentApiKey)); }
    catch (e: unknown) { setRecoveryError(e instanceof Error ? e.message : 'Failed'); }
    finally { setRecoveryLoading(false); }
  }

  async function fetchTweakTip() {
    const recentLogs = [...data.workoutLogs]
      .filter(l => l.type === workoutType && l.date !== today)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(l => ({
        date: l.date,
        exercises: l.exercises.map(e => ({
          name: e.name,
          topWeight: Math.max(...e.sets.map(s => s.weight), 0)
        }))
      }));

    if (recentLogs.length < 3) {
      setTweakTip('Need at least 3 previous sessions of this type to analyze plateaus.');
      return;
    }
    setTweakLoading(true); setTweakError('');
    try { setTweakTip(await getSplitTweakAdvice(workoutType, recentLogs, currentApiKey)); }
    catch (e: unknown) { setTweakError(e instanceof Error ? e.message : 'Failed'); }
    finally { setTweakLoading(false); }
  }

  async function fetchPostSummary() {
    if (!hasAi) return;
    setPostLoading(true); setPostError('');
    try {
      const exData = exercises.map(e => ({
        name: e.name,
        topWeight: Math.max(...e.sets.map(s => s.weight), 0),
        completedReps: e.sets.filter(s => s.completed).reduce((sum, s) => sum + s.reps, 0),
      }));
      setPostTip(await getPostWorkoutSummary({ workoutType, completedSets, totalSets, exercises: exData }, currentApiKey));
    } catch (e: unknown) { setPostError(e instanceof Error ? e.message : 'Failed'); }
    finally { setPostLoading(false); }
  }

  // ── Exercise log helpers ────────────────────────────────────────────────
  const toggleSet = (ei: number, si: number) => {
    triggerHaptic(8);
    const u = [...exercises]; u[ei].sets[si].completed = !u[ei].sets[si].completed; setExercises(u);
  };
  const updateSet = (ei: number, si: number, field: 'reps' | 'weight', val: number) => {
    const u = [...exercises]; u[ei].sets[si][field] = val; setExercises(u);
  };
  const addSet = (ei: number) => {
    triggerHaptic(8);
    const u = [...exercises];
    const last = u[ei].sets[u[ei].sets.length - 1];
    u[ei].sets.push({ reps: last?.reps || 10, weight: last?.weight || 0, completed: false });
    setExercises(u);
  };
  const removeSet = (ei: number, si: number) => {
    const u = [...exercises]; u[ei].sets.splice(si, 1);
    if (u[ei].sets.length === 0) u.splice(ei, 1);
    setExercises(u);
  };
  const addExercise = () => {
    if (!newExName.trim()) return;
    triggerHaptic(10);
    setExercises([...exercises, { name: newExName.trim(), sets: [{ reps: 10, weight: 0, completed: false }] }]);
    setNewExName('');
  };

  const handleSave = async (isComplete = false) => {
    triggerHaptic(20);
    const currentEndTime = isComplete ? Date.now() : endTime;
    if (isComplete) setEndTime(currentEndTime);
    
    const log: WorkoutLog = {
      id: existingLog?.id || crypto.randomUUID(),
      date: today, day: shortDay, type: workoutType,
      exercises: exercises.filter(e => e.sets.length > 0),
      startTime,
      endTime: currentEndTime,
    };
    const updatedLogs = existingLog
      ? data.workoutLogs.map(w => w.id === existingLog.id ? log : w)
      : [...data.workoutLogs, log];
    await updateData({ workoutLogs: updatedLogs });
    setSaved(true);
    fetchPostSummary(); // auto-trigger post-workout analysis
  };

  const completedSets = exercises.reduce((s, e) => s + e.sets.filter(x => x.completed).length, 0);
  const totalSets = exercises.reduce((s, e) => s + e.sets.length, 0);
  const pct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  const muscles = WORKOUT_MUSCLES[workoutType.toUpperCase()];

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-28">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => navigate('/gym')} className="flex items-center gap-1.5 text-sm text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors active:scale-95">
          <ChevronLeft size={15} /> Back
        </button>
        <div className="label-mono text-secondary-light dark:text-secondary-dark">{completedSets}/{totalSets} sets</div>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark">{workoutType}</h1>
            {!isRest && pct === 100 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check size={14} className="text-white" />
              </motion.div>
            )}
          </div>
          {muscles && <p className="text-xs text-muted-light dark:text-muted-dark mt-0.5 capitalize">{muscles}</p>}
        </div>
        <button onClick={() => handleSave()} className="btn-pill flex items-center gap-2 px-5 py-2.5 text-sm">
          <Save size={14} /> {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Progress bar */}
      {!isRest && (
        <div className="space-y-1.5">
          <div className="h-1.5 bg-bg-light dark:bg-bg-dark rounded-full overflow-hidden border border-border-light dark:border-border-dark">
            <motion.div
              className="h-full rounded-full"
              style={{ background: pct === 100 ? '#10b981' : 'linear-gradient(90deg, #8b5cf6, #6366f1)' }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* ── AI Insights ─────────────────────────────────────────────────── */}
      {!isRest && hasAi && (
        <div className="space-y-3">
          <p className="label-mono text-secondary-light dark:text-secondary-dark">AI Insights</p>

          {/* 1. Pre-workout focus */}
          <InsightCard
            icon={<Brain size={15} className="text-purple-500" />}
            title="Today's Focus"
            subtitle={`${workoutType} — what to prioritize`}
            content={preTip}
            loading={preLoading}
            error={preError}
            accentClass="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800"
            onRefresh={fetchPreTip}
          />

          {/* 2. Progressive overload */}
          <InsightCard
            icon={<TrendingUp size={15} className="text-emerald-600" />}
            title="Progressive Overload"
            subtitle="vs your last session"
            content={progressTip}
            loading={progressLoading}
            error={progressError}
            accentClass="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
            onRefresh={fetchProgressTip}
          />

          {/* 3. Recovery check */}
          <InsightCard
            icon={<Activity size={15} className="text-amber-600" />}
            title="Recovery Check"
            subtitle="based on recent training load"
            content={recoveryTip}
            loading={recoveryLoading}
            error={recoveryError}
            accentClass="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800"
            onRefresh={fetchRecoveryTip}
          />

          {/* 4. Split Tweaks (Plateau Detection) */}
          <InsightCard
            icon={<Brain size={15} className="text-blue-500" />}
            title="Split Tweaks"
            subtitle="plateau analysis over last few weeks"
            content={tweakTip}
            loading={tweakLoading}
            error={tweakError}
            accentClass="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
            onRefresh={fetchTweakTip}
          />

          {/* 5. Post-workout summary (only after save) */}
          {saved && (
            <InsightCard
              icon={<Award size={15} className="text-blue-500" />}
              title="Session Summary"
              subtitle="AI feedback on your workout"
              content={postTip}
              loading={postLoading}
              error={postError}
              accentClass="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
              onRefresh={fetchPostSummary}
            />
          )}
        </div>
      )}

      {/* ── Exercise Log ─────────────────────────────────────────────────── */}
      {!isRest && (
        <div className="space-y-4">
          {exercises.length > 0 && <p className="label-mono text-secondary-light dark:text-secondary-dark">Your Workout</p>}

          {exercises.map((ex, ei) => {
            const allDone = ex.sets.every(s => s.completed);
            return (
              <motion.div
                key={ei}
                layout
                className={`card p-4 transition-all duration-300 ${allDone ? 'border-emerald-200 dark:border-emerald-800' : ''}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <PulseDot color={allDone ? 'bg-emerald-500' : 'bg-purple-500'} />
                  <span className="font-bold text-sm text-primary-light dark:text-primary-dark">{ex.name}</span>
                </div>
                
                {(ex.howTo || ex.rest) && (
                  <div className="mb-4 bg-purple-500/5 dark:bg-purple-500/10 rounded-xl p-3 border border-purple-500/10 flex flex-col gap-1.5">
                    {ex.howTo && <p className="text-xs text-purple-700 dark:text-purple-300 leading-snug"><span className="font-semibold">Tip:</span> {ex.howTo}</p>}
                    {ex.rest && <p className="text-xs text-purple-700 dark:text-purple-300"><span className="font-semibold">Rest:</span> {ex.rest}</p>}
                  </div>
                )}

                {/* Set headers */}
                <div className="grid grid-cols-[32px_1fr] gap-3 mb-1.5">
                  <span />
                  <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                    <span className="label-mono text-muted-light dark:text-muted-dark text-center">reps</span>
                    <span />
                    <span className="label-mono text-muted-light dark:text-muted-dark text-center">kg</span>
                    <span />
                  </div>
                </div>

                <div className="space-y-2">
                  {ex.sets.map((set, si) => (
                    <motion.div key={si} layout className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark">
                        {si + 1}
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={e => updateSet(ei, si, 'reps', parseInt(e.target.value) || 0)}
                          className="w-16 bg-transparent border border-border-light dark:border-border-dark rounded-xl px-2 py-1.5 text-base text-center focus:outline-none focus:border-purple-400 dark:focus:border-purple-600 transition-colors"
                        />
                        <span className="text-muted-light dark:text-muted-dark text-xs">@</span>
                        <input
                          type="number"
                          value={set.weight}
                          onChange={e => updateSet(ei, si, 'weight', parseInt(e.target.value) || 0)}
                          className="w-16 bg-transparent border border-border-light dark:border-border-dark rounded-xl px-2 py-1.5 text-base text-center focus:outline-none focus:border-purple-400 dark:focus:border-purple-600 transition-colors"
                        />
                        <span className="text-muted-light dark:text-muted-dark text-xs">kg</span>
                      </div>
                      <button
                        onClick={() => toggleSet(ei, si)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                          set.completed
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark text-muted-light dark:text-muted-dark hover:text-emerald-500 hover:border-emerald-500'
                        }`}
                      >
                        <Check size={14} />
                      </button>
                      <button onClick={() => removeSet(ei, si)} className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all active:scale-90">
                        <Minus size={13} />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <button onClick={() => addSet(ei)} className="mt-3 flex items-center gap-1.5 text-xs text-purple-500 font-semibold hover:opacity-80 transition-all">
                  <Plus size={12} /> Add Set
                </button>
              </motion.div>
            );
          })}

          {/* Add exercise */}
          <div className="card p-4">
            <p className="label-mono text-secondary-light dark:text-secondary-dark mb-3">Add Exercise</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExName}
                onChange={e => setNewExName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addExercise()}
                placeholder="e.g. Bench Press, Overhead Press..."
                className="flex-1 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2.5 text-base focus:outline-none focus:border-purple-400 dark:focus:border-purple-600 transition-colors"
              />
              <button onClick={addExercise} className="btn-pill px-4 py-2.5 text-sm">
                <Plus size={15} />
              </button>
            </div>
          </div>
          
          <div className="pt-4">
            {endTime ? (
              <div className="card p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">Workout Complete!</p>
                <div className="flex items-center justify-center gap-4 text-sm font-mono text-emerald-700 dark:text-emerald-300">
                  <div>
                    <span className="block text-[10px] uppercase opacity-70">Start Time</span>
                    {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div className="h-6 w-[1px] bg-emerald-300 dark:bg-emerald-700"></div>
                  <div>
                    <span className="block text-[10px] uppercase opacity-70">End Time</span>
                    {new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => handleSave(true)}
                className="w-full flex items-center justify-center gap-2 bg-primary-light dark:bg-primary-dark text-bg-light dark:text-bg-dark py-3.5 rounded-xl font-bold active:scale-[0.98] transition-all"
              >
                <Check size={18} /> Complete Workout
              </button>
            )}
          </div>
        </div>
      )}

      {/* Save Button for Rest Days */}

      {/* REST day */}
      {isRest && (
        <div className="card p-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark flex items-center justify-center">
            <Activity size={28} className="text-muted-light dark:text-muted-dark" />
          </div>
          <div>
            <p className="font-bold text-primary-light dark:text-primary-dark">Rest Day</p>
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1">Recovery is where the gains happen.<br />Eat well, sleep well.</p>
          </div>
          {hasAi && (
            <InsightCard
              icon={<Activity size={15} className="text-amber-600" />}
              title="Recovery Check"
              subtitle="based on recent training load"
              content={recoveryTip}
              loading={recoveryLoading}
              error={recoveryError}
              accentClass="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800"
              onRefresh={fetchRecoveryTip}
            />
          )}
        </div>
      )}
    </div>
  );
}
