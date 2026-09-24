import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  Copy,
  CheckCircle2,
  ListTodo,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { Modal } from '../components/BottomSheet';
import M3Button from '../components/m3/M3Button';
import {
  createShoppingList,
  createListFromTemplate,
  calculateListProgress,
  STARTER_TEMPLATES,
} from '../utils/shoppingStorage';
import { useM3Feedback } from '../components/m3/M3FeedbackContext';
import type { AppData, ShoppingList } from '../types';

interface ShoppingListsProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function ShoppingLists({ data, updateData }: ShoppingListsProps) {
  const { confirmDelete, showSavedFeedback } = useM3Feedback();
  const navigate = useNavigate();
  const allLists = useMemo(() => data?.shoppingLists || [], [data?.shoppingLists]);

  const activeLists = useMemo(
    () => allLists.filter(l => !l.isTemplate).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [allLists]
  );

  const templates = useMemo(
    () => allLists.filter(l => l.isTemplate).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [allLists]
  );

  // New List Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newMode, setNewMode] = useState<'scratch' | 'template'>('scratch');
  const [newListName, setNewListName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [listToDelete, setListToDelete] = useState<ShoppingList | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (showNewModal && newMode === 'scratch') {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [showNewModal, newMode]);

  const handleCreateScratch = async () => {
    const trimmed = newListName.trim() || 'My Shopping List';
    triggerHaptic('success');
    const newList = createShoppingList(trimmed, false);
    const updated = [...allLists, newList];
    await updateData({ shoppingLists: updated });
    setShowNewModal(false);
    setNewListName('');
    navigate(`/shopping/${newList.id}`);
  };

  const handleCreateFromTemplate = async (template: ShoppingList, customName?: string) => {
    triggerHaptic('success');
    const name = customName?.trim() || template.name.replace(/\s*\(Template\)$/i, '');
    const newList = createListFromTemplate(template, name);
    const updated = [...allLists, newList];
    await updateData({ shoppingLists: updated });
    setShowNewModal(false);
    setNewListName('');
    showSavedFeedback({
      title: 'List Created!',
      message: newList.name,
      section: 'shopping',
    });
    navigate(`/shopping/${newList.id}`);
  };

  const handleCreateStarterTemplate = async (starter: typeof STARTER_TEMPLATES[0]) => {
    triggerHaptic('success');
    const newList = createShoppingList(starter.name, false, starter.items);
    const updated = [...allLists, newList];
    await updateData({ shoppingLists: updated });
    showSavedFeedback({
      title: 'Template Added!',
      message: newList.name,
      section: 'shopping',
    });
    navigate(`/shopping/${newList.id}`);
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;
    await confirmDelete({
      title: 'Delete Shopping List?',
      itemName: listToDelete.name,
      message: 'Are you sure you want to delete this shopping list and all its checklist items?',
      section: 'shopping',
      onConfirm: async () => {
        const updated = allLists.filter(l => l.id !== listToDelete.id);
        await updateData({ shoppingLists: updated });
        setListToDelete(null);
      },
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-28 space-y-7 animate-fade-in">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-ping" />
            <span className="text-[10.5px] font-tag font-bold tracking-wider uppercase text-[var(--text-muted)]">
              Checklists & Outings
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Shopping Lists
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Organize items before heading out, check off while shopping, and reuse templates.
          </p>
        </div>

        <M3Button
          onClick={() => {
            setNewMode('scratch');
            setNewListName('');
            setShowNewModal(true);
          }}
          icon={<Plus size={16} strokeWidth={2.8} />}
          size="sm"
          className="shrink-0"
        >
          New List
        </M3Button>
      </div>

      {/* ── Empty State ── */}
      {allLists.length === 0 && (
        <div className="rounded-[32px] p-6 sm:p-8 liquid-glass border border-[var(--card-border)] text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-[22px] bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30 flex items-center justify-center text-[var(--accent-primary)]">
            <ShoppingBag size={28} strokeWidth={2.2} />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-lg sm:text-xl font-heading font-bold text-[var(--text-primary)]">
              No Shopping Lists Yet
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Create a checklist for your next store run or weekend outing, or tap a starter template to get going instantly.
            </p>
          </div>

          <div className="pt-2">
            <p className="label-mono text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Starter Outing Templates
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {STARTER_TEMPLATES.map(starter => (
                <button
                  key={starter.name}
                  onClick={() => handleCreateStarterTemplate(starter)}
                  className="p-3.5 rounded-[20px] bg-[var(--card-surface)]/80 border border-[var(--card-border)] hover:border-[var(--accent-primary)]/50 transition-all text-left group active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[9.5px] font-tag font-semibold uppercase px-2 py-0.5 rounded-full bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)]">
                      {starter.category}
                    </span>
                    <ArrowRight size={13} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
                  </div>
                  <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                    {starter.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] font-stat mt-1">
                    {starter.items.length} items
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Active Lists Section ── */}
      {activeLists.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ListTodo size={15} className="text-[var(--accent-primary)]" />
              <h2 className="text-xs font-bold font-tag uppercase tracking-wider text-[var(--text-secondary)]">
                Active Lists · <span className="font-stat">{activeLists.length}</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {activeLists.map(list => {
              const { checkedCount, totalCount, percent } = calculateListProgress(list);
              const isAllDone = totalCount > 0 && checkedCount === totalCount;

              return (
                <motion.div
                  key={list.id}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    triggerHaptic('nav');
                    navigate(`/shopping/${list.id}`);
                  }}
                  className={`card p-4 sm:p-5 rounded-[24px] cursor-pointer transition-all border select-none ${
                    isAllDone
                      ? 'border-emerald-500/30 bg-[var(--card-surface)]/70'
                      : 'border-[var(--card-border)] hover:border-[var(--accent-primary)]/50 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">
                        {list.name}
                      </h3>
                      <p className="text-[10px] font-tag text-[var(--text-muted)] mt-0.5">
                        Updated {format(new Date(list.updatedAt), 'MMM d, h:mm a')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('light');
                        setListToDelete(list);
                      }}
                      className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete List"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Progress Row */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-stat text-[var(--text-secondary)] font-medium">
                        {totalCount === 0 ? 'No items yet' : `${checkedCount}/${totalCount} checked`}
                      </span>
                      <span className={`font-stat font-bold text-[11px] ${isAllDone ? 'text-emerald-500' : 'text-[var(--accent-primary)]'}`}>
                        {percent}%
                      </span>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isAllDone ? 'bg-emerald-500' : 'bg-[var(--accent-primary)]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Saved Templates Section ── */}
      {templates.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-purple-500" />
              <h2 className="text-xs font-bold font-tag uppercase tracking-wider text-[var(--text-secondary)]">
                Saved Templates · <span className="font-stat">{templates.length}</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {templates.map(tmpl => {
              const itemCount = tmpl.items.length;

              return (
                <div
                  key={tmpl.id}
                  className="card p-4 sm:p-5 rounded-[24px] border border-[var(--card-border)] bg-[var(--card-surface)]/80 flex flex-col justify-between gap-3 select-none"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-tag font-bold tracking-wider uppercase bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)]">
                          TEMPLATE
                        </span>
                        <span className="text-[10px] font-stat text-[var(--text-muted)]">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">
                        {tmpl.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setListToDelete(tmpl);
                      }}
                      className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--card-border)]/50">
                    <button
                      onClick={() => {
                        triggerHaptic('nav');
                        navigate(`/shopping/${tmpl.id}`);
                      }}
                      className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      Edit Items
                    </button>

                    <button
                      onClick={() => handleCreateFromTemplate(tmpl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)] text-xs font-bold hover:bg-[var(--accent-primary)] hover:text-white transition-all active:scale-95"
                    >
                      <Plus size={13} strokeWidth={2.6} />
                      <span>Start Outing</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── New List Flow Modal ── */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)}>
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
              Create Shopping List
            </h3>
            <button
              onClick={() => setShowNewModal(false)}
              className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Path Toggle: Scratch vs Template */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--card-border)]">
            <button
              onClick={() => {
                triggerHaptic('light');
                setNewMode('scratch');
              }}
              className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                newMode === 'scratch'
                  ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              From Scratch
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setNewMode('template');
                if (templates.length > 0 && !selectedTemplateId) {
                  setSelectedTemplateId(templates[0].id);
                  setNewListName(templates[0].name.replace(/\s*\(Template\)$/i, ''));
                }
              }}
              className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                newMode === 'template'
                  ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              From Template
            </button>
          </div>

          {newMode === 'scratch' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  List Name
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateScratch();
                  }}
                  placeholder="e.g. Trader Joe's, Target, Weekend BBQ..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-[var(--card-surface)] border border-[var(--card-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateScratch}
                  className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all"
                >
                  Create List
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.length === 0 ? (
                <div className="text-center p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-surface)]/60 space-y-2">
                  <p className="text-xs text-[var(--text-muted)]">No custom templates saved yet.</p>
                  <p className="text-xs text-[var(--text-secondary)]">Pick a starter template to get started:</p>
                  <div className="flex flex-col gap-2 pt-1">
                    {STARTER_TEMPLATES.map(st => (
                      <button
                        key={st.name}
                        onClick={() => handleCreateStarterTemplate(st)}
                        className="p-2.5 rounded-xl border border-[var(--card-border)] hover:border-[var(--accent-primary)]/40 text-left text-xs font-bold text-[var(--text-primary)] flex items-center justify-between"
                      >
                        <span>{st.name}</span>
                        <span className="font-stat text-[10px] text-[var(--text-muted)]">{st.items.length} items</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Select Template
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {templates.map(tmpl => {
                        const isSelected = selectedTemplateId === tmpl.id;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => {
                              setSelectedTemplateId(tmpl.id);
                              setNewListName(tmpl.name.replace(/\s*\(Template\)$/i, ''));
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'border-[var(--accent-primary)] bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] font-bold'
                                : 'border-[var(--card-border)] hover:border-[var(--card-border)]/80 text-[var(--text-primary)]'
                            }`}
                          >
                            <span className="text-xs truncate">{tmpl.name}</span>
                            <span className="text-[10px] font-stat opacity-75">{tmpl.items.length} items</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      List Name
                    </label>
                    <input
                      type="text"
                      value={newListName}
                      onChange={e => setNewListName(e.target.value)}
                      placeholder="Name for this outing..."
                      className="w-full px-4 py-2 rounded-2xl bg-[var(--card-surface)] border border-[var(--card-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setShowNewModal(false)}
                      className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const chosen = templates.find(t => t.id === selectedTemplateId) || templates[0];
                        if (chosen) handleCreateFromTemplate(chosen, newListName);
                      }}
                      className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all"
                    >
                      Create from Template
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal isOpen={!!listToDelete} onClose={() => setListToDelete(null)}>
        <div className="space-y-4 pt-1 text-left">
          <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
            Delete List
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete{' '}
            <strong className="text-[var(--text-primary)] font-bold">"{listToDelete?.name}"</strong>? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setListToDelete(null)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteList}
              className="px-4 py-2 rounded-full bg-red-500 text-white text-xs font-bold shadow-md hover:bg-red-600 active:scale-95 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
