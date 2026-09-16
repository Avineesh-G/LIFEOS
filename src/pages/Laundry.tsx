import { useState, useMemo } from 'react';
import { Shirt, Plus, Minus, Check, Calendar, Clock, AlertCircle, X, ChevronDown, ChevronUp, Package, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<LaundryBatch | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

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
    return (data?.laundryBatches || []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data?.laundryBatches]);

  const totalClothesInNewBatch = useMemo(() => {
    return Object.values(itemCounts).reduce((acc, val) => acc + (val || 0), 0);
  }, [itemCounts]);

  // Active clothes currently at laundry
  const activeBatches = useMemo(() => {
    return batches.filter(b => b.status !== 'received');
  }, [batches]);

  const clothesAtLaundry = useMemo(() => {
    return activeBatches.reduce((acc, b) => acc + b.totalClothes, 0);
  }, [activeBatches]);

  const updateItemCount = (category: string, delta: number) => {
    triggerHaptic('light');
    setItemCounts(prev => {
      const current = prev[category] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [category]: next };
    });
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

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    triggerHaptic('heavy');
    await updateData({
      laundryBatches: (data?.laundryBatches || []).filter(b => b.id !== batchToDelete.id),
    });
    setBatchToDelete(null);
  };

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div className="flex items-end justify-between pt-1">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-bold tracking-wider uppercase mb-2">
            <Shirt size={13} className="text-teal-600 dark:text-teal-400" />
            Wardrobe Care
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-primary-light dark:text-primary-dark font-sans">
            Laundry Hub
          </h1>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1.5 font-medium">
            Clothes inventory & return date tracking
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            setShowAddModal(true);
          }}
          className="bouncy-tap flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold bg-teal-600 dark:bg-teal-500 text-white shadow-md shadow-teal-500/20 hover:opacity-95"
        >
          <Plus size={16} strokeWidth={2.5} /> Log Clothes
        </button>
      </div>

      {/* ── Status Overview Grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="liquid-glass rounded-[28px] p-4 sm:p-5 border border-white/80 dark:border-white/[0.08] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              At Laundry
            </span>
            <div className="w-7 h-7 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Shirt size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary-light dark:text-primary-dark font-sans">
              {clothesAtLaundry}
            </span>
            <span className="text-xs font-semibold text-secondary-light dark:text-secondary-dark">clothes</span>
          </div>
          <p className="text-[10px] text-muted-light dark:text-muted-dark font-medium">
            {activeBatches.length} active batch{activeBatches.length === 1 ? '' : 'es'}
          </p>
        </div>

        <div className="liquid-glass rounded-[28px] p-4 sm:p-5 border border-white/80 dark:border-white/[0.08] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Total Batches
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Package size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary-light dark:text-primary-dark font-sans">
              {batches.length}
            </span>
            <span className="text-xs font-semibold text-secondary-light dark:text-secondary-dark">logged</span>
          </div>
          <p className="text-[10px] text-muted-light dark:text-muted-dark font-medium">
            {batches.filter(b => b.status === 'received').length} returned safely
          </p>
        </div>
      </div>

      {/* ── Active & Past Batches List ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
            Laundry Batches ({batches.length})
          </h2>
          <span className="text-[11px] text-muted-light dark:text-muted-dark font-medium">
            Hold card to delete
          </span>
        </div>

        {batches.map(batch => {
          const isExpanded = expandedBatchId === batch.id;
          const isReturned = batch.status === 'received';
          const isSubmitted = batch.status === 'submitted';

          return (
            <div
              key={batch.id}
              onContextMenu={e => {
                e.preventDefault();
                triggerHaptic('heavy');
                setBatchToDelete(batch);
              }}
              className={`rounded-[30px] p-5 border transition-all liquid-glass ${
                isReturned
                  ? 'border-white/60 dark:border-white/[0.05] opacity-80'
                  : 'border-teal-500/25 dark:border-teal-500/30 shadow-md shadow-teal-500/5'
              }`}
            >
              {/* Top Row: Dates & Status Pill */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-black text-primary-light dark:text-primary-dark">
                      {batch.totalClothes} Clothes
                    </span>
                    <button
                      onClick={() => toggleBatchStatus(batch)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        isReturned
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : isSubmitted
                            ? 'bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-300'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isReturned ? '✓ Received' : isSubmitted ? '🧺 At Laundry' : '⏳ Pending'}
                    </button>
                  </div>

                  {/* Submit & Return Dates */}
                  <div className="flex items-center gap-3 text-xs text-secondary-light dark:text-secondary-dark font-medium flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} className="text-teal-500" />
                      Submitted: <strong>{batch.submitDate}</strong>
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} className="text-purple-500" />
                      Return: <strong>{batch.returnDate || 'Manual entry pending'}</strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setExpandedBatchId(isExpanded ? null : batch.id);
                  }}
                  className="p-1.5 rounded-full bg-black/5 dark:bg-white/5 text-secondary-light dark:text-secondary-dark hover:opacity-80"
                  aria-label="Toggle clothes breakdown"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Clothes Item Badges Summary */}
              <div className="flex flex-wrap gap-1.5 pt-3">
                {batch.items.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-black/[0.03] dark:bg-white/[0.05] text-primary-light dark:text-primary-dark border border-black/5 dark:border-white/5"
                  >
                    <span>{item.category}:</span>
                    <strong className="text-teal-600 dark:text-teal-400 font-mono">{item.count}</strong>
                  </span>
                ))}
              </div>

              {/* Expanded Card Details (Manual return date editor, notes, quick actions) */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-black/5 dark:border-white/10 mt-3 space-y-3"
                  >
                    {/* Manual Return Date Editor */}
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono">
                        Update Return Date (Manual Entry)
                      </label>
                      <input
                        type="date"
                        value={batch.returnDate || ''}
                        onChange={e => updateBatchReturnDate(batch.id, e.target.value)}
                        className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-primary-light dark:text-primary-dark"
                      />
                    </div>

                    {batch.notes && (
                      <p className="text-xs text-muted-light dark:text-muted-dark italic bg-black/[0.02] dark:bg-white/[0.02] p-2.5 rounded-xl">
                        "{batch.notes}"
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('heavy');
                          setBatchToDelete(batch);
                        }}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        Delete Batch
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBatchStatus(batch)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-teal-600 text-white shadow-sm"
                      >
                        {isReturned ? 'Mark as At Laundry' : 'Mark as Received'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {batches.length === 0 && (
          <div className="liquid-glass rounded-[32px] p-10 text-center border border-white/70 dark:border-white/[0.08]">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-3">
              <Shirt size={24} />
            </div>
            <h3 className="text-base font-black text-primary-light dark:text-primary-dark">No laundry batches yet</h3>
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1 max-w-xs mx-auto">
              Give your clothes count when giving them to laundry to track submission & return dates accurately.
            </p>
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowAddModal(true);
              }}
              className="mt-4 px-4 py-2 rounded-full text-xs font-bold bg-teal-600 text-white shadow-md shadow-teal-600/20"
            >
              + Log First Batch
            </button>
          </div>
        )}
      </div>

      {/* ── New Batch Creation Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md z-[130] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-lg liquid-glass rounded-t-[36px] sm:rounded-[36px] p-6 max-h-[88vh] overflow-y-auto no-scrollbar border-t sm:border border-white/80 dark:border-white/[0.12] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-4" />

              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-primary-light dark:text-primary-dark font-sans tracking-tight">
                    Log Laundry Batch
                  </h2>
                  <p className="text-xs text-muted-light dark:text-muted-dark font-medium">
                    Total clothes: <strong className="text-teal-600 dark:text-teal-400 font-bold">{totalClothesInNewBatch}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-secondary-light dark:text-secondary-dark"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Dates Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono flex items-center gap-1">
                      <Calendar size={11} className="text-teal-500" /> Submit Date
                    </label>
                    <input
                      type="date"
                      value={submitDate}
                      onChange={e => setSubmitDate(e.target.value)}
                      className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-primary-light dark:text-primary-dark"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono flex items-center gap-1">
                      <Clock size={11} className="text-purple-500" /> Return Date
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                      placeholder="Expected Return"
                      className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-primary-light dark:text-primary-dark"
                    />
                  </div>
                </div>

                {/* Clothes Category Breakdown Grid */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
                    Separate Clothes by Count
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[...DEFAULT_CATEGORIES, ...customCategories].map(cat => {
                      const count = itemCounts[cat] || 0;
                      return (
                        <div
                          key={cat}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5"
                        >
                          <span className="text-xs font-bold text-primary-light dark:text-primary-dark truncate pr-1">
                            {cat}
                          </span>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => updateItemCount(cat, -1)}
                              disabled={count === 0}
                              className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-primary-light dark:text-primary-dark disabled:opacity-30 active:scale-90 transition-all"
                            >
                              <Minus size={12} />
                            </button>

                            <span className="w-5 text-center font-mono font-bold text-xs text-teal-600 dark:text-teal-400">
                              {count}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateItemCount(cat, 1)}
                              className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center active:scale-90 transition-all shadow-xs"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Cloth Option */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customItemName}
                    onChange={e => setCustomItemName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); } }}
                    placeholder="Add custom item (e.g. Jacket, Hoodie)..."
                    className="flex-1 bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
                  />
                  <button
                    type="button"
                    onClick={addCustomCategory}
                    disabled={!customItemName.trim()}
                    className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 disabled:opacity-40 hover:bg-teal-500/25 transition-all"
                  >
                    + Add
                  </button>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono">
                    Notes / Slip Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Receipt #104 · Light starch on shirts"
                    className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-2xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="py-3.5 rounded-2xl border border-border-light dark:border-border-dark text-xs font-bold text-secondary-light dark:text-secondary-dark"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateBatch}
                    disabled={totalClothesInNewBatch === 0}
                    className="py-3.5 rounded-2xl bg-teal-600 dark:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-500/25 disabled:opacity-40 transition-all"
                  >
                    Save Batch ({totalClothesInNewBatch})
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Dialog ── */}
      <AnimatePresence>
        {batchToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[150] flex items-center justify-center p-5"
            onClick={() => setBatchToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm liquid-glass rounded-[32px] p-6 border border-white/80 dark:border-white/[0.12] shadow-2xl text-center space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center mx-auto">
                <X size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black text-primary-light dark:text-primary-dark">Delete Batch?</h3>
                <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1 font-medium">
                  Laundry batch with {batchToDelete.totalClothes} clothes will be removed.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBatchToDelete(null)}
                  className="py-3 rounded-2xl border border-border-light dark:border-border-dark text-xs font-bold text-secondary-light dark:text-secondary-dark"
                >
                  Keep
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBatch}
                  className="py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md shadow-red-500/25 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
