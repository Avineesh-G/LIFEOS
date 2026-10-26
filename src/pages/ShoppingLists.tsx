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
    <div className="w-full text-white pb-2 selection:bg-[#FF375F]/30">
      <LargeTitleHeader
        title="Shopping"
        subtitle="Checklists, store runs · Saved templates"
        tint="#FF375F"
        actions={
          <button
            onClick={() => {
              triggerHaptic('light');
              setNewMode('scratch');
              setNewListName('');
              setShowNewModal(true);
            }}
            className="p-2 rounded-full glass-flat text-[#FF375F] active:scale-95 transition-transform"
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
                    className="p-4 rounded-2xl glass-card hover:bg-white/[0.08] transition-all text-left group active:scale-[0.98]"
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
                    className="p-4 rounded-2xl glass-card cursor-pointer transition-all select-none hover:bg-white/[0.08] active:scale-[0.98]"
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
                        <span className={`font-semibold ${isAllDone ? 'text-[#30D158]' : 'text-[#FF375F]'}`}>
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
                    className="p-4 rounded-2xl glass-card flex flex-col justify-between gap-3 select-none"
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

                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => handleCreateFromTemplate(tmpl)}
                      className="w-full justify-center"
                    >
                      Use Template
                    </Button>
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
        detent="half"
        title="Create Shopping List"
      >
        <div className="space-y-4 pt-2">
          <Segmented
            options={[
              { value: 'scratch', label: 'From Scratch' },
              { value: 'template', label: 'From Template' },
            ]}
            value={newMode}
            onChange={(val) => setNewMode(val as 'scratch' | 'template')}
            tint="#FF375F"
          />

          {newMode === 'scratch' ? (
            <div className="space-y-4">
              <TextField
                autoFocus
                label="List Name"
                placeholder="e.g. Weekend Grocery Run, Party Supplies"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateScratch();
                }}
              />

              <Button
                variant="prominent"
                tint="#FF375F"
                className="w-full"
                onClick={handleCreateScratch}
              >
                Create List
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#8E8E93]">
                  No templates saved yet. Create a list first and save it as a template.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {templates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`w-full p-3 rounded-xl glass-flat text-left flex items-center justify-between transition-all ${
                        selectedTemplateId === tmpl.id
                          ? 'bg-[#FF375F]/20 text-white'
                          : 'text-[rgba(235,235,245,0.70)] hover:text-white'
                      }`}
                    >
                      <span className="font-semibold text-sm">{tmpl.name}</span>
                      <span className="text-xs text-[#8E8E93]">{tmpl.items.length} items</span>
                    </button>
                  ))}
                </div>
              )}

              <Button
                variant="prominent"
                tint="#FF375F"
                className="w-full"
                disabled={!selectedTemplateId}
                onClick={() => {
                  const tmpl = templates.find((t) => t.id === selectedTemplateId);
                  if (tmpl) handleCreateFromTemplate(tmpl);
                }}
              >
                Use Selected Template
              </Button>
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
