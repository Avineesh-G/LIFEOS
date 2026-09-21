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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-7">

      {/* Material 3 Expressive Sky Blue Hero Container */}
      <motion.div
        variants={item}
        className="rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 card bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] shadow-none relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-[16px] bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex items-center justify-center text-[var(--md-primary)]">
              <InteractiveClock size={24} isRunning={todaySessions.length > 0} progressPercent={Math.min((todayMinutes / 120) * 100, 100)} onClick={() => navigate('/study/timer')} />
            </span>

            <div>
              <p className="text-xs font-bold tracking-wider uppercase opacity-75 font-tag text-[var(--md-on-surface-variant)]">
                {format(new Date(), 'EEEE, MMM d')}
              </p>
              <h2 className="text-sm sm:text-base font-bold text-[var(--md-on-surface)]">Today's Focus</h2>
            </div>
          </div>
          <span className="rounded-full bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] px-3.5 py-1.5 text-xs font-bold text-[var(--md-on-surface-variant)] font-tag">
            <span className="font-stat">{todaySessions.length}</span> {todaySessions.length === 1 ? 'session' : 'sessions'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mt-3 relative z-10">
          <div>
            <span className="stat-clamp-hero font-bold tracking-tight leading-none font-stat text-[var(--md-on-surface)]">
              {Math.floor(todayMinutes / 60)}
              <span className="text-2xl font-bold opacity-75 font-sans">h </span>
              {todayMinutes % 60}
              <span className="text-2xl font-bold opacity-75 font-sans">m</span>
            </span>
          </div>

          {/* Pill-Row + Standalone Squircle Action Pattern (Image 1 pattern) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Wide Pill Housing Secondary Actions */}
            <div className="inline-flex items-center p-1 rounded-full bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)]">
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); navigate('/study/history'); }}
                className="px-3.5 py-2 min-h-[44px] rounded-full text-xs font-bold text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] transition-all active:scale-95 flex items-center justify-center"
              >
                History
              </button>
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); navigate('/study/heatmap'); }}
                className="px-3.5 py-2 min-h-[44px] rounded-full text-xs font-bold text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] transition-all active:scale-95 flex items-center justify-center"
              >
                Heatmap
              </button>
            </div>

            {/* Standalone Squircle Button Set Apart for Primary Action */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 450, damping: 24 }}
              onClick={() => {
                triggerHaptic('medium');
                navigate('/study/timer');
              }}
              className="h-11 px-4 min-h-[44px] rounded-[14px] bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-none transition-transform"
              title="Start Timer"
            >
              <Play size={15} fill="currentColor" />
              <span>Timer</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats grid with Fluid Squircle Capsules */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ scale: 1.02, y: -2, transition: { type: 'spring', stiffness: 400 } }}
          className="rounded-[28px] p-5 sm:p-6 card bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] shadow-none flex flex-col justify-between"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-2 font-tag">
            Today
          </p>
          <p className="stat-clamp-card font-bold tracking-tight text-[var(--md-on-surface)] font-stat">
            {Math.floor(todayMinutes / 60)}
            <span className="text-base font-semibold text-[var(--md-on-surface-variant)]">h </span>
            {todayMinutes % 60}
            <span className="text-base font-semibold text-[var(--md-on-surface-variant)]">m</span>
          </p>
          <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 font-medium">
            <span className="font-stat">{todaySessions.length}</span> logged today
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2, transition: { type: 'spring', stiffness: 400 } }}
          className="rounded-[28px] p-5 sm:p-6 card bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] shadow-none flex flex-col justify-between"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-2 font-tag">
            This Week
          </p>
          <p className="stat-clamp-card font-bold tracking-tight text-[var(--md-on-surface)] font-stat">
            {Math.floor(weekMinutes / 60)}
            <span className="text-base font-semibold text-[var(--md-on-surface-variant)]">h </span>
            {weekMinutes % 60}
            <span className="text-base font-semibold text-[var(--md-on-surface-variant)]">m</span>
          </p>
          <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 font-medium">
            <span className="font-stat">{weekSessions.length}</span> weekly sessions
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
                  <div className="flex items-center justify-between text-xs font-semibold gap-2">
                    <span className="text-primary-light dark:text-primary-dark line-clamp-2 break-words leading-tight flex-1 min-w-0">
                      {subject}
                    </span>
                    <span className="font-mono font-bold text-primary-light dark:text-primary-dark shrink-0">
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
