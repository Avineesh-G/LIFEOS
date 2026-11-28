import { auth } from '../firebase';
import React, { useState, useMemo, useCallback, startTransition } from 'react';
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
  CalendarDots,
  CalendarCheck,
  Plus,
} from '../ui';

import { HomeCalendarSync } from '../components/home/HomeCalendarSync';
import HomeStreakQuotesCard from '../components/home/HomeStreakQuotesCard';
import { CheckSquare, NotePencil, Receipt } from '../ui/tokens/icons';
import { useUserProfile } from '../utils/userProfileCache';
import { prefetchRoute } from '../utils/routePrefetch';

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

  const [waterVersion, setWaterVersion] = useState(0);

  // Calories & Water
  const nutritionToday = useMemo(() => {
    const log = (data.nutritionLogs || []).find((n) => n.date === todayStr);
    const cals = log?.dailyTotal || 0;
    const target = data.profile?.currentCalorieTarget || 2200;
    let water = 1.5;
    try {
      const saved = localStorage.getItem(`lifeos_water_${auth.currentUser?.uid || 'guest'}_${todayStr}`);
      if (saved) water = parseFloat(saved);
    } catch {}
    return {
      calories: cals,
      target,
      percent: Math.min(1, cals / target),
      waterLiters: water.toFixed(1),
    };
  }, [data.nutritionLogs, data.profile, todayStr, waterVersion]);

  // Quick add water with instant optimistic UI refresh
  const handleQuickAddWater = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('light');
    const current = parseFloat(nutritionToday.waterLiters);
    const next = Math.round((current + 0.25) * 100) / 100;
    try {
      localStorage.setItem(`lifeos_water_${auth.currentUser?.uid || 'guest'}_${todayStr}`, next.toString());
    } catch {}
    setWaterVersion((v) => v + 1);
  }, [nutritionToday.waterLiters, todayStr]);

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

  const userProfile = useUserProfile();
  const userName = useMemo(() => {
    return (
      userProfile.displayName?.trim() ||
      auth.currentUser?.displayName?.trim() ||
      userProfile.email?.split('@')[0]?.trim() ||
      auth.currentUser?.email?.split('@')[0]?.trim() ||
      'Avineesh'
    );
  }, [userProfile]);

  return (
    <div className="w-full text-white">
      {/* ── Two-tone Page Greeting Header (Pure White Name + Crisp Accent Date) ── */}
      <div className="pt-1 pb-3 px-0.5 select-none">
        <p
          className="text-[13px] font-semibold tracking-tight flex items-center gap-1.5"
          style={{ color: 'color-mix(in srgb, var(--app-accent-text, #64D2FF) 50%, rgba(242, 242, 247, 0.85))' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--app-accent-text, #64D2FF)' }}
          />
          <span>{greeting} · {todayDisplay}</span>
        </p>
        <h1 className="text-[34px] leading-[41px] font-bold text-white tracking-tight mt-0.5 truncate">
          {userName}
        </h1>
      </div>

      {/* ── Daily Motivation Quotes Marquee ── */}
      <div className="mb-3.5">
        <HomeStreakQuotesCard />
      </div>

      <div className="flex flex-col gap-3.5 pb-2">
        {/* ── 1. Synced Calendar & Schedule ── */}
        <HomeCalendarSync data={data} updateData={updateData} />

        {/* ── 2. 2x2 Bento Tiles (Unified Single Theme Color + Pure iOS Liquid Glass) ── */}
        <div className="grid grid-cols-2 gap-3 select-none">
          {/* Tile A: Calories */}
          <div
            onClick={() => {
              triggerHaptic('medium');
              startTransition(() => {
                navigate('/nutrition');
              });
            }}
            className="glass-tile p-4 flex flex-col justify-between h-[124px] cursor-pointer select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-bold text-white tabular-nums tracking-tight leading-none">
                {nutritionToday.calories}{' '}
                <span className="text-[12px] text-[rgba(235,235,245,0.58)] font-normal">kcal</span>
              </span>
              <Ring progress={nutritionToday.percent} size={34} strokeWidth={3.5}>
                <ForkKnife size={15} style={{ color: 'var(--app-accent-text, #64D2FF)' }} weight="bold" />
              </Ring>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">Daily Fuel</div>
              <div className="text-[11px] text-[rgba(235,235,245,0.60)] mt-0.5">Calories today</div>
            </div>
          </div>

          {/* Tile B: Spending */}
          <div
            onPointerDown={() => prefetchRoute('/spending')}
            onClick={() => {
              triggerHaptic('medium');
              startTransition(() => {
                navigate('/spending');
              });
            }}
            className="glass-tile p-4 flex flex-col justify-between h-[124px] cursor-pointer select-none"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[20px] font-bold tabular-nums tracking-tight leading-none"
                style={{ color: 'var(--app-accent-text, #64D2FF)' }}
              >
                Rs {totalSpentToday}
              </span>
              <div
                className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, color-mix(in srgb, var(--app-accent-text, #64D2FF) 16%, #1D1D23) 0%, color-mix(in srgb, var(--app-accent, #0A84FF) 7%, #17171B) 100%)',
                  color: 'var(--app-accent-text, #64D2FF)',
                }}
              >
                <Wallet size={17} weight="bold" />
              </div>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">Daily Ledger</div>
              <div className="text-[11px] text-[rgba(235,235,245,0.60)] mt-0.5">Spent today</div>
            </div>
          </div>

          {/* Tile C: Workout */}
          <div
            onClick={() => {
              triggerHaptic('medium');
              startTransition(() => {
                navigate('/gym');
              });
            }}
            className="glass-tile p-4 flex flex-col justify-between h-[124px] cursor-pointer select-none"
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[14px] font-bold truncate pr-1 leading-none"
                style={{ color: workoutToday.done ? 'var(--app-accent-text, #64D2FF)' : '#FFFFFF' }}
              >
                {workoutToday.name}
              </span>
              <div
                className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, color-mix(in srgb, var(--app-accent-text, #64D2FF) 16%, #1D1D23) 0%, color-mix(in srgb, var(--app-accent, #0A84FF) 7%, #17171B) 100%)',
                  color: 'var(--app-accent-text, #64D2FF)',
                }}
              >
                <Barbell size={17} weight="bold" />
              </div>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-white">
                {workoutToday.done ? 'Completed' : "Today's Split"}
              </div>
              <div className="text-[11px] text-[rgba(235,235,245,0.60)] mt-0.5">Gym routine</div>
            </div>
          </div>

          {/* Tile D: Water */}
          <div
            onClick={() => {
              triggerHaptic('medium');
              startTransition(() => {
                navigate('/nutrition');
              });
            }}
            className="glass-tile p-4 flex flex-col justify-between h-[124px] cursor-pointer group select-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-bold text-white tabular-nums tracking-tight leading-none">
                {nutritionToday.waterLiters}{' '}
                <span className="text-[12px] text-[rgba(235,235,245,0.58)] font-normal">L</span>
              </span>
              <div
                className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, color-mix(in srgb, var(--app-accent-text, #64D2FF) 16%, #1D1D23) 0%, color-mix(in srgb, var(--app-accent, #0A84FF) 7%, #17171B) 100%)',
                  color: 'var(--app-accent-text, #64D2FF)',
                }}
              >
                <Drop size={17} weight="fill" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[13px] font-semibold text-white">Hydration</div>
                <div className="text-[11px] text-[rgba(235,235,245,0.60)] mt-0.5">Water logged</div>
              </div>
              <button
                type="button"
                onClick={handleQuickAddWater}
                className="px-2.5 py-1 rounded-full text-[10.5px] font-bold active:scale-95 transition-transform"
                style={{
                  backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                  color: 'var(--app-accent-text, #64D2FF)',
                }}
                title="Add 250ml"
              >
                +250ml
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. Tasks Grouped List ── */}
        <GroupedList
          header="Priority Tasks"
          footer={topTasks.length === 0 ? 'No pending tasks for today.' : undefined}
        >
          {topTasks.map((t) => (
            <ListRow
              key={t.id}
              icon={<CheckCircle weight={t.completed ? 'fill' : 'regular'} />}
              title={
                <span className={t.completed ? 'line-through text-[rgba(235,235,245,0.45)]' : 'text-white'}>
                  {t.text}
                </span>
              }
              subtitle={t.subtask || 'Task'}
              onClick={() => handleToggleTask(t.id)}
            />
          ))}

          <ListRow
            icon={<Plus weight="bold" />}
            title={
              <span className="font-semibold" style={{ color: 'var(--app-accent-text, #64D2FF)' }}>
                Add new task
              </span>
            }
            onClick={() => {
              prefetchRoute('/tasks');
              startTransition(() => {
                navigate('/tasks');
              });
            }}
            showSeparator={false}
          />
        </GroupedList>

        {/* ── 5. Quick Hub Power Tools (Single Unified Theme Color) ── */}
        <div className="flex flex-col gap-2 select-none pt-1">
          <div className="text-section-header px-1">
            Quick Hub
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { label: 'Classes', route: '/timetable', icon: <CalendarCheck size={18} weight="duotone" /> },
              { label: 'Tasks', route: '/tasks', icon: <CheckSquare size={18} weight="duotone" /> },
              { label: 'Notes', route: '/notes', icon: <NotePencil size={18} weight="duotone" /> },
              { label: 'Outings', route: '/outings', icon: <Receipt size={18} weight="duotone" /> },
            ].map((hub) => (
              <button
                key={hub.route}
                onPointerDown={() => prefetchRoute(hub.route)}
                onClick={() => {
                  triggerHaptic('nav');
                  startTransition(() => {
                    navigate(hub.route);
                  });
                }}
                className="glass-tile p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              >
                <div
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--app-accent-text, #64D2FF) 16%, #1D1D23) 0%, color-mix(in srgb, var(--app-accent, #0A84FF) 7%, #17171B) 100%)',
                    color: 'var(--app-accent-text, #64D2FF)',
                  }}
                >
                  {hub.icon}
                </div>
                <span className="text-[11.5px] font-semibold text-white/95">{hub.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

