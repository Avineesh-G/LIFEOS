import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppData, WorkoutLog } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { triggerConfettiBurst } from '../utils/confetti';
import { handleAppBack } from '../utils/backNavigation';
import {
  LargeTitleHeader,
  Button,
  Stepper,
  Ring,
  Badge,
  Sheet,
  GroupedList,
  ListRow,
  MOTION_SPRINGS,
  Barbell,
  Check,
  Play,
  Pause,
  ArrowClockwise,
  CaretLeft,
} from '../ui';

interface GymWorkoutProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function GymWorkout({ data, updateData }: GymWorkoutProps) {
  const navigate = useNavigate();
  const todayDay = format(new Date(), 'EEEE');
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  // Active workout plan
  const activePlan = useMemo(() => {
    const dayMap: Record<string, string> = {
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
      Sunday: 'Sun',
    };
    const short = dayMap[todayDay] || 'Mon';
    return (
      (data.workoutPlans || []).find((p) => p.day === short) || {
        day: short,
        type: 'Chest & Triceps',
        exercises: [
          { id: '1', name: 'Bench Press', sets: 4, reps: 8, weight: 60 },
          { id: '2', name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 24 },
          { id: '3', name: 'Cable Fly', sets: 3, reps: 12, weight: 22.5 },
        ],
      }
    );
  }, [data.workoutPlans, todayDay]);

  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);

  const currentExercise = activePlan.exercises[currentExIndex] || {
    name: 'Bench Press',
    sets: 4,
    reps: 8,
    weight: 60,
  };

  const [weight, setWeight] = useState(currentExercise.weight || 60);
  const [reps, setReps] = useState(currentExercise.reps || 8);

  // Sync state when exercise changes
  useEffect(() => {
    setWeight(currentExercise.weight || 60);
    setReps(currentExercise.reps || 8);
  }, [currentExIndex, currentExercise]);

  // Rest Timer State
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const [restDuration, setRestDuration] = useState(60);

  // Completed sets tracker
  const [completedSets, setCompletedSets] = useState<
    Record<string, Array<{ reps: number; weight: number }>>
  >({});

  const [isListSheetOpen, setIsListSheetOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Rest timer interval with haptic cues at 10s, 3s, 0s
  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          triggerHaptic('milestone');
          setIsResting(false);
          return 0;
        }
        if (prev === 10 || prev === 3 || prev === 2) {
          triggerHaptic('light');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isResting]);

  const handleCompleteSet = () => {
    triggerHaptic('success');
    const exName = currentExercise.name;
    const newSets = [...(completedSets[exName] || []), { reps, weight }];
    setCompletedSets((prev) => ({ ...prev, [exName]: newSets }));

    // Start rest timer (60s)
    setRestDuration(60);
    setRestSeconds(60);
    setIsResting(true);

    if (currentSetIndex + 1 < currentExercise.sets) {
      setCurrentSetIndex(currentSetIndex + 1);
    } else if (currentExIndex + 1 < activePlan.exercises.length) {
      setCurrentExIndex(currentExIndex + 1);
      setCurrentSetIndex(0);
    } else {
      // Finished all exercises
      handleFinishWorkout();
    }
  };

  const handleFinishWorkout = async () => {
    triggerHaptic('milestone');
    triggerConfettiBurst();

    // Create WorkoutLog entry
    const newLog: WorkoutLog = {
      id: `log_${Date.now()}`,
      date: todayDate,
      day: todayDay,
      type: activePlan.type,
      isSaved: true,
      exercises: activePlan.exercises.map((ex) => ({
        name: ex.name,
        sets: (completedSets[ex.name] || []).map((s) => ({
          reps: s.reps,
          weight: s.weight,
          completed: true,
        })),
      })),
    };

    const updatedLogs = [
      newLog,
      ...(data.workoutLogs || []).filter((w) => w.date !== todayDate),
    ];
    await updateData({ workoutLogs: updatedLogs });
    setIsSummaryOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-black text-white flex flex-col justify-between p-4 selection:bg-[#FF453A]/30">
      {/* Top Header */}
      <div className="pt-[env(safe-area-inset-top,12px)] flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleAppBack(navigate)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:bg-white/20"
        >
          <CaretLeft size={20} weight="bold" />
        </button>

        <span className="text-sm font-bold text-[rgba(235,235,245,0.60)]">
          LIVE WORKOUT HUD
        </span>

        <button
          type="button"
          onClick={() => setIsListSheetOpen(true)}
          className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold text-white active:bg-white/20"
        >
          Exercises ({currentExIndex + 1}/{activePlan.exercises.length || 1})
        </button>
      </div>

      {/* Center Immersive HUD Display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 py-6 select-none max-w-sm mx-auto w-full">
        {/* Exercise Title & Set Status */}
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {currentExercise.name}
          </h1>
          <p className="text-sm font-semibold text-[rgba(235,235,245,0.60)]">
            Set {currentSetIndex + 1} of {currentExercise.sets}
          </p>
        </div>

        {/* Two Large Display Steppers */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {/* Weight Stepper */}
          <div className="glass-card rounded-[28px] p-4 flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-[rgba(235,235,245,0.50)]">
              WEIGHT (KG)
            </span>
            <Stepper
              value={weight}
              onChange={setWeight}
              step={2.5}
              tint="#FF453A"
              size="lg"
            />
          </div>

          {/* Reps Stepper */}
          <div className="glass-card rounded-[28px] p-4 flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-[rgba(235,235,245,0.50)]">
              REPS
            </span>
            <Stepper
              value={reps}
              onChange={setReps}
              step={1}
              tint="#FF453A"
              size="lg"
            />
          </div>
        </div>

        {/* Ghost text for previous set */}
        <div className="text-xs text-[rgba(235,235,245,0.40)] font-medium text-center">
          Last set: {weight} kg × {reps} reps
        </div>

        {/* Circular Rest Timer Overlay (when active) */}
        {isResting && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-2 p-4 rounded-[28px] glass-card w-full"
          >
            <div className="text-xs font-bold text-[#FF453A] tracking-wider uppercase">
              Rest Timer
            </div>
            <Ring
              progress={restSeconds / restDuration}
              size={84}
              strokeWidth={7}
              color="#FF453A"
            >
              <span className="text-2xl font-bold tabular-nums text-white">
                {restSeconds}s
              </span>
            </Ring>
            <button
              type="button"
              onClick={() => setIsResting(false)}
              className="text-xs text-[rgba(235,235,245,0.60)] underline hover:text-white pt-1"
            >
              Skip rest
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="flex flex-col gap-2 pb-[env(safe-area-inset-bottom,16px)] max-w-sm mx-auto w-full">
        <Button
          variant="prominent"
          tint="#FF453A"
          size="lg"
          onClick={handleCompleteSet}
          icon={<Check size={20} weight="bold" />}
        >
          Complete Set {currentSetIndex + 1}
        </Button>

        <Button
          variant="plain"
          tint="rgba(235,235,245,0.60)"
          size="md"
          onClick={handleFinishWorkout}
        >
          Finish Workout Early
        </Button>
      </div>

      {/* Exercise List Sheet */}
      <Sheet
        isOpen={isListSheetOpen}
        onClose={() => setIsListSheetOpen(false)}
        detent="half"
        title="Workout Routine"
      >
        <GroupedList>
          {activePlan.exercises.map((ex, idx) => {
            const isCur = idx === currentExIndex;
            const completedCount = (completedSets[ex.name] || []).length;

            return (
              <ListRow
                key={ex.id}
                icon={<Barbell weight="bold" />}
                iconTint={isCur ? '#FF453A' : '#30D158'}
                title={ex.name}
                subtitle={`${ex.sets} sets • ${ex.weight} kg`}
                trailing={
                  completedCount >= ex.sets ? (
                    <span className="text-[#30D158] font-bold text-xs">DONE</span>
                  ) : (
                    `${completedCount}/${ex.sets}`
                  )
                }
                onClick={() => {
                  setCurrentExIndex(idx);
                  setCurrentSetIndex(0);
                  setIsListSheetOpen(false);
                }}
              />
            );
          })}
        </GroupedList>
      </Sheet>

      {/* Workout Complete Summary Sheet */}
      <Sheet
        isOpen={isSummaryOpen}
        onClose={() => navigate('/gym')}
        detent="half"
        title="Workout Complete!"
      >
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <Badge count="PR" label="Workout Finished" points={12} color="#FF7A45" />
          <h2 className="text-2xl font-bold text-white">{activePlan.type}</h2>
          <p className="text-sm text-[rgba(235,235,245,0.60)]">
            Great job! Your sets, reps, and weights have been logged to History.
          </p>
          <div className="w-full pt-4">
            <Button
              variant="prominent"
              tint="#FF453A"
              className="w-full"
              onClick={() => navigate('/gym')}
            >
              Return to Gym Hub
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
