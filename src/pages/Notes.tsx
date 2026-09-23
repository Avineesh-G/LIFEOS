import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NotebookPen,
  Plus,
  Search,
  Trash2,
  Calendar,
  Grid3X3,
  AlignLeft,
  FileText,
  Save,
  X,
  Sparkles,
  ChevronDown,
  Archive,
  Clock,
  RotateCcw,
  Check,
  CloudOff,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import type { AppData, NoteItem } from '../types';

interface NotesProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type PageViewMode = 'white' | 'lined' | 'grid';

export default function Notes({ data, updateData }: NotesProps) {
  // Navigation & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const currentMonthKey = useMemo(() => format(new Date(), 'yyyy-MM'), []);

  // Editor Modal / Active Note State
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorPageView, setEditorPageView] = useState<PageViewMode>('white');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [draftAlert, setDraftAlert] = useState<string | null>(null);
  const DRAFT_KEY = 'lifeos_note_editor_draft';

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Restore draft on mount if user previously switched interfaces
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.editorTitle || parsed.editorContent)) {
          setActiveNote(parsed.activeNote || null);
          setEditorTitle(parsed.editorTitle || '');
          setEditorContent(parsed.editorContent || '');
          setEditorPageView(parsed.editorPageView || 'white');
          setIsEditing(true);
          setDraftAlert('Unsaved draft recovered with your opted page view');
        }
      }
    } catch {}
  }, []);

  // Continuously persist draft to phone storage while typing
  useEffect(() => {
    if (isEditing && (editorTitle.trim() || editorContent.trim())) {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            activeNote,
            editorTitle,
            editorContent,
            editorPageView,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  }, [isEditing, editorTitle, editorContent, editorPageView, activeNote]);

  // Auto-resize textarea to support boundless infinite vertical page height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 400)}px`;
    }
  }, [editorContent, isEditing]);

  const allNotes: NoteItem[] = useMemo(() => {
    return (data.notes || []).map(n => ({
      ...n,
      pageView: n.pageView || 'white',
      monthKey: n.monthKey || (n.createdAt ? n.createdAt.slice(0, 7) : currentMonthKey),
    }));
  }, [data.notes, currentMonthKey]);

  // Available unique months in notes
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonthKey);
    allNotes.forEach(n => {
      if (n.monthKey) set.add(n.monthKey);
    });
    return Array.from(set).sort().reverse();
  }, [allNotes, currentMonthKey]);

  // Filtered notes based on current tab, month, and search query
  const displayedNotes = useMemo(() => {
    let list = allNotes;

    if (activeTab === 'active') {
      list = list.filter(n => !n.isArchived && n.monthKey === selectedMonth);
    } else {
      list = list.filter(n => n.isArchived || n.monthKey !== currentMonthKey);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }, [allNotes, activeTab, selectedMonth, currentMonthKey, searchQuery]);

  // Open note for editing or create new note
  const handleOpenNewNote = () => {
    triggerHaptic('light');
    const newNote: NoteItem = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: '',
      content: '',
      pageView: 'white',
      monthKey: currentMonthKey,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveNote(newNote);
    setEditorTitle('');
    setEditorContent('');
    setEditorPageView('white');
    setIsEditing(true);
  };

  const handleOpenExistingNote = (note: NoteItem) => {
    triggerHaptic('light');
    setActiveNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorPageView(note.pageView || 'white');
    setIsEditing(true);
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;
    if (!editorTitle.trim() && !editorContent.trim()) {
      setIsEditing(false);
      return;
    }

    triggerHaptic('success');
    setSaveStatus('saving');

    const updated: NoteItem = {
      ...activeNote,
      title: editorTitle.trim() || 'Untitled Thought',
      content: editorContent,
      pageView: editorPageView,
      updatedAt: new Date().toISOString(),
      monthKey: activeNote.monthKey || currentMonthKey,
    };

    const existingIndex = (data.notes || []).findIndex(n => n.id === updated.id);
    let nextNotes: NoteItem[];
    if (existingIndex >= 0) {
      nextNotes = [...(data.notes || [])];
      nextNotes[existingIndex] = updated;
    } else {
      nextNotes = [updated, ...(data.notes || [])];
    }

    try {
      await updateData({ notes: nextNotes });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      setDraftAlert(null);
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
        setActiveNote(null);
      }, 350);
    } catch (err) {
      setSaveStatus('idle');
    }
  };

  const handleDiscardDraft = () => {
    triggerHaptic('light');
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setDraftAlert(null);
    setIsEditing(false);
    setActiveNote(null);
    setEditorTitle('');
    setEditorContent('');
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('Delete this note permanently?')) {
      triggerHaptic('medium');
      const filtered = (data.notes || []).filter(n => n.id !== id);
      await updateData({ notes: filtered });
      if (activeNote?.id === id) {
        setIsEditing(false);
        setActiveNote(null);
      }
    }
  };

  const handleToggleArchive = async (note: NoteItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('light');
    const updated = (data.notes || []).map(n => {
      if (n.id === note.id) {
        return { ...n, isArchived: !n.isArchived, updatedAt: new Date().toISOString() };
      }
      return n;
    });
    await updateData({ notes: updated });
    if (activeNote?.id === note.id) {
      setActiveNote(prev => prev ? { ...prev, isArchived: !prev.isArchived } : null);
    }
  };

  // Helper background style for page views
  const getPageBackgroundClass = (mode: PageViewMode) => {
    switch (mode) {
      case 'lined':
        return 'notebook-lined-bg bg-white dark:bg-[#18111B] text-[#1E1B4B] dark:text-[#F3E8FF]';
      case 'grid':
        return 'notebook-grid-bg bg-white dark:bg-[#18111B] text-[#1E1B4B] dark:text-[#F3E8FF]';
      case 'white':
      default:
        return 'bg-white dark:bg-[#19101C] text-[#2E1065] dark:text-[#FDF4FF]';
    }
  };

  return (
    <div className="min-h-screen pb-32 pt-2 sm:pt-4 px-4 sm:px-6 max-w-5xl mx-auto space-y-6">
      {/* Dynamic CSS Pattern definitions for Lined and Grid paper */}
      <style>{`
        .notebook-lined-bg {
          background-image: 
            linear-gradient(90deg, transparent 46px, rgba(244, 114, 182, 0.4) 47px, rgba(244, 114, 182, 0.4) 48px, transparent 49px),
            repeating-linear-gradient(transparent, transparent 31px, rgba(192, 38, 211, 0.12) 31px, rgba(192, 38, 211, 0.12) 32px);
          line-height: 32px;
          background-size: 100% 32px;
          padding-left: 56px !important;
        }
        .notebook-grid-bg {
          background-image:
            linear-gradient(to right, rgba(192, 38, 211, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(192, 38, 211, 0.1) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#701A75]/15 via-[#C026D3]/10 to-[#FAE8FF]/30 dark:from-[#3B0764]/40 dark:via-[#701A75]/30 dark:to-[#18051E]/60 border border-[#F5D0FE]/40 dark:border-[#86198F]/30 p-6 sm:p-8 backdrop-blur-xl shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C026D3]/10 dark:bg-[#F0ABFC]/10 border border-[#C026D3]/20 text-[#C026D3] dark:text-[#F0ABFC] text-xs font-semibold tracking-wide">
              <NotebookPen size={13} />
              <span>Boundless Notes & Ideas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#4A044E] dark:text-[#FDF4FF]">
              Never Forget an Idea
            </h1>
            <p className="text-xs sm:text-sm text-[#86198F] dark:text-[#E879F9]/80 max-w-xl">
              Write down fast thoughts, brainstorms, concepts, or reminders. Infinite length pages, custom lined or grid views, and monthly auto-history.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewNote}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-[#C026D3] to-[#A21CAF] hover:from-[#A21CAF] hover:to-[#86198F] text-white font-bold text-sm shadow-lg shadow-[#C026D3]/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <Plus size={18} />
            <span>New Note / Idea</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Tabs, Search & Month Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => { triggerHaptic('light'); setActiveTab('active'); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'active'
                ? 'bg-white dark:bg-[#280E2B] text-[#C026D3] dark:text-[#F0ABFC] shadow-sm'
                : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
            }`}
          >
            Active Ideas ({allNotes.filter(n => !n.isArchived && n.monthKey === selectedMonth).length})
          </button>
          <button
            type="button"
            onClick={() => { triggerHaptic('light'); setActiveTab('archived'); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'archived'
                ? 'bg-white dark:bg-[#280E2B] text-[#C026D3] dark:text-[#F0ABFC] shadow-sm'
                : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
            }`}
          >
            <Archive size={14} />
            <span>Monthly Archives ({allNotes.filter(n => n.isArchived || n.monthKey !== currentMonthKey).length})</span>
          </button>
        </div>

        {/* Month Selector & Search Box */}
        <div className="flex flex-1 sm:flex-initial items-center gap-2">
          {activeTab === 'active' && (
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => { triggerHaptic('light'); setSelectedMonth(e.target.value); }}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-2xl text-xs font-bold bg-white/70 dark:bg-[#1E1123]/70 border border-[#F5D0FE] dark:border-[#86198F]/40 text-[#4A044E] dark:text-[#FDF4FF] focus:outline-none focus:ring-2 focus:ring-[#C026D3]"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {m === currentMonthKey ? `Current (${m})` : m}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#C026D3]" />
            </div>
          )}

          <div className="relative flex-1 md:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-light dark:text-secondary-dark" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search thoughts & notes..."
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs bg-white/70 dark:bg-[#1E1123]/70 border border-[#F5D0FE] dark:border-[#86198F]/40 text-primary-light dark:text-primary-dark placeholder:text-secondary-light/60 dark:placeholder:text-secondary-dark/60 focus:outline-none focus:ring-2 focus:ring-[#C026D3]"
            />
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {displayedNotes.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-[#F5D0FE] dark:border-[#86198F]/30 bg-[#FDF4FF]/40 dark:bg-[#18051E]/20 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#C026D3]/10 dark:bg-[#F0ABFC]/10 flex items-center justify-center text-[#C026D3] dark:text-[#F0ABFC]">
            <NotebookPen size={28} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-[#4A044E] dark:text-[#FDF4FF]">
              {searchQuery ? 'No matching notes found' : 'No notes recorded for this period'}
            </h3>
            <p className="text-xs text-secondary-light dark:text-secondary-dark">
              {searchQuery ? 'Try another keyword or search query.' : 'Capture your first thought or brainstorm. It will stay safely preserved forever.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleOpenNewNote}
              className="px-4 py-2 rounded-xl bg-[#C026D3] text-white text-xs font-bold hover:bg-[#A21CAF] transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={14} /> Add First Note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedNotes.map((note) => {
            const pageView = note.pageView || 'white';
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={() => handleOpenExistingNote(note)}
                className={`relative flex flex-col justify-between p-5 rounded-3xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  pageView === 'lined'
                    ? 'notebook-lined-bg border-[#F5D0FE] dark:border-[#86198F]/30 bg-white dark:bg-[#1E1123]'
                    : pageView === 'grid'
                    ? 'notebook-grid-bg border-[#F5D0FE] dark:border-[#86198F]/30 bg-white dark:bg-[#1E1123]'
                    : 'bg-white dark:bg-[#1E1123] border-[#F5D0FE]/70 dark:border-[#86198F]/30 shadow-sm'
                }`}
              >
                {/* Note Top Meta */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#C026D3]/10 dark:bg-[#F0ABFC]/10 text-[#C026D3] dark:text-[#F0ABFC]">
                      {pageView === 'white' ? 'White Page' : pageView === 'lined' ? 'Lined Rule' : 'Grid Paper'}
                    </span>
                    <span className="text-[11px] text-secondary-light/70 dark:text-secondary-dark/70">
                      {format(new Date(note.updatedAt || note.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#4A044E] dark:text-[#FDF4FF] line-clamp-1">
                    {note.title || 'Untitled Thought'}
                  </h3>

                  <p className="text-xs text-secondary-light dark:text-secondary-dark line-clamp-4 whitespace-pre-wrap">
                    {note.content || '(Empty page)'}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-secondary-light/60 dark:text-secondary-dark/60 font-medium">
                    {note.monthKey}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title={note.isArchived ? 'Restore to Active' : 'Archive Note'}
                      onClick={(e) => handleToggleArchive(note, e)}
                      className="p-1.5 rounded-lg hover:bg-[#C026D3]/10 text-[#C026D3] dark:text-[#F0ABFC] transition-colors"
                    >
                      {note.isArchived ? <RotateCcw size={14} /> : <Archive size={14} />}
                    </button>
                    <button
                      type="button"
                      title="Delete Note"
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Boundless Full-Screen Note Editor Modal ── */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.98 }}
              className={`w-full max-w-4xl my-auto rounded-3xl border border-[#F5D0FE] dark:border-[#86198F]/40 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${getPageBackgroundClass(editorPageView)}`}
            >
              {/* Modal Top Bar */}
              <div className="px-5 py-3.5 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-[#1A0B1E]/70 backdrop-blur-md flex items-center justify-between gap-3">
                {/* Page View Mode Selector */}
                <div className="flex items-center gap-1.5 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setEditorPageView('white'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      editorPageView === 'white'
                        ? 'bg-white dark:bg-[#2E1065] text-[#C026D3] dark:text-[#F0ABFC] shadow-sm'
                        : 'text-secondary-light dark:text-secondary-dark'
                    }`}
                  >
                    <FileText size={13} />
                    <span>White Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setEditorPageView('lined'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      editorPageView === 'lined'
                        ? 'bg-white dark:bg-[#2E1065] text-[#C026D3] dark:text-[#F0ABFC] shadow-sm'
                        : 'text-secondary-light dark:text-secondary-dark'
                    }`}
                  >
                    <AlignLeft size={13} />
                    <span>Lined Paper</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setEditorPageView('grid'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      editorPageView === 'grid'
                        ? 'bg-white dark:bg-[#2E1065] text-[#C026D3] dark:text-[#F0ABFC] shadow-sm'
                        : 'text-secondary-light dark:text-secondary-dark'
                    }`}
                  >
                    <Grid3X3 size={13} />
                    <span>Grid View</span>
                  </button>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={saveStatus === 'saving'}
                    className="px-4 py-2 rounded-xl bg-[#C026D3] hover:bg-[#A21CAF] text-white text-xs font-bold shadow-md shadow-[#C026D3]/25 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    {saveStatus === 'saved' ? (
                      <>
                        <Check size={14} />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save Idea</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setIsEditing(false); }}
                    className="p-2 rounded-xl text-secondary-light hover:text-primary-light hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Draft Recovery Notification Banner */}
              {draftAlert && (
                <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-2">
                    <CloudOff size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>{draftAlert}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline"
                  >
                    Discard Draft
                  </button>
                </div>
              )}

              {/* Title Header Input */}
              <div className="px-6 sm:px-8 pt-6 pb-2 border-b border-black/[0.04] dark:border-white/[0.04]">
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  placeholder="Note Title or Idea Name..."
                  className="w-full text-xl sm:text-2xl font-black bg-transparent text-[#4A044E] dark:text-[#FDF4FF] placeholder:text-[#C026D3]/30 dark:placeholder:text-[#F0ABFC]/25 focus:outline-none"
                />
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#A21CAF]/70 dark:text-[#E879F9]/60 font-semibold">
                  <span>{activeNote?.monthKey || currentMonthKey}</span>
                  <span>•</span>
                  <span>Boundless Infinite Page</span>
                  <span>•</span>
                  <span>Auto-saved to Cloud</span>
                </div>
              </div>

              {/* Boundless Infinite Vertical Content Editor */}
              <div className="p-6 sm:p-8 flex-1 min-h-[420px]">
                <textarea
                  ref={textareaRef}
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Start writing your thoughts, ideas, brainstorms, formulas, or reminders... There is no limit to this page."
                  className={`w-full min-h-[380px] bg-transparent resize-none focus:outline-none text-sm sm:text-base leading-relaxed text-[#2E1065] dark:text-[#FDF4FF] placeholder:text-secondary-light/40 dark:placeholder:text-secondary-dark/40 ${
                    editorPageView === 'lined' ? 'notebook-lined-bg' : ''
                  }`}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
