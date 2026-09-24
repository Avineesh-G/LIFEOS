import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Wallet, X, ArrowUpRight, TrendingDown, CheckCircle2, Clock, ArrowDownLeft, HandCoins, UserCheck, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedWallet } from '../components/AnimatedIcons';
import { BottomSheet } from '../components/BottomSheet';
import { triggerHaptic } from '../utils/haptics';
import { SkeletonGate, SkeletonCard } from '../components/Skeleton';
import SegmentedTogglePill from '../components/SegmentedTogglePill';
import { useM3Feedback } from '../components/m3/M3FeedbackContext';
import type { AppData, Expense, MoneyLentItem } from '../types';

interface SpendingProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Education', 'Entertainment', 'Other'];

const CAT_STYLES: Record<string, { badge: string; text: string; bar: string }> = {
  Food: {
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    text: 'text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  Transport: {
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-500',
  },
  Shopping: {
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    text: 'text-rose-700 dark:text-rose-300',
    bar: 'bg-rose-500',
  },
  Education: {
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
    text: 'text-indigo-700 dark:text-indigo-300',
    bar: 'bg-indigo-500',
  },
  Entertainment: {
    badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    text: 'text-violet-700 dark:text-violet-300',
    bar: 'bg-violet-500',
  },
  Other: {
    badge: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300',
    text: 'text-zinc-700 dark:text-zinc-300',
    bar: 'bg-zinc-400',
  },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } };

