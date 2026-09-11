import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, Dumbbell, Wallet, CalendarDays,
  CheckSquare, BarChart3, Settings, Menu, X,
  Utensils, RotateCw, LucideIcon
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import type { AppSettings } from '../types';

// Primary centered squircle dock items
const primaryDockItems = [
  { icon: Home,     label: 'Home',      path: '/' },
  { icon: Dumbbell, label: 'Gym',       path: '/gym' },
  { icon: Utensils, label: 'Nutrition', path: '/nutrition' },
];

// Speed-dial popup items (Photo 2 reference)
const secondaryMenuItems = [
  { icon: BookOpen,     label: 'Study',                path: '/study',     color: 'text-indigo-500 dark:text-indigo-400' },
  { icon: Wallet,       label: 'Spending',             path: '/spending',  color: 'text-amber-500 dark:text-amber-400' },
  { icon: CalendarDays, label: 'Timetable',            path: '/timetable', color: 'text-sky-500 dark:text-sky-400' },
  { icon: CheckSquare,  label: 'To-Do Tasks',          path: '/tasks',     color: 'text-emerald-500 dark:text-emerald-400' },
  { icon: BarChart3,    label: 'Progress & Analytics', path: '/progress',  color: 'text-purple-500 dark:text-purple-400' },
  { icon: Settings,     label: 'Settings',             path: '/settings',  color: 'text-slate-500 dark:text-slate-400' },
];

const allRoutes = [
  ...primaryDockItems,
  ...secondaryMenuItems,
];

interface LayoutProps {
  children: React.ReactNode;
  theme: AppSettings['theme'];
  setTheme: (t: AppSettings['theme']) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  refresh?: () => Promise<any>;
}

export default function Layout({ children, refresh }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    if (isReloading) return;
    triggerHaptic('light');
    setIsReloading(true);
    try {
      if (refresh) {
        await refresh();
      }
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setTimeout(() => {
        setIsReloading(false);
      }, 750);
    }
  };

  // Close speed dial menu when navigating or pressing escape
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isSecondaryActive = secondaryMenuItems.some(item => isActive(item.path));

  // Current page label for header
  const currentNav = allRoutes.find(n => isActive(n.path));
  const pageLabel = currentNav?.label ?? 'LifeOS';

  return (
    <div className="min-h-screen text-primary-light dark:text-primary-dark transition-colors duration-200">

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
            onClick={handleReload}
            disabled={isReloading}
            className={`w-9 h-9 flex items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 text-secondary-light dark:text-secondary-dark hover:opacity-85 active:scale-95 transition-all shadow-sm ${
              isReloading ? 'text-accent border-accent/40 bg-accent/5' : ''
            }`}
            aria-label="Reload and sync data"
            title="Reload and sync data"
          >
            <RotateCw size={17} strokeWidth={2.2} className={`transition-transform duration-300 ${isReloading ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main 
        className="pb-28 sm:pb-32 min-h-screen"
        style={{
          paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="max-w-xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* ── Solid Bottom Dock Background (100% Opaque - Zero Transparency or Bleed-Through) ── */}
      <div 
        className="fixed bottom-0 left-0 right-0 pointer-events-none z-30 select-none bg-[#F4F4FB] dark:bg-[#121316] border-t border-border-light/60 dark:border-border-dark/60 shadow-lg shadow-black/5"
        style={{ height: 'calc(5.25rem + env(safe-area-inset-bottom, 0px))' }}
      />

      {/* ── Backdrop Overlay for Speed-Dial Menu (Photo 2 Reference) ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              triggerHaptic('light');
              setMenuOpen(false);
            }}
            className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-[2px] z-40 pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* ── Speed-Dial Popup Menu Items (Photo 2 Reference - Floating above without overlap) ── */}
      <AnimatePresence>
        {menuOpen && (
          <div
            className="fixed z-50 pointer-events-none flex flex-col items-end justify-end w-full max-w-xs left-1/2 -translate-x-1/2 px-3"
            style={{ bottom: 'calc(6.2rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex flex-col gap-2.5 items-end w-full pr-1">
              {secondaryMenuItems.map((item, index) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, y: 16, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{
                      duration: 0.2,
                      delay: (secondaryMenuItems.length - 1 - index) * 0.03,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={() => {
                      triggerHaptic('nav');
                      setMenuOpen(false);
                      navigate(item.path);
                    }}
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg border transition-all active:scale-95 ${
                      active
                        ? 'bg-accent text-white border-accent shadow-accent/25'
                        : 'bg-surface-light dark:bg-[#1C1D24] text-primary-light dark:text-primary-dark border-border-light/80 dark:border-border-dark/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-white' : item.color} />
                    <span className="text-xs sm:text-sm font-bold tracking-tight font-sans whitespace-nowrap">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Centered Individual Squircle Blocks (Photo 1 Reference: Single Single Blocks) ── */}
      <div 
        className="fixed left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
        style={{ bottom: 'calc(1.1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div
          className="flex items-center gap-3"
          role="navigation"
          aria-label="Main Navigation"
        >
          {/* Home, Gym, Nutrition: Individual Floating Squircle Blocks */}
          {primaryDockItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  triggerHaptic('nav');
                  if (menuOpen) setMenuOpen(false);
                  navigate(item.path);
                }}
                title={item.label}
                className={`pointer-events-auto relative flex items-center justify-center w-14 h-14 rounded-[20px] border transition-[transform,background-color,border-color,box-shadow] duration-150 active:scale-90 select-none focus:outline-none ${
                  active
                    ? 'bg-accent text-white border-accent shadow-lg shadow-accent/35 scale-[1.04]'
                    : 'bg-surface-light dark:bg-[#1C1D24] border-border-light/80 dark:border-border-dark/80 text-secondary-light dark:text-secondary-dark shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:border-accent/40'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white absolute bottom-1.5 shadow-sm" />
                )}
              </button>
            );
          })}

          {/* 4th Icon: 3 Lines Menu Toggle (Individual Floating Squircle Block) */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setMenuOpen(!menuOpen);
            }}
            title="More Sections"
            className={`pointer-events-auto relative flex items-center justify-center w-14 h-14 rounded-[20px] border transition-[transform,background-color,border-color,box-shadow] duration-150 active:scale-90 select-none focus:outline-none ${
              menuOpen
                ? 'bg-accent text-white border-accent shadow-lg shadow-accent/35 rotate-90 scale-[1.04]'
                : isSecondaryActive
                ? 'bg-accent/15 dark:bg-accent/25 border border-accent/40 text-accent shadow-md'
                : 'bg-surface-light dark:bg-[#1C1D24] border-border-light/80 dark:border-border-dark/80 text-secondary-light dark:text-secondary-dark shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:border-accent/40'
            }`}
          >
            {menuOpen ? (
              <X size={22} strokeWidth={2.4} />
            ) : (
              <Menu size={22} strokeWidth={2.2} />
            )}
            {!menuOpen && isSecondaryActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent absolute bottom-1.5 shadow-sm" />
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
