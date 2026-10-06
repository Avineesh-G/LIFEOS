/**
 * LifeOS — ShoppingListDetail Component (iOS 26 Liquid Glass)
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CaretLeft,
  Plus,
  Trash,
  BookmarkSimple,
  ArrowCounterClockwise,
  PencilSimple,
  Check,
  X,
  CaretDown,
  CaretUp,
  Circle,
  CheckCircle,
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { handleAppBack } from '../utils/backNavigation';
import { useM3Feedback } from '../components/m3/M3FeedbackContext';
import {
  generateShoppingId,
  duplicateAsTemplate,
  calculateListProgress,
} from '../utils/shoppingStorage';
import { Toolbar } from '../ui/navigation/Toolbar';
import { Button } from '../ui/controls/Button';
import { TextField } from '../ui/controls/TextField';
import { ProgressBar } from '../ui/visualization/ProgressBar';
import { Sheet } from '../ui/feedback/Sheet';
import { Badge } from '../ui/controls/Badge';
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

  // Restore drafted item
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

  // Completed items collapsible
  const [showCompletedSection, setShowCompletedSection] = useState(true);

  if (!currentList) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-lg font-bold text-white">List Not Found</h2>
        <p className="text-xs text-[#8E8E93]">This shopping list may have been removed.</p>
        <Button variant="glass" onClick={() => navigate('/shopping')}>
          Back to Shopping Lists
        </Button>
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

  // Delete item with confirmation
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
      },
    });
  };

  // Clear all checked items
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
    <div className="min-h-screen bg-black text-white pb-4 selection:bg-[#FF375F]/30">
      {/* ── Top Navigation Bar ── */}
      <Toolbar
        leading={
          <button
            onClick={() => handleAppBack(navigate)}
            className="p-2 rounded-full text-white hover:bg-white/10 active:scale-95 transition-transform"
          >
            <CaretLeft size={22} weight="bold" />
          </button>
        }
        center={
          <span className="text-sm font-semibold text-white truncate max-w-[180px]">
            {currentList.name}
          </span>
        }
        trailing={
          <div className="flex items-center gap-1">
            {!currentList.isTemplate && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setTemplateName(`${currentList.name} (Template)`);
                  setShowSaveTemplateModal(true);
                }}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                title="Save Template"
              >
                <BookmarkSimple size={20} />
              </button>
            )}
            {completedItems.length > 0 && (
              <button
                onClick={handleClearChecked}
                className="p-2 rounded-lg text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
                title="Clear Done"
              >
                <ArrowCounterClockwise size={20} />
              </button>
            )}
          </div>
        }
      />

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* ── Title & Progress Card ── */}
        <div className="p-4 rounded-2xl glass-card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {currentList.isTemplate && (
                <div className="mb-1.5">
                  <Badge label="TEMPLATE" color="#BF5AF2" />
                </div>
              )}

              {isRenaming ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename();
                      if (e.key === 'Escape') setIsRenaming(false);
                    }}
                    className="w-full text-xl font-bold text-white bg-transparent border-b border-[#FF375F] focus:outline-none pb-0.5"
                  />
                  <button
                    onClick={handleSaveRename}
                    className="p-1.5 rounded-lg bg-[#FF375F] text-white"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setIsRenaming(false)}
                    className="p-1.5 rounded-lg text-[#8E8E93] hover:bg-white/10"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={() => {
                    setEditedTitle(currentList.name);
                    setIsRenaming(true);
                  }}
                >
                  <h1 className="text-xl font-bold tracking-tight text-white truncate">
                    {currentList.name}
                  </h1>
                  <PencilSimple size={14} className="text-[#8E8E93] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-base font-bold text-white">
                {checkedCount}/{totalCount}
              </span>
              <span className="text-xs text-[#8E8E93] block">
                checked
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar
            progress={percent / 100}
            color={percent === 100 ? '#30D158' : '#FF375F'}
            height={6}
          />
        </div>

        {/* ── Quick-Add Bar ── */}
        <div className="p-2 rounded-2xl glass-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddItem();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={itemInputRef}
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Add item (e.g. Milk, Apples)..."
              className="flex-1 min-w-0 px-3 py-2 bg-transparent text-sm text-white placeholder:text-[#636366] focus:outline-none"
            />

            <input
              type="text"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              placeholder="Qty"
              className="w-20 px-2 py-1.5 glass-flat rounded-xl text-xs text-white placeholder:text-[#636366] focus:outline-none text-center"
            />

            <Button
              type="submit"
              size="sm"
              variant="prominent"
              tint="#FF375F"
              disabled={!itemName.trim()}
              icon={<Plus size={16} weight="bold" />}
            >
              Add
            </Button>
          </form>
        </div>

        {/* ── Active Items List ── */}
        <div className="space-y-2">
          {totalCount === 0 && (
            <div className="p-8 text-center rounded-2xl glass-card text-[#8E8E93] text-xs space-y-1">
              <p className="font-semibold text-sm text-white">List is empty</p>
              <p>Type above to rapidly add items. Press Enter to add without losing focus.</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {activeItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className="p-3.5 rounded-2xl glass-card flex items-center justify-between gap-3 select-none"
              >
                <div
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => handleToggleItem(item.id)}
                >
                  <Circle size={22} weight="bold" className="text-[#8E8E93] shrink-0 hover:text-[#FF375F] transition-colors" />

                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white block truncate">
                      {item.name}
                    </span>
                    {item.notes && (
                      <span className="text-xs text-[#8E8E93] block truncate">
                        {item.notes}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.quantity && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full glass-flat text-[#8E8E93] font-medium">
                      {item.quantity}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
                    title="Remove Item"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── Completed Items Section ── */}
        {completedItems.length > 0 && (
          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowCompletedSection((v) => !v);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8E8E93] hover:text-white transition-colors px-1 select-none"
            >
              <span>Completed ({completedItems.length})</span>
              {showCompletedSection ? <CaretUp size={14} /> : <CaretDown size={14} />}
            </button>

            <AnimatePresence initial={false}>
              {showCompletedSection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {completedItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-3.5 rounded-2xl glass-flat opacity-60 flex items-center justify-between gap-3 select-none"
                    >
                      <div
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        onClick={() => handleToggleItem(item.id)}
                      >
                        <CheckCircle size={22} weight="fill" className="text-[#30D158] shrink-0" />

                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium line-through text-[#8E8E93] block truncate">
                            {item.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.quantity && (
                          <span className="text-xs px-2 py-0.5 rounded-full glass-flat text-[#636366] line-through">
                            {item.quantity}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg text-[#636366] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
                          title="Remove Item"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Save as Template Sheet ── */}
      <Sheet
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        title="Save as Template"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#8E8E93] leading-relaxed">
            This saves all item names and quantities as a reusable template. Items will be unchecked in the template.
          </p>

          <TextField
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Weekly Groceries, Outing Essentials..."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="glass" onClick={() => setShowSaveTemplateModal(false)}>
              Cancel
            </Button>
            <Button variant="prominent" tint="#FF375F" onClick={handleSaveAsTemplate}>
              Save Template
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
