import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Plus, Trash2, GripVertical, Save, Sparkles, Loader2, HeartPulse,
  Flame, TrendingUp, Dumbbell, Zap, Shield, Heart, Sprout, Compass, Activity, Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import { getAiWorkoutPlan, GEMINI_API_KEY } from '../utils/geminiCoach';
import { FITNESS_GOALS } from '../utils/calculations';
import type { AppData, WorkoutPlan, Exercise } from '../types';

interface GymSplitProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_MAP: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun'
};
const SPLIT_PRESETS = ['PUSH', 'PULL', 'LEGS', 'CARDIO', 'UPPER', 'LOWER', 'FULL BODY', 'REST'];

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

export const GOAL_SPLIT_TEMPLATES: Record<string, { name: string; split: { day: string; type: string }[] }> = {
  muscle_building: {
    name: 'Push / Pull / Legs (PPL)',
    split: [
      { day: 'Mon', type: 'PUSH' },
      { day: 'Tue', type: 'PULL' },
      { day: 'Wed', type: 'LEGS' },
      { day: 'Thu', type: 'PUSH' },
      { day: 'Fri', type: 'PULL' },
      { day: 'Sat', type: 'LEGS' },
      { day: 'Sun', type: 'REST' },
    ]
  },
  weight_loss: {
    name: 'Full Body & Metabolic HIIT',
    split: [
      { day: 'Mon', type: 'FULL BODY' },
      { day: 'Tue', type: 'CARDIO' },
      { day: 'Wed', type: 'FULL BODY' },
      { day: 'Thu', type: 'CARDIO' },
      { day: 'Fri', type: 'FULL BODY' },
      { day: 'Sat', type: 'HIIT' },
      { day: 'Sun', type: 'REST' },
    ]
  },
  body_recomp: {
    name: 'Upper / Lower Power & Hypertrophy',
    split: [
      { day: 'Mon', type: 'UPPER' },
      { day: 'Tue', type: 'LOWER' },
      { day: 'Wed', type: 'REST' },
      { day: 'Thu', type: 'UPPER' },
      { day: 'Fri', type: 'LOWER' },
      { day: 'Sat', type: 'CARDIO' },
      { day: 'Sun', type: 'REST' },
    ]
  },
  weight_gain: {
    name: 'Heavy Compound Upper/Lower Split',
    split: [
      { day: 'Mon', type: 'UPPER' },
      { day: 'Tue', type: 'LOWER' },
      { day: 'Wed', type: 'REST' },
      { day: 'Thu', type: 'UPPER' },
      { day: 'Fri', type: 'LOWER' },
      { day: 'Sat', type: 'ARMS' },
      { day: 'Sun', type: 'REST' },
    ]
  },
  strength_building: {
    name: 'Powerlifting / Heavy Compounds',
    split: [
      { day: 'Mon', type: 'CHEST' },
      { day: 'Tue', type: 'BACK' },
      { day: 'Wed', type: 'REST' },
      { day: 'Thu', type: 'LEGS' },
      { day: 'Fri', type: 'SHOULDERS' },
      { day: 'Sat', type: 'CORE' },
      { day: 'Sun', type: 'REST' },
    ]
  },
  conditioning: {
    name: 'Functional Hybrid & Kettlebell Circuits',
    split: [
      { day: 'Mon', type: 'FULL BODY' },
      { day: 'Tue', type: 'CARDIO' },
      { day: 'Wed', type: 'CORE' },
      { day: 'Thu', type: 'FULL BODY' },
      { day: 'Fri', type: 'HIIT' },
      { day: 'Sat', type: 'CARDIO' },
      { day: 'Sun', type: 'REST' },
    ]
  },
  general_fitness: {
    name: 'Balanced 3-Day Full Body Split',
    split: [
      { day: 'Mon', type: 'FULL BODY' },
      { day: 'Tue', type: 'REST' },
      { day: 'Wed', type: 'FULL BODY' },
      { day: 'Thu', type: 'REST' },
      { day: 'Fri', type: 'FULL BODY' },
      { day: 'Sat', type: 'CARDIO' },
      { day: 'Sun', type: 'REST' },
    ]
  },
  mobility: {
    name: 'Mobility Flow & Active Recovery',
    split: [
      { day: 'Mon', type: 'CORE' },
      { day: 'Tue', type: 'CARDIO' },
      { day: 'Wed', type: 'REST' },
      { day: 'Thu', type: 'CORE' },
      { day: 'Fri', type: 'CARDIO' },
      { day: 'Sat', type: 'REST' },
      { day: 'Sun', type: 'REST' },
    ]
  },
  endurance: {
    name: 'Endurance & Cardio Interval Split',
    split: [
      { day: 'Mon', type: 'CARDIO' },
      { day: 'Tue', type: 'FULL BODY' },
      { day: 'Wed', type: 'CARDIO' },
      { day: 'Thu', type: 'HIIT' },
      { day: 'Fri', type: 'CARDIO' },
      { day: 'Sat', type: 'CORE' },
      { day: 'Sun', type: 'REST' },
    ]
  },
  body_toning: {
    name: 'Toning Supersets & Core Focus',
    split: [
      { day: 'Mon', type: 'UPPER' },
      { day: 'Tue', type: 'LOWER' },
      { day: 'Wed', type: 'CORE' },
      { day: 'Thu', type: 'FULL BODY' },
      { day: 'Fri', type: 'HIIT' },
      { day: 'Sat', type: 'CARDIO' },
      { day: 'Sun', type: 'REST' },
    ]
  }
};

