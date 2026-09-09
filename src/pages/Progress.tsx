import { useMemo } from 'react';
import { BookOpen, Dumbbell, Wallet, Calendar, TrendingUp, Award, Flame, Zap } from 'lucide-react';
import { format, subDays, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import type { AppData } from '../types';

interface ProgressProps {
  data: AppData;
}

const SUBJECT_COLORS = ['bg-purple-500', 'bg-indigo-500', 'bg-blue-500', 'bg-teal-500'];

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
    <div className="space-y-6 sm:space-y-7 pb-4">
      {/* Header */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-m3-lavender-badge/60 dark:bg-m3-lavender-darkBadge/60 text-m3-lavender-text dark:text-m3-lavender-darkText text-xs font-bold tracking-wider uppercase mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6750A4] dark:bg-[#D0BCFF] animate-pulse" />
          {format(now, 'MMMM yyyy')} · Overview
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-primary-light dark:text-primary-dark font-sans">
          Progress & Analytics
        </h1>
      </div>

      {/* Material 3 Expressive 2x2 Tonal Pillars Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5">
        {/* Study - Lavender Tonal Container */}
        <div className="rounded-[28px] p-5 sm:p-6 bg-m3-lavender-container dark:bg-m3-lavender-darkContainer text-m3-lavender-text dark:text-m3-lavender-darkText border border-m3-lavender-badge/50 dark:border-m3-lavender-darkBadge/50 shadow-m3-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="w-11 h-11 rounded-[16px] bg-white/80 dark:bg-black/30 flex items-center justify-center shadow-sm">
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
        </div>

        {/* Gym - Mint Tonal Container */}
        <div className="rounded-[28px] p-5 sm:p-6 bg-m3-mint-container dark:bg-m3-mint-darkContainer text-m3-mint-text dark:text-m3-mint-darkText border border-m3-mint-badge/50 dark:border-m3-mint-darkBadge/50 shadow-m3-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="w-11 h-11 rounded-[16px] bg-white/80 dark:bg-black/30 flex items-center justify-center shadow-sm">
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
        </div>

        {/* Spending - Peach Tonal Container */}
        <div className="rounded-[28px] p-5 sm:p-6 bg-m3-peach-container dark:bg-m3-peach-darkContainer text-m3-peach-text dark:text-m3-peach-darkText border border-m3-peach-badge/50 dark:border-m3-peach-darkBadge/50 shadow-m3-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="w-11 h-11 rounded-[16px] bg-white/80 dark:bg-black/30 flex items-center justify-center shadow-sm">
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
        </div>

        {/* Consistency - Rose Tonal Container */}
        <div className="rounded-[28px] p-5 sm:p-6 bg-m3-rose-container dark:bg-m3-rose-darkContainer text-m3-rose-text dark:text-m3-rose-darkText border border-m3-rose-badge/50 dark:border-m3-rose-darkBadge/50 shadow-m3-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="w-11 h-11 rounded-[16px] bg-white/80 dark:bg-black/30 flex items-center justify-center shadow-sm">
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
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
          Monthly Velocity
        </p>
        <div className="grid grid-cols-3 divide-x divide-border-light dark:divide-border-dark">
          <div className="pr-4 text-center">
            <p className={`text-2xl sm:text-3xl font-black flex items-center justify-center gap-1 font-sans ${stats.studyDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              <TrendingUp size={18} />
              {stats.studyDelta > 0 ? '+' : ''}{stats.studyDelta}%
            </p>
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1">Study MoM</p>
          </div>
          <div className="px-4 text-center">
            <p className="text-2xl sm:text-3xl font-black text-primary-light dark:text-primary-dark font-sans">{stats.totalFocusSessions}</p>
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1">Sessions</p>
          </div>
          <div className="pl-4 text-center">
            <p className="text-2xl sm:text-3xl font-black text-primary-light dark:text-primary-dark flex items-center justify-center gap-1 font-sans">
              <Flame size={18} className="text-amber-500" />
              {stats.longestStreak}
            </p>
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1">Best Streak</p>
          </div>
        </div>
      </div>

      {/* Top Subjects */}
      {stats.topSubjects.length > 0 && (
        <div className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Top Focus Subjects
            </p>
            <span className="text-xs font-bold text-muted-light dark:text-muted-dark">Cumulative hours</span>
          </div>

          <div className="space-y-3.5">
            {stats.topSubjects.map(([subj, mins], idx) => (
              <div key={subj} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-primary-light dark:text-primary-dark font-bold truncate">{subj}</span>
                  <span className="font-mono font-bold text-primary-light dark:text-primary-dark">
                    {Math.round(mins / 60)}h
                  </span>
                </div>
                <div className="w-full h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${(mins / stats.maxSubjectMins) * 100}%` }}
                    className={`h-full rounded-full transition-all duration-500 ease-out ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Insights */}
      <div className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1 font-mono">
          Personal Milestones
        </p>
        <div className="space-y-2.5">
          {stats.mostStudied && (
            <div className="flex items-center gap-4 p-3.5 rounded-[20px] bg-black/[0.025] dark:bg-white/[0.035]">
              <div className="w-11 h-11 rounded-[16px] bg-m3-lavender-badge/70 dark:bg-m3-lavender-darkBadge/70 text-m3-lavender-text dark:text-m3-lavender-darkText flex items-center justify-center flex-shrink-0 shadow-sm">
                <Award size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary-light dark:text-primary-dark">Top Subject Champion</p>
                <p className="text-xs text-muted-light dark:text-muted-dark mt-0.5">{stats.mostStudied[0]} · {Math.round(stats.mostStudied[1] / 60)}h total focused</p>
              </div>
            </div>
          )}

          {stats.mostConsistentDay && (
            <div className="flex items-center gap-4 p-3.5 rounded-[20px] bg-black/[0.025] dark:bg-white/[0.035]">
              <div className="w-11 h-11 rounded-[16px] bg-m3-mint-badge/70 dark:bg-m3-mint-darkBadge/70 text-m3-mint-text dark:text-m3-mint-darkText flex items-center justify-center flex-shrink-0 shadow-sm">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-primary-light dark:text-primary-dark">Peak Productivity Day</p>
                <p className="text-xs text-muted-light dark:text-muted-dark mt-0.5">{stats.mostConsistentDay[0]} · {stats.mostConsistentDay[1]} recorded sessions</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 p-3.5 rounded-[20px] bg-black/[0.025] dark:bg-white/[0.035]">
            <div className="w-11 h-11 rounded-[16px] bg-m3-rose-badge/70 dark:bg-m3-rose-darkBadge/70 text-m3-rose-text dark:text-m3-rose-darkText flex items-center justify-center flex-shrink-0 shadow-sm">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-light dark:text-primary-dark">Workout Momentum</p>
              <p className="text-xs text-muted-light dark:text-muted-dark mt-0.5">{stats.totalWorkouts} logged sessions completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
