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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between pt-2">
        <div>
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Today</p>
          <h1 className="text-4xl font-bold tracking-tight leading-none text-primary-light dark:text-primary-dark">TO-DO List</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-pill flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus size={14} strokeWidth={2.5} /> Add
        </button>
      </motion.div>

      {/* Progress card */}
      {todayTasks.length > 0 && (
        <motion.div variants={item} className="card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Progress</p>
              <div className="flex items-end gap-1.5">
                <span className="text-4xl font-bold tracking-tight">{pct}</span>
                <span className="text-lg text-muted-light dark:text-muted-dark mb-0.5 font-medium">%</span>
              </div>
            </div>
            <span className="label-mono text-muted-light dark:text-muted-dark">{completedCount}/{todayTasks.length}</span>
          </div>
          <div className="h-1.5 bg-bg-light dark:bg-bg-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-light dark:bg-primary-dark rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* Task list */}
      <motion.div variants={item} className="space-y-2">
        <AnimatePresence>
          {todayTasks.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="card flex items-center gap-3 p-4 group active:scale-[0.985] transition-transform"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-5 h-5 rounded border-[1.5px] flex-shrink-0 flex items-center justify-center transition-all ${
                  task.completed
                    ? 'bg-primary-light dark:bg-primary-dark border-primary-light dark:border-primary-dark'
                    : 'border-border-light dark:border-border-dark hover:border-primary-light dark:hover:border-primary-dark'
                }`}
              >
                {task.completed && <Check size={11} className="text-surface-light dark:text-surface-dark" strokeWidth={3} />}
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
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400 transition-all"
              >
                <Trash2 size={13} />
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
