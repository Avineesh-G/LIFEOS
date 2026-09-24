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
  RefreshCw,
  Smartphone,
  ChevronDown,
} from 'lucide-react';
import {
  LightbulbIcon,
  TargetCheckIcon,
  RocketIcon,
  NeurologyIcon,
  LocalLibraryIcon,
  ContentPasteIcon,
  ThingsToDoIcon,
  CloudDoneIcon,
  CloudOffIcon,
} from '../components/icons/MaterialSymbols';
import type { MaterialSymbolIcon } from '../components/icons/MaterialSymbols';
import { format, parseISO } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import { registerDismissible } from '../utils/backNavigation';
import {
  putNoteInIdb,
  deleteNoteFromIdb,
  bulkSyncNotesToIdb,
} from '../features/notes/storage/notesIdb';
import { useM3Feedback } from '../components/m3/M3FeedbackContext';
import { M3ProgressIndicator } from '../components/m3/M3Shapes';
import { BottomSheet } from '../components/BottomSheet';
import type { AppData, NoteItem } from '../types';

interface NotesProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

type PageViewMode = 'white' | 'lined' | 'grid';

interface NotePromptOption {
  id: string;
  icon: MaterialSymbolIcon;
  label: string;
  description: string;
  title: string;
  template: string;
  pageView: PageViewMode;
}

const NOTE_PROMPT_OPTIONS: NotePromptOption[] = [
  {
    id: 'brain-dump',
    icon: LightbulbIcon,
    label: 'Brain Dump',
    description: 'Capture unfiltered thoughts',
    title: 'Brain Dump — Fast Thoughts',
    template: '## Key Thoughts\n• \n• \n\n## Immediate Actions\n• [ ] \n• [ ] \n\n## Later Reflection\n• ',
    pageView: 'lined',
  },
  {
    id: 'weekly-goals',
    icon: TargetCheckIcon,
    label: 'Weekly Goals',
    description: 'Top 3 priorities this week',
    title: 'Weekly Priorities & Objectives',
    template: '## Top 3 Priorities\n1. \n2. \n3. \n\n## Essential Milestones\n• [ ] Mon-Tue: \n• [ ] Wed-Thu: \n• [ ] Fri-Sun: \n\n## Win Condition\n• ',
    pageView: 'grid',
  },
  {
    id: 'project-idea',
    icon: RocketIcon,
    label: 'Project Concept',
    description: 'Problem, audience & plan',
    title: 'Project Concept: ',
    template: '## The Core Problem\nWhat specific friction are we solving?\n\n## Proposed Solution\nHow does this work in practice?\n\n## Target Audience\nWho benefits from this?\n\n## Step 1 Execution\n• [ ] Prototype core flow\n• [ ] Gather initial feedback',
    pageView: 'white',
  },
  {
    id: 'meeting-notes',
    icon: NeurologyIcon,
    label: 'Meeting / Lecture',
    description: 'Takeaways & action items',
    title: 'Meeting / Lecture Notes — ',
    template: '## Attendees / Subject\n• \n\n## Core Discussion Points\n• \n• \n\n## Action Items & Owners\n• [ ] Task 1 (@owner)\n• [ ] Task 2 (@owner)\n\n## Key Decision / Next Steps\n• ',
    pageView: 'lined',
  },
  {
    id: 'daily-reflection',
    icon: LocalLibraryIcon,
    label: 'Daily Reflection',
    description: 'Wins, learnings & focus',
    title: 'Daily Reflection — ',
    template: '## Today\'s Biggest Win\n• \n\n## What I Learned Today\n• \n\n## Energy & Mindset\n• How do I feel tonight?\n\n## Focus for Tomorrow\n1. ',
    pageView: 'lined',
  },
  {
    id: 'quick-checklist',
    icon: ContentPasteIcon,
    label: 'Action Checklist',
    description: 'Fast structured checklist',
    title: 'Action Checklist: ',
    template: '## Tasks & Checklist\n- [ ] Priority 1\n- [ ] Priority 2\n- [ ] Follow up on:\n- [ ] Double check:\n- [ ] Completed & verified',
    pageView: 'grid',
  },
];

