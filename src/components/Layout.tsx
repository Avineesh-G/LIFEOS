import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, Dumbbell, Wallet, CalendarDays,
  CheckSquare, BarChart3, Settings, Plus, X,
  Clock, Dumbbell as DumbbellIcon, Banknote, StickyNote, ChevronRight, Utensils
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import type { AppSettings } from '../types';

const navItems = [
  { icon: Home,         label: 'Home',      path: '/' },
  { icon: BookOpen,     label: 'Study',     path: '/study' },
  { icon: Dumbbell,     label: 'Gym',       path: '/gym' },
  { icon: Wallet,       label: 'Money',     path: '/spending' },
  { icon: CalendarDays, label: 'Timetable', path: '/timetable' },
  { icon: Utensils,     label: 'Nutrition', path: '/nutrition' },
  { icon: CheckSquare,  label: 'Tasks',     path: '/tasks' },
  { icon: BarChart3,    label: 'Progress',  path: '/progress' },
  { icon: Settings,     label: 'Settings',  path: '/settings' },
];

const quickAddOptions = [
  { icon: Clock,        label: 'Start Study Timer', path: '/study/timer',  color: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' },
  { icon: DumbbellIcon, label: 'Log Workout',        path: '/gym/workout',  color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' },
  { icon: Banknote,     label: 'Add Expense',        path: '/spending',     color: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400' },
  { icon: StickyNote,   label: 'New Task',           path: '/tasks',        color: 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400' },
];

interface LayoutProps {
  children: React.ReactNode;
  theme: AppSettings['theme'];
  setTheme: (t: AppSettings['theme']) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Current page label for header
  const currentNav = navItems.find(n => isActive(n.path));
  const pageLabel = currentNav?.label ?? 'LifeOS';

  return (
    <div className="min-h-screen bg-blobs text-primary-light dark:text-primary-dark transition-colors duration-200">

      {/* ── Top header bar ── */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-safe h-14 bg-bg-light dark:bg-bg-dark border-b border-border-light dark:border-border-dark">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-secondary-light dark:text-secondary-dark">
          LifeOS
        </span>
        <span className="font-semibold text-sm text-primary-light dark:text-primary-dark">
          {pageLabel}
        </span>
        <button
          onClick={() => {
            triggerHaptic(12);
            setShowQuickAdd(true);
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light hover:opacity-80 active:scale-95 transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </header>

      {/* ── Main content ── */}
      <main className="pt-14 pb-32 min-h-screen">
        <div className="max-w-xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* ── Floating pill bottom nav ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-6 pb-safe pointer-events-none">
        <nav
          className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-full px-2 sm:px-3 py-2.5 shadow-lg overflow-x-auto no-scrollbar touch-pan-x"
          style={{ maxWidth: '100%' }}
        >
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  triggerHaptic(10);
                  navigate(item.path);
                }}
                title={item.label}
                className={`relative flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-200 flex-shrink-0 ${
                  active
                    ? 'text-accent'
                    : 'text-secondary-light dark:text-secondary-dark hover:bg-black/5 dark:hover:bg-white/5 active:scale-90'
                }`}
              >
                <item.icon
                  size={18}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {active && (
                  <motion.div
                    layoutId="navDot"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-accent"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Quick Add Sheet ── */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
            onClick={() => setShowQuickAdd(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="w-full max-w-xl bg-surface-light dark:bg-surface-dark rounded-t-3xl p-6 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="w-10 h-1 rounded-full bg-border-light dark:bg-border-dark mx-auto mb-6" />

              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold">Quick Add</h2>
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-light dark:bg-bg-dark hover:opacity-70 transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5">
                {quickAddOptions.map((opt) => (
                  <button
                    key={opt.path}
                    onClick={() => {
                      setShowQuickAdd(false);
                      navigate(opt.path);
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all active:scale-[0.985]"
                  >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${opt.color}`}>
                      <opt.icon size={18} strokeWidth={2} />
                    </div>
                    <span className="flex-1 text-left font-medium text-sm">{opt.label}</span>
                    <ChevronRight size={15} className="text-muted-light dark:text-muted-dark" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
