import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, GripVertical, Save, Sparkles, Loader2, HeartPulse } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { getAiWorkoutPlan, GEMINI_API_KEY } from '../utils/geminiCoach';
import type { AppData, WorkoutPlan, Exercise } from '../types';

interface GymSplitProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SPLIT_PRESETS = ['PUSH', 'PULL', 'LEGS', 'CARDIO', 'UPPER', 'LOWER', 'FULL BODY', 'REST'];

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
  const [activeDay, setActiveDay] = useState('Mon');
  const [generating, setGenerating] = useState(false);
  const activePlan = plans.find(p => p.day === activeDay)!;

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

      {/* Day Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => {
              triggerHaptic(5);
              setActiveDay(day);
            }}
            className={`px-4 py-2.5 rounded-[18px] text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
              activeDay === day 
                ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light shadow-sm' 
                : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:border-accent/40'
            }`}
          >
            {day}
          </button>
        ))}
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
          <div className="text-xs font-semibold uppercase tracking-wider text-secondary-light dark:text-secondary-dark">Exercises</div>
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
  );
}
