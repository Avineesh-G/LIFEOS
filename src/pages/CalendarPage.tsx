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
import { useNavigate } from 'react-router-dom';
import { navigateBack } from '../utils/backNavigation';
import { Sheet } from '../ui';
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
  { key: 'personal', label: 'Personal', color: '#64D2FF' },   // Cyan / Sky Blue (Zero Red)
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
  const navigate = useNavigate();
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
    <div
      className="w-full text-white selection:bg-[#5E5CE6]/30 pb-28 sm:pb-32 select-none font-sans"
      style={{
        paddingTop: 'calc(max(var(--sat, 0px), env(safe-area-inset-top, 0px), 52px) + 12px)',
      }}
    >
      {/* ── 1. Compact Liquid Glass Month & Navigation Header ── */}
      <div className="glass-card px-4 py-3 rounded-[24px] mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              navigateBack(navigate);
            }}
            className="w-8 h-8 rounded-full glass-tile flex items-center justify-center hover:text-white active:scale-90 transition-transform cursor-pointer touch-manipulation shrink-0"
            style={{ color: 'var(--app-accent-text, #64D2FF)' }}
            aria-label="Back"
            title="Back"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <div
            className="w-8 h-8 rounded-xl glass-tile flex items-center justify-center shadow-sm shrink-0"
            style={{ color: 'var(--app-accent-text, #64D2FF)' }}
          >
            <CalendarBlank size={18} weight="duotone" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-white leading-tight truncate">
              {format(currentMonth, 'MMMM yyyy')}
            </h1>
            <p className="text-[11px] text-white/60 font-medium tracking-wide leading-none mt-0.5">
              Timeline & Schedule
            </p>
          </div>
        </div>

        {/* Today Button & Month Chevrons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleGoToday}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              isToday(selectedDate)
                ? 'droplet-active shadow-sm'
                : 'glass-tile text-white/75 hover:text-white'
            }`}
            style={isToday(selectedDate) ? { color: 'var(--app-accent-text, #64D2FF)' } : undefined}
          >
            Today
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="w-7 h-7 rounded-full glass-tile flex items-center justify-center hover:text-white active:scale-90 transition-transform cursor-pointer"
            style={{ color: 'var(--app-accent-text, #64D2FF)' }}
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Next month"
            className="w-7 h-7 rounded-full glass-tile flex items-center justify-center hover:text-white active:scale-90 transition-transform cursor-pointer"
            style={{ color: 'var(--app-accent-text, #64D2FF)' }}
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* ── 2. View Switcher & Action Controls ── */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        {/* 3 View Tabs: Month, Timeline, Schedule */}
        <div className="inline-flex p-0.5 rounded-full glass-tile gap-0.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setViewMode('month');
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'glass-nav text-white shadow-sm'
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
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'glass-nav text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Clock size={14} weight="bold" />
            <span>Timeline</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setViewMode('schedule');
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'schedule'
                ? 'glass-nav text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <ListDashes size={14} weight="bold" />
            <span>Schedule</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full glass-tile flex items-center justify-center transition-all cursor-pointer active:scale-90 text-white/60 hover:text-white"
            style={isSearchOpen ? { color: 'var(--app-accent-text, #D29B7E)' } : undefined}
            title="Search calendar"
          >
            <MagnifyingGlass size={16} weight="bold" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full glass-nav nav-rim-light active:scale-95 hover:text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            style={{ color: 'var(--app-accent-text, #D29B7E)' }}
          >
            <Plus size={14} weight="bold" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Search Bar (Expandable) */}
      {isSearchOpen && (
        <div className="mb-2">
          <div className="relative">
            <MagnifyingGlass size={14} weight="bold" className="absolute left-3 top-2.5 text-white/40 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, classes, or to-dos..."
              className="w-full pl-8 pr-7 py-2 rounded-xl glass-tile text-xs text-white placeholder:text-white/30 focus:outline-none"
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

      {/* Category Filter Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-3.5 no-scrollbar scroll-smooth px-0.5 touch-manipulation">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setCategoryFilter('all');
          }}
          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer select-none ${
            categoryFilter === 'all'
              ? 'glass-nav text-white shadow-sm'
              : 'glass-tile text-white/60 hover:text-white'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => {
          const isSelected = categoryFilter === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setCategoryFilter(cat.key);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                isSelected
                  ? 'glass-nav text-white shadow-sm'
                  : 'glass-tile text-white/70 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span style={{ color: isSelected ? '#FFFFFF' : cat.color }}>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. MONTH VIEW (Professional Apple Grid with Zero Red Artifacts) ── */}
      {viewMode === 'month' && (
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {/* Calendar Month Chassis */}
          <div className="glass-card p-3.5 sm:p-4 rounded-[26px]">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 mb-2 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <span
                  key={idx}
                  className={`text-[11px] font-bold tracking-wider uppercase ${
                    idx >= 5 ? 'text-white/30' : 'text-white/50'
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
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
                    className={`relative flex flex-col items-center justify-between h-[46px] sm:h-[50px] p-1.5 rounded-[15px] transition-all cursor-pointer select-none touch-manipulation ${
                      isSelected
                        ? 'droplet-active shadow-sm'
                        : inCurrentMonth
                        ? 'glass-tile'
                        : 'opacity-20 hover:opacity-35'
                    }`}
                  >
                    {/* Date Number: Pure iOS Typography (No Circular Badges) */}
                    <div className="flex items-center justify-center w-full pt-0.5">
                      <span
                        className={`text-[13px] tabular-nums leading-none ${
                          isTodayDay
                            ? 'font-black'
                            : isSelected
                            ? 'text-white font-bold'
                            : inCurrentMonth
                            ? 'text-white/85 font-semibold'
                            : 'text-white/25 font-normal'
                        }`}
                        style={isTodayDay ? { color: 'var(--app-accent-text, #D29B7E)' } : undefined}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* Inline Event Indicator Micro-Dots */}
                    <div className="flex items-center justify-center gap-0.5 pb-0.5 h-1.5 w-full">
                      {events.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: ev.color || '#5E5CE6' }}
                        />
                      ))}
                      {tasks.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] shrink-0" />}
                      {entry?.hasWorkout && <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] shrink-0" />}
                      {totalItems > 4 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Selected Day Summary Agenda (Immediately Below Month Grid) ── */}
          <div className="glass-card p-3.5 sm:p-4 rounded-[24px] space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  {format(selectedDate, 'EEEE, d MMMM')}
                </h2>
                {isToday(selectedDate) && (
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                      color: 'var(--app-accent-text, #D29B7E)',
                    }}
                  >
                    Today
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="text-xs font-bold hover:text-white flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                style={{ color: 'var(--app-accent-text, #D29B7E)' }}
              >
                <Plus size={14} weight="bold" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-1.5">
              {selectedEvents.length === 0 && selectedTasks.length === 0 && selectedClasses.length === 0 && !selectedWorkout ? (
                <div className="py-5 text-center rounded-2xl glass-tile text-white/50 text-xs">
                  No events or tasks scheduled for this date
                </div>
              ) : (
                <>
                  {selectedEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => handleOpenEditModal(ev)}
                      className="p-3 rounded-2xl glass-tile flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-1 h-7 rounded-full shrink-0"
                          style={{ backgroundColor: ev.color || '#5E5CE6' }}
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate leading-tight" style={{ color: ev.color }}>
                            {ev.title}
                          </h4>
                          <p className="text-[11px] text-white/50 font-mono mt-0.5">
                            {ev.isAllDay ? 'All-Day' : `${ev.startTime || '10:00'} – ${ev.endTime || '11:00'}`}
                            {ev.description ? ` • ${ev.description}` : ''}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                        style={{
                          backgroundColor: `${ev.color || '#5E5CE6'}18`,
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
                      className="p-3 rounded-2xl glass-tile flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          className={`shrink-0 transition-colors ${
                            t.completed ? '' : 'text-white/30 hover:text-white/60'
                          }`}
                          style={t.completed ? { color: 'var(--app-accent-text, #D29B7E)' } : undefined}
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
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider"
                        style={{
                          backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                          color: 'var(--app-accent-text, #D29B7E)',
                        }}
                      >
                        Task
                      </span>
                    </div>
                  ))}

                  {selectedClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className="p-3 rounded-2xl glass-tile flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg glass-flat flex items-center justify-center shrink-0"
                          style={{ color: 'var(--app-accent-text, #D29B7E)' }}
                        >
                          <GraduationCap size={16} weight="duotone" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold truncate" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>{cls.subject}</h4>
                          <p className="text-[11px] text-white/50 font-mono mt-0.5">
                            {cls.startTime} – {cls.endTime} {cls.room ? `• Room ${cls.room}` : ''}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                          color: 'var(--app-accent-text, #D29B7E)',
                        }}
                      >
                        Class
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. DAY TIMELINE VIEW (Google Calendar 24h Hourly Grid) ── */}
      {viewMode === 'timeline' && (
        <div className="space-y-3.5">
          {/* 7-Day Horizontal Week Strip */}
          <div className="grid grid-cols-7 gap-1 p-1.5 rounded-2xl glass-card text-center">
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
                  className={`py-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSelected ? 'droplet-active shadow-sm' : 'hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-[10px] font-bold text-white/40 uppercase">
                    {format(day, 'EEE')}
                  </span>
                  <span
                    className={`text-xs mt-0.5 tabular-nums ${
                      isTodayDay
                        ? 'font-black'
                        : isSelected
                        ? 'text-white font-bold'
                        : 'text-white/80 font-medium'
                    }`}
                    style={isTodayDay ? { color: 'var(--app-accent-text, #D29B7E)' } : undefined}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasItems && <span className="w-1.5 h-1.5 rounded-full bg-[#5E5CE6] mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Hourly Timeline Chassis */}
          <div
            ref={timelineScrollRef}
            className="rounded-[24px] glass-card p-3 relative shadow-2xl overflow-hidden"
          >
            {/* Header: Selected Date Title */}
            <div className="flex items-center justify-between pb-2 mb-1">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{format(selectedDate, 'EEEE, d MMMM')}</span>
                  {isToday(selectedDate) && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                        color: 'var(--app-accent-text, #D29B7E)',
                      }}
                    >
                      Today
                    </span>
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="w-7 h-7 rounded-full glass-tile flex items-center justify-center text-white active:scale-90"
              >
                <Plus size={14} weight="bold" />
              </button>
            </div>

            {/* Timeline Hours Column */}
            <div className="relative pt-1 space-y-2">
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
                    className="flex items-start gap-2.5 min-h-[46px] group cursor-pointer pt-0.5"
                  >
                    <div className="w-10 text-right shrink-0 pt-0.5">
                      <span className="text-[11px] font-mono font-semibold text-white/40 group-hover:text-white/80 transition-colors">
                        {hourFormatted}
                      </span>
                    </div>

                    <div className="flex-1 pt-1 min-h-[42px] space-y-1.5">
                      {eventsThisHour.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(ev);
                          }}
                          className="p-2 rounded-xl glass-tile flex items-center justify-between gap-2 shadow-sm"
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate leading-tight" style={{ color: ev.color }}>
                              {ev.title}
                            </h4>
                            <p className="text-[10px] text-white/50 font-mono">
                              {ev.startTime} – {ev.endTime || '1h'}
                            </p>
                          </div>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0"
                            style={{
                              backgroundColor: `${ev.color || '#5E5CE6'}18`,
                              color: ev.color,
                            }}
                          >
                            {ev.category}
                          </span>
                        </div>
                      ))}

                      {classesThisHour.map((cls) => (
                        <div
                          key={cls.id}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-xl glass-tile flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>{cls.subject}</h4>
                            <p className="text-[10px] text-white/50 font-mono">
                              {cls.startTime} – {cls.endTime}
                            </p>
                          </div>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                            style={{
                              backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                              color: 'var(--app-accent-text, #D29B7E)',
                            }}
                          >
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

      {/* ── 5. SCHEDULE / AGENDA VIEW (Chronological Stream) ── */}
      {viewMode === 'schedule' && (
        <div className="space-y-3.5">
          <div className="p-3 rounded-2xl glass-card flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{format(selectedDate, 'EEEE, d MMMM')}</span>
                {isToday(selectedDate) && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                      color: 'var(--app-accent-text, #D29B7E)',
                    }}
                  >
                    Today
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-white/50 mt-0.5">
                {selectedEvents.length + selectedTasks.length + selectedClasses.length} item(s)
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl glass-tile text-xs font-bold text-white active:scale-95"
            >
              <Plus size={14} weight="bold" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {selectedEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => handleOpenEditModal(ev)}
                className="p-3 rounded-2xl glass-tile flex items-start gap-2.5 cursor-pointer active:scale-[0.99]"
              >
                <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: ev.color || '#5E5CE6' }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold truncate leading-tight" style={{ color: ev.color }}>
                      {ev.title}
                    </h4>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0"
                      style={{
                        backgroundColor: `${ev.color || '#5E5CE6'}18`,
                        color: ev.color,
                      }}
                    >
                      {ev.category}
                    </span>
                  </div>
                  {ev.description && <p className="text-[11px] text-white/60 mt-0.5 line-clamp-1">{ev.description}</p>}
                  <div className="flex items-center gap-2.5 text-[10px] text-white/40 font-mono mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={11} weight="bold" />
                      {ev.isAllDay ? 'All-Day' : `${ev.startTime || '10:00'} – ${ev.endTime || '11:00'}`}
                    </span>
                    {ev.notificationLeadMinutes !== -1 && (
                      <span className="flex items-center gap-1" style={{ color: 'var(--app-accent-text, #D29B7E)' }}>
                        <Bell size={11} weight="fill" />
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
                className="p-3 rounded-2xl glass-tile flex items-center justify-between gap-2.5 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    className={`shrink-0 ${t.completed ? '' : 'text-white/30'}`}
                    style={t.completed ? { color: 'var(--app-accent-text, #D29B7E)' } : undefined}
                  >
                    {t.completed ? <CheckCircle size={18} weight="fill" /> : <Circle size={18} weight="bold" />}
                  </button>
                  <p className={`text-xs font-semibold truncate ${t.completed ? 'line-through text-white/40' : 'text-white'}`}>
                    {t.text}
                  </p>
                </div>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 uppercase"
                  style={{
                    backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                    color: 'var(--app-accent-text, #D29B7E)',
                  }}
                >
                  To-Do
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Event Creation / Editing Modern Liquid Sheet ── */}
      <Sheet
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        detent="full"
      >
        <div className="space-y-3.5 pt-1 pb-4 select-none font-sans text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl glass-tile flex items-center justify-center"
                style={{ color: 'var(--app-accent-text, #D29B7E)' }}
              >
                <CalendarBlank size={17} weight="duotone" />
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {editingEventId ? 'Edit Event' : 'New Calendar Event'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="w-7 h-7 rounded-full glass-tile text-white/70 hover:text-white flex items-center justify-center active:scale-90"
            >
              <X size={15} weight="bold" />
            </button>
          </div>

          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-300 text-xs flex items-center gap-2">
              <WarningCircle size={15} weight="fill" className="shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-white/70 mb-1">
              Event Title <span style={{ color: 'var(--app-accent-text, #D29B7E)' }}>*</span>
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g. Operating Systems Exam, Team Sync"
              className="w-full px-3.5 py-2.5 rounded-xl glass-tile text-xs text-white placeholder:text-white/30 focus:outline-none"
              autoFocus
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-tile text-xs text-white [color-scheme:dark] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-white/70 mb-1">Reminder</label>
              <select
                value={notificationLead}
                onChange={(e) => setNotificationLead(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl glass-tile text-xs text-white [color-scheme:dark] focus:outline-none"
              >
                {NOTIFICATION_LEAD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#1C1C1E] text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Controls */}
          <div className="p-3 rounded-2xl glass-tile space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white/80">All-Day Event</label>
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="w-4 h-4 accent-[#0A84FF] rounded cursor-pointer"
              />
            </div>

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10.5px] font-semibold text-white/60 mb-0.5">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl glass-flat text-xs text-white [color-scheme:dark] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold text-white/60 mb-0.5">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl glass-flat text-xs text-white [color-scheme:dark] focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold text-white/70 mb-1 flex items-center gap-1">
              <Tag size={12} weight="bold" />
              <span>Category</span>
            </label>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedCategory(cat.key);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCategory === cat.key ? 'glass-nav text-white shadow-sm' : 'glass-flat text-white/70'
                  }`}
                  style={{ color: selectedCategory === cat.key ? '#FFFFFF' : cat.color }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-white/70 mb-1">Notes (Optional)</label>
            <textarea
              rows={2}
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Notes, topics, or links..."
              className="w-full px-3.5 py-2 rounded-xl glass-tile text-xs text-white placeholder:text-white/30 focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {editingEventId && (
              <button
                type="button"
                onClick={() => handleDeleteEvent(editingEventId)}
                className="p-3 rounded-xl bg-rose-500/15 text-rose-400 active:scale-95 transition-all cursor-pointer"
                title="Delete Event"
              >
                <Trash size={16} weight="bold" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="flex-1 py-3 rounded-xl glass-tile text-xs font-bold text-white/80 active:scale-95 transition-all cursor-pointer text-center"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveEvent}
              className="flex-[2] py-3 rounded-xl text-xs font-bold text-white active:scale-95 transition-all shadow-lg cursor-pointer text-center"
              style={{ background: 'var(--preset-gradient, linear-gradient(135deg, #7B4B36 0%, #A46D52 100%))' }}
            >
              {editingEventId ? 'Update Event' : 'Save Event'}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
