import { useState, useMemo, useEffect, memo } from 'react';
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
  Plus,
  Play
} from 'lucide-react';
import { format, isToday, isSameDay, addDays, subDays, isBefore, isAfter, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import type { AppData } from '../types';
import DailyQuoteMarquee from '../components/DailyQuoteMarquee';
import M3StatWidget from '../components/M3StatWidget';
import AiCoachAvatar from '../components/rive/AiCoachAvatar';
import StreakIndicator from '../components/rive/StreakIndicator';
import InteractiveClock from '../components/interactive/InteractiveClock';
import InteractiveDumbbell from '../components/interactive/InteractiveDumbbell';
import InteractiveCheckbox from '../components/interactive/InteractiveCheckbox';
import { CATEGORY_COLORS } from '../theme/cardThemeTokens';
import { M3_SHAPES } from '../theme/shapes';
import { SkeletonGate, SkeletonCard, SkeletonStatRow, SkeletonHeroCard } from '../components/Skeleton';

// ── LiveClock — isolated so its 30s tick doesn't re-render the whole Home page ──
const LiveClock = memo(function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] shadow-none">
      <Clock size={13} className="text-[var(--md-primary)] shrink-0" />
      <span className="text-xs font-semibold tracking-wide text-[var(--md-on-surface)]">
        {format(now, 'EEEE, MMMM d')}
      </span>
    </div>
  );
});

