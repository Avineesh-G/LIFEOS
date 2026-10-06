import React, { useState, useMemo, useEffect } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretLeft,
  CaretRight,
  CalendarDots,
  CheckCircle,
  Barbell,
  GraduationCap,
  MapPin,
  Plus,
  Clock,
} from '../../ui/tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { MOTION_SPRINGS } from '../../ui/tokens/motion';
import { getOutings } from '../../features/outings/storage/outingsIdb';
import type { Outing } from '../../features/outings/types';
import type { AppData, Task, TimetableBlock } from '../../types';

export interface HomeCalendarSyncProps {
  data: AppData;
  updateData?: (partial: Partial<AppData>) => Promise<AppData>;
}

export function HomeCalendarSync({ data, updateData }: HomeCalendarSyncProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [outings, setOutings] = useState<Outing[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Load Outings from IDB
  useEffect(() => {
    let isMounted = true;
    getOutings()
      .then((list) => {
        if (isMounted && list) setOutings(list);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedDateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const selectedDayName = useMemo(() => format(selectedDate, 'EEEE'), [selectedDate]);

  // Calendar Grid Days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Sync Data by Date
  const dateMap = useMemo(() => {
    const map = new Map<
      string,
      {
        tasks: Task[];
        classes: TimetableBlock[];
        outings: Outing[];
        hasWorkout: boolean;
      }
    >();

    // Index Tasks
    (data.tasks || []).forEach((t) => {
      const d = t.dueDate || t.date;
      if (d) {
        const entry = map.get(d) || { tasks: [], classes: [], outings: [], hasWorkout: false };
        entry.tasks.push(t);
        map.set(d, entry);
      }
    });

    // Index Outings
    (outings || []).forEach((o) => {
      const d = o.startDate ? o.startDate.slice(0, 10) : '';
      if (d) {
        const entry = map.get(d) || { tasks: [], classes: [], outings: [], hasWorkout: false };
        entry.outings.push(o);
        map.set(d, entry);
      }
    });

    // Index Workouts
    (data.workoutLogs || []).forEach((w) => {
      if (w.date) {
        const entry = map.get(w.date) || { tasks: [], classes: [], outings: [], hasWorkout: false };
        entry.hasWorkout = true;
        map.set(w.date, entry);
      }
    });

    return map;
  }, [data.tasks, data.workoutLogs, outings]);

  // Classes for the selected day of week
  const selectedDayClasses = useMemo(() => {
    return (data.timetable || []).filter(
      (b) => b.day?.toLowerCase() === selectedDayName.toLowerCase()
    );
  }, [data.timetable, selectedDayName]);

  // Tasks for the selected day
  const selectedDayTasks = useMemo(() => {
    return (data.tasks || []).filter((t) => (t.dueDate || t.date) === selectedDateStr);
  }, [data.tasks, selectedDateStr]);

  // Outings for the selected day
  const selectedDayOutings = useMemo(() => {
    return (outings || []).filter((o) => o.startDate && o.startDate.slice(0, 10) === selectedDateStr);
  }, [outings, selectedDateStr]);

  // Workout for the selected day
  const selectedDayWorkout = useMemo(() => {
    const log = (data.workoutLogs || []).find((w) => w.date === selectedDateStr);
    if (log) return { name: log.type, isDone: true };
    const plan = (data.workoutPlans || []).find(
      (p) => p.day?.toLowerCase() === selectedDayName.toLowerCase()
    );
    if (plan) return { name: plan.type, isDone: false };
    return null;
  }, [data.workoutLogs, data.workoutPlans, selectedDateStr, selectedDayName]);

  // Handle Task completion toggle
  const handleToggleTask = (taskId: string) => {
    if (!updateData) return;
    triggerHaptic('success');
    const updated = (data.tasks || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateData({ tasks: updated });
  };

  // Handle Quick Task Add
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !updateData) return;
    triggerHaptic('medium');

    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      date: selectedDateStr,
      dueDate: selectedDateStr,
      completed: false,
    };

    updateData({ tasks: [newTask, ...(data.tasks || [])] });
    setNewTaskText('');
    setIsAddingTask(false);
  };

  const handlePrevMonth = () => {
    triggerHaptic('light');
    setCurrentMonth((m) => subMonths(m, 1));
  };

  const handleNextMonth = () => {
    triggerHaptic('light');
    setCurrentMonth((m) => addMonths(m, 1));
  };

  const handleGoToday = () => {
    triggerHaptic('selection');
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  const totalItemsCount =
    selectedDayTasks.length +
    selectedDayClasses.length +
    selectedDayOutings.length +
    (selectedDayWorkout ? 1 : 0);

  return (
    <div className="flex flex-col gap-3.5 select-none">
      {/* ── Section Header ── */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg glass-tile text-[#5E5CE6] flex items-center justify-center">
            <CalendarDots size={16} weight="duotone" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-white tracking-tight leading-none">
              Synced Schedule & Calendar
            </h2>
            <p className="text-[11.5px] text-[rgba(235,235,245,0.55)] mt-0.5">
              Live sync across tasks, timetable, outings & gym
            </p>
          </div>
        </div>

        {!isToday(selectedDate) && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleGoToday}
            className="px-2.5 py-1 rounded-full glass-nav nav-rim-light text-[11px] font-semibold text-[#0A84FF] active:bg-white/10"
          >
            Today
          </motion.button>
        )}
      </div>

      {/* ── Calendar Liquid Chassis ── */}
      <div className="glass-card p-4 flex flex-col gap-4">
        {/* Month Navigation Row */}
        <div className="flex items-center justify-between">
          <div className="text-[16px] font-bold text-white tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </div>

          <div className="h-8 px-1 rounded-full glass-grouped-toolbar inline-flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer"
              aria-label="Previous Month"
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <div className="w-[1px] h-3 bg-white/10" />
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer"
              aria-label="Next Month"
            >
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
            <span
              key={idx}
              className="text-[11px] font-bold text-[rgba(235,235,245,0.40)] uppercase"
            >
              {day}
            </span>
          ))}
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 text-center">
          {calendarDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayOfWeekName = format(day, 'EEEE');
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const isSelected = isSameDay(day, selectedDate);

            // Sync indicators
            const syncEntry = dateMap.get(dateStr);
            const dayClasses = (data.timetable || []).filter(
              (b) => b.day?.toLowerCase() === dayOfWeekName.toLowerCase()
            );

            const hasTasks = syncEntry && syncEntry.tasks.length > 0;
            const hasClasses = dayClasses.length > 0;
            const hasOutings = syncEntry && syncEntry.outings.length > 0;
            const hasWorkout = syncEntry?.hasWorkout;

            return (
              <motion.button
                key={dateStr}
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  triggerHaptic('selection');
                  setSelectedDate(day);
                }}
                className={`relative flex flex-col items-center justify-center h-10 rounded-2xl transition-all cursor-pointer select-none ${
                  !isCurrentMonth ? 'opacity-25' : 'opacity-100'
                }`}
              >
                {/* Active Day Liquid Droplet Indicator (Pure Dark Droplet, No Color Fill) */}
                {isSelected && (
                  <motion.div
                    layoutId="calendar-selected-thumb"
                    className="absolute inset-0 rounded-2xl -z-10"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.14), 0 4px 12px rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                    }}
                    transition={MOTION_SPRINGS.snappy}
                  />
                )}

                {/* Day Number (Color on Letters/Numbers Only) */}
                <span
                  className={`text-[13px] font-semibold tabular-nums leading-none ${
                    isCurrentDay
                      ? 'text-[#0A84FF] font-bold'
                      : isSelected
                      ? 'text-white font-bold'
                      : 'text-[rgba(235,235,245,0.85)]'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Sync Event Multi-Dots */}
                <div className="flex items-center justify-center gap-0.5 mt-1 h-1.5">
                  {hasTasks && <span className="w-1 h-1 rounded-full bg-[#0A84FF]" />}
                  {hasClasses && <span className="w-1 h-1 rounded-full bg-[#5E5CE6]" />}
                  {hasOutings && <span className="w-1 h-1 rounded-full bg-[#30D158]" />}
                  {hasWorkout && <span className="w-1 h-1 rounded-full bg-[#FF9F0A]" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-white/[0.06] text-[10.5px] text-[rgba(235,235,245,0.55)] font-medium">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]" />
            <span>Tasks</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5E5CE6]" />
            <span>Classes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
            <span>Outings</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F0A]" />
            <span>Workout</span>
          </div>
        </div>
      </div>

      {/* ── Selected Day Agenda Breakdown ── */}
      <div className="glass-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider">
              {isToday(selectedDate) ? 'Today' : selectedDayName}
            </div>
            <div className="text-[17px] font-bold text-white tracking-tight">
              {format(selectedDate, 'EEEE, MMMM d')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsAddingTask((prev) => !prev);
            }}
            className="px-3 py-1.5 rounded-full glass-nav nav-rim-light flex items-center gap-1.5 text-[12px] font-semibold text-[#0A84FF] active:scale-95 transition-all"
          >
            <Plus size={14} weight="bold" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Quick Task Creation Input */}
        <AnimatePresence>
          {isAddingTask && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleAddTask}
              className="flex items-center gap-2 overflow-hidden pt-1"
            >
              <input
                type="text"
                autoFocus
                placeholder={`New task for ${format(selectedDate, 'MMM d')}...`}
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="flex-1 h-9 px-3.5 rounded-xl bg-white/[0.08] text-[13.5px] text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none focus:ring-1 focus:ring-[#0A84FF]"
              />
              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-[#0A84FF] text-white text-[12.5px] font-bold active:scale-95 transition-all"
              >
                Save
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Items List */}
        <div className="flex flex-col gap-2 pt-1">
          {totalItemsCount === 0 ? (
            <div className="py-4 text-center text-[12.5px] text-[rgba(235,235,245,0.45)] italic">
              No tasks, classes, or events scheduled for this day.
            </div>
          ) : (
            <>
              {/* Tasks */}
              {selectedDayTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleToggleTask(t.id)}
                  className="p-3 rounded-2xl bg-[#18181A] flex items-start gap-3 cursor-pointer hover:bg-[#202024] active:scale-[0.99] transition-all select-none"
                >
                  <div className="text-lg mt-0.5">
                    <CheckCircle
                      weight={t.completed ? 'fill' : 'regular'}
                      className={
                        t.completed ? 'text-[#30D158]' : 'text-[rgba(235,235,245,0.40)]'
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13.5px] font-medium leading-tight ${
                        t.completed
                          ? 'line-through text-[rgba(235,235,245,0.40)]'
                          : 'text-white'
                      }`}
                    >
                      {t.text}
                    </div>
                    {t.subtask && (
                      <div className="text-[11.5px] text-[rgba(235,235,245,0.50)] mt-0.5 truncate">
                        {t.subtask}
                      </div>
                    )}
                  </div>
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full glass-flat text-[#0A84FF] shrink-0">
                    Task
                  </span>
                </div>
              ))}

              {/* Classes / Timetable Blocks */}
              {selectedDayClasses.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-2xl bg-[#18181A] flex items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl glass-tile text-[#5E5CE6] flex items-center justify-center shrink-0">
                      <GraduationCap size={18} weight="duotone" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-white leading-tight">
                        {c.subject}
                      </div>
                      <div className="text-[11.5px] text-[rgba(235,235,245,0.55)] flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {c.startTime} - {c.endTime}
                        </span>
                        {c.room && <span>· Room {c.room}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full glass-flat text-[#5E5CE6] shrink-0">
                    Class
                  </span>
                </div>
              ))}

              {/* Gym Workout Split */}
              {selectedDayWorkout && (
                <div className="p-3 rounded-2xl bg-[#18181A] flex items-center justify-between gap-3 select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl glass-tile text-[#FF9F0A] flex items-center justify-center shrink-0">
                      <Barbell size={18} weight="duotone" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-white leading-tight">
                        {selectedDayWorkout.name}
                      </div>
                      <div className="text-[11.5px] text-[rgba(235,235,245,0.55)] mt-0.5">
                        {selectedDayWorkout.isDone ? 'Completed' : 'Planned workout routine'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full glass-flat shrink-0 ${
                      selectedDayWorkout.isDone
                        ? 'text-[#30D158]'
                        : 'text-[#FF9F0A]'
                    }`}
                  >
                    Gym
                  </span>
                </div>
              )}

              {/* Outings */}
              {selectedDayOutings.map((o) => (
                <div
                  key={o.id}
                  className="p-3 rounded-2xl bg-[#18181A] flex items-center justify-between gap-3 select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl glass-tile text-[#30D158] flex items-center justify-center shrink-0">
                      <MapPin size={18} weight="duotone" />
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold text-white leading-tight">
                        {o.name}
                      </div>
                      <div className="text-[11.5px] text-[rgba(235,235,245,0.55)] mt-0.5">
                        {o.place || 'Outing plan'} · {o.participantIds?.length || 1} people
                      </div>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full glass-flat text-[#30D158] shrink-0">
                    Outing
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeCalendarSync;
