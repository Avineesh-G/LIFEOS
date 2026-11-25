import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import type { AppData, TimetableBlock } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { syncTimetableNotifications } from '../utils/notifications';
import {
  LargeTitleHeader,
  Button,
  Sheet,
  TextField,
  EmptyState,
  CalendarDots,
  Timer,
  Plus,
  Trash,
} from '../ui';

interface TimetableProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Timetable({ data, updateData }: TimetableProps) {
  const navigate = useNavigate();
  const todayName = format(new Date(), 'EEEE');
  const todayIndex = DAYS.indexOf(todayName) >= 0 ? DAYS.indexOf(todayName) : 0;
  const [activeDayIndex, setActiveDayIndex] = useState(todayIndex);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  const weekDates = useMemo(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return DAYS.map((_, idx) => addDays(monday, idx));
  }, []);

  // Defer background timetable notification sync so page entry never competes with UI frames
  useEffect(() => {
    if (!data?.timetable) return;
    const lead = data.settings?.notificationLeadMinutes || 10;
    const timer = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          syncTimetableNotifications(data.timetable, lead).catch(() => {});
        }, { timeout: 2500 });
      } else {
        syncTimetableNotifications(data.timetable, lead).catch(() => {});
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [data?.timetable, data?.settings?.notificationLeadMinutes]);

  const activeDayName = DAYS[activeDayIndex];

  const dayBlocks = useMemo(() => {
    const list = (data.timetable || []).filter(
      (b) => b.day.toLowerCase() === activeDayName.toLowerCase()
    );
    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.timetable, activeDayName]);

  const isCurrentBlock = (block: TimetableBlock) => {
    if (activeDayName !== todayName) return false;
    const nowTime = format(new Date(), 'HH:mm');
    return nowTime >= block.startTime && nowTime <= block.endTime;
  };

  const handleCreateBlock = async () => {
    if (!subject.trim()) return;
    triggerHaptic('success');
    const newBlock: TimetableBlock = {
      id: `block_${Date.now()}`,
      day: activeDayName,
      subject: subject.trim(),
      startTime,
      endTime,
      room: room.trim() || undefined,
    };
    const updated = [...(data.timetable || []), newBlock];
    await updateData({ timetable: updated });
    setSubject('');
    setRoom('');
    setIsAddOpen(false);
  };

  const handleDeleteBlock = async (id: string) => {
    triggerHaptic('error');
    const updated = (data.timetable || []).filter((b) => b.id !== id);
    await updateData({ timetable: updated });
  };

  const handleStartTimer = (block: TimetableBlock) => {
    triggerHaptic('selection');
    navigate(`/tasks?subject=${encodeURIComponent(block.subject)}`);
  };

  return (
    <div className="w-full text-white selection:bg-[#5E5CE6]/30">
      <LargeTitleHeader
        title="Timetable"
        subtitle={`${activeDayName}, ${format(weekDates[activeDayIndex], 'd MMM')} · ${dayBlocks.length} classes`}
        tint="#5E5CE6"
        actions={
          <Button
            variant="glass"
            tint="#5E5CE6"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            icon={<Plus size={15} weight="bold" />}
          >
            Add
          </Button>
        }
      />

      <div className="flex flex-col gap-3.5 pb-2">
        {/* Horizontal Week Strip */}
        <div className="grid grid-cols-7 gap-1.5 p-1.5 glass-card rounded-full select-none">
          {DAYS.map((day, idx) => {
            const isSelected = idx === activeDayIndex;
            const isCur = idx === todayIndex;

            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setActiveDayIndex(idx);
                }}
                className={`relative flex flex-col items-center justify-center py-2 rounded-full transition-colors cursor-pointer ${
                  isSelected ? 'text-white shadow-md' : 'text-[rgba(235,235,245,0.62)] hover:text-white'
                }`}
                style={
                  isSelected
                    ? { background: 'linear-gradient(135deg, var(--app-accent, #0A84FF) 0%, var(--app-accent-end, #5AC8FA) 100%)' }
                    : undefined
                }
              >
                <span className="text-[10px] font-bold uppercase">{SHORT_DAYS[idx]}</span>
                <span
                  className="text-xs font-bold mt-0.5"
                  style={isCur && !isSelected ? { color: 'var(--app-accent-text, #64D2FF)' } : undefined}
                >
                  {format(weekDates[idx], 'd')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Vertical Timeline of Rounded Pills */}
        {dayBlocks.length === 0 ? (
          <EmptyState
            icon={<CalendarDots weight="bold" />}
            title={`No classes on ${activeDayName}`}
            description="Enjoy your free time or schedule study blocks."
            actionLabel="Add Class"
            onAction={() => setIsAddOpen(true)}
            tint="#5E5CE6"
          />
        ) : (
          <div className="flex flex-col gap-3 py-1">
            {dayBlocks.map((block) => {
              const active = isCurrentBlock(block);

              return (
                <motion.div
                  key={block.id}
                  whileTap={{ scale: 0.985 }}
                  className="w-full rounded-[24px] p-4 flex items-center justify-between gap-3 transition-colors glass-card"
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--app-accent-soft, rgba(164, 109, 82, 0.14))',
                          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex flex-col items-center justify-center min-w-[50px] pr-3 border-r border-white/[0.08]">
                      <span className="text-sm font-bold text-white tabular-nums">
                        {block.startTime}
                      </span>
                      <span className="text-[11px] text-[rgba(235,235,245,0.45)] tabular-nums">
                        {block.endTime}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="text-[16px] font-bold text-white truncate">
                        {block.subject}
                      </div>
                      <div className="text-[12px] text-[rgba(235,235,245,0.60)] truncate flex items-center gap-2 mt-0.5">
                        {block.room && <span>Room {block.room}</span>}
                        {active && (
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{
                              backgroundImage:
                                'linear-gradient(135deg, var(--app-accent, #0A84FF) 0%, var(--app-accent-end, #5AC8FA) 100%)',
                            }}
                          >
                            LIVE NOW
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="glass"
                      tint="#5E5CE6"
                      size="sm"
                      onClick={() => handleStartTimer(block)}
                      icon={<Timer size={15} weight="bold" />}
                    >
                      Focus
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-2 rounded-full text-[rgba(235,235,245,0.35)] hover:text-[#FF453A] transition-colors cursor-pointer"
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Class Sheet */}
      <Sheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        detent="half"
        title="Add Schedule Class"
      >
        <div className="flex flex-col gap-4 py-2">
          <TextField
            label="Course / Subject Name"
            placeholder="Operating Systems, DBMS..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            autoFocus
          />

          <TextField
            label="Room / Hall"
            placeholder="Room 402, CS Lab..."
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Start Time (HH:MM)"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <TextField
              label="End Time (HH:MM)"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="pt-3">
            <Button
              variant="prominent"
              tint="#5E5CE6"
              className="w-full"
              disabled={!subject.trim()}
              onClick={handleCreateBlock}
            >
              Save to Timetable
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

