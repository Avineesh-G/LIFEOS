import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData, Exercise } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  Button,
  Segmented,
  EmptyState,
  ContextMenu,
  ProgressBar,
  MOTION_SPRINGS,
  Barbell,
  Play,
  PencilSimple,
  Sparkle,
  Plus,
  Check,
  CaretRight,
  SlidersHorizontal,
} from '../ui';

interface GymProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_MAP: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

export default function Gym({ data, updateData }: GymProps) {
  const navigate = useNavigate();
  const todayName = format(new Date(), 'EEEE');
  const todayShort = DAY_MAP[todayName] || 'Mon';
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [selectedDay, setSelectedDay] = useState(todayShort);

  const activePlan = useMemo(() => {
    return (data.workoutPlans || []).find((p) => p.day === selectedDay) || {
      day: selectedDay,
      type: 'Push Day',
      exercises: [],
    };
  }, [data.workoutPlans, selectedDay]);

  const isTodayActive = selectedDay === todayShort;
  const todayLog = (data.workoutLogs || []).find((w) => w.date === todayStr);
  const isCompletedToday = Boolean(todayLog?.isSaved);

  const handleStartWorkout = () => {
    triggerHaptic('save');
    navigate('/gym/workout');
  };

  return (
    <div className="w-full text-white selection:bg-[#FF453A]/30">
      <LargeTitleHeader
        title="Gym"
        subtitle={
          isCompletedToday
            ? 'Workout completed today'
            : `${activePlan.type || 'Workout'} • ${activePlan.exercises?.length || 0} exercises`
        }
        tint="#FF453A"
        onBack={() => navigate('/')}
        actions={
          <Button
            variant="glass"
            tint="#FF453A"
            size="sm"
            onClick={() => navigate('/gym/split')}
            icon={<SlidersHorizontal size={16} weight="bold" />}
          >
            Split
          </Button>
        }
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* Week Strip Segmented Glass */}
        <Segmented
          options={SHORT_DAYS.map((d) => ({
            value: d,
            label: d,
          }))}
          value={selectedDay}
          onChange={setSelectedDay}
          tint="#FF453A"
        />

        {/* ── 1. Hero Summary Tile (r-hero 32, surface-1) ── */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={MOTION_SPRINGS.default}
          className="w-full bg-[#1C1C1E] rounded-[32px] p-5 border border-white/[0.06] flex flex-col gap-4 shadow-xl select-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <div className="text-xs font-semibold text-[rgba(235,235,245,0.60)] tracking-tight">
                {isTodayActive ? 'Scheduled for today' : `Planned for ${selectedDay}`}
              </div>
              {/* Two-tone headline */}
              <div className="text-2xl font-bold tracking-tight text-white mt-1">
                <span>{activePlan.type || 'Rest Day'}</span>
                <span className="text-[rgba(235,235,245,0.50)] font-normal text-lg">
                  {isTodayActive ? ' today' : ''}
                </span>
              </div>
            </div>

            {isCompletedToday ? (
              <div className="px-3 py-1.5 rounded-full bg-[#30D158]/20 border border-[#30D158]/40 text-[#30D158] font-bold text-xs flex items-center gap-1">
                <Check size={14} weight="bold" />
                <span>Finished</span>
              </div>
            ) : (
              <Button
                variant="prominent"
                tint="#FF453A"
                size="md"
                onClick={handleStartWorkout}
                icon={<Play size={16} weight="fill" />}
              >
                Start workout
              </Button>
            )}
          </div>

          {/* Muscle Chips & Estimated Duration */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/[0.06]">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2C2C2E] text-white">
              Chest & Triceps
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2C2C2E] text-white">
              ~55 min
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2C2C2E] text-[rgba(235,235,245,0.60)]">
              {activePlan.exercises?.length || 0} Exercises
            </span>
          </div>
        </motion.div>

        {/* ── 2. Exercises Grouped List ── */}
        {(activePlan.exercises || []).length === 0 ? (
          <EmptyState
            icon={<Barbell weight="bold" />}
            title="Rest Day"
            description="No exercises planned for this day. Rest and recover."
            actionLabel="Customize Split"
            onAction={() => navigate('/gym/split')}
            tint="#FF453A"
          />
        ) : (
          <GroupedList
            header="Exercises Routine"
            footer="Tap exercise to view history or long-press for options"
          >
            {activePlan.exercises.map((ex) => (
              <ContextMenu
                key={ex.id}
                items={[
                  {
                    key: 'history',
                    label: 'Exercise History',
                    onClick: () =>
                      navigate(`/gym/history/${encodeURIComponent(ex.name)}`),
                  },
                  {
                    key: 'edit',
                    label: 'Edit Exercise',
                    onClick: () => navigate('/gym/split'),
                  },
                ]}
              >
                <ListRow
                  icon={<Barbell weight="bold" />}
                  iconTint="#FF453A"
                  title={ex.name}
                  subtitle={
                    ex.rest ? `Rest: ${ex.rest}` : `Target: ${ex.weight || 0} kg`
                  }
                  trailing={`${ex.sets} × ${ex.reps}`}
                  showChevron
                  onClick={() =>
                    navigate(`/gym/history/${encodeURIComponent(ex.name)}`)
                  }
                />
              </ContextMenu>
            ))}
          </GroupedList>
        )}

        {/* ── 3. Weekly Muscle Volume Tile ── */}
        <div className="w-full bg-[#1C1C1E] rounded-[26px] p-4 border border-white/[0.06] flex flex-col gap-3 select-none">
          <div className="text-xs font-bold text-[rgba(235,235,245,0.60)]">
            WEEKLY MUSCLE VOLUME (SETS)
          </div>
          <div className="flex flex-col gap-2.5">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Chest</span>
                <span className="text-[rgba(235,235,245,0.60)]">14 / 16 sets</span>
              </div>
              <ProgressBar progress={0.88} height={5} color="#FF453A" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Back</span>
                <span className="text-[rgba(235,235,245,0.60)]">12 / 16 sets</span>
              </div>
              <ProgressBar progress={0.75} height={5} color="#FF453A" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Legs</span>
                <span className="text-[rgba(235,235,245,0.60)]">10 / 14 sets</span>
              </div>
              <ProgressBar progress={0.71} height={5} color="#FF453A" />
            </div>
          </div>
        </div>

        {/* ── 4. AI Split Suggestion ── */}
        <div className="w-full p-4 rounded-[22px] bg-[#1C1C1E] border border-white/[0.06] flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[10px] bg-[#BF5AF2]/20 flex items-center justify-center text-[#BF5AF2] shrink-0">
              <Sparkle weight="fill" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-bold text-white truncate">
                AI Split Optimizer
              </div>
              <div className="text-xs text-[rgba(235,235,245,0.60)] truncate">
                Progressive overload recommendation available
              </div>
            </div>
          </div>

          <Button
            variant="plain"
            tint="#BF5AF2"
            size="sm"
            onClick={() => navigate('/gym/split')}
          >
            Review
          </Button>
        </div>
      </div>
    </div>
  );
}
