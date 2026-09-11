import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, UtensilsCrossed, Dumbbell, CheckSquare, Wallet,
  Sparkles, Loader2, Calendar, Check, AlertTriangle, TrendingUp,
  Clock, Award, ChevronLeft, ChevronRight, PieChart, ShieldCheck
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import { getHistoryAnalysis, getGymHistoryAnalysis, getSpendingHistoryAnalysis, GEMINI_API_KEY } from '../utils/geminiCoach';
import type { AppData, NutritionLog, WorkoutLog, Task, Expense } from '../types';

interface WorkHistoryProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type HistoryTab = 'nutrition' | 'gym' | 'todo' | 'spending';

const TABS: { id: HistoryTab; icon: any; title: string; color: string }[] = [
  { id: 'nutrition', icon: UtensilsCrossed, title: 'Nutrition History', color: 'text-amber-500' },
  { id: 'gym',       icon: Dumbbell,        title: 'Gym History',       color: 'text-sky-500' },
  { id: 'todo',      icon: CheckSquare,     title: 'Tasks History',     color: 'text-emerald-500' },
  { id: 'spending',  icon: Wallet,          title: 'Spending History',  color: 'text-violet-500' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };

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
    triggerHaptic(5);
    const d = new Date(monthDate);
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(format(d, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    triggerHaptic(5);
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
      const res = await getHistoryAnalysis(monthlyNutritionLogs, data.profile, data.geminiApiKey || GEMINI_API_KEY);
      setNutritionAiResult(res);
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      alert('Failed to generate nutrition insights. Check your Groq API key in Settings.');
    } finally {
      setNutritionAiLoading(false);
    }
  };

  // ── 2. GYM FILTER & STATS ──
  const monthlyGymLogs = useMemo(() => {
    return (data.workoutLogs || [])
      .filter(l => l.date && l.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.workoutLogs, selectedMonth]);

  const gymStats = useMemo(() => {
    const totalWorkouts = monthlyGymLogs.length;
    let totalSets = 0;
    const splitCounts: Record<string, number> = {};

    monthlyGymLogs.forEach(l => {
      splitCounts[l.type] = (splitCounts[l.type] || 0) + 1;
      (l.exercises || []).forEach(e => {
        totalSets += (e.sets || []).filter(s => s.completed).length;
      });
    });

    let topSplit = 'None';
    let maxCount = 0;
    Object.entries(splitCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topSplit = type;
      }
    });

    return { totalWorkouts, totalSets, topSplit };
  }, [monthlyGymLogs]);

  const handleRunGymAi = async () => {
    if (monthlyGymLogs.length === 0) return;
    triggerHaptic('ai');
    setGymAiLoading(true);
    try {
      const res = await getGymHistoryAnalysis(monthlyGymLogs, data.geminiApiKey || GEMINI_API_KEY);
      setGymAiResult(res);
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      alert('Failed to generate gym insights. Check your Groq API key in Settings.');
    } finally {
      setGymAiLoading(false);
    }
  };

  // ── 3. TODO TASKS FILTER & STATS ──
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
    const total = monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const count = monthlyExpenses.length;
    const daysInMonth = 30;
    const dailyAvg = count > 0 ? Math.round(total / daysInMonth) : 0;

    const catTotals: Record<string, number> = {};
    monthlyExpenses.forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + (Number(e.amount) || 0);
    });

    let topCategory = 'None';
    let topCatAmount = 0;
    Object.entries(catTotals).forEach(([cat, amt]) => {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCategory = cat;
      }
    });

    return { total, dailyAvg, topCategory, catTotals };
  }, [monthlyExpenses]);

  const handleRunSpendingAi = async () => {
    if (monthlyExpenses.length === 0) return;
    triggerHaptic('ai');
    setSpendingAiLoading(true);
    try {
      const res = await getSpendingHistoryAnalysis(monthlyExpenses, data.geminiApiKey || GEMINI_API_KEY);
      setSpendingAiResult(res);
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      alert('Failed to generate spending insights. Check your Groq API key in Settings.');
    } finally {
      setSpendingAiLoading(false);
    }
  };

  const currentTabMeta = TABS.find(t => t.id === activeTab)!;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 max-w-xl mx-auto pb-6">
      {/* ── Header ── */}
      <motion.div variants={item} className="flex items-center justify-between pt-2">
        <button
          onClick={() => { triggerHaptic(10); navigate(-1); }}
          className="w-10 h-10 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-center hover:opacity-85 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
            Logs & Analytics
          </p>
          <h1 className="text-xl font-black text-primary-light dark:text-primary-dark font-sans">
            Activity History
          </h1>
        </div>
        <div className="w-10" />
      </motion.div>

      {/* ── Month Selector Bar ── */}
      <motion.div variants={item} className="card p-3 flex items-center justify-between gap-2 shadow-sm">
        <button
          onClick={handlePrevMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark hover:border-accent/50 active:scale-95 transition-all text-secondary-light dark:text-secondary-dark"
          title="Previous Month"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-2 py-1 px-3 rounded-xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark font-sans font-bold text-sm text-primary-light dark:text-primary-dark">
          <Calendar size={15} className="text-accent" />
          <span>{format(monthDate, 'MMMM yyyy')}</span>
        </div>

        <button
          onClick={handleNextMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark hover:border-accent/50 active:scale-95 transition-all text-secondary-light dark:text-secondary-dark"
          title="Next Month"
        >
          <ChevronRight size={18} />
        </button>
      </motion.div>

      {/* ── 4 Symbols Only Switcher (Requirement: Just add their symbols instead of names) ── */}
      <motion.div variants={item} className="w-full">
        <div className="grid grid-cols-4 gap-2.5 w-full p-1.5 rounded-2xl bg-surface-light dark:bg-[#1C1D24] border border-border-light/80 dark:border-border-dark/80 shadow-sm">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic(5);
                  setActiveTab(tab.id);
                }}
                className={`relative flex items-center justify-center py-3 rounded-xl border transition-all active:scale-95 ${
                  isActive
                    ? 'bg-accent/15 dark:bg-accent/25 border-accent/50 text-accent shadow-sm shadow-accent/20 scale-[1.03]'
                    : 'bg-transparent border-transparent text-secondary-light dark:text-secondary-dark hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`}
                title={tab.title}
                aria-label={tab.title}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-accent' : tab.color} />
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent absolute bottom-1 shadow-sm" />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Section Title Header ── */}
      <div className="flex items-center justify-between px-1 pt-1 pb-0.5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            activeTab === 'nutrition' ? 'bg-amber-500' :
            activeTab === 'gym' ? 'bg-sky-500' :
            activeTab === 'todo' ? 'bg-emerald-500' : 'bg-violet-500'
          }`} />
          <h2 className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
            {currentTabMeta.title}
          </h2>
        </div>
        <span className="text-[11px] font-medium text-muted-light dark:text-muted-dark font-mono">
          {format(monthDate, 'MMM yyyy')}
        </span>
      </div>

      {/* ── TAB 1: NUTRITION HISTORY (AI ANALYSIS) ── */}
      {activeTab === 'nutrition' && (
        <motion.div key="nutrition" variants={container} initial="hidden" animate="show" className="space-y-4 w-full min-w-0">
          {/* Nutrition Cards Arrangement: 2x2 balanced grid */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Avg / Day</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">{nutritionStats.avgCals} <span className="text-xs font-mono font-normal">kcal</span></p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Days Logged</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">{nutritionStats.daysLogged} <span className="text-xs font-mono font-normal">days</span></p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Target Hit Rate</span>
              <p className="text-lg sm:text-xl font-black font-sans text-emerald-600 dark:text-emerald-400 truncate">{nutritionStats.targetHitPct}%</p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Total Consumed</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">{Math.round(nutritionStats.totalCals).toLocaleString('en-IN')} <span className="text-xs font-mono font-normal">kcal</span></p>
            </div>
          </div>

          {/* AI Nutrition Analysis Card */}
          <div className="card p-4 space-y-3 border border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-primary-light dark:text-primary-dark">AI Nutrition Analysis</h3>
                  <p className="text-[11px] text-muted-light dark:text-muted-dark font-mono">Dietary trends & smart advice</p>
                </div>
              </div>
              <button
                onClick={handleRunNutritionAi}
                disabled={nutritionAiLoading || monthlyNutritionLogs.length === 0}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 rounded-xl disabled:opacity-50"
              >
                {nutritionAiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {nutritionAiResult ? 'Refresh' : 'Analyze'}
              </button>
            </div>

            {nutritionAiResult && (
              <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                <p className="text-xs text-primary-light dark:text-primary-dark italic leading-relaxed">
                  "{nutritionAiResult.summary}"
                </p>
                {nutritionAiResult.tips && nutritionAiResult.tips.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {nutritionAiResult.tips.map((tip: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-secondary-light dark:text-secondary-dark">
                        <Check size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Nutrition Daily Log Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Daily Nutrition Cards ({monthlyNutritionLogs.length})
            </h3>
            {monthlyNutritionLogs.length === 0 ? (
              <div className="card p-6 text-center text-muted-light dark:text-muted-dark text-xs">
                No nutrition logs found for this month.
              </div>
            ) : (
              monthlyNutritionLogs.map(log => {
                const targetCals = data.profile?.currentCalorieTarget || 2000;
                const pct = Math.min((log.dailyTotal / targetCals) * 100, 100);
                const isOver = log.dailyTotal > targetCals * 1.1;
                const isUnder = log.dailyTotal < targetCals * 0.85;

                return (
                  <div key={log.id} className="card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-primary-light dark:text-primary-dark">
                          {format(parseISO(log.date), 'EEE, d MMM yyyy')}
                        </span>
                        {log.isSaved && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                            Saved
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-mono font-bold ${isOver ? 'text-red-500' : isUnder ? 'text-sky-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {Math.round(log.dailyTotal)} / {targetCals} kcal
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : isUnder ? 'bg-sky-500' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Meals breakdown chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {log.mealsEaten.map(m => {
                        const isSkipped = m.items.some(i => i.id === 'skipped');
                        const mealCals = m.items.reduce((sum, i) => sum + (i.calories * i.portion), 0);
                        const label = m.slot === 'nightCanteen' ? 'Night Canteen' : m.slot.charAt(0).toUpperCase() + m.slot.slice(1);
                        return (
                          <div
                            key={m.slot}
                            className="text-[11px] px-2 py-1 rounded-lg bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark flex items-center gap-1.5"
                          >
                            <span className="font-medium text-secondary-light dark:text-secondary-dark">{label}:</span>
                            <span className="font-bold font-mono text-primary-light dark:text-primary-dark">
                              {isSkipped ? 'Skipped' : `${Math.round(mealCals)} kcal`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      {/* ── TAB 2: GYM HISTORY ── */}
      {activeTab === 'gym' && (
        <motion.div key="gym" variants={container} initial="hidden" animate="show" className="space-y-4 w-full min-w-0">
          {/* Gym Stat Cards: 2x2 balanced grid */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Workouts</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">{gymStats.totalWorkouts} <span className="text-xs font-mono font-normal">sessions</span></p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Sets Done</span>
              <p className="text-lg sm:text-xl font-black font-sans text-sky-600 dark:text-sky-400 truncate">{gymStats.totalSets} <span className="text-xs font-mono font-normal">sets</span></p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Top Split</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">{gymStats.topSplit}</p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Avg Sets / Day</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">
                {gymStats.totalWorkouts > 0 ? Math.round(gymStats.totalSets / gymStats.totalWorkouts) : 0} <span className="text-xs font-mono font-normal">sets</span>
              </p>
            </div>
          </div>

          {/* AI Gym Insights */}
          <div className="card p-4 space-y-3 border border-sky-500/30 bg-sky-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-primary-light dark:text-primary-dark">AI Gym Progression</h3>
                  <p className="text-[11px] text-muted-light dark:text-muted-dark font-mono">Training consistency analysis</p>
                </div>
              </div>
              <button
                onClick={handleRunGymAi}
                disabled={gymAiLoading || monthlyGymLogs.length === 0}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 rounded-xl disabled:opacity-50"
              >
                {gymAiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {gymAiResult ? 'Refresh' : 'Analyze'}
              </button>
            </div>

            {gymAiResult && (
              <div className="space-y-2 pt-2 border-t border-sky-500/20">
                <p className="text-xs text-primary-light dark:text-primary-dark italic leading-relaxed">
                  "{gymAiResult.summary}"
                </p>
                {gymAiResult.tips && gymAiResult.tips.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {gymAiResult.tips.map((tip: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-secondary-light dark:text-secondary-dark">
                        <Check size={13} className="text-sky-500 flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Workout Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Workout Sessions ({monthlyGymLogs.length})
            </h3>
            {monthlyGymLogs.length === 0 ? (
              <div className="card p-6 text-center text-muted-light dark:text-muted-dark text-xs">
                No gym workout logs found for this month.
              </div>
            ) : (
              monthlyGymLogs.map(log => {
                const totalSets = (log.exercises || []).reduce((s, e) => s + (e.sets?.filter(st => st.completed)?.length || 0), 0);
                const duration = log.startTime && log.endTime ? Math.round((log.endTime - log.startTime) / 60000) : null;

                return (
                  <div key={log.id} className="card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sm text-primary-light dark:text-primary-dark">
                          {format(parseISO(log.date), 'EEE, d MMM yyyy')}
                        </span>
                        <p className="text-xs font-bold text-accent font-sans">{log.type}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-secondary-light dark:text-secondary-dark">
                          {totalSets} sets
                        </span>
                        {duration && (
                          <p className="text-[10px] text-muted-light dark:text-muted-dark font-mono">{duration} mins</p>
                        )}
                      </div>
                    </div>

                    {/* Exercises list */}
                    <div className="space-y-1.5 pt-1 border-t border-border-light dark:border-border-dark">
                      {(log.exercises || []).map((ex, idx) => {
                        const completedCount = (ex.sets || []).filter(s => s.completed).length;
                        const topWeight = Math.max(...(ex.sets || []).map(s => s.weight || 0), 0);
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-bg-light dark:bg-bg-dark">
                            <span className="font-medium text-primary-light dark:text-primary-dark">{ex.name}</span>
                            <span className="font-mono text-[11px] text-secondary-light dark:text-secondary-dark">
                              {completedCount} sets {topWeight > 0 ? `· max ${topWeight}kg` : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      {/* ── TAB 3: TO-DO TASKS HISTORY ── */}
      {activeTab === 'todo' && (
        <motion.div key="todo" variants={container} initial="hidden" animate="show" className="space-y-4 w-full min-w-0">
          {/* Tasks Stat Cards: 2x2 balanced grid */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Completed</span>
              <p className="text-lg sm:text-xl font-black font-sans text-emerald-600 dark:text-emerald-400 truncate">{todoStats.completed} <span className="text-xs font-mono font-normal">done</span></p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Total Tasks</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">{todoStats.total} <span className="text-xs font-mono font-normal">tasks</span></p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Completion Rate</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">{todoStats.rate}%</p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Pending Tasks</span>
              <p className="text-lg sm:text-xl font-black font-sans text-amber-600 dark:text-amber-400 truncate">{Math.max(0, todoStats.total - todoStats.completed)} <span className="text-xs font-mono font-normal">left</span></p>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Tasks Completed / Logged ({monthlyTasks.length})
            </h3>
            {monthlyTasks.length === 0 ? (
              <div className="card p-6 text-center text-muted-light dark:text-muted-dark text-xs">
                No tasks found for this month.
              </div>
            ) : (
              monthlyTasks.map(task => (
                <div key={task.id} className="card p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${task.completed ? 'bg-emerald-500 text-white' : 'border border-border-light dark:border-border-dark text-transparent'}`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-light dark:text-muted-dark' : 'text-primary-light dark:text-primary-dark'}`}>
                        {task.text}
                      </p>
                      {task.subtask && (
                        <p className="text-xs text-secondary-light dark:text-secondary-dark">{task.subtask}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-light dark:text-muted-dark whitespace-nowrap">
                    {task.date}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ── TAB 4: SPENDING HISTORY (AI ANALYSIS) ── */}
      {activeTab === 'spending' && (
        <motion.div key="spending" variants={container} initial="hidden" animate="show" className="space-y-4 w-full min-w-0">
          {/* Spending Stat Cards: 2x2 balanced grid */}
          <div className="grid grid-cols-2 gap-2.5 w-full">
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Total Spent</span>
              <p className="text-lg sm:text-xl font-black font-sans text-violet-600 dark:text-violet-400 truncate">₹{Math.round(spendingStats.total).toLocaleString('en-IN')}</p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Daily Avg</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">₹{Math.round(spendingStats.dailyAvg).toLocaleString('en-IN')}</p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Top Category</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">{spendingStats.topCategory}</p>
            </div>
            <div className="card p-3.5 rounded-[20px] space-y-1 min-w-0 overflow-hidden">
              <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark uppercase tracking-wider block truncate">Expenses Logged</span>
              <p className="text-lg sm:text-xl font-black font-sans text-primary-light dark:text-primary-dark truncate">{monthlyExpenses.length} <span className="text-xs font-mono font-normal">records</span></p>
            </div>
          </div>

          {/* AI Spending Analysis Card */}
          <div className="card p-4 space-y-3 border border-violet-500/30 bg-violet-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-primary-light dark:text-primary-dark">AI Spending Audit</h3>
                  <p className="text-[11px] text-muted-light dark:text-muted-dark font-mono">Waste reduction & budget tips</p>
                </div>
              </div>
              <button
                onClick={handleRunSpendingAi}
                disabled={spendingAiLoading || monthlyExpenses.length === 0}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 rounded-xl disabled:opacity-50"
              >
                {spendingAiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {spendingAiResult ? 'Refresh' : 'Analyze'}
              </button>
            </div>

            {spendingAiResult && (
              <div className="space-y-2 pt-2 border-t border-violet-500/20">
                <p className="text-xs text-primary-light dark:text-primary-dark italic leading-relaxed">
                  "{spendingAiResult.summary}"
                </p>
                {spendingAiResult.tips && spendingAiResult.tips.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {spendingAiResult.tips.map((tip: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-secondary-light dark:text-secondary-dark">
                        <Check size={13} className="text-violet-500 flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Expenses List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Expenses ({monthlyExpenses.length})
            </h3>
            {monthlyExpenses.length === 0 ? (
              <div className="card p-6 text-center text-muted-light dark:text-muted-dark text-xs">
                No expenses logged for this month.
              </div>
            ) : (
              monthlyExpenses.map(expense => (
                <div key={expense.id} className="card p-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                        {expense.category}
                      </span>
                      <span className="text-[11px] font-mono text-muted-light dark:text-muted-dark">
                        {expense.date}
                      </span>
                    </div>
                    {expense.note && (
                      <p className="text-xs text-primary-light dark:text-primary-dark">{expense.note}</p>
                    )}
                  </div>
                  <span className="text-sm font-black font-mono text-primary-light dark:text-primary-dark">
                    ₹{expense.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
