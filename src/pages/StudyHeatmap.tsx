import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CaretLeft, CalendarDots, Flame } from '../ui/tokens/icons';
import { Toolbar } from '../ui/navigation/Toolbar';
import { GroupedList } from '../ui/grouped/GroupedList';
import { format, subDays } from 'date-fns';
import type { AppData } from '../types';

interface StudyHeatmapProps {
  data: AppData;
}

export default function StudyHeatmap({ data }: StudyHeatmapProps) {
  const navigate = useNavigate();
  const today = new Date();
  const days = Array.from({ length: 112 }, (_, i) => subDays(today, 111 - i));

  const dayMap: Record<string, number> = {};
  (data.studySessions || []).forEach((s) => {
    dayMap[s.date] = (dayMap[s.date] || 0) + s.duration;
  });

  const totalHours = Math.round(
    (data.studySessions || []).reduce((sum, s) => sum + s.duration, 0) / 60
  );
  const activeDaysCount = [...new Set((data.studySessions || []).map((s) => s.date))].length;
  const avgMinutes =
    activeDaysCount > 0
      ? Math.round(
          (data.studySessions || []).reduce((sum, s) => sum + s.duration, 0) /
            activeDaysCount
        )
      : 0;

  const bestDayEntry = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
  const bestDayHours = bestDayEntry ? (bestDayEntry[1] / 60).toFixed(1) : '0';

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
    'bg-white/5',
    'bg-[#64D2FF]/25',
    'bg-[#64D2FF]/50',
    'bg-[#64D2FF]/75',
    'bg-[#64D2FF]',
  ];

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="w-full flex flex-col pb-32">
      <Toolbar
        leading={
          <button
            type="button"
            onClick={() => navigate('/study')}
            className="flex items-center gap-1 text-[#64D2FF] font-semibold text-sm hover:opacity-80 active:scale-95 transition-all"
          >
            <CaretLeft size={20} weight="bold" />
            <span>Study</span>
          </button>
        }
        center={<span className="font-bold text-white text-base">Study Consistency</span>}
      />

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2 my-4">
        <div className="p-4 rounded-[22px] bg-[#1C1C1E] border border-white/8 text-center">
          <div className="text-2xl font-black text-[#64D2FF] font-mono">{totalHours}h</div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">Total Hours</div>
        </div>
        <div className="p-4 rounded-[22px] bg-[#1C1C1E] border border-white/8 text-center">
          <div className="text-2xl font-black text-white font-mono">{avgMinutes}m</div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">Daily Average</div>
        </div>
        <div className="p-4 rounded-[22px] bg-[#1C1C1E] border border-white/8 text-center">
          <div className="text-2xl font-black text-white font-mono">{bestDayHours}h</div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">Peak Day</div>
        </div>
      </div>

      {/* Heatmap Grid Card */}
      <GroupedList header="16-WEEK CONSISTENCY GRID">
        <div className="p-5 overflow-x-auto space-y-4">
          <div className="flex gap-1.5 min-w-max justify-center">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1.5">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={`${format(day, 'MMM d, yyyy')}: ${
                      dayMap[format(day, 'yyyy-MM-dd')] || 0
                    } min`}
                    className={`w-3.5 h-3.5 rounded-[4px] ${
                      intensityColors[getIntensity(day)]
                    } transition-transform hover:scale-125`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/8">
            <span>Less focus</span>
            <div className="flex items-center gap-1.5">
              {intensityColors.map((c, i) => (
                <div key={i} className={`w-3.5 h-3.5 rounded-[4px] ${c}`} />
              ))}
            </div>
            <span>High focus (2h+)</span>
          </div>
        </div>
      </GroupedList>
    </div>
  );
}
