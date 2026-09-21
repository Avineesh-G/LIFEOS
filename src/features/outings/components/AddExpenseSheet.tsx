/**
 * LifeOS — AddExpenseSheet Component
 * 
 * 3-tap rapid expense entry:
 * - Large numeric keypad input (`inputmode="decimal"`)
 * - Category chips
 * - Paid by (default: Me)
 * - Split selector (Equal, Custom with live sum validation, Only Me)
 * - Off-main-thread receipt photo compressor & preview
 * - Payment method & warning if outside outing dates
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  X,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Trash2,
  Receipt,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { format, parseISO, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';
import { BottomSheet } from '../../../components/BottomSheet';
import { OUTING_CATEGORIES, MAX_RECEIPTS_PER_EXPENSE } from '../constants';
import {
  parseRupeesToPaise,
  calculateEqualSplit,
  formatPaiseToRupees,
} from '../utils/calculations';
import { compressReceiptImage } from '../utils/receiptCompressor';
import { triggerHaptic } from '../../../utils/haptics';
import { useOutings } from '../context/OutingsContext';
import { analyzeReceiptWithGemini } from '../../../utils/geminiReceiptOcr';
import type {
  Outing,
  OutingExpense,
  ExpenseShare,
  SplitMode,
  PaymentMethod,
  OutingCategory,
} from '../types';

interface AddExpenseSheetProps {
  isOpen: boolean;
  onClose: () => void;
  outing: Outing;
  expenseToEdit?: OutingExpense | null;
  geminiApiKey?: string;
}

export function AddExpenseSheet({
  isOpen,
  onClose,
  outing,
  expenseToEdit,
  geminiApiKey,
}: AddExpenseSheetProps) {
  const { people, addExpense, updateExpense } = useOutings();

  const [amountInput, setAmountInput] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<OutingCategory>('Food');
  const [paidByPersonId, setPaidByPersonId] = useState('me');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [spentAt, setSpentAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState('');

  // Selected participants for equal split
  const [equalSplitPersonIds, setEqualSplitPersonIds] = useState<string[]>([]);
  // Custom split mapping: personId -> rupees string input
  const [customSharesInput, setCustomSharesInput] = useState<Record<string, string>>({});

  // Pending receipt image blobs to upload
  const [pendingReceipts, setPendingReceipts] = useState<
    { blob: Blob; thumbBlob: Blob; width: number; height: number; size: number; previewUrl: string }[]
  >([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ocrMessage, setOcrMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const participants = useMemo(() => {
    const pIds = outing.participantIds || ['me'];
    return people.filter((p) => pIds.includes(p.id));
  }, [outing, people]);

  // Initialize state
  useEffect(() => {
    if (expenseToEdit) {
      setAmountInput((expenseToEdit.amount / 100).toString());
      setTitle(expenseToEdit.title);
      setCategory(expenseToEdit.category);
      setPaidByPersonId(expenseToEdit.paidByPersonId);
      setSplitMode(expenseToEdit.splitMode);
      setPaymentMethod(expenseToEdit.paymentMethod || 'upi');
      setSpentAt(
        expenseToEdit.spentAt
          ? format(parseISO(expenseToEdit.spentAt), "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm")
      );
      setNote(expenseToEdit.note || '');

      if (expenseToEdit.splitMode === 'equal') {
        setEqualSplitPersonIds(expenseToEdit.shares.map((s) => s.personId));
      } else if (expenseToEdit.splitMode === 'custom') {
        const mapping: Record<string, string> = {};
        for (const s of expenseToEdit.shares) {
          mapping[s.personId] = (s.amount / 100).toString();
        }
        setCustomSharesInput(mapping);
      }
    } else {
      setAmountInput('');
      setTitle('');
      setCategory('Food');
      setPaidByPersonId('me');
      setSplitMode('equal');
      setPaymentMethod('upi');
      setSpentAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setNote('');
      setEqualSplitPersonIds(outing.participantIds || ['me']);
      setCustomSharesInput({});
    }
    setPendingReceipts([]);
    setError(null);
    setOcrStatus('idle');
    setOcrMessage('');
  }, [expenseToEdit, outing, isOpen]);

  // Clean up object URLs when unmounting or closing
  useEffect(() => {
    return () => {
      pendingReceipts.forEach((r) => URL.revokeObjectURL(r.previewUrl));
    };
  }, [pendingReceipts]);

  // Calculated parsed amount in paise
  const amountPaise = useMemo(() => parseRupeesToPaise(amountInput), [amountInput]);

  // Live custom split validation
  const customSplitSummary = useMemo(() => {
    if (splitMode !== 'custom') return { sumPaise: 0, remainingPaise: 0, isValid: true };
    let sum = 0;
    for (const p of participants) {
      const raw = customSharesInput[p.id] || '';
      sum += parseRupeesToPaise(raw);
    }
    const remaining = amountPaise - sum;
    return {
      sumPaise: sum,
      remainingPaise: remaining,
      isValid: remaining === 0 && amountPaise > 0,
    };
  }, [splitMode, customSharesInput, amountPaise, participants]);

  // Outing date boundary check warning
  const isDateOutsideOuting = useMemo(() => {
    try {
      const expenseDate = parseISO(spentAt);
      if (outing.startDate) {
        const start = startOfDay(parseISO(outing.startDate));
        if (isBefore(expenseDate, start)) return true;
      }
      if (outing.endDate) {
        const end = endOfDay(parseISO(outing.endDate));
        if (isAfter(expenseDate, end)) return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [spentAt, outing]);

  // Handle photo selection & off-main-thread compression + Gemini OCR
  const handlePhotosSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (pendingReceipts.length + files.length > MAX_RECEIPTS_PER_EXPENSE) {
      setError(`Maximum ${MAX_RECEIPTS_PER_EXPENSE} receipts allowed per expense`);
      triggerHaptic('error');
      return;
    }

    setIsCompressing(true);
    triggerHaptic('light');

    try {
      const newItems: typeof pendingReceipts = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressReceiptImage(file);
        const previewUrl = URL.createObjectURL(compressed.thumbBlob);
        newItems.push({
          ...compressed,
          previewUrl,
        });
      }
      setPendingReceipts((prev) => [...prev, ...newItems]);
      triggerHaptic('save');

      // ── Gemini Vision OCR: analyze the first new receipt ──
      if (geminiApiKey?.trim() && newItems.length > 0) {
        setIsAnalyzing(true);
        setOcrStatus('idle');
        setOcrMessage('');
        try {
          // Use the full-quality blob for better OCR accuracy
          const result = await analyzeReceiptWithGemini(newItems[0].blob, geminiApiKey);
          let filled = false;

          if (result.amount && result.amount > 0 && !amountInput) {
            setAmountInput(result.amount.toFixed(2));
            filled = true;
          }
          if (result.title && !title) {
            setTitle(result.title);
            filled = true;
          }
          if (result.category) {
            // Match to one of our categories
            const matched = OUTING_CATEGORIES.find(
              (c) => c.label.toLowerCase() === result.category!.toLowerCase()
            );
            if (matched) {
              setCategory(matched.label);
              filled = true;
            }
          }

          setOcrStatus('success');
          setOcrMessage(
            filled
              ? `Receipt scanned ✓ — fields pre-filled from receipt`
              : `Receipt scanned — no data detected, fill manually`
          );
          triggerHaptic('save');
        } catch (ocrErr: any) {
          setOcrStatus('error');
          setOcrMessage(ocrErr?.message || 'Receipt scan failed');
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (err: any) {
      setError('Could not process receipt image');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const removePendingReceipt = (index: number) => {
    triggerHaptic('selection');
    setPendingReceipts((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Submit Handler
  const handleSave = async () => {
    if (amountPaise <= 0) {
      setError('Amount must be greater than zero');
      triggerHaptic('error');
      return;
    }

    // Build shares based on split mode
    let finalShares: ExpenseShare[] = [];

    if (splitMode === 'equal') {
      if (equalSplitPersonIds.length === 0) {
        setError('Select at least one participant to split with');
        triggerHaptic('error');
        return;
      }
      finalShares = calculateEqualSplit(amountPaise, equalSplitPersonIds);
    } else if (splitMode === 'personal') {
      finalShares = [{ personId: 'me', amount: amountPaise }];
    } else if (splitMode === 'custom') {
      if (!customSplitSummary.isValid) {
        setError(
          customSplitSummary.remainingPaise > 0
            ? `${formatPaiseToRupees(customSplitSummary.remainingPaise)} remaining to allocate`
            : `${formatPaiseToRupees(Math.abs(customSplitSummary.remainingPaise))} over total amount`
        );
        triggerHaptic('error');
        return;
      }
      finalShares = participants.map((p) => ({
        personId: p.id,
        amount: parseRupeesToPaise(customSharesInput[p.id] || ''),
      }));
    }

    const finalTitle = title.trim() || category;

    try {
      triggerHaptic('save');
      if (expenseToEdit) {
        await updateExpense(
          expenseToEdit.id,
          {
            title: finalTitle,
            amount: amountPaise,
            category,
            paidByPersonId,
            splitMode,
            shares: finalShares,
            paymentMethod,
            spentAt: new Date(spentAt).toISOString(),
            note: note.trim() || undefined,
          },
          pendingReceipts
        );
      } else {
        await addExpense(
          {
            outingId: outing.id,
            title: finalTitle,
            amount: amountPaise,
            category,
            paidByPersonId,
            splitMode,
            shares: finalShares,
            paymentMethod,
            spentAt: new Date(spentAt).toISOString(),
            note: note.trim() || undefined,
          },
          pendingReceipts
        );
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save expense');
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-4 pt-1 pb-6 select-none">
        <div className="flex items-center justify-between pb-2 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-heading font-bold text-primary-light dark:text-primary-dark">
            {expenseToEdit ? 'Edit Expense' : 'Add Outing Expense'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Large Amount Field (Tap 1) */}
        <div className="p-4 rounded-[24px] bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-center">
          <label className="block text-[11px] font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1">
            Amount Spent
          </label>
          <div className="inline-flex items-center justify-center gap-1 max-w-full">
            <span className="text-2xl font-stat font-bold text-accent select-none">₹</span>
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0"
              className="w-48 text-center text-3xl font-stat font-bold bg-transparent text-primary-light dark:text-primary-dark placeholder:text-muted-light focus:outline-none"
              autoFocus={!expenseToEdit}
            />
          </div>
        </div>

        {/* 2. Category Chips (Tap 2) */}
        <div>
          <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-2">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {OUTING_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setCategory(cat.label);
                    if (!title) setTitle(cat.label);
                  }}
                  className={`py-2.5 px-2 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-accent text-white border-accent shadow-sm shadow-accent/25 scale-[1.02]'
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-[var(--card-border)] text-secondary-light dark:text-secondary-dark hover:border-accent/40'
                  }`}
                >
                  <Icon size={18} strokeWidth={2.2} />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Title / Description */}
        <div>
          <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
            Title / Note (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`e.g. ${category} at Downtown`}
            className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-sm text-primary-light dark:text-primary-dark placeholder:text-muted-light focus:outline-none focus:border-accent"
          />
        </div>

        {/* 4. Paid By Selector */}
        <div>
          <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
            Paid By
          </label>
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => {
              const active = paidByPersonId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setPaidByPersonId(p.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    active
                      ? 'bg-accent text-white border-accent shadow-xs'
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-[var(--card-border)] text-secondary-light dark:text-secondary-dark'
                  }`}
                >
                  {p.isMe ? 'Me' : p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Split Options */}
        <div className="p-4 rounded-[24px] bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--card-border)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-bold">
              Split Mode
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.05]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setSplitMode('equal');
              }}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                splitMode === 'equal'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-secondary-light dark:text-secondary-dark'
              }`}
            >
              Equal
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setSplitMode('personal');
              }}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                splitMode === 'personal'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-secondary-light dark:text-secondary-dark'
              }`}
            >
              Only Me
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setSplitMode('custom');
              }}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                splitMode === 'custom'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-secondary-light dark:text-secondary-dark'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Mode-specific panels */}
          {splitMode === 'equal' && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-secondary-light dark:text-secondary-dark">
                Split equally among ({equalSplitPersonIds.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {participants.map((p) => {
                  const included = equalSplitPersonIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setEqualSplitPersonIds((prev) =>
                          included ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        included
                          ? 'bg-accent/15 border-accent text-accent font-bold'
                          : 'bg-black/[0.02] dark:bg-white/[0.03] border-[var(--card-border)] text-muted-light dark:text-muted-dark opacity-60'
                      }`}
                    >
                      {p.isMe ? 'Me' : p.name}
                    </button>
                  );
                })}
              </div>
              {amountPaise > 0 && equalSplitPersonIds.length > 0 && (
                <p className="text-[11px] font-stat text-secondary-light dark:text-secondary-dark pt-1">
                  ≈ {formatPaiseToRupees(Math.round(amountPaise / equalSplitPersonIds.length))} per person
                </p>
              )}
            </div>
          )}

          {splitMode === 'personal' && (
            <p className="text-xs text-secondary-light dark:text-secondary-dark pt-1">
              Recorded as your personal expense only. Creates zero debt balance with anyone.
            </p>
          )}

          {splitMode === 'custom' && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-stat">
                <span className="text-secondary-light dark:text-secondary-dark">Assigned:</span>
                <span
                  className={`font-bold ${
                    customSplitSummary.isValid
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {customSplitSummary.isValid ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={13} /> Matches Total
                    </span>
                  ) : customSplitSummary.remainingPaise > 0 ? (
                    `${formatPaiseToRupees(customSplitSummary.remainingPaise)} remaining`
                  ) : (
                    `${formatPaiseToRupees(Math.abs(customSplitSummary.remainingPaise))} over`
                  )}
                </span>
              </div>

              <div className="space-y-1.5">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-primary-light dark:text-primary-dark truncate flex-1">
                      {p.isMe ? 'Me (You)' : p.name}
                    </span>
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2.5 top-1.5 text-xs font-stat font-bold text-accent">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={customSharesInput[p.id] || ''}
                        onChange={(e) =>
                          setCustomSharesInput((prev) => ({ ...prev, [p.id]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-full pl-6 pr-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-[var(--card-border)] text-xs font-stat font-bold text-primary-light dark:text-primary-dark text-right focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 6. Date, Time & Boundary Warning */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
              Spent At
            </label>
            {isDateOutsideOuting && (
              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle size={11} /> Outside outing dates
              </span>
            )}
          </div>
          <input
            type="datetime-local"
            value={spentAt}
            onChange={(e) => setSpentAt(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent"
          />
        </div>

        {/* 7. Payment Method */}
        <div>
          <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
            Payment Method
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['upi', 'cash', 'card', 'other'] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setPaymentMethod(m);
                }}
                className={`py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  paymentMethod === m
                    ? 'bg-accent text-white border-accent shadow-xs'
                    : 'bg-black/[0.02] dark:bg-white/[0.03] border-[var(--card-border)] text-secondary-light dark:text-secondary-dark'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* 8. Receipts / Photos */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
              Receipts / Bills ({pendingReceipts.length}/{MAX_RECEIPTS_PER_EXPENSE})
            </label>
            {isCompressing && (
              <span className="text-[10px] text-accent font-bold animate-pulse">
                Compressing image...
              </span>
            )}
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotosSelected}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotosSelected}
          />

          {/* OCR Status Banner */}
          {(isAnalyzing || ocrStatus !== 'idle') && (
            <div
              className={`flex items-center gap-2 p-2.5 rounded-2xl text-xs font-medium border ${
                isAnalyzing
                  ? 'bg-accent/10 border-accent/20 text-accent'
                  : ocrStatus === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isAnalyzing ? (
                <Loader2 size={13} className="animate-spin shrink-0" />
              ) : ocrStatus === 'success' ? (
                <Sparkles size={13} className="shrink-0" />
              ) : (
                <AlertTriangle size={13} className="shrink-0" />
              )}
              <span>
                {isAnalyzing ? 'Scanning receipt with Gemini AI...' : ocrMessage}
              </span>
            </div>
          )}

          {/* Actions & Thumbnails Row */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isCompressing || pendingReceipts.length >= MAX_RECEIPTS_PER_EXPENSE}
              className="h-16 w-16 rounded-2xl border-2 border-dashed border-[var(--card-border)] hover:border-accent flex flex-col items-center justify-center gap-1 text-secondary-light dark:text-secondary-dark active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <Camera size={16} />
              <span className="text-[9px] font-bold">Camera</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressing || pendingReceipts.length >= MAX_RECEIPTS_PER_EXPENSE}
              className="h-16 w-16 rounded-2xl border-2 border-dashed border-[var(--card-border)] hover:border-accent flex flex-col items-center justify-center gap-1 text-secondary-light dark:text-secondary-dark active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ImageIcon size={16} />
              <span className="text-[9px] font-bold">Gallery</span>
            </button>

            {/* Thumbnail previews */}
            {pendingReceipts.map((rcpt, idx) => (
              <div
                key={idx}
                className="relative h-16 w-16 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shrink-0 group"
              >
                <img
                  src={rcpt.previewUrl}
                  alt="Receipt"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePendingReceipt(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer shadow-xs active:scale-90"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 pb-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={amountPaise <= 0 || isCompressing}
            className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-sm shadow-md shadow-accent/25 hover:shadow-accent/40 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{expenseToEdit ? 'Save Expense' : 'Record Expense'}</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
