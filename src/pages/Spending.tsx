import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppData, Expense, MoneyLentItem } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  LargeTitleHeader,
  GroupedList,
  ListRow,
  SwipeActions,
  Segmented,
  Button,
  ProgressBar,
  Sheet,
  TextField,
  EmptyState,
  Wallet,
  Plus,
  Trash,
  Check,
} from '../ui';

interface SpendingProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Education', 'Entertainment', 'Other'];

export default function Spending({ data, updateData }: SpendingProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'expenses' | 'lent'>('expenses');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New Expense form
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');

  // Month stats
  const { monthExpenses, monthTotal, todayTotal, categoryBreakdown } = useMemo(() => {
    const nowDate = new Date();
    const start = startOfMonth(nowDate);
    const end = endOfMonth(nowDate);
    const todayStr = format(nowDate, 'yyyy-MM-dd');

    const mExpenses = (data.expenses || []).filter((e) => {
      try {
        return isWithinInterval(parseISO(e.date), { start, end });
      } catch {
        return false;
      }
    });

    const mTotal = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    const tTotal = (data.expenses || [])
      .filter((e) => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);

    const catTotals: Record<string, number> = {};
    mExpenses.forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });

    const breakdown = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

    return {
      monthExpenses: mExpenses,
      monthTotal: mTotal,
      todayTotal: tTotal,
      categoryBreakdown: breakdown,
    };
  }, [data.expenses]);

  const monthlyBudget = 10000;
  const budgetPercent = Math.min(1, monthTotal / monthlyBudget);

  const handleAddExpense = async () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    triggerHaptic('success');

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      amount: num,
      category,
      note: note.trim() || undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
    };

    const updated = [newExpense, ...(data.expenses || [])];
    await updateData({ expenses: updated });

    setAmount('');
    setNote('');
    setIsAddOpen(false);
  };

  const handleDeleteExpense = async (id: string) => {
    triggerHaptic('error');
    const updated = (data.expenses || []).filter((e) => e.id !== id);
    await updateData({ expenses: updated });
  };

  return (
    <div className="w-full text-white selection:bg-[#30D158]/30">
      <LargeTitleHeader
        title="Spending"
        subtitle={`Rs ${monthTotal} spent this month`}
        tint="#30D158"
        onBack={() => navigate('/')}
        actions={
          <Button
            variant="glass"
            tint="#30D158"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            icon={<Plus size={16} weight="bold" />}
          >
            Add Expense
          </Button>
        }
      />

      <div className="flex flex-col gap-3 pb-2">
        {/* Tab Switcher */}
        <Segmented<'expenses' | 'lent'>
          options={[
            { value: 'expenses', label: 'Expenses' },
            { value: 'lent', label: 'Money Lent' },
          ]}
          value={tab}
          onChange={setTab}
          tint="#30D158"
        />

        {tab === 'expenses' ? (
          <>
            {/* ── 1. Hero Monthly Ledger Card (r-hero 32, surface-1) ── */}
            <div className="w-full bg-[#1C1C1E] rounded-[32px] p-5 border border-white/[0.06] flex flex-col gap-4 shadow-xl select-none">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[rgba(235,235,245,0.60)]">
                    TOTAL MONTHLY SPEND
                  </span>
                  <div className="text-4xl font-extrabold text-[#30D158] tabular-nums tracking-tight mt-1">
                    Rs {monthTotal}{' '}
                    <span className="text-sm font-normal text-[rgba(235,235,245,0.40)]">
                      / Rs {monthlyBudget}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[rgba(235,235,245,0.50)]">Today</span>
                  <div className="text-lg font-bold text-white tabular-nums">
                    Rs {todayTotal}
                  </div>
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[rgba(235,235,245,0.60)]">Budget Utilization</span>
                  <span className="text-white">{Math.round(budgetPercent * 100)}%</span>
                </div>
                <ProgressBar progress={budgetPercent} height={6} color="#30D158" />
              </div>
            </div>

            {/* ── 2. Category Breakdown ── */}
            {categoryBreakdown.length > 0 && (
              <div className="w-full bg-[#1C1C1E] rounded-[26px] p-4 border border-white/[0.06] flex flex-col gap-3 select-none">
                <span className="text-xs font-bold text-[rgba(235,235,245,0.60)]">
                  CATEGORY BREAKDOWN
                </span>
                <div className="flex flex-col gap-2.5">
                  {categoryBreakdown.map(([cat, amt]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-white font-semibold">{cat}</span>
                        <span className="text-[rgba(235,235,245,0.60)] tabular-nums">
                          Rs {amt} ({Math.round((amt / (monthTotal || 1)) * 100)}%)
                        </span>
                      </div>
                      <ProgressBar
                        progress={amt / (monthTotal || 1)}
                        height={4}
                        color="#30D158"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 3. Transaction History ── */}
            {(data.expenses || []).length === 0 ? (
              <EmptyState
                icon={<Wallet weight="bold" />}
                title="No Expenses Logged"
                description="Keep track of your coffee, food, groceries and daily purchases."
                actionLabel="Log First Expense"
                onAction={() => setIsAddOpen(true)}
                tint="#30D158"
              />
            ) : (
              <GroupedList header="Recent Transactions">
                {(data.expenses || []).slice(0, 15).map((exp) => (
                  <SwipeActions
                    key={exp.id}
                    actions={[
                      {
                        key: 'delete',
                        label: 'Delete',
                        icon: <Trash size={18} weight="bold" />,
                        color: '#FF453A',
                        onClick: () => handleDeleteExpense(exp.id),
                      },
                    ]}
                  >
                    <ListRow
                      icon={<Wallet weight="bold" />}
                      iconTint="#30D158"
                      title={exp.note || exp.category}
                      subtitle={`${exp.category} • ${exp.date}`}
                      trailing={
                        <span className="text-white font-bold tabular-nums">
                          Rs {exp.amount}
                        </span>
                      }
                    />
                  </SwipeActions>
                ))}
              </GroupedList>
            )}
          </>
        ) : (
          /* Money Lent View */
          <GroupedList header="Pending Loans">
            {(data.moneyLent || []).length === 0 ? (
              <div className="p-6 text-center text-sm text-[rgba(235,235,245,0.50)]">
                No money lent to friends or colleagues recorded.
              </div>
            ) : (
              (data.moneyLent || []).map((lent) => (
                <ListRow
                  key={lent.id}
                  title={lent.personName}
                  subtitle={lent.note || lent.date}
                  trailing={`Rs ${lent.amount}`}
                />
              ))
            )}
          </GroupedList>
        )}
      </div>

      {/* Add Expense Sheet */}
      <Sheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        detent="half"
        title="Log Expense"
      >
        <div className="flex flex-col gap-4 py-2">
          <TextField
            label="Amount (Rs)"
            type="number"
            placeholder="150"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />

          <TextField
            label="Note / Description"
            placeholder="Lunch, Taxi, Groceries..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[rgba(235,235,245,0.60)] pl-1">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    category === cat
                      ? 'bg-[#30D158] text-black font-bold'
                      : 'bg-[#2C2C2E] text-[rgba(235,235,245,0.60)] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3">
            <Button
              variant="prominent"
              tint="#30D158"
              className="w-full text-black font-bold"
              disabled={!amount.trim()}
              onClick={handleAddExpense}
            >
              Save Expense
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
