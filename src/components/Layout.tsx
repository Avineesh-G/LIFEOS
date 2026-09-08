import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, Dumbbell, Wallet, CalendarDays,
  CheckSquare, BarChart3, Settings, Plus, X,
  Clock, Dumbbell as DumbbellIcon, Banknote, StickyNote, ChevronRight, Utensils,
  LucideIcon
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
  { icon: CheckSquare,  label: 'TO-DO List', path: '/tasks' },
  { icon: BarChart3,    label: 'Progress',  path: '/progress' },
  { icon: Settings,     label: 'Settings',  path: '/settings' },
];

const quickAddOptions = [
  { icon: Clock,        label: 'Start Study Timer', path: '/study/timer',  color: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' },
  { icon: DumbbellIcon, label: 'Log Workout',        path: '/gym/workout',  color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400' },
  { icon: Banknote,     label: 'Add Expense',        path: '/spending',     color: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400' },
  { icon: StickyNote,   label: 'New TO-DO',          path: '/tasks',        color: 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400' },
];

interface DockItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  active: boolean;
  isBouncing: boolean;
  onClick: () => void;
}

function DockItem({ icon: Icon, label, active, isBouncing, onClick }: DockItemProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="relative flex items-center justify-center flex-shrink-0 select-none focus:outline-none w-10 h-10 sm:w-11 sm:h-11"
    >
      {/* App Tile with MacBook Click Bounce */}
      <motion.div
        animate={
          isBouncing
            ? {
                y: [0, -28, 0, -14, 0, -6, 0],
                scaleY: [1, 1.18, 0.88, 1.08, 0.95, 1.02, 1],
                scaleX: [1, 0.88, 1.1, 0.95, 1.05, 0.98, 1],
              }
            : { y: 0, scaleY: 1, scaleX: 1 }
        }
        transition={
          isBouncing
            ? {
                duration: 0.88,
                times: [0, 0.22, 0.44, 0.64, 0.8, 0.92, 1],
                ease: 'easeInOut',
              }
            : { duration: 0.15 }
        }
        className={`flex items-center justify-center w-full h-full rounded-[14px] transition-colors ${
          active
            ? 'bg-accent/15 dark:bg-accent/25 border border-accent/30 text-accent shadow-sm'
            : 'text-secondary-light dark:text-secondary-dark active:bg-black/5 dark:active:bg-white/5'
        }`}
      >
        <Icon
          strokeWidth={active ? 2.5 : 2}
          className="transition-all"
          size={20}
        />
      </motion.div>

      {/* Active Indicator Dot */}
      {active && (
        <motion.span
          layoutId="macOSActiveDot"
          className="w-1.5 h-1.5 rounded-full bg-accent absolute -bottom-1.5 shadow-sm"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  );
}

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
  const [bouncingPath, setBouncingPath] = useState<string | null>(null);

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
      <header 
        className="fixed top-0 left-0 right-0 z-30 bg-white/90 dark:bg-[#121316]/90 backdrop-blur-md border-b border-border-light/60 dark:border-border-dark/60"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="font-bold text-base tracking-tight text-primary-light dark:text-primary-dark font-sans">
              LifeOS
            </span>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-secondary-light dark:text-secondary-dark tracking-wide">
            {pageLabel}
          </span>
          <button
            onPointerDown={() => triggerHaptic('light')}
            onClick={() => {
              setShowQuickAdd(true);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light hover:opacity-85 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main 
        className="pb-40 sm:pb-44 min-h-screen"
        style={{
          paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="max-w-xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* ── Apple & Pixel style frosted translucent bottom floor ── */}
      <div 
        className="fixed bottom-0 left-0 right-0 pointer-events-none z-30 select-none"
        style={{ height: 'calc(4.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div 
          className="w-full h-full bg-surface-light/70 dark:bg-surface-dark/75 backdrop-blur-2xl border-t border-border-light/30 dark:border-border-dark/30"
          style={{
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 100%)'
          }}
        />
      </div>

      {/* ── MacBook Magnifying Dock (Material 3 Expressive) ── */}
      <div 
        className="fixed left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
        style={{ bottom: 'calc(1.15rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <nav
          className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-2xl border border-border-light/80 dark:border-border-dark/80 rounded-full px-2 sm:px-3 py-2 sm:py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.38)] overflow-x-auto no-scrollbar max-w-full"
        >
          {navItems.map((item) => (
            <DockItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={isActive(item.path)}
              isBouncing={bouncingPath === item.path}
              onClick={() => {
                triggerHaptic('nav');
                setBouncingPath(null);
                requestAnimationFrame(() => {
                  setBouncingPath(item.path);
                });
                navigate(item.path);
                setTimeout(() => {
                  setBouncingPath((prev) => (prev === item.path ? null : prev));
                }, 950);
              }}
            />
          ))}
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
                    onPointerDown={() => triggerHaptic('light')}
                    onClick={() => {
                      triggerHaptic('light');
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
