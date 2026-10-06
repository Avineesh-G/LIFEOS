import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import type { AppData, NoteItem } from '../types';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  SearchPill,
  Button,
  Sheet,
  TextField,
  EmptyState,
  NotePencil,
  Plus,
} from '../ui';

interface NotesProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function Notes({ data, updateData }: NotesProps) {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Editor fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const notesList = useMemo(() => {
    return data.notes || [];
  }, [data.notes]);

  const filteredNotes = useMemo(() => {
    if (!search.trim()) return notesList;
    const q = search.toLowerCase();
    return notesList.filter(
      (n) => n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
    );
  }, [notesList, search]);

  const handleOpenNewNote = () => {
    triggerHaptic('light');
    setEditingNote(null);
    setTitle('');
    setContent('');
    setIsEditorOpen(true);
  };

  const handleOpenExistingNote = (note: NoteItem) => {
    triggerHaptic('selection');
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content || '');
    setIsEditorOpen(true);
  };

  const handleSaveNote = async () => {
    if (!title.trim() && !content.trim()) return;
    triggerHaptic('success');

    const nowIso = new Date().toISOString();
    let updatedList: NoteItem[];

    if (editingNote) {
      updatedList = (data.notes || []).map((n) =>
        n.id === editingNote.id
          ? { ...n, title: title.trim() || 'Untitled Note', content, updatedAt: nowIso }
          : n
      );
    } else {
      const newNote: NoteItem = {
        id: `note_${Date.now()}`,
        title: title.trim() || 'Untitled Note',
        content,
        pageView: 'white',
        monthKey: format(new Date(), 'yyyy-MM'),
        isArchived: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      updatedList = [newNote, ...(data.notes || [])];
    }

    await updateData({ notes: updatedList });
    setIsEditorOpen(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    triggerHaptic('error');
    const updatedList = (data.notes || []).filter((n) => n.id !== noteId);
    await updateData({ notes: updatedList });
    setIsEditorOpen(false);
  };

  return (
    <div className="w-full text-white selection:bg-[#FFD60A]/30">
      <LargeTitleHeader
        title="Notes & Ideas"
        subtitle={`${notesList.length} notes stored · Fast search & markdown`}
        tint="#FFD60A"
        actions={
          <Button
            variant="glass"
            tint="#FFD60A"
            size="sm"
            onClick={handleOpenNewNote}
            icon={<Plus size={16} weight="bold" />}
          >
            New Note
          </Button>
        }
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* Search Pill */}
        <SearchPill
          value={search}
          onChange={setSearch}
          placeholder="Search all notes..."
        />

        {/* Notes Grouped List */}
        {filteredNotes.length === 0 ? (
          <EmptyState
            icon={<NotePencil weight="bold" />}
            title="No Notes Found"
            description="Jot down concepts, ideas, meeting notes and project architectures."
            actionLabel="Create First Note"
            onAction={handleOpenNewNote}
            tint="#FFD60A"
          />
        ) : (
          <GroupedList header="All Notes">
            {filteredNotes.map((note) => (
              <ListRow
                key={note.id}
                icon={<NotePencil weight="bold" />}
                iconTint="#FFD60A"
                title={note.title}
                subtitle={
                  note.content
                    ? note.content.slice(0, 45).replace(/\n/g, ' ') + '...'
                    : 'No additional text'
                }
                trailing={
                  note.updatedAt ? format(new Date(note.updatedAt), 'MMM d') : undefined
                }
                showChevron
                onClick={() => handleOpenExistingNote(note)}
              />
            ))}
          </GroupedList>
        )}
      </div>

      {/* Note Editor Sheet */}
      <Sheet
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        detent="full"
        title={editingNote ? 'Edit Note' : 'New Note'}
        footer={
          <div className="flex items-center gap-3">
            {editingNote && (
              <Button
                variant="destructive"
                size="md"
                onClick={() => handleDeleteNote(editingNote.id)}
              >
                Delete
              </Button>
            )}
            <Button
              variant="prominent"
              tint="#FFD60A"
              className="flex-1 text-black font-bold"
              onClick={handleSaveNote}
            >
              Save Note
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-1">
          <TextField
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your note in Markdown or plain text..."
            rows={12}
            className="w-full min-h-[260px] glass-flat text-white p-4 rounded-[20px] text-[16px] placeholder-[rgba(235,235,245,0.40)] focus:outline-none resize-none leading-relaxed"
          />
        </div>
      </Sheet>
    </div>
  );
}
