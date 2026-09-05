import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { format, subDays, parseISO, startOfDay, isSameDay } from 'date-fns';
import type { AppData } from '../types';

interface StudyHeatmapProps {
  data: AppData;
}

export default function StudyHeatmap({ data }: StudyHeatmapProps) {
  const navigate = useNavigate();
  const today = new Date();
  const days = Array.from({ length: 112 }, (_, i) => subDays(today, 111 - i));

  const dayMap: Record<string, number> = {};
  data.studySessions.forEach(s => {
    dayMap[s.date] = (dayMap[s.date] || 0) + s.duration;
  });

  const maxMinutes = Math.max(...Object.values(dayMap), 1);
  const totalHours = Math.round(data.studySessions.reduce((sum, s) => sum + s.duration, 0) / 60);
  const avgMinutes = data.studySessions.length > 0 
    ? Math.round(data.studySessions.reduce((sum, s) => sum + s.duration, 0) / [...new Set(data.studySessions.map(s => s.date))].length)
    : 0;

  const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];

  const getIntensity = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const mins = dayMap[key] || 0;
    if (mins === 0) return 0;
    if (mins < 30) return 1;
    if (mins < 60) return 2;
    if (mins < 120) return 3;
    return 4;
  };

  const intensityColors = [
    'bg-black/5 dark:bg-white/5',
    'bg-indigo-200 dark:bg-indigo-900',
    'bg-indigo-400 dark:bg-indigo-700',
    'bg-indigo-600 dark:bg-indigo-500',
    'bg-indigo-800 dark:bg-indigo-400',
  ];

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/study')} className="flex items-center gap-2 text-sm text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors">
        <ChevronLeft size={16} /> Back to Study
      </button>

      <h1 className="text-3xl md:text-[40px] font-semibold tracking-tight">Heatmap</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 text-center">
          <div className="text-2xl font-semibold">{totalHours}h</div>
          <div className="text-xs text-secondary-light dark:text-secondary-dark mt-1 uppercase tracking-wider">Total</div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 text-center">
          <div className="text-2xl font-semibold">{avgMinutes}m</div>
          <div className="text-xs text-secondary-light dark:text-secondary-dark mt-1 uppercase tracking-wider">Daily Avg</div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 text-center">
          <div className="text-2xl font-semibold">{bestDay ? Math.round(bestDay[1] / 60 * 10) / 10 : 0}h</div>
          <div className="text-xs text-secondary-light dark:text-secondary-dark mt-1 uppercase tracking-wider">Best Day</div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${format(day, 'MMM d')}: ${dayMap[format(day, 'yyyy-MM-dd')] || 0} min`}
                  className={`w-3 h-3 rounded-sm ${intensityColors[getIntensity(day)]} transition-all hover:ring-2 hover:ring-accent/30`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-secondary-light dark:text-secondary-dark">
          <span>Less</span>
          {intensityColors.map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
