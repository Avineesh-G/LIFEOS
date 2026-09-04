import { useNavigate } from 'react-router-dom';
import { BookOpen, Dumbbell, Wallet, Clock, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData } from '../types';

interface HomeProps {
  data: AppData;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function Home({ data }: HomeProps) {
  const navigate = useNavigate();
  const today  = format(new Date(), 'yyyy-MM-dd');
  const now    = new Date();

  // ── Study ──
  const todaySessions      = data.studySessions.filter(s => s.date === today);
  const todayStudyMinutes  = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const todayStudyHours    = Math.floor(todayStudyMinutes / 60);
  const todayStudyMins     = todayStudyMinutes % 60;

  // ── Gym ──
  const todayWorkout = data.workoutLogs.find(w => w.date === today);
  const todayPlan    = data.workoutPlans.find(p => {
    const map: Record<string, string> = {
      Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
      Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
    };
    return map[p.day] === format(now, 'EEEE');
  });

  // ── Spending ──
  const todayExpenses = data.expenses.filter(e => e.date === today);
  const todaySpent    = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  // ── Tasks ──
  const todayTasks     = data.tasks.filter(t => t.date === today);
  const completedTasks = todayTasks.filter(t => t.completed).length;

  // ── Next timetable block ──
  const nextBlock = data.timetable
    .filter(b => b.day === format(now, 'EEEE') && b.startTime > format(now, 'HH:mm'))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  // ── Day score (4 pillars × 25) ──
  const studyScore   = Math.min(25, (todayStudyMinutes / 120) * 25);
  const gymScore     = todayWorkout ? 25 : 0;
  const taskScore    = todayTasks.length > 0 ? (completedTasks / todayTasks.length) * 25 : 0;
  const spendScore   = todayExpenses.length > 0 ? 25 : 0;
  const dayScore     = Math.round(studyScore + gymScore + taskScore + spendScore);

  // ── Greeting ──
  const h = now.getHours();
  let greetWord = 'Evening';
  if (h < 12) greetWord = 'Morning';
  else if (h === 12) greetWord = 'Noon';
  else if (h < 17) greetWord = 'Afternoon';

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* ── Hero greeting ── */}
      <motion.div variants={item} className="pt-2 pb-1">
        <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">
          {format(now, 'EEEE, MMMM d')}
        </p>
        <h1 className="text-4xl font-bold tracking-tight leading-none text-primary-light dark:text-primary-dark">
          Good{' '}
          <span className="text-accent">
            {greetWord}
          </span>
        </h1>
      </motion.div>

