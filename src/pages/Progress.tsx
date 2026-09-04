import { BookOpen, Dumbbell, Wallet, Calendar, TrendingUp, Award, Flame, Zap } from 'lucide-react';
import { format, subDays, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData } from '../types';

interface ProgressProps {
  data: AppData;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.46, ease: 'easeOut' } } };

export default function Progress({ data }: ProgressProps) {
  const now = new Date();

  const totalStudyMins = data.studySessions.reduce((sum, s) => sum + s.duration, 0);
  const totalStudyHours = Math.floor(totalStudyMins / 60);
  const totalStudyMinsRem = totalStudyMins % 60;
  const totalWorkouts = data.workoutLogs.length;
  const totalSpent = data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalFocusSessions = data.studySessions.length;
  const daysTracked = new Set(data.studySessions.map(s => s.date)).size;

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthStudy = data.studySessions
    .filter(s => isWithinInterval(parseISO(s.date), { start: monthStart, end: monthEnd }))
    .reduce((sum, s) => sum + s.duration, 0);

  const lastMonthStart = startOfMonth(subDays(monthStart, 1));
  const lastMonthEnd = endOfMonth(subDays(monthStart, 1));
  const lastMonthStudy = data.studySessions
    .filter(s => isWithinInterval(parseISO(s.date), { start: lastMonthStart, end: lastMonthEnd }))
    .reduce((sum, s) => sum + s.duration, 0);

  const studyDelta = lastMonthStudy > 0
    ? Math.round(((monthStudy - lastMonthStudy) / lastMonthStudy) * 100)
    : 0;

  const subjectCounts: Record<string, number> = {};
  data.studySessions.forEach(s => {
    subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + s.duration;
  });
  const topSubjects = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const mostStudied = topSubjects[0];
  const maxSubjectMins = topSubjects[0]?.[1] || 1;

  const dayCounts: Record<string, number> = {};
  data.studySessions.forEach(s => {
    const day = format(parseISO(s.date), 'EEEE');
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  const mostConsistentDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

  const sortedDates = [...new Set(data.studySessions.map(s => s.date))].sort();
  let longestStreak = 0;
  let currentStreak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prev = parseISO(sortedDates[i - 1]);
      const curr = parseISO(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      currentStreak = diff === 1 ? currentStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak);
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={item} className="pt-2">
        <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">{format(now, 'MMMM yyyy')}</p>
        <h1 className="text-4xl font-bold tracking-tight leading-none text-primary-light dark:text-primary-dark">Progress</h1>
      </motion.div>

      {/* Big 4 Stats */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={13} className="text-indigo-500" />
            <p className="label-mono text-secondary-light dark:text-secondary-dark">Study</p>
          </div>
          <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">
            {totalStudyHours}h <span className="text-base font-medium text-secondary-light dark:text-secondary-dark">{totalStudyMinsRem}m</span>
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">{totalFocusSessions} sessions</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell size={13} className="text-emerald-500" />
            <p className="label-mono text-secondary-light dark:text-secondary-dark">Gym</p>
          </div>
          <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">{totalWorkouts}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">workouts logged</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={13} className="text-amber-500" />
            <p className="label-mono text-secondary-light dark:text-secondary-dark">Spent</p>
          </div>
          <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">₹{totalSpent.toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">all time</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={13} className="text-rose-500" />
            <p className="label-mono text-secondary-light dark:text-secondary-dark">Tracked</p>
          </div>
          <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">{daysTracked}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">days tracked</p>
        </div>
      </motion.div>

      {/* Monthly trend */}
      <motion.div variants={item} className="card p-5">
        <p className="label-mono text-secondary-light dark:text-secondary-dark mb-4">Monthly Trend</p>
        <div className="grid grid-cols-3 divide-x divide-border-light dark:divide-border-dark">
          <div className="pr-4 text-center">
            <p className={`text-2xl font-bold flex items-center justify-center gap-1 ${studyDelta >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
              <TrendingUp size={16} />
              {studyDelta > 0 ? '+' : ''}{studyDelta}%
            </p>
            <p className="label-mono text-muted-light dark:text-muted-dark mt-1">Study MoM</p>
          </div>
          <div className="px-4 text-center">
            <p className="text-2xl font-bold text-primary-light dark:text-primary-dark">{totalFocusSessions}</p>
            <p className="label-mono text-muted-light dark:text-muted-dark mt-1">Sessions</p>
          </div>
          <div className="pl-4 text-center">
            <p className="text-2xl font-bold text-primary-light dark:text-primary-dark flex items-center justify-center gap-1">
              <Flame size={16} className="text-orange-400" />
              {longestStreak}
            </p>
            <p className="label-mono text-muted-light dark:text-muted-dark mt-1">Best Streak</p>
          </div>
        </div>
      </motion.div>

      {/* Top Subjects */}
      {topSubjects.length > 0 && (
        <motion.div variants={item} className="card p-5">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-4">Top Subjects</p>
          <div className="space-y-3.5">
            {topSubjects.map(([subj, mins]) => (
              <div key={subj} className="flex items-center gap-3">
                <span className="text-sm font-medium text-primary-light dark:text-primary-dark w-24 truncate">{subj}</span>
                <div className="flex-1 h-1.5 bg-bg-light dark:bg-bg-dark rounded-full overflow-hidden border border-border-light dark:border-border-dark">
                  <div
                    className="h-full bg-primary-light dark:bg-primary-dark rounded-full transition-all duration-700"
                    style={{ width: `${(mins / maxSubjectMins) * 100}%` }}
                  />
                </div>
                <span className="label-mono text-muted-light dark:text-muted-dark w-12 text-right">{Math.round(mins / 60)}h</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Personal Insights */}
      <motion.div variants={item} className="card p-5">
        <p className="label-mono text-secondary-light dark:text-secondary-dark mb-4">Insights</p>
        <div className="space-y-3">
          {mostStudied && (
            <div className="flex items-center gap-3 py-2 border-b border-border-light dark:border-border-dark last:border-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                <Award size={13} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-light dark:text-primary-dark">Top Subject</p>
                <p className="label-mono text-muted-light dark:text-muted-dark">{mostStudied[0]} · {Math.round(mostStudied[1] / 60)}h total</p>
              </div>
            </div>
          )}
          {mostConsistentDay && (
            <div className="flex items-center gap-3 py-2 border-b border-border-light dark:border-border-dark last:border-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                <Calendar size={13} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-light dark:text-primary-dark">Most Consistent Day</p>
                <p className="label-mono text-muted-light dark:text-muted-dark">{mostConsistentDay[0]} · {mostConsistentDay[1]} sessions</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 py-2 border-b border-border-light dark:border-border-dark last:border-0">
            <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
              <Flame size={13} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-light dark:text-primary-dark">Longest Streak</p>
              <p className="label-mono text-muted-light dark:text-muted-dark">{longestStreak} consecutive days</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
              <Zap size={13} className="text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary-light dark:text-primary-dark">Total Workouts</p>
              <p className="label-mono text-muted-light dark:text-muted-dark">{totalWorkouts} logged sessions</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
