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

  const logs = data.workoutLogs
    .filter(w => w.exercises.some(e => e.name === decodedName))
    .sort((a, b) => b.date.localeCompare(a.date));

  const sessions = logs.map(w => {
    const ex = w.exercises.find(e => e.name === decodedName)!;
    const bestSet = ex.sets.reduce((best, s) => s.weight > best.weight ? s : best, ex.sets[0] || { weight: 0, reps: 0 });
    const totalVolume = ex.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    return { date: w.date, sets: ex.sets, bestSet, totalVolume };
  });

  const bestWeight = Math.max(...sessions.map(s => s.bestSet?.weight || 0), 0);
  const bestReps = Math.max(...sessions.map(s => s.bestSet?.reps || 0), 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/gym')} className="flex items-center gap-2 text-sm text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors">
        <ChevronLeft size={16} /> Back
      </button>

      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{decodedName || 'Exercise History'}</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-2 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-semibold">{sessions.length}</div>
          <div className="text-[10px] sm:text-xs text-secondary-light dark:text-secondary-dark mt-1 uppercase tracking-wider">Sessions</div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-2 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-semibold">{bestWeight}<span className="text-xs">kg</span></div>
          <div className="text-[10px] sm:text-xs text-secondary-light dark:text-secondary-dark mt-1 uppercase tracking-wider">Best Weight</div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-2 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-semibold">{bestReps}</div>
          <div className="text-[10px] sm:text-xs text-secondary-light dark:text-secondary-dark mt-1 uppercase tracking-wider">Best Reps</div>
        </div>
      </div>

      {/* Sessions */}
      <div className="space-y-3">
        {sessions.map((s, i) => (
          <div key={i} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4">
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
