import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Bookmark,
  RotateCcw,
  CheckCircle2,
  Pencil,
  Check,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import InteractiveCheckbox from '../components/interactive/InteractiveCheckbox';
import { Modal } from '../components/BottomSheet';
import { useM3Feedback } from '../components/m3/M3FeedbackContext';
import {
  generateShoppingId,
  duplicateAsTemplate,
  calculateListProgress,
} from '../utils/shoppingStorage';
import type { AppData, ShoppingList, ShoppingItem } from '../types';

interface ShoppingListDetailProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function ShoppingListDetail({ data, updateData }: ShoppingListDetailProps) {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { confirmDelete, showSavedFeedback } = useM3Feedback();

  const allLists = useMemo(() => data?.shoppingLists || [], [data?.shoppingLists]);
  const currentList = useMemo(() => allLists.find(l => l.id === listId), [allLists, listId]);

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // Quick-Add Input State
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const itemInputRef = useRef<HTMLInputElement | null>(null);

  const ITEM_DRAFT_KEY = `lifeos_shopping_item_draft_${listId}`;

  // Restore drafted item if user switched interfaces
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ITEM_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.itemName) setItemName(parsed.itemName);
        if (parsed.itemQuantity) setItemQuantity(parsed.itemQuantity);
      }
    } catch {}
  }, [ITEM_DRAFT_KEY]);

  // Persist draft on typing
  useEffect(() => {
    if (itemName.trim() || itemQuantity.trim()) {
      try {
        localStorage.setItem(ITEM_DRAFT_KEY, JSON.stringify({ itemName, itemQuantity }));
      } catch {}
    }
  }, [itemName, itemQuantity, ITEM_DRAFT_KEY]);

  // Template Save Modal
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Delete Item Confirmation Modal
  const [itemToDelete, setItemToDelete] = useState<ShoppingItem | null>(null);

  // Completed items collapsible
  const [showCompletedSection, setShowCompletedSection] = useState(true);

  // If list not found, show not found screen
  if (!currentList) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-heading font-bold text-[var(--text-primary)]">List Not Found</h2>
        <p className="text-sm text-[var(--text-secondary)]">This shopping list may have been removed.</p>
        <button
          onClick={() => navigate('/shopping')}
          className="px-5 py-2.5 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold"
        >
          Back to Shopping Lists
        </button>
      </div>
    );
  }

  const { checkedCount, totalCount, percent } = calculateListProgress(currentList);

  const activeItems = useMemo(
    () => currentList.items.filter(it => !it.checked),
    [currentList.items]
  );

  const completedItems = useMemo(
    () => currentList.items.filter(it => it.checked),
    [currentList.items]
  );

  // Helper: update current list in AppData
  const updateCurrentList = async (updatedFields: Partial<ShoppingList>) => {
    const updatedList: ShoppingList = {
      ...currentList,
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    };
    const nextLists = allLists.map(l => (l.id === currentList.id ? updatedList : l));
    await updateData({ shoppingLists: nextLists });
  };

  // Quick-Add: add item and KEEP FOCUS
  const handleAddItem = async () => {
    const trimmed = itemName.trim();
    if (!trimmed) return;

    triggerHaptic('light');
    const newItem: ShoppingItem = {
      id: generateShoppingId('item'),
      name: trimmed,
      quantity: itemQuantity.trim() || undefined,
      checked: false,
    };

    const nextItems = [...currentList.items, newItem];
    await updateCurrentList({ items: nextItems });

    // Clear inputs and keep focus on item name for rapid entry
    try {
      localStorage.removeItem(ITEM_DRAFT_KEY);
    } catch {}
    setItemName('');
    setItemQuantity('');
    itemInputRef.current?.focus();
  };

  // Toggle item checked state
  const handleToggleItem = async (itemId: string) => {
    const nextItems = currentList.items.map(it => {
      if (it.id === itemId) {
        const nextChecked = !it.checked;
        triggerHaptic(nextChecked ? 'success' : 'light');
        return { ...it, checked: nextChecked };
      }
      return it;
    });
    await updateCurrentList({ items: nextItems });
  };

  // Delete item with M3 confirmation & delete symbol animation
  const handleDeleteItem = (itemId: string, name?: string) => {
    const itemTarget = currentList.items.find(it => it.id === itemId);
    const displayName = name || itemTarget?.name || 'Item';

    confirmDelete({
      title: 'Remove Item?',
      itemName: displayName,
      message: 'This item will be removed from your shopping list.',
      section: 'shopping',
      onConfirm: async () => {
        const nextItems = currentList.items.filter(it => it.id !== itemId);
        await updateCurrentList({ items: nextItems });
        setItemToDelete(null);
      },
    });
  };

  // Clear all checked items with M3 confirmation
  const handleClearChecked = () => {
    if (completedItems.length === 0) return;

    confirmDelete({
      title: 'Clear Completed?',
      itemName: `${completedItems.length} completed item${completedItems.length === 1 ? '' : 's'}`,
      message: 'All checked items will be permanently removed from this list.',
      section: 'shopping',
      onConfirm: async () => {
        const nextItems = currentList.items.filter(it => !it.checked);
        await updateCurrentList({ items: nextItems });
      },
    });
  };

  // Save as Template
  const handleSaveAsTemplate = async () => {
    const name = templateName.trim() || `${currentList.name} (Template)`;
    const newTemplate = duplicateAsTemplate(currentList, name);
    const nextLists = [...allLists, newTemplate];
    await updateData({ shoppingLists: nextLists });
    setShowSaveTemplateModal(false);

    showSavedFeedback({
      title: 'Template Created',
      message: `"${name}" saved to your shopping templates.`,
      section: 'shopping',
    });
  };

  // Rename list title
  const handleSaveRename = async () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== currentList.name) {
      triggerHaptic('light');
      await updateCurrentList({ name: trimmed });
    }
    setIsRenaming(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-6 space-y-5 animate-fade-in">
      {/* ── Top Navigation Bar ── */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            triggerHaptic('nav');
            navigate('/shopping');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>All Lists</span>
        </button>

        <div className="flex items-center gap-2">
          {!currentList.isTemplate && (
            <button
              onClick={() => {
                triggerHaptic('light');
                setTemplateName(`${currentList.name} (Template)`);
                setShowSaveTemplateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)] hover:opacity-90 active:scale-95 transition-all"
              title="Save as Template"
            >
              <Bookmark size={13} />
              <span>Save as Template</span>
            </button>
          )}

          {completedItems.length > 0 && (
            <button
              onClick={handleClearChecked}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all active:scale-95"
              title="Clear all checked items"
            >
              <RotateCcw size={13} />
              <span>Clear Done</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Title & Progress Card ── */}
      <div className="card p-5 sm:p-6 rounded-[28px] liquid-glass border border-[var(--card-border)] shadow-xs space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {currentList.isTemplate && (
              <span className="inline-block px-2 py-0.5 mb-2 rounded-full text-[9px] font-tag font-bold tracking-wider uppercase bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)]">
                TEMPLATE
              </span>
            )}

            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveRename();
                    if (e.key === 'Escape') setIsRenaming(false);
                  }}
                  className="w-full text-xl sm:text-2xl font-heading font-bold text-[var(--text-primary)] bg-transparent border-b-2 border-[var(--accent-primary)] focus:outline-none pb-0.5"
                />
                <button
                  onClick={handleSaveRename}
                  className="p-1.5 rounded-xl bg-[var(--accent-primary)] text-white hover:opacity-90"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setIsRenaming(false)}
                  className="p-1.5 rounded-xl text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => {
                setEditedTitle(currentList.name);
                setIsRenaming(true);
              }}>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-[var(--text-primary)] truncate">
                  {currentList.name}
                </h1>
                <Pencil size={14} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <span className="text-lg sm:text-xl font-stat font-bold text-[var(--text-primary)]">
              {checkedCount}/{totalCount}
            </span>
            <span className="text-xs text-[var(--text-muted)] block font-stat">
              checked
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* ── Quick-Add Bar (Focus Retaining for Rapid Entry) ── */}
      <div className="card p-2 sm:p-2.5 rounded-[24px] liquid-glass border border-[var(--card-border)] shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddItem();
          }}
          className="flex items-center gap-2"
        >
          {/* Item Name Input */}
          <input
            ref={itemInputRef}
            type="text"
            value={itemName}
            onChange={e => setItemName(e.target.value)}
            placeholder="Add item (e.g. Milk, Bananas)..."
            className="flex-1 min-w-0 px-3.5 py-2.5 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />

          {/* Quantity Input (Optional compact) */}
          <input
            type="text"
            value={itemQuantity}
            onChange={e => setItemQuantity(e.target.value)}
            placeholder="Qty (optional)"
            className="w-24 sm:w-28 px-2.5 py-2 bg-black/5 dark:bg-white/5 rounded-xl text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] text-center"
          />

          {/* Add Button */}
          <button
            type="submit"
            disabled={!itemName.trim()}
            className="px-4 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 active:scale-95 transition-all flex items-center gap-1 shrink-0"
          >
            <Plus size={15} strokeWidth={3} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </form>
      </div>

      {/* ── Active Items List ── */}
      <div className="space-y-2">
        {totalCount === 0 && (
          <div className="p-8 text-center rounded-[24px] border border-dashed border-[var(--card-border)] text-[var(--text-muted)] text-xs space-y-1">
            <p className="font-semibold text-sm text-[var(--text-secondary)]">List is empty</p>
            <p>Type above to rapidly add items. Press Enter to add without losing focus.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {activeItems.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="card p-3.5 rounded-[22px] border border-[var(--card-border)] bg-[var(--card-surface)]/90 flex items-center justify-between gap-3 shadow-xs select-none"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <InteractiveCheckbox
                  checked={item.checked}
                  onChange={() => handleToggleItem(item.id)}
                  size={24}
                />

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleToggleItem(item.id)}
                >
                  <span className="text-sm font-semibold text-[var(--text-primary)] block truncate font-sans">
                    {item.name}
                  </span>
                  {item.notes && (
                    <span className="text-[11px] text-[var(--text-muted)] block truncate font-sans">
                      {item.notes}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.quantity && (
                  <span className="font-tag text-[10.5px] px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-secondary)] font-medium border border-[var(--card-border)]/60">
                    {item.quantity}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Remove Item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Completed Items Section ── */}
      {completedItems.length > 0 && (
        <div className="pt-3 space-y-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              setShowCompletedSection(v => !v);
            }}
            className="flex items-center gap-1.5 text-xs font-bold font-tag uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors px-1 select-none"
          >
            <span>Completed ({completedItems.length})</span>
            {showCompletedSection ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence initial={false}>
            {showCompletedSection && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {completedItems.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="card p-3.5 rounded-[22px] border border-[var(--card-border)]/60 bg-[var(--card-surface)]/50 flex items-center justify-between gap-3 select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <InteractiveCheckbox
                        checked={item.checked}
                        onChange={() => handleToggleItem(item.id)}
                        size={24}
                      />

                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleToggleItem(item.id)}
                      >
                        <span className="text-sm font-medium line-through text-[var(--text-secondary)] opacity-70 block truncate font-sans">
                          {item.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.quantity && (
                        <span className="font-tag text-[10.5px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[var(--text-muted)] line-through">
                          {item.quantity}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Save as Template Modal ── */}
      <Modal isOpen={showSaveTemplateModal} onClose={() => setShowSaveTemplateModal(false)}>
        <div className="space-y-4 pt-1 text-left">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
              Save as Template
            </h3>
            <button
              onClick={() => setShowSaveTemplateModal(false)}
              className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            This saves all item names and quantities as a reusable template. Items will be unchecked in the template.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g. Weekly Groceries, Outing Essentials..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[var(--card-surface)] border border-[var(--card-border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setShowSaveTemplateModal(false)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAsTemplate}
              className="px-5 py-2 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all"
            >
              Save Template
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
