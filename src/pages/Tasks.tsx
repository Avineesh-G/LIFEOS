import { useState, useMemo } from 'react';
import { Plus, Trash2, X, Check, RotateCcw, Clock, ArrowRight, Calendar } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import type { AppData, Task } from '../types';

interface TasksProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function Tasks({ data, updateData }: TasksProps) {
  const [newTask, setNewTask] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const yesterday = useMemo(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), []);

  // Today's scheduled tasks
  const todayTasks = useMemo(() => {
    return (data?.tasks || []).filter(t => t?.date === today);
  }, [data?.tasks, today]);

  // Yesterday's & Previous Days' Uncompleted Tasks (rolled over sub-section)
  const previousPendingTasks = useMemo(() => {
    return (data?.tasks || []).filter(t => t?.date && t.date < today && !t.completed);
  }, [data?.tasks, today]);

  const completedCount = useMemo(() => {
    return todayTasks.filter(t => t.completed).length;
  }, [todayTasks]);

  const pct = todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 0;

  const addTask = async () => {
    if (!newTask.trim()) return;
    triggerHaptic('save');
    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      subtask: newSubtask.trim() || undefined,
      completed: false,
      date: today,
    };
    await updateData({ tasks: [...(data?.tasks || []), task] });
    setNewTask('');
    setNewSubtask('');
    setShowAdd(false);
  };

  const toggleTask = async (id: string) => {
    triggerHaptic('medium');
    await updateData({
      tasks: (data?.tasks || []).map(t => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            // If completing a task from a previous day, roll it to today so today's completion records it
            date: nextCompleted && t.date < today ? today : t.date,
          };
        }
        return t;
      })
    });
  };

  const moveToToday = async (id: string) => {
    triggerHaptic('medium');
    await updateData({
      tasks: (data?.tasks || []).map(t => (t.id === id ? { ...t, date: today } : t))
    });
  };

  const rolloverAllToToday = async () => {
    triggerHaptic('save');
    await updateData({
      tasks: (data?.tasks || []).map(t => {
        if (t.date && t.date < today && !t.completed) {
          return { ...t, date: today };
        }
        return t;
      })
    });
  };

  const deleteTask = async (id: string) => {
    triggerHaptic('heavy');
    await updateData({
      tasks: (data?.tasks || []).filter(t => t.id !== id)
    });
  };

  return (
    <div className="space-y-6 sm:space-y-7 pb-4">

      {/* Header */}
      <div className="flex items-end justify-between pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold tracking-wider uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse" />
            Today
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-primary-light dark:text-primary-dark font-sans">
            TO-DO List
          </h1>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1.5 font-medium">
            Daily execution · Keep moving forward
          </p>
        </div>
        <button
          onClick={() => {
            triggerHaptic('light');
            setShowAdd(true);
          }}
          className="btn-pill flex items-center gap-1.5 px-4 py-2 text-xs bg-accent text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus size={15} /> Add Task
        </button>
      </div>

      {/* Progress pill card */}
      <div className="rounded-[32px] sm:rounded-[36px] p-5 sm:p-6 liquid-glass border border-white/80 dark:border-white/10 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
            Completion Rate
          </span>
          <span className={`px-3.5 py-1 rounded-full text-xs font-bold shadow-xs border ${
            pct === 100
              ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
              : pct >= 50
                ? 'bg-indigo-500/15 border-indigo-500/25 text-indigo-700 dark:text-indigo-300'
                : todayTasks.length === 0
                  ? 'bg-neutral-500/10 border-neutral-500/20 text-neutral-600 dark:text-neutral-400'
                  : 'bg-amber-500/15 border-amber-500/25 text-amber-700 dark:text-amber-300'
          }`}>
            {pct === 100 ? 'All Done' : pct >= 50 ? 'On Track' : todayTasks.length === 0 ? 'No Tasks' : 'In Progress'}
          </span>
        </div>

        {/* Segmented bar — one segment per task */}
        {todayTasks.length > 0 ? (
          <div className="flex items-center gap-1.5 py-1">
            {todayTasks.map((task, i) => {
              const palette = [
                'bg-purple-500',
                'bg-indigo-500',
                'bg-emerald-500',
                'bg-amber-500',
                'bg-rose-500',
                'bg-cyan-500',
                'bg-orange-500',
                'bg-teal-500',
                'bg-pink-500',
                'bg-violet-500',
              ];
              const color = palette[i % palette.length];
              return (
                <div
                  key={task.id}
                  className={`h-2.5 flex-1 rounded-full transition-all duration-300 shadow-xs ${
                    task.completed
                      ? `${color} opacity-100`
                      : 'bg-black/5 dark:bg-white/10'
                  }`}
                />
              );
            })}
          </div>
        ) : (
          <div className="w-full h-2.5 rounded-full bg-black/5 dark:bg-white/10" />
        )}

        {/* Count below */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] font-mono font-semibold text-muted-light dark:text-muted-dark">
            {completedCount}/{todayTasks.length} done
          </span>
          <span className="text-[11px] font-mono font-bold text-accent">
            {pct}%
          </span>
        </div>
      </div>

      {/* Yesterday's / Overdue Pending Tasks Subsection */}
      {previousPendingTasks.length > 0 && (
        <div className="rounded-[32px] p-5 sm:p-6 liquid-glass border border-amber-500/30 glow-peach shadow-sm space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/25">
                <Clock size={16} className="stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-amber-900 dark:text-amber-300 font-sans tracking-tight">
                    Yesterday's Tasks Are Pending
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                    {previousPendingTasks.length}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 font-medium truncate">
                  Unfinished tasks carried forward so you don't forget
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={rolloverAllToToday}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors"
              title="Move all pending tasks to today"
            >
              <RotateCcw size={12} className="stroke-[2.5]" />
              <span className="hidden sm:inline">Forward All</span>
              <span className="sm:hidden">All</span>
            </motion.button>
          </div>

          {/* List of carried-over pending tasks */}
          <div className="space-y-2 pt-1">
            <AnimatePresence>
              {previousPendingTasks.map(task => {
                const hasValidSubtask = task.subtask && task.subtask.trim() !== '' && task.subtask.trim().toUpperCase() !== 'NA';
                const isYesterday = task.date === yesterday;
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.01, y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-[22px] border border-amber-500/20 bg-white/80 dark:bg-white/[0.04] p-3.5 flex items-center gap-3 shadow-xs hover:border-amber-500/40 transition-colors group"
                  >
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.82 }}
                      onClick={() => toggleTask(task.id)}
                      className="w-6 h-6 rounded-[8px] flex-shrink-0 flex items-center justify-center border-2 border-amber-400 dark:border-amber-500/60 hover:bg-amber-500 hover:text-white transition-all bg-amber-500/5 text-transparent"
                      title="Mark done and roll to today"
                    >
                      <Check size={14} className="stroke-[3] group-hover:text-white" />
                    </motion.button>

                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleTask(task.id)}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-primary-light dark:text-primary-dark leading-tight">
                          {task.text}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 flex-shrink-0">
                          <Calendar size={9} />
                          {isYesterday ? 'Yesterday' : task.date ? format(new Date(task.date), 'MMM d') : 'Past'}
                        </span>
                      </div>
                      {hasValidSubtask && (
                        <span className="text-[11px] block mt-0.5 text-secondary-light dark:text-secondary-dark font-medium">
                          {task.subtask}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => moveToToday(task.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white transition-colors"
                        title="Move to Today"
                      >
                        <ArrowRight size={11} className="stroke-[2.5]" />
                        <span>Today</span>
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.88 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/60 text-muted-light hover:text-red-500 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Today's Section Header if yesterday's tasks exist */}
      {previousPendingTasks.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
            Today's Tasks ({todayTasks.length})
          </h2>
        </div>
      )}

      {/* Task list with Bouncy Checkboxes and Fluid Squircle Cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {todayTasks.map(task => {
            const hasValidSubtask = task.subtask && task.subtask.trim() !== '' && task.subtask.trim().toUpperCase() !== 'NA';
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.012, y: -1, transition: { type: 'spring', stiffness: 420, damping: 24 } }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.18 }}
                className={`rounded-[26px] border transition-colors p-4 flex items-center gap-3.5 group shadow-xs ${
                  task.completed
                    ? 'bg-surface-light/60 dark:bg-surface-dark/60 border-border-light/50 dark:border-border-dark/50 opacity-75'
                    : 'liquid-glass border-white/80 dark:border-white/10 hover:border-accent/40 shadow-xs'
                }`}
              >
                {/* Bouncy Spring Pop Checkbox */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.82 }}
                  onClick={() => toggleTask(task.id)}
                  className={`w-7 h-7 rounded-[10px] flex-shrink-0 flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-accent text-white shadow-sm'
                      : 'border-2 border-neutral-300 dark:border-neutral-600 hover:border-accent bg-black/[0.02] dark:bg-white/[0.04]'
                  }`}
                >
                  {task.completed && (
                    <motion.div
                      initial={{ scale: 0.4 }}
                      animate={{ scale: [0.4, 1.35, 0.95, 1] }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    >
                      <Check size={15} strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleTask(task.id)}>
                  <span className={`text-sm leading-snug block font-bold transition-all ${
                    task.completed
                      ? 'line-through text-muted-light dark:text-muted-dark opacity-60'
                      : 'text-primary-light dark:text-primary-dark'
                  }`}>
                    {task.text}
                  </span>
                  {hasValidSubtask && (
                    <span className={`text-xs block mt-1 leading-normal font-medium ${
                      task.completed
                        ? 'line-through text-muted-light/60 dark:text-muted-dark/60'
                        : 'text-secondary-light dark:text-secondary-dark'
                    }`}>
                      {task.subtask}
                    </span>
                  )}
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="opacity-40 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/60 text-red-500 transition-all flex-shrink-0"
                  title="Delete task"
                >
                  <Trash2 size={15} />
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {todayTasks.length === 0 && (
          <div className="liquid-glass rounded-[32px] p-10 text-center border border-white/70 dark:border-white/10">
            <p className="text-2xl mb-2">✓</p>
            <p className="label-mono text-secondary-light dark:text-secondary-dark font-bold">No TO-DOs yet</p>
            <p className="text-sm text-muted-light dark:text-muted-dark mt-1">Tap + Add Task to create your first TO-DO</p>
          </div>
        )}
      </div>

      {/* Add Task Elevated Bottom Sheet / Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 dark:bg-black/60 backdrop-blur-md z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 340 }}
              className="w-full max-w-lg liquid-glass rounded-t-[36px] sm:rounded-[36px] p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.25rem))] sm:pb-6 border-t sm:border border-white/80 dark:border-white/15 shadow-[0_-16px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_-16px_48px_rgba(0,0,0,0.6)]"
              onClick={e => e.stopPropagation()}
            >
              {/* Top Drag Indicator */}
              <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-primary-light dark:text-primary-dark font-sans tracking-tight">
                  New TO-DO
                </h2>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAdd(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-secondary-light dark:text-secondary-dark hover:opacity-80 transition-opacity"
                  aria-label="Close"
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
                    Main Task
                  </label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="e.g. Physics Assignment 3"
                    autoFocus
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
                    Details & Subtasks (Optional)
                  </label>
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    placeholder="e.g. Complete questions 1 to 10 from HC Verma"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAdd(false)}
                    className="w-full py-3.5 rounded-2xl border border-border-light/80 dark:border-border-dark/80 text-secondary-light dark:text-secondary-dark font-bold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addTask}
                    disabled={!newTask.trim()}
                    className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-xs shadow-md shadow-accent/25 hover:opacity-95 transition-all disabled:opacity-40 disabled:shadow-none"
                  >
                    Create Task
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
