import React, { useEffect, useRef, useState, useMemo, useCallback, startTransition } from 'react';
import { motion, AnimatePresence, useMotionValue, useDragControls } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Lock,
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { registerDismissible } from '../utils/backNavigation';
import {
  AppSection,
  SECTION_SEED_COLORS,
  SECTION_BLOB_POSITIONS,
  hexToRgb,
  blendHex,
  getNavPillBg,
} from '../theme/sectionSeedColors';
import {
  getRawUserCustomColors,
  INTERFACE_COLORS_STORAGE_KEY,
} from '../theme/interfaceColorManager';
import { COLOR_FAMILIES, DEFAULT_INTERFACE_COLORS } from '../theme/colorFamilies';

import {
  DESTINATIONS,
  HOME_DESTINATION,
  DestinationId,
  HubDestination,
  HubFamily,
  HUB_FAMILY_CONFIG,
  HUB_SECTION_NAMES,
  getDestinationById,
} from '../config/hubDestinations';

const SECTION_TO_HUB_FAMILY: Record<AppSection, HubFamily> = {
  home: 'home',
  gym: 'gym',
  nutrition: 'nutrition',
  study: 'study',
  finance: 'finance',
  settings: 'system',
  history: 'history',
  outing: 'outing',
  shopping: 'shopping',
  vault: 'vault',
  notes: 'notes',
  timetable: 'study',
  tasks: 'home',
  laundry: 'home',
};

interface NavigationHubSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: AppSection;
  isDark: boolean;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
  pinned: [DestinationId, DestinationId];
  onSetSlot: (slot: 1 | 2, id: DestinationId) => void;
  onResetNav: () => void;
  initialEditMode?: boolean;
  initialSelectedSlot?: 1 | 2;
  onExitEditMode?: () => void;
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
 * High-performance memoized single destination tile
 * - Pure GPU styling (no layout="position", no staggered entrance animations)
 * - data-no-ripple="true" to prevent synchronous layout queries on touch
 */
/**
 * Resolves the accent hex color for a given destination based on user's
 * per-interface color assignments. Falls back to HUB_FAMILY_CONFIG if unchanged.
 */
function useInterfaceColorAssignments(): Record<string, string> {
  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const custom = getRawUserCustomColors();
    return custom ? { ...DEFAULT_INTERFACE_COLORS, ...custom } : { ...DEFAULT_INTERFACE_COLORS };
  });

  useEffect(() => {
    const sync = () => {
      const custom = getRawUserCustomColors();
      setAssignments(custom ? { ...DEFAULT_INTERFACE_COLORS, ...custom } : { ...DEFAULT_INTERFACE_COLORS });
    };
    window.addEventListener('lifeos:interface-colors-changed', sync);
    window.addEventListener('storage', (e) => {
      if (e.key === INTERFACE_COLORS_STORAGE_KEY) sync();
    });
    return () => {
      window.removeEventListener('lifeos:interface-colors-changed', sync);
    };
  }, []);

  return assignments;
}

/**
 * Build a resolved color spec for a destination tile, preferring the user's
 * per-interface color family assignment over the hardcoded HUB_FAMILY_CONFIG.
 */
function resolveDestinationColor(
  destId: string,
  family: HubFamily,
  assignments: Record<string, string>,
  isDark: boolean
): { seed: string; rgb: [number, number, number]; darkGlyph: string; textAccent: string; onAccent: string; darkStrong: string } {
  const familyId = assignments[destId];
  if (familyId && COLOR_FAMILIES[familyId as keyof typeof COLOR_FAMILIES]) {
    const cf = COLOR_FAMILIES[familyId as keyof typeof COLOR_FAMILIES];
    const seed = isDark ? cf.dark.primary : cf.primary;
    // Parse hex to rgb
    const r = parseInt(seed.slice(1, 3), 16);
    const g = parseInt(seed.slice(3, 5), 16);
    const b = parseInt(seed.slice(5, 7), 16);
    return {
      seed,
      rgb: [r, g, b],
      darkGlyph: cf.dark.icon,
      textAccent: cf.icon,
      onAccent: '#FFFFFF',
      darkStrong: cf.dark.primary,
    };
  }
  // Fallback to static hub family config
  return HUB_FAMILY_CONFIG[family];
}

