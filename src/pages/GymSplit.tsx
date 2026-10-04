import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CaretLeft,
  Plus,
  Trash,
  Barbell,
  Check,
  Flame,
} from '../ui/tokens/icons';
import { Toolbar } from '../ui/navigation/Toolbar';
import { Button } from '../ui/controls/Button';
import { GroupedList } from '../ui/grouped/GroupedList';
import { ListRow } from '../ui/grouped/ListRow';
import { TextField } from '../ui/controls/TextField';
import { Sheet } from '../ui/feedback/Sheet';
import { triggerHaptic } from '../utils/haptics';
import type { AppData, WorkoutPlan, Exercise } from '../types';

interface GymSplitProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SPLIT_PRESETS = ['PUSH', 'PULL', 'LEGS', 'UPPER', 'LOWER', 'CARDIO', 'REST'];

export default function GymSplit({ data, updateData }: GymSplitProps) {
  const navigate = useNavigate();

  const [selectedDay, setSelectedDay] = useState('Mon');
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExSets, setNewExSets] = useState('3');
  const [newExReps, setNewExReps] = useState('10');
  const [newExWeight, setNewExWeight] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const workoutPlans: WorkoutPlan[] = data.workoutPlans && data.workoutPlans.length > 0
    ? data.workoutPlans
    : DAYS.map((d) => ({
        day: d,
        type: d === 'Mon' ? 'PUSH' : d === 'Tue' ? 'PULL' : d === 'Wed' ? 'LEGS' : d === 'Fri' ? 'UPPER' : d === 'Sat' ? 'LOWER' : 'REST',
        exercises: [],
      }));

  const currentPlan = workoutPlans.find((p) => p.day === selectedDay) || {
    day: selectedDay,
    type: 'REST',
    exercises: [],
  };
  const currentDaySplit = currentPlan.type || 'REST';
  const currentExercises: Exercise[] = currentPlan.exercises || [];

  const handleUpdateSplitType = async (type: string) => {
    triggerHaptic('selection');
    const updatedPlans = workoutPlans.map((p) =>
      p.day === selectedDay ? { ...p, type } : p
    );
    if (!updatedPlans.some((p) => p.day === selectedDay)) {
      updatedPlans.push({ day: selectedDay, type, exercises: [] });
    }

    await updateData({
      workoutPlans: updatedPlans,
    });
  };

  const handleAddExercise = async () => {
    if (!newExName.trim()) return;
    triggerHaptic('medium');

    const newEx: Exercise = {
      id: `ex_${Date.now()}`,
      name: newExName.trim(),
      sets: parseInt(newExSets) || 3,
      reps: parseInt(newExReps) || 10,
      weight: parseFloat(newExWeight) || 0,
    };

    const updatedPlans = workoutPlans.map((p) => {
      if (p.day === selectedDay) {
        return {
          ...p,
          exercises: [...(p.exercises || []), newEx],
        };
      }
      return p;
    });

    await updateData({
      workoutPlans: updatedPlans,
    });

    setNewExName('');
    setNewExWeight('');
    setExerciseModalOpen(false);
    setFeedback(`Added ${newEx.name}`);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleDeleteExercise = async (exId: string) => {
    triggerHaptic('error');
    const updatedPlans = workoutPlans.map((p) => {
      if (p.day === selectedDay) {
        return {
          ...p,
          exercises: (p.exercises || []).filter((e) => e.id !== exId),
        };
      }
      return p;
    });

    await updateData({
      workoutPlans: updatedPlans,
    });
  };

  return (
    <div className="w-full flex flex-col pb-32">
      <Toolbar
        leading={
          <button
            type="button"
            onClick={() => navigate('/gym')}
            className="flex items-center gap-1 text-[#FF453A] font-semibold text-sm hover:opacity-80 active:scale-95 transition-all cursor-pointer"
          >
            <CaretLeft size={20} weight="bold" />
            <span>Gym</span>
          </button>
        }
        center={<span className="font-bold text-white text-base">Weekly Split</span>}
      />

      {/* Day Selector Pill Bar */}
      <div className="grid grid-cols-7 gap-1 p-1 bg-[#1C1C1E] rounded-[22px] border border-white/8 my-3">
        {DAYS.map((day) => {
          const isSelected = day === selectedDay;
          const planItem = workoutPlans.find((p) => p.day === day);
          const type = planItem?.type || 'REST';

          return (
            <button
              key={day}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setSelectedDay(day);
              }}
              className={`py-2 px-1 rounded-[18px] flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#FF453A] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span className="text-[11px] font-bold uppercase">{day}</span>
              <span
                className={`text-[9px] font-semibold truncate w-full text-center ${
                  isSelected ? 'text-white/90' : 'text-white/40'
                }`}
              >
                {type}
              </span>
            </button>
          );
        })}
      </div>

      {/* Split Type Selector */}
      <GroupedList header="FOCUS MUSCLE / SPLIT TYPE">
        <div className="p-3 flex flex-wrap gap-2">
          {SPLIT_PRESETS.map((preset) => {
            const isActive = currentDaySplit.toUpperCase() === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleUpdateSplitType(preset)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FF453A] text-white shadow-md'
                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </GroupedList>

      {/* Exercise Routine List */}
      <div className="flex items-center justify-between px-2 pt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-white/50">
          {currentDaySplit} Routine ({currentExercises.length})
        </span>
        {currentDaySplit !== 'REST' && (
          <Button
            variant="glass"
            size="sm"
            icon={<Plus size={14} weight="bold" />}
            onClick={() => setExerciseModalOpen(true)}
          >
            Add Exercise
          </Button>
        )}
      </div>

      {currentDaySplit === 'REST' ? (
        <div className="my-6 p-8 rounded-[28px] bg-[#1C1C1E] border border-white/8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/50 mx-auto">
            <Flame size={24} weight="duotone" />
          </div>
          <h3 className="text-base font-bold text-white">Rest & Recovery Day</h3>
          <p className="text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
            Muscles rebuild and grow during rest periods. Prioritize hydration, sleep, and nutrition.
          </p>
        </div>
      ) : currentExercises.length === 0 ? (
        <div className="my-6 p-8 rounded-[28px] bg-[#1C1C1E] border border-white/8 text-center space-y-3">
          <Barbell size={32} weight="duotone" className="text-[#FF453A] mx-auto" />
          <h3 className="text-base font-bold text-white">No exercises planned for {currentDaySplit}</h3>
          <p className="text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
            Tap the button below to add target exercises, sets, and weights.
          </p>
          <Button
            variant="prominent"
            tint="#FF453A"
            icon={<Plus size={16} weight="bold" />}
            onClick={() => setExerciseModalOpen(true)}
          >
            Add First Exercise
          </Button>
        </div>
      ) : (
        <GroupedList className="mt-3">
          {currentExercises.map((ex, i) => (
            <ListRow
              key={ex.id || i}
              icon={<Barbell size={18} weight="duotone" />}
              iconTint="#FF453A"
              title={ex.name}
              subtitle={`${ex.sets || 3} sets × ${ex.reps || 10} reps${
                ex.weight ? ` • ${ex.weight} kg` : ''
              }`}
              trailing={
                <button
                  type="button"
                  onClick={() => handleDeleteExercise(ex.id)}
                  className="p-1.5 rounded-full text-white/30 hover:text-[#FF453A] transition-colors cursor-pointer"
                >
                  <Trash size={16} />
                </button>
              }
              showSeparator={i < currentExercises.length - 1}
            />
          ))}
        </GroupedList>
      )}

      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-20 inset-x-4 max-w-xs mx-auto p-3 rounded-2xl bg-white text-black font-semibold text-xs shadow-2xl flex items-center justify-center gap-2 z-50">
          <Check size={16} weight="bold" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Add Exercise Modal Sheet */}
      <Sheet
        isOpen={exerciseModalOpen}
        onClose={() => setExerciseModalOpen(false)}
        title={`Add Exercise to ${currentDaySplit}`}
      >
        <div className="space-y-4 py-2 text-white">
          <TextField
            label="Exercise Name"
            value={newExName}
            onChange={(e) => setNewExName(e.target.value)}
            placeholder="e.g. Incline Dumbbell Press"
          />

          <div className="grid grid-cols-3 gap-2">
            <TextField
              label="Sets"
              value={newExSets}
              onChange={(e) => setNewExSets(e.target.value)}
              type="number"
            />
            <TextField
              label="Reps"
              value={newExReps}
              onChange={(e) => setNewExReps(e.target.value)}
              placeholder="10"
            />
            <TextField
              label="Weight (kg)"
              value={newExWeight}
              onChange={(e) => setNewExWeight(e.target.value)}
              type="number"
              placeholder="0"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="prominent"
              tint="#FF453A"
              onClick={handleAddExercise}
            >
              Add Exercise
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