const CARDIO_EXERCISE_PRESETS: Exercise[] = [
  { id: 'cardio-1', name: 'Incline Treadmill Walk', sets: 3, reps: 15, weight: 0, rest: '60s', howTo: '12% incline at 3.5-4.0 km/h' },
  { id: 'cardio-2', name: 'Stationary Cycling', sets: 3, reps: 15, weight: 0, rest: '60s', howTo: 'Moderate resistance, steady pace' },
  { id: 'cardio-3', name: 'Jump Rope Intervals', sets: 4, reps: 50, weight: 0, rest: '45s', howTo: 'High speed intervals' },
  { id: 'cardio-4', name: 'Rowing Machine', sets: 3, reps: 10, weight: 0, rest: '60s', howTo: 'Full leg drive, controlled recovery' },
  { id: 'cardio-5', name: 'Stairmaster', sets: 3, reps: 10, weight: 0, rest: '60s', howTo: 'Constant step rate, core engaged' },
];

export default function GymSplit({ data, updateData }: GymSplitProps) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<WorkoutPlan[]>(data.workoutPlans);
  const todayFullName = format(new Date(), 'EEEE');
  const todayShort = DAY_MAP[todayFullName] || 'Mon';
  const [activeDay, setActiveDay] = useState(todayShort);
  const [generating, setGenerating] = useState(false);
  const activePlan = plans.find(p => p.day === activeDay)!;

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
      default: return <Dumbbell size={size} className={className} />;
    }
  };

  const applyRecommendedSplit = () => {
    triggerHaptic(15);
    const template = GOAL_SPLIT_TEMPLATES[userGoal] || GOAL_SPLIT_TEMPLATES.general_fitness;
    const updated = plans.map(p => {
      const match = template.split.find(t => t.day === p.day);
      return match ? { ...p, type: match.type } : p;
    });
    setPlans(updated);
  };

  const updatePlan = (updated: WorkoutPlan) => {
    setPlans(plans.map(p => p.day === updated.day ? updated : p));
  };

  const addExercise = () => {
    triggerHaptic(5);
    const newEx: Exercise = { id: crypto.randomUUID(), name: 'New Exercise', sets: 3, reps: 10, weight: 0 };
    updatePlan({ ...activePlan, exercises: [...activePlan.exercises, newEx] });
  };

  const loadCardioCircuit = () => {
    triggerHaptic(12);
    const newExercises = CARDIO_EXERCISE_PRESETS.map(c => ({ ...c, id: crypto.randomUUID() }));
    updatePlan({ ...activePlan, type: 'CARDIO', exercises: newExercises });
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...activePlan.exercises];
    updated[index] = { ...updated[index], [field]: value };
    updatePlan({ ...activePlan, exercises: updated });
  };

  const removeExercise = (index: number) => {
    triggerHaptic(8);
    const updated = [...activePlan.exercises];
    updated.splice(index, 1);
    updatePlan({ ...activePlan, exercises: updated });
  };

  const moveExercise = (index: number, direction: number) => {
    const updated = [...activePlan.exercises];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= updated.length) return;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updatePlan({ ...activePlan, exercises: updated });
  };

  const handleSave = async () => {
    triggerHaptic('save');
    await updateData({ workoutPlans: plans });
    navigate('/gym');
  };

  const handleAutoGenerate = async () => {
    if (activePlan.type === 'REST' || !activePlan.type.trim()) return;
    triggerHaptic('ai');
    setGenerating(true);
    try {
      const aiPlan = await getAiWorkoutPlan(activePlan.type, data.profile, (data as any).geminiApiKey || GEMINI_API_KEY);
      
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
      updatePlan({ ...activePlan, exercises: newExercises });
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      alert('Failed to generate workout plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 max-w-2xl mx-auto pb-4">
      <div className="flex items-center justify-between pt-1">
        <button onClick={() => navigate('/gym')} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors font-mono">
          <ChevronLeft size={16} /> Back
        </button>
        <button onPointerDown={() => triggerHaptic('save')} onClick={handleSave} className="flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold hover:opacity-90 active:scale-[0.96] transition-all shadow-sm">
          <Save size={16} /> Save
        </button>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono mb-1.5">Routine Customization</p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-primary-light dark:text-primary-dark font-sans">Weekly Split</h1>
      </div>

      {/* Goal Recommendation Banner with Full Freedom */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 rounded-[28px] p-5 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              {renderGoalIcon(goalConfig.iconName, 14)}
            </span>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-light dark:text-muted-dark">
                Recommended Routine
              </p>
              <h3 className="text-xs font-bold text-primary-light dark:text-primary-dark">
                {goalConfig.label} · {goalConfig.recommendedSplit}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={applyRecommendedSplit}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles size={13} />
            <span>Apply 7-Day Split</span>
          </button>
        </div>
        <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
          {goalConfig.splitDescription}
        </p>
        <div className="pt-2 border-t border-border-light/60 dark:border-border-dark/60 text-[11px] text-muted-light dark:text-muted-dark flex items-center justify-between">
          <span>Full Customization Freedom: Select any day below to change or set activities as you wish.</span>
        </div>
      </div>

      {/* Day Selector & Week Schedule Card */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 rounded-[28px] p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <Calendar size={15} />
            </span>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-light dark:text-muted-dark leading-none">
                Weekly Schedule
              </p>
              <h3 className="text-xs sm:text-sm font-bold text-primary-light dark:text-primary-dark flex items-center gap-1.5 mt-0.5">
                <span>{activeDay === todayShort ? `${activeDay} (Today)` : activeDay}</span>
                <span className="text-muted-light dark:text-muted-dark font-normal">·</span>
                <span className="text-accent font-black">{activePlan.type || 'Rest'}</span>
              </h3>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-bg-light dark:bg-bg-dark border border-border-light/80 dark:border-border-dark/80 text-secondary-light dark:text-secondary-dark">
            {activePlan.type === 'REST'
              ? 'Rest Day'
              : `${(activePlan?.exercises || []).length} ${(activePlan?.exercises || []).length === 1 ? 'activity' : 'activities'}`}
          </span>
        </div>

        {/* 7-Day Responsive Grid - Perfectly Symmetrical, Zero Cutoff on Mobile */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DAYS.map(day => {
            const plan = plans.find(p => p.day === day);
            const isSelected = activeDay === day;
            const isToday = day === todayShort;
            const exCount = (plan?.exercises || []).length;
            const isRest = !plan?.type || plan.type.toUpperCase() === 'REST';

            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  triggerHaptic(5);
                  setActiveDay(day);
                }}
                className={`flex flex-col items-center justify-between py-2.5 px-0.5 sm:px-1 rounded-2xl transition-all relative border min-h-[74px] sm:min-h-[80px] ${
                  isSelected
                    ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.03] border-accent ring-2 ring-accent/20 z-10'
                    : isToday
                    ? 'bg-accent/10 dark:bg-accent/15 text-accent font-bold border-accent/40 hover:bg-accent/20'
                    : 'bg-bg-light dark:bg-bg-dark border-border-light/80 dark:border-border-dark/80 text-secondary-light dark:text-secondary-dark hover:border-accent/40 hover:bg-surface-light dark:hover:bg-surface-dark'
                }`}
                title={`${day}: ${plan?.type || 'Rest'} (${exCount} activities)`}
              >
                {/* Day Header with Today indicator */}
                <div className="flex items-center gap-1 justify-center w-full">
                  <span className={`text-[11px] sm:text-xs font-bold leading-none ${
                    isSelected ? 'text-white' : isToday ? 'text-accent' : 'text-primary-light dark:text-primary-dark'
                  }`}>
                    {day}
                  </span>
                  {isToday && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                  )}
                </div>

                {/* Split Type Badge */}
                <span className={`text-[9.5px] sm:text-[10px] font-mono font-bold tracking-tight uppercase truncate max-w-full my-1 ${
                  isSelected
                    ? 'text-white/95'
                    : isRest
                    ? 'text-muted-light dark:text-muted-dark font-medium'
                    : 'text-primary-light dark:text-primary-dark'
                }`}>
                  {getShortSplitLabel(plan?.type || 'REST')}
                </span>

                {/* Exercises Count */}
                <span className={`text-[8.5px] sm:text-[9px] font-mono leading-none ${
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

      {/* Workout Type */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 rounded-[28px] p-6 sm:p-7 shadow-sm space-y-4">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">Workout Type</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={activePlan.type}
            onChange={(e) => updatePlan({ ...activePlan, type: e.target.value })}
            placeholder="e.g. PUSH, PULL, LEGS, CARDIO, REST"
            className="flex-1 bg-transparent border border-border-light dark:border-border-dark rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {activePlan.type !== 'REST' && activePlan.type.trim() && (
            <button
              onClick={handleAutoGenerate}
              disabled={generating}
              className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} 
              <span className="hidden sm:inline">Auto-Generate</span>
            </button>
          )}
        </div>

        {/* Quick Split Presets with CARDIO */}
        <div>
          <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark mb-1.5">Quick Splits:</p>
          <div className="flex flex-wrap gap-1.5">
            {SPLIT_PRESETS.map(preset => {
              const isSelected = activePlan.type.toUpperCase() === preset;
              const isCardio = preset === 'CARDIO';
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    triggerHaptic(6);
                    if (isCardio && activePlan.exercises.length === 0) {
                      loadCardioCircuit();
                    } else {
                      updatePlan({ ...activePlan, type: preset });
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                    isSelected
                      ? (isCardio ? 'bg-rose-500 text-white' : 'bg-accent text-white')
                      : 'bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:border-accent/40'
                  }`}
                >
                  {isCardio && <HeartPulse size={12} />}
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cardio specific helper */}
        {activePlan.type.toUpperCase() === 'CARDIO' && (
          <div className="pt-2 border-t border-border-light dark:border-border-dark flex items-center justify-between">
            <span className="text-xs text-secondary-light dark:text-secondary-dark">Cardio Session</span>
            <button
              type="button"
              onClick={loadCardioCircuit}
              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
            >
              <HeartPulse size={12} /> Load Cardio Circuit Preset
            </button>
          </div>
        )}
      </div>

      {/* Exercises */}
      {activePlan.type !== 'REST' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Activities & Exercises ({activePlan.exercises.length})
            </span>
            <button
              type="button"
              onClick={addExercise}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <Plus size={14} /> Add Exercise
            </button>
          </div>

          {activePlan.exercises.length === 0 ? (
            <div className="p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-dashed border-border-light dark:border-border-dark text-center space-y-3">
              <p className="text-xs font-medium text-secondary-light dark:text-secondary-dark">
                No activities or exercises added for {activePlan.day} ({activePlan.type}) yet.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  disabled={generating}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Auto-Generate {activePlan.type} with AI</span>
                </button>
                <button
                  type="button"
                  onClick={addExercise}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-accent text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  <span>+ Add Exercise</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activePlan.exercises.map((ex, i) => (
                <div key={ex.id} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveExercise(i, -1)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30" disabled={i === 0}>
                      <GripVertical size={14} className="rotate-90" />
                    </button>
                  </div>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={ex.name}
                      onChange={(e) => updateExercise(i, 'name', e.target.value)}
                      placeholder="Exercise"
                      className="col-span-3 bg-transparent border border-border-light dark:border-border-dark rounded-lg px-2 py-1.5 text-base focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={ex.sets === 0 ? '' : ex.sets}
                        placeholder="0"
                        onFocus={e => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateExercise(i, 'sets', val === '' ? 0 : Math.max(0, parseInt(val) || 0));
                        }}
                        className="w-full bg-transparent border border-border-light dark:border-border-dark rounded-lg px-2 py-1.5 text-base text-center focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                      <span className="text-[10px] text-secondary-light dark:text-secondary-dark">sets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={ex.reps === 0 ? '' : ex.reps}
                        placeholder="0"
                        onFocus={e => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateExercise(i, 'reps', val === '' ? 0 : Math.max(0, parseInt(val) || 0));
                        }}
                        className="w-full bg-transparent border border-border-light dark:border-border-dark rounded-lg px-2 py-1.5 text-base text-center focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                      <span className="text-[10px] text-secondary-light dark:text-secondary-dark">reps</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={ex.weight === 0 ? '' : ex.weight}
                        placeholder="0"
                        onFocus={e => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateExercise(i, 'weight', val === '' ? 0 : Math.max(0, parseFloat(val) || 0));
                        }}
                        className="w-full bg-transparent border border-border-light dark:border-border-dark rounded-lg px-2 py-1.5 text-base text-center focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                      <span className="text-[10px] text-secondary-light dark:text-secondary-dark">kg</span>
                    </div>
                  </div>
                  <button onClick={() => removeExercise(i)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={addExercise}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border-light dark:border-border-dark text-sm font-medium text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                <Plus size={16} /> Add Exercise
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
