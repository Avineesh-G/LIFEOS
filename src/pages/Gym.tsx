import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  Button,
  EmptyState,
  ContextMenu,
  ProgressBar,
  MOTION_SPRINGS,
  Barbell,
  Play,
  Sparkle,
  Check,
  SlidersHorizontal,
} from '../ui';

interface GymProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const SHORT_DAYS = [
  { short: 'Mon', initial: 'M' },
  { short: 'Tue', initial: 'T' },
  { short: 'Wed', initial: 'W' },
  { short: 'Thu', initial: 'T' },
  { short: 'Fri', initial: 'F' },
  { short: 'Sat', initial: 'S' },
  { short: 'Sun', initial: 'S' },
];

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
            : `${todayName} · ${activePlan.exercises?.length || 0} exercises`
        }
        tint="#FF453A"
        actions={
          <Button
            variant="glass"
            tint="#FF453A"
            size="sm"
            onClick={() => {
              triggerHaptic('nav');
              navigate('/gym/split');
            }}
            icon={<SlidersHorizontal size={15} weight="bold" />}
          >
            Split
          </Button>
        }
      />

      <div className="flex flex-col gap-3.5 pb-2">
        {/* ── 7-Day Strip with Workout Dots ── */}
        <div className="glass-card p-1.5 flex items-center justify-between rounded-[20px] select-none">
          {SHORT_DAYS.map((d) => {
            const isSelected = selectedDay === d.short;
            const isToday = todayShort === d.short;

            return (
              <button
                key={d.short}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedDay(d.short);
                }}
                className={`relative flex-1 py-2 flex flex-col items-center justify-center rounded-[14px] transition-all cursor-pointer ${
                  isSelected
                    ? 'glass-tile text-[#FF453A] shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="text-[12px] font-bold tracking-tight">{d.short}</span>
                {isToday && (
                  <span
                    className={`w-1 h-1 rounded-full mt-1 ${
                      isSelected ? 'bg-[#FF453A]' : 'bg-[#FF453A]/50'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── 1. Hero Summary Tile (glass-hero with Coral glow) ── */}
        <motion.div
          whileTap={{ scale: 0.985 }}
          transition={MOTION_SPRINGS.default}
          style={{ '--hero-accent': '#FF453A' } as React.CSSProperties}
          className="glass-hero p-5 flex flex-col gap-4 select-none min-h-[140px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <div className="text-[11.5px] font-semibold text-[rgba(235,235,245,0.65)] uppercase tracking-wider">
                {isTodayActive ? 'Scheduled for today' : `Planned for ${selectedDay}`}
              </div>
              {/* Two-tone headline */}
              <div className="text-[22px] font-bold tracking-tight text-white mt-1">
                <span>{activePlan.type || 'Rest Day'}</span>
                <span className="text-[rgba(235,235,245,0.45)] font-normal text-[17px]">
                  {isTodayActive ? ' today' : ''}
                </span>
              </div>
            </div>

            {isCompletedToday ? (
              <div className="px-3 py-1.5 rounded-full glass-flat text-[#30D158] font-bold text-xs flex items-center gap-1">
                <Check size={14} weight="bold" />
                <span>Finished</span>
              </div>
            ) : (
              <Button
                variant="prominent"
                tint="#FF453A"
                size="md"
                onClick={handleStartWorkout}
                icon={<Play size={15} weight="fill" />}
              >
                Start workout
              </Button>
            )}
          </div>

          {/* Muscle Chips & Estimated Duration (glass-flat) */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="glass-flat px-3 py-1 text-[12px] font-semibold text-white">
              {activePlan.type || 'Recovery'}
            </span>
            <span className="glass-flat px-3 py-1 text-[12px] font-semibold text-white">
              ~{Math.max(15, (activePlan.exercises?.length || 0) * 9)} min
            </span>
            <span className="glass-flat px-3 py-1 text-[12px] font-semibold text-[rgba(235,235,245,0.65)]">
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

        {/* ── 3. Weekly Muscle Volume Tile (glass-card) ── */}
        <div className="glass-card p-4 flex flex-col gap-3 select-none">
          <div className="text-section-header">
            WEEKLY MUSCLE VOLUME (SETS)
          </div>
          <div className="flex flex-col gap-3 pt-1">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-white">Chest</span>
                <span className="text-[rgba(235,235,245,0.60)]">14 / 16 sets</span>
              </div>
              <ProgressBar progress={0.88} height={5} color="#FF453A" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-white">Back</span>
                <span className="text-[rgba(235,235,245,0.60)]">12 / 16 sets</span>
              </div>
              <ProgressBar progress={0.75} height={5} color="#FF453A" />
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-white">Legs</span>
                <span className="text-[rgba(235,235,245,0.60)]">10 / 14 sets</span>
              </div>
              <ProgressBar progress={0.71} height={5} color="#FF453A" />
            </div>
          </div>
        </div>

        {/* ── 4. AI Split Suggestion (glass-card) ── */}
        <div className="glass-card p-4 flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[12px] glass-flat flex items-center justify-center text-[#BF5AF2] shrink-0">
              <Sparkle size={18} weight="fill" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-[14px] font-bold text-white truncate">
                AI Split Optimizer
              </div>
              <div className="text-[12px] text-[rgba(235,235,245,0.60)] truncate">
                Progressive overload recommendation available
              </div>
            </div>
          </div>

          <Button
            variant="glass"
            tint="#BF5AF2"
            size="sm"
            onClick={() => {
              triggerHaptic('nav');
              navigate('/gym/split');
            }}
          >
            Review
          </Button>
        </div>
      </div>
    </div>
  );
}

