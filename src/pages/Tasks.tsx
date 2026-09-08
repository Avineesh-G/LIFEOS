import { useState } from 'react';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import type { AppData, Task } from '../types';

interface TasksProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.44, ease: 'easeOut' } } };

export default function Tasks({ data, updateData }: TasksProps) {
  const [newTask, setNewTask] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayTasks     = data.tasks.filter(t => t.date === today);
  const completedCount = todayTasks.filter(t => t.completed).length;
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
    await updateData({ tasks: [...data.tasks, task] });
    setNewTask('');
    setNewSubtask('');
    setShowAdd(false);
  };

  const toggleTask = async (id: string) => {
    triggerHaptic('medium');
    await updateData({ tasks: data.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) });
  };

  const deleteTask = async (id: string) => {
    triggerHaptic('heavy');
    await updateData({ tasks: data.tasks.filter(t => t.id !== id) });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-7 pb-8">

      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold tracking-wider uppercase mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse" />
            Today
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-primary-light dark:text-primary-dark">
            TO-DO List
          </h1>
        </div>
        <button 
          onClick={() => setShowAdd(true)} 
          className="rounded-full flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold bg-[#6750A4] dark:bg-[#D0BCFF] text-white dark:text-[#21005D] shadow-sm hover:opacity-95 active:scale-95 transition-all"
        >
          <Plus size={16} strokeWidth={2.5} /> Add Task
        </button>
      </motion.div>

      {/* Segmented task progress bar — each task gets its own color */}
      <motion.div variants={item} className="rounded-[28px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 shadow-m3-subtle">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold tracking-wider text-muted-light dark:text-muted-dark uppercase">
            Today's Tasks
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
              // Cycle through a vibrant palette — same aesthetic as home page pillars
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
                <motion.div
                  key={task.id}
                  className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                    task.completed
                      ? color
                      : 'bg-neutral-100 dark:bg-neutral-800'
                  }`}
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.35, delay: i * 0.04, ease: 'easeOut' }}
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
      </motion.div>



      {/* Task list */}
      <motion.div variants={item} className="space-y-3">
        <AnimatePresence>
          {todayTasks.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-[22px] bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm flex items-center gap-4 p-4.5 group active:scale-[0.985] transition-all"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-7 h-7 rounded-[10px] flex-shrink-0 flex items-center justify-center transition-all ${
                  task.completed
                    ? 'bg-accent text-white shadow-sm'
                    : 'border-2 border-neutral-300 dark:border-neutral-600 hover:border-accent'
                }`}
              >
                {task.completed && <Check size={16} className="stroke-[3]" />}
              </button>
              <div className="flex-1 min-w-0">
                <span className={`text-sm leading-snug truncate block font-medium ${
                  task.completed
                    ? 'line-through text-muted-light dark:text-muted-dark'
                    : 'text-primary-light dark:text-primary-dark'
                }`}>
                  {task.text}
                </span>
                {task.subtask && (
                  <span className={`text-xs block mt-0.5 truncate ${
                    task.completed
                      ? 'line-through text-muted-light/70 dark:text-muted-dark/70'
                      : 'text-secondary-light dark:text-secondary-dark'
                  }`}>
                    {task.subtask}
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/60 text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {todayTasks.length === 0 && (
          <motion.div variants={item} className="card p-10 text-center">
            <p className="text-2xl mb-2">✓</p>
            <p className="label-mono text-secondary-light dark:text-secondary-dark">No TO-DOs yet</p>
            <p className="text-sm text-muted-light dark:text-muted-dark mt-1">Tap + to add your first TO-DO</p>
          </motion.div>
        )}
      </motion.div>

      {/* Add Task Sheet */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-end justify-center"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-xl bg-surface-light dark:bg-surface-dark rounded-t-3xl p-6 pb-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-border-light dark:bg-border-dark mx-auto mb-6" />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">New TO-DO</h2>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-light dark:bg-bg-dark">
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5">
                    Main Task
                  </label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="e.g. Physics Assignment 3"
                    autoFocus
                    className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5">
                    What to do actually (sub-option / details)
                  </label>
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTask()}
                    placeholder="e.g. Solve problems 1 through 10 and submit PDF"
                    className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
                  />
                </div>

                <button
                  onPointerDown={() => triggerHaptic('save')}
                  onClick={addTask}
                  disabled={!newTask.trim()}
                  className="btn-pill w-full py-3.5 text-sm disabled:opacity-30 mt-2"
                >
                  Add TO-DO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
