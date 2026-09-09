import { useState, useMemo } from 'react';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
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

  const todayTasks = useMemo(() => {
    return (data?.tasks || []).filter(t => t?.date === today);
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
      tasks: (data?.tasks || []).map(t => t.id === id ? { ...t, completed: !t.completed } : t)
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
      <div className="rounded-[28px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
            Completion Rate
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
            pct === 100
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
              : pct >= 50
                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                : todayTasks.length === 0
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
          }`}>
            {pct === 100 ? 'All Done' : pct >= 50 ? 'On Track' : todayTasks.length === 0 ? 'No Tasks' : 'In Progress'}
          </span>
        </div>

        {/* Segmented bar — one segment per task */}
        {todayTasks.length > 0 ? (
          <div className="flex items-center gap-1">
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
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    task.completed
                      ? color
                      : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}
                />
              );
            })}
          </div>
        ) : (
          <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800" />
        )}

        {/* Count below */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] font-mono font-medium text-muted-light dark:text-muted-dark">
            {completedCount}/{todayTasks.length} done
          </span>
          <span className="text-[11px] font-mono font-medium text-muted-light dark:text-muted-dark">
            {pct}%
          </span>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        <AnimatePresence>
          {todayTasks.map(task => {
            const hasValidSubtask = task.subtask && task.subtask.trim() !== '' && task.subtask.trim().toUpperCase() !== 'NA';
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className={`rounded-[22px] border transition-all p-4 flex items-center gap-3.5 group shadow-sm ${
                  task.completed
                    ? 'bg-surface-light/60 dark:bg-surface-dark/60 border-border-light/50 dark:border-border-dark/50 opacity-75'
                    : 'bg-white dark:bg-[#1A1B1F] border-border-light dark:border-border-dark hover:border-accent/40 shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={`w-7 h-7 rounded-[9px] flex-shrink-0 flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-accent text-white shadow-sm scale-100'
                      : 'border-2 border-neutral-300 dark:border-neutral-600 hover:border-accent bg-black/[0.02] dark:bg-white/[0.04]'
                  }`}
                >
                  {task.completed && <Check size={16} className="stroke-[3]" />}
                </button>
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="opacity-40 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/60 text-red-500 transition-all flex-shrink-0"
                  title="Delete task"
                >
                  <Trash2 size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {todayTasks.length === 0 && (
          <div className="card p-10 text-center">
            <p className="text-2xl mb-2">✓</p>
            <p className="label-mono text-secondary-light dark:text-secondary-dark font-bold">No TO-DOs yet</p>
            <p className="text-sm text-muted-light dark:text-muted-dark mt-1">Tap + Add Task to create your first TO-DO</p>
          </div>
        )}
      </div>

      {/* Add Task Elevated Modal Card */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0, scale: 0.95 }} 
              animate={{ y: 0, opacity: 1, scale: 1 }} 
              exit={{ y: '100%', opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-lg bg-surface-light dark:bg-surface-dark rounded-[28px] p-5 sm:p-6 mb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:mb-0 border border-border-light dark:border-border-dark shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-border-light dark:bg-border-dark mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-primary-light dark:text-primary-dark font-sans">New TO-DO</h2>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-secondary-light dark:text-secondary-dark hover:opacity-80">
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5 font-mono">
                    Main Task
                  </label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="e.g. Physics Assignment 3"
                    autoFocus
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5 font-mono">
                    What to do actually (sub-option / details)
                  </label>
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    placeholder="e.g. Complete questions 1 to 10 from HC Verma"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-3 rounded-full border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark font-bold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTask}
                    disabled={!newTask.trim()}
                    className="flex-[1.5] py-3 rounded-full bg-accent text-white font-bold text-xs shadow-sm hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-40"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
