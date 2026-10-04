import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, startOfDay } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  Button,
  Ring,
  ProgressBar,
  Badge,
  Skeleton,
  MOTION_SPRINGS,
  House,
  Barbell,
  ForkKnife,
  Drop,
  Timer,
  Wallet,
  CheckCircle,
  Sun,
  CalendarDots,
  Sparkle,
  Plus,
  CaretRight,
} from '../ui';

interface HomeProps {
  data: AppData;
  refresh?: () => Promise<AppData>;
  updateData?: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function Home({ data, refresh, updateData }: HomeProps) {
  const navigate = useNavigate();

  // Circadian Greeting
  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayDisplay = useMemo(() => format(new Date(), 'EEEE, d MMM'), []);
  const dayOfWeek = useMemo(() => format(new Date(), 'EEEE'), []);

  // Next class from Timetable
  const nextClass = useMemo(() => {
    const blocks = (data.timetable || [])
      .filter((b) => b.day === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    const nowTimeStr = format(new Date(), 'HH:mm');
    return blocks.find((b) => b.startTime > nowTimeStr) || blocks[0] || null;
  }, [data.timetable, dayOfWeek]);

  // Study hours today
  const { studyMinutes, studyHours, studyMins, studyPercent } = useMemo(() => {
    const sessions = (data.studySessions || []).filter((s) => s.date === todayStr);
    const mins = sessions.reduce((sum, s) => sum + s.duration, 0);
    const target = 180;
    return {
      studyMinutes: mins,
      studyHours: Math.floor(mins / 60),
      studyMins: mins % 60,
      studyPercent: Math.min(1, mins / target),
    };
  }, [data.studySessions, todayStr]);

  // Spending today
  const totalSpentToday = useMemo(() => {
    const expenses = (data.expenses || []).filter((e) => e.date === todayStr);
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [data.expenses, todayStr]);

  // Workout today
  const workoutToday = useMemo(() => {
    const log = (data.workoutLogs || []).find((w) => w.date === todayStr);
    if (log) return { name: log.type || 'Workout Done', done: true };
    const dayMap: Record<string, string> = {
      Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
      Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
    };
    const planned = (data.workoutPlans || []).find((p) => dayMap[p.day] === dayOfWeek);
    return {
      name: planned?.type || 'Rest Day',
      done: false,
    };
  }, [data.workoutLogs, data.workoutPlans, todayStr, dayOfWeek]);

  // Calories & Water
  const nutritionToday = useMemo(() => {
    const log = (data.nutritionLogs || []).find((n) => n.date === todayStr);
    const cals = log?.dailyTotal || 0;
    const target = data.profile?.currentCalorieTarget || 2200;
    return {
      calories: cals,
      target,
      percent: Math.min(1, cals / target),
      waterLiters: '2.5',
    };
  }, [data.nutritionLogs, data.profile, todayStr]);

  // Tasks top 3
  const topTasks = useMemo(() => {
    const tasks = (data.tasks || []).filter((t) => t.date === todayStr || !t.completed);
    return tasks.slice(0, 3);
  }, [data.tasks, todayStr]);

  const handleToggleTask = (taskId: string) => {
    if (!updateData) return;
    triggerHaptic('success');
    const updated = (data.tasks || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateData({ tasks: updated });
  };

  // Streak calculation
  const streakDays = useMemo(() => {
    return data.studySessions?.length ? Math.min(data.studySessions.length, 14) : 7;
  }, [data.studySessions]);

  return (
    <div className="w-full text-white selection:bg-[#0A84FF]/30">
      {/* Fluid Page Title & Greeting Header */}
      <div className="pt-1 pb-2.5 px-0.5 select-none">
        <p className="text-[12.5px] font-semibold text-[rgba(235,235,245,0.65)] tracking-tight">
          {greeting} • {todayDisplay}
        </p>
        <h1 className="text-[32px] leading-[38px] font-bold text-white tracking-[-0.02em] mt-0.5">
          Today
        </h1>
      </div>

      <div className="flex flex-col gap-3 pb-2">
        {/* ── 1. Hero Tile (r-hero 32, surface-1) ── */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          transition={MOTION_SPRINGS.default}
          className="w-full bg-[#1C1C1E] rounded-[32px] p-5 border border-white/[0.06] flex flex-col gap-4 shadow-xl select-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <div className="text-xs font-semibold text-[rgba(235,235,245,0.60)] tracking-tight flex items-center gap-1.5">
                <CalendarDots size={14} className="text-[#5E5CE6]" weight="bold" />
                <span>Next Scheduled Event</span>
              </div>
              {/* Two-tone headline */}
              <div className="text-xl font-bold tracking-tight mt-1 text-white">
                {nextClass ? (
                  <>
                    <span>{nextClass.subject}</span>
                    <span className="text-[rgba(235,235,245,0.50)] font-normal">
                      {' '}at {nextClass.startTime}
                    </span>
                  </>
                ) : (
                  <span>Focus Block</span>
                )}
              </div>
            </div>

            <Button
              variant="prominent"
              size="sm"
              tint="#0A84FF"
              onClick={() => {
                navigate('/study/timer');
              }}
            >
              Start timer
            </Button>
          </div>

          {/* Study Numeral & Progress Bar */}
          <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-medium text-[rgba(235,235,245,0.60)]">
                  Study today:
                </span>
                <span className="text-3xl font-bold text-[#64D2FF] tabular-nums tracking-tight">
                  {studyHours}:{studyMins < 10 ? `0${studyMins}` : studyMins}
                </span>
                <span className="text-xs text-[rgba(235,235,245,0.40)]">hrs</span>
              </div>
              <span className="text-xs text-[rgba(235,235,245,0.60)] font-medium">
                {Math.round(studyPercent * 100)}% of goal
              </span>
            </div>
            <ProgressBar progress={studyPercent} height={6} color="#64D2FF" />
          </div>
        </motion.div>

        {/* ── 2. 2-Column Metric Tiles (r-tile 24, surface-1) ── */}
        <div className="grid grid-cols-2 gap-3 select-none">
          {/* Tile A: Calories */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerHaptic('nav');
              navigate('/nutrition');
            }}
            className="bg-[#1C1C1E] rounded-[24px] p-4 border border-white/[0.06] flex flex-col justify-between h-[120px] cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white tabular-nums tracking-tight leading-none">
                {nutritionToday.calories}{' '}
                <span className="text-xs text-[rgba(235,235,245,0.40)] font-normal">kcal</span>
              </span>
              <Ring progress={nutritionToday.percent} size={36} strokeWidth={3.8} color="#FF9F0A">
                <ForkKnife size={16} className="text-[#FF9F0A]" weight="bold" />
              </Ring>
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Daily Fuel</div>
              <div className="text-[11px] text-[rgba(235,235,245,0.60)] mt-0.5">Calories today</div>
            </div>
          </motion.div>

          {/* Tile B: Spending */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerHaptic('nav');
              navigate('/spending');
            }}
            className="bg-[#1C1C1E] rounded-[24px] p-4 border border-white/[0.06] flex flex-col justify-between h-[120px] cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-[#30D158] tabular-nums">
                Rs {totalSpentToday}
              </span>
              <Wallet size={18} className="text-[#30D158]" weight="bold" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Daily Ledger</div>
              <div className="text-[11px] text-[rgba(235,235,245,0.60)] mt-0.5">Spent today</div>
            </div>
          </motion.div>

          {/* Tile C: Workout */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerHaptic('nav');
              navigate('/gym');
            }}
            className="bg-[#1C1C1E] rounded-[24px] p-4 border border-white/[0.06] flex flex-col justify-between h-[120px] cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-sm font-bold truncate pr-1 ${
                  workoutToday.done ? 'text-[#30D158]' : 'text-[#FF453A]'
                }`}
              >
                {workoutToday.name}
              </span>
              <Barbell size={18} className="text-[#FF453A] shrink-0" weight="bold" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">
                {workoutToday.done ? 'Completed' : 'Workout today'}
              </div>
              <div className="text-[11px] text-[rgba(235,235,245,0.60)] mt-0.5">Gym Split</div>
            </div>
          </motion.div>

          {/* Tile D: Water */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerHaptic('nav');
              navigate('/nutrition');
            }}
            className="bg-[#1C1C1E] rounded-[24px] p-4 border border-white/[0.06] flex flex-col justify-between h-[120px] cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#64D2FF] tabular-nums">
                {nutritionToday.waterLiters} L
              </span>
              <Drop size={18} className="text-[#64D2FF]" weight="fill" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Hydration</div>
              <div className="text-[11px] text-[rgba(235,235,245,0.60)] mt-0.5">Water logged</div>
            </div>
          </motion.div>
        </div>

        {/* ── 3. Tasks Grouped List ── */}
        <GroupedList
          header="Priority Tasks"
          footer={
            topTasks.length === 0 ? 'No pending tasks for today.' : undefined
          }
        >
          {topTasks.map((t) => (
            <ListRow
              key={t.id}
              icon={
                <CheckCircle
                  weight={t.completed ? 'fill' : 'regular'}
                  className={t.completed ? 'text-[#30D158]' : 'text-[rgba(235,235,245,0.40)]'}
                />
              }
              iconTint={t.completed ? '#30D158' : '#0A84FF'}
              title={
                <span className={t.completed ? 'line-through text-[rgba(235,235,245,0.40)]' : 'text-white'}>
                  {t.text}
                </span>
              }
              subtitle={t.subtask || 'Task'}
              onClick={() => handleToggleTask(t.id)}
            />
          ))}

          <ListRow
            icon={<Plus weight="bold" />}
            iconTint="#0A84FF"
            title={<span className="text-[#0A84FF] font-semibold">Add new task</span>}
            onClick={() => navigate('/tasks')}
            showSeparator={false}
          />
        </GroupedList>

        {/* ── 4. Morning Briefing Entry Row ── */}
        <GroupedList header="Daily Briefing">
          <ListRow
            icon={<Sun weight="bold" />}
            iconTint="#FF9F0A"
            title="Morning Battle Plan"
            subtitle="Schedule, macros, split and daily targets"
            showChevron
            onClick={() => navigate('/morning')}
            showSeparator={false}
          />
        </GroupedList>

        {/* ── 5. Streak & Quote Row ── */}
        <div className="flex items-center justify-between px-2 py-2 select-none">
          <Badge count={streakDays} label="Day Streak" points={12} color="#FF7A45" />
          <span className="text-[13px] text-[rgba(235,235,245,0.50)] italic font-medium truncate max-w-[200px]">
            "Focus and execute."
          </span>
        </div>
      </div>
    </div>
  );
}
