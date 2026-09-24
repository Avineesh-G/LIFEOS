import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NotebookPen,
  Plus,
  Search,
  Trash2,
  Grid3X3,
  AlignLeft,
  FileText,
  Save,
  X,
  Archive,
  RotateCcw,
  Check,
  Cloud,
  CloudOff,
  RefreshCw,
  Smartphone,
  ChevronDown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import { registerDismissible } from '../utils/backNavigation';
import {
  putNoteInIdb,
  deleteNoteFromIdb,
  bulkSyncNotesToIdb,
} from '../features/notes/storage/notesIdb';
import type { AppData, NoteItem } from '../types';

interface NotesProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type PageViewMode = 'white' | 'lined' | 'grid';

export default function Notes({ data, updateData }: NotesProps) {
  const { id: routeNoteId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Navigation & Search State
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
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  const DRAFT_KEY = 'lifeos_note_editor_draft';
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor network status for real sync reporting
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync all notes from app data to IndexedDB whenever data changes
  useEffect(() => {
    if (Array.isArray(data.notes)) {
      bulkSyncNotesToIdb(data.notes);
    }
  }, [data.notes]);

  // Back Navigation: dismiss editor on hardware back button or Android back gesture
  useEffect(() => {
    if (isEditing) {
      return registerDismissible('notes-editor', () => {
        handleCloseEditor();
        return true;
      });
    }
  }, [isEditing]);

  // Restore draft on mount if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.editorTitle || parsed.editorContent)) {
          if (!routeNoteId) {
            setActiveNote(parsed.activeNote || null);
            setEditorTitle(parsed.editorTitle || '');
            setEditorContent(parsed.editorContent || '');
            setEditorPageView(parsed.editorPageView || 'white');
            setIsEditing(true);
            setDraftAlert('Recovered unsaved draft');
          }
        }
      }
    } catch {}
  }, []);

  // Sync route note ID (support /notes/:id and /notes/new)
  useEffect(() => {
    if (routeNoteId) {
      if (routeNoteId === 'new') {
        const newNote: NoteItem = {
          id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: '',
          content: '',
          pageView: 'white',
          monthKey: currentMonthKey,
          isArchived: false,
          syncStatus: isOnline ? 'synced' : 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setActiveNote(newNote);
        setEditorTitle('');
        setEditorContent('');
        setEditorPageView('white');
        setIsEditing(true);
      } else {
        const found = (data.notes || []).find((n) => n.id === routeNoteId);
        if (found) {
          setActiveNote(found);
          setEditorTitle(found.title);
          setEditorContent(found.content);
          setEditorPageView(found.pageView || 'white');
          setIsEditing(true);
        }
      }
    }
  }, [routeNoteId, data.notes, currentMonthKey, isOnline]);

  // Debounced draft persistence to local storage while typing
  useEffect(() => {
    if (isEditing && (editorTitle.trim() || editorContent.trim())) {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
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
      }, 500);
    }
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [isEditing, editorTitle, editorContent, editorPageView, activeNote]);

  // Natural content-driven auto-resize of textarea (no hardcoded oversized minimum)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [editorContent, isEditing]);

  const allNotes: NoteItem[] = useMemo(() => {
    return (data.notes || []).map((n) => ({
      ...n,
      pageView: n.pageView || 'white',
      monthKey: n.monthKey || (n.createdAt ? n.createdAt.slice(0, 7) : currentMonthKey),
    }));
  }, [data.notes, currentMonthKey]);

  // Available unique months in notes
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonthKey);
    allNotes.forEach((n) => {
      if (n.monthKey) set.add(n.monthKey);
    });
    return Array.from(set).sort().reverse();
  }, [allNotes, currentMonthKey]);

  // Filtered notes based on current tab, month, and search query
  const displayedNotes = useMemo(() => {
    let list = allNotes;

    if (activeTab === 'active') {
      list = list.filter((n) => !n.isArchived && n.monthKey === selectedMonth);
    } else {
      list = list.filter((n) => n.isArchived || n.monthKey !== currentMonthKey);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    return list.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime()
    );
  }, [allNotes, activeTab, selectedMonth, currentMonthKey, searchQuery]);

  // Handlers
  const handleOpenNewNote = () => {
    triggerHaptic('light');
    navigate('/notes/new');
  };

  const handleOpenExistingNote = (note: NoteItem) => {
    triggerHaptic('light');
    navigate(`/notes/${note.id}`);
  };

  const handleCloseEditor = useCallback(() => {
    triggerHaptic('light');
    setIsEditing(false);
    setActiveNote(null);
    if (routeNoteId) {
      navigate('/notes', { replace: true });
    }
  }, [routeNoteId, navigate]);

  const handleSaveNote = async () => {
    if (!activeNote) return;
    if (!editorTitle.trim() && !editorContent.trim()) {
      handleCloseEditor();
      return;
    }

    triggerHaptic('success');
    setSaveStatus('saving');

    const updated: NoteItem = {
      ...activeNote,
      title: editorTitle.trim() || 'Untitled Idea',
      content: editorContent,
      pageView: editorPageView,
      updatedAt: new Date().toISOString(),
      monthKey: activeNote.monthKey || currentMonthKey,
      syncStatus: isOnline ? 'synced' : 'pending',
    };

    // Update in-memory & parent store
    const existingIndex = (data.notes || []).findIndex((n) => n.id === updated.id);
    let nextNotes: NoteItem[];
    if (existingIndex >= 0) {
      nextNotes = [...(data.notes || [])];
      nextNotes[existingIndex] = updated;
    } else {
      nextNotes = [updated, ...(data.notes || [])];
    }

    try {
      // 1. Immediately persist to dedicated IndexedDB store
      await putNoteInIdb(updated);

      // 2. Persist to AppData & auto-sync to Firebase
      await updateData({ notes: nextNotes });

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      setDraftAlert(null);
      setSaveStatus('saved');

      setTimeout(() => {
        setSaveStatus('idle');
        handleCloseEditor();
      }, 350);
    } catch {
      setSaveStatus('idle');
    }
  };

  const handleDiscardDraft = () => {
    triggerHaptic('light');
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setDraftAlert(null);
    handleCloseEditor();
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('Delete this note permanently?')) {
      triggerHaptic('medium');
      await deleteNoteFromIdb(id);
      const filtered = (data.notes || []).filter((n) => n.id !== id);
      await updateData({ notes: filtered });
      if (activeNote?.id === id) {
        handleCloseEditor();
      }
    }
  };

  const handleToggleArchive = async (note: NoteItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    triggerHaptic('light');
    const updated: NoteItem = {
      ...note,
      isArchived: !note.isArchived,
      updatedAt: new Date().toISOString(),
    };
    await putNoteInIdb(updated);
    const updatedList = (data.notes || []).map((n) => (n.id === note.id ? updated : n));
    await updateData({ notes: updatedList });
    if (activeNote?.id === note.id) {
      setActiveNote((prev) => (prev ? { ...prev, isArchived: !prev.isArchived } : null));
    }
  };

  const formattedNoteDate = useMemo(() => {
    try {
      const dateStr = activeNote?.updatedAt || activeNote?.createdAt || new Date().toISOString();
      return format(parseISO(dateStr), 'd MMM yyyy');
    } catch {
      return format(new Date(), 'd MMM yyyy');
    }
  }, [activeNote]);

  const pageViewLabel = useMemo(() => {
    switch (editorPageView) {
      case 'lined':
        return 'Lined Paper';
      case 'grid':
        return 'Grid View';
      case 'white':
      default:
        return 'White Page';
    }
  }, [editorPageView]);

  return (
    <div className="min-h-screen pb-[calc(var(--nav-h,80px)+var(--sab,0px)+2rem)] pt-2 sm:pt-4 px-3 sm:px-6 max-w-5xl mx-auto space-y-5 sm:space-y-6 overflow-x-hidden min-w-0">
      {/* Dynamic CSS Pattern definitions for Lined and Grid paper */}
      <style>{`
        .notebook-lined-bg {
          background-image: 
            linear-gradient(90deg, transparent 38px, rgba(132, 54, 233, 0.35) 39px, rgba(132, 54, 233, 0.35) 40px, transparent 41px),
            repeating-linear-gradient(transparent, transparent 31px, rgba(132, 54, 233, 0.12) 31px, rgba(132, 54, 233, 0.12) 32px);
          line-height: 32px;
          background-size: 100% 32px;
          padding-left: 48px !important;
        }
        .notebook-grid-bg {
          background-image:
            linear-gradient(to right, rgba(132, 54, 233, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(132, 54, 233, 0.12) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8436E9]/15 via-[#8436E9]/08 to-[#BAA8FE]/15 dark:from-[#8436E9]/25 dark:via-[#8436E9]/15 dark:to-[#121316] border border-[#8436E9]/20 dark:border-[#8436E9]/30 p-5 sm:p-7 shadow-xs">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8436E9]/10 dark:bg-[#BAA8FE]/15 border border-[#8436E9]/20 text-[#8436E9] dark:text-[#BAA8FE] text-xs font-semibold tracking-wide">
              <NotebookPen size={13} className="shrink-0" />
              <span>Boundless Notes & Ideas</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-primary-light dark:text-primary-dark">
              Never Forget an Idea
            </h1>
            <p className="text-xs sm:text-sm text-secondary-light dark:text-secondary-dark max-w-xl leading-relaxed">
              Write down fast thoughts, brainstorms, concepts, or reminders. Infinite length pages, custom lined or grid views, and monthly auto-history.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewNote}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#8436E9] hover:bg-[#7225D4] text-white font-bold text-sm shadow-md shadow-[#8436E9]/25 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} />
            <span>New Note / Idea</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Tabs, Search & Month Filter */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between min-w-0">
        {/* Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] min-w-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('active');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'active'
                ? 'bg-white dark:bg-[#1E1929] text-[#8436E9] dark:text-[#BAA8FE] shadow-xs'
                : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
            }`}
          >
            Active Ideas ({allNotes.filter((n) => !n.isArchived && n.monthKey === selectedMonth).length})
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('archived');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeTab === 'archived'
                ? 'bg-white dark:bg-[#1E1929] text-[#8436E9] dark:text-[#BAA8FE] shadow-xs'
                : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
            }`}
          >
            <Archive size={14} />
            <span>Monthly Archives ({allNotes.filter((n) => n.isArchived || n.monthKey !== currentMonthKey).length})</span>
          </button>
        </div>

        {/* Month Selector & Search Box */}
        <div className="flex items-center gap-2 min-w-0">
          {activeTab === 'active' && (
            <div className="relative shrink-0">
              <select
                value={selectedMonth}
                onChange={(e) => {
                  triggerHaptic('light');
                  setSelectedMonth(e.target.value);
                }}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-2xl text-xs font-bold bg-white/70 dark:bg-[#1E1929]/70 border border-[#8436E9]/20 dark:border-[#8436E9]/30 text-primary-light dark:text-primary-dark focus:outline-none focus:ring-2 focus:ring-[#8436E9]"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m === currentMonthKey ? `Current (${m})` : m}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8436E9] dark:text-[#BAA8FE]"
              />
            </div>
          )}

          <div className="relative flex-1 md:w-64 min-w-0">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-light dark:text-secondary-dark"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search thoughts & notes..."
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl text-xs bg-white/70 dark:bg-[#1E1929]/70 border border-[#8436E9]/20 dark:border-[#8436E9]/30 text-primary-light dark:text-primary-dark placeholder:text-secondary-light/60 dark:placeholder:text-secondary-dark/60 focus:outline-none focus:ring-2 focus:ring-[#8436E9]"
            />
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {displayedNotes.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-[#8436E9]/20 dark:border-[#8436E9]/30 bg-[#8436E9]/04 dark:bg-[#8436E9]/08 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#8436E9]/10 dark:bg-[#BAA8FE]/15 flex items-center justify-center text-[#8436E9] dark:text-[#BAA8FE]">
            <NotebookPen size={28} />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-primary-light dark:text-primary-dark">
              {searchQuery ? 'No matching notes found' : 'No notes recorded for this period'}
            </h3>
            <p className="text-xs text-secondary-light dark:text-secondary-dark">
              {searchQuery
                ? 'Try another keyword or search query.'
                : 'Capture your first thought or brainstorm. It will stay safely preserved forever.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              type="button"
              onClick={handleOpenNewNote}
              className="px-4 py-2 rounded-xl bg-[#8436E9] text-white text-xs font-bold hover:bg-[#7225D4] transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={14} /> Add First Note
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {displayedNotes.map((note) => {
            const pageView = note.pageView || 'white';
            return (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                onClick={() => handleOpenExistingNote(note)}
                className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl border cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 min-w-0 ${
                  pageView === 'lined'
                    ? 'notebook-lined-bg border-[#8436E9]/20 dark:border-[#8436E9]/30 bg-white dark:bg-[#1A1624]'
                    : pageView === 'grid'
                    ? 'notebook-grid-bg border-[#8436E9]/20 dark:border-[#8436E9]/30 bg-white dark:bg-[#1A1624]'
                    : 'bg-white dark:bg-[#1A1624] border-[#8436E9]/15 dark:border-[#8436E9]/25 shadow-xs'
                }`}
              >
                {/* Note Top Meta */}
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#8436E9]/10 dark:bg-[#BAA8FE]/15 text-[#8436E9] dark:text-[#BAA8FE]">
                      {pageView === 'white' ? 'White Page' : pageView === 'lined' ? 'Lined Rule' : 'Grid Paper'}
                    </span>
                    <span className="text-[11px] text-secondary-light/70 dark:text-secondary-dark/70 whitespace-nowrap">
                      {format(new Date(note.updatedAt || note.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-primary-light dark:text-primary-dark line-clamp-1 break-words">
                    {note.title || 'Untitled Thought'}
                  </h3>

                  <p className="text-xs text-secondary-light dark:text-secondary-dark line-clamp-4 whitespace-pre-wrap break-words">
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
                      className="p-1.5 rounded-lg hover:bg-[#8436E9]/10 text-[#8436E9] dark:text-[#BAA8FE] transition-colors"
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className={`w-full max-w-4xl my-auto rounded-3xl border border-[#8436E9]/25 dark:border-[#8436E9]/35 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 min-w-0 ${
                editorPageView === 'lined'
                  ? 'notebook-lined-bg bg-white dark:bg-[#161220] text-primary-light dark:text-primary-dark'
                  : editorPageView === 'grid'
                  ? 'notebook-grid-bg bg-white dark:bg-[#161220] text-primary-light dark:text-primary-dark'
                  : 'bg-white dark:bg-[#161220] text-primary-light dark:text-primary-dark'
              }`}
            >
              {/* Modal Top Bar: Split cleanly between segmented paper picker and actions */}
              <div className="px-4 sm:px-6 py-3 border-b border-black/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#1E1929]/80 backdrop-blur-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 min-w-0">
                {/* 1. Paper Style Segmented Control (Strictly 3 segments, equal width) */}
                <div className="flex items-center gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-2xl min-w-0 flex-1 sm:max-w-md">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setEditorPageView('white');
                    }}
                    className={`flex-1 min-w-0 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      editorPageView === 'white'
                        ? 'bg-white dark:bg-[#2B233C] text-[#8436E9] dark:text-[#BAA8FE] shadow-xs'
                        : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                    }`}
                  >
                    <FileText size={13} className="shrink-0" />
                    <span className="truncate">White Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setEditorPageView('lined');
                    }}
                    className={`flex-1 min-w-0 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      editorPageView === 'lined'
                        ? 'bg-white dark:bg-[#2B233C] text-[#8436E9] dark:text-[#BAA8FE] shadow-xs'
                        : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                    }`}
                  >
                    <AlignLeft size={13} className="shrink-0" />
                    <span className="truncate">Lined Paper</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setEditorPageView('grid');
                    }}
                    className={`flex-1 min-w-0 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      editorPageView === 'grid'
                        ? 'bg-white dark:bg-[#2B233C] text-[#8436E9] dark:text-[#BAA8FE] shadow-xs'
                        : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                    }`}
                  >
                    <Grid3X3 size={13} className="shrink-0" />
                    <span className="truncate">Grid View</span>
                  </button>
                </div>

                {/* 2. Separate Primary Action & Close Button */}
                <div className="flex items-center justify-end gap-2 shrink-0 min-w-0">
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    disabled={saveStatus === 'saving'}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#8436E9] hover:bg-[#7225D4] text-white text-xs font-bold shadow-md shadow-[#8436E9]/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 whitespace-nowrap shrink-0"
                  >
                    {saveStatus === 'saved' ? (
                      <>
                        <Check size={14} className="shrink-0" />
                        <span>Saved!</span>
                      </>
                    ) : saveStatus === 'saving' ? (
                      <>
                        <RefreshCw size={14} className="shrink-0 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} className="shrink-0" />
                        <span>Save Idea</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseEditor}
                    aria-label="Close note editor"
                    className="p-2 rounded-xl text-secondary-light hover:text-primary-light hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Draft Recovery Notification Banner */}
              {draftAlert && (
                <div className="px-5 sm:px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <CloudOff size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                    <span className="truncate">{draftAlert}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline shrink-0"
                  >
                    Discard
                  </button>
                </div>
              )}

              {/* Title Header Input */}
              <div className="px-5 sm:px-8 pt-5 pb-3 border-b border-black/[0.04] dark:border-white/[0.04] space-y-2 min-w-0">
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  placeholder="Note Title or Idea Name..."
                  className="w-full text-lg sm:text-2xl font-black bg-transparent text-primary-light dark:text-primary-dark placeholder:text-secondary-light/40 dark:placeholder:text-secondary-dark/40 focus:outline-none"
                />

                {/* Meta Row: date • note type • sync status (Inline dots, stacks cleanly on narrow viewports without orphaned dots) */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8436E9] dark:text-[#BAA8FE] font-semibold">
                  <span className="whitespace-nowrap">{formattedNoteDate}</span>
                  <span aria-hidden="true" className="opacity-40 select-none">
                    •
                  </span>
                  <span className="whitespace-nowrap">{pageViewLabel}</span>
                  <span aria-hidden="true" className="opacity-40 select-none">
                    •
                  </span>
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    {saveStatus === 'saving' ? (
                      <>
                        <RefreshCw size={11} className="animate-spin shrink-0" />
                        <span>Syncing to Cloud...</span>
                      </>
                    ) : isOnline ? (
                      <>
                        <Cloud size={12} className="shrink-0 text-emerald-500" />
                        <span>Auto-saved to Cloud</span>
                      </>
                    ) : (
                      <>
                        <Smartphone size={12} className="shrink-0 text-amber-500" />
                        <span>Saved on this device</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Content Editor: Expands naturally with content (no massive empty dead area when empty) */}
              <div className="p-5 sm:p-8 flex-1 min-h-0 flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  placeholder="Start writing your thoughts, ideas, brainstorms, formulas, or reminders... There is no limit to this page."
                  className={`w-full min-h-[140px] sm:min-h-[200px] bg-transparent resize-none focus:outline-none text-sm sm:text-base leading-relaxed text-primary-light dark:text-primary-dark placeholder:text-secondary-light/40 dark:placeholder:text-secondary-dark/40 ${
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
