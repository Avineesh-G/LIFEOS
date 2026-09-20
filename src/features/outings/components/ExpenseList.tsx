/**
 * LifeOS — ExpenseList Component
 * 
 * Renders expenses grouped chronologically by day:
 * - Day header with daily spend total
 * - Expense row: category icon squircle, title, "Paid by", receipt indicator
 * - Edit and delete actions
 */

import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Receipt, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { OUTING_CATEGORIES } from '../constants';
import { formatPaiseToRupees } from '../utils/calculations';
import { triggerHaptic } from '../../../utils/haptics';
import type { OutingExpense, OutingPerson } from '../types';

interface ExpenseListProps {
  expenses: OutingExpense[];
  people: OutingPerson[];
  onEditExpense: (expense: OutingExpense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export function ExpenseList({
  expenses,
  people,
  onEditExpense,
  onDeleteExpense,
}: ExpenseListProps) {
  const personNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of people) {
      map.set(p.id, p.isMe ? 'Me' : p.name);
    }
    return map;
  }, [people]);

  // Group by day (sorted newest day first, newest expense first)
  const groupedExpenses = useMemo(() => {
    const sorted = [...expenses].sort(
      (a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime()
    );

    const groups: { dateKey: string; dateDisplay: string; dayTotal: number; items: OutingExpense[] }[] = [];
    const groupMap = new Map<string, { dateDisplay: string; dayTotal: number; items: OutingExpense[] }>();

    for (const exp of sorted) {
      const dateKey = exp.spentAt.split('T')[0] || 'Unknown';
      const existing = groupMap.get(dateKey);

      if (existing) {
        existing.items.push(exp);
        existing.dayTotal += exp.amount;
      } else {
        let dateDisplay = 'Unknown Date';
        try {
          dateDisplay = format(parseISO(exp.spentAt), 'EEEE, MMMM d, yyyy');
        } catch {}

        groupMap.set(dateKey, {
          dateDisplay,
          dayTotal: exp.amount,
          items: [exp],
        });
      }
    }

    for (const [dateKey, val] of groupMap.entries()) {
      groups.push({
        dateKey,
        ...val,
      });
    }

    return groups;
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="p-8 rounded-[28px] liquid-glass border border-[var(--card-border)] text-center space-y-2 select-none">
        <div className="w-12 h-12 rounded-full bg-accent/10 text-accent mx-auto flex items-center justify-center">
          <Receipt size={24} />
        </div>
        <h4 className="text-sm font-heading font-bold text-primary-light dark:text-primary-dark">
          No Expenses Recorded Yet
        </h4>
        <p className="text-xs text-secondary-light dark:text-secondary-dark max-w-xs mx-auto">
          Tap "+ Add Expense" above to record outing spending, receipts, and splits.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {groupedExpenses.map((group) => (
        <div key={group.dateKey} className="space-y-2">
          {/* Day Group Header */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-bold">
              {group.dateDisplay}
            </span>
            <span className="font-stat font-bold text-primary-light dark:text-primary-dark">
              {formatPaiseToRupees(group.dayTotal)}
            </span>
          </div>

          {/* Expense Rows for Day */}
          <div className="rounded-[24px] liquid-glass border border-[var(--card-border)] divide-y divide-black/5 dark:divide-white/5 overflow-hidden shadow-xs">
            {group.items.map((exp) => {
              const meta = OUTING_CATEGORIES.find((c) => c.label === exp.category);
              const Icon = meta?.icon || Receipt;
              const payerName = personNameMap.get(exp.paidByPersonId) || 'Someone';
              const hasReceipts = exp.receiptIds && exp.receiptIds.length > 0;

              return (
                <div
                  key={exp.id}
                  onClick={() => onEditExpense(exp)}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  {/* Left: Icon squircle + details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 shadow-xs"
                      style={{
                        backgroundColor: meta?.color ? `${meta.color}20` : 'rgba(192, 38, 211, 0.15)',
                        color: meta?.color || '#C026D3',
                      }}
                    >
                      <Icon size={18} strokeWidth={2.2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h5 className="text-sm font-bold text-primary-light dark:text-primary-dark truncate">
                          {exp.title}
                        </h5>
                        {hasReceipts && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-accent/15 text-accent shrink-0"
                            title={`${exp.receiptIds.length} receipt(s) attached`}
                          >
                            <Receipt size={9} />
                            <span>{exp.receiptIds.length}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-secondary-light dark:text-secondary-dark truncate mt-0.5">
                        <span>Paid by {payerName}</span>
                        <span className="opacity-40 mx-1.5">•</span>
                        <span className="capitalize">
                          {exp.splitMode === 'personal'
                            ? 'Personal'
                            : exp.splitMode === 'custom'
                            ? 'Custom Split'
                            : `Equal (${exp.shares?.length || 1})`}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-stat font-bold text-primary-light dark:text-primary-dark">
                      {formatPaiseToRupees(exp.amount)}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('selection');
                        onDeleteExpense(exp.id);
                      }}
                      className="p-1.5 rounded-full text-secondary-light dark:text-secondary-dark hover:text-rose-500 active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete expense"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
