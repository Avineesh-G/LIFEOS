import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, GripVertical, Save, Sparkles, Loader2 } from 'lucide-react';
import { getAiWorkoutPlan, GEMINI_API_KEY } from '../utils/geminiCoach';
import type { AppData, WorkoutPlan, Exercise } from '../types';

interface GymSplitProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
    const newEx: Exercise = { id: crypto.randomUUID(), name: 'New Exercise', sets: 3, reps: 10, weight: 0 };
    updatePlan({ ...activePlan, exercises: [...activePlan.exercises, newEx] });
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...activePlan.exercises];
    updated[index] = { ...updated[index], [field]: value };
    updatePlan({ ...activePlan, exercises: updated });
  };

  const removeExercise = (index: number) => {
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
    await updateData({ workoutPlans: plans });
    navigate('/gym');
  };

  const handleAutoGenerate = async () => {
    if (activePlan.type === 'REST' || !activePlan.type.trim()) return;
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
    } catch (err) {
      console.error(err);
      alert('Failed to generate workout plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/gym')} className="flex items-center gap-2 text-sm text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <button onClick={handleSave} className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">
          <Save size={16} /> Save
        </button>
      </div>

      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Weekly Split</h1>

      {/* Day Tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeDay === day 
                ? 'bg-accent text-white' 
                : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Workout Type */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-2">Workout Type</label>
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
                    value={ex.sets}
                    onChange={(e) => updateExercise(i, 'sets', parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent border border-border-light dark:border-border-dark rounded-lg px-2 py-1.5 text-base text-center focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <span className="text-[10px] text-secondary-light dark:text-secondary-dark">sets</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, 'reps', parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent border border-border-light dark:border-border-dark rounded-lg px-2 py-1.5 text-base text-center focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <span className="text-[10px] text-secondary-light dark:text-secondary-dark">reps</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={ex.weight}
                    onChange={(e) => updateExercise(i, 'weight', parseInt(e.target.value) || 0)}
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
