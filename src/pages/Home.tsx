import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Dumbbell, 
  Wallet, 
  Clock, 
  ChevronRight, 
  Calendar, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  Check, 
  CalendarDays,
  Plus
} from 'lucide-react';
import { format, isToday, isSameDay, addDays, subDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import type { AppData } from '../types';
import DailyQuoteMarquee from '../components/DailyQuoteMarquee';

interface HomeProps {
  data: AppData;
  refresh?: () => Promise<AppData>;
  updateData?: (partial: Partial<AppData>) => Promise<AppData>;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

export default function Home({ data, refresh, updateData }: HomeProps) {
  const navigate = useNavigate();
  const [now, setNow] = useState<Date>(() => new Date());
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // ── Selected Date State (Defaults to Today) ──
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));

  // 7-day rolling window centered on today: 3 past, today, 3 future
  const weekDays = useMemo(() => {
    const today = startOfDay(new Date());
    return [-3, -2, -1, 0, 1, 2, 3].map(offset => addDays(today, offset));
  }, []);

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

  // ── Selected Date Data Calculations ──
  const selectedDateData = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayOfWeek = format(selectedDate, 'EEEE');
    const isSelPast = isBefore(selectedDate, startOfDay(new Date()));
    const isSelToday = isToday(selectedDate);
    const isSelFuture = isAfter(selectedDate, startOfDay(new Date()));

    // Study
    const sessions = (data.studySessions || []).filter(s => s.date === dateStr);
    const studyMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const studyHours = Math.floor(studyMinutes / 60);
    const studyMins = studyMinutes % 60;

    // Gym
    const workoutLog = (data.workoutLogs || []).find(w => w.date === dateStr);
    const dayMap: Record<string, string> = {
      Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
      Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
    };
    const plannedWorkout = (data.workoutPlans || []).find(p => dayMap[p.day] === dayOfWeek);

    // Expenses
    const expenses = (data.expenses || []).filter(e => e.date === dateStr);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Tasks
    const tasks = (data.tasks || []).filter(t => t.date === dateStr);
    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);

    // Timetable
    const timetableBlocks = (data.timetable || [])
      .filter(b => b.day === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const nowTimeStr = format(new Date(), 'HH:mm');
    const nextBlockToday = isSelToday
      ? timetableBlocks.find(b => b.startTime > nowTimeStr) || null
      : null;

    return {
      dateStr,
      dayOfWeek,
      isSelPast,
      isSelToday,
      isSelFuture,
      sessions,
      studyMinutes,
      studyHours,
      studyMins,
      workoutLog,
      plannedWorkout,
      expenses,
      totalSpent,
      tasks,
      completedTasks,
      pendingTasks,
      timetableBlocks,
      nextBlockToday,
    };
  }, [selectedDate, data]);

  // Micro dot indicators for each day
  const getDayDots = (d: Date) => {
    const dStr = format(d, 'yyyy-MM-dd');
    const hasStudy = (data.studySessions || []).some(s => s.date === dStr && s.duration > 0);
    const hasGym = (data.workoutLogs || []).some(w => w.date === dStr);
    const hasTasks = (data.tasks || []).some(t => t.date === dStr && t.completed);
    const hasExpense = (data.expenses || []).some(e => e.date === dStr);
    return { hasStudy, hasGym, hasTasks, hasExpense };
  };

  const handleToggleTask = async (taskId: string) => {
    if (!updateData) return;
    triggerHaptic('medium');
    const updated = (data.tasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    await updateData({ tasks: updated });
  };

  // ── Today Stats for 2x2 cards below ──
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
  } = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const nowDate = new Date();

    const todaySessions = (data.studySessions || []).filter(s => s.date === todayStr);
    const todayStudyMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const studyHours = Math.floor(todayStudyMinutes / 60);
    const studyMins = todayStudyMinutes % 60;

    const workout = (data.workoutLogs || []).find(w => w.date === todayStr);
    const dayMap: Record<string, string> = {
      Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
      Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
    };
    const plan = (data.workoutPlans || []).find(p => dayMap[p.day] === format(nowDate, 'EEEE'));

    const todayExpenses = (data.expenses || []).filter(e => e.date === todayStr);
    const spent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    const tasks = (data.tasks || []).filter(t => t.date === todayStr);
    const completed = tasks.filter(t => t.completed).length;

    const next = (data.timetable || [])
      .filter(b => b.day === format(nowDate, 'EEEE') && b.startTime > format(nowDate, 'HH:mm'))
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

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
    };
  }, [data]);

  // Greeting based on exact time of day
  const h = now.getHours();
  let greetWord = 'Night';
  if (h >= 4 && h < 12) greetWord = 'Morning';
  else if (h >= 12 && h < 17) greetWord = 'Afternoon';
  else if (h >= 17 && h < 22) greetWord = 'Evening';
  else greetWord = 'Night';

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
        </div>
        <h1 className="text-[34px] sm:text-4xl font-black tracking-tight text-primary-light dark:text-primary-dark leading-tight">
          Good <span className="text-accent">{greetWord}</span>
        </h1>
      </motion.div>

      {/* ── Ambient Daily Quote Marquee (Offline No-Repeat Rotation) ── */}
      <motion.div variants={item} className="px-1 -my-1">
        <DailyQuoteMarquee />
      </motion.div>

      {/* ── Option 1: Interactive 7-Day Dynamic Strip ── */}
      <motion.div
        variants={item}
        className="rounded-[32px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 shadow-m3-subtle relative overflow-hidden"
      >
        {/* Header Row */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
              <CalendarDays size={16} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold tracking-tight text-primary-light dark:text-primary-dark truncate">
                {isToday(selectedDate)
                  ? 'Today'
                  : isSameDay(selectedDate, subDays(new Date(), 1))
                  ? 'Yesterday'
                  : isSameDay(selectedDate, addDays(new Date(), 1))
                  ? 'Tomorrow'
                  : format(selectedDate, 'EEEE')}
              </h2>
              <p className="text-[11px] font-medium text-secondary-light dark:text-secondary-dark truncate">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isToday(selectedDate) && (
              <button
                onClick={() => setSelectedDate(startOfDay(new Date()))}
                className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-primary-light dark:text-primary-dark hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 transition-all"
              >
                Today
              </button>
            )}
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                selectedDateData.isSelToday
                  ? 'bg-accent/15 dark:bg-accent/25 text-accent'
                  : selectedDateData.isSelPast
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-secondary-light dark:text-secondary-dark'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {selectedDateData.isSelToday ? 'Live Today' : selectedDateData.isSelPast ? 'Completed' : 'Upcoming'}
            </span>
          </div>
        </div>

        {/* 7-Day Interactive Horizontal Strip */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-4">
          {weekDays.map((d) => {
            const isSel = isSameDay(d, selectedDate);
            const isCur = isToday(d);
            const dots = getDayDots(d);

            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center justify-between py-2 sm:py-2.5 px-0.5 rounded-[20px] transition-all relative ${
                  isSel
                    ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.03]'
                    : isCur
                    ? 'bg-accent/10 dark:bg-accent/15 text-accent font-bold border border-accent/40'
                    : 'bg-neutral-50/80 dark:bg-neutral-800/40 text-secondary-light dark:text-secondary-dark border border-neutral-100/80 dark:border-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span className={`text-[10px] sm:text-[11px] font-medium tracking-tight ${
                  isSel ? 'text-white/90' : isCur ? 'text-accent font-bold' : 'text-muted-light dark:text-muted-dark'
                }`}>
                  {format(d, 'EEE')}
                </span>

                <span className={`text-sm sm:text-base font-bold my-0.5 ${
                  isSel ? 'text-white' : isCur ? 'text-accent' : 'text-primary-light dark:text-primary-dark'
                }`}>
                  {format(d, 'd')}
                </span>

                {/* Micro Achievement Dots */}
                <div className="flex items-center justify-center gap-0.5 h-1.5 mt-0.5">
                  {dots.hasStudy && (
                    <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-indigo-500'}`} />
                  )}
                  {dots.hasGym && (
                    <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-emerald-500'}`} />
                  )}
                  {dots.hasTasks && (
                    <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-purple-500'}`} />
                  )}
                  {dots.hasExpense && (
                    <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-white' : 'bg-amber-500'}`} />
                  )}
                  {!dots.hasStudy && !dots.hasGym && !dots.hasTasks && !dots.hasExpense && (
                    <span className="w-1 h-1 rounded-full opacity-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Day Insights Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDateData.dateStr}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-3.5 pt-1"
          >
            {/* ── 1. WHAT WAS DONE / ACCOMPLISHED ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-light dark:text-muted-dark">
                  {selectedDateData.isSelPast ? 'Accomplished on this day' : selectedDateData.isSelToday ? 'Accomplished so far' : 'Expected focus'}
                </span>
                <span className="text-[10px] font-mono font-semibold text-secondary-light dark:text-secondary-dark">
                  {selectedDateData.dayOfWeek}
                </span>
              </div>

              {/* 4 Pillars Mini Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {/* Study Pillar */}
                <div className="p-3 rounded-[20px] bg-neutral-50/90 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/60 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[12px] bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                    <BookOpen size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary-light dark:text-primary-dark truncate">
                      {selectedDateData.studyMinutes > 0 
                        ? `${selectedDateData.studyHours}h ${selectedDateData.studyMins}m`
                        : selectedDateData.isSelFuture ? 'Scheduled' : '0m logged'}
                    </p>
                    <p className="text-[10px] font-medium text-secondary-light dark:text-secondary-dark truncate">
                      {selectedDateData.sessions.length > 0 
                        ? `${selectedDateData.sessions.length} session${selectedDateData.sessions.length !== 1 ? 's' : ''}` 
                        : 'Study Time'}
                    </p>
                  </div>
                </div>

                {/* Gym Pillar */}
                <div className="p-3 rounded-[20px] bg-neutral-50/90 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/60 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                    <Dumbbell size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary-light dark:text-primary-dark truncate">
                      {selectedDateData.workoutLog 
                        ? (selectedDateData.workoutLog.type || 'Completed') 
                        : (selectedDateData.plannedWorkout?.type || 'Rest Day')}
                    </p>
                    <p className="text-[10px] font-medium text-secondary-light dark:text-secondary-dark truncate">
                      {selectedDateData.workoutLog 
                        ? 'Workout Done' 
                        : selectedDateData.plannedWorkout?.type ? 'Split Planned' : 'Recovery'}
                    </p>
                  </div>
                </div>

                {/* Tasks Pillar */}
                <div className="p-3 rounded-[20px] bg-neutral-50/90 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/60 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[12px] bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                    <CheckCircle2 size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary-light dark:text-primary-dark truncate">
                      {selectedDateData.tasks.length > 0 
                        ? `${selectedDateData.completedTasks.length}/${selectedDateData.tasks.length} Done`
                        : '0 Tasks'}
                    </p>
                    <p className="text-[10px] font-medium text-secondary-light dark:text-secondary-dark truncate">
                      {selectedDateData.pendingTasks.length > 0 
                        ? `${selectedDateData.pendingTasks.length} pending` 
                        : selectedDateData.tasks.length > 0 ? 'All finished' : 'No tasks'}
                    </p>
                  </div>
                </div>

                {/* Spending Pillar */}
                <div className="p-3 rounded-[20px] bg-neutral-50/90 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/60 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[12px] bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <Wallet size={16} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary-light dark:text-primary-dark truncate">
                      ₹{selectedDateData.totalSpent.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] font-medium text-secondary-light dark:text-secondary-dark truncate">
                      {selectedDateData.expenses.length > 0 
                        ? `${selectedDateData.expenses.length} record${selectedDateData.expenses.length !== 1 ? 's' : ''}` 
                        : 'Spending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2. WHAT'S THERE TO DO / UPCOMING SCHEDULE ── */}
            <div className="pt-2.5 border-t border-border-light/40 dark:border-border-dark/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-light dark:text-muted-dark">
                  {selectedDateData.isSelPast ? 'Completed Task Log' : selectedDateData.isSelToday ? 'Up next / There to do' : 'Scheduled Plan & Timetable'}
                </span>
                <span className="text-[10px] font-mono font-semibold text-accent">
                  {selectedDateData.isSelToday ? 'Active' : selectedDateData.isSelPast ? 'Archived' : 'Upcoming'}
                </span>
              </div>

              {/* A: If Today, show Next Class + Pending Tasks */}
              {selectedDateData.isSelToday && (
                <div className="space-y-2">
                  {selectedDateData.nextBlockToday && (
                    <div 
                      onClick={() => navigate('/timetable')}
                      className="p-3 rounded-[18px] bg-m3-rose-container/50 dark:bg-m3-rose-darkContainer/50 border border-m3-rose-badge/40 flex items-center justify-between gap-2 cursor-pointer active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Clock size={16} className="text-m3-rose-text dark:text-m3-rose-darkText flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-primary-light dark:text-primary-dark truncate">
                            Next Class: {selectedDateData.nextBlockToday.subject}
                          </p>
                          <p className="text-[10px] font-medium text-secondary-light dark:text-secondary-dark truncate">
                            {selectedDateData.nextBlockToday.startTime} – {selectedDateData.nextBlockToday.endTime}
                            {selectedDateData.nextBlockToday.room ? ` • Room ${selectedDateData.nextBlockToday.room}` : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-secondary-light dark:text-secondary-dark flex-shrink-0" />
                    </div>
                  )}

                  {selectedDateData.pendingTasks.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedDateData.pendingTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-neutral-50/90 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/60"
                        >
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="w-4 h-4 rounded-[6px] border-2 border-neutral-300 dark:border-neutral-600 flex items-center justify-center flex-shrink-0 hover:border-accent transition-colors"
                          />
                          <span className="text-xs font-medium text-primary-light dark:text-primary-dark truncate flex-1 min-w-0">
                            {task.text}
                          </span>
                          {task.subtask && (
                            <span className="text-[10px] text-muted-light dark:text-muted-dark truncate flex-shrink-0">
                              {task.subtask}
                            </span>
                          )}
                        </div>
                      ))}
                      {selectedDateData.pendingTasks.length > 3 && (
                        <button
                          onClick={() => navigate('/tasks')}
                          className="text-[11px] font-semibold text-accent hover:underline block text-center w-full py-1"
                        >
                          +{selectedDateData.pendingTasks.length - 3} more tasks to do
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-[18px] bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 text-center">
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        {selectedDateData.tasks.length > 0 
                          ? '🎉 All tasks completed for today!' 
                          : 'No pending tasks for today · All clear'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* B: If Past Day, show completed summary */}
              {selectedDateData.isSelPast && (
                <div className="space-y-2">
                  {selectedDateData.completedTasks.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedDateData.completedTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2.5 p-2 rounded-[16px] bg-neutral-50/60 dark:bg-neutral-800/30 border border-neutral-100 dark:border-neutral-800/40"
                        >
                          <div className="w-4 h-4 rounded-[6px] bg-accent text-white flex items-center justify-center flex-shrink-0">
                            <Check size={10} strokeWidth={2.5} />
                          </div>
                          <span className="text-xs font-medium text-secondary-light dark:text-secondary-dark line-through truncate flex-1 min-w-0">
                            {task.text}
                          </span>
                        </div>
                      ))}
                      {selectedDateData.completedTasks.length > 3 && (
                        <p className="text-[11px] text-secondary-light dark:text-secondary-dark text-center">
                          +{selectedDateData.completedTasks.length - 3} other tasks completed
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-[18px] bg-neutral-50/70 dark:bg-neutral-800/40 text-center border border-neutral-100 dark:border-neutral-800/60">
                      <p className="text-xs font-medium text-secondary-light dark:text-secondary-dark">
                        {selectedDateData.studyMinutes > 0 || selectedDateData.workoutLog
                          ? 'Day archived with core habits logged.'
                          : 'No tasks or logs recorded for this day.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* C: If Future Day, show Scheduled Split & Classes */}
              {selectedDateData.isSelFuture && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div 
                      onClick={() => navigate('/gym')}
                      className="p-3 rounded-[18px] bg-m3-mint-container/40 dark:bg-m3-mint-darkContainer/40 border border-m3-mint-badge/40 cursor-pointer active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Dumbbell size={14} className="text-m3-mint-text dark:text-m3-mint-darkText flex-shrink-0" />
                        <span className="text-[10px] font-mono uppercase font-bold text-m3-mint-text dark:text-m3-mint-darkText">
                          Split Planned
                        </span>
                      </div>
                      <p className="text-xs font-bold text-primary-light dark:text-primary-dark truncate">
                        {selectedDateData.plannedWorkout?.type || 'Rest Day'}
                      </p>
                      <p className="text-[10px] text-secondary-light dark:text-secondary-dark truncate">
                        {selectedDateData.plannedWorkout ? `${(selectedDateData.plannedWorkout.exercises || []).length} exercises in queue` : 'Recovery day'}
                      </p>
                    </div>

                    <div 
                      onClick={() => navigate('/timetable')}
                      className="p-3 rounded-[18px] bg-m3-rose-container/40 dark:bg-m3-rose-darkContainer/40 border border-m3-rose-badge/40 cursor-pointer active:scale-[0.99] transition-transform"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} className="text-m3-rose-text dark:text-m3-rose-darkText flex-shrink-0" />
                        <span className="text-[10px] font-mono uppercase font-bold text-m3-rose-text dark:text-m3-rose-darkText">
                          Timetable
                        </span>
                      </div>
                      <p className="text-xs font-bold text-primary-light dark:text-primary-dark truncate">
                        {selectedDateData.timetableBlocks.length > 0 
                          ? `${selectedDateData.timetableBlocks.length} Class${selectedDateData.timetableBlocks.length !== 1 ? 'es' : ''}`
                          : 'No Classes'}
                      </p>
                      <p className="text-[10px] text-secondary-light dark:text-secondary-dark truncate">
                        {selectedDateData.timetableBlocks.length > 0 
                          ? selectedDateData.timetableBlocks.map(b => b.subject).slice(0, 2).join(', ')
                          : 'Free Schedule'}
                      </p>
                    </div>
                  </div>

                  {/* Future Tasks if scheduled */}
                  {selectedDateData.tasks.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      {selectedDateData.tasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2.5 p-2.5 rounded-[16px] bg-neutral-50/90 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/60"
                        >
                          <div className="w-4 h-4 rounded-[6px] border-2 border-neutral-300 dark:border-neutral-600 flex-shrink-0" />
                          <span className="text-xs font-medium text-primary-light dark:text-primary-dark truncate flex-1 min-w-0">
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate('/tasks')}
                      className="w-full py-2.5 px-3 rounded-[16px] border border-dashed border-border-light dark:border-border-dark flex items-center justify-center gap-1.5 text-xs font-semibold text-secondary-light dark:text-secondary-dark hover:text-accent hover:border-accent transition-colors"
                    >
                      <Plus size={13} />
                      Plan task for {format(selectedDate, 'EEE, MMM d')}
                    </button>
                  )}
                </div>
              )}
            </div>

          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ── 2×2 Tonal Expressive Cards ── */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:gap-5">

        {/* 1. Study Card (Soft Lavender) */}
        <motion.button
          whileTap={{ scale: 0.975 }}
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
