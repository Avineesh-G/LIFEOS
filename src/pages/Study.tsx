import { useNavigate } from 'react-router-dom';
import { Clock, History, Grid3X3, ChevronRight, Play, BookOpen, Flame } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData } from '../types';

interface StudyProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: 'easeOut' } } };

const SUBJECT_COLORS = [
  'bg-purple-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-teal-500',
  'bg-amber-500',
];

export default function Study({ data }: StudyProps) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = data.studySessions.filter(s => s.date === today);
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekSessions = data.studySessions.filter(s => {
    const d = new Date(s.date);
    return d >= weekStart && d <= addDays(weekStart, 6);
  });
  const weekMinutes = weekSessions.reduce((sum, s) => sum + s.duration, 0);

  const subjectStats: Record<string, number> = {};
  data.studySessions.forEach(s => {
    subjectStats[s.subject] = (subjectStats[s.subject] || 0) + s.duration;
  });
  const sortedSubjects = Object.entries(subjectStats).sort((a, b) => b[1] - a[1]);
  const maxMins = sortedSubjects[0]?.[1] ?? 1;

  const navLinks = [
    {
      icon: Clock,
      label: 'Focus Timer',
      sub: 'Pomodoro & stopwatch',
      path: '/study/timer',
      badge: 'bg-m3-lavender-badge/70 dark:bg-m3-lavender-darkBadge/70 text-m3-lavender-text dark:text-m3-lavender-darkText',
    },
    {
      icon: History,
      label: 'Session History',
      sub: 'Logged notes & doubts',
      path: '/study/history',
      badge: 'bg-m3-mint-badge/70 dark:bg-m3-mint-darkBadge/70 text-m3-mint-text dark:text-m3-mint-darkText',
    },
    {
      icon: Grid3X3,
      label: 'Study Heatmap',
      sub: 'Annual consistency graph',
      path: '/study/heatmap',
      badge: 'bg-m3-peach-badge/70 dark:bg-m3-peach-darkBadge/70 text-m3-peach-text dark:text-m3-peach-darkText',
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-7 pb-8">

      {/* Material 3 Expressive Lavender Hero Container */}
      <motion.div
        variants={item}
        className="rounded-[32px] p-6 sm:p-7 bg-m3-lavender-container dark:bg-m3-lavender-darkContainer text-m3-lavender-text dark:text-m3-lavender-darkText border border-m3-lavender-badge/50 dark:border-m3-lavender-darkBadge/50 shadow-m3-subtle"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-[16px] bg-white/80 dark:bg-black/30 flex items-center justify-center shadow-sm">
              <BookOpen size={22} className="text-m3-lavender-text dark:text-m3-lavender-darkText" />
            </span>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase opacity-75">
                {format(new Date(), 'EEEE, MMM d')}
              </p>
              <h2 className="text-sm sm:text-base font-bold opacity-90">Today's Focus</h2>
            </div>
          </div>
          <span className="rounded-full bg-white/70 dark:bg-black/25 px-3.5 py-1.5 text-xs font-bold shadow-sm">
            {todaySessions.length} {todaySessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4 mt-3">
          <div>
            <span className="text-4xl sm:text-5xl font-black tracking-tight leading-none font-sans">
              {Math.floor(todayMinutes / 60)}
              <span className="text-2xl font-bold opacity-80">h </span>
              {todayMinutes % 60}
              <span className="text-2xl font-bold opacity-80">m</span>
            </span>
          </div>

          <button
            onClick={() => navigate('/study/timer')}
            className="rounded-full bg-[#4F378B] dark:bg-[#D0BCFF] text-white dark:text-[#231E2E] font-bold px-5 py-3 text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.96] transition-all"
          >
            <Play size={16} fill="currentColor" /> Start Timer
          </button>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:gap-5">
        <div className="rounded-[26px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-2">
            Today
          </p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-primary-light dark:text-primary-dark font-sans">
            {Math.floor(todayMinutes / 60)}
            <span className="text-base font-semibold text-muted-light dark:text-muted-dark">h </span>
            {todayMinutes % 60}
            <span className="text-base font-semibold text-muted-light dark:text-muted-dark">m</span>
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1 font-medium">
            {todaySessions.length} logged today
          </p>
        </div>

        <div className="rounded-[26px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm flex flex-col justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-2">
            This Week
          </p>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-primary-light dark:text-primary-dark font-sans">
            {Math.floor(weekMinutes / 60)}
            <span className="text-base font-semibold text-muted-light dark:text-muted-dark">h </span>
            {weekMinutes % 60}
            <span className="text-base font-semibold text-muted-light dark:text-muted-dark">m</span>
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1 font-medium">
            {weekSessions.length} weekly sessions
          </p>
        </div>
      </motion.div>

      {/* Subject breakdown */}
      {sortedSubjects.length > 0 && (
        <motion.div variants={item} className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Subject Distribution
            </p>
            <span className="text-xs font-bold text-muted-light dark:text-muted-dark">
              Top 5 subjects
            </span>
          </div>

          <div className="space-y-3">
            {sortedSubjects.slice(0, 5).map(([subject, mins], idx) => {
              const barColor = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
              const hours = Math.floor(mins / 60);
              const remMins = mins % 60;
              return (
                <div key={subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-primary-light dark:text-primary-dark truncate max-w-[200px]">
                      {subject}
                    </span>
                    <span className="font-mono font-bold text-primary-light dark:text-primary-dark">
                      {hours > 0 ? `${hours}h ` : ''}{remMins}m
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (mins / maxMins) * 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${barColor}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Navigation links */}
      <motion.div variants={item} className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono px-1">
          Study Tools
        </p>
        {navLinks.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="w-full card flex items-center gap-3.5 p-3.5 sm:p-4 hover:shadow-m3-hover active:scale-[0.985] transition-all"
          >
            <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 ${link.badge}`}>
              <link.icon size={18} strokeWidth={2.2} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="font-bold text-sm text-primary-light dark:text-primary-dark block leading-tight">
                {link.label}
              </span>
              <span className="text-xs text-secondary-light dark:text-secondary-dark leading-tight">
                {link.sub}
              </span>
            </div>
            <ChevronRight size={16} className="text-muted-light dark:text-muted-dark flex-shrink-0" />
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
