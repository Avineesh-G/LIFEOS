import { useMemo } from 'react';
import { BookOpen, Dumbbell, Wallet, Calendar, TrendingUp, Award, Flame, Zap } from 'lucide-react';
import { format, subDays, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData } from '../types';

interface ProgressProps {
  data: AppData;
}

const SUBJECT_COLORS = ['bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } };

export default function Progress({ data }: ProgressProps) {
  const now = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    const studySessions = data?.studySessions || [];
    const workoutLogs = data?.workoutLogs || [];
    const expenses = data?.expenses || [];

    const totalStudyMins = studySessions.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    const totalStudyHours = Math.floor(totalStudyMins / 60);
    const totalStudyMinsRem = totalStudyMins % 60;
    const totalWorkouts = workoutLogs.length;
    const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalFocusSessions = studySessions.length;
    const daysTracked = new Set(studySessions.map(s => s.date)).size;

    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const monthStudy = studySessions
      .filter(s => {
        try {
          return isWithinInterval(parseISO(s.date), { start: monthStart, end: monthEnd });
        } catch {
          return false;
        }
      })
      .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

    const prevMonthRef = subDays(monthStart, 1);
    const lastMonthStart = startOfMonth(prevMonthRef);
    const lastMonthEnd = endOfMonth(prevMonthRef);
    const lastMonthStudy = studySessions
      .filter(s => {
        try {
          return isWithinInterval(parseISO(s.date), { start: lastMonthStart, end: lastMonthEnd });
        } catch {
          return false;
        }
      })
      .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

    const studyDelta = lastMonthStudy > 0
      ? Math.round(((monthStudy - lastMonthStudy) / lastMonthStudy) * 100)
      : 0;

    const subjectCounts: Record<string, number> = {};
    studySessions.forEach(s => {
      if (s.subject) {
        subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + (Number(s.duration) || 0);
      }
    });
    const topSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const mostStudied = topSubjects[0];
    const maxSubjectMins = topSubjects[0]?.[1] || 1;

    const dayCounts: Record<string, number> = {};
    studySessions.forEach(s => {
      try {
        const day = format(parseISO(s.date), 'EEEE');
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      } catch {
        // ignore
      }
    });
    const mostConsistentDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

    const sortedDates = [...new Set(studySessions.map(s => s.date))].sort();
    let longestStreak = 0;
    let currentStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]).getTime();
        const curr = new Date(sortedDates[i]).getTime();
        const diff = Math.round((curr - prev) / 86400000);
        currentStreak = diff === 1 ? currentStreak + 1 : 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    return {
      totalStudyHours,
      totalStudyMinsRem,
      totalWorkouts,
      totalSpent,
      totalFocusSessions,
      daysTracked,
      studyDelta,
      topSubjects,
      mostStudied,
      maxSubjectMins,
      mostConsistentDay,
      longestStreak,
    };
  }, [data?.studySessions, data?.workoutLogs, data?.expenses, now]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-7 pb-6">
      {/* Progress Hero Header Card */}
      <motion.div
        variants={item}
        className="rounded-[32px] p-5 sm:p-6 liquid-glass border border-[var(--card-border)] shadow-sm flex items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)] text-xs font-tag font-bold tracking-wider uppercase mb-2 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            {format(now, 'MMMM yyyy')} · Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-primary-light dark:text-primary-dark truncate">
            Progress & Analytics
          </h1>
          <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1 font-medium truncate">
            Cross-pillar velocity, discipline streaks & consistency
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-[var(--card-surface)] border border-[var(--card-border)] flex items-center justify-center text-[var(--accent-primary)] shadow-xs shrink-0">
          <TrendingUp size={22} strokeWidth={2.2} />
        </div>
      </motion.div>

      {/* Bioluminescent 2x2 Liquid Squircle Pillars Grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:gap-5">
        {/* Study - Lavender Fluid Capsule */}
        <motion.div
          whileHover={{ scale: 1.025, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="relative overflow-hidden rounded-[32px] sm:rounded-[36px] p-5 sm:p-6 liquid-glass glow-lavender bg-gradient-to-br from-m3-lavender-container/80 via-m3-lavender-container/40 to-transparent dark:from-m3-lavender-darkContainer/70 dark:via-m3-lavender-darkContainer/35 dark:to-transparent text-m3-lavender-text dark:text-m3-lavender-darkText shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="w-12 h-12 rounded-[20px] bg-white/85 dark:bg-black/50 flex items-center justify-center shadow-sm border border-white/40 dark:border-white/10">
              <BookOpen size={20} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider opacity-75 font-mono">Study</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black leading-none tracking-tight font-sans">
              {stats.totalStudyHours}<span className="text-lg font-bold opacity-80">h </span>
              {stats.totalStudyMinsRem}<span className="text-lg font-bold opacity-80">m</span>
            </p>
            <p className="text-xs font-semibold opacity-75 mt-2">{stats.totalFocusSessions} sessions</p>
          </div>
        </motion.div>

        {/* Gym - Mint Fluid Capsule */}
        <motion.div
          whileHover={{ scale: 1.025, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="relative overflow-hidden rounded-[32px] sm:rounded-[36px] p-5 sm:p-6 liquid-glass glow-mint bg-gradient-to-br from-m3-mint-container/80 via-m3-mint-container/40 to-transparent dark:from-m3-mint-darkContainer/70 dark:via-m3-mint-darkContainer/35 dark:to-transparent text-m3-mint-text dark:text-m3-mint-darkText shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="w-12 h-12 rounded-[20px] bg-white/85 dark:bg-black/50 flex items-center justify-center shadow-sm border border-white/40 dark:border-white/10">
              <Dumbbell size={20} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider opacity-75 font-mono">Gym</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black leading-none tracking-tight font-sans">
              {stats.totalWorkouts}
            </p>
            <p className="text-xs font-semibold opacity-75 mt-2">workouts logged</p>
          </div>
        </motion.div>

        {/* Spending - Peach Fluid Capsule */}
        <motion.div
          whileHover={{ scale: 1.025, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="relative overflow-hidden rounded-[32px] sm:rounded-[36px] p-5 sm:p-6 liquid-glass glow-peach bg-gradient-to-br from-m3-peach-container/80 via-m3-peach-container/40 to-transparent dark:from-m3-peach-darkContainer/70 dark:via-m3-peach-darkContainer/35 dark:to-transparent text-m3-peach-text dark:text-m3-peach-darkText shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="w-12 h-12 rounded-[20px] bg-white/85 dark:bg-black/50 flex items-center justify-center shadow-sm border border-white/40 dark:border-white/10">
              <Wallet size={20} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider opacity-75 font-mono">Spending</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black leading-none tracking-tight font-sans">
              ₹{stats.totalSpent.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-semibold opacity-75 mt-2">all-time recorded</p>
          </div>
        </motion.div>

        {/* Consistency - Rose Fluid Capsule */}
        <motion.div
          whileHover={{ scale: 1.025, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="relative overflow-hidden rounded-[32px] sm:rounded-[36px] p-5 sm:p-6 liquid-glass glow-rose bg-gradient-to-br from-m3-rose-container/80 via-m3-rose-container/40 to-transparent dark:from-m3-rose-darkContainer/70 dark:via-m3-rose-darkContainer/35 dark:to-transparent text-m3-rose-text dark:text-m3-rose-darkText shadow-md flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="w-12 h-12 rounded-[20px] bg-white/85 dark:bg-black/50 flex items-center justify-center shadow-sm border border-white/40 dark:border-white/10">
              <Flame size={20} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider opacity-75 font-mono">Streak</span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black leading-none tracking-tight font-sans">
              {stats.longestStreak} <span className="text-base font-bold opacity-80">days</span>
            </p>
            <p className="text-xs font-semibold opacity-75 mt-2">{stats.daysTracked} days active</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Monthly Velocity */}
      <motion.div variants={item} className="rounded-[32px] p-6 sm:p-7 liquid-glass shadow-sm space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
          Monthly Velocity
        </p>
        <div className="grid grid-cols-3 divide-x divide-black/5 dark:divide-white/10">
          <div className="pr-4 text-center">
            <p className={`text-2xl sm:text-3xl font-black flex items-center justify-center gap-1 font-sans ${stats.studyDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              <TrendingUp size={18} />
              {stats.studyDelta > 0 ? '+' : ''}{stats.studyDelta}%
            </p>
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1 font-medium">Study MoM</p>
          </div>
          <div className="px-4 text-center">
            <p className="text-2xl sm:text-3xl font-black text-primary-light dark:text-primary-dark font-sans">{stats.totalFocusSessions}</p>
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1 font-medium">Sessions</p>
          </div>
          <div className="pl-4 text-center">
            <p className="text-2xl sm:text-3xl font-black text-primary-light dark:text-primary-dark flex items-center justify-center gap-1 font-sans">
              <Flame size={18} className="text-amber-500" />
              {stats.longestStreak}
            </p>
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1 font-medium">Best Streak</p>
          </div>
        </div>
      </motion.div>

      {/* Top Subjects */}
      {stats.topSubjects.length > 0 && (
        <motion.div variants={item} className="rounded-[32px] p-6 sm:p-7 liquid-glass shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Top Focus Subjects
            </p>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.05] text-muted-light dark:text-muted-dark">Cumulative hours</span>
          </div>

          <div className="space-y-3.5">
            {stats.topSubjects.map(([subj, mins], idx) => (
              <div key={subj} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-primary-light dark:text-primary-dark font-bold truncate font-sans">{subj}</span>
                  <span className="font-mono font-bold text-primary-light dark:text-primary-dark">
                    {Math.round(mins / 60)}h
                  </span>
                </div>
                <div className="w-full h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(mins / stats.maxSubjectMins) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                    className={`h-full rounded-full ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Personal Milestones */}
      <motion.div variants={item} className="rounded-[32px] p-6 sm:p-7 liquid-glass shadow-sm space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1 font-mono">
          Personal Milestones
        </p>
        <div className="space-y-2.5">
          {stats.mostStudied && (
            <motion.div
              whileHover={{ scale: 1.012, y: -1 }}
              className="flex items-center gap-4 p-3.5 rounded-[22px] liquid-glass hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
            >
              <div className="w-11 h-11 rounded-[16px] bg-m3-lavender-badge/70 dark:bg-m3-lavender-darkBadge/70 text-m3-lavender-text dark:text-m3-lavender-darkText flex items-center justify-center flex-shrink-0 shadow-sm">
                <Award size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary-light dark:text-primary-dark font-sans">Top Subject Champion</p>
                <p className="text-xs text-muted-light dark:text-muted-dark mt-0.5">{stats.mostStudied[0]} · {Math.round(stats.mostStudied[1] / 60)}h total focused</p>
              </div>
            </motion.div>
          )}

          {stats.mostConsistentDay && (
            <motion.div
              whileHover={{ scale: 1.012, y: -1 }}
              className="flex items-center gap-4 p-3.5 rounded-[22px] liquid-glass hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
            >
              <div className="w-11 h-11 rounded-[16px] bg-m3-mint-badge/70 dark:bg-m3-mint-darkBadge/70 text-m3-mint-text dark:text-m3-mint-darkText flex items-center justify-center flex-shrink-0 shadow-sm">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary-light dark:text-primary-dark font-sans">Peak Productivity Day</p>
                <p className="text-xs text-muted-light dark:text-muted-dark mt-0.5">{stats.mostConsistentDay[0]} · {stats.mostConsistentDay[1]} recorded sessions</p>
              </div>
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: 1.012, y: -1 }}
            className="flex items-center gap-4 p-3.5 rounded-[22px] liquid-glass hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
          >
            <div className="w-11 h-11 rounded-[16px] bg-m3-rose-badge/70 dark:bg-m3-rose-darkBadge/70 text-m3-rose-text dark:text-m3-rose-darkText flex items-center justify-center flex-shrink-0 shadow-sm">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-light dark:text-primary-dark font-sans">Workout Momentum</p>
              <p className="text-xs text-muted-light dark:text-muted-dark mt-0.5">{stats.totalWorkouts} logged sessions completed</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
