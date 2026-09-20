/**
 * LifeOS — CategoryBreakdown Component
 * 
 * Renders lightweight horizontal proportion bars for outing spending categories.
 * Zero chart libraries, pure GPU-composited CSS styling.
 */

import React, { useMemo } from 'react';
import { OUTING_CATEGORIES } from '../constants';
import { formatPaiseToRupees } from '../utils/calculations';
import type { OutingExpense } from '../types';

interface CategoryBreakdownProps {
  expenses: OutingExpense[];
  totalCost: number;
}

export function CategoryBreakdown({ expenses, totalCost }: CategoryBreakdownProps) {
  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of OUTING_CATEGORIES) {
      map.set(cat.label, 0);
    }

    for (const exp of expenses) {
      if (exp.deletedAt) continue;
      const current = map.get(exp.category) ?? 0;
      map.set(exp.category, current + exp.amount);
    }

    return Array.from(map.entries())
      .filter(([_, amount]) => amount > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  if (categoryTotals.length === 0 || totalCost <= 0) {
    return null;
  }

  return (
    <div className="rounded-[24px] liquid-glass border border-[var(--card-border)] p-4 sm:p-5 space-y-3 select-none shadow-xs">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-tag uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-bold">
          Category Breakdown
        </h4>
        <span className="text-xs font-stat font-bold text-primary-light dark:text-primary-dark">
          {formatPaiseToRupees(totalCost)}
        </span>
      </div>

      {/* Stacked Proportional Bar */}
      <div className="w-full h-2 rounded-full overflow-hidden flex bg-black/10 dark:bg-white/10">
        {categoryTotals.map(([catName, amount]) => {
          const meta = OUTING_CATEGORIES.find((c) => c.label === catName);
          const pct = Math.max(1, (amount / totalCost) * 100);
          return (
            <div
              key={catName}
              style={{
                width: `${pct}%`,
                backgroundColor: meta?.color || '#A21CAF',
              }}
              title={`${catName}: ${formatPaiseToRupees(amount)}`}
              className="h-full transition-all duration-300"
            />
          );
        })}
      </div>

      {/* Breakdown Items List */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {categoryTotals.map(([catName, amount]) => {
          const meta = OUTING_CATEGORIES.find((c) => c.label === catName);
          const pct = Math.round((amount / totalCost) * 100);
          const Icon = meta?.icon;

          return (
            <div
              key={catName}
              className="flex items-center justify-between p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.03] dark:border-white/[0.03]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: meta?.color || '#A21CAF' }}
                />
                <span className="text-xs font-medium text-primary-light dark:text-primary-dark truncate">
                  {catName}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-stat font-bold text-primary-light dark:text-primary-dark">
                  {formatPaiseToRupees(amount)}
                </span>
                <span className="text-[10px] text-muted-light dark:text-muted-dark ml-1 font-stat">
                  ({pct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
