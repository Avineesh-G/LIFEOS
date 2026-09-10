import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, BookOpen, Dumbbell, Wallet, CalendarDays,
  CheckSquare, BarChart3, Settings, Menu, X,
  Utensils, LucideIcon
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
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
            onClick={() => navigate('/settings')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-light dark:bg-surface-dark border border-border-light/60 dark:border-border-dark/60 text-secondary-light dark:text-secondary-dark hover:opacity-85 active:scale-95 transition-all shadow-sm"
            aria-label="Settings"
          >
            <Settings size={18} strokeWidth={2} />
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

      {/* ── Native Gradient Bottom Fade (Zero GPU Overhead) ── */}
      <div 
        className="fixed bottom-0 left-0 right-0 pointer-events-none z-30 select-none bg-gradient-to-t from-[#F4F4FB]/95 via-[#F4F4FB]/50 to-transparent dark:from-[#121316]/95 dark:via-[#121316]/50"
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

      {/* ── Speed-Dial Popup Menu Items (Photo 2 Reference) ── */}
      <AnimatePresence>
        {menuOpen && (
          <div
            className="fixed z-50 pointer-events-none flex flex-col items-center sm:items-end justify-end w-full max-w-sm left-1/2 -translate-x-1/2 px-4"
            style={{ bottom: 'calc(5.2rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex flex-col gap-2.5 items-end w-full">
              {secondaryMenuItems.map((item, index) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, y: 18, scale: 0.86 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.9 }}
                    transition={{
                      duration: 0.22,
                      delay: (secondaryMenuItems.length - 1 - index) * 0.035,
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
                    <span className="text-xs sm:text-sm font-bold tracking-tight font-sans">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Centered Squircle Dock (Photo 1 Reference) ── */}
      <div 
        className="fixed left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
        style={{ bottom: 'calc(1.1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <nav
          className="pointer-events-auto inline-flex items-center gap-2.5 p-2 rounded-[26px] bg-surface-light/95 dark:bg-[#18191E]/95 backdrop-blur-xl border border-border-light/80 dark:border-border-dark/80 shadow-[0_12px_36px_rgba(0,0,0,0.14)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.45)]"
          role="navigation"
          aria-label="Main Navigation"
        >
          {/* Home, Gym, Nutrition Squircles */}
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
                className={`relative flex items-center justify-center w-[52px] h-[52px] rounded-[18px] transition-all duration-200 active:scale-90 select-none focus:outline-none ${
                  active
                    ? 'bg-accent text-white shadow-md shadow-accent/30 scale-[1.02]'
                    : 'bg-transparent text-secondary-light dark:text-secondary-dark hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                }`}
              >
                <Icon size={21} strokeWidth={active ? 2.5 : 2} />
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white absolute bottom-1.5 shadow-sm" />
                )}
              </button>
            );
          })}

          {/* 4th Icon: 3 Lines Menu Toggle Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setMenuOpen(!menuOpen);
            }}
            title="More Sections"
            className={`relative flex items-center justify-center w-[52px] h-[52px] rounded-[18px] transition-all duration-200 active:scale-90 select-none focus:outline-none ${
              menuOpen
                ? 'bg-accent text-white shadow-md shadow-accent/30 rotate-90 scale-[1.02]'
                : isSecondaryActive
                ? 'bg-accent/15 dark:bg-accent/25 border border-accent/40 text-accent shadow-sm'
                : 'bg-transparent text-secondary-light dark:text-secondary-dark hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
            }`}
          >
            {menuOpen ? (
              <X size={21} strokeWidth={2.4} />
            ) : (
              <Menu size={21} strokeWidth={2.2} />
            )}
            {!menuOpen && isSecondaryActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent absolute bottom-1.5 shadow-sm" />
            )}
          </button>
        </nav>
      </div>

    </div>
  );
}
