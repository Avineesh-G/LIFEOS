import { useState } from 'react';
import { Plus, Trash2, Wallet, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedWallet } from '../components/AnimatedIcons';
import type { AppData, Expense } from '../types';

interface SpendingProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Education', 'Entertainment', 'Other'];
const CAT_COLORS: Record<string, string> = {
  Food:          'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  Transport:     'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
  Shopping:      'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400',
  Education:     'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
  Entertainment: 'bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400',
  Other:         'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } } };

export default function Spending({ data, updateData }: SpendingProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount]   = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote]       = useState('');

  const now = new Date();
  const monthExpenses = data.expenses.filter(e =>
    isWithinInterval(parseISO(e.date), { start: startOfMonth(now), end: endOfMonth(now) })
  );
  const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayTotal = data.expenses
    .filter(e => e.date === format(now, 'yyyy-MM-dd'))
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals: Record<string, number> = {};
  monthExpenses.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount; });
  const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const maxCat = sortedCats[0]?.[1] || 1;

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
    setAmount(''); setNote(''); setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    await updateData({ expenses: data.expenses.filter(e => e.id !== id) });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between pt-2">
        <div>
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">{format(now, 'MMMM yyyy')}</p>
          <h1 className="text-4xl font-bold tracking-tight leading-none text-primary-light dark:text-primary-dark">
            ₹{monthTotal.toLocaleString('en-IN')}
          </h1>
          <p className="text-sm text-muted-light dark:text-muted-dark mt-1">{monthExpenses.length} transactions</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-pill flex items-center gap-2 px-5 py-2.5 text-sm">
          <Plus size={14} strokeWidth={2.5} /> Add
        </button>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-2">Today</p>
          <p className="text-2xl font-bold tracking-tight">₹{todayTotal.toLocaleString('en-IN')}</p>
        </div>
        <div className="card p-4">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-2">Transactions</p>
          <p className="text-2xl font-bold tracking-tight">{monthExpenses.length}</p>
          <p className="text-xs text-muted-light dark:text-muted-dark mt-1">this month</p>
        </div>
      </motion.div>

      {/* Category breakdown */}
      {sortedCats.length > 0 && (
        <motion.div variants={item} className="card p-5">
          <p className="label-mono text-secondary-light dark:text-secondary-dark mb-4">By Category</p>
          <div className="space-y-3.5">
            {sortedCats.map(([cat, total]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-24 text-sm font-medium truncate text-primary-light dark:text-primary-dark">{cat}</span>
                <div className="flex-1 h-1.5 bg-bg-light dark:bg-bg-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-light dark:bg-primary-dark rounded-full transition-all duration-700"
                    style={{ width: `${(total / maxCat) * 100}%` }}
                  />
                </div>
                <span className="label-mono text-muted-light dark:text-muted-dark w-16 text-right">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent transactions */}
      <motion.div variants={item} className="card p-5">
        <p className="label-mono text-secondary-light dark:text-secondary-dark mb-4">Recent</p>
        {data.expenses.length === 0 ? (
          <div className="py-8 text-center">
            <div className="flex justify-center text-3xl mb-2"><AnimatedWallet size={32} /></div>
            <p className="label-mono text-secondary-light dark:text-secondary-dark">No expenses yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {data.expenses.slice().reverse().slice(0, 20).map(e => (
              <div key={e.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-bg-light dark:hover:bg-bg-dark transition-all group">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${CAT_COLORS[e.category] || CAT_COLORS.Other}`}>
                  <Wallet size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-primary-light dark:text-primary-dark truncate block">
                    {e.category}{e.note ? ` · ${e.note}` : ''}
                  </p>
                  <p className="label-mono text-muted-light dark:text-muted-dark">{format(parseISO(e.date), 'MMM d')}</p>
                </div>
                <span className="font-semibold text-sm text-primary-light dark:text-primary-dark">₹{e.amount}</span>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Expense Sheet */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-end justify-center"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-xl bg-surface-light dark:bg-surface-dark rounded-t-3xl p-6 pb-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-border-light dark:bg-border-dark mx-auto mb-6" />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">Add Expense</h2>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-light dark:bg-bg-dark">
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    autoFocus
                    className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3.5 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 text-primary-light dark:text-primary-dark"
                  />
                </div>
                <div>
                  <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                          category === c
                            ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light'
                            : 'bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-mono text-secondary-light dark:text-secondary-dark mb-2 block">Note (optional)</label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Lunch, Uber, etc."
                    className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 text-primary-light dark:text-primary-dark placeholder-muted-light dark:placeholder-muted-dark"
                  />
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="btn-pill w-full py-3.5 text-sm disabled:opacity-30"
                >
                  Save Expense
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