export default function Spending({ data, updateData }: SpendingProps) {
  const { confirmDelete, showSavedFeedback } = useM3Feedback();
  const [activeTab, setActiveTab] = useState<'expenses' | 'lent'>('expenses');

  // Expense form state
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Money Lent form state
  const [showAddLent, setShowAddLent] = useState(false);
  const [lentPerson, setLentPerson] = useState('');
  const [lentAmount, setLentAmount] = useState('');
  const [lentNote, setLentNote] = useState('');
  const [lentDate, setLentDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [lentFilter, setLentFilter] = useState<'all' | 'pending' | 'returned'>('all');

  const now = new Date();

  // Expenses calculations (EXCLUDES moneyLent completely)
  const { monthExpenses, monthTotal, todayTotal, sortedCats, maxCat } = useMemo(() => {
    const nowDate = new Date();
    const start = startOfMonth(nowDate);
    const end = endOfMonth(nowDate);
    const todayStr = format(nowDate, 'yyyy-MM-dd');

    const mExpenses = (data.expenses || []).filter(e => {
      try {
        return isWithinInterval(parseISO(e.date), { start, end });
      } catch {
        return false;
      }
    });

    const mTotal = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    const tTotal = (data.expenses || [])
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);

    const categoryTotals: Record<string, number> = {};
    mExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;

    return {
      monthExpenses: mExpenses,
      monthTotal: mTotal,
      todayTotal: tTotal,
      sortedCats: sorted,
      maxCat: max,
    };
  }, [data.expenses]);

  // Money Lent calculations (isolated from total expenses)
  const lentStats = useMemo(() => {
    const all = data.moneyLent || [];
    const pending = all.filter(l => l.status === 'pending');
    const returned = all.filter(l => l.status === 'returned');
    const totalPending = pending.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const totalRecovered = returned.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    const totalEverLent = all.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
    return {
      pendingCount: pending.length,
      returnedCount: returned.length,
      totalPending,
      totalRecovered,
      totalEverLent,
    };
  }, [data.moneyLent]);

  const allRecentExpenses = useMemo(() => {
    return [...(data?.expenses || [])].reverse();
  }, [data?.expenses]);

  const allLentItems = useMemo(() => {
    const list = [...(data?.moneyLent || [])].reverse();
    if (lentFilter === 'pending') return list.filter(l => l.status === 'pending');
    if (lentFilter === 'returned') return list.filter(l => l.status === 'returned');
    return list;
  }, [data?.moneyLent, lentFilter]);

  // Handle Add Expense
  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      triggerHaptic('error');
      return;
    }
    const val = parseFloat(amount);
    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: val,
      category,
      note: note.trim() || undefined,
      date: format(now, 'yyyy-MM-dd'),
    };
    await updateData({ expenses: [...(data.expenses || []), expense] });
    setAmount('');
    setNote('');
    setShowAdd(false);
    showSavedFeedback({
      title: 'Expense Added',
      message: `₹${val.toLocaleString('en-IN')} logged under ${category}`,
      section: 'spending',
    });
  };

  const handleDelete = (id: string) => {
    const target = (data.expenses || []).find(e => e.id === id);
    const label = target ? `₹${target.amount} (${target.category})` : 'Expense';

    confirmDelete({
      title: 'Delete Expense?',
      itemName: label,
      message: 'This expense entry will be removed from your spending records.',
      section: 'spending',
      onConfirm: async () => {
        await updateData({ expenses: (data.expenses || []).filter(e => e.id !== id) });
      },
    });
  };

  // Handle Add Money Lent
  const handleAddLent = async () => {
    if (!lentPerson.trim() || !lentAmount || parseFloat(lentAmount) <= 0) {
      triggerHaptic('error');
      return;
    }
    const val = parseFloat(lentAmount);
    const newLent: MoneyLentItem = {
      id: `lent_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      personName: lentPerson.trim(),
      amount: val,
      date: lentDate || format(new Date(), 'yyyy-MM-dd'),
      note: lentNote.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await updateData({ moneyLent: [...(data.moneyLent || []), newLent] });
    setLentPerson('');
    setLentAmount('');
    setLentNote('');
    setShowAddLent(false);
    showSavedFeedback({
      title: 'Loan Logged',
      message: `₹${val.toLocaleString('en-IN')} lent to ${newLent.personName}`,
      section: 'spending',
    });
  };

  const handleToggleLentStatus = async (targetItem: MoneyLentItem) => {
    const nextStatus = targetItem.status === 'pending' ? 'returned' : 'pending';
    const updated = (data.moneyLent || []).map(l => {
      if (l.id === targetItem.id) {
        return {
          ...l,
          status: nextStatus as 'pending' | 'returned',
          returnedDate: nextStatus === 'returned' ? format(new Date(), 'yyyy-MM-dd') : undefined,
        };
      }
      return l;
    });
    await updateData({ moneyLent: updated });
    triggerHaptic('selection');
    showSavedFeedback({
      title: nextStatus === 'returned' ? 'Marked as Returned' : 'Marked as Pending',
      message: `₹${targetItem.amount.toLocaleString('en-IN')} from ${targetItem.personName}`,
      section: 'spending',
    });
  };

  const handleDeleteLent = (id: string) => {
    const target = (data.moneyLent || []).find(l => l.id === id);
    const label = target ? `₹${target.amount} to ${target.personName}` : 'Loan entry';
    confirmDelete({
      title: 'Delete Loan Record?',
      itemName: label,
      message: 'This record will be permanently deleted from your tracker.',
      section: 'spending',
      onConfirm: async () => {
        await updateData({ moneyLent: (data.moneyLent || []).filter(l => l.id !== id) });
      },
    });
  };

  // Windowed list virtualization for recent expenses
  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount(prev => prev + PAGE_SIZE);
        }
      },
      { rootMargin: '120px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [allRecentExpenses.length]);

  const isReady = Array.isArray(data?.expenses);

  return (
    <SkeletonGate
      ready={isReady}
      skeleton={
        <div className="space-y-6 sm:space-y-7">
          <SkeletonCard height="h-44" />
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            <SkeletonCard height="h-32" />
            <SkeletonCard height="h-32" />
          </div>
          <SkeletonCard height="h-44" />
          <SkeletonCard height="h-64" />
        </div>
      }
    >
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-7">

        {/* Top Material 3 Segmented Mode Pill Switcher */}
        <motion.div variants={item} className="flex justify-center">
          <SegmentedTogglePill
            options={[
              { value: 'expenses', label: 'Expenses' },
              { value: 'lent', label: `Money Lent (${lentStats.pendingCount})` },
            ]}
            value={activeTab}
            onChange={(val) => {
              triggerHaptic('selection');
              setActiveTab(val as 'expenses' | 'lent');
            }}
            size="md"
          />
        </motion.div>

        {activeTab === 'expenses' ? (
          <>
            {/* Material 3 Expressive Violet Hero Card (Level 2 Elevation) */}
            <motion.div
              variants={item}
              style={{
                background: 'linear-gradient(145deg, var(--md-surface-container), var(--md-surface-container-high))',
              }}
              className="relative overflow-hidden rounded-[28px] p-4 sm:p-7 m3-elevation-2 border border-[var(--md-outline-variant)] text-[var(--md-on-surface)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] sm:rounded-[20px] bg-[var(--md-surface-container-high)] text-[var(--md-primary)] flex items-center justify-center border border-[var(--md-outline-variant)] shrink-0">
                    <Wallet size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold tracking-wider uppercase opacity-75 font-tag text-[var(--md-on-surface-variant)] break-words">
                      {format(now, 'MMMM yyyy')}
                    </p>
                    <h2 className="text-sm sm:text-base font-bold text-[var(--md-on-surface)] break-words">Total Spending</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--md-surface-container)] px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold font-tag border border-[var(--md-outline-variant)] text-[var(--md-on-surface-variant)] shrink-0">
                    <span className="font-stat">{monthExpenses.length}</span> txns
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      triggerHaptic('selection');
                      setShowAdd(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] text-xs font-semibold shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Add Spend</span>
                  </motion.button>
                </div>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-3 mt-3">
                <div>
                  <span className="m3-numeral text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-[var(--md-on-surface)]">
                    ₹{monthTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-xs font-bold text-[var(--md-on-surface-variant)] font-mono">
                  Avg ₹{Math.round(monthTotal / Math.max(1, new Date().getDate())).toLocaleString('en-IN')}/day
                </span>
              </div>
            </motion.div>

            {/* ── 2 Metric Cards: Today & Month Stats ── */}
            <motion.div variants={item} className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="rounded-[24px] p-3 compact:p-3.5 sm:p-6 m3-elevation-1 border border-[var(--md-outline-variant)] flex flex-col justify-between overflow-hidden min-w-0"
              >
                <div className="flex items-center justify-between mb-2 gap-1">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] font-tag break-words">
                    Today
                  </p>
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-[14px] sm:rounded-[16px] bg-[var(--md-surface-container)] flex items-center justify-center text-[var(--md-primary)] shrink-0">
                    <TrendingDown size={13} className="sm:w-[14px] sm:h-[14px]" />
                  </span>
                </div>
                <p className="m3-numeral text-lg compact:text-xl sm:text-3xl font-extrabold tracking-tight text-[var(--md-on-surface)] break-words leading-tight">
                  ₹{todayTotal.toLocaleString('en-IN')}
                </p>
                <p className="text-[10px] sm:text-xs text-[var(--md-on-surface-variant)] mt-1 font-medium break-words">Recorded today</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="rounded-[24px] p-3 compact:p-3.5 sm:p-6 m3-elevation-1 border border-[var(--md-outline-variant)] flex flex-col justify-between overflow-hidden min-w-0"
              >
                <div className="flex items-center justify-between mb-2 gap-1">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] font-tag break-words">
                    Transactions
                  </p>
                  <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-[14px] sm:rounded-[16px] bg-[var(--md-surface-container)] flex items-center justify-center text-[var(--md-primary)] shrink-0">
                    <ArrowUpRight size={13} className="sm:w-[14px] sm:h-[14px]" />
                  </span>
                </div>
                <p className="m3-numeral text-lg compact:text-xl sm:text-3xl font-extrabold tracking-tight text-[var(--md-on-surface)] break-words leading-tight">
                  {monthExpenses.length}
                </p>
                <p className="text-[10px] sm:text-xs text-[var(--md-on-surface-variant)] mt-1 font-medium break-words">This month</p>
              </motion.div>
            </motion.div>

            {/* Category Breakdown */}
            {sortedCats.length > 0 && (
              <motion.div variants={item} className="rounded-[32px] p-5 sm:p-7 card bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] shadow-none">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)] mb-4">
                  Spending by Category
                </h3>
                <div className="space-y-3.5">
                  {sortedCats.map(([cat, total]) => {
                    const pct = Math.round((total / (monthTotal || 1)) * 100);
                    const catStyle = CAT_STYLES[cat] || CAT_STYLES.Other;
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-[var(--md-on-surface)] font-sans">{cat}</span>
                          <span className="text-[var(--md-on-surface-variant)] font-stat">
                            ₹{total.toLocaleString('en-IN')}{' '}
                            <span className="font-normal opacity-70">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--md-surface-container)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                            className={`h-full rounded-full ${catStyle.bar}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Recent transactions with Segmented Pill Filter & Direct (+ Add Expense) Option */}
            <motion.div variants={item} className="rounded-[32px] p-5 sm:p-7 card bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] shadow-none space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                    Recent Expenses
                  </h3>
                  <p className="text-[12px] text-[var(--md-on-surface-variant)] mt-0.5 font-normal">
                    Filter by transaction category
                  </p>
                </div>

                {/* USER REQUEST #1: "+ Add Expense" directly in the expenses list view */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    triggerHaptic('selection');
                    setShowAdd(true);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all shrink-0"
                >
                  <Plus size={14} />
                  <span>Add Expense</span>
                </motion.button>
              </div>

              {/* Finance Interaction Personality: Segmented Toggle-Pill Selector */}
              <SegmentedTogglePill
                options={[
                  { value: 'All', label: 'All' },
                  { value: 'Food', label: 'Food' },
                  { value: 'Transport', label: 'Ride' },
                  { value: 'Shopping', label: 'Shop' },
                  { value: 'Other', label: 'Other' },
                ]}
                value={filterCategory}
                onChange={setFilterCategory}
                size="sm"
                fullWidth
              />

              {allRecentExpenses.filter(e => filterCategory === 'All' ? true : (filterCategory === 'Transport' ? e.category === 'Transport' : filterCategory === 'Shopping' ? e.category === 'Shopping' : filterCategory === 'Food' ? e.category === 'Food' : e.category !== 'Food' && e.category !== 'Transport' && e.category !== 'Shopping')).length === 0 ? (
                <div className="py-10 text-center">
                  <div className="flex justify-center text-3xl mb-2"><AnimatedWallet size={36} /></div>
                  <p className="text-sm font-semibold text-[var(--md-on-surface)]">No expenses found for {filterCategory}</p>
                  <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">Tap "+ Add Expense" to track your purchases</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {allRecentExpenses
                    .filter(e => filterCategory === 'All' ? true : (filterCategory === 'Transport' ? e.category === 'Transport' : filterCategory === 'Shopping' ? e.category === 'Shopping' : filterCategory === 'Food' ? e.category === 'Food' : e.category !== 'Food' && e.category !== 'Transport' && e.category !== 'Shopping'))
                    .slice(0, visibleCount).map(e => {
                    const catStyle = CAT_STYLES[e.category] || CAT_STYLES.Other;
                    return (
                      <motion.div
                        key={e.id}
                        whileHover={{ scale: 1.012, y: -1 }}
                        whileTap={{ scale: 0.985 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                        className="flex items-center gap-3.5 p-3.5 rounded-[22px] bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] hover:bg-[var(--md-surface-container-high)] transition-colors group shadow-none"
                      >
                        <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-none ${catStyle.badge}`}>
                          <Wallet size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[var(--md-on-surface)] line-clamp-2 break-words leading-tight font-sans">
                            {e.category}
                            {e.note ? <span className="font-normal text-[var(--md-on-surface-variant)]"> · {e.note}</span> : ''}
                          </p>
                          <p className="text-[11px] font-mono text-[var(--md-on-surface-variant)] mt-0.5">
                            {format(parseISO(e.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span className="font-bold text-sm sm:text-base font-stat text-[var(--md-on-surface)]">
                          ₹{e.amount.toLocaleString('en-IN')}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => handleDelete(e.id)}
                          className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 transition-all"
                          title="Delete expense"
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Scroll sentinel for loading more items */}
              {visibleCount < allRecentExpenses.length && (
                <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-3">
                  <div className="w-5 h-5 border-2 border-[var(--md-primary)]/30 border-t-[var(--md-primary)] rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          </>
        ) : (
          /* USER REQUEST #1: Money Lent Tracker (Completely excluded from total expenses) */
          <>
            {/* Money Lent Hero Card */}
            <motion.div
              variants={item}
              style={{
                background: 'linear-gradient(145deg, var(--md-surface-container), var(--md-surface-container-high))',
              }}
              className="relative overflow-hidden rounded-[28px] p-4 sm:p-7 m3-elevation-2 border border-[var(--md-outline-variant)] text-[var(--md-on-surface)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-[18px] sm:rounded-[20px] bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
                    <HandCoins size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold tracking-wider uppercase opacity-75 font-tag text-[var(--md-on-surface-variant)] break-words">
                      Personal Loans & Debts
                    </p>
                    <h2 className="text-sm sm:text-base font-bold text-[var(--md-on-surface)] break-words">
                      Money Lent (Excluded from Expenses)
                    </h2>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic('selection');
                    setShowAddLent(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] text-xs font-semibold shadow-sm"
                >
                  <Plus size={14} />
                  <span>Lend Money</span>
                </motion.button>
              </div>

              <div className="flex flex-wrap items-baseline justify-between gap-3 mt-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--md-on-surface-variant)] mb-1">Total Pending to Receive</p>
                  <span className="m3-numeral text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-amber-500">
                    ₹{lentStats.totalPending.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-[var(--md-on-surface-variant)]">Recovered</p>
                    <p className="text-sm font-bold text-emerald-500 font-stat">₹{lentStats.totalRecovered.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-[var(--md-on-surface-variant)]">All-Time Lent</p>
                    <p className="text-sm font-bold text-[var(--md-on-surface)] font-stat">₹{lentStats.totalEverLent.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Money Lent Filter & List Section */}
            <motion.div variants={item} className="rounded-[32px] p-5 sm:p-7 card bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] shadow-none space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                    Loan Records
                  </h3>
                  <p className="text-[12px] text-[var(--md-on-surface-variant)] mt-0.5 font-normal">
                    {lentStats.pendingCount} pending · {lentStats.returnedCount} returned
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    triggerHaptic('selection');
                    setShowAddLent(true);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[var(--md-surface-container-high)] text-[var(--md-primary)] border border-[var(--md-outline-variant)] text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--md-surface-container-highest)] transition-all shrink-0"
                >
                  <Plus size={14} />
                  <span>New Loan</span>
                </motion.button>
              </div>

              {/* Status Filter Pill */}
              <SegmentedTogglePill
                options={[
                  { value: 'all', label: `All (${data.moneyLent?.length || 0})` },
                  { value: 'pending', label: `Pending (${lentStats.pendingCount})` },
                  { value: 'returned', label: `Returned (${lentStats.returnedCount})` },
                ]}
                value={lentFilter}
                onChange={(val) => setLentFilter(val as any)}
                size="sm"
                fullWidth
              />

              {allLentItems.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-3">
                    <HandCoins size={28} />
                  </div>
                  <p className="text-sm font-semibold text-[var(--md-on-surface)]">
                    {lentFilter === 'pending' ? 'No pending loans' : lentFilter === 'returned' ? 'No returned loans yet' : 'No money lent records'}
                  </p>
                  <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 max-w-xs mx-auto">
                    Track money you lent to friends or colleagues without affecting your total expense budget.
                  </p>
                  <button
                    onClick={() => setShowAddLent(true)}
                    className="mt-4 px-4 py-2 rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] text-xs font-medium"
                  >
                    + Record Lent Money
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {allLentItems.map((lentItem) => {
                    const isPending = lentItem.status === 'pending';
                    return (
                      <motion.div
                        key={lentItem.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                        className={`p-4 rounded-[24px] border transition-colors ${
                          isPending
                            ? 'bg-[var(--md-surface-container)] border-[var(--md-outline-variant)]'
                            : 'bg-[var(--md-surface-container)]/50 border-[var(--md-outline-variant)]/60 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center text-sm font-bold shrink-0 ${
                              isPending
                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                                : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {lentItem.personName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-[var(--md-on-surface)] truncate">
                                {lentItem.personName}
                              </h4>
                              {lentItem.note && (
                                <p className="text-xs text-[var(--md-on-surface-variant)] mt-0.5 truncate">
                                  {lentItem.note}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-mono text-[var(--md-on-surface-variant)]">
                                  Lent on {format(parseISO(lentItem.date), 'MMM d, yyyy')}
                                </span>
                                {lentItem.returnedDate && (
                                  <span className="text-[10px] text-emerald-500 font-medium">
                                    · Returned {format(parseISO(lentItem.returnedDate), 'MMM d')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`font-bold text-base font-stat ${isPending ? 'text-amber-500' : 'text-emerald-500'}`}>
                              ₹{lentItem.amount.toLocaleString('en-IN')}
                            </span>
                            <div className="mt-1 flex justify-end">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isPending
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              }`}>
                                {isPending ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                                {isPending ? 'Pending' : 'Returned'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[var(--md-outline-variant)]/60">
                          <button
                            onClick={() => handleToggleLentStatus(lentItem)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                              isPending
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                                : 'bg-black/5 dark:bg-white/10 text-[var(--md-on-surface-variant)] hover:bg-black/10'
                            }`}
                          >
                            {isPending ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Mark as Returned</span>
                              </>
                            ) : (
                              <>
                                <Clock size={13} />
                                <span>Mark as Pending</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteLent(lentItem.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/10 text-red-500 transition-colors"
                            title="Delete loan record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Add Expense Fluid Spring Capsule Sheet */}
        <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--md-on-surface-variant)]">
                New Entry
              </p>
              <h2 className="text-xl font-semibold text-[var(--md-on-surface)]">Add Expense</h2>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowAdd(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] transition-colors"
            >
              <X size={16} />
            </motion.button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--md-on-surface-variant)] block mb-2">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-[var(--md-on-surface-variant)]">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  autoFocus
                  className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--md-outline-variant)] rounded-[22px] pl-10 pr-4 py-3.5 text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--md-primary)]/40 text-[var(--md-on-surface)]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--md-on-surface-variant)] block mb-2">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => {
                  const isSelected = category === c;
                  return (
                    <motion.button
                      key={c}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                      onClick={() => setCategory(c)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] shadow-sm'
                          : 'bg-black/[0.04] dark:bg-white/[0.06] border border-[var(--md-outline-variant)] text-[var(--md-on-surface-variant)] hover:border-[var(--md-primary)]/40'
                      }`}
                    >
                      {c}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--md-on-surface-variant)] block mb-2">
                Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Lunch, Uber, Groceries"
                className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--md-outline-variant)] rounded-[20px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--md-primary)]/40 text-[var(--md-on-surface)]"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              onClick={handleAdd}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full py-3.5 rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md mt-2"
            >
              Save Transaction
            </motion.button>
          </div>
        </BottomSheet>

        {/* Add Money Lent Fluid Spring Capsule Sheet */}
        <BottomSheet isOpen={showAddLent} onClose={() => setShowAddLent(false)}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-amber-500">
                Loan Entry (Excluded from Expenses)
              </p>
              <h2 className="text-xl font-semibold text-[var(--md-on-surface)]">Record Money Lent</h2>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setShowAddLent(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] transition-colors"
            >
              <X size={16} />
            </motion.button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--md-on-surface-variant)] block mb-2">
                Borrower / Person Name
              </label>
              <input
                type="text"
                value={lentPerson}
                onChange={e => setLentPerson(e.target.value)}
                placeholder="e.g. Rahul, Sneha, Colleague"
                autoFocus
                className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--md-outline-variant)] rounded-[20px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-[var(--md-on-surface)]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--md-on-surface-variant)] block mb-2">
                Amount Lent (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-[var(--md-on-surface-variant)]">
                  ₹
                </span>
                <input
                  type="number"
                  value={lentAmount}
                  onChange={e => setLentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--md-outline-variant)] rounded-[22px] pl-10 pr-4 py-3.5 text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-[var(--md-on-surface)]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--md-on-surface-variant)] block mb-2">
                Date Lent
              </label>
              <input
                type="date"
                value={lentDate}
                onChange={e => setLentDate(e.target.value)}
                className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--md-outline-variant)] rounded-[20px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-[var(--md-on-surface)]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-[var(--md-on-surface-variant)] block mb-2">
                Note / Reason (Optional)
              </label>
              <input
                type="text"
                value={lentNote}
                onChange={e => setLentNote(e.target.value)}
                placeholder="e.g. Dinner bill split, Emergency cash"
                className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-[var(--md-outline-variant)] rounded-[20px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-[var(--md-on-surface)]"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              onClick={handleAddLent}
              disabled={!lentPerson.trim() || !lentAmount || parseFloat(lentAmount) <= 0}
              className="w-full py-3.5 rounded-full bg-amber-500 text-black font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md mt-2"
            >
              Record Loan
            </motion.button>
          </div>
        </BottomSheet>

      </motion.div>
    </SkeletonGate>
  );
}
