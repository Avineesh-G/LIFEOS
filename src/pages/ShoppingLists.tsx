/**
 * LifeOS — ShoppingLists Component (iOS 26 Liquid Glass)
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Plus,
  Trash,
  ListChecks,
  Stack,
  ArrowRight,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import {
  createShoppingList,
  createListFromTemplate,
  calculateListProgress,
  STARTER_TEMPLATES,
} from '../utils/shoppingStorage';
import { useM3Feedback } from '../components/m3/M3FeedbackContext';
import { LargeTitleHeader } from '../ui/navigation/LargeTitleHeader';
import { Button } from '../ui/controls/Button';
import { Segmented } from '../ui/controls/Segmented';
import { TextField } from '../ui/controls/TextField';
import { ProgressBar } from '../ui/visualization/ProgressBar';
import { EmptyState } from '../ui/feedback/EmptyState';
import { Sheet } from '../ui/feedback/Sheet';
import { Badge } from '../ui/controls/Badge';
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
      title: 'List Created',
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
      title: 'Template Added',
      message: newList.name,
      section: 'shopping',
    });
    navigate(`/shopping/${newList.id}`);
  };

  const handleDeleteList = async (list: ShoppingList) => {
    await confirmDelete({
      title: 'Delete Shopping List?',
      itemName: list.name,
      message: 'Are you sure you want to delete this shopping list and all its checklist items?',
      section: 'shopping',
      onConfirm: async () => {
        const updated = allLists.filter(l => l.id !== list.id);
        await updateData({ shoppingLists: updated });
      },
    });
  };

  return (
    <div className="w-full text-white pb-2">
      <LargeTitleHeader
        title="Shopping"
        subtitle="Checklists, store runs, and templates"
        onBack={() => navigate('/')}
        actions={
          <button
            onClick={() => {
              triggerHaptic('light');
              setNewMode('scratch');
              setNewListName('');
              setShowNewModal(true);
            }}
            className="p-2 rounded-full bg-[#FF375F]/15 text-[#FF375F] hover:bg-[#FF375F]/25 transition-colors"
            title="New List"
          >
            <Plus size={20} weight="bold" />
          </button>
        }
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* ── Empty State ── */}
        {allLists.length === 0 && (
          <div className="space-y-6">
            <EmptyState
              icon={<ShoppingBag size={36} weight="light" className="text-[#FF375F]" />}
              title="No Shopping Lists Yet"
              description="Create a checklist for your next store run or weekend outing, or tap a starter template below."
              actionLabel="Create List"
              onAction={() => setShowNewModal(true)}
              tint="#FF375F"
            />

            <div className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-[#8E8E93] font-semibold px-1">
                Starter Outing Templates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {STARTER_TEMPLATES.map((starter) => (
                  <button
                    key={starter.name}
                    onClick={() => handleCreateStarterTemplate(starter)}
                    className="p-4 rounded-2xl bg-[#1C1C1E] border border-white/[0.08] hover:border-[#FF375F]/40 transition-all text-left group active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <Badge label={starter.category} color="#8E8E93" />
                      <ArrowRight size={14} className="text-[#8E8E93] group-hover:text-[#FF375F] transition-colors" />
                    </div>
                    <p className="text-sm font-semibold text-white leading-tight">
                      {starter.name}
                    </p>
                    <p className="text-xs text-[#8E8E93] mt-1">
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
            <div className="flex items-center gap-2 px-1">
              <ListChecks size={18} weight="bold" className="text-[#FF375F]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                Active Lists · {activeLists.length}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeLists.map((list) => {
                const { checkedCount, totalCount, percent } = calculateListProgress(list);
                const isAllDone = totalCount > 0 && checkedCount === totalCount;

                return (
                  <div
                    key={list.id}
                    onClick={() => {
                      triggerHaptic('nav');
                      navigate(`/shopping/${list.id}`);
                    }}
                    className={`p-4 rounded-2xl cursor-pointer transition-all border select-none ${
                      isAllDone
                        ? 'border-[#30D158]/30 bg-[#1C1C1E]'
                        : 'border-white/[0.08] bg-[#1C1C1E] hover:border-[#FF375F]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base text-white truncate">
                          {list.name}
                        </h3>
                        <p className="text-xs text-[#8E8E93] mt-0.5">
                          Updated {format(new Date(list.updatedAt), 'MMM d, h:mm a')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerHaptic('light');
                          handleDeleteList(list);
                        }}
                        className="p-2 rounded-xl text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
                        title="Delete List"
                      >
                        <Trash size={15} />
                      </button>
                    </div>

                    {/* Progress Row */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#8E8E93]">
                          {totalCount === 0 ? 'No items yet' : `${checkedCount}/${totalCount} checked`}
                        </span>
                        <span className="font-semibold text-[#FF375F]">
                          {percent}%
                        </span>
                      </div>

                      <ProgressBar
                        progress={percent / 100}
                        color={isAllDone ? '#30D158' : '#FF375F'}
                        height={6}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Saved Templates Section ── */}
        {templates.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 px-1">
              <Stack size={18} weight="bold" className="text-[#BF5AF2]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                Saved Templates · {templates.length}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map((tmpl) => {
                const itemCount = tmpl.items.length;

                return (
                  <div
                    key={tmpl.id}
                    className="p-4 rounded-2xl border border-white/[0.08] bg-[#1C1C1E] flex flex-col justify-between gap-3 select-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge label="TEMPLATE" color="#BF5AF2" />
                          <span className="text-xs text-[#8E8E93]">
                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        <h3 className="font-semibold text-base text-white truncate">
                          {tmpl.name}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          handleDeleteList(tmpl);
                        }}
                        className="p-2 rounded-xl text-[#8E8E93] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
                        title="Delete Template"
                      >
                        <Trash size={15} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.04]">
                      <button
                        onClick={() => {
                          triggerHaptic('nav');
                          navigate(`/shopping/${tmpl.id}`);
                        }}
                        className="text-xs font-semibold text-[#8E8E93] hover:text-white transition-colors"
                      >
                        Edit Items
                      </button>

                      <Button
                        size="sm"
                        variant="glass"
                        icon={<Plus size={14} weight="bold" />}
                        onClick={() => handleCreateFromTemplate(tmpl)}
                      >
                        Start Outing
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── New List Sheet ── */}
      <Sheet
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create Shopping List"
      >
        <div className="space-y-4">
          <Segmented
            options={[
              { value: 'scratch', label: 'From Scratch' },
              { value: 'template', label: 'From Template' },
            ]}
            value={newMode}
            onChange={(val) => {
              triggerHaptic('light');
              setNewMode(val as 'scratch' | 'template');
              if (val === 'template' && templates.length > 0 && !selectedTemplateId) {
                setSelectedTemplateId(templates[0].id);
                setNewListName(templates[0].name.replace(/\s*\(Template\)$/i, ''));
              }
            }}
            tint="#FF375F"
          />

          {newMode === 'scratch' ? (
            <div className="space-y-4">
              <TextField
                label="List Name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateScratch();
                }}
                placeholder="e.g. Trader Joe's, Target, Weekend BBQ..."
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="glass" onClick={() => setShowNewModal(false)}>
                  Cancel
                </Button>
                <Button variant="prominent" tint="#FF375F" onClick={handleCreateScratch}>
                  Create List
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.length === 0 ? (
                <div className="text-center p-4 rounded-2xl border border-white/[0.08] bg-[#2C2C2E] space-y-3">
                  <p className="text-xs text-[#8E8E93]">No custom templates saved yet.</p>
                  <p className="text-xs text-white font-medium">Pick a starter template:</p>
                  <div className="flex flex-col gap-2 pt-1">
                    {STARTER_TEMPLATES.map((st) => (
                      <button
                        key={st.name}
                        onClick={() => handleCreateStarterTemplate(st)}
                        className="p-3 rounded-xl border border-white/[0.08] hover:border-[#FF375F]/40 text-left text-xs font-semibold text-white flex items-center justify-between"
                      >
                        <span>{st.name}</span>
                        <span className="text-[11px] text-[#8E8E93]">{st.items.length} items</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#8E8E93]">Select Template</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {templates.map((tmpl) => {
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
                                ? 'border-[#FF375F] bg-[#FF375F]/15 text-white font-semibold'
                                : 'border-white/[0.08] bg-[#2C2C2E] text-white'
                            }`}
                          >
                            <span className="text-xs truncate">{tmpl.name}</span>
                            <span className="text-[11px] text-[#8E8E93]">{tmpl.items.length} items</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <TextField
                    label="List Name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Name for this outing..."
                  />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="glass" onClick={() => setShowNewModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="prominent"
                      tint="#FF375F"
                      onClick={() => {
                        const chosen = templates.find((t) => t.id === selectedTemplateId) || templates[0];
                        if (chosen) handleCreateFromTemplate(chosen, newListName);
                      }}
                    >
                      Create from Template
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
