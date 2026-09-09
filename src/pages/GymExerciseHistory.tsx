import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import type { AppData } from '../types';

interface GymExerciseHistoryProps {
  data: AppData;
}

export default function GymExerciseHistory({ data }: GymExerciseHistoryProps) {
  const navigate = useNavigate();
  const { exerciseName } = useParams();
  const decodedName = decodeURIComponent(exerciseName || '');

  const logs = (data.workoutLogs || [])
    .filter(w => (w.exercises || []).some(e => e.name === decodedName))
    .sort((a, b) => b.date.localeCompare(a.date));

  const sessions = logs.map(w => {
    const ex = (w.exercises || []).find(e => e.name === decodedName);
    const sets = Array.isArray(ex?.sets) ? ex.sets : [];
    const bestSet = sets.reduce((best, s) => s.weight > best.weight ? s : best, sets[0] || { weight: 0, reps: 0 });
    const totalVolume = sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    return { date: w.date, sets, bestSet, totalVolume };
  });

  const bestWeight = Math.max(...sessions.map(s => s.bestSet?.weight || 0), 0);
  const bestReps = Math.max(...sessions.map(s => s.bestSet?.reps || 0), 0);

  return (
    <div className="space-y-6 sm:space-y-7 max-w-2xl mx-auto pb-4">
      <button onClick={() => navigate('/gym')} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors font-mono pt-1">
        <ChevronLeft size={16} /> Back to Gym
      </button>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono mb-1.5">Strength Analytics</p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-primary-light dark:text-primary-dark font-sans">{decodedName || 'Exercise History'}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 rounded-[26px] p-4 sm:p-5 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-black text-primary-light dark:text-primary-dark font-mono">{sessions.length}</div>
          <div className="text-[11px] font-bold text-secondary-light dark:text-secondary-dark mt-1 uppercase tracking-wider font-mono">Sessions</div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 rounded-[26px] p-4 sm:p-5 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-black text-primary-light dark:text-primary-dark font-mono">{bestWeight}<span className="text-xs ml-0.5">kg</span></div>
          <div className="text-[11px] font-bold text-secondary-light dark:text-secondary-dark mt-1 uppercase tracking-wider font-mono">Best Weight</div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 rounded-[26px] p-4 sm:p-5 text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-black text-primary-light dark:text-primary-dark font-mono">{bestReps}</div>
          <div className="text-[11px] font-bold text-secondary-light dark:text-secondary-dark mt-1 uppercase tracking-wider font-mono">Best Reps</div>
        </div>
      </div>

      {/* Sessions */}
      <div className="space-y-3.5">
        {sessions.map((s, i) => (
          <div key={i} className="bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 rounded-[28px] p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium">{format(new Date(s.date), 'EEEE, MMM d')}</div>
              <div className="text-xs text-secondary-light dark:text-secondary-dark">{s.sets.length} sets</div>
            </div>
            <div className="space-y-1.5">
              {s.sets.map((set, si) => (
                <div key={si} className="flex items-center justify-between text-sm">
                  <span className="text-secondary-light dark:text-secondary-dark">Set {si + 1}</span>
                  <span className="font-medium">{set.reps} reps @ {set.weight}kg</span>
                </div>
              ))}
            </div>
            {s.totalVolume > 0 && (
              <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark text-xs text-secondary-light dark:text-secondary-dark">
                Total volume: <span className="font-medium text-primary-light dark:text-primary-dark">{s.totalVolume}kg</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-16 text-secondary-light dark:text-secondary-dark">
          <TrendingUp size={32} className="mx-auto mb-3 opacity-40" />
          <p>No history for this exercise</p>
        </div>
      )}
    </div>
  );
}
