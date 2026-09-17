import { useState, useMemo } from 'react';
import { Plus, Trash2, Wallet, X, ArrowUpRight, TrendingDown } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedWallet } from '../components/AnimatedIcons';
import { BottomSheet } from '../components/BottomSheet';
import type { AppData, Expense } from '../types';

interface SpendingProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Education', 'Entertainment', 'Other'];

const CAT_STYLES: Record<string, { badge: string; text: string; bar: string }> = {
  Food: {
    badge: 'bg-m3-peach-container dark:bg-m3-peach-darkContainer text-m3-peach-text dark:text-m3-peach-darkText',
    text: 'text-amber-700 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  Transport: {
    badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-500',
  },
  Shopping: {
    badge: 'bg-m3-rose-container dark:bg-m3-rose-darkContainer text-m3-rose-text dark:text-m3-rose-darkText',
    text: 'text-rose-700 dark:text-rose-300',
    bar: 'bg-rose-500',
  },
  Education: {
    badge: 'bg-m3-lavender-container dark:bg-m3-lavender-darkContainer text-m3-lavender-text dark:text-m3-lavender-darkText',
    text: 'text-purple-700 dark:text-purple-300',
    bar: 'bg-purple-500',
  },
  Entertainment: {
    badge: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300',
    text: 'text-violet-700 dark:text-violet-300',
    bar: 'bg-violet-500',
  },
  Other: {
    badge: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
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
    if (!amount || parseFloat(amount) <= 0) return;
    const expense: Expense = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      category,
      note: note.trim() || undefined,
      date: format(now, 'yyyy-MM-dd'),
    };
    await updateData({ expenses: [...data.expenses, expense] });
    setAmount('');
    setNote('');
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    await updateData({ expenses: data.expenses.filter(e => e.id !== id) });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-7">

      {/* Fluid Spring Capsule Peach Hero Card */}
      <motion.div
        variants={item}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative overflow-hidden rounded-[32px] sm:rounded-[36px] p-6 sm:p-7 liquid-glass glow-peach bg-gradient-to-br from-m3-peach-container/80 via-m3-peach-container/50 to-transparent dark:from-m3-peach-darkContainer/70 dark:via-m3-peach-darkContainer/40 dark:to-transparent text-m3-peach-text dark:text-m3-peach-darkText shadow-lg"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-[20px] bg-white/85 dark:bg-black/50 flex items-center justify-center shadow-sm border border-white/40 dark:border-white/10">
              <Wallet size={22} className="text-m3-peach-text dark:text-m3-peach-darkText" />
            </span>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase opacity-75">
                {format(now, 'MMMM yyyy')}
              </p>
              <h2 className="text-sm sm:text-base font-bold opacity-90">Total Spending</h2>
            </div>
          </div>
          <span className="rounded-full bg-white/80 dark:bg-black/50 px-3.5 py-1.5 text-xs font-bold shadow-sm border border-white/30 dark:border-white/10">
            {monthExpenses.length} transactions
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4 mt-3">
          <div>
            <span className="text-4xl sm:text-5xl font-black tracking-tight leading-none">
              ₹{monthTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 22 }}
            onClick={() => setShowAdd(true)}
            className="rounded-full bg-[#8F4C1B] dark:bg-[#FFB787] text-white dark:text-[#2B1E17] font-bold px-5 py-3 text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus size={18} strokeWidth={2.5} /> Add Spend
          </motion.button>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:gap-5">
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="rounded-[28px] p-5 sm:p-6 liquid-glass shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
              Today
            </p>
            <span className="w-8 h-8 rounded-full bg-m3-mint-badge/70 dark:bg-m3-mint-darkBadge/70 flex items-center justify-center text-m3-mint-text dark:text-m3-mint-darkText shadow-sm">
              <TrendingDown size={14} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-primary-light dark:text-primary-dark font-sans">
            ₹{todayTotal.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1 font-medium">Recorded today</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="rounded-[28px] p-5 sm:p-6 liquid-glass shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark">
              Transactions
            </p>
            <span className="w-8 h-8 rounded-full bg-m3-lavender-badge/70 dark:bg-m3-lavender-darkBadge/70 flex items-center justify-center text-m3-lavender-text dark:text-m3-lavender-darkText shadow-sm">
              <ArrowUpRight size={14} />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-primary-light dark:text-primary-dark font-sans">
            {monthExpenses.length}
          </p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1 font-medium">This month</p>
        </motion.div>
      </motion.div>

      {/* Category breakdown */}
      {sortedCats.length > 0 && (
        <motion.div variants={item} className="rounded-[32px] p-6 sm:p-7 liquid-glass shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Category Breakdown
            </p>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.05] text-muted-light dark:text-muted-dark">
              {sortedCats.length} categories
            </span>
          </div>

          <div className="space-y-3.5">
            {sortedCats.map(([cat, total]) => {
              const catStyle = CAT_STYLES[cat] || CAT_STYLES.Other;
              const pct = Math.round((total / monthTotal) * 100);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-primary-light dark:text-primary-dark font-bold">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-light dark:text-muted-dark font-mono text-[11px]">{pct}%</span>
                      <span className="font-bold text-primary-light dark:text-primary-dark font-mono">
                        ₹{total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(total / maxCat) * 100}%` }}
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

      {/* Recent transactions */}
      <motion.div variants={item} className="rounded-[32px] p-6 sm:p-7 liquid-glass shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
            Recent Expenses
          </p>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.05] text-muted-light dark:text-muted-dark">Latest 20</span>
        </div>

        {data.expenses.length === 0 ? (
          <div className="py-10 text-center">
            <div className="flex justify-center text-3xl mb-2"><AnimatedWallet size={36} /></div>
            <p className="text-sm font-semibold text-secondary-light dark:text-secondary-dark">No expenses recorded yet</p>
            <p className="text-xs text-muted-light dark:text-muted-dark mt-1">Tap "+ Add Spend" to track your purchases</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.expenses.slice().reverse().slice(0, 20).map(e => {
              const catStyle = CAT_STYLES[e.category] || CAT_STYLES.Other;
              return (
                <motion.div
                  key={e.id}
                  whileHover={{ scale: 1.012, y: -1 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className="flex items-center gap-3.5 p-3.5 rounded-[22px] liquid-glass hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors group shadow-xs"
                >
                  <div className={`w-11 h-11 rounded-[16px] flex items-center justify-center flex-shrink-0 shadow-sm ${catStyle.badge}`}>
                    <Wallet size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-primary-light dark:text-primary-dark truncate font-sans">
                      {e.category}
                      {e.note ? <span className="font-normal text-secondary-light dark:text-secondary-dark"> · {e.note}</span> : ''}
                    </p>
                    <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark mt-0.5">
                      {format(parseISO(e.date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className="font-bold text-sm sm:text-base font-mono text-primary-light dark:text-primary-dark">
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
      </motion.div>

      {/* Add Expense Fluid Spring Capsule Sheet (Rendered via Portal) */}
      <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              New Entry
            </p>
            <h2 className="text-xl font-black text-primary-light dark:text-primary-dark font-sans">Add Expense</h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setShowAdd(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
          >
            <X size={16} />
          </motion.button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-light dark:text-muted-dark">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-[22px] pl-10 pr-4 py-3.5 text-2xl font-black focus:outline-none focus:ring-2 focus:ring-accent/40 text-primary-light dark:text-primary-dark font-sans"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => {
                const isSelected = category === c;
                return (
                  <motion.button
                    key={c}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light shadow-sm'
                        : 'bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-secondary-light dark:text-secondary-dark hover:border-accent/40'
                    }`}
                  >
                    {c}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
              Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Lunch, Uber, Groceries"
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-[20px] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 text-primary-light dark:text-primary-dark"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            onClick={handleAdd}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full py-4 rounded-full bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md mt-2"
          >
            Save Transaction
          </motion.button>
        </div>
      </BottomSheet>
    </motion.div>
  );
}