const DestinationTile = React.memo(function DestinationTile({
  destination,
  isCurrent,
  isEditMode,
  isDark,
  onSelect,
  colorAssignments,
}: {
  destination: HubDestination;
  isCurrent: boolean;
  isEditMode: boolean;
  isDark: boolean;
  onSelect: (dest: HubDestination) => void;
  colorAssignments: Record<string, string>;
}) {
  const Icon = destination.icon;
  const config = resolveDestinationColor(destination.id, destination.family, colorAssignments, isDark);
  const [r, g, b] = config.rgb;

  const currentOpacity = (destination.family === 'history' || destination.family === 'outing') ? 0.28 : (isDark ? 0.32 : 0.22);
  const tileBg = isCurrent
    ? `rgba(${r}, ${g}, ${b}, ${currentOpacity})`
    : isDark
    ? `rgba(${r}, ${g}, ${b}, 0.16)`
    : `rgba(${r}, ${g}, ${b}, 0.08)`;

  const tileBorder = isEditMode
    ? `1px solid rgba(${r}, ${g}, ${b}, ${isDark ? 0.6 : 0.45})`
    : isCurrent
    ? `1px solid ${config.seed}`
    : isDark
    ? `0.5px solid rgba(${r}, ${g}, ${b}, 0.38)`
    : `0.5px solid rgba(${r}, ${g}, ${b}, 0.25)`;

  const squircleBg = isCurrent
    ? (isDark ? (config.darkStrong || config.seed) : config.seed)
    : isDark
    ? `rgba(${r}, ${g}, ${b}, 0.30)`
    : `rgba(${r}, ${g}, ${b}, 0.14)`;

  const glyphColor = isCurrent
    ? (config.onAccent || '#FFFFFF')
    : isDark
    ? config.darkGlyph
    : (config.textAccent || config.seed);

  return (
    <button
      type="button"
      data-no-ripple="true"
      onClick={() => onSelect(destination)}
      style={{
        backgroundColor: tileBg,
        border: tileBorder,
        outlineColor: config.seed,
      }}
      className="group relative min-h-[80px] rounded-[20px] py-[10px] px-1 flex flex-col items-center justify-center gap-[6px] select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none transition-transform duration-100 active:scale-95"
      aria-label={
        isEditMode
          ? `Assign ${destination.label} to selected slot`
          : destination.label
      }
      aria-current={isCurrent ? 'page' : undefined}
    >
      {/* Subtle + indicator badge when in edit mode */}
      {isEditMode && (
        <span
          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
          style={{ backgroundColor: config.seed }}
          aria-hidden="true"
        >
          <Plus size={10} strokeWidth={3} />
        </span>
      )}

      {/* 36x36 squircle holding 20px icon */}
      <div
        className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 transition-transform duration-100 group-active:scale-95"
        style={{ backgroundColor: squircleBg }}
      >
        <Icon size={20} strokeWidth={2.3} style={{ color: glyphColor }} />
      </div>

      {/* Label */}
      <span className="text-[12px] font-medium leading-[1.25] text-center line-clamp-2 px-1 text-[var(--text-primary)] select-none">
        {destination.label}
      </span>
    </button>
  );
});

