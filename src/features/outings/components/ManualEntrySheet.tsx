/**
 * LifeOS — ManualEntrySheet Component
 *
 * Handles two manual entry types within an Outing:
 * 1. Shopping Receipt — record a shopping receipt total (no splitting/people)
 * 2. Money Lend / Received — record giving or receiving money with/from a person
 *
 * No AI/API usage — pure manual entry, stored as OutingExpense records
 * with appropriate categories and personal split modes.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { BottomSheet } from '../../../components/BottomSheet';
import { parseRupeesToPaise, formatPaiseToRupees } from '../utils/calculations';
import { triggerHaptic } from '../../../utils/haptics';
import { useOutings } from '../context/OutingsContext';
import type { Outing } from '../types';

type EntryMode = 'shopping' | 'lend' | 'received';

interface ManualEntrySheetProps {
  isOpen: boolean;
  onClose: () => void;
  outing: Outing;
  defaultMode?: EntryMode;
}

const MODE_CONFIG: Record<
  EntryMode,
  { label: string; icon: React.ElementType; color: string; bgColor: string; borderColor: string }
> = {
  shopping: {
    label: 'Shopping Receipt',
    icon: ShoppingBag,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
  },
  lend: {
    label: 'Money I Lent',
    icon: ArrowUpRight,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
  received: {
    label: 'Money I Received',
    icon: ArrowDownLeft,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
};

export function ManualEntrySheet({
  isOpen,
  onClose,
  outing,
  defaultMode = 'shopping',
}: ManualEntrySheetProps) {
  const { people, addExpense } = useOutings();

  const [mode, setMode] = useState<EntryMode>(defaultMode);
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [spentAt, setSpentAt] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Participants excluding "me" (for lend/received)
  const otherPeople = people.filter((p) => !p.isMe && !p.archived);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setAmountInput('');
      setDescription('');
      setSelectedPersonId(otherPeople[0]?.id || '');
      setSpentAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setNote('');
      setError(null);
    }
  }, [isOpen, defaultMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first person when mode changes to lend/received
  useEffect(() => {
    if ((mode === 'lend' || mode === 'received') && !selectedPersonId && otherPeople.length > 0) {
      setSelectedPersonId(otherPeople[0].id);
    }
  }, [mode, selectedPersonId, otherPeople]);

  const amountPaise = parseRupeesToPaise(amountInput);

  const handleSave = async () => {
    if (amountPaise <= 0) {
      setError('Amount must be greater than zero');
      triggerHaptic('error');
      return;
    }

    if ((mode === 'lend' || mode === 'received') && !selectedPersonId) {
      setError('Please select a person');
      triggerHaptic('error');
      return;
    }

    setError(null);
    setIsSaving(true);
    triggerHaptic('save');

    try {
      const now = new Date(spentAt).toISOString();

      if (mode === 'shopping') {
        // Shopping receipt — personal expense, only "me"
        await addExpense({
          outingId: outing.id,
          title: description.trim() || 'Shopping Receipt',
          amount: amountPaise,
          category: 'Shopping',
          paidByPersonId: 'me',
          splitMode: 'personal',
          shares: [{ personId: 'me', amount: amountPaise }],
          paymentMethod: 'cash',
          spentAt: now,
          note: note.trim() || undefined,
        });
      } else if (mode === 'lend') {
        // I lent money to someone — I paid, only they owe (custom split: full to them)
        await addExpense({
          outingId: outing.id,
          title: description.trim() || `Lent to ${people.find((p) => p.id === selectedPersonId)?.name || 'Person'}`,
          amount: amountPaise,
          category: 'Other',
          paidByPersonId: 'me',
          splitMode: 'custom',
          shares: [
            { personId: selectedPersonId, amount: amountPaise },
          ],
          paymentMethod: 'cash',
          spentAt: now,
          note: note.trim() || 'Money lent',
        });
      } else {
        // I received money from someone — they paid, I keep all (personal to me)
        await addExpense({
          outingId: outing.id,
          title: description.trim() || `Received from ${people.find((p) => p.id === selectedPersonId)?.name || 'Person'}`,
          amount: amountPaise,
          category: 'Other',
          paidByPersonId: selectedPersonId,
          splitMode: 'personal',
          shares: [{ personId: 'me', amount: amountPaise }],
          paymentMethod: 'cash',
          spentAt: now,
          note: note.trim() || 'Money received',
        });
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save entry');
    } finally {
      setIsSaving(false);
    }
  };

  const config = MODE_CONFIG[mode];
  const ModeIcon = config.icon;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 pt-1 pb-6 select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-heading font-bold text-primary-light dark:text-primary-dark">
            Manual Entry
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05]">
          {(Object.keys(MODE_CONFIG) as EntryMode[]).map((m) => {
            const cfg = MODE_CONFIG[m];
            const Icon = cfg.icon;
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setMode(m);
                  setError(null);
                }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 transition-all ${
                  active
                    ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} border shadow-sm`
                    : 'text-secondary-light dark:text-secondary-dark'
                }`}
              >
                <Icon size={16} strokeWidth={2.3} />
                <span className="leading-tight text-center">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mode Badge */}
        <div className={`flex items-center gap-2 p-2.5 rounded-2xl ${config.bgColor} ${config.borderColor} border`}>
          <ModeIcon size={14} className={config.color} />
          <span className={`text-xs font-semibold ${config.color}`}>
            {mode === 'shopping' && 'Record a shopping receipt as your personal expense'}
            {mode === 'lend' && 'Record money you lent — they will owe you this amount'}
            {mode === 'received' && 'Record money you received — tracked as settlement credit'}
          </span>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Amount Field */}
        <div className="p-4 rounded-[24px] bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-center">
          <label className="block text-[11px] font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1">
            Amount (₹)
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
              autoFocus
            />
          </div>
          {amountPaise > 0 && (
            <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
              {formatPaiseToRupees(amountPaise)}
            </p>
          )}
        </div>

        {/* Person Selector (for lend/received only) */}
        {(mode === 'lend' || mode === 'received') && (
          <div>
            <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
              {mode === 'lend' ? 'Lent To' : 'Received From'}
            </label>
            {otherPeople.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 py-2">
                No other participants added to this outing yet. Add people first in the People tab.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {otherPeople.map((p) => {
                  const active = selectedPersonId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setSelectedPersonId(p.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        active
                          ? 'bg-accent text-white border-accent shadow-xs'
                          : 'bg-black/[0.02] dark:bg-white/[0.03] border-[var(--card-border)] text-secondary-light dark:text-secondary-dark'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              mode === 'shopping'
                ? 'e.g. Big Bazaar groceries'
                : mode === 'lend'
                ? 'e.g. Bus fare advance'
                : 'e.g. Returned share from dinner'
            }
            className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-sm text-primary-light dark:text-primary-dark placeholder:text-muted-light focus:outline-none focus:border-accent"
          />
        </div>

        {/* Date & Time */}
        <div>
          <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={spentAt}
            onChange={(e) => setSpentAt(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent"
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark mb-1.5">
            Note (Optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any additional context..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-sm text-primary-light dark:text-primary-dark placeholder:text-muted-light focus:outline-none focus:border-accent resize-none"
          />
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={amountPaise <= 0 || isSaving || ((mode === 'lend' || mode === 'received') && !selectedPersonId)}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mode === 'shopping'
                ? 'bg-indigo-600 text-white shadow-indigo-500/25'
                : mode === 'lend'
                ? 'bg-rose-600 text-white shadow-rose-500/25'
                : 'bg-emerald-600 text-white shadow-emerald-500/25'
            }`}
          >
            <ModeIcon size={16} strokeWidth={2.4} />
            <span>
              {isSaving
                ? 'Saving...'
                : mode === 'shopping'
                ? 'Record Shopping Receipt'
                : mode === 'lend'
                ? 'Record Money Lent'
                : 'Record Money Received'}
            </span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
