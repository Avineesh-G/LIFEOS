import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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
  Check,
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

  useEffect(() => {
    if (data?.timetable) {
      syncTimetableNotifications(data.timetable, data.settings?.notificationLeadMinutes || 10);
    }
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
    navigate(`/study/timer?subject=${encodeURIComponent(block.subject)}`);
  };

  return (
    <div className="w-full text-white">
      <LargeTitleHeader
        title="Timetable"
        subtitle={`${activeDayName} • ${dayBlocks.length} classes`}
        onBack={() => navigate('/')}
        actions={
          <Button
            variant="glass"
            tint="#5E5CE6"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            icon={<Plus size={16} weight="bold" />}
          >
            Add Class
          </Button>
        }
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* Horizontal Week Strip (indigo circle on selected day) */}
        <div className="grid grid-cols-7 gap-1.5 p-1.5 bg-[#1C1C1E] rounded-full border border-white/[0.06] select-none">
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
                className={`relative flex flex-col items-center justify-center py-2 rounded-full transition-all ${
                  isSelected ? 'text-white' : 'text-[rgba(235,235,245,0.60)]'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="timetable-day-indicator"
                    className="absolute inset-0 bg-[#5E5CE6] rounded-full -z-10 shadow-md"
                    transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                  />
                )}
                <span className="text-[10px] font-bold uppercase">{SHORT_DAYS[idx]}</span>
                <span className={`text-xs font-bold mt-0.5 ${isCur && !isSelected ? 'text-[#5E5CE6]' : ''}`}>
                  {idx + 1}
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
          <div className="flex flex-col gap-3 py-2">
            {dayBlocks.map((block) => {
              const active = isCurrentBlock(block);

              return (
                <motion.div
                  key={block.id}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full rounded-[24px] p-4 flex items-center justify-between gap-3 border transition-all ${
                    active
                      ? 'bg-[#5E5CE6]/20 border-[#5E5CE6]/50 shadow-lg shadow-[#5E5CE6]/10'
                      : 'bg-[#1C1C1E] border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-white/10 pr-3">
                      <span className="text-sm font-bold text-white tabular-nums">
                        {block.startTime}
                      </span>
                      <span className="text-[11px] text-[rgba(235,235,245,0.40)] tabular-nums">
                        {block.endTime}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="text-[17px] font-bold text-white truncate">
                        {block.subject}
                      </div>
                      <div className="text-[13px] text-[rgba(235,235,245,0.60)] truncate flex items-center gap-2 mt-0.5">
                        {block.room && <span>Room {block.room}</span>}
                        {active && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5E5CE6] text-white">
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
                      icon={<Timer size={16} weight="bold" />}
                    >
                      Focus
                    </Button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="p-2 rounded-full text-[rgba(235,235,245,0.30)] hover:text-[#FF453A] transition-colors"
                    >
                      <Trash size={16} weight="bold" />
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
