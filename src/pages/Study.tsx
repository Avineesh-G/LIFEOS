import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, History, Grid3X3, ChevronRight, Play, BookOpen, Flame } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import InteractiveClock from '../components/interactive/InteractiveClock';
import type { AppData } from '../types';


interface StudyProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } };

const SUBJECT_COLORS = [
  'bg-purple-500',
  'bg-indigo-500',
  'bg-blue-500',
  'bg-teal-500',
  'bg-amber-500',
];

export default function Study({ data }: StudyProps) {
  const navigate = useNavigate();

  const { todaySessions, todayMinutes, weekSessions, weekMinutes, sortedSubjects, maxMins } = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todaySessions = data.studySessions.filter(s => s.date === todayStr);
    const todayMins = todaySessions.reduce((sum, s) => sum + s.duration, 0);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const weekSessions = data.studySessions.filter(s => {
      const d = new Date(s.date);
      return d >= weekStart && d <= weekEnd;
    });
    const weekMins = weekSessions.reduce((sum, s) => sum + s.duration, 0);

    const stats: Record<string, number> = {};
    data.studySessions.forEach(s => {
      stats[s.subject] = (stats[s.subject] || 0) + s.duration;
    });
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] ?? 1;

    return {
      todaySessions,
      todayMinutes: todayMins,
      weekSessions,
      weekMinutes: weekMins,
      sortedSubjects: sorted,
      maxMins: max,
    };
  }, [data.studySessions]);

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

      {/* Bioluminescent Lavender Liquid Spring Capsule Hero Container */}
      <motion.div
        variants={item}
        className="rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 liquid-glass glow-lavender border border-indigo-200/50 dark:border-indigo-800/40 text-m3-lavender-text dark:text-m3-lavender-darkText shadow-sm relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-[16px] bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shadow-xs text-indigo-700 dark:text-indigo-300">
              <InteractiveClock size={24} isRunning={todaySessions.length > 0} progressPercent={Math.min((todayMinutes / 120) * 100, 100)} onClick={() => navigate('/study/timer')} />
            </span>

            <div>
              <p className="text-xs font-bold tracking-wider uppercase opacity-75 font-mono">
                {format(new Date(), 'EEEE, MMM d')}
              </p>
              <h2 className="text-sm sm:text-base font-bold opacity-90">Today's Focus</h2>
            </div>
          </div>
          <span className="rounded-full bg-indigo-500/15 border border-indigo-500/25 px-3.5 py-1.5 text-xs font-bold shadow-xs text-indigo-800 dark:text-indigo-200">
            {todaySessions.length} {todaySessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4 mt-3 relative z-10">
          <div>
            <span className="text-4xl sm:text-5xl font-black tracking-tight leading-none font-sans">
              {Math.floor(todayMinutes / 60)}
              <span className="text-2xl font-bold opacity-80">h </span>
              {todayMinutes % 60}
              <span className="text-2xl font-bold opacity-80">m</span>
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => {
              triggerHaptic('light');
              navigate('/study/timer');
            }}
            className="rounded-full bg-indigo-600 dark:bg-indigo-400 text-white dark:text-indigo-950 font-bold px-5 py-3 text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-colors"
          >
            <Play size={16} fill="currentColor" /> Start Timer
          </motion.button>
        </div>
      </motion.div>

      {/* Stats grid with Fluid Squircle Capsules */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ scale: 1.02, y: -2, transition: { type: 'spring', stiffness: 400 } }}
          className="rounded-[28px] p-5 sm:p-6 liquid-glass border border-[var(--card-border)] shadow-xs flex flex-col justify-between"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-2 font-mono">
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
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2, transition: { type: 'spring', stiffness: 400 } }}
          className="rounded-[28px] p-5 sm:p-6 liquid-glass border border-[var(--card-border)] shadow-xs flex flex-col justify-between"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-2 font-mono">
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
        </motion.div>
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

      {/* Navigation links inside Liquid Glass Container */}
      <motion.div variants={item} className="rounded-[30px] p-4 sm:p-5 liquid-glass border border-[var(--card-border)] shadow-[var(--shadow-card)] space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
            Study Tools
          </p>
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
            3 utilities
          </span>
        </div>

        <div className="space-y-2">
          {navLinks.map(link => (
            <motion.button
              key={link.path}
              whileHover={{ scale: 1.012, y: -1, transition: { type: 'spring', stiffness: 400 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                triggerHaptic('light');
                navigate(link.path);
              }}
              className="w-full rounded-[22px] bg-[var(--card-surface)] border border-[var(--card-border)] flex items-center gap-3.5 p-3.5 sm:p-4 shadow-xs hover:border-[var(--accent-primary)]/40 transition-colors"
            >
              <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 ${link.badge} shadow-xs`}>
                <link.icon size={18} strokeWidth={2.2} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="font-bold text-sm text-[var(--text-primary)] block leading-tight">
                  {link.label}
                </span>
                <span className="text-xs text-[var(--text-secondary)] leading-tight mt-0.5 block">
                  {link.sub}
                </span>
              </div>
              <ChevronRight size={16} className="text-[var(--text-muted)] flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
