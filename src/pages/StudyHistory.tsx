import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, BookOpen } from 'lucide-react';
import { format, parseISO, subDays, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { AppData } from '../types';

interface StudyHistoryProps {
  data: AppData;
}

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

export default function StudyHistory({ data }: StudyHistoryProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [subjectFilter, setSubjectFilter] = useState('');

  const subjects = [...new Set(data.studySessions.map(s => s.subject))];

  const filtered = data.studySessions.filter(s => {
    const d = parseISO(s.date);
    const now = new Date();
    if (filter === 'today') return s.date === format(now, 'yyyy-MM-dd');
    if (filter === 'week') return isWithinInterval(d, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
    if (filter === 'month') return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
    return true;
  }).filter(s => !subjectFilter || s.subject === subjectFilter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {} as Record<string, typeof filtered>);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/study')} className="flex items-center gap-2 text-sm text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors">
        <ChevronLeft size={16} /> Back to Study
      </button>

      <h1 className="text-3xl md:text-[40px] font-semibold tracking-tight">History</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'today', 'week', 'month'] as FilterPeriod[]).map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === p 
                ? 'bg-accent text-white' 
                : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Sessions */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={32} className="mx-auto mb-3 text-secondary-light dark:text-secondary-dark opacity-40" />
          <p className="text-secondary-light dark:text-secondary-dark">No study sessions found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, sessions]) => (
            <div key={date}>
              <div className="text-xs font-semibold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-3">
                {format(parseISO(date), 'EEEE, MMMM d')}
              </div>
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.id} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-accent/10 text-accent"><Clock size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{s.subject} {s.topic ? `· ${s.topic}` : ''}</div>
                      <div className="text-xs text-secondary-light dark:text-secondary-dark">{s.startTime} · {s.duration} min</div>
                    </div>
                    <div className="text-sm font-medium tabular-nums">{s.duration}m</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
