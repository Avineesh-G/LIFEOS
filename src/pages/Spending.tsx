import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
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
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  HandCoins,
} from '../ui';

interface SpendingProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Education', 'Entertainment', 'Other'];

export default function Spending({ data, updateData }: SpendingProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as 'expenses' | 'lent') || 'expenses';

  const setTab = (newTab: 'expenses' | 'lent') => {
    triggerHaptic('selection');
    setSearchParams(newTab === 'expenses' ? {} : { tab: newTab });
  };

  // Dedicated Sheet visibility states for the two pages
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddLentOpen, setIsAddLentOpen] = useState(false);

  // ── Page 1: Expense Form State ──
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseNote, setExpenseNote] = useState('');

  // ── Page 2: Money Lent & Borrowed Form State ──
  const [lentType, setLentType] = useState<'given' | 'borrowed'>('given');
  const [lentPerson, setLentPerson] = useState('');
  const [lentAmount, setLentAmount] = useState('');
  const [lentNote, setLentNote] = useState('');
  const [lentStatusFilter, setLentStatusFilter] = useState<'all' | 'pending' | 'returned'>('all');
  const [lentDirectionFilter, setLentDirectionFilter] = useState<'all' | 'given' | 'borrowed'>('all');

  // Month stats for Expenses
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

  // Money Lent & Borrowed Calculations
  const {
    totalGivenPending,
    totalBorrowedPending,
    netPending,
    givenCount,
    borrowedCount,
    filteredLentItems,
  } = useMemo(() => {
    const items = data.moneyLent || [];

    let givenSum = 0;
    let borrowedSum = 0;
    let gCount = 0;
    let bCount = 0;

    items.forEach((item) => {
      const isPending = item.status !== 'returned';
      const isGiven = item.type !== 'borrowed';

      if (isPending) {
        if (isGiven) {
          givenSum += item.amount;
          gCount++;
        } else {
          borrowedSum += item.amount;
          bCount++;
        }
      }
    });

    const filtered = items.filter((item) => {
      const matchStatus =
        lentStatusFilter === 'all' || item.status === lentStatusFilter;
      const itemType = item.type || 'given';
      const matchDirection =
        lentDirectionFilter === 'all' || itemType === lentDirectionFilter;
      return matchStatus && matchDirection;
    });

    return {
      totalGivenPending: givenSum,
      totalBorrowedPending: borrowedSum,
      netPending: givenSum - borrowedSum,
      givenCount: gCount,
      borrowedCount: bCount,
      filteredLentItems: filtered,
    };
  }, [data.moneyLent, lentStatusFilter, lentDirectionFilter]);

  // ── Expense Handlers ──
  const handleAddExpense = async () => {
    const num = parseFloat(expenseAmount);
    if (isNaN(num) || num <= 0) return;
    triggerHaptic('success');

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      amount: num,
      category: expenseCategory,
      note: expenseNote.trim() || undefined,
      date: format(new Date(), 'yyyy-MM-dd'),
    };

    const updated = [newExpense, ...(data.expenses || [])];
    await updateData({ expenses: updated });

    setExpenseAmount('');
    setExpenseNote('');
    setIsAddExpenseOpen(false);
  };

  const handleDeleteExpense = async (id: string) => {
    triggerHaptic('error');
    const updated = (data.expenses || []).filter((e) => e.id !== id);
    await updateData({ expenses: updated });
  };

  // ── Money Lent & Borrowed Handlers ──
  const handleAddLentItem = async () => {
    const num = parseFloat(lentAmount);
    const person = lentPerson.trim();
    if (!person || isNaN(num) || num <= 0) return;
    triggerHaptic('success');

    const newItem: MoneyLentItem = {
      id: `lent_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      personName: person,
      amount: num,
      date: format(new Date(), 'yyyy-MM-dd'),
      note: lentNote.trim() || undefined,
      type: lentType,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [newItem, ...(data.moneyLent || [])];
    await updateData({ moneyLent: updated });

    setLentPerson('');
    setLentAmount('');
    setLentNote('');
    setLentType('given');
    setIsAddLentOpen(false);
  };

  const handleToggleLentStatus = async (item: MoneyLentItem) => {
    triggerHaptic(item.status === 'pending' ? 'save' : 'selection');
    const newStatus: 'pending' | 'returned' = item.status === 'pending' ? 'returned' : 'pending';
    const updated: MoneyLentItem[] = (data.moneyLent || []).map((i) => {
      if (i.id === item.id) {
        return {
          ...i,
          status: newStatus,
          returnedDate: newStatus === 'returned' ? format(new Date(), 'yyyy-MM-dd') : undefined,
        };
      }
      return i;
    });
    await updateData({ moneyLent: updated });
  };

  const handleDeleteLentItem = async (id: string) => {
    triggerHaptic('error');
    const updated = (data.moneyLent || []).filter((i) => i.id !== id);
    await updateData({ moneyLent: updated });
  };

  return (
    <div className="w-full text-white selection:bg-[#30D158]/30">
      {/* ── Dynamic Large Title Header for Each Page ── */}
      <LargeTitleHeader
        title={currentTab === 'expenses' ? 'Spending' : 'Money Lent & Borrowed'}
        subtitle={
          currentTab === 'expenses'
            ? `Rs ${monthTotal} spent this month · Budget Rs ${monthlyBudget}`
            : `Rs ${netPending >= 0 ? '+' : ''}${netPending} net · Rs ${totalGivenPending} lent, Rs ${totalBorrowedPending} borrowed`
        }
        tint={currentTab === 'expenses' ? '#30D158' : '#38BDF8'}
        actions={
          currentTab === 'expenses' ? (
            <Button
              variant="glass"
              tint="#30D158"
              size="sm"
              onClick={() => {
                triggerHaptic('light');
                setIsAddExpenseOpen(true);
              }}
              icon={<Plus size={16} weight="bold" />}
            >
              Add Expense
            </Button>
          ) : (
            <Button
              variant="glass"
              tint="#38BDF8"
              size="sm"
              onClick={() => {
                triggerHaptic('light');
                setIsAddLentOpen(true);
              }}
              icon={<Plus size={16} weight="bold" />}
            >
              Add Record
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3.5 pb-2">
        {/* ── Sub-Page Navigation Segmented Switcher ── */}
        <Segmented<'expenses' | 'lent'>
          options={[
            { value: 'expenses', label: 'Expenses (Daily Spend)' },
            { value: 'lent', label: 'Money Given & Borrowed' },
          ]}
          value={currentTab}
          onChange={setTab}
          tint={currentTab === 'expenses' ? '#30D158' : '#38BDF8'}
        />

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── SUB-PAGE 1: DAILY EXPENSES & MONEY ENTRY ── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {currentTab === 'expenses' ? (
          <>
            {/* 1. Hero Monthly Ledger Card */}
            <div className="w-full glass-hero p-5 rounded-[32px] flex flex-col gap-4 shadow-xl select-none relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  background: 'radial-gradient(ellipse at top left, #30D158 0%, transparent 70%)',
                }}
              />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[rgba(235,235,245,0.60)]">
                    TOTAL MONTHLY SPEND
                  </span>
                  <div className="text-4xl font-black text-[#30D158] tabular-nums tracking-tight mt-1">
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
              <div className="flex flex-col gap-1.5 pt-2 relative z-10">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[rgba(235,235,245,0.60)]">Budget Utilization</span>
                  <span className="text-white">{Math.round(budgetPercent * 100)}%</span>
                </div>
                <ProgressBar progress={budgetPercent} height={6} color="#30D158" />
              </div>
            </div>

            {/* 2. Category Breakdown */}
            {categoryBreakdown.length > 0 && (
              <div className="w-full glass-card rounded-[26px] p-4 flex flex-col gap-3 select-none">
                <span className="text-xs font-bold text-[rgba(235,235,245,0.60)] uppercase tracking-wider">
                  Category Breakdown
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

            {/* 3. Transaction History */}
            {(data.expenses || []).length === 0 ? (
              <EmptyState
                icon={<Wallet weight="bold" />}
                title="No Expenses Logged"
                description="Keep track of your coffee, food, groceries and daily purchases."
                actionLabel="Log First Expense"
                onAction={() => {
                  triggerHaptic('light');
                  setIsAddExpenseOpen(true);
                }}
                tint="#30D158"
              />
            ) : (
              <GroupedList header="Recent Transactions">
                {(data.expenses || []).slice(0, 20).map((exp) => (
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
                      subtitle={`${exp.category} · ${exp.date}`}
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
          /* ══════════════════════════════════════════════════════════════════ */
          /* ── SUB-PAGE 2: MONEY GIVEN & MONEY LENT FROM OTHERS ── */
          /* ══════════════════════════════════════════════════════════════════ */
          <>
            {/* 1. Hero Multi-Metric Summary Deck */}
            <div className="w-full glass-hero p-5 rounded-[32px] flex flex-col gap-4 shadow-xl select-none relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  background: 'radial-gradient(ellipse at top left, #38BDF8 0%, transparent 70%)',
                }}
              />

              {/* Main Headline Metric: Net Balance Position */}
              <div className="flex items-start justify-between relative z-10">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[rgba(235,235,245,0.60)]">
                    OVERALL NET POSITION
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span
                      className={`text-4xl font-black tabular-nums tracking-tight ${
                        netPending > 0
                          ? 'text-[#30D158]'
                          : netPending < 0
                            ? 'text-[#FF453A]'
                            : 'text-white'
                      }`}
                    >
                      Rs {netPending > 0 ? `+${netPending}` : netPending}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        netPending > 0
                          ? 'bg-[#30D158]/15 text-[#30D158]'
                          : netPending < 0
                            ? 'bg-[#FF453A]/15 text-[#FF453A]'
                            : 'bg-white/10 text-white/70'
                      }`}
                    >
                      {netPending > 0
                        ? 'Net Receivable'
                        : netPending < 0
                          ? 'Net Payable'
                          : 'All Settled'}
                    </span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-xs text-[rgba(235,235,245,0.50)]">Active Records</span>
                  <div className="text-lg font-bold text-white tabular-nums">
                    {givenCount + borrowedCount} pending
                  </div>
                </div>
              </div>

              {/* Flow Split Visual Ratio Bar & Details */}
              <div className="flex flex-col gap-2 pt-1 relative z-10">
                {/* Visual Ratio Bar */}
                <div className="h-1.5 w-full rounded-full bg-white/10 flex overflow-hidden">
                  <div
                    className="h-full bg-[#30D158] transition-all duration-300"
                    style={{
                      width: `${
                        totalGivenPending + totalBorrowedPending > 0
                          ? (totalGivenPending / (totalGivenPending + totalBorrowedPending)) * 100
                          : 50
                      }%`,
                    }}
                  />
                  <div
                    className="h-full bg-[#FF453A] transition-all duration-300"
                    style={{
                      width: `${
                        totalGivenPending + totalBorrowedPending > 0
                          ? (totalBorrowedPending / (totalGivenPending + totalBorrowedPending)) * 100
                          : 50
                      }%`,
                    }}
                  />
                </div>

                {/* Integrated Dual Metrics: To Receive vs To Pay */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* To Receive (Lent) */}
                  <div className="p-3 rounded-2xl glass-tile flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[rgba(235,235,245,0.60)] uppercase tracking-wider">
                        To Receive (Lent)
                      </span>
                      <div className="w-5 h-5 rounded-full bg-[#30D158]/20 text-[#30D158] flex items-center justify-center">
                        <ArrowUpRight size={13} weight="bold" />
                      </div>
                    </div>
                    <div className="text-xl font-black text-[#30D158] tabular-nums mt-0.5">
                      Rs {totalGivenPending}
                    </div>
                    <span className="text-[10px] text-[rgba(235,235,245,0.45)]">
                      {givenCount} pending loan{givenCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  {/* To Pay (Borrowed) */}
                  <div className="p-3 rounded-2xl glass-tile flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[rgba(235,235,245,0.60)] uppercase tracking-wider">
                        To Pay (Borrowed)
                      </span>
                      <div className="w-5 h-5 rounded-full bg-[#FF453A]/20 text-[#FF453A] flex items-center justify-center">
                        <ArrowDownLeft size={13} weight="bold" />
                      </div>
                    </div>
                    <div className="text-xl font-black text-[#FF453A] tabular-nums mt-0.5">
                      Rs {totalBorrowedPending}
                    </div>
                    <span className="text-[10px] text-[rgba(235,235,245,0.45)]">
                      {borrowedCount} pending debt{borrowedCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Direction & Status Filter Bar */}
            <div className="flex flex-col gap-2 select-none">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(['all', 'given', 'borrowed'] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setLentDirectionFilter(dir);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      lentDirectionFilter === dir
                        ? 'bg-[#38BDF8] text-black font-bold shadow-sm'
                        : 'glass-tile text-[rgba(235,235,245,0.60)] hover:text-white'
                    }`}
                  >
                    {dir === 'all'
                      ? 'All Flows'
                      : dir === 'given'
                      ? 'Money Given (Lent)'
                      : 'Money Borrowed'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(['all', 'pending', 'returned'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setLentStatusFilter(st);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      lentStatusFilter === st
                        ? 'bg-white/20 text-white font-bold'
                        : 'glass-flat text-[rgba(235,235,245,0.45)] hover:text-white'
                    }`}
                  >
                    {st === 'all' ? 'All Status' : st === 'pending' ? 'Pending' : 'Settled / Returned'}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Debt & Lending Items Ledger */}
            {filteredLentItems.length === 0 ? (
              <EmptyState
                icon={<HandCoins weight="duotone" className="text-[#38BDF8]" />}
                title="No Records Found"
                description={
                  (data.moneyLent || []).length === 0
                    ? 'Log money given to friends or money borrowed from others to track your debts and receivables.'
                    : 'No entries match your selected direction or status filters.'
                }
                actionLabel="Add Record"
                onAction={() => {
                  triggerHaptic('light');
                  setIsAddLentOpen(true);
                }}
                tint="#38BDF8"
              />
            ) : (
              <GroupedList header="Lent & Borrowed Ledger">
                {filteredLentItems.map((item) => {
                  const isGiven = item.type !== 'borrowed';
                  const isReturned = item.status === 'returned';

                  return (
                    <SwipeActions
                      key={item.id}
                      actions={[
                        {
                          key: 'toggle-status',
                          label: isReturned ? 'Reopen' : 'Settle',
                          icon: isReturned ? (
                            <Clock size={18} weight="bold" />
                          ) : (
                            <Check size={18} weight="bold" />
                          ),
                          color: isReturned ? '#FF9F0A' : '#30D158',
                          onClick: () => handleToggleLentStatus(item),
                        },
                        {
                          key: 'delete',
                          label: 'Delete',
                          icon: <Trash size={18} weight="bold" />,
                          color: '#FF453A',
                          onClick: () => handleDeleteLentItem(item.id),
                        },
                      ]}
                    >
                      <ListRow
                        icon={
                          isGiven ? (
                            <ArrowUpRight size={18} weight="bold" />
                          ) : (
                            <ArrowDownLeft size={18} weight="bold" />
                          )
                        }
                        iconTint={isGiven ? '#30D158' : '#FF453A'}
                        title={item.personName}
                        subtitle={`${isGiven ? 'Given (Lent)' : 'Borrowed'} · ${item.date}${
                          item.note ? ` · ${item.note}` : ''
                        }`}
                        trailing={
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`font-bold tabular-nums text-sm ${
                                isGiven ? 'text-[#30D158]' : 'text-[#FF453A]'
                              }`}
                            >
                              {isGiven ? '+' : '-'}Rs {item.amount}
                            </span>
                            <span
                              className={`text-[9.5px] px-2 py-0.5 rounded-full font-semibold ${
                                isReturned
                                  ? 'bg-[#30D158]/20 text-[#30D158]'
                                  : 'bg-[#FF9F0A]/20 text-[#FF9F0A]'
                              }`}
                            >
                              {isReturned ? 'Settled' : 'Pending'}
                            </span>
                          </div>
                        }
                      />
                    </SwipeActions>
                  );
                })}
              </GroupedList>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 1: DEDICATED ADD EXPENSE SHEET (Daily Spends Page) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Sheet
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        detent="half"
        title="Log Expense"
      >
        <div className="flex flex-col gap-4 py-2">
          <TextField
            label="Amount (Rs)"
            type="number"
            placeholder="150"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            autoFocus
          />

          <TextField
            label="Note / Description"
            placeholder="Lunch, Taxi, Groceries..."
            value={expenseNote}
            onChange={(e) => setExpenseNote(e.target.value)}
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
                    setExpenseCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    expenseCategory === cat
                      ? 'glass-tile text-[#30D158] font-bold shadow-sm'
                      : 'glass-flat text-[rgba(235,235,245,0.60)] hover:text-white'
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
              disabled={!expenseAmount.trim()}
              onClick={handleAddExpense}
            >
              Save Expense
            </Button>
          </div>
        </div>
      </Sheet>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL 2: DEDICATED ADD MONEY LENT / BORROWED SHEET (Debts Page) ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Sheet
        isOpen={isAddLentOpen}
        onClose={() => setIsAddLentOpen(false)}
        detent="half"
        title="Add Lent / Borrowed Record"
      >
        <div className="flex flex-col gap-4 py-2">
          {/* Flow Direction Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-[rgba(235,235,245,0.60)] pl-1">
              Transaction Flow
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setLentType('given');
                }}
                className={`py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  lentType === 'given'
                    ? 'bg-[#30D158]/20 text-[#30D158] shadow-sm'
                    : 'glass-tile text-[rgba(235,235,245,0.60)]'
                }`}
              >
                <ArrowUpRight size={15} weight="bold" />
                <span>I Gave (Lent)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  setLentType('borrowed');
                }}
                className={`py-2.5 px-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  lentType === 'borrowed'
                    ? 'bg-[#FF453A]/20 text-[#FF453A] shadow-sm'
                    : 'glass-tile text-[rgba(235,235,245,0.60)]'
                }`}
              >
                <ArrowDownLeft size={15} weight="bold" />
                <span>I Borrowed</span>
              </button>
            </div>
          </div>

          <TextField
            label="Person / Contact Name"
            placeholder="Rahul, Priya, Landlord, Roommate..."
            value={lentPerson}
            onChange={(e) => setLentPerson(e.target.value)}
            autoFocus
          />

          <TextField
            label="Amount (Rs)"
            type="number"
            placeholder="500"
            value={lentAmount}
            onChange={(e) => setLentAmount(e.target.value)}
          />

          <TextField
            label="Note / Purpose (Optional)"
            placeholder="Dinner split, Movie, Rent share, Advance..."
            value={lentNote}
            onChange={(e) => setLentNote(e.target.value)}
          />

          <div className="pt-3">
            <Button
              variant="prominent"
              tint="#38BDF8"
              className="w-full text-black font-bold"
              disabled={!lentPerson.trim() || !lentAmount.trim()}
              onClick={handleAddLentItem}
            >
              {lentType === 'given' ? 'Save Lent Entry' : 'Save Borrowed Entry'}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