export default function Notes({ data, updateData }: NotesProps) {
  const { confirmDelete, showSavedFeedback } = useM3Feedback();
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
  const handleSelectPrompt = (prompt: NotePromptOption) => {
    triggerHaptic('medium');
    const newNote: NoteItem = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: prompt.title,
      content: prompt.template,
      pageView: prompt.pageView,
      monthKey: currentMonthKey,
      isArchived: false,
      syncStatus: isOnline ? 'synced' : 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveNote(newNote);
    setEditorTitle(prompt.title);
    setEditorContent(prompt.template);
    setEditorPageView(prompt.pageView);
    setIsEditing(true);
  };

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
      showSavedFeedback({
        title: 'Idea Saved!',
        message: updated.title || 'Saved to your notes collection',
        section: 'notes',
      });

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
    const target = (data.notes || []).find((n) => n.id === id);
    await confirmDelete({
      title: 'Delete Note?',
      itemName: target?.title || 'Untitled Note',
      message: 'Are you sure you want to delete this note? It will be permanently removed.',
      section: 'notes',
      onConfirm: async () => {
        await deleteNoteFromIdb(id);
        const filtered = (data.notes || []).filter((n) => n.id !== id);
        await updateData({ notes: filtered });
        if (activeNote?.id === id) {
          handleCloseEditor();
        }
      },
    });
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

      {/* ── Quick Starter Prompts Row ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <ThingsToDoIcon size={15} className="text-[#8436E9] dark:text-[#BAA8FE] shrink-0" />
            <span
              className="text-xs font-semibold text-primary-light dark:text-primary-dark tracking-tight truncate"
              style={{ fontFamily: 'var(--font-family-primary)', fontVariationSettings: "'wght' 600, 'ROND' 50" }}
            >
              Idea Prompts & Starter Templates
            </span>
          </div>
          <span
            className="text-[11px] text-secondary-light/70 dark:text-secondary-dark/70 font-medium whitespace-nowrap shrink-0"
            style={{ fontFamily: 'var(--font-family-primary)', fontVariationSettings: "'wght' 450, 'ROND' 40" }}
          >
            Tap to start note
          </span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none -mx-1 px-1">
          {NOTE_PROMPT_OPTIONS.map((prompt) => {
            const IconComponent = prompt.icon;
            return (
              <button
                key={prompt.id}
                type="button"
                onClick={() => handleSelectPrompt(prompt)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/70 dark:bg-[#1E1929]/70 hover:bg-[#8436E9]/10 dark:hover:bg-[#8436E9]/20 border border-[#8436E9]/20 dark:border-[#8436E9]/30 text-primary-light dark:text-primary-dark transition-all active:scale-95 shrink-0 shadow-2xs group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#8436E9]/10 dark:bg-[#BAA8FE]/15 flex items-center justify-center text-[#8436E9] dark:text-[#BAA8FE] shrink-0 group-hover:scale-110 transition-transform">
                  <IconComponent size={18} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight group-hover:text-[#8436E9] dark:group-hover:text-[#BAA8FE] transition-colors whitespace-nowrap">
                    {prompt.label}
                  </div>
                  <div className="text-[10px] text-secondary-light dark:text-secondary-dark leading-tight whitespace-nowrap">
                    {prompt.description}
                  </div>
                </div>
              </button>
            );
          })}
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

      {/* ── Add / Update Note Sheet (Identical to TO-DO List interface) ── */}
      <BottomSheet
        isOpen={isEditing}
        onClose={handleCloseEditor}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-primary-light dark:text-primary-dark font-sans tracking-tight">
              {activeNote ? 'Update Note' : 'New Note / Idea'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8436E9]/15 text-[#8436E9] dark:text-[#BAA8FE]">
              {activeNote ? 'Editing' : 'Boundless'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCloseEditor}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Draft Recovery Notification Banner */}
        {draftAlert && (
          <div className="mb-3 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2 min-w-0">
              <CloudOffIcon size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
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

        <div className="space-y-3.5">
          {/* Quick Prompts Picker in Editor */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <ThingsToDoIcon size={13} className="text-[#8436E9] dark:text-[#BAA8FE] shrink-0" />
              <span
                className="text-[11px] font-semibold text-secondary-light dark:text-secondary-dark"
                style={{ fontFamily: 'var(--font-family-primary)', fontVariationSettings: "'wght' 600, 'ROND' 50" }}
              >
                Starter Templates
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5">
              {NOTE_PROMPT_OPTIONS.map((p) => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setEditorTitle(p.title);
                      setEditorContent(p.template);
                      setEditorPageView(p.pageView);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-[#8436E9]/15 border border-[#8436E9]/25 text-[11px] font-semibold text-primary-light dark:text-primary-dark flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-colors cursor-pointer active:scale-95"
                  >
                    <IconComponent size={13} className="text-[#8436E9] dark:text-[#BAA8FE] shrink-0" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Title */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5 font-mono">
              Note Title
            </label>
            <input
              type="text"
              value={editorTitle}
              onChange={(e) => setEditorTitle(e.target.value)}
              placeholder="e.g. Complete Machine Learning assignment"
              autoFocus
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8436E9]/30 text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
            />
          </div>

          {/* Paper Style */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1.5 font-mono">
              Paper Style
            </label>
            <div className="flex items-center gap-1.5 bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setEditorPageView('white');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  editorPageView === 'white'
                    ? 'bg-white dark:bg-[#2B233C] text-[#8436E9] dark:text-[#BAA8FE] shadow-xs'
                    : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                }`}
              >
                <FileText size={13} className="shrink-0" />
                <span>White Page</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setEditorPageView('lined');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  editorPageView === 'lined'
                    ? 'bg-white dark:bg-[#2B233C] text-[#8436E9] dark:text-[#BAA8FE] shadow-xs'
                    : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                }`}
              >
                <AlignLeft size={13} className="shrink-0" />
                <span>Lined Paper</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setEditorPageView('grid');
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  editorPageView === 'grid'
                    ? 'bg-white dark:bg-[#2B233C] text-[#8436E9] dark:text-[#BAA8FE] shadow-xs'
                    : 'text-secondary-light dark:text-secondary-dark hover:text-primary-light'
                }`}
              >
                <Grid3X3 size={13} className="shrink-0" />
                <span>Grid View</span>
              </button>
            </div>
          </div>

          {/* Note Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
                Note Content / Body
              </label>
              <div className="flex items-center gap-1.5 text-[10.5px] text-secondary-light dark:text-secondary-dark">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CloudDoneIcon size={12} className="shrink-0" /> Cloud Synced
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <Smartphone size={11} /> Saved Locally
                  </span>
                )}
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder="Start writing your thoughts, ideas, brainstorms, formulas, or reminders... There is no limit to this page."
              className={`w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8436E9]/30 text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark min-h-[160px] sm:min-h-[200px] resize-none leading-relaxed ${
                editorPageView === 'lined'
                  ? 'notebook-lined-bg'
                  : editorPageView === 'grid'
                  ? 'notebook-grid-bg'
                  : ''
              }`}
            />
          </div>

          {/* Actions: Cancel & Save */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={handleCloseEditor}
              className="py-3 rounded-2xl border border-border-light/80 dark:border-border-dark/80 text-secondary-light dark:text-secondary-dark font-bold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              disabled={saveStatus === 'saving' || (!editorTitle.trim() && !editorContent.trim())}
              className="py-3 rounded-2xl bg-[#8436E9] hover:bg-[#7225D4] text-white font-bold text-xs shadow-md shadow-[#8436E9]/25 hover:opacity-95 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {saveStatus === 'saved' ? (
                <>
                  <Check size={14} />
                  <span>Saved!</span>
                </>
              ) : saveStatus === 'saving' ? (
                <>
                  <M3ProgressIndicator size={14} color="#FFFFFF" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{activeNote ? 'Update Note' : 'Save Idea'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
