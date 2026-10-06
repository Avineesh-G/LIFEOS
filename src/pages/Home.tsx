import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  GroupedList,
  ListRow,
  Button,
  Ring,
  ProgressBar,
  Badge,
  MOTION_SPRINGS,
  House,
  Barbell,
  ForkKnife,
  Drop,
  Wallet,
  CheckCircle,
  Sun,
  CalendarDots,
  CalendarCheck,
  Plus,
  Flame,
  Brain,
  Microphone,
} from '../ui';

import { HomeCalendarSync } from '../components/home/HomeCalendarSync';

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
  const todayDisplay = useMemo(() => format(new Date(), 'EEE, d MMM'), []);
  const dayOfWeek = useMemo(() => format(new Date(), 'EEEE'), []);

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
    let water = 1.5;
    try {
      const saved = localStorage.getItem(`lifeos_water_${todayStr}`);
      if (saved) water = parseFloat(saved);
    } catch {}
    return {
      calories: cals,
      target,
      percent: Math.min(1, cals / target),
      waterLiters: water.toFixed(1),
    };
  }, [data.nutritionLogs, data.profile, todayStr]);

  // Quick add water
  const handleQuickAddWater = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const current = parseFloat(nutritionToday.waterLiters);
    const next = Math.round((current + 0.25) * 100) / 100;
    try {
      localStorage.setItem(`lifeos_water_${todayStr}`, next.toString());
    } catch {}
  };

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
      {/* ── Two-tone Page Greeting Header ── */}
      <div className="pt-1 pb-3 px-0.5 select-none">
        <p className="text-[13px] font-semibold text-[rgba(235,235,245,0.60)] tracking-tight">
          {greeting} · {todayDisplay}
        </p>
        <h1 className="text-[34px] leading-[41px] font-bold text-white tracking-tight mt-0.5">
          Today
        </h1>
      </div>

      <div className="flex flex-col gap-3.5 pb-2">
        {/* ── 1. Synced Calendar & Schedule (Replaces Focus Block) ── */}
        <HomeCalendarSync data={data} updateData={updateData} />

        {/* ── 2. 2x2 Bento Tiles (glass-tile) ── */}
        <div className="grid grid-cols-2 gap-3 select-none">
          {/* Tile A: Calories */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerHaptic('nav');
              navigate('/nutrition');
            }}
            className="glass-tile p-4 flex flex-col justify-between h-[124px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-bold text-white tabular-nums tracking-tight leading-none">
                {nutritionToday.calories}{' '}
                <span className="text-[12px] text-[rgba(235,235,245,0.45)] font-normal">kcal</span>
              </span>
              <Ring progress={nutritionToday.percent} size={34} strokeWidth={3.5} color="#FF9F0A">
                <ForkKnife size={15} className="text-[#FF9F0A]" weight="bold" />
              </Ring>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">Daily Fuel</div>
              <div className="text-[11px] text-[rgba(235,235,245,0.55)] mt-0.5">Calories today</div>
            </div>
          </motion.div>

          {/* Tile B: Spending */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerHaptic('nav');
              navigate('/spending');
            }}
            className="glass-tile p-4 flex flex-col justify-between h-[124px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-bold text-[#30D158] tabular-nums tracking-tight leading-none">
                Rs {totalSpentToday}
              </span>
              <div className="w-[34px] h-[34px] rounded-[11px] glass-flat text-[#30D158] flex items-center justify-center">
                <Wallet size={17} weight="bold" />
              </div>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">Daily Ledger</div>
              <div className="text-[11px] text-[rgba(235,235,245,0.55)] mt-0.5">Spent today</div>
            </div>
          </motion.div>

          {/* Tile C: Workout */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerHaptic('nav');
              navigate('/gym');
            }}
            className="glass-tile p-4 flex flex-col justify-between h-[124px] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[14px] font-bold truncate pr-1 leading-none ${
                  workoutToday.done ? 'text-[#30D158]' : 'text-[#FF453A]'
                }`}
              >
                {workoutToday.name}
              </span>
              <div className="w-[34px] h-[34px] rounded-[11px] glass-flat text-[#FF453A] flex items-center justify-center shrink-0">
                <Barbell size={17} weight="bold" />
              </div>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">
                {workoutToday.done ? 'Completed' : "Today's Split"}
              </div>
              <div className="text-[11px] text-[rgba(235,235,245,0.55)] mt-0.5">Gym routine</div>
            </div>
          </motion.div>

          {/* Tile D: Water */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              triggerHaptic('nav');
              navigate('/nutrition');
            }}
            className="glass-tile p-4 flex flex-col justify-between h-[124px] cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-bold text-[#64D2FF] tabular-nums tracking-tight leading-none">
                {nutritionToday.waterLiters}{' '}
                <span className="text-[12px] text-[rgba(235,235,245,0.45)] font-normal">L</span>
              </span>
              <div className="w-[34px] h-[34px] rounded-[11px] glass-flat text-[#64D2FF] flex items-center justify-center">
                <Drop size={17} weight="fill" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[13px] font-semibold text-white">Hydration</div>
                <div className="text-[11px] text-[rgba(235,235,245,0.55)] mt-0.5">Water logged</div>
              </div>
              <button
                type="button"
                onClick={handleQuickAddWater}
                className="px-2.5 py-1 rounded-full glass-flat text-[#64D2FF] text-[10.5px] font-bold active:scale-95 transition-all"
                title="Add 250ml"
              >
                +250ml
              </button>
            </div>
          </motion.div>
        </div>

        {/* ── 2. Tasks Grouped List ── */}
        <GroupedList
          header="Priority Tasks"
          footer={topTasks.length === 0 ? 'No pending tasks for today.' : undefined}
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
            title="Morning Plan"
            subtitle="Schedule, macros, split and daily targets"
            showChevron
            onClick={() => navigate('/morning')}
            showSeparator={false}
          />
        </GroupedList>

        {/* ── 5. Streak & Daily Intent (glass-card) ── */}
        <div className="glass-card p-4 flex items-center justify-between select-none">
          <Badge count={streakDays} label="Day Streak" points={12} color="#FF7A45" />
          <span className="text-[13px] text-[rgba(235,235,245,0.65)] italic font-medium truncate max-w-[210px] text-right">
            "Focus and execute."
          </span>
        </div>

        {/* ── 6. Quick Hub Power Tools ── */}
        <div className="flex flex-col gap-2 select-none pt-1">
          <div className="text-section-header px-1">
            Quick Hub
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('nav');
                navigate('/flow');
              }}
              className="glass-tile p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            >
              <div className="w-[34px] h-[34px] rounded-full glass-flat text-[#FF9F0A] flex items-center justify-center">
                <Flame size={18} weight="duotone" />
              </div>
              <span className="text-[11.5px] font-semibold text-white/90">Flow</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('nav');
                navigate('/timetable');
              }}
              className="glass-tile p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            >
              <div className="w-[34px] h-[34px] rounded-full glass-flat text-[#5E5CE6] flex items-center justify-center">
                <CalendarCheck size={18} weight="duotone" />
              </div>
              <span className="text-[11.5px] font-semibold text-white/90">Classes</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('nav');
                navigate('/recall');
              }}
              className="glass-tile p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            >
              <div className="w-[34px] h-[34px] rounded-full glass-flat text-[#BF5AF2] flex items-center justify-center">
                <Brain size={18} weight="duotone" />
              </div>
              <span className="text-[11.5px] font-semibold text-white/90">Recall</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('nav');
                navigate('/transcribe');
              }}
              className="glass-tile p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
            >
              <div className="w-[34px] h-[34px] rounded-full glass-flat text-[#64D2FF] flex items-center justify-center">
                <Microphone size={18} weight="duotone" />
              </div>
              <span className="text-[11.5px] font-semibold text-white/90">Voice</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

