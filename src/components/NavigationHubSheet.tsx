import React, { useEffect, useRef, useMemo, useCallback, startTransition } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  Wallet,
  ShoppingBag,
  CheckSquare,
  Shirt,
  BarChart3,
  History as HistoryIcon,
  ShieldCheck,
  Settings as SettingsIcon,
  LucideIcon,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import {
  AppSection,
  SECTION_SEED_COLORS,
  SECTION_BLOB_POSITIONS,
  hexToRgb,
  blendHex,
} from '../theme/sectionSeedColors';

import {
  HUB_DESTINATIONS,
  HUB_FAMILY_CONFIG,
  HUB_SECTION_NAMES,
  HubDestination,
} from '../config/hubDestinations';

interface NavigationHubSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: AppSection;
  isDark: boolean;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}

// Corner coordinates for sheet accent blob
const BLOB_CORNER_STYLES: Record<string, React.CSSProperties> = {
  'top-right': { top: '-50px', right: '-50px' },
  'bottom-left': { bottom: '-50px', left: '-50px' },
  'bottom-right': { bottom: '-50px', right: '-50px' },
  'top-left': { top: '-50px', left: '-50px' },
  'top-center': { top: '-60px', left: '35%' },
};

/**
 * Memoized single destination tile
 */
const DestinationTile = React.memo(function DestinationTile({
  destination,
  isCurrent,
  isDark,
  prefersReducedMotion,
  index,
  onSelect,
}: {
  destination: HubDestination;
  isCurrent: boolean;
  isDark: boolean;
  prefersReducedMotion: boolean;
  index: number;
  onSelect: (dest: HubDestination) => void;
}) {
  const Icon = destination.icon;
  const config = HUB_FAMILY_CONFIG[destination.family];
  const [r, g, b] = config.rgb;

  // Tile styles per spec:
  // Dark mode: fill = seed at 14-18%, border 0.5px seed at 35-40%, icon squircle fill = seed at 28-32%
  // Light mode: fill = seed at 8-10%, border 0.5px seed at 25%, icon squircle fill = seed at 14%
  // Active/current: stronger fill ~28% and 1px full-seed border
  const tileBg = isCurrent
    ? `rgba(${r}, ${g}, ${b}, ${isDark ? 0.32 : 0.22})`
    : isDark
    ? `rgba(${r}, ${g}, ${b}, 0.16)`
    : `rgba(${r}, ${g}, ${b}, 0.08)`;

  const tileBorder = isCurrent
    ? `1px solid ${config.seed}`
    : isDark
    ? `0.5px solid rgba(${r}, ${g}, ${b}, 0.38)`
    : `0.5px solid rgba(${r}, ${g}, ${b}, 0.25)`;

  const squircleBg = isCurrent
    ? config.seed
    : isDark
    ? `rgba(${r}, ${g}, ${b}, 0.30)`
    : `rgba(${r}, ${g}, ${b}, 0.14)`;

  const glyphColor = isCurrent
    ? '#FFFFFF'
    : isDark
    ? config.darkGlyph
    : config.seed;

  return (
    <motion.button
      type="button"
      initial={
        prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 10, scale: 0.96 }
      }
      animate={
        prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      transition={
        prefersReducedMotion
          ? { duration: 0.12 }
          : {
              duration: 0.22,
              delay: index * 0.02,
              ease: [0.16, 1, 0.3, 1],
            }
      }
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      onClick={() => onSelect(destination)}
      style={{
        backgroundColor: tileBg,
        border: tileBorder,
        outlineColor: config.seed,
      }}
      className="group relative min-h-[80px] rounded-[20px] py-[10px] px-1 flex flex-col items-center justify-center gap-[6px] select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none transition-colors duration-150"
      aria-label={destination.label}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {/* 36x36 squircle (radius 12px) holding 20px icon */}
      <div
        className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 transition-transform duration-150 group-active:scale-95"
        style={{ backgroundColor: squircleBg }}
      >
        <Icon size={20} strokeWidth={2.3} style={{ color: glyphColor }} />
      </div>

      {/* Label: 12px / 500, centered, line-height 1.25, max 2 lines with line-clamp, text-primary token */}
      <span className="text-[12px] font-medium leading-[1.25] text-center line-clamp-2 px-1 text-[var(--text-primary)] select-none">
        {destination.label}
      </span>
    </motion.button>
  );
});

