import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Dumbbell, Wallet, Clock, ChevronRight, Calendar, ArrowUpRight, Sparkles, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import type { AppData } from '../types';

interface HomeProps {
  data: AppData;
  refresh?: () => Promise<AppData>;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

export default function Home({ data, refresh }: HomeProps) {
  const navigate = useNavigate();
  const now = new Date();
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleManualSync = async () => {
    if (!refresh || syncing) return;
    triggerHaptic('save');
    setSyncing(true);
    try {
      await refresh();
      setSyncSuccess(true);
      triggerHaptic('success');
      setTimeout(() => setSyncSuccess(false), 2200);
    } catch {
      triggerHaptic('heavy');
    } finally {
      setSyncing(false);
    }
  };

  const {
    todaySessions,
    todayStudyHours,
    todayStudyMins,
    todayWorkout,
    todayPlan,
    todayExpenses,
    todaySpent,
    todayTasks,
    completedTasks,
    nextBlock,
    studyScore,
    gymScore,
    taskScore,
    spendScore,
    dayScore,
  } = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const nowDate = new Date();

    // ── Study ──
    const todaySessions = data.studySessions.filter(s => s.date === todayStr);
    const todayStudyMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const studyHours = Math.floor(todayStudyMinutes / 60);
    const studyMins = todayStudyMinutes % 60;

    // ── Gym ──
    const workout = data.workoutLogs.find(w => w.date === todayStr);
    const dayMap: Record<string, string> = {
      Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
      Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
    };
    const plan = data.workoutPlans.find(p => dayMap[p.day] === format(nowDate, 'EEEE'));

    // ── Spending ──
    const todayExpenses = data.expenses.filter(e => e.date === todayStr);
    const spent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // ── Tasks ──
    const tasks = data.tasks.filter(t => t.date === todayStr);
    const completed = tasks.filter(t => t.completed).length;

    // ── Next timetable block ──
    const next = data.timetable
      .filter(b => b.day === format(nowDate, 'EEEE') && b.startTime > format(nowDate, 'HH:mm'))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

    // ── Day score (4 pillars × 25) ──
    const studyScore = Math.min(25, (todayStudyMinutes / 120) * 25);
    const gymScore = workout ? 25 : 0;
    const taskScore = tasks.length > 0 ? (completed / tasks.length) * 25 : 0;
    const spendScore = todayExpenses.length > 0 ? 25 : 0;
    const score = Math.round(studyScore + gymScore + taskScore + spendScore);

    return {
      todaySessions,
      todayStudyHours: studyHours,
      todayStudyMins: studyMins,
      todayWorkout: workout,
      todayPlan: plan,
      todayExpenses,
      todaySpent: spent,
      todayTasks: tasks,
      completedTasks: completed,
      nextBlock: next,
      studyScore,
      gymScore,
      taskScore,
      spendScore,
      dayScore: score,
    };
  }, [data]);

  // Dynamic Status Badge
  const getScoreBadge = () => {
    if (dayScore >= 80) return { label: 'Optimal Pace', color: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' };
    if (dayScore >= 50) return { label: 'On Track', color: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300' };
    if (dayScore >= 25) return { label: 'Building Up', color: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' };
    return { label: 'Starting Day', color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300' };
  };
  const scoreBadge = getScoreBadge();

  // Greeting
  const h = now.getHours();
  let greetWord = 'Evening';
  if (h < 12) greetWord = 'Morning';
  else if (h === 12) greetWord = 'Noon';
  else if (h < 17) greetWord = 'Afternoon';

  // Arc Gauge Constants (radius 76, arc length ≈ 238.76)
  const arcLength = 238.76;
  const strokeOffset = arcLength * (1 - Math.min(100, Math.max(0, dayScore)) / 100);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-8">

      {/* ── Expressive Hero Greeting ── */}
      <motion.div variants={item} className="pt-2 px-1">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm">
            <Calendar size={13} className="text-accent" />
            <span className="text-xs font-semibold tracking-wide text-secondary-light dark:text-secondary-dark">
              {format(now, 'EEEE, MMMM d')}
            </span>
          </div>

          {/* Direct Cloud Sync Icon Button beside Day & Date */}
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-full border shadow-sm transition-all active:scale-90 disabled:opacity-60 ${
              syncSuccess
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-surface-light dark:bg-surface-dark border-border-light/70 dark:border-border-dark/70 text-secondary-light dark:text-secondary-dark hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            }`}
            title="Sync data with cloud database"
            aria-label="Sync data with cloud"
          >
            <RefreshCw size={13} className={`text-accent transition-transform duration-500 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <h1 className="text-[34px] sm:text-4xl font-black tracking-tight text-primary-light dark:text-primary-dark leading-tight">
          Good <span className="text-accent">{greetWord}</span>
        </h1>
      </motion.div>

      {/* ── M3 Expressive Day Score Card ── */}
      <motion.div
        variants={item}
        className="rounded-[32px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 shadow-m3-subtle relative overflow-hidden"
      >
        {/* Card Header Row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-muted-light dark:text-muted-dark uppercase block">
              Daily Progress
            </span>
            <span className="text-xs text-secondary-light dark:text-secondary-dark font-medium">
              Overall execution balance
            </span>
          </div>
          <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm ${scoreBadge.color}`}>
            {scoreBadge.label}
          </span>
        </div>

        {/* Semi-Circle Arc Gauge */}
        <div className="relative flex flex-col items-center justify-center my-2">
          <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 115">
            <defs>
              <linearGradient id="m3ScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818CF8" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#4F46E5" />
              </linearGradient>
            </defs>
            {/* Background Track */}
            <path
              d="M 24 100 A 76 76 0 0 1 176 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
              className="text-neutral-100 dark:text-neutral-800"
            />
            {/* Active Filled Track */}
            <path
              d="M 24 100 A 76 76 0 0 1 176 100"
              fill="none"
              stroke="url(#m3ScoreGradient)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeOffset}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>

          {/* Central Score Typography */}
          <div className="absolute bottom-1 flex flex-col items-center">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-primary-light dark:text-primary-dark">
                {dayScore}
              </span>
              <span className="text-base font-semibold text-muted-light dark:text-muted-dark font-mono">
                /100
              </span>
            </div>
            <span className="text-[11px] font-medium text-secondary-light dark:text-secondary-dark mt-0.5">
              Target Index
            </span>
          </div>
        </div>

        {/* 4 Pillars Chunky Segment Indicators */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border-light/40 dark:border-border-dark/40">
          {[
            { label: 'Study', score: Math.round(studyScore), max: 25, color: 'bg-indigo-500' },
            { label: 'Gym', score: Math.round(gymScore), max: 25, color: 'bg-emerald-500' },
            { label: 'Tasks', score: Math.round(taskScore), max: 25, color: 'bg-purple-500' },
            { label: 'Money', score: Math.round(spendScore), max: 25, color: 'bg-amber-500' },
          ].map((col) => (
            <div key={col.label} className="flex flex-col items-center text-center">
              <span className="text-[10px] font-mono font-semibold uppercase text-secondary-light dark:text-secondary-dark mb-1">
                {col.label}
              </span>
              <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden mb-1">
                <div
                  className={`h-full rounded-full ${col.color} transition-all duration-500`}
                  style={{ width: `${Math.round((col.score / col.max) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-medium text-muted-light dark:text-muted-dark">
                {col.score}/{col.max}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 2×2 Tonal Expressive Cards ── */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:gap-5">

        {/* 1. Study Card (Soft Lavender) */}
        <motion.button
          whileTap={{ scale: 0.975 }}
          onPointerDown={() => triggerHaptic('light')}
          onClick={() => navigate('/study')}
          className="rounded-[28px] p-5 sm:p-6 text-left bg-m3-lavender-container dark:bg-m3-lavender-darkContainer border border-m3-lavender-badge/50 dark:border-m3-lavender-darkBadge/50 shadow-m3-subtle flex flex-col justify-between group transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[16px] bg-m3-lavender-badge dark:bg-m3-lavender-darkBadge flex items-center justify-center text-m3-lavender-text dark:text-m3-lavender-darkText shadow-sm">
                <BookOpen size={20} strokeWidth={2.2} />
              </div>
              <ArrowUpRight size={17} className="text-m3-lavender-text/50 dark:text-m3-lavender-darkText/50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-m3-lavender-text dark:text-m3-lavender-darkText block mb-1.5">
              Study
            </span>
            <p className="text-2xl sm:text-[26px] font-black tracking-tight text-primary-light dark:text-primary-dark">
              {todayStudyHours}<span className="text-sm font-semibold">h</span>{' '}
              {todayStudyMins}<span className="text-sm font-semibold">m</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-m3-lavender-badge/40 dark:border-m3-lavender-darkBadge/40 flex items-center justify-between">
            <span className="text-xs font-medium text-m3-lavender-text dark:text-m3-lavender-darkText">
              {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-m3-lavender-badge/60 dark:bg-m3-lavender-darkBadge/60 text-m3-lavender-text dark:text-m3-lavender-darkText">
              Deep Work
            </span>
          </div>
        </motion.button>

        {/* 2. Gym Card (Fresh Pistachio Mint) */}
        <motion.button
          whileTap={{ scale: 0.975 }}
          onPointerDown={() => triggerHaptic('light')}
          onClick={() => navigate('/gym')}
          className="rounded-[28px] p-5 sm:p-6 text-left bg-m3-mint-container dark:bg-m3-mint-darkContainer border border-m3-mint-badge/50 dark:border-m3-mint-darkBadge/50 shadow-m3-subtle flex flex-col justify-between group transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[16px] bg-m3-mint-badge dark:bg-m3-mint-darkBadge flex items-center justify-center text-m3-mint-text dark:text-m3-mint-darkText shadow-sm">
                <Dumbbell size={20} strokeWidth={2.2} />
              </div>
              <ArrowUpRight size={17} className="text-m3-mint-text/50 dark:text-m3-mint-darkText/50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-m3-mint-text dark:text-m3-mint-darkText block mb-1.5">
              Gym
            </span>
            <p className="text-2xl sm:text-[26px] font-black tracking-tight text-primary-light dark:text-primary-dark truncate">
              {todayWorkout ? todayPlan?.type || 'Workout' : todayPlan?.type || 'Rest'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-m3-mint-badge/40 dark:border-m3-mint-darkBadge/40 flex items-center justify-between">
            <span className="text-xs font-medium text-m3-mint-text dark:text-m3-mint-darkText truncate">
              {todayWorkout
                ? `${(todayWorkout.exercises || []).reduce((s, ex) => s + (ex?.sets || []).filter(st => st?.completed).length, 0)} sets`
                : todayPlan && (todayPlan.exercises || []).length > 0
                  ? `${(todayPlan.exercises || []).reduce((s, ex) => s + (Number(ex?.sets) || 0), 0)} sets`
                  : 'Rest day'}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              todayWorkout 
                ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200' 
                : 'bg-m3-mint-badge/60 dark:bg-m3-mint-darkBadge/60 text-m3-mint-text dark:text-m3-mint-darkText'
            }`}>
              {todayWorkout ? 'Done' : 'Split'}
            </span>
          </div>
        </motion.button>

        {/* 3. Spending Card (Warm Peach) */}
        <motion.button
          whileTap={{ scale: 0.975 }}
          onPointerDown={() => triggerHaptic('light')}
          onClick={() => navigate('/spending')}
          className="rounded-[28px] p-5 sm:p-6 text-left bg-m3-peach-container dark:bg-m3-peach-darkContainer border border-m3-peach-badge/50 dark:border-m3-peach-darkBadge/50 shadow-m3-subtle flex flex-col justify-between group transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[16px] bg-m3-peach-badge dark:bg-m3-peach-darkBadge flex items-center justify-center text-m3-peach-text dark:text-m3-peach-darkText shadow-sm">
                <Wallet size={20} strokeWidth={2.2} />
              </div>
              <ArrowUpRight size={17} className="text-m3-peach-text/50 dark:text-m3-peach-darkText/50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-m3-peach-text dark:text-m3-peach-darkText block mb-1.5">
              Money
            </span>
            <p className="text-2xl sm:text-[26px] font-black tracking-tight text-primary-light dark:text-primary-dark">
              ₹{todaySpent.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-m3-peach-badge/40 dark:border-m3-peach-darkBadge/40 flex items-center justify-between">
            <span className="text-xs font-medium text-m3-peach-text dark:text-m3-peach-darkText">
              {todayExpenses.length} record{todayExpenses.length !== 1 ? 's' : ''}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-m3-peach-badge/60 dark:bg-m3-peach-darkBadge/60 text-m3-peach-text dark:text-m3-peach-darkText">
              Expenses
            </span>
          </div>
        </motion.button>

        {/* 4. Next Up / Timetable Card (Soft Rose) */}
        <motion.button
          whileTap={{ scale: 0.975 }}
          onPointerDown={() => triggerHaptic('light')}
          onClick={() => nextBlock ? navigate('/study/timer') : navigate('/timetable')}
          className="rounded-[28px] p-5 sm:p-6 text-left bg-m3-rose-container dark:bg-m3-rose-darkContainer border border-m3-rose-badge/50 dark:border-m3-rose-darkBadge/50 shadow-m3-subtle flex flex-col justify-between group transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-[16px] bg-m3-rose-badge dark:bg-m3-rose-darkBadge flex items-center justify-center text-m3-rose-text dark:text-m3-rose-darkText shadow-sm">
                <Clock size={20} strokeWidth={2.2} />
              </div>
              <ArrowUpRight size={17} className="text-m3-rose-text/50 dark:text-m3-rose-darkText/50 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-m3-rose-text dark:text-m3-rose-darkText block mb-1.5">
              Next Up
            </span>
            <p className="text-lg sm:text-xl font-black tracking-tight text-primary-light dark:text-primary-dark truncate">
              {nextBlock ? nextBlock.subject : 'Free Period'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-m3-rose-badge/40 dark:border-m3-rose-darkBadge/40 flex items-center justify-between">
            <span className="text-xs font-medium text-m3-rose-text dark:text-m3-rose-darkText truncate">
              {nextBlock ? `${nextBlock.startTime} – ${nextBlock.endTime}` : 'No upcoming class'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-m3-rose-badge/60 dark:bg-m3-rose-darkBadge/60 text-m3-rose-text dark:text-m3-rose-darkText">
              Timetable
            </span>
          </div>
        </motion.button>

      </motion.div>

      {/* ── Expressive TO-DO Preview ── */}
      {todayTasks.length > 0 && (
        <motion.div variants={item} className="rounded-m3-card p-5 bg-surface-light dark:bg-surface-dark border border-border-light/50 dark:border-border-dark/50 shadow-m3-subtle">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Calendar size={14} />
              </div>
              <span className="text-xs font-bold font-mono tracking-wider uppercase text-primary-light dark:text-primary-dark">
                Tasks Today · {completedTasks}/{todayTasks.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="px-3 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-primary-light dark:text-primary-dark flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {todayTasks.slice(0, 4).map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-[18px] bg-neutral-50/80 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800"
              >
                <div className={`w-5 h-5 rounded-[8px] flex-shrink-0 flex items-center justify-center transition-all ${
                  task.completed
                    ? 'bg-accent text-white'
                    : 'border-2 border-neutral-300 dark:border-neutral-600'
                }`}>
                  {task.completed && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium block truncate ${
                    task.completed
                      ? 'line-through text-muted-light dark:text-muted-dark'
                      : 'text-primary-light dark:text-primary-dark'
                  }`}>
                    {task.text}
                  </span>
                  {task.subtask && (
                    <span className={`text-[11px] block truncate ${
                      task.completed
                        ? 'line-through text-muted-light/60 dark:text-muted-dark/60'
                        : 'text-secondary-light dark:text-secondary-dark'
                    }`}>
                      {task.subtask}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Expressive Stats Footer Strip ── */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {[
          { 
            label: 'Study Streak', 
            value: `${data.studySessions.filter((s, i, arr) => i === 0 || s.date !== arr[i-1].date).length}d`,
            icon: Sparkles
          },
          { 
            label: 'Workouts', 
            value: data.workoutLogs.length.toString(),
            icon: Dumbbell
          },
          { 
            label: 'This Month', 
            value: `₹${Math.round(data.expenses.filter(e => e.date.startsWith(format(now, 'yyyy-MM'))).reduce((s, e) => s + e.amount, 0)).toLocaleString('en-IN')}`,
            icon: Wallet
          },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-[22px] p-3.5 text-center flex flex-col justify-center items-center bg-surface-light dark:bg-surface-dark border border-border-light/40 dark:border-border-dark/40 shadow-m3-subtle"
          >
            <p className="text-base sm:text-lg font-extrabold font-mono tracking-tight text-primary-light dark:text-primary-dark truncate w-full">
              {stat.value}
            </p>
            <p className="text-[10px] font-mono font-medium text-muted-light dark:text-muted-dark mt-0.5 truncate w-full uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>

    </motion.div>
  );
}
