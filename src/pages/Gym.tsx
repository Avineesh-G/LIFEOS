import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, Play, Settings, Flame, Sparkles, Check, Zap, ArrowUpRight,
  TrendingUp, Shield, Heart, Sprout, Compass, Activity, SlidersHorizontal,
  ChevronRight, Loader2, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { AnimatedMoon } from '../components/AnimatedIcons';
import { triggerHaptic } from '../utils/haptics';
import { getAiWorkoutPlan, GEMINI_API_KEY } from '../utils/geminiCoach';
import { FITNESS_GOALS } from '../utils/calculations';
import type { AppData, Exercise } from '../types';

interface GymProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getShortSplitLabel = (type: string) => {
  if (!type || type.toUpperCase() === 'REST') return 'Rest';
  const t = type.toUpperCase().trim();
  if (t === 'FULL BODY') return 'Full';
  if (t === 'SHOULDERS') return 'Shldr';
  if (t === 'CARDIO') return 'Cardio';
  if (t === 'UPPER') return 'Upper';
  if (t === 'LOWER') return 'Lower';
  if (t === 'CORE') return 'Core';
  if (t.length > 5) return t.slice(0, 4);
  return t.charAt(0) + t.slice(1).toLowerCase();
};

export default function Gym({ data, updateData }: GymProps) {
  const navigate = useNavigate();
  const [generatingCardio, setGeneratingCardio] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const today = format(new Date(), 'EEEE');
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const shortDay = ({ Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' } as Record<string, string>)[today] || '';
  const [selectedDay, setSelectedDay] = useState(shortDay);
  const todayPlan = data?.workoutPlans?.find(p => p.day === shortDay);
  const activePlan = data?.workoutPlans?.find(p => p.day === selectedDay) || todayPlan;
  const isSelectedToday = selectedDay === shortDay;
  const todayLog = data?.workoutLogs?.find(w => w.date === todayDate);
  const isCompletedToday = Boolean(todayLog?.isSaved);

  const handleAutoGenerateForDay = async (dayToGen: string, typeToGen: string) => {
    if (typeToGen === 'REST' || !typeToGen.trim()) return;
    triggerHaptic('ai');
    setGeneratingPlan(true);
    try {
      const apiKey = data.geminiApiKey || GEMINI_API_KEY;
      const aiPlan = await getAiWorkoutPlan(typeToGen, data.profile, apiKey);
      const newExercises: Exercise[] = aiPlan.exercises.map((ex: any) => ({
        id: crypto.randomUUID(),
        name: ex.name,
        sets: ex.sets,
        reps: parseInt(ex.reps) || 10,
        weight: ex.weight || 0,
        rest: ex.rest,
        howTo: ex.howTo,
        iconKey: ex.iconKey,
      }));

      const updatedPlans = data.workoutPlans.map(p =>
        p.day === dayToGen ? { ...p, exercises: newExercises } : p
      );
      await updateData({ workoutPlans: updatedPlans });
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      alert('Failed to generate workout plan with AI.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const userGoal = data?.profile?.fitnessGoal || 'general_fitness';
  const goalConfig = FITNESS_GOALS.find(g => g.id === userGoal) || FITNESS_GOALS[6];

  const renderGoalIcon = (iconName: string, size = 16, className = '') => {
    switch (iconName) {
      case 'Flame': return <Flame size={size} className={className} />;
      case 'TrendingUp': return <TrendingUp size={size} className={className} />;
      case 'Dumbbell': return <Dumbbell size={size} className={className} />;
      case 'Zap': return <Zap size={size} className={className} />;
      case 'Shield': return <Shield size={size} className={className} />;
      case 'Heart': return <Heart size={size} className={className} />;
      case 'Sprout': return <Sprout size={size} className={className} />;
      case 'Compass': return <Compass size={size} className={className} />;
      case 'Activity': return <Activity size={size} className={className} />;
      case 'Sparkles': return <Sparkles size={size} className={className} />;
      default: return <Dumbbell size={size} className={className} />;
    }
  };

  const totalWorkouts = (data?.workoutLogs || []).length;
  const thisWeekLogs = useMemo(() => {
    const now = Date.now();
    return (data?.workoutLogs || []).filter(w => {
      if (!w?.date) return false;
      const t = new Date(w.date).getTime();
      return !isNaN(t) && (now - t) / 86400000 <= 7;
    });
  }, [data?.workoutLogs]);

  const totalSets = useMemo(() => {
    if (!todayLog || !Array.isArray(todayLog.exercises)) return 0;
    return todayLog.exercises.reduce((s, ex) => {
      const setsArr = Array.isArray(ex?.sets) ? ex.sets : [];
      return s + setsArr.filter(st => st?.completed).length;
    }, 0);
  }, [todayLog]);

  const handleGenerateCardio = async () => {
    triggerHaptic(15);
    setGeneratingCardio(true);
    try {
      const apiKey = data.geminiApiKey || GEMINI_API_KEY;
      const aiPlan = await getAiWorkoutPlan('CARDIO', data.profile, apiKey);

      const newExercises: Exercise[] = aiPlan.exercises.map((ex: any) => ({
        id: crypto.randomUUID(),
        name: ex.name,
        sets: ex.sets,
        reps: parseInt(ex.reps) || 10,
        weight: ex.weight || 0,
        rest: ex.rest,
        howTo: ex.howTo,
        iconKey: ex.iconKey,
      }));

      const updatedPlans = data.workoutPlans.map(p =>
        p.day === shortDay ? { ...p, type: 'CARDIO', exercises: newExercises } : p
      );

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
    <div className="space-y-6 sm:space-y-7 pb-4">

      {/* Bioluminescent Mint Liquid Spring Capsule Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[32px] sm:rounded-[36px] p-5 sm:p-7 liquid-glass glow-mint border border-emerald-500/30 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-[var(--shadow-card)] space-y-4 sm:space-y-5 relative overflow-hidden"
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-[16px] shrink-0 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <Dumbbell size={20} className="text-emerald-800 dark:text-emerald-200" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-emerald-900 dark:text-emerald-300 font-mono">
                {today} · Target Routine
              </p>
              <h2 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-white truncate">Daily Protocol</h2>
            </div>
          </div>
          <span className={`rounded-full shrink-0 px-3 py-1 text-[11px] font-bold shadow-xs border ${
            isCompletedToday 
              ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-emerald-950 border-emerald-500/30'
              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
          }`}>
            {isCompletedToday ? 'Completed' : (todayPlan?.type === 'REST' ? 'Rest Day' : 'Incomplete')}
          </span>
        </div>

        {/* Workout Focus & Exercise Count */}
        <div className="pt-1 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight font-sans text-emerald-950 dark:text-white">
            {todayPlan?.type || 'Rest Day'}
          </h1>
          <p className="text-xs font-bold text-emerald-900/80 dark:text-emerald-300 mt-1 font-mono">
            {(todayPlan?.exercises || []).length} exercises scheduled
          </p>
        </div>

        {/* Bouncy Action Buttons Row */}
        <div className="flex items-center gap-2.5 pt-1 relative z-10">
          <motion.button
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              triggerHaptic('light');
              navigate('/gym/split');
            }}
            className="flex-1 py-3 rounded-full bg-white/85 dark:bg-white/10 text-emerald-900 dark:text-emerald-100 border border-emerald-500/20 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          >
            <Settings size={15} /> Split
          </motion.button>
          {isCompletedToday ? (
            <motion.button
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                triggerHaptic('light');
                navigate('/gym/workout');
              }}
              className="flex-[1.4] py-3 rounded-full bg-emerald-600 dark:bg-emerald-400 text-white dark:text-emerald-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Check size={16} className="stroke-[3]" /> Completed
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                triggerHaptic('medium');
                navigate('/gym/workout');
              }}
              className="flex-[1.4] py-3 rounded-full bg-emerald-600 dark:bg-emerald-400 text-white dark:text-emerald-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Play size={15} fill="currentColor" /> {todayLog ? 'Resume Workout' : 'Start Workout'}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Goal Routine Alignment & Customization Freedom Card */}
      <div className="rounded-[28px] p-5 sm:p-6 liquid-glass border border-[var(--card-border)] shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              {renderGoalIcon(goalConfig.iconName, 14)}
            </span>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-light dark:text-muted-dark">
                Goal Recommendation
              </p>
              <h3 className="text-xs font-bold text-primary-light dark:text-primary-dark">
                {goalConfig.label}
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Recommended
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-white/[0.05]">
          <p className="text-sm font-bold text-primary-light dark:text-primary-dark">
            {goalConfig.recommendedSplit}
          </p>
          <p className="text-xs text-secondary-light dark:text-secondary-dark mt-0.5 leading-relaxed">
            {goalConfig.splitDescription}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-[11px] text-muted-light dark:text-muted-dark font-medium">
            100% customizable as you wish
          </span>
          <button
            onClick={() => {
              triggerHaptic(5);
              navigate('/gym/split');
            }}
            className="flex items-center gap-1.5 font-bold text-accent hover:underline active:scale-95 transition-all text-xs"
          >
            <SlidersHorizontal size={13} />
            <span>Customize Split</span>
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5">
        <div className="rounded-[26px] p-5 sm:p-6 liquid-glass border border-[var(--card-border)] shadow-[var(--shadow-card)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
              Total Workouts
            </p>
            <span className="w-7 h-7 rounded-full bg-m3-mint-badge/60 dark:bg-m3-mint-darkBadge/60 flex items-center justify-center text-m3-mint-text dark:text-m3-mint-darkText">
              <Zap size={14} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-primary-light dark:text-primary-dark font-sans">
            {totalWorkouts}
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1 font-medium">All time logged</p>
        </div>

        <div className="rounded-[26px] p-5 sm:p-6 liquid-glass border border-[var(--card-border)] shadow-[var(--shadow-card)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
              This Week
            </p>
            <span className="w-7 h-7 rounded-full bg-m3-lavender-badge/60 dark:bg-m3-lavender-darkBadge/60 flex items-center justify-center text-m3-lavender-text dark:text-m3-lavender-darkText">
              <ArrowUpRight size={14} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-primary-light dark:text-primary-dark font-sans">
            {thisWeekLogs.length}
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1 font-medium">Sessions completed</p>
        </div>
      </div>

      {/* 7-Day Routine Selector Card - Perfectly Symmetrical, Zero Cutoff on Mobile */}
      <div className="liquid-glass border border-[var(--card-border)] rounded-[30px] p-4 sm:p-5 shadow-[var(--shadow-card)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[var(--pill-active-bg)] text-[var(--accent-primary)] flex items-center justify-center shrink-0 border border-[var(--card-border)]">
              <Calendar size={15} />
            </span>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] leading-none">
                Weekly Routine
              </p>
              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
                <span>{isSelectedToday ? `${selectedDay} (Today)` : selectedDay}</span>
                <span className="text-[var(--text-muted)] font-normal">·</span>
                <span className="text-[var(--pill-active-text)] font-black">{activePlan?.type || 'Rest'}</span>
              </h3>
            </div>
          </div>

          {!isSelectedToday ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(5);
                setSelectedDay(shortDay);
              }}
              className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)] active:scale-95 transition-all"
            >
              Back to Today ({shortDay})
            </button>
          ) : (
            <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-[var(--card-surface)] border border-[var(--card-border)] text-[var(--text-secondary)]">
              {activePlan?.type === 'REST'
                ? 'Rest Day'
                : `${(activePlan?.exercises || []).length} ${(activePlan?.exercises || []).length === 1 ? 'activity' : 'activities'}`}
            </span>
          )}
        </div>

        {/* 7-Day Responsive Grid with Fluid Spring Capsule */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 p-1.5 rounded-[22px] bg-[var(--card-surface)] border border-[var(--card-border)]">
          {DAYS.map(day => {
            const plan = data?.workoutPlans?.find(p => p.day === day);
            const isSelected = selectedDay === day;
            const isToday = day === shortDay;
            const exCount = (plan?.exercises || []).length;
            const isRest = !plan?.type || plan.type.toUpperCase() === 'REST';

            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedDay(day);
                }}
                className={`relative flex flex-col items-center justify-between py-2.5 px-0.5 sm:px-1 rounded-xl transition-all min-h-[74px] sm:min-h-[80px] select-none focus:outline-none ${
                  !isSelected && isToday
                    ? 'border border-accent/40 bg-accent/10 dark:bg-accent/15'
                    : !isSelected
                    ? 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    : ''
                }`}
                title={`${day}: ${plan?.type || 'Rest'} (${exCount} activities)`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeGymDayCapsule"
                    className="absolute inset-0 rounded-xl bg-accent shadow-md shadow-accent/25"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                {/* Day Header with Today indicator */}
                <div className="relative z-10 flex items-center gap-1 justify-center w-full">
                  <span className={`text-[11px] sm:text-xs font-bold leading-none transition-colors ${
                    isSelected ? 'text-white' : isToday ? 'text-accent' : 'text-primary-light dark:text-primary-dark'
                  }`}>
                    {day}
                  </span>
                  {isToday && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                  )}
                </div>

                {/* Split Type Badge */}
                <span className={`relative z-10 text-[9.5px] sm:text-[10px] font-mono font-bold tracking-tight uppercase truncate max-w-full my-1 transition-colors ${
                  isSelected
                    ? 'text-white/95 font-black'
                    : isRest
                    ? 'text-muted-light dark:text-muted-dark font-medium'
                    : 'text-primary-light dark:text-primary-dark'
                }`}>
                  {getShortSplitLabel(plan?.type || 'REST')}
                </span>

                {/* Exercises Count */}
                <span className={`relative z-10 text-[8.5px] sm:text-[9px] font-mono leading-none transition-colors ${
                  isSelected
                    ? 'text-white/80'
                    : isRest
                    ? 'text-muted-light/60 dark:text-muted-dark/60'
                    : 'text-secondary-light/70 dark:text-secondary-dark/70'
                }`}>
                  {isRest ? 'Off' : `${exCount} acts`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Routine Activities Liquid Spring Capsule Card */}
      <div className="rounded-[32px] p-6 sm:p-7 liquid-glass border border-[var(--card-border)] shadow-xs space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              {isSelectedToday ? "Today's Protocol" : `${selectedDay}'s Protocol`} · {activePlan?.type || 'Rest'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-light dark:text-muted-dark font-mono">
              {(activePlan?.exercises || []).length} activities
            </span>
            <button
              onClick={() => {
                triggerHaptic('light');
                navigate('/gym/split');
              }}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 font-mono"
            >
              <Settings size={12} /> Edit Split
            </button>
          </div>
        </div>

        {activePlan && activePlan.type !== 'REST' && (activePlan.exercises || []).length > 0 ? (
          <div className="space-y-3">
            {(activePlan.exercises || []).map((ex, i) => {
              const logged = isSelectedToday ? todayLog?.exercises?.find(e => e.name === ex.name) : undefined;
              const loggedSetsArr = Array.isArray(logged?.sets) ? logged.sets : [];
              const completedSets = loggedSetsArr.filter(s => s?.completed).length;
              const targetSets = Number(ex?.sets) || 0;
              const done = targetSets > 0 && completedSets >= targetSets;
              return (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.012, y: -1, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                  whileTap={{ scale: 0.985 }}
                  className="flex items-center justify-between p-3.5 rounded-[20px] bg-white/60 dark:bg-white/[0.04] border border-black/5 dark:border-white/5 transition-colors shadow-xs"
                >
                  <div>
                    <p className="font-bold text-sm text-primary-light dark:text-primary-dark">{ex.name}</p>
                    <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark mt-0.5">
                      {ex.sets} sets × {ex.reps} reps · {ex.weight} kg
                    </p>
                  </div>
                  {isSelectedToday && todayLog ? (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full font-mono border ${
                        done
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-black/5 dark:bg-white/10 border-transparent text-secondary-light dark:text-secondary-dark'
                      }`}
                    >
                      {completedSets}/{ex.sets} sets
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-semibold text-muted-light dark:text-muted-dark px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5">
                      {ex.sets} sets
                    </span>
                  )}
                </motion.div>
              );
            })}

            {isSelectedToday ? (
              isCompletedToday ? (
                <div className="flex items-center justify-between p-3.5 mt-2 rounded-[20px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Check size={16} className="stroke-[3]" />
                    <span>Workout completed & saved for today</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold opacity-85">
                    {totalSets} sets done
                  </span>
                </div>
              ) : todayLog ? (
                <p className="text-xs font-mono font-semibold text-muted-light dark:text-muted-dark pt-1">
                  {totalSets} sets completed so far today
                </p>
              ) : null
            ) : (
              <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark pt-1">
                Viewing scheduled routine for {selectedDay}. Switch back to Today ({shortDay}) to log sets.
              </p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <div className="flex justify-center text-3xl mb-1"><AnimatedMoon size={36} /></div>
            <p className="text-sm font-semibold text-secondary-light dark:text-secondary-dark">
              {activePlan?.type === 'REST' 
                ? `${selectedDay} is a Rest day — recover and rebuild` 
                : `No activities scheduled for ${selectedDay} (${activePlan?.type}) yet`}
            </p>
            {activePlan?.type !== 'REST' && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => handleAutoGenerateForDay(selectedDay, activePlan?.type || 'FULL BODY')}
                  disabled={generatingPlan}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {generatingPlan ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Auto-Generate {activePlan?.type} with AI</span>
                </button>
                <button
                  onClick={() => navigate('/gym/split')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Settings size={14} />
                  <span>Customize in Split</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>



      {/* Recent workouts */}
      {Array.isArray(data.workoutLogs) && data.workoutLogs.length > 0 && (
        <div className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
              Recent Workouts
            </p>
            <span className="text-xs text-muted-light dark:text-muted-dark font-medium">History</span>
          </div>

          <div className="space-y-1.5">
            {(data.workoutLogs || []).slice().reverse().slice(0, 5).map(w => (
              <button
                key={w.id}
                onClick={() => navigate(`/gym/history/${encodeURIComponent(w.exercises?.[0]?.name || '')}`)}
                className="w-full flex items-center gap-3.5 p-3 rounded-[18px] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] active:scale-[0.985] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-[14px] bg-m3-mint-badge/60 dark:bg-m3-mint-darkBadge/60 text-m3-mint-text dark:text-m3-mint-darkText flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-primary-light dark:text-primary-dark">{w.type}</p>
                  <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark mt-0.5">
                    {w.date} · {(w.exercises || []).reduce((s, e) => {
                      const exSets = Array.isArray(e?.sets) ? e.sets : [];
                      return s + exSets.filter(st => st?.completed).length;
                    }, 0)} sets logged
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-light dark:text-muted-dark flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