// ── DayCell — memoized so selecting one day doesn't re-render all 7 ──
const DayCell = memo(function DayCell({
  d, selectedDate, setSelectedDate, getDayDots
}: {
  d: Date;
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  getDayDots: (d: Date) => { hasStudy: boolean; hasGym: boolean; hasTasks: boolean; hasExpense: boolean };
}) {
  const isSel = isSameDay(d, selectedDate);
  const isCur = isToday(d);
  const dots = getDayDots(d);
  return (
    <button
      key={d.toISOString()}
      onClick={() => {
        triggerHaptic('light');
        setSelectedDate(d);
      }}
      className={`relative flex flex-col items-center justify-between py-2 sm:py-2.5 px-0.5 rounded-[var(--md-shape-xl)] transition-all select-none focus:outline-none bouncy-tap ${
        !isSel && isCur
          ? 'border border-[var(--accent-primary)]/40 bg-[var(--pill-active-bg)]'
          : !isSel
          ? 'hover:bg-[var(--pill-active-bg)]'
          : ''
      }`}
    >
      {isSel && (
        <motion.div
          layoutId="activeHomeDatePill"
          className="absolute inset-0 rounded-[20px] bg-[var(--md-primary)] shadow-none"
          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
        />
      )}
      <span className={`relative z-10 text-[10px] sm:text-[11px] font-medium tracking-tight transition-colors ${
        isSel ? 'text-[var(--md-on-primary)]' : isCur ? 'text-[var(--md-primary)] font-bold' : 'text-[var(--md-on-surface-variant)]'
      }`}>
        {format(d, 'EEE')}
      </span>
      <span className={`relative z-10 text-sm sm:text-base font-bold my-0.5 transition-colors font-stat ${
        isSel ? 'text-[var(--md-on-primary)]' : isCur ? 'text-[var(--md-primary)] font-extrabold' : 'text-[var(--md-on-surface)]'
      }`}>
        {format(d, 'd')}
      </span>
      <div className="relative z-10 flex items-center justify-center gap-0.5 h-1.5 mt-0.5">
        {dots.hasStudy && <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-[var(--accent-contrast)]' : 'bg-[#3B82F6]'}`} />}
        {dots.hasGym && <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-[var(--accent-contrast)]' : 'bg-[#22C55E]'}`} />}
        {dots.hasTasks && <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-[var(--accent-contrast)]' : 'bg-[var(--accent-primary)]'}`} />}
        {dots.hasExpense && <span className={`w-1 h-1 rounded-full ${isSel ? 'bg-[var(--accent-contrast)]' : 'bg-[#F5A623]'}`} />}
        {!dots.hasStudy && !dots.hasGym && !dots.hasTasks && !dots.hasExpense && (
          <span className="w-1 h-1 rounded-full opacity-0" />
        )}
      </div>
    </button>
  );
});

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
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  // 'ready' = data is not DEFAULT_DATA (i.e. real user data has hydrated)
  const [dataReady, setDataReady] = useState(() => (
    Array.isArray((data as any)?.studySessions) && (data as any).studySessions.length > 0
  ));
  useEffect(() => {
    if (!dataReady && data?.studySessions !== undefined) {
      setDataReady(true);
    }
  }, [data]);

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

  const handleToggleTask = (taskId: string) => {
    if (!updateData) return;
    triggerHaptic('medium');
    const updated = (data.tasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    updateData({ tasks: updated });
  };

  // ── Today's Core Highlights for Quick Glance ──
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
    const dayOfWeek = format(new Date(), 'EEEE');
    const sessions = (data.studySessions || []).filter(s => s.date === todayStr);
    const studyMinsTotal = sessions.reduce((sum, s) => sum + s.duration, 0);
    const studyHours = Math.floor(studyMinsTotal / 60);
    const studyMins = studyMinsTotal % 60;

    const workout = (data.workoutLogs || []).find(w => w.date === todayStr);
    const dayMap: Record<string, string> = {
      Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
      Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
    };
    const plan = (data.workoutPlans || []).find(p => dayMap[p.day] === dayOfWeek);

    const expenses = (data.expenses || []).filter(e => e.date === todayStr);
    const spent = expenses.reduce((sum, e) => sum + e.amount, 0);

    const tasks = (data.tasks || []).filter(t => t.date === todayStr);
    const completed = tasks.filter(t => t.completed).length;

    const nowTimeStr = format(new Date(), 'HH:mm');
    const next = (data.timetable || [])
      .filter(b => b.day === dayOfWeek && b.startTime > nowTimeStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

    return {
      todaySessions: sessions,
      todayStudyHours: studyHours,
      todayStudyMins: studyMins,
      todayWorkout: workout,
      todayPlan: plan,
      todayExpenses: expenses,
      todaySpent: spent,
      todayTasks: tasks,
      completedTasks: completed,
      nextBlock: next,
    };
  }, [data]);

  return (
    <SkeletonGate
      ready={dataReady}
      skeleton={
        <div className="space-y-6">
          <SkeletonHeroCard />
          <SkeletonCard height="h-28" />
          <SkeletonCard height="h-44" />
          <SkeletonStatRow />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonCard height="h-32" />
            <SkeletonCard height="h-32" />
          </div>
        </div>
      }
    >
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

      {/* ── Ambient Executive Greeting Hero Card (M3 Signature Asymmetric Shape) ── */}
      <motion.div
        variants={item}
        className={`${M3_SHAPES.asymmetricHero} p-6 sm:p-7 m3-elevation-1 border border-[var(--md-outline-variant)] space-y-4 select-none`}
      >
        {/* Top Header Row: Date Pill, Mode Badge & Streak */}
        <div className="flex items-center gap-2 flex-wrap">
          <LiveClock />

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-tag font-bold tracking-wider uppercase border bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] border-[var(--md-outline-variant)] shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-primary)] animate-pulse" />
            Active Session
          </span>

          <StreakIndicator
            streak={data.studySessions.filter((s, i, arr) => i === 0 || s.date !== arr[i-1].date).length || 1}
            size="sm"
          />
        </div>

        {/* Hero Title Row with AI Coach Avatar on Right */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="m3-headline-l-emphasized text-2xl sm:text-3xl md:text-4xl text-[var(--md-on-surface)] leading-tight">
              Welcome to{' '}
              <span
                style={{ backgroundImage: 'var(--headline-gradient)' }}
                className="bg-clip-text text-transparent"
              >
                LifeOS
              </span>
            </h1>

            {/* Motivational Subline */}
            <p className="text-xs sm:text-[13px] font-medium text-[var(--md-on-surface-variant)] mt-1.5 tracking-tight flex items-center gap-1.5">
              <Sparkles size={13} className="text-[var(--md-primary)] shrink-0 opacity-90" />
              <span>Your personal operating system · Focus and execute</span>
            </p>
          </div>

          <AiCoachAvatar state="idle" size={54} />
        </div>
      </motion.div>

      {/* ── Daily Wisdom & Focus Card (Editorial Standalone Card) ── */}
      <motion.div variants={item}>
        <DailyQuoteMarquee />
      </motion.div>

      {/* ── Option 1: Interactive 7-Day Dynamic Strip (M3 Elevation Level 2) ── */}
      <motion.div
        variants={item}
        className="rounded-[28px] p-5 sm:p-6 m3-elevation-2 border border-[var(--md-outline-variant)] relative overflow-hidden transition-all duration-300"
      >
        {/* Header Row */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[16px] bg-[var(--md-surface-container-high)] flex items-center justify-center text-[var(--md-primary)] flex-shrink-0">
              <CalendarDays size={16} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-heading font-bold tracking-tight text-[var(--md-on-surface)] break-words leading-tight">
                {isToday(selectedDate)
                  ? 'Today'
                  : isSameDay(selectedDate, subDays(new Date(), 1))
                  ? 'Yesterday'
                  : isSameDay(selectedDate, addDays(new Date(), 1))
                  ? 'Tomorrow'
                  : format(selectedDate, 'EEEE')}
              </h2>
              <p className="text-[11px] font-medium text-secondary-light dark:text-secondary-dark break-words leading-tight">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {!isToday(selectedDate) && (
              <button
                onClick={() => setSelectedDate(startOfDay(new Date()))}
                className="px-2 sm:px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] border border-[var(--md-outline-variant)] hover:opacity-85 active:scale-95 transition-all select-none"
              >
                Today
              </button>
            )}
            <span
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wide border ${
                selectedDateData.isSelToday
                  ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] border-[var(--md-outline-variant)]'
                  : selectedDateData.isSelPast
                  ? 'bg-[var(--md-surface-container-low)] text-[var(--md-on-surface-variant)] border-[var(--md-outline-variant)]'
                  : 'bg-emerald-500/12 text-[#22C55E] border-[#22C55E]/20'
              }`}
            >
              {selectedDateData.isSelToday ? 'Live Today' : selectedDateData.isSelPast ? 'Completed' : 'Upcoming'}
            </span>
          </div>
        </div>

        {/* 7-Day Interactive Horizontal Strip with Fluid Spring Capsule */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-4 p-1 rounded-[24px] bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)]">
          {weekDays.map((d) => (
            <DayCell
              key={d.toISOString()}
              d={d}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              getDayDots={getDayDots}
            />
          ))}
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
                <span className="text-[10px] font-tag font-bold uppercase tracking-wider text-muted-light dark:text-muted-dark">
                  {selectedDateData.isSelPast ? 'Accomplished on this day' : selectedDateData.isSelToday ? 'Accomplished so far' : 'Expected focus'}
                </span>
                <span className="text-[10px] font-tag font-semibold text-secondary-light dark:text-secondary-dark uppercase tracking-wider">
                  {selectedDateData.dayOfWeek}
                </span>
              </div>

              {/* 4 Pillars Mini Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {/* Study Pillar */}
                <div
                  onClick={() => { triggerHaptic('nav'); navigate('/study'); }}
                  className="p-2.5 sm:p-3 rounded-[16px] m3-elevation-1 border border-[var(--md-outline-variant)] flex items-center gap-2 sm:gap-2.5 transition-all cursor-pointer bouncy-tap select-none min-w-0"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[12px] sm:rounded-[16px] bg-[#3B82F6]/12 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] flex-shrink-0">
                    <InteractiveClock size={16} isRunning={selectedDateData.studyMinutes > 0} progressPercent={Math.min((selectedDateData.studyMinutes / 120) * 100, 100)} showAura={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-xs font-bold text-primary-light dark:text-primary-dark font-stat leading-tight break-words">
                      {selectedDateData.studyMinutes > 0 ? (
                        <>
                          <span className="font-stat">{selectedDateData.studyHours}</span>h{' '}
                          <span className="font-stat">{selectedDateData.studyMins}</span>m
                        </>
                      ) : selectedDateData.isSelFuture ? 'Scheduled' : '0m logged'}
                    </p>
                    <p className="text-[9.5px] sm:text-[10px] font-medium text-secondary-light dark:text-secondary-dark leading-tight mt-0.5 break-words">
                      {selectedDateData.sessions.length > 0 ? (
                        <>
                          <span className="font-stat">{selectedDateData.sessions.length}</span> session{selectedDateData.sessions.length !== 1 ? 's' : ''}
                        </>
                      ) : 'Study Time'}
                    </p>
                  </div>
                </div>

                {/* Gym Pillar */}
                <div
                  onClick={() => { triggerHaptic('nav'); navigate('/gym'); }}
                  className="p-2.5 sm:p-3 rounded-[16px] m3-elevation-1 border border-[var(--md-outline-variant)] flex items-center gap-2 sm:gap-2.5 transition-all cursor-pointer bouncy-tap select-none min-w-0"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[12px] sm:rounded-[16px] bg-[#22C55E]/12 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] flex-shrink-0">
                    <InteractiveDumbbell size={16} isCompleted={!!selectedDateData.workoutLog} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-xs font-bold text-primary-light dark:text-primary-dark font-stat leading-tight break-words">
                      {selectedDateData.workoutLog 
                        ? (selectedDateData.workoutLog.type || 'Completed') 
                        : (selectedDateData.plannedWorkout?.type || 'Rest Day')}
                    </p>
                    <p className="text-[9.5px] sm:text-[10px] font-medium text-secondary-light dark:text-secondary-dark leading-tight mt-0.5 break-words">
                      {selectedDateData.workoutLog 
                        ? 'Workout Done' 
                        : selectedDateData.plannedWorkout?.type ? 'Split Planned' : 'Recovery'}
                    </p>
                  </div>
                </div>

                {/* Tasks Pillar */}
                <div
                  onClick={() => { triggerHaptic('nav'); navigate('/tasks'); }}
                  className="p-2.5 sm:p-3 rounded-[16px] m3-elevation-1 border border-[var(--md-outline-variant)] flex items-center gap-2 sm:gap-2.5 transition-all cursor-pointer bouncy-tap select-none min-w-0"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[12px] sm:rounded-[16px] bg-[var(--md-primary)]/12 border border-[var(--md-primary)]/20 flex items-center justify-center text-[var(--md-primary)] flex-shrink-0">
                    <CheckCircle2 size={15} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] sm:text-xs font-bold text-primary-light dark:text-primary-dark font-stat leading-tight break-words">
                      {selectedDateData.tasks.length > 0 ? (
                        <>
                          <span className="font-stat">{selectedDateData.completedTasks.length}</span>/
                          <span className="font-stat">{selectedDateData.tasks.length}</span> Done
                        </>
                      ) : '0 Tasks'}
                    </p>
                    <p className="text-[9.5px] sm:text-[10px] font-medium text-secondary-light dark:text-secondary-dark leading-tight mt-0.5 break-words">
                      {selectedDateData.pendingTasks.length > 0 ? (
                        <>
                          <span className="font-stat">{selectedDateData.pendingTasks.length}</span> pending
                        </>
                      ) : selectedDateData.tasks.length > 0 ? 'All finished' : 'No tasks'}
                    </p>
                  </div>
                </div>

                {/* Spending Pillar */}
                <div
                  onClick={() => { triggerHaptic('nav'); navigate('/spending'); }}
                  className="p-2.5 sm:p-3 rounded-[16px] m3-elevation-1 border border-[var(--md-outline-variant)] flex items-center gap-2 sm:gap-2.5 transition-all cursor-pointer bouncy-tap select-none min-w-0"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[12px] sm:rounded-[16px] bg-[#F5A623]/12 border border-[#F5A623]/20 flex items-center justify-center text-[#F5A623] flex-shrink-0">
                    <Wallet size={15} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-stat text-[11px] sm:text-xs font-bold text-primary-light dark:text-primary-dark flex items-baseline leading-tight break-words">
                      <span className="font-stat select-none">₹</span>
                      <span className="font-stat">{selectedDateData.totalSpent.toLocaleString('en-IN')}</span>
                    </p>
                    <p className="text-[9.5px] sm:text-[10px] font-medium text-secondary-light dark:text-secondary-dark leading-tight mt-0.5 break-words">
                      {selectedDateData.expenses.length > 0 ? (
                        <>
                          <span className="font-stat">{selectedDateData.expenses.length}</span> record{selectedDateData.expenses.length !== 1 ? 's' : ''}
                        </>
                      ) : 'Spending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 2. WHAT'S THERE TO DO / UPCOMING SCHEDULE ── */}
            <div className="pt-2.5 border-t border-border-light/40 dark:border-border-dark/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-tag font-bold uppercase tracking-wider text-muted-light dark:text-muted-dark">
                  {selectedDateData.isSelPast ? 'Completed Task Log' : selectedDateData.isSelToday ? 'Up next / There to do' : 'Scheduled Plan & Timetable'}
                </span>
                <span className="text-[10px] font-tag font-semibold text-accent uppercase tracking-wider">
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
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-primary-light dark:text-primary-dark line-clamp-2 break-words leading-tight">
                            Next Class: {selectedDateData.nextBlockToday.subject}
                          </p>
                          <p className="text-[10px] font-medium text-secondary-light dark:text-secondary-dark line-clamp-1 break-words mt-0.5">
                            <span className="font-stat">{selectedDateData.nextBlockToday.startTime}</span> – <span className="font-stat">{selectedDateData.nextBlockToday.endTime}</span>
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
                          <InteractiveCheckbox checked={false} onChange={() => handleToggleTask(task.id)} size={18} />
                          <span className="text-xs font-medium text-primary-light dark:text-primary-dark line-clamp-2 break-words flex-1 min-w-0 leading-tight">
                            {task.text}
                          </span>
                          {task.subtask && (
                            <span className="text-[10px] text-muted-light dark:text-muted-dark line-clamp-1 break-words flex-shrink-0">
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
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                        {selectedDateData.tasks.length > 0 ? (
                          <>
                            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                            <span>All tasks completed for today</span>
                          </>
                        ) : (
                          'No pending tasks for today · All clear'
                        )}
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
                          <span className="text-xs font-medium text-secondary-light dark:text-secondary-dark line-through line-clamp-2 break-words flex-1 min-w-0 leading-tight">
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
                        <span className="text-[10px] font-tag uppercase font-bold text-m3-mint-text dark:text-m3-mint-darkText tracking-wider">
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
                        <span className="text-[10px] font-tag uppercase font-bold text-m3-rose-text dark:text-m3-rose-darkText tracking-wider">
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

      {/* ── Card 4: Forward-Looking Quick Actions & M3 Widgets ── */}
      <motion.div variants={item} className="space-y-3 sm:space-y-4">
        {/* Quick Action Pill Row */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-[24px] bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)]">
          <button
            onClick={() => { triggerHaptic('light'); navigate('/study/timer'); }}
            className="flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-[18px] bg-[var(--md-primary)] text-[var(--md-on-primary)] text-[11px] sm:text-xs font-heading font-bold flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 transition-transform select-none min-w-0"
          >
            <Play size={12} className="fill-current shrink-0" />
            <span className="truncate">Focus</span>
          </button>
          <button
            onClick={() => { triggerHaptic('light'); navigate('/gym'); }}
            className="flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-[18px] bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] border border-[var(--md-outline-variant)] text-[11px] sm:text-xs font-heading font-bold flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 transition-transform select-none min-w-0"
          >
            <Dumbbell size={13} className="shrink-0" />
            <span className="truncate">Workout</span>
          </button>
          <button
            onClick={() => { triggerHaptic('light'); navigate('/spending'); }}
            className="flex-1 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-[18px] bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] border border-[var(--md-outline-variant)] text-[11px] sm:text-xs font-heading font-bold flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 transition-transform select-none min-w-0"
          >
            <Wallet size={13} className="shrink-0" />
            <span className="truncate">Expense</span>
          </button>
        </div>

        {/* M3 Stat Widget Pair (Image 9 Reference) */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <M3StatWidget
            label="Today's Focus"
            value={todayStudyHours > 0 || todayStudyMins > 0 ? `${todayStudyHours}h ${todayStudyMins}m` : '0m'}
            sublabel={`${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''} logged`}
            highlight={{ text: 'Deep Work', variant: 'primary' }}
            icon={<BookOpen size={16} />}
            onClick={() => { triggerHaptic('nav'); navigate('/study'); }}
          />
          <M3StatWidget
            label="Today's Spend"
            value={`₹${todaySpent.toLocaleString('en-IN')}`}
            sublabel={`${todayExpenses.length} transaction${todayExpenses.length !== 1 ? 's' : ''}`}
            highlight={{ text: 'Finance', variant: 'secondary' }}
            icon={<Wallet size={16} />}
            onClick={() => { triggerHaptic('nav'); navigate('/spending'); }}
          />
        </div>
      </motion.div>

      {/* ── Card 5: Expressive Fluid TO-DO Preview ── */}
      {todayTasks.length > 0 && (
        <motion.div variants={item} className="rounded-[32px] p-5 sm:p-6 bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--md-primary)]/12 border border-[var(--md-primary)]/20 flex items-center justify-center text-[var(--md-primary)]">
                <Calendar size={15} />
              </div>
              <span className="text-xs font-bold font-tag tracking-wider uppercase text-[var(--md-on-surface)]">
                Tasks Today · <span className="font-stat">{completedTasks}</span>/<span className="font-stat">{todayTasks.length}</span>
              </span>
            </div>
            <button
              onClick={() => {
                triggerHaptic('light');
                navigate('/tasks');
              }}
              className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] border border-[var(--md-outline-variant)] flex items-center gap-1 hover:opacity-85 active:scale-95 transition-all select-none"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {todayTasks.slice(0, 4).map(task => (
              <motion.div
                key={task.id}
                whileHover={{ scale: 1.01, y: -1 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleToggleTask(task.id)}
                className="flex items-center gap-3 p-3 rounded-[20px] bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] cursor-pointer transition-colors shadow-none select-none"
              >
                <InteractiveCheckbox checked={task.completed} onChange={() => handleToggleTask(task.id)} size={18} />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold block line-clamp-2 break-words leading-snug ${
                    task.completed
                      ? 'line-through text-[var(--md-on-surface-variant)] opacity-60'
                      : 'text-[var(--md-on-surface)]'
                  }`}>
                    {task.text}
                  </span>
                  {task.subtask && (
                    <span className={`text-[11px] block line-clamp-1 break-words mt-0.5 ${
                      task.completed
                        ? 'line-through text-[var(--md-on-surface-variant)]/50'
                        : 'text-[var(--md-on-surface-variant)]'
                    }`}>
                      {task.subtask}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      </motion.div>
    </SkeletonGate>
  );
}
