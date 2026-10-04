import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppData, Task } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { triggerConfettiBurst } from '../utils/confetti';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  Button,
  Sun,
  CalendarDots,
  Barbell,
  Wallet,
  CheckCircle,
  ForkKnife,
  Check,
} from '../ui';

interface MorningBriefingProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<any>;
}

export default function MorningBriefing({ data, updateData }: MorningBriefingProps) {
  const navigate = useNavigate();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dayName = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }), []);
  const formattedDate = useMemo(() => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), []);

  // Filter today's tasks
  const todayTasks = useMemo(() => {
    return (data?.tasks || []).filter((t) => t.date === todayStr || t.dueDate === todayStr);
  }, [data?.tasks, todayStr]);

  const primeTasks = useMemo(() => todayTasks.slice(0, 3), [todayTasks]);

  // Today's workout split
  const todaysWorkout = useMemo(() => {
    const splits = data?.workoutPlans || [];
    return splits.find((s) => s.day.toLowerCase() === dayName.toLowerCase()) || null;
  }, [data?.workoutPlans, dayName]);

  // Next timetable event
  const nextEvent = useMemo(() => {
    const blocks = (data?.timetable || []).filter((b) => b.day.toLowerCase() === dayName.toLowerCase());
    if (!blocks.length) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const upcoming = blocks
      .map((b) => {
        const [h, m] = (b.startTime || '00:00').split(':').map(Number);
        return { block: b, startMinutes: h * 60 + m };
      })
      .filter((item) => item.startMinutes >= currentMinutes)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    return upcoming.length ? upcoming[0].block : blocks[0];
  }, [data?.timetable, dayName]);

  const toggleTask = async (task: Task) => {
    triggerHaptic('success');
    const updated = (data?.tasks || []).map((t) =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    );
    await updateData({ tasks: updated });
  };

  const handleDone = () => {
    triggerHaptic('milestone');
    triggerConfettiBurst();
    navigate('/');
  };

  return (
    <div className="w-full text-white">
      <LargeTitleHeader
        title="Morning Plan"
        subtitle={`${dayName}, ${formattedDate}`}
        onBack={() => navigate('/')}
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* Schedule & Class */}
        <GroupedList header="Schedule">
          <ListRow
            icon={<CalendarDots weight="bold" />}
            iconTint="#5E5CE6"
            title={nextEvent ? nextEvent.subject : 'No classes today'}
            subtitle={nextEvent ? `Starts at ${nextEvent.startTime} • Room ${nextEvent.room || 'TBD'}` : 'Enjoy your free day'}
            trailing={nextEvent ? `${nextEvent.startTime}` : undefined}
            onClick={() => navigate('/timetable')}
            showSeparator={false}
          />
        </GroupedList>

        {/* Workout Split */}
        <GroupedList header="Fitness & Gym">
          <ListRow
            icon={<Barbell weight="bold" />}
            iconTint="#FF453A"
            title={todaysWorkout ? todaysWorkout.type : 'Rest Day'}
            subtitle={todaysWorkout ? `${todaysWorkout.exercises?.length || 4} exercises planned` : 'Active recovery'}
            trailing={todaysWorkout ? 'Gym' : 'Rest'}
            onClick={() => navigate('/gym')}
            showSeparator={false}
          />
        </GroupedList>

        {/* Nutrition Target */}
        <GroupedList header="Nutrition">
          <ListRow
            icon={<ForkKnife weight="bold" />}
            iconTint="#FF9F0A"
            title="Daily Calorie Budget"
            subtitle="Target: 2,200 kcal • 140g Protein"
            trailing="2,200 kcal"
            onClick={() => navigate('/nutrition')}
            showSeparator={false}
          />
        </GroupedList>

        {/* Priority Tasks */}
        <GroupedList
          header="Top Tasks"
          footer={primeTasks.length === 0 ? 'No tasks scheduled for today.' : undefined}
        >
          {primeTasks.map((t) => (
            <ListRow
              key={t.id}
              icon={
                <CheckCircle
                  weight={t.completed ? 'fill' : 'regular'}
                  className={t.completed ? 'text-[#30D158]' : 'text-[rgba(235,235,245,0.40)]'}
                />
              }
              iconTint={t.completed ? '#30D158' : '#0A84FF'}
              title={
                <span className={t.completed ? 'line-through text-[rgba(235,235,245,0.40)]' : 'text-white'}>
                  {t.text}
                </span>
              }
              subtitle={t.subtask || 'Task'}
              onClick={() => toggleTask(t)}
            />
          ))}
        </GroupedList>

        {/* Done Button */}
        <div className="pt-4">
          <Button
            variant="prominent"
            tint="#0A84FF"
            className="w-full"
            onClick={handleDone}
          >
            Done • Launch Day
          </Button>
        </div>
      </div>
    </div>
  );
}
