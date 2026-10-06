/**
 * LifeOS — WorkHistory Component (`/history`) - iOS 26 Liquid Glass
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CaretLeft,
  CaretRight,
  Sparkle,
  ForkKnife,
  Barbell,
  CheckSquare,
  Wallet,
  Notebook,
} from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import { handleAppBack } from '../utils/backNavigation';
import { getHistoryAnalysis, getGymHistoryAnalysis, getSpendingHistoryAnalysis } from '../utils/geminiCoach';
import { Toolbar } from '../ui/navigation/Toolbar';
import { Segmented } from '../ui/controls/Segmented';
import { Button } from '../ui/controls/Button';
import { Badge } from '../ui/controls/Badge';
import { EmptyState } from '../ui/feedback/EmptyState';
import type { AppData, WorkoutLog } from '../types';

interface WorkHistoryProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type HistoryTab = 'nutrition' | 'gym' | 'todo' | 'spending' | 'notes';

const TABS: { value: HistoryTab; label: string }[] = [
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'gym', label: 'Gym' },
  { value: 'todo', label: 'Tasks' },
  { value: 'spending', label: 'Spending' },
  { value: 'notes', label: 'Notes' },
];

export default function WorkHistory({ data }: WorkHistoryProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HistoryTab>('nutrition');

  // Month navigation (Format: 'yyyy-MM')
  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));

  // AI states
  const [nutritionAiResult, setNutritionAiResult] = useState<any>(null);
  const [nutritionAiLoading, setNutritionAiLoading] = useState(false);

  const [gymAiResult, setGymAiResult] = useState<any>(null);
  const [gymAiLoading, setGymAiLoading] = useState(false);

  const [spendingAiResult, setSpendingAiResult] = useState<any>(null);
  const [spendingAiLoading, setSpendingAiLoading] = useState(false);

  const monthDate = useMemo(() => {
    try {
      return parseISO(`${selectedMonth}-01`);
    } catch {
      return new Date();
    }
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    triggerHaptic('light');
    const d = new Date(monthDate);
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(format(d, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    triggerHaptic('light');
    const d = new Date(monthDate);
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(format(d, 'yyyy-MM'));
  };

  // ── 1. NUTRITION FILTER & STATS ──
  const monthlyNutritionLogs = useMemo(() => {
    return (data.nutritionLogs || [])
      .filter(l => l.date && l.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.nutritionLogs, selectedMonth]);

  const nutritionStats = useMemo(() => {
    const target = data.profile?.currentCalorieTarget || 2000;
    const daysLogged = monthlyNutritionLogs.length;
    if (daysLogged === 0) return { avgCals: 0, daysLogged: 0, targetHitPct: 0, totalCals: 0 };
    const totalCals = monthlyNutritionLogs.reduce((s, l) => s + (l.dailyTotal || 0), 0);
    const avgCals = Math.round(totalCals / daysLogged);
    const targetMet = monthlyNutritionLogs.filter(l => Math.abs(l.dailyTotal - target) <= target * 0.15).length;
    const targetHitPct = Math.round((targetMet / daysLogged) * 100);
    return { avgCals, daysLogged, targetHitPct, totalCals };
  }, [monthlyNutritionLogs, data.profile]);

  const handleRunNutritionAi = async () => {
    if (monthlyNutritionLogs.length === 0) return;
    triggerHaptic('ai');
    setNutritionAiLoading(true);
    try {
      const res = await getHistoryAnalysis(monthlyNutritionLogs, data.profile);
      setNutritionAiResult(res);
      triggerHaptic('success');
    } catch (e) {
      console.warn('Nutrition AI error:', e);
    } finally {
      setNutritionAiLoading(false);
    }
  };

  // ── 2. GYM FILTER & STATS ──
  const monthlyGymLogs = useMemo(() => {
    return (data.workoutLogs || [])
      .filter((w) => w.date && w.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.workoutLogs, selectedMonth]);

  const gymStats = useMemo(() => {
    const totalWorkouts = monthlyGymLogs.length;
    let totalSets = 0;
    const splitCounts: Record<string, number> = {};

    monthlyGymLogs.forEach((w) => {
      splitCounts[w.type] = (splitCounts[w.type] || 0) + 1;
      (w.exercises || []).forEach((e) => {
        totalSets += e.sets?.length || 0;
      });
    });

    const topSplit = Object.entries(splitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    return { totalWorkouts, totalSets, topSplit };
  }, [monthlyGymLogs]);

  const handleRunGymAi = async () => {
    if (monthlyGymLogs.length === 0) return;
    triggerHaptic('ai');
    setGymAiLoading(true);
    try {
      const res = await getGymHistoryAnalysis(monthlyGymLogs);
      setGymAiResult(res);
      triggerHaptic('success');
    } catch (e) {
      console.warn('Gym AI error:', e);
    } finally {
      setGymAiLoading(false);
    }
  };

  // ── 3. TASKS FILTER & STATS ──
  const monthlyTasks = useMemo(() => {
    return (data.tasks || [])
      .filter(t => t.date && t.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.tasks, selectedMonth]);

  const todoStats = useMemo(() => {
    const total = monthlyTasks.length;
    const completed = monthlyTasks.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [monthlyTasks]);

  // ── 4. SPENDING FILTER & STATS ──
  const monthlyExpenses = useMemo(() => {
    return (data.expenses || [])
      .filter(e => e.date && e.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.expenses, selectedMonth]);

  const spendingStats = useMemo(() => {
    const total = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
    const daysLogged = new Set(monthlyExpenses.map(e => e.date)).size;
    const dailyAvg = daysLogged > 0 ? Math.round(total / daysLogged) : 0;

    const catTotals: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });
    const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    return { total, dailyAvg, topCategory };
  }, [monthlyExpenses]);

  const handleRunSpendingAi = async () => {
    if (monthlyExpenses.length === 0) return;
    triggerHaptic('ai');
    setSpendingAiLoading(true);
    try {
      const res = await getSpendingHistoryAnalysis(monthlyExpenses);
      setSpendingAiResult(res);
      triggerHaptic('success');
    } catch (e) {
      console.warn('Spending AI error:', e);
    } finally {
      setSpendingAiLoading(false);
    }
  };

  // ── 5. NOTES FILTER ──
  const monthlyNotes = useMemo(() => {
    return (data.notes || []).filter(n => {
      const dateStr = n.updatedAt || n.createdAt;
      return dateStr && dateStr.startsWith(selectedMonth);
    });
  }, [data.notes, selectedMonth]);

  // Pagination for heavy lists
  const [visibleCount, setVisibleCount] = useState(25);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(25);
  }, [activeTab, selectedMonth]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 25);
      }
    });
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pb-4 selection:bg-[#AC8E68]/30">
      {/* ── Top Navigation Bar ── */}
      <Toolbar
        leading={
          <button
            onClick={() => handleAppBack(navigate)}
            className="p-2 rounded-full text-white hover:bg-white/10 active:scale-95 transition-transform"
          >
            <CaretLeft size={22} weight="bold" />
          </button>
        }
        center={
          <span className="text-sm font-semibold text-white">
            History Timeline
          </span>
        }
      />

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* ── Month Selector ── */}
        <div className="p-3.5 rounded-2xl glass-card flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl text-[#8E8E93] hover:text-white glass-flat active:scale-95 transition-transform"
            title="Previous Month"
          >
            <CaretLeft size={18} weight="bold" />
          </button>

          <div className="text-center">
            <span className="text-sm font-semibold text-white block">
              {format(monthDate, 'MMMM yyyy')}
            </span>
            <span className="text-[11px] text-[#8E8E93]">Monthly Archive</span>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl text-[#8E8E93] hover:text-white glass-flat active:scale-95 transition-transform"
            title="Next Month"
          >
            <CaretRight size={18} weight="bold" />
          </button>
        </div>

        {/* ── Tab Selector ── */}
        <Segmented
          options={TABS}
          value={activeTab}
          onChange={(val) => {
            triggerHaptic('selection');
            setActiveTab(val as HistoryTab);
          }}
          tint="#AC8E68"
        />

        {/* ── 1. NUTRITION TAB ── */}
        {activeTab === 'nutrition' && (
          <div className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Days Logged</span>
                <span className="text-xl font-bold text-white">{nutritionStats.daysLogged}</span>
              </div>
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Avg / Day</span>
                <span className="text-xl font-bold text-[#FF9F0A]">{nutritionStats.avgCals} kcal</span>
              </div>
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Target Hit</span>
                <span className="text-xl font-bold text-[#30D158]">{nutritionStats.targetHitPct}%</span>
              </div>
            </div>

            {/* AI Coach Action */}
            {monthlyNutritionLogs.length > 0 && (
              <div className="p-4 rounded-2xl glass-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkle size={18} weight="fill" className="text-[#FF9F0A]" />
                    <span className="text-sm font-semibold text-white">Monthly Nutrition Coach</span>
                  </div>
                  <Button
                    size="sm"
                    variant="prominent"
                    tint="#FF9F0A"
                    onClick={handleRunNutritionAi}
                  >
                    {nutritionAiLoading ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>

                {nutritionAiResult && (
                  <div className="text-xs text-[#8E8E93] leading-relaxed pt-2 border-t border-white/[0.04] space-y-1">
                    <p className="text-white font-medium">{nutritionAiResult.summary || nutritionAiResult.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Logs List */}
            {monthlyNutritionLogs.length > 0 ? (
              <div className="space-y-2">
                {monthlyNutritionLogs.slice(0, visibleCount).map((log) => (
                  <div
                    key={log.date}
                    className="p-3.5 rounded-2xl glass-card flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        {format(parseISO(log.date), 'EEEE, MMM d')}
                      </span>
                      <span className="text-xs text-[#8E8E93]">
                        {log.mealsEaten?.length || 0} meals logged
                      </span>
                    </div>
                    <span className="text-base font-bold text-[#FF9F0A]">
                      {log.dailyTotal} kcal
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ForkKnife size={36} weight="light" className="text-[#FF9F0A]" />}
                title="No nutrition logs this month"
                description="Logs will appear here once meals are recorded."
              />
            )}
          </div>
        )}

        {/* ── 2. GYM TAB ── */}
        {activeTab === 'gym' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Workouts</span>
                <span className="text-xl font-bold text-white">{gymStats.totalWorkouts}</span>
              </div>
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Total Sets</span>
                <span className="text-xl font-bold text-[#FF453A]">{gymStats.totalSets}</span>
              </div>
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Top Split</span>
                <span className="text-sm font-bold text-white truncate block">{gymStats.topSplit}</span>
              </div>
            </div>

            {monthlyGymLogs.length > 0 && (
              <div className="p-4 rounded-2xl glass-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkle size={18} weight="fill" className="text-[#FF453A]" />
                    <span className="text-sm font-semibold text-white">Monthly Workout Coach</span>
                  </div>
                  <Button
                    size="sm"
                    variant="prominent"
                    tint="#FF453A"
                    onClick={handleRunGymAi}
                  >
                    {gymAiLoading ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>

                {gymAiResult && (
                  <div className="text-xs text-[#8E8E93] leading-relaxed pt-2 border-t border-white/[0.04]">
                    <p className="text-white font-medium">{gymAiResult.summary || gymAiResult.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {monthlyGymLogs.length > 0 ? (
              <div className="space-y-2">
                {monthlyGymLogs.slice(0, visibleCount).map((log: WorkoutLog) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl glass-card flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-semibold text-white block">
                        {log.type}
                      </span>
                      <span className="text-xs text-[#8E8E93]">
                        {format(parseISO(log.date), 'MMM d')} · {log.exercises?.length || 0} exercises
                      </span>
                    </div>
                    <Badge label={log.type} color="#8E8E93" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Barbell size={36} weight="light" className="text-[#FF453A]" />}
                title="No workouts this month"
                description="Completed workout routines will be saved here."
              />
            )}
          </div>
        )}

        {/* ── 3. TASKS TAB ── */}
        {activeTab === 'todo' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Total Tasks</span>
                <span className="text-xl font-bold text-white">{todoStats.total}</span>
              </div>
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Done</span>
                <span className="text-xl font-bold text-[#30D158]">{todoStats.completed}</span>
              </div>
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Success Rate</span>
                <span className="text-xl font-bold text-[#0A84FF]">{todoStats.rate}%</span>
              </div>
            </div>

            {monthlyTasks.length > 0 ? (
              <div className="space-y-2">
                {monthlyTasks.slice(0, visibleCount).map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl glass-card flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className={`text-sm font-medium block truncate ${task.completed ? 'line-through text-[#8E8E93]' : 'text-white'}`}>
                        {task.text}
                      </span>
                      <span className="text-xs text-[#8E8E93]">
                        {format(parseISO(task.date), 'MMM d')} {task.subtask && `· ${task.subtask}`}
                      </span>
                    </div>
                    <Badge
                      label={task.completed ? 'Completed' : 'Pending'}
                      color={task.completed ? '#30D158' : '#8E8E93'}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckSquare size={36} weight="light" className="text-[#0A84FF]" />}
                title="No tasks recorded this month"
                description="Tasks for this month will appear here."
              />
            )}
          </div>
        )}

        {/* ── 4. SPENDING TAB ── */}
        {activeTab === 'spending' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Total Spent</span>
                <span className="text-lg font-bold text-[#30D158]">₹{spendingStats.total}</span>
              </div>
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Daily Avg</span>
                <span className="text-lg font-bold text-white">₹{spendingStats.dailyAvg}</span>
              </div>
              <div className="p-3.5 rounded-2xl glass-tile space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#8E8E93] block">Top Cat</span>
                <span className="text-xs font-bold text-white truncate block">{spendingStats.topCategory}</span>
              </div>
            </div>

            {monthlyExpenses.length > 0 && (
              <div className="p-4 rounded-2xl glass-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkle size={18} weight="fill" className="text-[#30D158]" />
                    <span className="text-sm font-semibold text-white">Monthly Spending Coach</span>
                  </div>
                  <Button
                    size="sm"
                    variant="prominent"
                    tint="#30D158"
                    onClick={handleRunSpendingAi}
                  >
                    {spendingAiLoading ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>

                {spendingAiResult && (
                  <div className="text-xs text-[#8E8E93] leading-relaxed pt-2 border-t border-white/[0.04]">
                    <p className="text-white font-medium">{spendingAiResult.summary || spendingAiResult.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {monthlyExpenses.length > 0 ? (
              <div className="space-y-2">
                {monthlyExpenses.slice(0, visibleCount).map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-2xl glass-card flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-semibold text-white block">{exp.note || exp.category}</span>
                      <span className="text-xs text-[#8E8E93]">
                        {format(parseISO(exp.date), 'MMM d')} · {exp.category}
                      </span>
                    </div>
                    <span className="text-base font-bold text-white">
                      ₹{exp.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Wallet size={36} weight="light" className="text-[#30D158]" />}
                title="No expenses logged this month"
                description="Recorded expenses will be archived here."
              />
            )}
          </div>
        )}

        {/* ── 5. NOTES TAB ── */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl glass-card flex items-center justify-between">
              <span className="text-xs text-[#8E8E93]">Total Notes & Ideas</span>
              <span className="text-base font-bold text-white">{monthlyNotes.length}</span>
            </div>

            {monthlyNotes.length > 0 ? (
              <div className="space-y-2">
                {monthlyNotes.slice(0, visibleCount).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => navigate('/notes')}
                    className="p-3.5 rounded-2xl glass-card hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-semibold text-white block truncate">{note.title || 'Untitled Note'}</span>
                    <p className="text-xs text-[#8E8E93] line-clamp-2 mt-1">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Notebook size={36} weight="light" className="text-[#BF5AF2]" />}
                title="No notes written this month"
                description="Notes and Brain Dumps created in this month will appear here."
              />
            )}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
      </div>
    </div>
  );
}
