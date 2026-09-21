/**
 * LifeOS — SettleUpModal Component
 * 
 * Shows peer-to-peer net balances and greedy minimal payment settlements:
 * - Net balance per person (creditors, debtors, settled)
 * - Suggested minimal payments
 * - "Mark as Paid" action (with partial amount support)
 * - Recorded settlements list with undo
 * - Plain-text recap generator for clipboard & Android share sheet
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Share2,
  Copy,
  Check,
  Undo2,
  Users,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';
import { BottomSheet } from '../../../components/BottomSheet';
import { formatPaiseToRupees, parseRupeesToPaise } from '../utils/calculations';
import { triggerHaptic } from '../../../utils/haptics';
import { useOutings } from '../context/OutingsContext';
import type { Outing, OutingSummary, SuggestedPayment } from '../types';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  outing: Outing;
  summary: OutingSummary | null;
}

export function SettleUpModal({ isOpen, onClose, outing, summary }: SettleUpModalProps) {
  const { people, activeSettlements, addSettlement, deleteSettlement } = useOutings();

  const [copied, setCopied] = useState(false);
  const [partialPaymentTarget, setPartialPaymentTarget] = useState<SuggestedPayment | null>(null);
  const [partialAmountInput, setPartialAmountInput] = useState('');

  const personNameMap = new Map<string, string>();
  for (const p of people) {
    personNameMap.set(p.id, p.isMe ? 'Me (You)' : p.name);
  }

  const getPersonName = (id: string) => personNameMap.get(id) || 'Someone';

  const isAllSettled = summary?.isSettled ?? false;

  // Handle Mark as Paid
  const handleMarkPayment = async (fromId: string, toId: string, amountPaise: number) => {
    triggerHaptic('save');
    await addSettlement({
      outingId: outing.id,
      fromPersonId: fromId,
      toPersonId: toId,
      amount: amountPaise,
    });
    setPartialPaymentTarget(null);
    setPartialAmountInput('');
  };

  // Generate plain-text recap
  const generateRecapText = (): string => {
    if (!summary) return '';
    const lines: string[] = [];
    lines.push(`📍 ${outing.name} — Expense Recap`);
    if (outing.place) lines.push(`Place: ${outing.place}`);
    lines.push(`Total Spent: ${formatPaiseToRupees(summary.totalCost)}`);
    lines.push('');
    lines.push('⚖️ Net Balances:');

    for (const [pId, bal] of summary.balances.entries()) {
      const name = getPersonName(pId);
      if (bal > 0) {
        lines.push(`• ${name}: gets back ${formatPaiseToRupees(bal)}`);
      } else if (bal < 0) {
        lines.push(`• ${name}: owes ${formatPaiseToRupees(Math.abs(bal))}`);
      } else {
        lines.push(`• ${name}: Settled (₹0)`);
      }
    }

    if (summary.suggestedPayments.length > 0) {
      lines.push('');
      lines.push('🤝 Suggested Payments:');
      for (const p of summary.suggestedPayments) {
        lines.push(
          `• ${getPersonName(p.fromPersonId)} pays ${getPersonName(p.toPersonId)} ${formatPaiseToRupees(p.amount)}`
        );
      }
    } else {
      lines.push('');
      lines.push('🎉 All balances are settled!');
    }

    return lines.join('\n');
  };

  const handleCopyRecap = async () => {
    triggerHaptic('light');
    const text = generateRecapText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShareRecap = async () => {
    triggerHaptic('light');
    const text = generateRecapText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${outing.name} Settle-Up Recap`,
          text,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyRecap();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 pt-1 pb-6 select-none">
        <div className="flex items-center justify-between pb-2 border-b border-border-light dark:border-border-dark">
          <h2 className="text-lg font-heading font-bold text-primary-light dark:text-primary-dark">
            Settle Up & Balances
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          >
            <X size={18} />
          </button>
        </div>

        {/* All Settled State */}
        {isAllSettled && (
          <div className="p-4 rounded-[24px] bg-emerald-500/10 border border-emerald-500/25 text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <h4 className="text-sm font-heading font-bold text-emerald-700 dark:text-emerald-300">
              All Balances Settled!
            </h4>
            <p className="text-xs text-secondary-light dark:text-secondary-dark">
              Everyone is squared away. No payments are currently owed.
            </p>
          </div>
        )}

        {/* 1. Net Balances Breakdown */}
        <div className="rounded-[24px] bg-black/[0.02] dark:bg-white/[0.03] border border-[var(--card-border)] p-4 space-y-2.5">
          <span className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-bold">
            Participant Balances
          </span>

          <div className="space-y-1.5">
            {summary &&
              Array.from(summary.balances.entries()).map(([personId, balance]) => {
                const name = getPersonName(personId);
                const isCreditor = balance > 0;
                const isDebtor = balance < 0;
                const isZero = balance === 0;

                return (
                  <div
                    key={personId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]"
                  >
                    <span className="text-xs font-medium text-primary-light dark:text-primary-dark truncate flex-1">
                      {name}
                    </span>

                    <span
                      className={`text-xs font-stat font-bold ${
                        isCreditor
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isDebtor
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-muted-light dark:text-muted-dark'
                      }`}
                    >
                      {isCreditor && `Gets ${formatPaiseToRupees(balance)}`}
                      {isDebtor && `Owes ${formatPaiseToRupees(Math.abs(balance))}`}
                      {isZero && 'Settled (₹0)'}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 2. Suggested Payments */}
        {summary && summary.suggestedPayments.length > 0 && (
          <div className="space-y-2">
            <span className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-bold">
              Suggested Payments ({summary.suggestedPayments.length})
            </span>

            <div className="space-y-2">
              {summary.suggestedPayments.map((payment, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[22px] bg-accent/5 border border-accent/20 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-primary-light dark:text-primary-dark truncate flex-1">
                      <span className="font-bold truncate">{getPersonName(payment.fromPersonId)}</span>
                      <ArrowRight size={13} className="text-accent shrink-0" />
                      <span className="font-bold truncate">{getPersonName(payment.toPersonId)}</span>
                    </div>

                    <span className="text-sm font-stat font-bold text-accent shrink-0">
                      {formatPaiseToRupees(payment.amount)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-accent/15">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection');
                        setPartialPaymentTarget(payment);
                        setPartialAmountInput((payment.amount / 100).toString());
                      }}
                      className="px-3 py-1 rounded-full text-[11px] font-bold text-secondary-light dark:text-secondary-dark hover:text-primary-light active:scale-95 transition-all"
                    >
                      Partial...
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleMarkPayment(payment.fromPersonId, payment.toPersonId, payment.amount)
                      }
                      className="px-3.5 py-1 rounded-full text-xs font-bold bg-accent text-white shadow-xs active:scale-95 transition-all flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Paid</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partial payment popover / input */}
        {partialPaymentTarget && (
          <div className="p-3 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-accent/30 space-y-2">
            <span className="block text-xs font-bold text-primary-light dark:text-primary-dark">
              Record Partial Payment: {getPersonName(partialPaymentTarget.fromPersonId)} →{' '}
              {getPersonName(partialPaymentTarget.toPersonId)}
            </span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-xs font-stat font-bold text-accent">₹</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={partialAmountInput}
                  onChange={(e) => setPartialAmountInput(e.target.value)}
                  placeholder="0"
                  className="w-full pl-6 pr-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] text-xs font-stat font-bold text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const amt = parseRupeesToPaise(partialAmountInput);
                  if (amt > 0) {
                    handleMarkPayment(
                      partialPaymentTarget.fromPersonId,
                      partialPaymentTarget.toPersonId,
                      amt
                    );
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold active:scale-95 transition-all"
              >
                Record
              </button>
              <button
                type="button"
                onClick={() => setPartialPaymentTarget(null)}
                className="px-2 py-1.5 text-xs text-muted-light dark:text-muted-dark hover:text-primary-light"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 3. Recorded Settlements List (with undo) */}
        {activeSettlements.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="block text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-bold">
              Recorded Settlements ({activeSettlements.length})
            </span>

            <div className="space-y-1">
              {activeSettlements.map((set) => (
                <div
                  key={set.id}
                  className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate flex-1">
                    <span className="font-bold text-primary-light dark:text-primary-dark truncate">
                      {getPersonName(set.fromPersonId)}
                    </span>
                    <ArrowRight size={11} className="text-secondary-light opacity-60 shrink-0" />
                    <span className="font-bold text-primary-light dark:text-primary-dark truncate">
                      {getPersonName(set.toPersonId)}
                    </span>
                    <span className="font-stat font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
                      {formatPaiseToRupees(set.amount)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      deleteSettlement(set.id);
                    }}
                    className="p-1 rounded-lg text-secondary-light dark:text-secondary-dark hover:text-rose-500 active:scale-90 transition-all ml-2 shrink-0"
                    title="Undo settlement"
                  >
                    <Undo2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Share & Copy Recap Actions (Sticky Footer) */}
        <div className="sticky bottom-0 -mx-6 -mb-6 px-6 pt-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom,0px)+1rem))] bg-[var(--md-surface-container-low)]/95 backdrop-blur-md border-t border-[var(--card-border)] mt-4 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyRecap}
            className="flex-1 py-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--card-border)] text-xs font-bold text-primary-light dark:text-primary-dark hover:bg-black/[0.06] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Recap'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareRecap}
            className="flex-1 py-3 rounded-2xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/25 hover:shadow-accent/40 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Share2 size={14} />
            <span>Share Recap</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
