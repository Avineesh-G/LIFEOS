import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CaretLeft, Barbell, TrendUp } from '../ui/tokens/icons';
import { Toolbar } from '../ui/navigation/Toolbar';
import { GroupedList } from '../ui/grouped/GroupedList';
import { ListRow } from '../ui/grouped/ListRow';
import { format } from 'date-fns';
import { handleAppBack } from '../utils/backNavigation';
import type { AppData } from '../types';

interface GymExerciseHistoryProps {
  data: AppData;
}

const PAGE_SIZE = 15;

export default function GymExerciseHistory({ data }: GymExerciseHistoryProps) {
  const navigate = useNavigate();
  const { exerciseName } = useParams();
  const decodedName = decodeURIComponent(exerciseName || '');

  const logs = (data.workoutLogs || [])
    .filter((w) => (w.exercises || []).some((e) => e.name === decodedName))
    .sort((a, b) => b.date.localeCompare(a.date));

  const sessions = logs.map((w) => {
    const ex = (w.exercises || []).find((e) => e.name === decodedName);
    const sets = Array.isArray(ex?.sets) ? ex.sets : [];
    const bestSet = sets.reduce(
      (best, s) => (s.weight > best.weight ? s : best),
      sets[0] || { weight: 0, reps: 0 }
    );
    const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    return { date: w.date, sets, bestSet, totalVolume };
  });

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [decodedName]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { rootMargin: '160px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sessions.length]);

  const bestWeight = Math.max(...sessions.map((s) => s.bestSet?.weight || 0), 0);
  const bestReps = Math.max(...sessions.map((s) => s.bestSet?.reps || 0), 0);

  return (
    <div className="w-full flex flex-col pb-4">
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
              className="flex items-center gap-1 text-[#FF453A] font-semibold text-sm hover:opacity-80 active:scale-95 transition-all cursor-pointer px-2 py-1 rounded-full hover:bg-white/10"
            >
              <CaretLeft size={20} weight="bold" />
              <span>Back</span>
            </button>
          }
          center={<span className="font-bold text-white text-base truncate max-w-[200px]">{decodedName}</span>}
        />
      </header>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2 my-4">
        <div className="p-4 rounded-[22px] bg-[#1C1C1E] border border-white/8 text-center">
          <div className="text-2xl font-black text-white font-mono">{sessions.length}</div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">Sessions</div>
        </div>
        <div className="p-4 rounded-[22px] bg-[#1C1C1E] border border-white/8 text-center">
          <div className="text-2xl font-black text-[#FF453A] font-mono">
            {bestWeight}
            <span className="text-xs ml-0.5 text-white/60">kg</span>
          </div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">Best Weight</div>
        </div>
        <div className="p-4 rounded-[22px] bg-[#1C1C1E] border border-white/8 text-center">
          <div className="text-2xl font-black text-white font-mono">{bestReps}</div>
          <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-0.5">Best Reps</div>
        </div>
      </div>

      {/* Session Log Insets */}
      <div className="text-xs font-bold uppercase tracking-wider text-white/50 px-2 mb-2">
        Recorded Sets ({sessions.length})
      </div>

      {sessions.length === 0 ? (
        <div className="p-8 rounded-[28px] bg-[#1C1C1E] border border-white/8 text-center text-white/50 text-sm">
          No recorded sets for {decodedName} yet.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.slice(0, visibleCount).map((s, i) => (
            <GroupedList
              key={i}
              header={
                <div className="flex items-center justify-between text-white/70">
                  <span>
                    {(() => {
                      try {
                        const d = new Date(s.date);
                        return isNaN(d.getTime()) ? s.date : format(d, 'EEEE, MMM d');
                      } catch {
                        return s.date;
                      }
                    })()}
                  </span>
                  <span className="text-[11px] font-mono text-white/40">{s.totalVolume} kg volume</span>
                </div>
              }
            >
              {s.sets.map((set, si) => (
                <ListRow
                  key={si}
                  icon={<Barbell size={16} weight="duotone" />}
                  iconTint="#FF453A"
                  title={`Set ${si + 1}`}
                  trailing={
                    <span className="font-mono font-bold text-white text-sm">
                      {set.weight} kg × {set.reps} reps
                    </span>
                  }
                  showSeparator={si < s.sets.length - 1}
                />
              ))}
            </GroupedList>
          ))}
          <div ref={sentinelRef} className="h-4" />
        </div>
      )}
    </div>
  );
}
