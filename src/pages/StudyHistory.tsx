import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretLeft, BookOpen } from '../ui/tokens/icons';
import { Toolbar } from '../ui/navigation/Toolbar';
import { Segmented } from '../ui/controls/Segmented';
import { GroupedList } from '../ui/grouped/GroupedList';
import { ListRow } from '../ui/grouped/ListRow';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import { handleAppBack } from '../utils/backNavigation';
import type { AppData, StudySession } from '../types';

interface StudyHistoryProps {
  data: AppData;
  updateData?: (partial: Partial<AppData>) => Promise<AppData>;
}

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

export default function StudyHistory({ data }: StudyHistoryProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [subjectFilter, setSubjectFilter] = useState('');

  const subjects = [...new Set((data.studySessions || []).map((s) => s.subject))];

  const filtered = (data.studySessions || [])
    .filter((s) => {
      const d = parseISO(s.date);
      const now = new Date();
      if (filter === 'today') return s.date === format(now, 'yyyy-MM-dd');
      if (filter === 'week')
        return isWithinInterval(d, {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        });
      if (filter === 'month')
        return isWithinInterval(d, {
          start: startOfMonth(now),
          end: endOfMonth(now),
        });
      return true;
    })
    .filter((s) => !subjectFilter || s.subject === subjectFilter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

  const totalMinutes = filtered.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {} as Record<string, StudySession[]>);

  const dates = Object.keys(grouped);

  return (
    <div className="w-full flex flex-col pb-4 selection:bg-[#64D2FF]/30">
      <header
        className="sticky top-0 z-30 w-full bg-black/85 backdrop-blur-md"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 14px)',
          paddingBottom: '6px',
        }}
      >
        <Toolbar
          leading={
            <button
              type="button"
              onClick={() => handleAppBack(navigate)}
              className="flex items-center gap-1 text-[#64D2FF] font-semibold text-sm hover:opacity-80 active:scale-95 transition-all cursor-pointer px-2 py-1 rounded-full hover:bg-white/10"
            >
              <CaretLeft size={20} weight="bold" />
              <span>Back</span>
            </button>
          }
          center={<span className="font-bold text-white text-base">Study History</span>}
        />
      </header>

      {/* Overview Stat Card */}
      <div className="grid grid-cols-2 gap-2 my-4">
        <div className="p-4 rounded-[22px] glass-tile text-center">
          <div className="text-2xl font-black text-[#64D2FF] font-mono">{totalHours}h</div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">Total Study Time</div>
        </div>
        <div className="p-4 rounded-[22px] glass-tile text-center">
          <div className="text-2xl font-black text-white font-mono">{filtered.length}</div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">Sessions Logged</div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="mb-3">
        <Segmented
          value={filter}
          onChange={(val) => {
            triggerHaptic('selection');
            setFilter(val);
          }}
          tint="#64D2FF"
          options={[
            { value: 'all', label: 'All' },
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
          ]}
        />
      </div>

      {/* Subject Filter Pills */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-3">
          <button
            type="button"
            onClick={() => setSubjectFilter('')}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
              !subjectFilter ? 'bg-[#64D2FF] text-black font-bold shadow-sm' : 'glass-flat text-white/60 hover:text-white'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSubjectFilter(sub)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                subjectFilter === sub
                  ? 'bg-[#64D2FF] text-black font-bold shadow-sm'
                  : 'glass-flat text-white/60 hover:text-white'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* History Insets */}
      {dates.length === 0 ? (
        <div className="p-8 rounded-[28px] glass-card text-center text-white/50 text-sm my-4">
          No study sessions found for this period.
        </div>
      ) : (
        <div className="space-y-4">
          {dates.map((dateStr) => {
            const sessionsOnDate = grouped[dateStr];
            let dateLabel = dateStr;
            try {
              dateLabel = format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
            } catch {}

            return (
              <GroupedList key={dateStr} header={dateLabel}>
                {sessionsOnDate.map((session, sIdx) => (
                  <ListRow
                    key={session.id || sIdx}
                    icon={<BookOpen size={18} weight="duotone" />}
                    iconTint="#64D2FF"
                    title={session.subject}
                    subtitle={
                      session.topic
                        ? `${session.topic} · ${session.startTime || ''}`
                        : session.startTime || undefined
                    }
                    trailing={
                      <span className="font-mono font-bold text-[#64D2FF] text-sm">
                        {session.duration}m
                      </span>
                    }
                  />
                ))}
              </GroupedList>
            );
          })}
        </div>
      )}
    </div>
  );
}
