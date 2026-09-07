import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ChevronRight, Play, Settings, UtensilsCrossed, Flame, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { AnimatedMoon } from '../components/AnimatedIcons';
import { triggerHaptic } from '../utils/haptics';
import { getAiWorkoutPlan, GEMINI_API_KEY } from '../utils/geminiCoach';
import type { AppData, Exercise } from '../types';

interface GymProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.48, ease: 'easeOut' } } };

export default function Gym({ data, updateData }: GymProps) {
  const navigate = useNavigate();
  const [generatingCardio, setGeneratingCardio] = useState(false);
  const today    = format(new Date(), 'EEEE');
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const shortDay = ({ Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' } as Record<string, string>)[today] || '';
  const todayPlan = data.workoutPlans.find(p => p.day === shortDay);
  const todayLog  = data.workoutLogs.find(w => w.date === todayDate);

  const totalWorkouts = data.workoutLogs.length;
  const thisWeekLogs  = data.workoutLogs.filter(w => {
    const diff = (Date.now() - new Date(w.date).getTime()) / 86400000;
    return diff <= 7;
  });

  const totalSets = todayLog
    ? todayLog.exercises.reduce((s, ex) => s + ex.sets.filter(st => st.completed).length, 0)
    : 0;

  const handleGenerateCardio = async () => {
    triggerHaptic(15);
    setGeneratingCardio(true);
    try {
      const apiKey = data.geminiApiKey || GEMINI_API_KEY;
      const aiPlan = await getAiWorkoutPlan('CARDIO', data.profile, apiKey);
      
      const newExercises: Exercise[] = aiPlan.exercises.map(ex => ({
        id: crypto.randomUUID(),
        name: ex.name,
        sets: ex.sets,
        reps: parseInt(ex.reps) || 10,
        weight: ex.weight || 0,
        rest: ex.rest,
        howTo: ex.howTo,
        iconKey: ex.iconKey,
      }));

      // Update today's plan in workoutPlans to CARDIO with new exercises
      const updatedPlans = data.workoutPlans.map(p => 
        p.day === shortDay ? { ...p, type: 'CARDIO', exercises: newExercises } : p
      );

      // If a log already existed for today, update it to the new cardio exercises
      let updatedLogs = data.workoutLogs;
      if (todayLog) {
        updatedLogs = data.workoutLogs.map(w => 
          w.id === todayLog.id ? {
            ...w,
            type: 'CARDIO',
            exercises: newExercises.map(ex => ({
              name: ex.name,
              howTo: ex.howTo,
              rest: ex.rest,
              sets: Array.from({ length: ex.sets }, () => ({ reps: ex.reps, weight: ex.weight, completed: false }))
            }))
          } : w
        );
      }

      await updateData({ workoutPlans: updatedPlans, workoutLogs: updatedLogs });
      triggerHaptic(20);
      navigate('/gym/workout');
    } catch (err) {
      console.error(err);
      alert('Failed to generate cardio session. Please check your Groq API key in Settings.');
    } finally {
      setGeneratingCardio(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between pt-2">
        <div>
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">
            {today} · {todayPlan?.type || 'Rest'}
          </p>
          <h1 className="text-4xl font-bold tracking-tight leading-none text-primary-light dark:text-primary-dark">Gym</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/gym/split')}
            className="btn-ghost-pill flex items-center gap-1.5 px-3.5 py-2.5 text-sm"
          >
            <Settings size={14} /> Split
          </button>
          <button
            onClick={() => navigate('/gym/workout')}
            className="btn-pill flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Play size={14} fill="currentColor" /> {todayLog ? 'Resume' : 'Start'}
          </button>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-2">Total Workouts</p>
          <p className="text-3xl font-bold tracking-tight">{totalWorkouts}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">all time</p>
        </div>
        <div className="card p-4">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-2">This Week</p>
          <p className="text-3xl font-bold tracking-tight">{thisWeekLogs.length}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">sessions</p>
        </div>
      </motion.div>

      {/* Today's workout card */}
      <motion.div variants={item} className="card p-5">
        <p className="label-mono text-secondary-light dark:text-secondary-dark mb-4">
          Today · {todayPlan?.type || 'Rest'}
        </p>

        {todayPlan && todayPlan.type !== 'REST' && todayPlan.exercises.length > 0 ? (
          <div className="space-y-3">
            {todayPlan.exercises.map((ex, i) => {
              const logged       = todayLog?.exercises.find(e => e.name === ex.name);
              const completedSets = logged?.sets.filter(s => s.completed).length || 0;
              const done          = completedSets >= ex.sets;
              return (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border-light dark:border-border-dark last:border-0">
                  <div>
                    <p className="font-medium text-sm text-primary-light dark:text-primary-dark">{ex.name}</p>
                    <p className="label-mono text-muted-light dark:text-muted-dark mt-0.5">
                      {ex.sets}×{ex.reps} · {ex.weight}kg
                    </p>
                  </div>
                  {todayLog ? (
                    <span className={`text-sm font-semibold ${done ? 'text-emerald-500' : 'text-secondary-light dark:text-secondary-dark'}`}>
                      {completedSets}/{ex.sets}
                    </span>
                  ) : (
                    <span className="label-mono text-muted-light dark:text-muted-dark">Pending</span>
                  )}
                </div>
              );
            })}
            {todayLog && (
              <p className="label-mono text-muted-light dark:text-muted-dark pt-1">
                {totalSets} sets completed
              </p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="flex justify-center text-3xl mb-2"><AnimatedMoon size={32} /></div>
            <p className="label-mono text-secondary-light dark:text-secondary-dark">
              {todayPlan?.type === 'REST' ? 'Rest day — recover well' : 'No exercises planned'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Cardio Only AI Card */}
      <motion.div variants={item} className="card p-5 border border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-transparent to-amber-500/5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <Flame size={18} />
              </span>
              <p className="font-bold text-base text-primary-light dark:text-primary-dark">Cardio Only Session</p>
            </div>
            <p className="text-xs text-secondary-light dark:text-secondary-dark pt-1 leading-relaxed">
              Want to do cardio today? Generate an AI-powered cardio routine (HIIT, Treadmill, Cycling & Core intervals) customized for you.
            </p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-border-light dark:border-border-dark flex items-center justify-between">
          <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark flex items-center gap-1">
            <Sparkles size={11} className="text-rose-500" /> AI Customized
          </span>
          <button
            onClick={handleGenerateCardio}
            disabled={generatingCardio}
            className="btn-pill px-4 py-2 text-xs flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 disabled:opacity-50"
          >
            {generatingCardio ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" /> Start Cardio (AI)
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Recent workouts */}
      {data.workoutLogs.length > 0 && (
        <motion.div variants={item} className="card p-5">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-4">Recent Workouts</p>
          <div className="space-y-1">
            {data.workoutLogs.slice().reverse().slice(0, 5).map(w => (
              <button
                key={w.id}
                onClick={() => navigate(`/gym/history/${encodeURIComponent(w.exercises[0]?.name || '')}`)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-bg-light dark:hover:bg-bg-dark active:scale-[0.985] transition-all text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={14} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-primary-light dark:text-primary-dark">{w.type}</p>
                  <p className="label-mono text-muted-light dark:text-muted-dark">
                    {w.date} · {w.exercises.reduce((s, e) => s + e.sets.filter(st => st.completed).length, 0)} sets
                  </p>
                </div>
                <ChevronRight size={14} className="text-muted-light dark:text-muted-dark flex-shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
