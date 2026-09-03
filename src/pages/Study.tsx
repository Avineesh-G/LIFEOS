import { useNavigate } from 'react-router-dom';
import { Clock, History, Grid3X3, ChevronRight, Play } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData } from '../types';

interface StudyProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } } };

export default function Study({ data }: StudyProps) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySessions   = data.studySessions.filter(s => s.date === today);
  const todayMinutes    = todaySessions.reduce((sum, s) => sum + s.duration, 0);

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
    { icon: Clock,    label: 'Timer',   path: '/study/timer',   color: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' },
    { icon: History,  label: 'History', path: '/study/history', color: 'bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400' },
    { icon: Grid3X3,  label: 'Heatmap', path: '/study/heatmap', color: 'bg-fuchsia-50 dark:bg-fuchsia-950 text-fuchsia-600 dark:text-fuchsia-400' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between pt-2">
        <div>
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Study</p>
          <h1 className="text-4xl font-bold tracking-tight leading-none text-primary-light dark:text-primary-dark">
            {Math.floor(todayMinutes / 60)}<span className="text-2xl font-medium">h </span>
            {todayMinutes % 60}<span className="text-2xl font-medium">m</span>
          </h1>
          <p className="text-sm text-muted-light dark:text-muted-dark mt-1">{todaySessions.length} sessions today</p>
        </div>
        <button
          onClick={() => navigate('/study/timer')}
          className="btn-pill flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          <Play size={14} fill="currentColor" /> Start
        </button>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-2">Today</p>
          <p className="text-2xl font-bold tracking-tight">
            {Math.floor(todayMinutes / 60)}<span className="text-sm font-medium">h </span>
            {todayMinutes % 60}<span className="text-sm font-medium">m</span>
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">{todaySessions.length} sessions</p>
        </div>
        <div className="card p-4">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-2">This Week</p>
          <p className="text-2xl font-bold tracking-tight">
            {Math.floor(weekMinutes / 60)}<span className="text-sm font-medium">h </span>
            {weekMinutes % 60}<span className="text-sm font-medium">m</span>
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">{weekSessions.length} sessions</p>
        </div>
      </motion.div>

      {/* Subject breakdown */}
      {sortedSubjects.length > 0 && (
        <motion.div variants={item} className="card p-5">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-4">Subject Breakdown</p>
          <div className="space-y-3.5">
            {sortedSubjects.slice(0, 5).map(([subject, mins]) => (
              <div key={subject} className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium truncate text-primary-light dark:text-primary-dark">{subject}</span>
                <div className="flex-1 h-1.5 bg-bg-light dark:bg-bg-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-light dark:bg-primary-dark rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (mins / maxMins) * 100)}%` }}
                  />
                </div>
                <span className="label-mono text-muted-light dark:text-muted-dark w-14 text-right">
                  {Math.floor(mins / 60)}h{mins % 60 > 0 ? ` ${mins % 60}m` : ''}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Navigation links */}
      <motion.div variants={item} className="space-y-2">
        {navLinks.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="w-full card flex items-center gap-4 p-4 hover:shadow-card-hover active:scale-[0.985] transition-all duration-150"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${link.color}`}>
              <link.icon size={17} strokeWidth={2} />
            </div>
            <span className="flex-1 text-left font-medium text-sm">{link.label}</span>
            <ChevronRight size={15} className="text-muted-light dark:text-muted-dark" />
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
