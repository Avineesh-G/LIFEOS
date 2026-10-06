/**
 * LifeOS — Laundry Component (iOS 26 Liquid Glass)
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TShirt,
  Plus,
  Minus,
  Check,
  CalendarBlank,
  Clock,
  Trash,
  PencilSimple,
  CaretDown,
  CaretUp,
  Package,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import InteractiveLaundryDrum from '../components/interactive/InteractiveLaundryDrum';
import { LargeTitleHeader } from '../ui/navigation/LargeTitleHeader';
import { Button } from '../ui/controls/Button';
import { Badge } from '../ui/controls/Badge';
import { Stepper } from '../ui/controls/Stepper';
import { Sheet } from '../ui/feedback/Sheet';
import { EmptyState } from '../ui/feedback/EmptyState';
import { TextField } from '../ui/controls/TextField';
import { useM3Feedback } from '../components/m3/M3FeedbackContext';
import type { AppData, LaundryBatch, LaundryItemCount } from '../types';

interface LaundryProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const DEFAULT_CATEGORIES = [
  'Shirts',
  'T-Shirts',
  'Pants',
  'Shorts',
  'Underwear',
  'Socks',
  'Towels',
  'Bed-sheets',
];

export default function Laundry({ data, updateData }: LaundryProps) {
  const navigate = useNavigate();
  const { confirmDelete } = useM3Feedback();
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [batchToEdit, setBatchToEdit] = useState<LaundryBatch | null>(null);
  const [editItemCounts, setEditItemCounts] = useState<Record<string, number>>({});
  const [editSubmitDate, setEditSubmitDate] = useState('');
  const [editReturnDate, setEditReturnDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Form State
  const [submitDate, setSubmitDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [returnDate, setReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [itemCounts, setItemCounts] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    DEFAULT_CATEGORIES.forEach(c => { init[c] = 0; });
    return init;
  });
  const [customItemName, setCustomItemName] = useState('');
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const batches = useMemo(() => {
    return (data?.laundryBatches || []).slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [data?.laundryBatches]);

  const totalClothesInNewBatch = useMemo(() => {
    return Object.values(itemCounts).reduce((acc, val) => acc + (val || 0), 0);
  }, [itemCounts]);

  const activeBatches = useMemo(() => {
    return batches.filter(b => b.status !== 'received');
  }, [batches]);

  const clothesAtLaundry = useMemo(() => {
    return activeBatches.reduce((acc, b) => acc + b.totalClothes, 0);
  }, [activeBatches]);

  const updateItemCount = (category: string, nextValue: number) => {
    triggerHaptic('light');
    setItemCounts(prev => ({
      ...prev,
      [category]: Math.max(0, nextValue),
    }));
  };

  const addCustomCategory = () => {
    const trimmed = customItemName.trim();
    if (!trimmed) return;
    triggerHaptic('selection');
    if (!customCategories.includes(trimmed) && !DEFAULT_CATEGORIES.includes(trimmed)) {
      setCustomCategories(prev => [...prev, trimmed]);
      setItemCounts(prev => ({ ...prev, [trimmed]: 1 }));
    }
    setCustomItemName('');
  };

  const handleCreateBatch = async () => {
    if (totalClothesInNewBatch === 0) return;
    triggerHaptic('save');

    const items: LaundryItemCount[] = Object.entries(itemCounts)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({ category, count }));

    const newBatch: LaundryBatch = {
      id: crypto.randomUUID(),
      submitDate,
      returnDate: returnDate.trim() || undefined,
      items,
      totalClothes: totalClothesInNewBatch,
      status: 'submitted',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await updateData({
      laundryBatches: [newBatch, ...(data?.laundryBatches || [])],
    });

    // Reset Form
    const resetCounts: Record<string, number> = {};
    DEFAULT_CATEGORIES.forEach(c => { resetCounts[c] = 0; });
    setItemCounts(resetCounts);
    setCustomCategories([]);
    setNotes('');
    setReturnDate('');
    setShowAddModal(false);
  };

  const toggleBatchStatus = async (batch: LaundryBatch) => {
    triggerHaptic('medium');
    const nextStatus: LaundryBatch['status'] =
      batch.status === 'submitted'
        ? 'received'
        : batch.status === 'received'
          ? 'pending'
          : 'submitted';

    await updateData({
      laundryBatches: (data?.laundryBatches || []).map(b =>
        b.id === batch.id ? { ...b, status: nextStatus } : b
      ),
    });
  };

  const updateBatchReturnDate = async (batchId: string, newReturnDate: string) => {
    triggerHaptic('selection');
    await updateData({
      laundryBatches: (data?.laundryBatches || []).map(b =>
        b.id === batchId ? { ...b, returnDate: newReturnDate } : b
      ),
    });
  };

  const handleDeleteBatch = async (batch: LaundryBatch) => {
    confirmDelete({
      title: 'Delete Laundry Batch?',
      itemName: `${batch.totalClothes} clothes (${batch.submitDate})`,
      message: 'Are you sure you want to delete this laundry batch history?',
      section: 'laundry',
      onConfirm: async () => {
        await updateData({
          laundryBatches: (data?.laundryBatches || []).filter(b => b.id !== batch.id),
        });
      },
    });
  };

  const openEditModal = (batch: LaundryBatch) => {
    triggerHaptic('light');
    const counts: Record<string, number> = {};
    batch.items.forEach(item => { counts[item.category] = item.count; });
    DEFAULT_CATEGORIES.forEach(c => { if (!(c in counts)) counts[c] = 0; });
    setEditItemCounts(counts);
    setEditSubmitDate(batch.submitDate);
    setEditReturnDate(batch.returnDate || '');
    setEditNotes(batch.notes || '');
    setBatchToEdit(batch);
  };

  const updateEditItemCount = (category: string, nextValue: number) => {
    triggerHaptic('light');
    setEditItemCounts(prev => ({
      ...prev,
      [category]: Math.max(0, nextValue),
    }));
  };

  const handleSaveEdit = async () => {
    if (!batchToEdit) return;
    triggerHaptic('save');
    const items: LaundryItemCount[] = Object.entries(editItemCounts)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({ category, count }));
    const totalClothes = items.reduce((a, b) => a + b.count, 0);
    await updateData({
      laundryBatches: (data?.laundryBatches || []).map(b =>
        b.id === batchToEdit.id
          ? { ...b, items, totalClothes, submitDate: editSubmitDate, returnDate: editReturnDate || undefined, notes: editNotes.trim() || undefined }
          : b
      ),
    });
    setBatchToEdit(null);
  };

  const allCategoriesForNew = [...DEFAULT_CATEGORIES, ...customCategories];

  return (
    <div className="w-full text-white pb-2">
      <LargeTitleHeader
        title="Laundry"
        subtitle="Clothes inventory & return tracking"
        actions={
          <button
            onClick={() => {
              triggerHaptic('light');
              setShowAddModal(true);
            }}
            className="p-2 rounded-full glass-flat text-[#63E6E2] active:scale-95 transition-all"
            title="Log Batch"
          >
            <Plus size={20} weight="bold" />
          </button>
        }
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* ── Status Overview Grid (2 Bento Glass Tiles) ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-tile p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[rgba(235,235,245,0.60)] font-semibold">
                At Laundry
              </span>
              <InteractiveLaundryDrum status={clothesAtLaundry > 0 ? 'laundry' : 'received'} size={24} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-white tracking-tight leading-none">
                {clothesAtLaundry}
              </span>
              <span className="text-xs text-[rgba(235,235,245,0.50)]">clothes</span>
            </div>
            <p className="text-[11px] text-[rgba(235,235,245,0.55)]">
              {activeBatches.length} active batch{activeBatches.length === 1 ? '' : 'es'}
            </p>
          </div>

          <div className="glass-tile p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-[rgba(235,235,245,0.60)] font-semibold">
                Total Batches
              </span>
              <div className="w-6 h-6 rounded-lg glass-flat text-[#BF5AF2] flex items-center justify-center">
                <Package size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-white tracking-tight leading-none">
                {batches.length}
              </span>
              <span className="text-xs text-[rgba(235,235,245,0.50)]">logged</span>
            </div>
            <p className="text-[11px] text-[rgba(235,235,245,0.55)]">
              {batches.filter(b => b.status === 'received').length} returned safely
            </p>
          </div>
        </div>

        {/* ── Batches List ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-section-header">
              Laundry Batches · {batches.length}
            </h2>
          </div>

          {batches.map((batch) => {
            const isExpanded = expandedBatchId === batch.id;
            const isReturned = batch.status === 'received';
            const isSubmitted = batch.status === 'submitted';

            const badgeLabel = isReturned ? 'Received' : isSubmitted ? 'At Laundry' : 'Pending';
            const badgeColor = isReturned ? '#30D158' : isSubmitted ? '#63E6E2' : '#FF9F0A';

            return (
              <div
                key={batch.id}
                className="glass-card p-4 space-y-3"
              >
                {/* Top Row: Dates & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-white">
                        {batch.totalClothes} Clothes
                      </span>

                      <button
                        onClick={() => toggleBatchStatus(batch)}
                        className="cursor-pointer"
                      >
                        <Badge label={badgeLabel} color={badgeColor} />
                      </button>

                      {!isReturned && (
                        <button
                          onClick={() => openEditModal(batch)}
                          className="p-1 rounded-lg text-[rgba(235,235,245,0.50)] hover:text-[#63E6E2] hover:bg-white/10 transition-colors cursor-pointer"
                          title="Edit batch"
                        >
                          <PencilSimple size={14} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[rgba(235,235,245,0.60)] font-medium flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <CalendarBlank size={12} className="text-[#63E6E2]" />
                        Submitted: <strong className="text-white font-medium">{batch.submitDate}</strong>
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} className="text-[#BF5AF2]" />
                        Return: <strong className="text-white font-medium">{batch.returnDate || 'Pending'}</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setExpandedBatchId(isExpanded ? null : batch.id);
                    }}
                    className="p-1.5 rounded-lg glass-flat text-[rgba(235,235,245,0.60)] hover:text-white cursor-pointer"
                  >
                    {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
                  </button>
                </div>

                {/* Clothes Item Badges Summary */}
                <div className="flex flex-wrap gap-1.5">
                  {(batch.items || []).map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium glass-flat text-white"
                    >
                      <span className="text-[rgba(235,235,245,0.60)]">{item.category}:</span>
                      <strong className="text-[#63E6E2]">{item.count}</strong>
                    </span>
                  ))}
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-3 border-t border-white/[0.08] space-y-3 overflow-hidden"
                    >
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-[rgba(235,235,245,0.60)] block mb-1">
                          Update Return Date
                        </label>
                        <input
                          type="date"
                          value={batch.returnDate || ''}
                          onChange={(e) => updateBatchReturnDate(batch.id, e.target.value)}
                          className="w-full glass-flat rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {batch.notes && (
                        <p className="text-xs text-[rgba(235,235,245,0.70)] italic glass-flat p-2.5 rounded-xl">
                          "{batch.notes}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteBatch(batch)}
                          className="text-xs font-semibold text-[#FF453A] hover:underline cursor-pointer"
                        >
                          Delete Batch
                        </button>

                        <Button
                          size="sm"
                          variant="glass"
                          onClick={() => toggleBatchStatus(batch)}
                        >
                          {isReturned ? 'Mark as At Laundry' : 'Mark as Received'}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {batches.length === 0 && (
            <EmptyState
              icon={<TShirt size={36} weight="light" className="text-[#63E6E2]" />}
              title="No laundry batches yet"
              description="Log your clothes count when giving them to laundry to track submission and return dates accurately."
              actionLabel="Log First Batch"
              onAction={() => setShowAddModal(true)}
              tint="#63E6E2"
            />
          )}
        </div>
      </div>

      {/* ── Log New Batch Sheet ── */}
      <Sheet
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Log Laundry (${totalClothesInNewBatch} items)`}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#8E8E93] block mb-1">
                Submit Date
              </label>
              <input
                type="date"
                value={submitDate}
                onChange={(e) => setSubmitDate(e.target.value)}
                className="w-full bg-[#2C2C2E] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#63E6E2]"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#8E8E93] block mb-1">
                Return Date
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-[#2C2C2E] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#63E6E2]"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <label className="text-[11px] uppercase tracking-wider text-[#8E8E93] block">
              Item Breakdown
            </label>
            {allCategoriesForNew.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#2C2C2E] border border-white/[0.04]"
              >
                <span className="text-xs text-white font-medium">{cat}</span>
                <Stepper
                  value={itemCounts[cat] || 0}
                  onChange={(val) => updateItemCount(cat, val)}
                  min={0}
                  max={99}
                  size="sm"
                />
              </div>
            ))}
          </div>

          {/* Add custom item */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customItemName}
              onChange={(e) => setCustomItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomCategory();
                }
              }}
              placeholder="Add custom item..."
              className="flex-1 bg-[#2C2C2E] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder:text-[#636366]"
            />
            <Button size="sm" variant="glass" onClick={addCustomCategory}>
              Add
            </Button>
          </div>

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Iron only shirts, separate whites..."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="glass" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              variant="prominent"
              tint="#63E6E2"
              disabled={totalClothesInNewBatch === 0}
              onClick={handleCreateBatch}
            >
              Save Batch
            </Button>
          </div>
        </div>
      </Sheet>

      {/* ── Edit Batch Sheet ── */}
      <Sheet
        isOpen={!!batchToEdit}
        onClose={() => setBatchToEdit(null)}
        title="Edit Laundry Batch"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#8E8E93] block mb-1">
                Submit Date
              </label>
              <input
                type="date"
                value={editSubmitDate}
                onChange={(e) => setEditSubmitDate(e.target.value)}
                className="w-full bg-[#2C2C2E] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#63E6E2]"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#8E8E93] block mb-1">
                Return Date
              </label>
              <input
                type="date"
                value={editReturnDate}
                onChange={(e) => setEditReturnDate(e.target.value)}
                className="w-full bg-[#2C2C2E] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#63E6E2]"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            <label className="text-[11px] uppercase tracking-wider text-[#8E8E93] block">
              Item Breakdown
            </label>
            {Object.keys(editItemCounts).map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#2C2C2E] border border-white/[0.04]"
              >
                <span className="text-xs text-white font-medium">{cat}</span>
                <Stepper
                  value={editItemCounts[cat] || 0}
                  onChange={(val) => updateEditItemCount(cat, val)}
                  min={0}
                  max={99}
                  size="sm"
                />
              </div>
            ))}
          </div>

          <TextField
            label="Notes (optional)"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="e.g. Iron only shirts..."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="glass" onClick={() => setBatchToEdit(null)}>
              Cancel
            </Button>
            <Button variant="prominent" tint="#63E6E2" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