export function NavigationHubSheet({
  isOpen,
  onClose,
  activeSection,
  isDark,
  returnFocusRef,
  pinned,
  onSetSlot,
  onResetNav,
  initialEditMode = false,
  initialSelectedSlot = 1,
  onExitEditMode,
}: NavigationHubSheetProps) {
  // Reactive interface color assignments (updates live when user changes colors in Settings)
  const colorAssignments = useInterfaceColorAssignments();
  const navigate = useNavigate();
  const location = useLocation();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragControls = useDragControls();

  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [selectedSlot, setSelectedSlot] = useState<1 | 2>(initialSelectedSlot);
  const [homeShaking, setHomeShaking] = useState(false);
  const [fixedNotice, setFixedNotice] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Sync edit mode with initial prop when opened
  useEffect(() => {
    if (isOpen) {
      setIsEditMode(initialEditMode);
      setSelectedSlot(initialSelectedSlot);
      setFixedNotice(false);
    }
  }, [isOpen, initialEditMode, initialSelectedSlot]);

  // Expose edit mode flag on window so hardware back button can exit edit mode first
  useEffect(() => {
    (window as any).__lifeos_hub_edit_mode = isOpen && isEditMode;
    return () => {
      (window as any).__lifeos_hub_edit_mode = false;
    };
  }, [isOpen, isEditMode]);

  // Back button dismissible overlay registration: exits edit mode first, or closes sheet
  useEffect(() => {
    if (isOpen) {
      return registerDismissible('navigation-hub-sheet', () => {
        if (isEditMode) {
          setIsEditMode(false);
          if (onExitEditMode) onExitEditMode();
          return true;
        }
        onClose();
        return true;
      });
    }
  }, [isOpen, isEditMode, onExitEditMode, onClose]);

  const activeSeed = SECTION_SEED_COLORS[activeSection] || SECTION_SEED_COLORS.home;
  const [aR, aG, aB] = hexToRgb(activeSeed);
  const activePosition = SECTION_BLOB_POSITIONS[activeSection] || 'top-right';

  // Base canvas faintly tinted (~5%) toward active seed
  const sheetBg = useMemo(() => {
    const base = isDark ? '#121316' : '#FDFDFD';
    return blendHex(base, activeSeed, 0.05);
  }, [activeSeed, isDark]);

  // Pill container background for slot selector
  const pillBg = useMemo(() => {
    return getNavPillBg(activeSection, isDark);
  }, [activeSection, isDark]);

  // Reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const dragY = useMotionValue(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  // Hub destinations: always exactly 10 destinations (excluding pinned)
  const hubDestinations = useMemo(() => {
    const pinnedSet = new Set<string>(pinned);
    return DESTINATIONS.filter((d) => !pinnedSet.has(d.id));
  }, [pinned]);

  const checkScroll = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 8;
    setCanScrollMore(hasMore);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(checkScroll, 120);
      return () => clearTimeout(t);
    }
  }, [isOpen, isEditMode, hubDestinations, checkScroll]);

  // Esc key and hardware back button listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        triggerHaptic('light');
        if (isEditMode) {
          setIsEditMode(false);
          onExitEditMode?.();
        } else {
          onClose();
        }
      }
    };

    const handleCloseMenuEvent = () => {
      if (isEditMode) {
        setIsEditMode(false);
        onExitEditMode?.();
        return;
      }
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('lifeos-close-menu', handleCloseMenuEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('lifeos-close-menu', handleCloseMenuEvent);
    };
  }, [isOpen, isEditMode, onClose, onExitEditMode]);

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

  // Pinned destinations details for slot selector
  const slot1Dest = useMemo(
    () => getDestinationById(pinned[0]) || DESTINATIONS[0],
    [pinned]
  );
  const slot2Dest = useMemo(
    () => getDestinationById(pinned[1]) || DESTINATIONS[1],
    [pinned]
  );

  // Normal mode destination selection
  const handleSelectDestination = useCallback(
    (dest: HubDestination) => {
      if (isEditMode) {
        // Edit mode assignment
        triggerHaptic('light');
        onSetSlot(selectedSlot, dest.id);
        setAnnouncement(`Assigned ${dest.label} to Slot ${selectedSlot}`);
        // Advance selection to other editable slot
        setSelectedSlot((prev) => (prev === 1 ? 2 : 1));
        return;
      }

      // Normal navigation: immediate close and deferred route render
      triggerHaptic('nav');
      setTimeout(() => {
        onClose();
        startTransition(() => {
          navigate(dest.route);
        });
      }, 100);
    },
    [isEditMode, selectedSlot, onSetSlot, navigate, onClose]
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

  // Handle Home tap in edit mode (shake + message)
  const handleHomeTap = useCallback(() => {
    triggerHaptic('light');
    setHomeShaking(true);
    setFixedNotice(true);
    setAnnouncement('Home is fixed and cannot be changed');
    setTimeout(() => setHomeShaking(false), 350);
    setTimeout(() => setFixedNotice(false), 2000);
  }, []);

  const cornerStyle = BLOB_CORNER_STYLES[activePosition] || BLOB_CORNER_STYLES['top-right'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Solid Scrim (black at 40% dark / 28% light) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isDark ? 0.4 : 0.28 }}
            exit={{ opacity: 0, pointerEvents: 'none' } as any}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            data-no-ripple="true"
            className="fixed inset-0 z-[80] bg-black pointer-events-auto"
            aria-hidden="true"
          />

          {/* ── Compact Navigation Hub Modal Bottom Sheet (GPU Tween Animation) ── */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={isEditMode ? 'Edit Navigation' : 'Navigate'}
            data-no-ripple="true"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { y: 'calc(100% + 16px)', opacity: 0.85 }
            }
            animate={{ y: 0, opacity: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { y: 'calc(100% + 16px)', opacity: 0 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.1 }
                : {
                    type: 'tween',
                    duration: 0.22,
                    ease: [0.16, 1, 0.3, 1],
                  }
            }
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.6 }}
            style={{
              y: dragY,
              backgroundColor: sheetBg,
              border: `0.5px solid rgba(${aR}, ${aG}, ${aB}, 0.35)`,
              bottom: 'calc(var(--nav-h, 64px) + var(--sab, env(safe-area-inset-bottom, 0px)) + 16px)',
              contain: 'layout paint style',
              maxHeight: 'min(76dvh, 480px)',
            }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 80 || info.velocity.y > 500) {
                triggerHaptic('light');
                onClose();
              }
            }}
            className="fixed left-2 right-2 max-w-[560px] mx-auto z-[90] overflow-hidden rounded-t-[28px] rounded-b-[24px] px-3 pb-3 pt-0 shadow-[0_20px_50px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.65)] select-none pointer-events-auto flex flex-col gpu-composited"
          >
            {/* ── Active Interface Corner Accent Blob ── */}
            <div
              className="absolute pointer-events-none w-48 h-48 rounded-full"
              style={{
                ...cornerStyle,
                background: `radial-gradient(circle, rgba(${aR}, ${aG}, ${aB}, ${isDark ? 0.18 : 0.10}) 0%, rgba(${aR}, ${aG}, ${aB}, 0) 70%)`,
              }}
              aria-hidden="true"
            />

            {/* ── Drag Handle Zone (16px high) ── */}
            <div
              className="relative z-10 w-full h-4 flex items-center justify-center pt-2 pb-1 shrink-0 cursor-grab active:cursor-grabbing"
              data-no-ripple="true"
              onPointerDown={(e) => {
                dragControls.start(e);
              }}
            >
              <div
                className="w-8 h-1 rounded-[2px] transition-colors"
                style={{
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.22)'
                    : 'rgba(0, 0, 0, 0.18)',
                }}
              />
            </div>

            {/* ── Header (Fixed 44px height across both normal and edit modes) ── */}
            <div 
              className="relative z-10 h-[44px] flex items-center justify-between px-1 mb-2 shrink-0 cursor-grab"
              onPointerDown={(e) => {
                if (!(e.target as HTMLElement)?.closest('button, [role="button"], a')) {
                  dragControls.start(e);
                }
              }}
            >
              {!isEditMode ? (
                <>
                  <h2 className="text-[18px] font-semibold tracking-tight font-sans text-[var(--text-primary)]">
                    Navigate
                  </h2>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-no-ripple="true"
                      onClick={() => {
                        triggerHaptic('light');
                        setIsEditMode(true);
                        setSelectedSlot(1);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center border border-black/[0.08] dark:border-white/20 bg-black/5 dark:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all cursor-pointer"
                      aria-label="Edit navigation"
                      title="Edit navigation"
                    >
                      <Pencil size={15} strokeWidth={2.2} />
                    </button>

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
                            ? (HUB_FAMILY_CONFIG[SECTION_TO_HUB_FAMILY[activeSection]]?.darkGlyph || activeSeed)
                            : activeSeed,
                        }}
                      >
                        {HUB_SECTION_NAMES[activeSection] || 'LifeOS'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <h2 className="text-[16px] font-semibold tracking-tight font-sans text-[var(--text-primary)] leading-tight">
                      Edit navigation
                    </h2>
                    <span className="text-[11px] text-[var(--text-secondary)] leading-none truncate mt-0.5">
                      {fixedNotice ? (
                        <span className="text-amber-400 font-semibold">Home is fixed</span>
                      ) : (
                        `Tap a slot above, then a destination below`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      data-no-ripple="true"
                      onClick={() => {
                        triggerHaptic('medium');
                        onResetNav();
                        setAnnouncement('Navigation reset to defaults');
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all cursor-pointer"
                      aria-label="Reset to default slots"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      data-no-ripple="true"
                      onClick={() => {
                        triggerHaptic('light');
                        setIsEditMode(false);
                        onExitEditMode?.();
                      }}
                      className="px-3.5 py-1 rounded-full text-xs font-semibold text-white shadow-xs active:scale-95 transition-all cursor-pointer"
                      style={{ backgroundColor: activeSeed }}
                      aria-label="Done editing"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── Slot Selector Row (Edit Mode Only, GPU-accelerated scaleY + opacity, NO height animation) ── */}
            <AnimatePresence>
              {isEditMode && (
                <motion.div
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scaleY: 0.8 }
                  }
                  animate={{ opacity: 1, scaleY: 1 }}
                  exit={{ opacity: 0, scaleY: 0.8 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: 'top' }}
                  className="overflow-hidden mb-2.5 shrink-0"
                >
                  <div
                    role="radiogroup"
                    aria-label="Select slot to replace"
                    className="h-[52px] px-3 rounded-full flex items-center justify-around border border-black/[0.08] dark:border-white/[0.12] shadow-sm select-none"
                    style={{ backgroundColor: pillBg }}
                  >
                    {/* Slot 0: Home (Fixed) */}
                    <motion.button
                      type="button"
                      data-no-ripple="true"
                      onClick={handleHomeTap}
                      animate={
                        homeShaking
                          ? { x: [-4, 4, -4, 4, 0] }
                          : { x: 0 }
                      }
                      transition={{ duration: 0.25 }}
                      className="relative w-[38px] h-[38px] rounded-full flex items-center justify-center select-none focus:outline-none cursor-pointer active:scale-95"
                      aria-label="Home slot (locked)"
                      title="Home slot is fixed"
                    >
                      <HOME_DESTINATION.icon
                        size={22}
                        strokeWidth={2.2}
                        className="text-[var(--text-secondary)] opacity-80"
                      />
                      <span
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-black/60 dark:bg-black/80 border border-white/20 flex items-center justify-center text-white"
                        title="Fixed slot"
                      >
                        <Lock size={9} strokeWidth={2.4} />
                      </span>
                    </motion.button>

                    {/* Slot 1: User choice */}
                    <button
                      type="button"
                      data-no-ripple="true"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedSlot(1);
                      }}
                      className={`relative w-[38px] h-[38px] rounded-full flex items-center justify-center select-none focus:outline-none cursor-pointer transition-all ${
                        selectedSlot === 1
                          ? 'ring-2 ring-offset-2 scale-105 shadow-md'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor:
                          selectedSlot === 1
                            ? HUB_FAMILY_CONFIG[slot1Dest.family].seed
                            : 'transparent',
                        borderColor: HUB_FAMILY_CONFIG[slot1Dest.family].seed,
                        outlineColor: HUB_FAMILY_CONFIG[slot1Dest.family].seed,
                      }}
                      role="radio"
                      aria-checked={selectedSlot === 1}
                      aria-label={`Slot 1: ${slot1Dest.label}`}
                    >
                      <slot1Dest.icon
                        size={22}
                        strokeWidth={2.3}
                        style={{
                          color: selectedSlot === 1 ? '#FFFFFF' : undefined,
                        }}
                        className={selectedSlot === 1 ? '' : 'text-[var(--text-primary)]'}
                      />
                      <span className="sr-only">Slot 1: {slot1Dest.label}</span>
                    </button>

                    {/* Slot 2: User choice */}
                    <button
                      type="button"
                      data-no-ripple="true"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedSlot(2);
                      }}
                      className={`relative w-[38px] h-[38px] rounded-full flex items-center justify-center select-none focus:outline-none cursor-pointer transition-all ${
                        selectedSlot === 2
                          ? 'ring-2 ring-offset-2 scale-105 shadow-md'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor:
                          selectedSlot === 2
                            ? HUB_FAMILY_CONFIG[slot2Dest.family].seed
                            : 'transparent',
                        borderColor: HUB_FAMILY_CONFIG[slot2Dest.family].seed,
                        outlineColor: HUB_FAMILY_CONFIG[slot2Dest.family].seed,
                      }}
                      role="radio"
                      aria-checked={selectedSlot === 2}
                      aria-label={`Slot 2: ${slot2Dest.label}`}
                    >
                      <slot2Dest.icon
                        size={22}
                        strokeWidth={2.3}
                        style={{
                          color: selectedSlot === 2 ? '#FFFFFF' : undefined,
                        }}
                        className={selectedSlot === 2 ? '' : 'text-[var(--text-primary)]'}
                      />
                      <span className="sr-only">Slot 2: {slot2Dest.label}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Destinations Grid (Always exactly 10 tiles, adaptive columns) ── */}
            <div
              ref={gridRef}
              onScroll={checkScroll}
              className="relative z-10 grid grid-cols-[repeat(auto-fit,minmax(76px,1fr))] gap-2 overflow-y-auto no-scrollbar overscroll-contain pb-6"
              style={{
                WebkitOverflowScrolling: 'touch',
                ...(canScrollMore
                  ? {
                      maskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)',
                    }
                  : {}),
              }}
            >
              {hubDestinations.map((dest) => (
                <DestinationTile
                  key={dest.id}
                  destination={dest}
                  isCurrent={!isEditMode && isRouteCurrent(dest.route)}
                  isEditMode={isEditMode}
                  isDark={isDark}
                  onSelect={handleSelectDestination}
                  colorAssignments={colorAssignments}
                />
              ))}
            </div>

            {/* ── Screen Reader Announcements ── */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {announcement}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NavigationHubSheet;
