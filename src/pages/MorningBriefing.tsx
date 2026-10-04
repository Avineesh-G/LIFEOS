import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sun, 
  CheckCircle2, 
  Circle, 
  Dumbbell, 
  Calendar, 
  Wallet, 
  Flame, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  Clock,
  Target
} from 'lucide-react';
import { OrbiCompanion } from '../components/illustrations/OrbiCompanion';
import { haptics } from '../utils/haptics';
import { handleAppBack } from '../utils/backNavigation';
import { triggerConfettiBurst } from '../utils/confetti';
import { AppData, Task } from '../types';

interface MorningBriefingProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

export const MorningBriefing: React.FC<MorningBriefingProps> = ({ data, updateData }) => {
  const navigate = useNavigate();
  const [_launched, setLaunched] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dayName = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }), []);
  const formattedDate = useMemo(() => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), []);

  // Filter today's tasks
  const todayTasks = useMemo(() => {
    return (data?.tasks || []).filter(t => t.date === todayStr || t.dueDate === todayStr);
  }, [data?.tasks, todayStr]);

  const primeTasks = useMemo(() => todayTasks.slice(0, 3), [todayTasks]);

  // Today's workout split
  const todaysWorkout = useMemo(() => {
    const splits = data?.workoutPlans || [];
    return splits.find(s => s.day.toLowerCase() === dayName.toLowerCase()) || null;
  }, [data?.workoutPlans, dayName]);

  // Next timetable event
  const nextEvent = useMemo(() => {
    const blocks = (data?.timetable || []).filter(b => b.day.toLowerCase() === dayName.toLowerCase());
    if (!blocks.length) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const upcoming = blocks
      .map(b => {
        const [h, m] = (b.startTime || '00:00').split(':').map(Number);
        return { block: b, startMinutes: h * 60 + m };
      })
      .filter(item => item.startMinutes >= currentMinutes)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    return upcoming.length ? upcoming[0].block : blocks[0];
  }, [data?.timetable, dayName]);

  // Monthly budget & daily allowance
  const dailySpendStats = useMemo(() => {
    const budget = 1000;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);

    const monthlySpent = (data?.expenses || [])
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const remainingBudget = Math.max(0, budget - monthlySpent);
    const dailySafeSpend = (remainingBudget / daysRemaining).toFixed(0);

    return { budget, monthlySpent, remainingBudget, dailySafeSpend };
  }, [data?.expenses]);

  const toggleTask = async (task: Task) => {
    haptics.tap();
    const updated = (data?.tasks || []).map(t => 
      t.id === task.id ? { ...t, completed: !t.completed } : t
    );
    await updateData({ tasks: updated });
  };

  const handleLaunchDay = () => {
    haptics.milestone();
    triggerConfettiBurst();
    setLaunched(true);
    setTimeout(() => {
      handleAppBack(navigate);
    }, 1200);
  };

  return (
    <div className="w-full space-y-4 max-w-lg mx-auto flex flex-col">
      {/* Header with Date & Morning Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--md-primary)] uppercase tracking-wider">
            <Sun size={14} className="animate-spin-slow" />
            <span>Morning Battle Plan</span>
          </div>
          <h1 className="text-2xl font-black text-[var(--md-on-surface)] tracking-tight">
            {dayName}, {formattedDate}
          </h1>
        </div>
        <button
          onClick={() => handleAppBack(navigate)}
          className="p-2 rounded-full hover:bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] transition-colors active:scale-95"
          aria-label="Back"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Luna / Orbi Mascot Greeting Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-3xl bg-gradient-to-br from-[var(--md-primary-container)] to-[var(--md-secondary-container)] border border-[var(--md-outline-variant)] shadow-sm flex items-center gap-4"
      >
        <div className="flex-shrink-0">
          <OrbiCompanion variant="habits-fresh" size={72} interactive={true} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-[var(--md-primary)] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles size={13} />
            <span>Luna's Daily Wisdom</span>
          </div>
          <p className="text-xs font-medium text-[var(--md-on-surface)] leading-relaxed">
            "Small, disciplined actions executed daily compound into extraordinary results. Let's make today count!"
          </p>
        </div>
      </motion.div>

      {/* Prime 3 Critical Tasks */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-bold text-[var(--md-on-surface)]">
            <Target size={16} className="text-[var(--md-primary)]" />
            <span>Today's Top 3 Missions</span>
          </div>
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-semibold text-[var(--md-primary)] flex items-center gap-0.5 hover:underline"
          >
            <span>All Tasks</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {primeTasks.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] text-center text-xs text-[var(--md-on-surface-variant)]">
            No priority tasks scheduled for today. Tap below to create your morning missions!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {primeTasks.map((task, idx) => (
              <motion.div
                key={task.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleTask(task)}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-colors ${
                  task.completed
                    ? 'bg-[var(--md-surface-container-low)] border-[var(--md-outline-variant)] opacity-60'
                    : 'bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]'
                }`}
              >
                <button
                  type="button"
                  className="text-[var(--md-primary)] flex-shrink-0"
                  aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                >
                  {task.completed ? (
                    <CheckCircle2 size={20} className="fill-[var(--md-primary)] text-[var(--md-surface)]" />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--md-primary)]">#{idx + 1}</span>
                    <span className={`text-sm font-medium truncate ${task.completed ? 'line-through text-[var(--md-on-surface-variant)]' : 'text-[var(--md-on-surface)]'}`}>
                      {task.text}
                    </span>
                  </div>
                  {task.subtask && (
                    <p className="text-xs text-[var(--md-on-surface-variant)] truncate ml-5 mt-0.5">
                      {task.subtask}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Next Class & Workout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Next Class / Schedule */}
        <div 
          onClick={() => navigate('/timetable')}
          className="p-3.5 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex flex-col justify-between cursor-pointer active:scale-98 transition-transform"
        >
          <div className="flex items-center justify-between text-[var(--md-primary)] mb-2">
            <Calendar size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Timetable</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[var(--md-on-surface-variant)] block">Next Event</span>
            <p className="text-sm font-bold text-[var(--md-on-surface)] truncate">
              {nextEvent ? nextEvent.subject : 'No classes today'}
            </p>
            {nextEvent?.startTime && (
              <span className="text-[11px] font-medium text-[var(--md-primary)] flex items-center gap-1 mt-1">
                <Clock size={12} />
                {nextEvent.startTime}
              </span>
            )}
          </div>
        </div>

        {/* Today's Gym Split */}
        <div 
          onClick={() => navigate('/gym')}
          className="p-3.5 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex flex-col justify-between cursor-pointer active:scale-98 transition-transform"
        >
          <div className="flex items-center justify-between text-[var(--md-primary)] mb-2">
            <Dumbbell size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Gym Target</span>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[var(--md-on-surface-variant)] block">Today's Split</span>
            <p className="text-sm font-bold text-[var(--md-on-surface)] truncate">
              {todaysWorkout ? todaysWorkout.type : 'Rest / Recovery'}
            </p>
            <span className="text-[11px] font-medium text-[var(--md-primary)] flex items-center gap-1 mt-1">
              <Flame size={12} />
              {todaysWorkout ? `${todaysWorkout.exercises.length} Exercises` : 'Recharge'}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Safe Spend Card */}
      <div 
        onClick={() => navigate('/spending')}
        className="p-4 rounded-2xl bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] flex items-center justify-between cursor-pointer active:scale-98 transition-transform"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--md-primary-container)] flex items-center justify-center text-[var(--md-primary)]">
            <Wallet size={20} />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--md-on-surface-variant)] block">Daily Safe Spend Limit</span>
            <span className="text-base font-black text-[var(--md-on-surface)]">
              ${dailySpendStats.dailySafeSpend} <span className="text-xs font-normal text-[var(--md-on-surface-variant)]">/ today</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-[var(--md-primary)] block uppercase">Remaining</span>
          <span className="text-xs font-bold text-[var(--md-on-surface)]">${dailySpendStats.remainingBudget}</span>
        </div>
      </div>

      {/* Launch Button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleLaunchDay}
        className="mt-2 w-full py-4 rounded-2xl bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold text-base flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all"
      >
        <span>Launch My Day</span>
        <ArrowRight size={18} />
      </motion.button>
    </div>
  );
};

export default MorningBriefing;
