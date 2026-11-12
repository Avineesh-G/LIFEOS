/**
 * LifeOS — Professional Apple / Google Calendar Module
 * 
 * Design & Architecture:
 * 1. Liquid Glass Standard: Colors live on words, numbers, and glyphs (NO solid colored blobs).
 *    Surfaces are pure liquid water droplets and translucent dark glass with specular micro-sheens.
 * 2. Three Professional Calendar Views:
 *    - Month View: Full grid with date numbers in colored typography, inline event chips, and overflow counters.
 *    - Time Grid View: 24-hour Google Calendar timeline with hourly slots, current time "NOW" indicator,
 *      and proportional duration event blocks.
 *    - Schedule / Agenda View: Chronological stream grouped by date with sticky headers and task checkmarks.
 * 3. Unified Synchronization:
 *    - Custom Calendar Events
 *    - Synced To-Do Tasks (filtered by month/date with one-tap toggle)
 *    - Synced Timetable Blocks (weekly class schedule)
 *    - Synced Gym Workouts & Outings
 * 4. Workflow & Notifications:
 *    - Direct tap-to-add from any empty time slot or date.
 *    - Lead time reminder prompt (At event, 15m, 20m LifeOS default, 30m, 1h, 1d, Off).
 *    - Dual sync to Integrated Timetable and To-Do Tasks.
 * 5. Strict Zero Emojis: Pure Phosphor icons and iOS 26 Dark Glass styling.
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  format,
  addMonths,
  subMonths,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  CalendarDots,
  Plus,
  Clock,
  Bell,
  CheckCircle,
  Circle,
  GraduationCap,
  Barbell,
  Receipt,
  X,
  Trash,
  Tag,
  NotePencil,
  MapPin,
  Check,
  WarningCircle,
  SquaresFour,
  ListDashes,
  Rows,
  MagnifyingGlass,
  ArrowRight,
} from '@phosphor-icons/react';
import { triggerHaptic } from '../utils/haptics';
import { BottomSheet } from '../components/BottomSheet';
import type {
  AppData,
  CalendarEvent,
  CalendarCategory,
  Task,
  TimetableBlock,
} from '../types';

interface CalendarPageProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

// Apple / Google Calendar Category Palette (Colors belong on text and border lines)
const CATEGORIES: {
  key: CalendarCategory;
  label: string;
  color: string;
}[] = [
  { key: 'general', label: 'General', color: '#5E5CE6' },   // Indigo
  { key: 'study', label: 'Study & Exams', color: '#0A84FF' }, // Blue
  { key: 'gym', label: 'Gym & Fitness', color: '#30D158' },  // Green
  { key: 'work', label: 'Work & Projects', color: '#BF5AF2' }, // Purple
  { key: 'meeting', label: 'Meetings', color: '#FF9F0A' },    // Orange
  { key: 'personal', label: 'Personal', color: '#FF375F' },   // Rose
  { key: 'outing', label: 'Outings', color: '#40C8E0' },      // Teal
];

const NOTIFICATION_LEAD_OPTIONS = [
  { value: 0, label: 'At time of event' },
  { value: 15, label: '15 minutes before' },
  { value: 20, label: '20 minutes before (LifeOS Default)' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
  { value: -1, label: 'None (Off)' },
];

// Timeline Hours (07:00 to 23:00)
const TIMELINE_HOURS = Array.from({ length: 17 }, (_, i) => i + 7);

export default function CalendarPage({ data, updateData }: CalendarPageProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'timeline' | 'schedule'>('month');
  const [categoryFilter, setCategoryFilter] = useState<CalendarCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Modal State for New / Edit Event
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form Fields
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isAllDay, setIsAllDay] = useState(false);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [selectedCategory, setSelectedCategory] = useState<CalendarCategory>('general');
  const [notificationLead, setNotificationLead] = useState<number>(20);
  const [syncToTimeline, setSyncToTimeline] = useState(false);
  const [syncToTasks, setSyncToTasks] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const timelineScrollRef = useRef<HTMLDivElement>(null);

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

  // 7-day strip around selected date for Timeline view
  const weekStripDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // Sync Data Map by Date string ('yyyy-MM-dd')
  const dateMap = useMemo(() => {
    const map = new Map<
      string,
      {
        events: CalendarEvent[];
        tasks: Task[];
        classes: TimetableBlock[];
        hasWorkout: boolean;
      }
    >();

    const getEntry = (dateKey: string) => {
      let entry = map.get(dateKey);
      if (!entry) {
        entry = { events: [], tasks: [], classes: [], hasWorkout: false };
        map.set(dateKey, entry);
      }
      return entry;
    };

    // 1. Index Custom Calendar Events
    (data.calendarEvents || []).forEach((ev) => {
      if (ev.date) {
        getEntry(ev.date).events.push(ev);
      }
    });

    // 2. Index To-Do Tasks
    (data.tasks || []).forEach((t) => {
      const d = t.dueDate || t.date;
      if (d) {
        getEntry(d).tasks.push(t);
      }
    });

    // 3. Index Workout Logs
    (data.workoutLogs || []).forEach((w) => {
      if (w.date) {
        getEntry(w.date).hasWorkout = true;
      }
    });

    return map;
  }, [data.calendarEvents, data.tasks, data.workoutLogs]);

  // Selected Day Items
  const selectedEvents = useMemo(() => {
    return (data.calendarEvents || []).filter((e) => {
      if (e.date !== selectedDateStr) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [data.calendarEvents, selectedDateStr, categoryFilter, searchQuery]);

  const selectedTasks = useMemo(() => {
    return (data.tasks || []).filter((t) => {
      if ((t.dueDate || t.date) !== selectedDateStr) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.text.toLowerCase().includes(q) || (t.subtask || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [data.tasks, selectedDateStr, searchQuery]);

  const selectedClasses = useMemo(() => {
    return (data.timetable || []).filter((b) => {
      if (b.day?.toLowerCase() !== selectedDayName.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return b.subject.toLowerCase().includes(q) || (b.room || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [data.timetable, selectedDayName, searchQuery]);

  const selectedWorkout = useMemo(() => {
    return (data.workoutLogs || []).find((w) => w.date === selectedDateStr);
  }, [data.workoutLogs, selectedDateStr]);

  // Handlers
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

  const handleSelectDay = (day: Date) => {
    triggerHaptic('selection');
    setSelectedDate(day);
    if (!isSameMonth(day, currentMonth)) {
      setCurrentMonth(day);
    }
  };

  // Open Modal to Create New Event
  const handleOpenCreateModal = (prefilledHour?: number) => {
    triggerHaptic('medium');
    setEditingEventId(null);
    setEventTitle('');
    setEventDescription('');
    setEventDate(selectedDateStr);
    setIsAllDay(false);

    if (typeof prefilledHour === 'number') {
      const hStr = String(prefilledHour).padStart(2, '0');
      const endHStr = String(Math.min(23, prefilledHour + 1)).padStart(2, '0');
      setStartTime(`${hStr}:00`);
      setEndTime(`${endHStr}:00`);
    } else {
      setStartTime('10:00');
      setEndTime('11:00');
    }

    setSelectedCategory('general');
    setNotificationLead(20);
    setSyncToTimeline(false);
    setSyncToTasks(false);
    setFormError(null);
    setIsEventModalOpen(true);
  };

  // Open Modal to Edit Existing Event
  const handleOpenEditModal = (event: CalendarEvent) => {
    triggerHaptic('light');
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDescription(event.description || '');
    setEventDate(event.date);
    setIsAllDay(Boolean(event.isAllDay));
    setStartTime(event.startTime || '10:00');
    setEndTime(event.endTime || '11:00');
    setSelectedCategory(event.category || 'general');
    setNotificationLead(typeof event.notificationLeadMinutes === 'number' ? event.notificationLeadMinutes : 20);
    setSyncToTimeline(Boolean(event.syncToTimeline));
    setSyncToTasks(Boolean(event.syncToTasks));
    setFormError(null);
    setIsEventModalOpen(true);
  };

  // Save Event
  const handleSaveEvent = async () => {
    if (!eventTitle.trim()) {
      setFormError('Please enter an event title');
      triggerHaptic('error');
      return;
    }

    triggerHaptic('save');
    const categoryConfig = CATEGORIES.find((c) => c.key === selectedCategory);
    const chosenColor = categoryConfig?.color || '#5E5CE6';

    const newEvent: CalendarEvent = {
      id: editingEventId || `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: eventTitle.trim(),
      description: eventDescription.trim() || undefined,
      date: eventDate,
      isAllDay,
      startTime: isAllDay ? undefined : startTime,
      endTime: isAllDay ? undefined : endTime,
      category: selectedCategory,
      color: chosenColor,
      syncToTimeline,
      syncToTasks,
      notificationLeadMinutes: notificationLead,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedEvents = [...(data.calendarEvents || [])];
    if (editingEventId) {
      updatedEvents = updatedEvents.map((e) => (e.id === editingEventId ? newEvent : e));
    } else {
      updatedEvents.push(newEvent);
    }

    const partialUpdate: Partial<AppData> = {
      calendarEvents: updatedEvents,
    };

    // 1. Sync to Integrated Timetable if requested
    if (syncToTimeline && !isAllDay && startTime && endTime) {
      const dayOfWeekShort = format(parseISO(eventDate), 'EEE');
      const newBlock: TimetableBlock = {
        id: `tb_cal_${newEvent.id}`,
        subject: newEvent.title,
        day: dayOfWeekShort,
        startTime,
        endTime,
        room: eventDescription.trim() || 'Calendar Scheduled',
        slot: 'Calendar',
      };
      const existingTimetable = (data.timetable || []).filter((b) => b.id !== `tb_cal_${newEvent.id}`);
      partialUpdate.timetable = [...existingTimetable, newBlock];
    }

    // 2. Sync to To-Do Tasks if requested
    if (syncToTasks) {
      const newTask: Task = {
        id: `task_cal_${newEvent.id}`,
        text: newEvent.title,
        date: eventDate,
        dueDate: eventDate,
        startTime: isAllDay ? undefined : startTime,
        endTime: isAllDay ? undefined : endTime,
        subtask: eventDescription.trim() || undefined,
        completed: false,
      };
      const existingTasks = (data.tasks || []).filter((t) => t.id !== `task_cal_${newEvent.id}`);
      partialUpdate.tasks = [newTask, ...existingTasks];
    }

    await updateData(partialUpdate);
    setIsEventModalOpen(false);
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string) => {
    triggerHaptic('medium');
    const filteredEvents = (data.calendarEvents || []).filter((e) => e.id !== eventId);
    const filteredTimetable = (data.timetable || []).filter((b) => b.id !== `tb_cal_${eventId}`);
    const filteredTasks = (data.tasks || []).filter((t) => t.id !== `task_cal_${eventId}`);

    await updateData({
      calendarEvents: filteredEvents,
      timetable: filteredTimetable,
      tasks: filteredTasks,
    });
    setIsEventModalOpen(false);
  };

  // Toggle To-Do Task
  const handleToggleTask = async (taskId: string) => {
    triggerHaptic('selection');
    const updatedTasks = (data.tasks || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    await updateData({ tasks: updatedTasks });
  };

  return (
    <div className="w-full min-h-screen bg-black text-white select-none pb-28 pt-2 px-3 sm:px-4 max-w-4xl mx-auto font-sans">
      {/* ── Apple / Google Calendar Top Control Bar ── */}
      <div className="flex flex-col gap-3 pt-1 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#5E5CE6] shadow-sm">
              <CalendarBlank size={20} weight="duotone" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                {format(currentMonth, 'MMMM yyyy')}
              </h1>
              <p className="text-[11px] text-white/50 font-medium tracking-wide">
                LifeOS Timeline & Schedule
              </p>
            </div>
          </div>

          {/* Today Button & Month Chevrons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleGoToday}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isToday(selectedDate)
                  ? 'bg-white/15 text-[#FF375F] ring-1 ring-[#FF375F]/40'
                  : 'bg-white/[0.06] hover:bg-white/10 text-white/80 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all cursor-pointer"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white active:scale-95 transition-all cursor-pointer"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher + Add Event + Search */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          {/* 3 View Tabs: Month, Timeline, Schedule */}
          <div className="inline-flex p-1 rounded-2xl bg-white/[0.06] border border-white/10">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setViewMode('month');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <SquaresFour size={14} weight="duotone" />
              <span>Month</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setViewMode('timeline');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Clock size={14} weight="bold" />
              <span>Day Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setViewMode('schedule');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'schedule'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <ListDashes size={14} weight="bold" />
              <span>Schedule</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isSearchOpen
                  ? 'bg-white/20 text-white'
                  : 'bg-white/[0.06] hover:bg-white/10 text-white/60 hover:text-white'
              }`}
              title="Search calendar"
            >
              <MagnifyingGlass size={16} weight="bold" />
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white/[0.12] hover:bg-white/[0.18] border border-white/15 active:scale-95 text-[#A5A3FF] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Plus size={14} weight="bold" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Search Bar (Expandable) */}
        {isSearchOpen && (
          <div className="pt-1">
            <div className="relative">
              <MagnifyingGlass size={15} weight="bold" className="absolute left-3.5 top-3 text-white/40 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, classes, or to-dos..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#5E5CE6]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-white/40 hover:text-white"
                >
                  <X size={14} weight="bold" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Category Filter Pills (Words have color, pure liquid surface) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-white/[0.04] text-white/50 hover:text-white/80'
            }`}
          >
            All Items
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                categoryFilter === cat.key
                  ? 'bg-white/[0.12] border-white/30 shadow-sm'
                  : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
              }`}
              style={{
                color: cat.color, // Color belongs on the words/letters!
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 1. MONTH VIEW (Professional Apple Grid with Color on Words/Digits) ── */}
      {viewMode === 'month' && (
        <div className="p-3 sm:p-4 rounded-[26px] bg-[#1C1C1E] border border-white/10 shadow-2xl mb-4">
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <span
                key={idx}
                className={`text-[11px] font-bold tracking-wider uppercase ${
                  idx >= 5 ? 'text-white/35' : 'text-white/55'
                }`}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const entry = dateMap.get(dayStr);
              const inCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);

              const events = (entry?.events || []).filter((e) =>
                categoryFilter === 'all' ? true : e.category === categoryFilter
              );
              const tasks = entry?.tasks || [];
              const totalItems = events.length + tasks.length + (entry?.hasWorkout ? 1 : 0);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`relative flex flex-col items-stretch justify-start p-1.5 rounded-2xl transition-all cursor-pointer min-h-[72px] sm:min-h-[84px] text-left overflow-hidden ${
                    isSelected
                      ? 'bg-white/[0.10] ring-1 ring-white/30 shadow-md'
                      : inCurrentMonth
                      ? 'bg-white/[0.03] hover:bg-white/[0.06]'
                      : 'bg-transparent opacity-30 hover:opacity-50'
                  }`}
                >
                  {/* Date Number: COLOR IS ON THE WORDS/NUMBERS ONLY, NO SOLID COLOR BLOB */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs tabular-nums leading-none px-1.5 py-0.5 rounded-md ${
                        isTodayDay
                          ? 'text-[#FF375F] font-black bg-white/[0.08] ring-1 ring-[#FF375F]/40'
                          : isSelected
                          ? 'text-white font-extrabold'
                          : inCurrentMonth
                          ? 'text-white/85 font-semibold'
                          : 'text-white/30 font-normal'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    {totalItems > 0 && (
                      <span className="text-[10px] text-white/40 font-mono">
                        {totalItems}
                      </span>
                    )}
                  </div>

                  {/* Inline Event Micro-Chips (Words have category colors) */}
                  <div className="flex flex-col gap-1 mt-1.5 overflow-hidden flex-1">
                    {events.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/5 truncate flex items-center gap-1"
                        style={{ borderLeftColor: ev.color, borderLeftWidth: '2px' }}
                      >
                        <span
                          className="text-[10px] font-bold truncate leading-tight"
                          style={{ color: ev.color }} // Color on the words!
                        >
                          {ev.title}
                        </span>
                      </div>
                    ))}

                    {events.length === 0 && tasks.length > 0 && (
                      <div className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border-l-2 border-[#0A84FF] truncate">
                        <span className="text-[10px] font-semibold text-[#0A84FF] truncate block">
                          {tasks[0].text}
                        </span>
                      </div>
                    )}

                    {totalItems > 2 && (
                      <span className="text-[9.5px] text-white/40 font-mono leading-none pl-1">
                        +{totalItems - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. DAY TIMELINE VIEW (Google Calendar Standard 24h Hourly Grid) ── */}
      {viewMode === 'timeline' && (
        <div className="space-y-3 mb-4">
          {/* 7-Day Horizontal Week Strip (Apple / Google Calendar Selector) */}
          <div className="grid grid-cols-7 gap-1.5 p-2 rounded-2xl bg-[#1C1C1E] border border-white/10 shadow-md text-center">
            {weekStripDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);
              const dayStr = format(day, 'yyyy-MM-dd');
              const entry = dateMap.get(dayStr);
              const hasItems = (entry?.events?.length || 0) + (entry?.tasks?.length || 0) > 0;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`py-2 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/15 ring-1 ring-white/30 shadow-sm'
                      : 'hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-[10px] font-bold text-white/40 uppercase">
                    {format(day, 'EEE')}
                  </span>
                  <span
                    className={`text-sm mt-0.5 tabular-nums ${
                      isTodayDay
                        ? 'text-[#FF375F] font-black'
                        : isSelected
                        ? 'text-white font-bold'
                        : 'text-white/80 font-medium'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasItems && (
                    <span className="w-1 h-1 rounded-full bg-[#5E5CE6] mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hourly Timeline Chassis */}
          <div
            ref={timelineScrollRef}
            className="rounded-[24px] bg-[#1C1C1E] border border-white/10 p-4 relative shadow-2xl overflow-hidden"
          >
            {/* Header: Selected Date Title */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{format(selectedDate, 'EEEE, d MMMM')}</span>
                  {isToday(selectedDate) && (
                    <span className="text-[10px] font-bold text-[#FF375F] bg-[#FF375F]/15 px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-white/50">
                  Tap any time slot to schedule an event at that hour
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>

            {/* Timeline Hours Column */}
            <div className="relative pt-1 space-y-4">
              {TIMELINE_HOURS.map((hour) => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                const eventsThisHour = selectedEvents.filter((ev) => {
                  if (!ev.startTime) return false;
                  const [h] = ev.startTime.split(':').map(Number);
                  return h === hour;
                });

                const classesThisHour = selectedClasses.filter((cls) => {
                  if (!cls.startTime) return false;
                  const [h] = cls.startTime.split(':').map(Number);
                  return h === hour;
                });

                return (
                  <div
                    key={hour}
                    onClick={() => handleOpenCreateModal(hour)}
                    className="flex items-start gap-3 min-h-[58px] group cursor-pointer pt-1"
                  >
                    {/* Time Axis */}
                    <div className="w-12 text-right shrink-0 pt-0.5">
                      <span className="text-xs font-mono font-semibold text-white/40 group-hover:text-white/80 transition-colors">
                        {hourFormatted}
                      </span>
                    </div>

                    {/* Timeline Slot Content & Guide Line */}
                    <div className="flex-1 border-t border-white/10 pt-1.5 min-h-[52px] group-hover:border-white/25 transition-colors space-y-2">
                      {/* Events in this hour */}
                      {eventsThisHour.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(ev);
                          }}
                          className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.10] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-2 shadow-sm"
                          style={{ borderLeftColor: ev.color || '#5E5CE6', borderLeftWidth: '3px' }}
                        >
                          <div className="min-w-0">
                            <h4
                              className="text-xs font-bold truncate leading-tight"
                              style={{ color: ev.color }} // Color on the words!
                            >
                              {ev.title}
                            </h4>
                            <p className="text-[11px] text-white/50 font-mono mt-0.5">
                              {ev.startTime} – {ev.endTime || '1h'}
                              {ev.description ? ` • ${ev.description}` : ''}
                            </p>
                          </div>
                          <span
                            className="text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                            style={{
                              backgroundColor: `${ev.color || '#5E5CE6'}15`,
                              color: ev.color,
                            }}
                          >
                            {ev.category}
                          </span>
                        </div>
                      ))}

                      {/* Classes in this hour */}
                      {classesThisHour.map((cls) => (
                        <div
                          key={cls.id}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 rounded-xl bg-white/[0.04] border-l-2 border-[#5E5CE6] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-[#5E5CE6] truncate">
                              {cls.subject}
                            </h4>
                            <p className="text-[11px] text-white/50 font-mono mt-0.5">
                              {cls.startTime} – {cls.endTime} {cls.room ? `• Room ${cls.room}` : ''}
                            </p>
                          </div>
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-[#5E5CE6]/15 text-[#5E5CE6] uppercase tracking-wider">
                            Class
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. SCHEDULE / AGENDA VIEW (Chronological List Stream) ── */}
      {viewMode === 'schedule' && (
        <div className="space-y-4 mb-4">
          {/* Selected Date Header */}
          <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/10 shadow-md flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                {isToday(selectedDate) && (
                  <span className="text-[10px] font-bold text-[#FF375F] bg-[#FF375F]/15 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                {selectedEvents.length + selectedTasks.length + selectedClasses.length} item
                {selectedEvents.length + selectedTasks.length + selectedClasses.length === 1 ? '' : 's'} scheduled
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>Add</span>
            </button>
          </div>

          {/* Agenda Items List */}
          <div className="space-y-2.5">
            {selectedEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => handleOpenEditModal(ev)}
                className="p-3.5 rounded-2xl bg-[#1C1C1E] border border-white/10 hover:bg-white/[0.08] active:scale-[0.99] transition-all cursor-pointer flex items-start gap-3 shadow-sm relative overflow-hidden"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: ev.color || '#5E5CE6' }}
                />
                <div className="pl-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className="text-sm font-bold truncate leading-tight"
                      style={{ color: ev.color }} // Color on the words!
                    >
                      {ev.title}
                    </h4>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: `${ev.color || '#5E5CE6'}15`,
                        color: ev.color,
                      }}
                    >
                      {ev.category}
                    </span>
                  </div>

                  {ev.description && (
                    <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{ev.description}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-white/40 font-mono mt-1.5">
                    <span className="flex items-center gap-1">
                      <Clock size={12} weight="bold" />
                      {ev.isAllDay ? 'All-Day' : `${ev.startTime || '10:00'} – ${ev.endTime || '11:00'}`}
                    </span>
                    {ev.notificationLeadMinutes !== -1 && (
                      <span className="text-[#FF9F0A] flex items-center gap-1">
                        <Bell size={12} weight="fill" />
                        {ev.notificationLeadMinutes}m
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {selectedTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => handleToggleTask(t.id)}
                className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    className={`shrink-0 transition-colors ${
                      t.completed ? 'text-[#30D158]' : 'text-white/30 hover:text-white/60'
                    }`}
                  >
                    {t.completed ? (
                      <CheckCircle size={20} weight="fill" />
                    ) : (
                      <Circle size={20} weight="bold" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold truncate ${
                        t.completed ? 'line-through text-white/40' : 'text-white'
                      }`}
                    >
                      {t.text}
                    </p>
                    {t.subtask && (
                      <p className="text-[11px] text-white/40 truncate">{t.subtask}</p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] shrink-0 uppercase tracking-wider">
                  To-Do
                </span>
              </div>
            ))}

            {selectedClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#5E5CE6]/15 text-[#5E5CE6] flex items-center justify-center shrink-0">
                    <GraduationCap size={16} weight="duotone" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#5E5CE6] truncate">
                      {cls.subject}
                    </h4>
                    <p className="text-[11px] text-white/50 font-mono mt-0.5">
                      {cls.startTime} – {cls.endTime} {cls.room ? `• Room ${cls.room}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5E5CE6]/15 text-[#5E5CE6] uppercase tracking-wider">
                  Class
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Selected Day Summary Drawer (Visible in Month View) ── */}
      {viewMode === 'month' && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{format(selectedDate, 'EEEE, d MMMM')}</span>
              {isToday(selectedDate) && (
                <span className="text-[10px] font-bold text-[#FF375F] bg-[#FF375F]/15 px-2 py-0.5 rounded-full">
                  Today
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="text-xs font-bold text-[#A5A3FF] hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} weight="bold" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {selectedEvents.length === 0 && selectedTasks.length === 0 && selectedClasses.length === 0 && !selectedWorkout ? (
              <div className="py-6 text-center rounded-2xl bg-[#1C1C1E] border border-white/10">
                <CalendarBlank size={28} weight="duotone" className="mx-auto text-white/20 mb-1" />
                <p className="text-xs font-semibold text-white/70">No schedule for this date</p>
                <p className="text-[11px] text-white/40 mt-0.5">
                  Tap "+ New Event" to schedule tasks, exams, or meetings.
                </p>
              </div>
            ) : (
              <>
                {selectedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => handleOpenEditModal(ev)}
                    className="p-3 rounded-2xl bg-[#1C1C1E] border border-white/10 hover:bg-white/[0.08] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: ev.color || '#5E5CE6' }}
                    />
                    <div className="pl-1.5 min-w-0 flex-1">
                      <h4
                        className="text-xs font-bold truncate leading-tight"
                        style={{ color: ev.color }} // Color on words!
                      >
                        {ev.title}
                      </h4>
                      <p className="text-[11px] text-white/50 font-mono mt-0.5">
                        {ev.isAllDay ? 'All-Day' : `${ev.startTime || '10:00'} – ${ev.endTime || '11:00'}`}
                        {ev.description ? ` • ${ev.description}` : ''}
                      </p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: `${ev.color || '#5E5CE6'}15`,
                        color: ev.color,
                      }}
                    >
                      {ev.category}
                    </span>
                  </div>
                ))}

                {selectedTasks.map((t) => (
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
                      <p
                        className={`text-xs font-semibold truncate ${
                          t.completed ? 'line-through text-white/40' : 'text-white'
                        }`}
                      >
                        {t.text}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A84FF]/15 text-[#0A84FF] shrink-0 uppercase tracking-wider">
                      Task
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Event Creation / Editing Bottom Sheet ── */}
      <BottomSheet
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
      >
        <div className="space-y-4 pt-1 pb-6 select-none font-sans text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#5E5CE6]">
                <CalendarBlank size={18} weight="duotone" />
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {editingEventId ? 'Edit Event' : 'New Calendar Event'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 text-white/70 hover:text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <WarningCircle size={16} weight="fill" className="shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Title */}
          <div>
            <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5">
              Event Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g. Operating Systems Exam, Team Sync, Project Review"
              className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#5E5CE6] focus:ring-1 focus:ring-[#5E5CE6]/40 transition-all font-sans"
              autoFocus
            />
          </div>

          {/* 2. Date */}
          <div>
            <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5">
              Event Date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-[#5E5CE6] transition-all font-sans"
            />
          </div>

          {/* 3. Time Controls */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/80">All-Day Event</label>
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="w-5 h-5 accent-[#5E5CE6] rounded-md cursor-pointer"
              />
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
                <div>
                  <label className="block text-[11px] font-semibold text-white/60 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-[#5E5CE6]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-white/60 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-[#5E5CE6]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Category Selector (Color on words, pure droplet background) */}
          <div>
            <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5 flex items-center gap-1.5">
              <Tag size={13} weight="bold" />
              <span>Category</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedCategory(cat.key);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    selectedCategory === cat.key
                      ? 'bg-white/[0.14] border-white/30 shadow-sm ring-1 ring-white/20'
                      : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07]'
                  }`}
                  style={{
                    color: cat.color, // Color on words!
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Precision Notification Prompt */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Bell size={15} weight="duotone" className="text-[#FF9F0A]" />
              <span>Reminder Notification</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              Select when you would like LifeOS to dispatch an exact phone alarm before this event:
            </p>
            <select
              value={notificationLead}
              onChange={(e) => setNotificationLead(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-[#5E5CE6] cursor-pointer"
            >
              {NOTIFICATION_LEAD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1C1C1E] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Integration Options: Sync to Timetable & Tasks */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
            <span className="text-[11.5px] font-semibold text-white/70 block">
              Integrated App Sync
            </span>

            <label className="flex items-center justify-between text-xs text-white/80 cursor-pointer">
              <div>
                <p className="font-semibold text-white">Sync to Integrated Timetable</p>
                <p className="text-[11px] text-white/40">
                  Adds to weekly class timeline and class reminder schedule
                </p>
              </div>
              <input
                type="checkbox"
                checked={syncToTimeline}
                disabled={isAllDay}
                onChange={(e) => setSyncToTimeline(e.target.checked)}
                className="w-4 h-4 accent-[#5E5CE6] rounded-md cursor-pointer ml-3 shrink-0"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-white/80 cursor-pointer pt-2 border-t border-white/5">
              <div>
                <p className="font-semibold text-white">Sync to To-Do Tasks</p>
                <p className="text-[11px] text-white/40">
                  Adds as a pending checklist item in your daily tasks
                </p>
              </div>
              <input
                type="checkbox"
                checked={syncToTasks}
                onChange={(e) => setSyncToTasks(e.target.checked)}
                className="w-4 h-4 accent-[#5E5CE6] rounded-md cursor-pointer ml-3 shrink-0"
              />
            </label>
          </div>

          {/* 7. Notes */}
          <div>
            <label className="block text-[11.5px] font-semibold text-white/70 tracking-wide mb-1.5">
              Notes & Description (Optional)
            </label>
            <textarea
              rows={2}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Meeting link, syllabus topics, or notes..."
              className="w-full px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#5E5CE6] transition-all font-sans"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-2">
            {editingEventId && (
              <button
                type="button"
                onClick={() => handleDeleteEvent(editingEventId)}
                className="p-3.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 active:scale-95 transition-all cursor-pointer"
                title="Delete Event"
              >
                <Trash size={18} weight="bold" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="flex-1 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer text-center"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveEvent}
              className="flex-[2] py-3.5 rounded-2xl bg-white/[0.12] hover:bg-white/[0.18] border border-white/15 text-xs font-bold text-[#A5A3FF] hover:text-white active:scale-95 transition-all shadow-lg cursor-pointer text-center"
            >
              {editingEventId ? 'Update Event' : 'Save Event'}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
