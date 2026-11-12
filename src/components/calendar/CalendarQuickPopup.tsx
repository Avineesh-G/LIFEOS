/**
 * LifeOS — Calendar Quick Floating Popup Window
 * 
 * Floating popup triggered from the top-right header capsule (replacing bell icon).
 * Provides fast access to today's schedule, timeline events, quick event add,
 * and navigation to the full professional Calendar interface.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday } from 'date-fns';
import {
  CalendarBlank,
  Plus,
  Clock,
  ArrowRight,
  CheckCircle,
  Circle,
  GraduationCap,
  Barbell,
  Bell,
  X,
} from '@phosphor-icons/react';
import FloatingPopup from '../glass/FloatingPopup';
import { triggerHaptic } from '../../utils/haptics';
import type { AppData, CalendarEvent, Task, TimetableBlock } from '../../types';

interface CalendarQuickPopupProps {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

export default function CalendarQuickPopup({
  isOpen,
  onClose,
  data,
  updateData,
}: CalendarQuickPopupProps) {
  const navigate = useNavigate();
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTime, setQuickTime] = useState('11:00');
  const [quickLead, setQuickLead] = useState<number>(20);
  const [isAdding, setIsAdding] = useState(false);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayDayName = useMemo(() => format(new Date(), 'EEEE'), []);

  // Filter today's items
  const todayEvents = useMemo(() => {
    return (data.calendarEvents || []).filter((e) => e.date === todayStr);
  }, [data.calendarEvents, todayStr]);

  const todayTasks = useMemo(() => {
    return (data.tasks || []).filter((t) => (t.dueDate || t.date) === todayStr);
  }, [data.tasks, todayStr]);

  const todayClasses = useMemo(() => {
    return (data.timetable || []).filter(
      (b) => b.day?.toLowerCase() === todayDayName.toLowerCase()
    );
  }, [data.timetable, todayDayName]);

  const todayWorkout = useMemo(() => {
    return (data.workoutLogs || []).find((w) => w.date === todayStr);
  }, [data.workoutLogs, todayStr]);

  const totalTodayItems =
    todayEvents.length + todayTasks.length + todayClasses.length + (todayWorkout ? 1 : 0);

  // Quick Task/Event Add
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    triggerHaptic('save');

    const newEvent: CalendarEvent = {
      id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: quickTitle.trim(),
      date: todayStr,
      startTime: quickTime,
      category: 'general',
      color: '#5E5CE6',
      notificationLeadMinutes: quickLead,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...(data.calendarEvents || []), newEvent];
    await updateData({ calendarEvents: updated });
    setQuickTitle('');
    setIsAdding(false);
  };

  // Toggle Task Completion
  const handleToggleTask = async (taskId: string) => {
    triggerHaptic('selection');
    const updated = (data.tasks || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    await updateData({ tasks: updated });
  };

  const handleOpenFullCalendar = () => {
    triggerHaptic('light');
    onClose();
    navigate('/calendar');
  };

  return (
    <FloatingPopup
      isOpen={isOpen}
      onClose={onClose}
      title="Today's Schedule"
      subtitle={format(new Date(), 'EEEE, MMMM d')}
      icon={<CalendarBlank size={18} weight="duotone" className="text-[#5E5CE6]" />}
      maxWidth="max-w-md"
    >
      <div className="space-y-3.5 select-none text-left">
        {/* Quick Summary Pill & Open Full Link */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/90">
              {totalTodayItems} item{totalTodayItems === 1 ? '' : 's'} today
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenFullCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5E5CE6]/15 hover:bg-[#5E5CE6]/25 border border-[#5E5CE6]/30 text-[#A5A3FF] hover:text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
          >
            <span>Full Calendar</span>
            <ArrowRight size={13} weight="bold" />
          </button>
        </div>

        {/* Quick Add Event Form / Button */}
        {isAdding ? (
          <form
            onSubmit={handleQuickAdd}
            className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wide">
                Quick Add Event
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Event title..."
              className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#5E5CE6]"
            />
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={quickTime}
                onChange={(e) => setQuickTime(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white [color-scheme:dark] focus:outline-none"
              />
              <select
                value={quickLead}
                onChange={(e) => setQuickLead(Number(e.target.value))}
                className="px-2 py-1.5 rounded-xl bg-white/[0.06] border border-white/10 text-[11px] text-white/80 [color-scheme:dark] focus:outline-none"
                title="Reminder lead time"
              >
                <option value={0} className="bg-[#1C1C1E]">At event</option>
                <option value={15} className="bg-[#1C1C1E]">15m before</option>
                <option value={20} className="bg-[#1C1C1E]">20m before</option>
                <option value={30} className="bg-[#1C1C1E]">30m before</option>
                <option value={60} className="bg-[#1C1C1E]">1h before</option>
                <option value={-1} className="bg-[#1C1C1E]">Off</option>
              </select>
              <button
                type="submit"
                className="flex-1 py-1.5 rounded-xl bg-[#5E5CE6] text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsAdding(true);
            }}
            className="w-full py-2 px-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 flex items-center justify-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <Plus size={14} weight="bold" className="text-[#5E5CE6]" />
            <span>Add Event for Today</span>
          </button>
        )}

        {/* Items Stream */}
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5 scrollbar-none">
          {totalTodayItems === 0 && !isAdding && (
            <div className="py-8 text-center rounded-2xl bg-white/[0.02] border border-white/5">
              <CalendarBlank size={28} weight="duotone" className="mx-auto text-white/20 mb-1.5" />
              <p className="text-xs font-semibold text-white/60">No items scheduled for today</p>
              <p className="text-[11px] text-white/40 mt-0.5">
                Tap above to quickly schedule an event or task.
              </p>
            </div>
          )}

          {/* 1. Custom Events */}
          {todayEvents.map((ev) => (
            <div
              key={ev.id}
              onClick={handleOpenFullCalendar}
              className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: ev.color || '#5E5CE6' }}
              />
              <div className="pl-1.5 min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-white truncate">{ev.title}</h4>
                <div className="flex items-center gap-2 text-[11px] text-white/40 font-mono mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {ev.isAllDay ? 'All-Day' : `${ev.startTime || '10:00'} – ${ev.endTime || '11:00'}`}
                  </span>
                  {ev.notificationLeadMinutes !== -1 && (
                    <Bell size={11} weight="fill" className="text-[#FF9F0A]" />
                  )}
                </div>
              </div>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                style={{
                  backgroundColor: `${ev.color || '#5E5CE6'}15`,
                  color: ev.color || '#5E5CE6',
                }}
              >
                {ev.category}
              </span>
            </div>
          ))}

          {/* 2. Tasks */}
          {todayTasks.map((t) => (
            <div
              key={t.id}
              onClick={() => handleToggleTask(t.id)}
              className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  className={`shrink-0 transition-colors ${
                    t.completed ? 'text-[#30D158]' : 'text-white/30 hover:text-white/60'
                  }`}
                >
                  {t.completed ? (
                    <CheckCircle size={18} weight="fill" />
                  ) : (
                    <Circle size={18} weight="bold" />
                  )}
                </button>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-medium truncate ${
                      t.completed ? 'line-through text-white/40' : 'text-white'
                    }`}
                  >
                    {t.text}
                  </p>
                  {t.startTime && (
                    <p className="text-[10.5px] text-white/40 font-mono">{t.startTime}</p>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] shrink-0 uppercase tracking-wider">
                Task
              </span>
            </div>
          ))}

          {/* 3. Timetable Classes */}
          {todayClasses.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#5E5CE6]/15 text-[#5E5CE6] flex items-center justify-center shrink-0">
                  <GraduationCap size={15} weight="duotone" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">{c.subject}</h4>
                  <p className="text-[11px] text-white/40 font-mono mt-0.5">
                    {c.startTime} – {c.endTime} {c.room ? `• Room ${c.room}` : ''}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5E5CE6]/15 text-[#5E5CE6] shrink-0 uppercase tracking-wider">
                Class
              </span>
            </div>
          ))}

          {/* 4. Workout */}
          {todayWorkout && (
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#30D158]/15 text-[#30D158] flex items-center justify-center shrink-0">
                  <Barbell size={15} weight="duotone" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-white truncate">
                    {todayWorkout.type} Workout
                  </h4>
                  <p className="text-[11px] text-white/40 mt-0.5">Completed</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#30D158]/15 text-[#30D158] shrink-0 uppercase tracking-wider">
                Done
              </span>
            </div>
          )}
        </div>
      </div>
    </FloatingPopup>
  );
}

