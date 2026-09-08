import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, BookOpen, HelpCircle, Save, Check, ChevronDown, ChevronUp, Lock, Unlock } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import type { AppData, StudySession } from '../types';

interface StudyHistoryProps {
  data: AppData;
  updateData?: (partial: Partial<AppData>) => Promise<AppData>;
}

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

const MAX_DOUBT_WORDS = 10000;

function countWords(str: string): number {
  if (!str || !str.trim()) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export default function StudyHistory({ data, updateData }: StudyHistoryProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  
  // Expanded session doubts
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [doubtDrafts, setDoubtDrafts] = useState<Record<string, string>>({});
  const [unlockedDoubts, setUnlockedDoubts] = useState<Record<string, boolean>>({});
  const [savedFeedback, setSavedFeedback] = useState<Record<string, boolean>>({});

  const subjects = [...new Set(data.studySessions.map(s => s.subject))];

  const filtered = data.studySessions.filter(s => {
    const d = parseISO(s.date);
    const now = new Date();
    if (filter === 'today') return s.date === format(now, 'yyyy-MM-dd');
    if (filter === 'week') return isWithinInterval(d, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
    if (filter === 'month') return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
    return true;
  }).filter(s => !subjectFilter || s.subject === subjectFilter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {} as Record<string, typeof filtered>);

  const toggleExpand = (sessionId: string, currentDoubts?: string) => {
    triggerHaptic(5);
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
    } else {
      setExpandedSessionId(sessionId);
      if (doubtDrafts[sessionId] === undefined) {
        setDoubtDrafts(prev => ({ ...prev, [sessionId]: currentDoubts || '' }));
      }
    }
  };

  const handleSaveDoubts = async (session: StudySession) => {
    const draftText = doubtDrafts[session.id] !== undefined ? doubtDrafts[session.id] : (session.doubts || '');
    const words = countWords(draftText);
    if (words > MAX_DOUBT_WORDS) {
      alert(`Word limit exceeded! Max ${MAX_DOUBT_WORDS.toLocaleString()} words allowed.`);
      return;
    }

    triggerHaptic('save');
    const updatedSessions = data.studySessions.map(s => 
      s.id === session.id ? { ...s, doubts: draftText } : s
    );

    if (updateData) {
      await updateData({ studySessions: updatedSessions });
    }

    setSavedFeedback(prev => ({ ...prev, [session.id]: true }));
    setUnlockedDoubts(prev => ({ ...prev, [session.id]: false }));
    setTimeout(() => {
      setSavedFeedback(prev => ({ ...prev, [session.id]: false }));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/study')} className="flex items-center gap-2 text-sm text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors">
        <ChevronLeft size={16} /> Back to Study
      </button>

      <h1 className="text-3xl md:text-[40px] font-semibold tracking-tight">Study History</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'today', 'week', 'month'] as FilterPeriod[]).map(p => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === p 
                ? 'bg-accent text-white' 
                : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Sessions */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={32} className="mx-auto mb-3 text-secondary-light dark:text-secondary-dark opacity-40" />
          <p className="text-secondary-light dark:text-secondary-dark">No study sessions found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, sessions]) => (
            <div key={date}>
              <div className="text-xs font-semibold uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-3">
                {format(parseISO(date), 'EEEE, MMMM d')}
              </div>
              <div className="space-y-3">
                {sessions.map(s => {
                  const isExpanded = expandedSessionId === s.id;
                  const currentDraft = doubtDrafts[s.id] !== undefined ? doubtDrafts[s.id] : (s.doubts || '');
                  const currentWords = countWords(currentDraft);
                  const isOverLimit = currentWords > MAX_DOUBT_WORDS;
                  const hasSavedDoubts = !!s.doubts && s.doubts.trim().length > 0;
                  const isLocked = hasSavedDoubts && !unlockedDoubts[s.id];
                  const isSaved = !!savedFeedback[s.id];

                  return (
                    <div key={s.id} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl overflow-hidden transition-all shadow-sm">
                      <div 
                        onClick={() => toggleExpand(s.id, s.doubts)}
                        className="p-4 flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="p-2.5 rounded-xl bg-accent/10 text-accent flex-shrink-0">
                          <Clock size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-primary-light dark:text-primary-dark">
                            {s.subject} {s.topic ? `· ${s.topic}` : ''}
                          </div>
                          <div className="text-xs text-secondary-light dark:text-secondary-dark mt-0.5">
                            {s.startTime} · {s.duration} min
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {hasSavedDoubts && (
                            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                              <HelpCircle size={11} /> {countWords(s.doubts!)} words
                            </span>
                          )}
                          <div className="text-sm font-bold tabular-nums text-primary-light dark:text-primary-dark">
                            {s.duration}m
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-secondary-light dark:text-secondary-dark" />
                          ) : (
                            <ChevronDown size={16} className="text-secondary-light dark:text-secondary-dark" />
                          )}
                        </div>
                      </div>

                      {/* Doubts Subsection */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden border-t border-border-light dark:border-border-dark bg-bg-light/50 dark:bg-bg-dark/30 px-4 py-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <HelpCircle size={15} className="text-indigo-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary-light dark:text-primary-dark">
                                  Session Doubts
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-mono font-medium ${isOverLimit ? 'text-red-500 font-bold' : 'text-secondary-light dark:text-secondary-dark'}`}>
                                  {currentWords.toLocaleString()} / {MAX_DOUBT_WORDS.toLocaleString()} words
                                </span>
                                {hasSavedDoubts && (
                                  <button
                                    onClick={() => {
                                      triggerHaptic(8);
                                      setUnlockedDoubts(prev => ({ ...prev, [s.id]: !prev[s.id] }));
                                    }}
                                    className="p-1 rounded-md text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark"
                                    title={isLocked ? "Unlock to edit" : "Lock"}
                                  >
                                    {isLocked ? <Lock size={13} className="text-amber-500" /> : <Unlock size={13} className="text-emerald-500" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Doubts Textarea */}
                            <div className="relative">
                              <textarea
                                value={currentDraft}
                                disabled={isLocked}
                                onChange={(e) => setDoubtDrafts(prev => ({ ...prev, [s.id]: e.target.value }))}
                                placeholder="Add your doubts, unsolved questions, concepts to review, or lecture questions here..."
                                rows={4}
                                className={`w-full bg-surface-light dark:bg-surface-dark border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-y transition-all ${
                                  isOverLimit ? 'border-red-500' : 'border-border-light dark:border-border-dark'
                                } ${isLocked ? 'opacity-85 cursor-not-allowed bg-black/[0.02] dark:bg-white/[0.02]' : ''}`}
                              />
                            </div>

                            {/* Actions & No-overwrite lock */}
                            <div className="flex items-center justify-between pt-1">
                              {isLocked ? (
                                <p className="text-[11px] text-muted-light dark:text-muted-dark flex items-center gap-1">
                                  <Lock size={12} className="text-amber-500" /> Protected from accidental overwrite. Click unlock icon to edit.
                                </p>
                              ) : (
                                <p className="text-[11px] text-muted-light dark:text-muted-dark">
                                  {isOverLimit ? "Please reduce text to under 10,000 words." : "Saved persistently with this study session."}
                                </p>
                              )}

                              {!isLocked && (
                                <button
                                  onPointerDown={() => triggerHaptic('save')}
                                  onClick={() => handleSaveDoubts(s)}
                                  disabled={isOverLimit}
                                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-40 ${
                                    isSaved 
                                      ? 'bg-emerald-500 text-white shadow-md' 
                                      : 'bg-accent text-white hover:opacity-90'
                                  }`}
                                >
                                  {isSaved ? (
                                    <>
                                      <Check size={14} /> Saved & Locked
                                    </>
                                  ) : (
                                    <>
                                      <Save size={14} /> Save Doubts
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