export function NavigationHubSheet({
  isOpen,
  onClose,
  activeSection,
  isDark,
  returnFocusRef,
}: NavigationHubSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const activeSeed = SECTION_SEED_COLORS[activeSection] || SECTION_SEED_COLORS.home;
  const [aR, aG, aB] = hexToRgb(activeSeed);
  const activePosition = SECTION_BLOB_POSITIONS[activeSection] || 'top-right';

  // Base canvas (#FDFDFD light / #121316 dark) faintly tinted (~5%) toward active seed
  const sheetBg = useMemo(() => {
    const base = isDark ? '#121316' : '#FDFDFD';
    return blendHex(base, activeSeed, 0.05);
  }, [activeSeed, isDark]);

  // Reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Motion value for drag offset to avoid React re-renders while dragging
  const dragY = useMotionValue(0);

  // Esc key and hardware back button listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        triggerHaptic('light');
        onClose();
      }
    };

    const handleCloseMenuEvent = () => {
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('lifeos-close-menu', handleCloseMenuEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('lifeos-close-menu', handleCloseMenuEvent);
    };
  }, [isOpen, onClose]);

  // Focus management: trap focus inside and restore to squircle on close
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const firstFocusable = sheetRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      returnFocusRef?.current?.focus();
    }
  }, [isOpen, returnFocusRef]);

  // Destination selection: highlight, trigger haptic, close sheet after 120ms, then navigate
  const handleSelectDestination = useCallback(
    (dest: HubDestination) => {
      triggerHaptic('nav');
      setTimeout(() => {
        onClose();
        // startTransition marks the new route render as low-priority so the
        // sheet close animation completes without being blocked by the incoming
        // page render. This is the primary fix for hub close jank.
        startTransition(() => {
          navigate(dest.route);
        });
      }, 120);
    },
    [navigate, onClose]
  );

  // Check if a destination route is currently active
  const isRouteCurrent = useCallback(
    (route: string) => {
      const path = location.pathname.toLowerCase();
      const target = route.toLowerCase();
      if (path === target) return true;
      if (target !== '/' && path.startsWith(target + '/')) return true;
      return false;
    },
    [location.pathname]
  );

  const cornerStyle = BLOB_CORNER_STYLES[activePosition] || BLOB_CORNER_STYLES['top-right'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Solid Scrim (black at 40% dark / 28% light, no backdrop-filter) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isDark ? 0.4 : 0.28 }}
            exit={{ opacity: 0, pointerEvents: 'none' } as any}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="fixed inset-0 z-[80] bg-black pointer-events-auto"
            aria-hidden="true"
          />

          {/* ── Compact Navigation Hub Modal Bottom Sheet ── */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigate"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { y: '100%', opacity: 1 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { y: 0, opacity: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { y: '100%', opacity: 1 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.12 }
                : { type: 'spring', stiffness: 380, damping: 34, mass: 1 }
            }
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            style={{
              y: dragY,
              backgroundColor: sheetBg,
              border: `0.5px solid rgba(${aR}, ${aG}, ${aB}, 0.35)`,
              // Bottom edge sits exactly 8px above the 64px nav bar
              bottom: 'calc(64px + max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem)) + 8px)',
              contain: 'layout paint',
              maxHeight: 'min(60dvh, 420px)',
            }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 80 || info.velocity.y > 500) {
                triggerHaptic('light');
                onClose();
              }
            }}
            className="fixed left-2 right-2 max-w-[420px] mx-auto z-[90] overflow-hidden rounded-t-[28px] rounded-b-[24px] px-3 pb-3 pt-0 shadow-[0_20px_50px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.65)] select-none pointer-events-auto flex flex-col"
          >
            {/* ── Active Interface Corner Accent Blob (No blur filter; pre-softened radial mask) ── */}
            <div
              className="absolute pointer-events-none w-48 h-48 rounded-full"
              style={{
                ...cornerStyle,
                background: `radial-gradient(circle, rgba(${aR}, ${aG}, ${aB}, ${isDark ? 0.18 : 0.10}) 0%, rgba(${aR}, ${aG}, ${aB}, 0) 70%)`,
              }}
              aria-hidden="true"
            />

            {/* ── Drag Handle Zone (16px high, handle 32x4px, radius 2px, 8px from top) ── */}
            <div className="relative z-10 w-full h-4 flex items-center justify-center pt-2 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
              <div
                className="w-8 h-1 rounded-[2px] transition-colors"
                style={{
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.22)'
                    : 'rgba(0, 0, 0, 0.18)',
                }}
              />
            </div>

            {/* ── Header (Single Row, 36px) ── */}
            <div className="relative z-10 h-9 flex items-center justify-between px-1 mb-2.5 shrink-0">
              {/* Left: "Navigate" Google Sans Flex 600, 18px */}
              <h2 className="text-[18px] font-semibold tracking-tight font-sans text-[var(--text-primary)]">
                Navigate
              </h2>

              {/* Right: Chip with 6px dot + active interface name, 12px/500, pill radius, seed 20% opacity */}
              <div
                className="px-2.5 py-1 rounded-full flex items-center gap-1.5 border"
                style={{
                  backgroundColor: `rgba(${aR}, ${aG}, ${aB}, 0.20)`,
                  borderColor: `rgba(${aR}, ${aG}, ${aB}, 0.35)`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeSeed }}
                />
                <span
                  className="text-[12px] font-medium leading-none"
                  style={{
                    color: isDark
                      ? HUB_FAMILY_CONFIG[
                          activeSection === 'study'
                            ? 'study'
                            : activeSection === 'finance'
                            ? 'finance'
                            : activeSection === 'gym'
                            ? 'home'
                            : 'system'
                        ]?.darkGlyph || activeSeed
                      : activeSeed,
                  }}
                >
                  {HUB_SECTION_NAMES[activeSection] || 'LifeOS'}
                </span>
              </div>
            </div>

            {/* ── Destinations Grid (3 rows x 80px + 2 gaps x 8px = 256px) ── */}
            {/* 4 columns default, 3 columns below 340px */}
            <div
              className="relative z-10 grid grid-cols-3 min-[340px]:grid-cols-4 gap-2 overflow-y-auto no-scrollbar overscroll-contain"
              style={{
                WebkitOverflowScrolling: 'touch',
                maskImage: 'linear-gradient(to bottom, black calc(100% - 16px), transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 16px), transparent 100%)',
              }}
            >
              {HUB_DESTINATIONS.map((dest, idx) => (
                <DestinationTile
                  key={dest.id}
                  destination={dest}
                  isCurrent={isRouteCurrent(dest.route)}
                  isDark={isDark}
                  prefersReducedMotion={prefersReducedMotion}
                  index={idx}
                  onSelect={handleSelectDestination}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NavigationHubSheet;
