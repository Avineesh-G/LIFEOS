import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Trash2, Wallet, X, ArrowUpRight, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedWallet } from '../components/AnimatedIcons';
import { BottomSheet } from '../components/BottomSheet';
import { triggerHaptic } from '../utils/haptics';
import { SkeletonGate, SkeletonCard, SkeletonStatRow } from '../components/Skeleton';
import SegmentedTogglePill, { SegmentedOption } from '../components/SegmentedTogglePill';
import type { AppData, Expense } from '../types';

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
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const now = new Date();

  const { monthExpenses, monthTotal, todayTotal, sortedCats, maxCat } = useMemo(() => {
    const nowDate = new Date();
    const start = startOfMonth(nowDate);
    const end = endOfMonth(nowDate);
    const todayStr = format(nowDate, 'yyyy-MM-dd');

    const mExpenses = data.expenses.filter(e => {
      try {
        return isWithinInterval(parseISO(e.date), { start, end });
      } catch {
        return false;
      }
    });

    const mTotal = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    const tTotal = data.expenses
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

  const handleAdd = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      triggerHaptic('error');
      return;
    }
    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      category,
      note: note.trim() || undefined,
      date: format(now, 'yyyy-MM-dd'),
    };
    await updateData({ expenses: [...data.expenses, expense] });
    triggerHaptic('success');
    setAmount('');
    setNote('');
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    await updateData({ expenses: data.expenses.filter(e => e.id !== id) });
  };

  // ── Windowed list virtualization for recent expenses ──
  const PAGE_SIZE = 15;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const allRecentExpenses = useMemo(() => {
    return [...(data?.expenses || [])].reverse();
  }, [data?.expenses]);

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

      {/* Material 3 Expressive Violet Hero Card (Level 2 Elevation) */}
      <motion.div
        variants={item}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative overflow-hidden rounded-[28px] p-6 sm:p-7 m3-elevation-2 border border-[var(--md-outline-variant)] text-[var(--md-on-surface)]"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-[20px] bg-[var(--md-surface-container-high)] text-[var(--md-primary)] flex items-center justify-center border border-[var(--md-outline-variant)]">
              <Wallet size={22} />
            </span>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase opacity-75 font-tag text-[var(--md-on-surface-variant)]">
                {format(now, 'MMMM yyyy')}
              </p>
              <h2 className="text-sm sm:text-base font-bold text-[var(--md-on-surface)]">Total Spending</h2>
            </div>
          </div>
          <span className="rounded-full bg-[var(--md-surface-container)] px-3.5 py-1.5 text-xs font-bold font-tag border border-[var(--md-outline-variant)] text-[var(--md-on-surface-variant)]">
            <span className="font-stat">{monthExpenses.length}</span> transactions
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4 mt-3">
          <div>
            <span className="m3-numeral text-4xl sm:text-5xl font-extrabold tracking-tight leading-none text-[var(--md-on-surface)]">
              ₹{monthTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 22 }}
            onClick={() => setShowAdd(true)}
            className="rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] font-bold px-5 py-3 text-xs sm:text-sm flex items-center gap-2 shadow-none transition-transform"
          >
            <Plus size={18} strokeWidth={2.5} /> Add Spend
          </motion.button>
        </div>
      </motion.div>

      {/* Stats grid (Level 1 Elevation) */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="rounded-[24px] p-5 sm:p-6 m3-elevation-1 border border-[var(--md-outline-variant)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] font-tag">
              Today
            </p>
            <span className="w-8 h-8 rounded-[16px] bg-[var(--md-surface-container)] flex items-center justify-center text-[var(--md-primary)]">
              <TrendingDown size={14} />
            </span>
          </div>
          <p className="m3-numeral text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--md-on-surface)]">
            ₹{todayTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 font-medium">Recorded today</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="rounded-[24px] p-5 sm:p-6 m3-elevation-1 border border-[var(--md-outline-variant)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] font-tag">
              Transactions
            </p>
            <span className="w-8 h-8 rounded-[16px] bg-[var(--md-surface-container)] flex items-center justify-center text-[var(--md-primary)]">
              <ArrowUpRight size={14} />
            </span>
          </div>
          <p className="m3-numeral text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--md-on-surface)]">
            {monthExpenses.length}
          </p>
          <p className="text-xs text-[var(--md-on-surface-variant)] mt-1 font-medium">This month</p>
        </motion.div>
      </motion.div>

      {/* Category breakdown (Level 1 Elevation) */}
      {sortedCats.length > 0 && (
        <motion.div variants={item} className="rounded-[24px] p-6 sm:p-7 m3-elevation-1 border border-[var(--md-outline-variant)] space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] font-tag">
              Category Breakdown
            </p>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface-variant)] font-tag">
              <span className="font-stat">{sortedCats.length}</span> categories
            </span>
          </div>

          <div className="space-y-3.5">
            {sortedCats.map(([cat, total]) => {
              const catStyle = CAT_STYLES[cat] || CAT_STYLES.Other;
              const pct = Math.round((total / monthTotal) * 100);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
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

      {/* Recent transactions with Segmented Pill Filter */}
      <motion.div variants={item} className="rounded-[32px] p-5 sm:p-7 card bg-[var(--md-surface-container-low)] border border-[var(--md-outline-variant)] shadow-none space-y-4">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--md-on-surface-variant)]">
              Recent Expenses
            </h3>
            <p className="text-[12px] text-[var(--md-on-surface-variant)] mt-0.5 font-normal">
              Filter by transaction category
            </p>
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
        </div>

        {allRecentExpenses.filter(e => filterCategory === 'All' ? true : (filterCategory === 'Transport' ? e.category === 'Transport' : filterCategory === 'Shopping' ? e.category === 'Shopping' : filterCategory === 'Food' ? e.category === 'Food' : e.category !== 'Food' && e.category !== 'Transport' && e.category !== 'Shopping')).length === 0 ? (
          <div className="py-10 text-center">
            <div className="flex justify-center text-3xl mb-2"><AnimatedWallet size={36} /></div>
            <p className="text-sm font-semibold text-[var(--md-on-surface)]">No expenses found for {filterCategory}</p>
            <p className="text-xs text-[var(--md-on-surface-variant)] mt-1">Tap "+ Add Spend" to track your purchases</p>
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
                    <p className="font-bold text-sm text-[var(--md-on-surface)] truncate font-sans">
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

      {/* Add Expense Fluid Spring Capsule Sheet (Rendered via Portal) */}
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
      </motion.div>
    </SkeletonGate>
  );
}
