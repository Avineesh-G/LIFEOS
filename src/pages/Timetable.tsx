import { useState } from 'react';
import { Plus, Trash2, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { AnimatedCalendar } from '../components/AnimatedIcons';
import type { AppData, TimetableBlock } from '../types';

interface TimetableProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BLOCK_COLORS = [
  'bg-indigo-100 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
  'bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  'bg-amber-100 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  'bg-rose-100 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
  'bg-violet-100 dark:bg-violet-950 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300',
  'bg-cyan-100 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300',
];

function getBlockColor(subject: string) {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BLOCK_COLORS[Math.abs(hash) % BLOCK_COLORS.length];
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.44, ease: 'easeOut' } } };

export default function Timetable({ data, updateData }: TimetableProps) {
  const navigate = useNavigate();
  const today = format(new Date(), 'EEEE');
  const todayIndex = DAYS.indexOf(today);
  const [activeDay, setActiveDay] = useState(todayIndex >= 0 ? todayIndex : 0);

  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimetableBlock | null>(null);
  const [subject, setSubject] = useState('');
  const [day, setDay] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [slot, setSlot] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [courseCode, setCourseCode] = useState('');

  const openAdd = () => {
    triggerHaptic(12);
    setEditingBlock(null);
    setSubject('');
    setDay(DAYS[activeDay]);
    setStartTime('09:00');
    setEndTime('10:00');
    setSlot('');
    setTeacher('');
    setRoom('');
    setCourseCode('');
    setShowModal(true);
  };

  const openEdit = (block: TimetableBlock) => {
    triggerHaptic(10);
    setEditingBlock(block);
    setSubject(block.subject);
    setDay(block.day);
    setStartTime(block.startTime);
    setEndTime(block.endTime);
    setSlot(block.slot || '');
    setTeacher(block.teacher || '');
    setRoom(block.room || '');
    setCourseCode(block.courseCode || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!subject.trim()) return;
    triggerHaptic(15);
    const block: TimetableBlock = {
      id: editingBlock?.id || crypto.randomUUID(),
      subject: subject.trim(),
      day,
      startTime,
      endTime,
      slot: slot.trim() || undefined,
      teacher: teacher.trim() || undefined,
      room: room.trim() || undefined,
      courseCode: courseCode.trim() || undefined,
    };
    const updated = editingBlock
      ? data.timetable.map(b => b.id === block.id ? block : b)
      : [...data.timetable, block];
    await updateData({ timetable: updated });
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!editingBlock) return;
    triggerHaptic([20, 10, 20]);
    await updateData({ timetable: data.timetable.filter(b => b.id !== editingBlock.id) });
    setShowModal(false);
  };

  const getBlocksForDay = (d: string) =>
    data.timetable
      .filter(b => b.day === d)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const activeDayBlocks = getBlocksForDay(DAYS[activeDay]);
  const todayBlocks = getBlocksForDay(today);

  const getDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between pt-2">
        <div>
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">{today}</p>
          <h1 className="text-4xl font-bold tracking-tight leading-none text-primary-light dark:text-primary-dark">Timetable</h1>
        </div>
        <button onClick={openAdd} className="btn-pill flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus size={14} strokeWidth={2.5} /> Add
        </button>
      </motion.div>

      {/* Day Selector Pills */}
      <motion.div variants={item} className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {DAYS.map((d, i) => {
          const blocks = getBlocksForDay(d);
          const isToday = d === today;
          return (
            <button
              key={d}
              onClick={() => { triggerHaptic(8); setActiveDay(i); }}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl border transition-all text-xs ${
                activeDay === i
                  ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light border-primary-light dark:border-primary-dark shadow-sm'
                  : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
              }`}
            >
              <span className="label-mono">{SHORT_DAYS[i]}</span>
              {isToday && <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1" />}
              {blocks.length > 0 && (
                <span className={`mt-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                  activeDay === i ? 'bg-white/20' : 'bg-bg-light dark:bg-bg-dark'
                }`}>
                  {blocks.length}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Active Day Blocks */}
      <motion.div variants={item} className="card p-5">
        <p className="label-mono text-secondary-light dark:text-secondary-dark mb-4">
          {DAYS[activeDay]} · {activeDayBlocks.length} blocks
        </p>

        {activeDayBlocks.length === 0 ? (
          <div className="py-10 text-center">
            <div className="flex justify-center text-3xl mb-2"><AnimatedCalendar size={32} /></div>
            <p className="label-mono text-secondary-light dark:text-secondary-dark">No classes scheduled</p>
            <button onClick={openAdd} className="mt-3 btn-ghost-pill px-4 py-2 text-xs">
              + Add block
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {activeDayBlocks.map(block => {
              const dur = getDuration(block.startTime, block.endTime);
              const colorClass = getBlockColor(block.subject);
              return (
                <button
                  key={block.id}
                  onClick={() => openEdit(block)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-bg-light dark:hover:bg-bg-dark active:scale-[0.985] transition-all text-left"
                >
                  <div className={`px-2 py-1.5 rounded-xl border text-center min-w-[52px] ${colorClass}`}>
                    <p className="text-[10px] font-bold leading-tight">{block.startTime}</p>
                    <p className="text-[9px] opacity-70">{block.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-primary-light dark:text-primary-dark truncate">{block.subject}</p>
                    {block.teacher && <p className="text-[11px] text-secondary-light dark:text-secondary-dark truncate">{block.teacher}</p>}
                    {(block.courseCode || block.room || block.slot) && (
                      <p className="text-[10px] text-muted-light dark:text-muted-dark truncate mt-0.5">
                        {[block.courseCode, block.room, block.slot].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    <p className="label-mono text-muted-light dark:text-muted-dark mt-1">{dur}min session</p>
                  </div>
                  {DAYS[activeDay] === today && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic(15);
                        navigate(`/study/timer?subject=${encodeURIComponent(block.subject)}&duration=${dur}`);
                      }}
                      className="btn-pill px-3 py-1.5 text-xs flex-shrink-0"
                    >
                      Start
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Today's Schedule (if different day is selected) */}
      {activeDay !== todayIndex && todayBlocks.length > 0 && (
        <motion.div variants={item} className="card p-5">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-4">Today · {today}</p>
          <div className="space-y-2">
            {todayBlocks.map(block => {
              const dur = getDuration(block.startTime, block.endTime);
              const colorClass = getBlockColor(block.subject);
              return (
                <div key={block.id} className="flex items-center gap-3 p-3 rounded-xl">
                  <div className={`px-2 py-1.5 rounded-xl border text-center min-w-[52px] ${colorClass}`}>
                    <p className="text-[10px] font-bold leading-tight">{block.startTime}</p>
                    <p className="text-[9px] opacity-70">{block.endTime}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-primary-light dark:text-primary-dark truncate">{block.subject}</p>
                    {block.teacher && <p className="text-[11px] text-secondary-light dark:text-secondary-dark truncate">{block.teacher}</p>}
                    {(block.courseCode || block.room || block.slot) && (
                      <p className="text-[10px] text-muted-light dark:text-muted-dark truncate mt-0.5">
                        {[block.courseCode, block.room, block.slot].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/study/timer?subject=${encodeURIComponent(block.subject)}&duration=${dur}`)}
                    className="btn-ghost-pill px-3 py-1.5 text-xs"
                  >
                    <Clock size={11} className="inline mr-1" />Start
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Add / Edit Block Sheet */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-end justify-center"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-xl bg-surface-light dark:bg-surface-dark rounded-t-3xl p-6 pb-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-border-light dark:bg-border-dark mx-auto mb-6" />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">{editingBlock ? 'Edit Block' : 'Add Block'}</h2>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-light dark:bg-bg-dark">
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">Subject / Activity</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. DSA, Physics, Reading"
                    autoFocus
                    className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">Teacher / Faculty</label>
                    <input
                      type="text"
                      value={teacher}
                      onChange={e => setTeacher(e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 text-primary-light dark:text-primary-dark"
                    />
                  </div>
                  <div>
                    <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">Course Code</label>
                    <input
                      type="text"
                      value={courseCode}
                      onChange={e => setCourseCode(e.target.value)}
                      placeholder="e.g. CSE3004"
                      className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 text-primary-light dark:text-primary-dark"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">Room / Location</label>
                    <input
                      type="text"
                      value={room}
                      onChange={e => setRoom(e.target.value)}
                      placeholder="e.g. 501-CB"
                      className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 text-primary-light dark:text-primary-dark"
                    />
                  </div>
                  <div>
                    <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">Slot</label>
                    <input
                      type="text"
                      value={slot}
                      onChange={e => setSlot(e.target.value)}
                      placeholder="e.g. L23+L24"
                      className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 text-primary-light dark:text-primary-dark"
                    />
                  </div>
                </div>
                <div>
                  <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">Day</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map((d, i) => (
                      <button
                        key={d}
                        onClick={() => setDay(d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          day === d
                            ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light'
                            : 'bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark'
                        }`}
                      >
                        {SHORT_DAYS[i]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">Start</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 text-primary-light dark:text-primary-dark"
                    />
                  </div>
                  <div>
                    <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">End</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 text-primary-light dark:text-primary-dark"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={handleSave} className="btn-pill flex-1 py-3.5 text-sm">
                    {editingBlock ? 'Update Block' : 'Add Block'}
                  </button>
                  {editingBlock && (
                    <button
                      onClick={handleDelete}
                      className="w-12 flex items-center justify-center rounded-2xl border border-red-200 dark:border-red-800 text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
