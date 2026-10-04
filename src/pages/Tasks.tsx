import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppData, Task } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { triggerConfettiBurst } from '../utils/confetti';
import { syncTaskNotifications } from '../utils/notifications';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  SwipeActions,
  Segmented,
  Button,
  TextField,
  Sheet,
  EmptyState,
  CheckCircle,
  Plus,
  Trash,
  Check,
  CalendarDots,
  Sparkle,
} from '../ui';

interface TasksProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type TaskFilter = 'today' | 'upcoming' | 'done';

export default function Tasks({ data, updateData }: TasksProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<TaskFilter>('today');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  useEffect(() => {
    if (data?.tasks) {
      syncTaskNotifications(data.tasks, data.settings?.notificationLeadMinutes || 10);
    }
  }, [data?.tasks, data?.settings?.notificationLeadMinutes]);

  const filteredTasks = useMemo(() => {
    const all = data.tasks || [];
    if (filter === 'done') {
      return all.filter((t) => t.completed);
    }
    if (filter === 'upcoming') {
      return all.filter((t) => !t.completed && t.date > todayStr);
    }
    // Today
    return all.filter((t) => !t.completed && t.date <= todayStr);
  }, [data.tasks, filter, todayStr]);

  const handleToggleTask = async (task: Task) => {
    triggerHaptic('success');
    if (!task.completed) {
      triggerConfettiBurst();
    }
    const updated = (data.tasks || []).map((t) =>
      t.id === task.id ? { ...t, completed: !t.completed } : t
    );
    await updateData({ tasks: updated });
  };

  const handleDeleteTask = async (taskId: string) => {
    triggerHaptic('error');
    const updated = (data.tasks || []).filter((t) => t.id !== taskId);
    await updateData({ tasks: updated });
  };

  const handleCreateTask = async () => {
    if (!title.trim()) return;
    triggerHaptic('success');
    const newTask: Task = {
      id: `task_${Date.now()}`,
      text: title.trim(),
      subtask: category.trim() || undefined,
      completed: false,
      date: todayStr,
    };
    const updated = [newTask, ...(data.tasks || [])];
    await updateData({ tasks: updated });
    setTitle('');
    setIsAddOpen(false);
  };

  const priorityColor = (p?: string) => {
    if (p === 'high') return '#FF453A';
    if (p === 'medium') return '#FF9F0A';
    return '#0A84FF';
  };

  return (
    <div className="w-full text-white">
      <LargeTitleHeader
        title="Tasks"
        subtitle={`${(data.tasks || []).filter((t) => !t.completed).length} pending`}
        onBack={() => navigate('/')}
        actions={
          <Button
            variant="glass"
            tint="#0A84FF"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            icon={<Plus size={16} weight="bold" />}
          >
            Add Task
          </Button>
        }
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* Filter Segmented Control */}
        <Segmented<TaskFilter>
          options={[
            { value: 'today', label: 'Today' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'done', label: 'Done' },
          ]}
          value={filter}
          onChange={setFilter}
          tint="#0A84FF"
        />

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={<CheckCircle weight="bold" />}
            title={filter === 'done' ? 'No completed tasks' : 'All clear for now'}
            description={
              filter === 'done'
                ? 'Finish tasks to see them archived here.'
                : 'Great job staying ahead of your schedule!'
            }
            actionLabel={filter !== 'done' ? 'Add Task' : undefined}
            onAction={() => setIsAddOpen(true)}
            tint="#0A84FF"
          />
        ) : (
          <GroupedList
            header={
              filter === 'today'
                ? "Today's Schedule"
                : filter === 'upcoming'
                ? 'Upcoming Queue'
                : 'Completed Log'
            }
          >
            {filteredTasks.map((task) => (
              <SwipeActions
                key={task.id}
                actions={[
                  {
                    key: 'toggle',
                    label: task.completed ? 'Undo' : 'Done',
                    icon: <Check size={18} weight="bold" />,
                    color: '#30D158',
                    onClick: () => handleToggleTask(task),
                  },
                  {
                    key: 'delete',
                    label: 'Delete',
                    icon: <Trash size={18} weight="bold" />,
                    color: '#FF453A',
                    onClick: () => handleDeleteTask(task.id),
                  },
                ]}
              >
                <ListRow
                  icon={
                    <CheckCircle
                      weight={task.completed ? 'fill' : 'regular'}
                      className={task.completed ? 'text-[#30D158]' : 'text-[rgba(235,235,245,0.40)]'}
                    />
                  }
                  iconTint={task.completed ? '#30D158' : '#0A84FF'}
                  title={
                    <span
                      className={
                        task.completed
                          ? 'line-through text-[rgba(235,235,245,0.40)]'
                          : 'text-white'
                      }
                    >
                      {task.text}
                    </span>
                  }
                  subtitle={task.subtask || undefined}
                  trailing={task.startTime || undefined}
                  onClick={() => handleToggleTask(task)}
                />
              </SwipeActions>
            ))}
          </GroupedList>
        )}
      </div>

      {/* Add Task Sheet */}
      <Sheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        detent="half"
        title="New Task"
      >
        <div className="flex flex-col gap-4 py-2">
          <TextField
            label="Title"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <TextField
            label="Category"
            placeholder="Work, Study, Personal..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[rgba(235,235,245,0.60)] pl-1">
              Priority
            </label>
            <Segmented<'low' | 'medium' | 'high'>
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              value={priority}
              onChange={setPriority}
              tint={priorityColor(priority)}
            />
          </div>

          <div className="pt-3">
            <Button
              variant="prominent"
              tint="#0A84FF"
              className="w-full"
              disabled={!title.trim()}
              onClick={handleCreateTask}
            >
              Add Task
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