      {/* ── Day Score card ── */}
      <motion.div variants={item} className="card p-5 shadow-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Day Score</p>
            <div className="flex items-end gap-1.5">
              <span className="text-5xl font-bold tracking-tight leading-none text-primary-light dark:text-primary-dark">
                {dayScore}
              </span>
              <span className="text-lg text-muted-light dark:text-muted-dark mb-1 font-medium">/100</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-bg-light dark:bg-bg-dark flex items-center justify-center">
            <TrendingUp size={20} className="text-secondary-light dark:text-secondary-dark" />
          </div>
        </div>
        {/* Segmented score bar */}
        <div className="flex gap-1">
          {[
            { score: studyScore,  max: 25 },
            { score: gymScore,    max: 25 },
            { score: taskScore,   max: 25 },
            { score: spendScore,  max: 25 },
          ].map((seg, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-bg-light dark:bg-bg-dark overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-light dark:bg-primary-dark transition-all duration-700"
                style={{ width: `${Math.round((seg.score / seg.max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1.5">
          {['Study', 'Gym', 'Tasks', 'Money'].map(l => (
            <span key={l} className="flex-1 label-mono text-muted-light dark:text-muted-dark text-center" style={{ fontSize: 8 }}>
              {l}
            </span>
          ))}
        </div>
      </motion.div>

      {/* ── 2×2 stat grid ── */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">

        {/* Study */}
        <button
          onClick={() => navigate('/study')}
          className="card p-4 text-left hover:shadow-card-hover active:scale-[0.975] transition-all duration-150 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
              <BookOpen size={15} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <ChevronRight size={14} className="text-muted-light dark:text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Study</p>
          <p className="text-2xl font-bold tracking-tight text-primary-light dark:text-primary-dark">
            {todayStudyHours}<span className="text-sm font-medium">h</span>{' '}
            {todayStudyMins}<span className="text-sm font-medium">m</span>
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
            {todaySessions.length} session{todaySessions.length !== 1 ? 's' : ''}
          </p>
        </button>

        {/* Gym */}
        <button
          onClick={() => navigate('/gym')}
          className="card p-4 text-left hover:shadow-card-hover active:scale-[0.975] transition-all duration-150 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
              <Dumbbell size={15} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <ChevronRight size={14} className="text-muted-light dark:text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Gym</p>
          <p className="text-2xl font-bold tracking-tight text-primary-light dark:text-primary-dark">
            {todayWorkout ? todayPlan?.type || 'Done' : todayPlan?.type || 'Rest'}
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
            {todayWorkout
              ? `${todayWorkout.exercises.reduce((s, ex) => s + ex.sets.filter(st => st.completed).length, 0)} sets done`
              : todayPlan && todayPlan.exercises.length > 0
                ? `${todayPlan.exercises.reduce((s, ex) => s + ex.sets, 0)} sets planned`
                : 'Rest day'}
          </p>
        </button>

        {/* Spending */}
        <button
          onClick={() => navigate('/spending')}
          className="card p-4 text-left hover:shadow-card-hover active:scale-[0.975] transition-all duration-150 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
              <Wallet size={15} className="text-amber-600 dark:text-amber-400" />
            </div>
            <ChevronRight size={14} className="text-muted-light dark:text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Spending</p>
          <p className="text-2xl font-bold tracking-tight text-primary-light dark:text-primary-dark">
            ₹{todaySpent.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
            {todayExpenses.length} transaction{todayExpenses.length !== 1 ? 's' : ''}
          </p>
        </button>

        {/* Next / Timetable */}
        <button
          onClick={() => nextBlock ? navigate('/study/timer') : navigate('/timetable')}
          className="card p-4 text-left hover:shadow-card-hover active:scale-[0.975] transition-all duration-150 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
              <Clock size={15} className="text-rose-600 dark:text-rose-400" />
            </div>
            <ChevronRight size={14} className="text-muted-light dark:text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Next Up</p>
          {nextBlock ? (
            <>
              <p className="text-lg font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight truncate">
                {nextBlock.subject}
              </p>
              <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
                {nextBlock.startTime} – {nextBlock.endTime}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold tracking-tight text-primary-light dark:text-primary-dark">Free</p>
              <p className="text-xs text-muted-light dark:text-muted-dark mt-1">Add timetable →</p>
            </>
          )}
        </button>
      </motion.div>

      {/* ── Tasks preview ── */}
      {todayTasks.length > 0 && (
        <motion.div variants={item} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <Calendar size={15} className="text-secondary-light dark:text-secondary-dark" />
              <p className="label-mono text-secondary-light dark:text-secondary-dark">
                Tasks · {completedTasks}/{todayTasks.length}
              </p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-[11px] font-mono font-medium text-primary-light dark:text-primary-dark flex items-center gap-0.5 hover:opacity-60 transition-opacity"
            >
              All <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {todayTasks.slice(0, 4).map(task => (
              <div key={task.id} className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded flex-shrink-0 border transition-colors ${
                  task.completed
                    ? 'bg-primary-light dark:bg-primary-dark border-primary-light dark:border-primary-dark'
                    : 'border-border-light dark:border-border-dark'
                } flex items-center justify-center`}>
                  {task.completed && (
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={`text-sm leading-snug ${
                  task.completed
                    ? 'line-through text-muted-light dark:text-muted-dark'
                    : 'text-primary-light dark:text-primary-dark'
                }`}>
                  {task.text}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Stats footer strip ── */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3 pb-2">
        {[
          { label: 'Study streak', value: `${data.studySessions.filter((s, i, arr) => i === 0 || s.date !== arr[i-1].date).length}d` },
          { label: 'Workouts', value: data.workoutLogs.length.toString() },
          { label: 'This month', value: `₹${data.expenses.filter(e => e.date.startsWith(format(now, 'yyyy-MM'))).reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}` },
        ].map(stat => (
          <div key={stat.label} className="card p-3.5 text-center">
            <p className="text-xl font-bold tracking-tight text-primary-light dark:text-primary-dark">{stat.value}</p>
            <p className="label-mono text-muted-light dark:text-muted-dark mt-1" style={{ fontSize: 8 }}>{stat.label}</p>
          </div>
        ))}
      </motion.div>

    </motion.div>
  );
}
