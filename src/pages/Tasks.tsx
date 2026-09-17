import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, X, Check, RotateCcw, Clock, ArrowRight, Calendar as CalendarIcon, Bell, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { format, subDays, addDays, isSameDay, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { syncTaskNotifications, checkNotificationPermission, requestAndSyncNotifications } from '../utils/notifications';
import { BottomSheet, Modal } from '../components/BottomSheet';
import InteractiveCheckbox from '../components/interactive/InteractiveCheckbox';
import type { AppData, Task } from '../types';


interface TasksProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function Tasks({ data, updateData }: TasksProps) {
  const [newTask, setNewTask] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [newDate, setNewDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [showAdd, setShowAdd] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const yesterday = useMemo(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), []);

  // Sync native OS notification center reminders on mount or task update, prompting phone permission if not yet allowed
  useEffect(() => {
    checkNotificationPermission().then(granted => {
      if (!granted) {
        requestAndSyncNotifications(data, updateData);
      } else if (data?.tasks) {
        // Non-blocking background sync to prevent UI frame hitch
        setTimeout(() => {
          syncTaskNotifications(data.tasks, data.settings?.notificationLeadMinutes || 10);
        }, 80);
      }
    });
  }, [data?.tasks, data?.settings?.notificationLeadMinutes, data?.settings?.notificationsEnabled]);

  // Tasks for the selected calendar date
  const filteredTasks = useMemo(() => {
    return (data?.tasks || []).filter(t => (t?.dueDate || t?.date) === selectedDate);
  }, [data?.tasks, selectedDate]);

  // Today's scheduled tasks for completion rate
  const todayTasks = useMemo(() => {
    return (data?.tasks || []).filter(t => (t?.dueDate || t?.date) === today);
  }, [data?.tasks, today]);

  // Yesterday's & Previous Days' Uncompleted Tasks
  const previousPendingTasks = useMemo(() => {
    return (data?.tasks || []).filter(t => {
      const taskD = t?.dueDate || t?.date;
      return taskD && taskD < today && !t.completed;
    });
  }, [data?.tasks, today]);

  const completedCount = useMemo(() => {
    return filteredTasks.filter(t => t.completed).length;
  }, [filteredTasks]);

  const pct = filteredTasks.length > 0 ? Math.round((completedCount / filteredTasks.length) * 100) : 0;

  // Weekdays carousel around selected date
  const weekDates = useMemo(() => {
    const current = parseISO(selectedDate);
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      dates.push(addDays(current, i));
    }
    return dates;
  }, [selectedDate]);

  const addTask = async () => {
    if (!newTask.trim()) return;
    triggerHaptic('save');
    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask.trim(),
      subtask: newSubtask.trim() || undefined,
      completed: false,
      date: newDate,
      dueDate: newDate,
      startTime: newStartTime.trim() || undefined,
      endTime: newEndTime.trim() || undefined,
      reminderTime: newStartTime.trim() || undefined,
    };
    await updateData({ tasks: [...(data?.tasks || []), task] });
    setNewTask('');
    setNewSubtask('');
    setNewStartTime('');
    setNewEndTime('');
    setNewDate(today);
    setShowAdd(false);
  };

  const toggleTask = async (id: string) => {
    triggerHaptic('medium');
    await updateData({
      tasks: (data?.tasks || []).map(t => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          const currentTaskDate = t.dueDate || t.date;
          return {
            ...t,
            completed: nextCompleted,
            date: nextCompleted && currentTaskDate < today ? today : t.date,
            dueDate: nextCompleted && currentTaskDate < today ? today : t.dueDate,
          };
        }
        return t;
      })
    });
  };

  const moveToToday = async (id: string) => {
    triggerHaptic('medium');
    await updateData({
      tasks: (data?.tasks || []).map(t => (t.id === id ? { ...t, date: today, dueDate: today } : t))
    });
  };

  const rolloverAllToToday = async () => {
    triggerHaptic('save');
    await updateData({
      tasks: (data?.tasks || []).map(t => {
        const taskD = t.dueDate || t.date;
        if (taskD && taskD < today && !t.completed) {
          return { ...t, date: today, dueDate: today };
        }
        return t;
      })
    });
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    triggerHaptic('heavy');
    await updateData({
      tasks: (data?.tasks || []).filter(t => t.id !== taskToDelete.id)
    });
    setTaskToDelete(null);
  };

  // Long-press handler ref
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef<boolean>(false);

  const handlePointerDown = (task: Task) => {
    isLongPressActive.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPressActive.current = true;
      triggerHaptic('heavy');
      setTaskToDelete(task);
    }, 550);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerCancel = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerMove = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const formatTimeRange = (start?: string, end?: string) => {
    if (!start && !end) return null;
    if (start && end) return `${start} → ${end}`;
    if (start) return `Starts ${start}`;
    return `Ends ${end}`;
  };

  return (
    <div className="space-y-6">

      {/* Header Hero Card */}
      <div className="rounded-[30px] p-5 sm:p-6 liquid-glass border border-[var(--card-border)] shadow-[var(--shadow-card)] flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] text-[10.5px] font-tag font-bold tracking-wider uppercase mb-2 border border-[var(--card-border)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            {selectedDate === today ? 'Today' : format(parseISO(selectedDate), 'EEEE, MMM d')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-[var(--text-primary)] font-heading">
            To-Do List
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium">
            Daily execution · Long-press any task to delete
          </p>
        </div>
        <button
          onClick={() => {
            triggerHaptic('light');
            setNewDate(selectedDate);
            setShowAdd(true);
          }}
          className="bouncy-tap flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-primary)]/25 hover:opacity-95 shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} /> Add Task
        </button>
      </div>

      {/* ── Fluid Calendar Strip ── */}
      <div className="liquid-glass rounded-[28px] p-3 border border-[var(--card-border)] shadow-sm">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2">
            <CalendarIcon size={14} className="text-accent" />
            <span className="text-xs font-bold text-primary-light dark:text-primary-dark">
              {format(parseISO(selectedDate), 'MMMM yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                triggerHaptic('selection');
                setSelectedDate(format(addDays(parseISO(selectedDate), -1), 'yyyy-MM-dd'));
              }}
              className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary-light dark:text-secondary-dark"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setSelectedDate(today);
              }}
              className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-black/5 dark:bg-white/10 text-primary-light dark:text-primary-dark"
            >
              Today
            </button>
            <button
              onClick={() => {
                triggerHaptic('selection');
                setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));
              }}
              className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary-light dark:text-secondary-dark"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day Pills Carousel */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
          {weekDates.map(d => {
            const dateStr = format(d, 'yyyy-MM-dd');
            const isSelected = dateStr === selectedDate;
            const isTodayDate = dateStr === today;
            const tasksOnDay = (data?.tasks || []).filter(t => (t?.dueDate || t?.date) === dateStr);
            const hasTasks = tasksOnDay.length > 0;
            const allDone = hasTasks && tasksOnDay.every(t => t.completed);

            return (
              <button
                key={dateStr}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedDate(dateStr);
                }}
                className={`flex-1 min-w-[42px] py-2 px-1 rounded-2xl flex flex-col items-center gap-0.5 transition-all text-center ${
                  isSelected
                    ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.04]'
                    : isTodayDate
                      ? 'bg-accent/10 dark:bg-accent/20 text-accent font-bold'
                      : 'hover:bg-black/5 dark:hover:bg-white/5 text-secondary-light dark:text-secondary-dark'
                }`}
              >
                <span className="text-[10px] uppercase font-bold tracking-tight opacity-75">
                  {format(d, 'EEE')}
                </span>
                <span className="text-sm font-black leading-tight">
                  {format(d, 'd')}
                </span>
                <div className="h-1 flex items-center justify-center mt-0.5">
                  {hasTasks && (
                    <span className={`w-1 h-1 rounded-full ${
                      isSelected
                        ? 'bg-white'
                        : allDone
                          ? 'bg-emerald-500'
                          : 'bg-accent'
                    }`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion Progress Card */}
      <div className="rounded-[30px] p-5 liquid-glass border border-[var(--card-border)] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
            {selectedDate === today ? "Today's Completion" : "Day's Progress"}
          </span>
          <span className={`px-3 py-0.5 rounded-full text-xs font-bold shadow-xs border ${
            pct === 100 && filteredTasks.length > 0
              ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
              : pct >= 50
                ? 'bg-indigo-500/15 border-indigo-500/25 text-indigo-700 dark:text-indigo-300'
                : filteredTasks.length === 0
                  ? 'bg-neutral-500/10 border-neutral-500/20 text-neutral-600 dark:text-neutral-400'
                  : 'bg-amber-500/15 border-amber-500/25 text-amber-700 dark:text-amber-300'
          }`}>
            {filteredTasks.length === 0 ? 'No Tasks' : pct === 100 ? 'Completed' : `${pct}% Done`}
          </span>
        </div>

        {/* Segmented bar */}
        {filteredTasks.length > 0 ? (
          <div className="flex items-center gap-1.5 py-1">
            {filteredTasks.map((task, i) => {
              const palette = [
                'bg-purple-500',
                'bg-indigo-500',
                'bg-emerald-500',
                'bg-amber-500',
                'bg-rose-500',
                'bg-cyan-500',
                'bg-orange-500',
                'bg-teal-500',
              ];
              const color = palette[i % palette.length];
              return (
                <div
                  key={task.id}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    task.completed
                      ? `${color} opacity-100`
                      : 'bg-black/10 dark:bg-white/10'
                  }`}
                />
              );
            })}
          </div>
        ) : (
          <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10" />
        )}

        <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-muted-light dark:text-muted-dark">
          <span>{completedCount} of {filteredTasks.length} finished</span>
          <span>{filteredTasks.length - completedCount} remaining</span>
        </div>
      </div>

      {/* Yesterday's / Overdue Pending Tasks (Rollover subsection) */}
      {selectedDate === today && previousPendingTasks.length > 0 && (
        <div className="rounded-[30px] p-5 liquid-glass border border-amber-500/30 glow-peach shadow-sm space-y-3">
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

            <button
              onClick={rolloverAllToToday}
              className="bouncy-tap flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors"
              title="Move all pending tasks to today"
            >
              <RotateCcw size={12} className="stroke-[2.5]" />
              <span>Forward All</span>
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {previousPendingTasks.map(task => {
              const hasValidSubtask = task.subtask && task.subtask.trim() !== '' && task.subtask.trim().toUpperCase() !== 'NA';
              const isYesterday = (task.dueDate || task.date) === yesterday;
              return (
                <div
                  key={task.id}
                  onPointerDown={() => handlePointerDown(task)}
                  onPointerUp={handlePointerUp}
                  onPointerMove={handlePointerMove}
                  onPointerCancel={handlePointerCancel}
                  className="rounded-[22px] border border-amber-500/20 bg-white/80 dark:bg-white/[0.04] p-3.5 flex items-center gap-3 shadow-xs hover:border-amber-500/40 transition-colors select-none"
                >
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="w-6 h-6 rounded-[8px] flex-shrink-0 flex items-center justify-center border-2 border-amber-400 dark:border-amber-500/60 hover:bg-amber-500 hover:text-white transition-all bg-amber-500/5 text-transparent"
                  >
                    <Check size={14} className="stroke-[3]" />
                  </button>

                  <div className="flex-1 min-w-0" onClick={() => toggleTask(task.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-primary-light dark:text-primary-dark leading-tight">
                        {task.text}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                        <CalendarIcon size={9} />
                        {isYesterday ? 'Yesterday' : (task.dueDate || task.date)}
                      </span>
                    </div>
                    {hasValidSubtask && (
                      <span className="text-[11px] block mt-0.5 text-secondary-light dark:text-secondary-dark font-medium">
                        {task.subtask}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => moveToToday(task.id)}
                    className="bouncy-tap inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white transition-colors"
                  >
                    <ArrowRight size={11} className="stroke-[2.5]" />
                    <span>Today</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Task List: NO TRASH ICON, LONG-PRESS TO DELETE, TIME RANGE BESIDE TASK */}
      <div className="space-y-3">
        {filteredTasks.map(task => {
          const hasValidSubtask = task.subtask && task.subtask.trim() !== '' && task.subtask.trim().toUpperCase() !== 'NA';
          const timeRange = formatTimeRange(task.startTime, task.endTime);

          return (
            <div
              key={task.id}
              onPointerDown={() => handlePointerDown(task)}
              onPointerUp={handlePointerUp}
              onPointerMove={handlePointerMove}
              onPointerCancel={handlePointerCancel}
              onContextMenu={e => {
                e.preventDefault();
                setTaskToDelete(task);
              }}
              className={`rounded-[26px] border p-4 flex items-center gap-3.5 transition-all select-none ${
                task.completed
                  ? 'liquid-glass border-[var(--card-border)] bg-[var(--card-surface)]/70'
                  : 'liquid-glass border-[var(--card-border)] hover:border-[var(--accent-primary)]/40 shadow-xs'
              }`}
            >
              {/* Interactive Spring Checkbox */}
              <InteractiveCheckbox
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                size={26}
              />

              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  if (!isLongPressActive.current) toggleTask(task.id);
                }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`text-sm leading-snug font-bold transition-all ${
                    task.completed
                      ? 'line-through text-[var(--text-secondary)] font-semibold'
                      : 'text-[var(--text-primary)]'
                  }`}>
                    {task.text}
                  </span>

                  {/* Start time → End time Range Capsule beside task */}
                  {timeRange && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)] flex-shrink-0">
                      <Clock size={10} className="stroke-[2.5]" />
                      {timeRange}
                    </span>
                  )}
                </div>

                {hasValidSubtask && (
                  <span className={`text-xs block mt-1 leading-normal font-medium ${
                    task.completed
                      ? 'line-through text-[var(--text-muted)]'
                      : 'text-[var(--text-secondary)]'
                  }`}>
                    {task.subtask}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="liquid-glass rounded-[32px] p-10 text-center border border-[var(--card-border)] flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-3 shadow-sm shadow-accent/15">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <p className="text-sm font-bold text-secondary-light dark:text-secondary-dark">No tasks for this day</p>
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1">Tap "+ Add Task" to schedule something</p>
          </div>
        )}
      </div>

      {/* ── Long Press Delete Confirmation Dialog (Rendered via Portal) ── */}
      <Modal isOpen={!!taskToDelete} onClose={() => setTaskToDelete(null)} maxWidth="max-w-sm">
        {taskToDelete && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center mx-auto">
              <X size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-black text-primary-light dark:text-primary-dark">Delete Task?</h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1 font-medium line-clamp-2">
                "{taskToDelete.text}"
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="py-3 rounded-2xl border border-border-light dark:border-border-dark text-xs font-bold text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Keep Task
              </button>
              <button
                type="button"
                onClick={confirmDeleteTask}
                className="py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-500/25 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add Task Elevated Modal with Date Picker & Start/End Time (Rendered via Portal) ── */}
      <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-primary-light dark:text-primary-dark font-sans tracking-tight">
              New TO-DO
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent">
              Scheduled
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-secondary-light dark:text-secondary-dark"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3.5">
          {/* Task Name */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5 font-mono">
              Task Title
            </label>
            <input
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="e.g. Complete Machine Learning assignment"
              autoFocus
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
            />
          </div>

          {/* Subtask */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5 font-mono">
              Subtask / Note (Optional)
            </label>
            <input
              type="text"
              value={newSubtask}
              onChange={e => setNewSubtask(e.target.value)}
              placeholder="e.g. Submit PDF to LMS portal"
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
            />
          </div>

          {/* Date Selector */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5 font-mono flex items-center gap-1">
              <CalendarIcon size={11} className="text-accent" /> Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary-light dark:text-primary-dark"
            />
          </div>

          {/* Time: Start & End */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5 font-mono flex items-center gap-1">
                <Clock size={11} className="text-accent" /> Start Time
              </label>
              <input
                type="time"
                value={newStartTime}
                onChange={e => setNewStartTime(e.target.value)}
                className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary-light dark:text-primary-dark"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5 font-mono flex items-center gap-1">
                <Clock size={11} className="text-accent" /> End Time
              </label>
              <input
                type="time"
                value={newEndTime}
                onChange={e => setNewEndTime(e.target.value)}
                className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 text-primary-light dark:text-primary-dark"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="py-3 rounded-2xl border border-border-light/80 dark:border-border-dark/80 text-secondary-light dark:text-secondary-dark font-bold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addTask}
              disabled={!newTask.trim()}
              className="py-3 rounded-2xl bg-accent text-white font-bold text-xs shadow-md shadow-accent/25 hover:opacity-95 transition-all disabled:opacity-40"
            >
              Save TO-DO
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
