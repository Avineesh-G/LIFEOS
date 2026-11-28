import React, { useState, useEffect, useMemo, useCallback, startTransition, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House,
  Barbell,
  ForkKnife,
  ArrowClockwise,
  CalendarCheck,
  CalendarBlank,
  Wallet,
  CheckSquare,
  NotePencil,
  TShirt,
  ShoppingCart,
  Receipt,
  ClockCounterClockwise,
  ShieldCheck,
  Gear,
  LockKey,
  HardDrive,
  HourglassMedium,
  BookBookmark,
  UsersThree,
  RocketLaunch,
  SuitcaseRolling,
  Scales,
  CaretLeft,
  Palette,
} from '../ui/tokens/icons';
import { TabBar, TabItem } from '../ui/navigation/TabBar';
import { CapsuleHeader } from '../ui/navigation/CapsuleHeader';
import { useUserProfile } from '../utils/userProfileCache';
import type { HubItem } from '../ui/navigation/MoreHubSheet';
import type { ActionSheetOption } from '../ui/feedback/ActionSheet';
import { AmbientLight } from '../ui/feedback/AmbientLight';
import { auth } from '../firebase';
import { triggerHaptic } from '../utils/haptics';
import { handleAppBack } from '../utils/backNavigation';
import { prefetchRoute } from '../utils/routePrefetch';
import {
  checkNotificationPermission,
  syncAllNotifications,
} from '../utils/notifications';
import { getModuleTint } from '../ui/tokens/colors';
import { useEdgeSwipeBack } from '../hooks/useEdgeSwipeBack';
import { useM3Theme } from '../theme/ThemeContext';
import type { AppData, AppSettings } from '../types';

const MoreHubSheet = lazy(() =>
  import('../ui/navigation/MoreHubSheet').then((m) => ({ default: m.MoreHubSheet }))
);
const SlotCustomizerSheet = lazy(() =>
  import('../ui/navigation/SlotCustomizerSheet').then((m) => ({ default: m.SlotCustomizerSheet }))
);
const ActionSheet = lazy(() =>
  import('../ui/feedback/ActionSheet').then((m) => ({ default: m.ActionSheet }))
);
const CalendarQuickPopup = lazy(() => import('./calendar/CalendarQuickPopup'));
const AskLifeOSModal = lazy(() => import('./ai/AskLifeOSModal'));

interface LayoutProps {
  children: React.ReactNode;
  theme?: AppSettings['theme'];
  setTheme?: (t: AppSettings['theme']) => void;
  accentColor?: string;
  setAccentColor?: (c: string) => void;
  refresh?: () => Promise<any>;
  data?: AppData;
  updateData?: (partial: Partial<AppData>) => Promise<any>;
}

export const ALL_HUB_ITEMS: (HubItem & { route: string })[] = [
  // Plan & Operations
  { id: 'calendar', label: 'Calendar', route: '/calendar', icon: <CalendarBlank size={24} weight="duotone" />, tintKey: 'calendar' },
  { id: 'tasks', label: 'To-Do Tasks', route: '/tasks', icon: <CheckSquare size={24} weight="duotone" />, tintKey: 'tasks' },
  { id: 'timetable', label: 'Timetable', route: '/timetable', icon: <CalendarCheck size={24} weight="duotone" />, tintKey: 'timetable' },
  { id: 'laundry', label: 'Laundry', route: '/laundry', icon: <TShirt size={24} weight="duotone" />, tintKey: 'laundry' },
  { id: 'drive', label: 'Drive & Docs', route: '/drive', icon: <HardDrive size={24} weight="duotone" />, tintKey: 'drive' },

  // Learn & Focus
  { id: 'projects', label: 'Projects', route: '/projects', icon: <RocketLaunch size={24} weight="duotone" />, tintKey: 'projects' },
  { id: 'focus', label: 'Focus Studio', route: '/focus', icon: <HourglassMedium size={24} weight="duotone" />, tintKey: 'focus' },
  { id: 'notes', label: 'Notes & Ideas', route: '/notes', icon: <NotePencil size={24} weight="duotone" />, tintKey: 'notes' },
  { id: 'journal', label: 'Daily Journal', route: '/journal', icon: <BookBookmark size={24} weight="duotone" />, tintKey: 'journal' },
  { id: 'decisions', label: 'Decisions', route: '/decisions', icon: <Scales size={24} weight="duotone" />, tintKey: 'decisions' },

  // Health & Fitness
  { id: 'gym', label: 'Gym', route: '/gym', icon: <Barbell size={24} weight="duotone" />, tintKey: 'gym' },
  { id: 'nutrition', label: 'Nutrition', route: '/nutrition', icon: <ForkKnife size={24} weight="duotone" />, tintKey: 'nutrition' },

  // Money & Finance
  { id: 'spending', label: 'Spending', route: '/spending', icon: <Wallet size={24} weight="duotone" />, tintKey: 'spending' },
  { id: 'shopping', label: 'Shopping Lists', route: '/shopping', icon: <ShoppingCart size={24} weight="duotone" />, tintKey: 'shopping' },
  { id: 'outings', label: 'Outing Splitter', route: '/outings', icon: <Receipt size={24} weight="duotone" />, tintKey: 'outing' },
  { id: 'trips', label: 'Trips & Packing', route: '/trips', icon: <SuitcaseRolling size={24} weight="duotone" />, tintKey: 'trips' },
  { id: 'circle', label: 'Inner Circle', route: '/circle', icon: <UsersThree size={24} weight="duotone" />, tintKey: 'circle' },

  // Security & System
  { id: 'history', label: 'Work History', route: '/history', icon: <ClockCounterClockwise size={24} weight="duotone" />, tintKey: 'history' },
  { id: 'settings', label: 'Settings', route: '/settings', icon: <Gear size={24} weight="duotone" />, tintKey: 'home' },
];

function getInterfaceHeaderMeta(pathname: string): { title: string; icon: React.ReactNode } {
  if (pathname === '/' || pathname === '') return { title: 'Home', icon: <House size={13} weight="fill" /> };
  if (pathname.startsWith('/gym/workout')) return { title: 'Live Workout', icon: <Barbell size={13} weight="fill" /> };
  if (pathname.startsWith('/gym/split')) return { title: 'Weekly Split', icon: <Barbell size={13} weight="fill" /> };
  if (pathname.startsWith('/gym/onboarding')) return { title: 'Gym Setup', icon: <Barbell size={13} weight="fill" /> };
  if (pathname.startsWith('/gym/history/')) return { title: 'Exercise History', icon: <ClockCounterClockwise size={13} weight="bold" /> };
  if (pathname.startsWith('/gym')) return { title: 'Gym', icon: <Barbell size={13} weight="fill" /> };
  if (pathname.startsWith('/nutrition')) return { title: 'Nutrition', icon: <ForkKnife size={13} weight="fill" /> };
  if (pathname.startsWith('/spending')) return { title: 'Spending', icon: <Wallet size={13} weight="fill" /> };
  if (pathname.startsWith('/shopping/') && pathname !== '/shopping') return { title: 'Shopping List', icon: <ShoppingCart size={13} weight="fill" /> };
  if (pathname.startsWith('/shopping')) return { title: 'Shopping', icon: <ShoppingCart size={13} weight="fill" /> };
  if (pathname.startsWith('/outings/') && pathname !== '/outings') return { title: 'Outing Detail', icon: <Receipt size={13} weight="fill" /> };
  if (pathname.startsWith('/outings')) return { title: 'Outings', icon: <Receipt size={13} weight="fill" /> };
  if (pathname.startsWith('/calendar')) return { title: 'Calendar', icon: <CalendarBlank size={13} weight="fill" /> };
  if (pathname.startsWith('/timetable')) return { title: 'Timetable', icon: <CalendarCheck size={13} weight="fill" /> };
  if (pathname.startsWith('/tasks')) return { title: 'Tasks', icon: <CheckSquare size={13} weight="fill" /> };
  if (pathname.startsWith('/laundry')) return { title: 'Laundry', icon: <TShirt size={13} weight="fill" /> };
  if (pathname.startsWith('/history')) return { title: 'Work History', icon: <ClockCounterClockwise size={13} weight="bold" /> };
  if (pathname.startsWith('/settings/appearance') || pathname.startsWith('/settings/interface-colors')) {
    return { title: 'Appearance', icon: <Palette size={13} weight="fill" /> };
  }
  if (pathname.startsWith('/settings')) return { title: 'Settings', icon: <Gear size={13} weight="fill" /> };
  if (pathname.startsWith('/notes')) return { title: 'Notes & Ideas', icon: <NotePencil size={13} weight="fill" /> };
  if (pathname.startsWith('/focus')) return { title: 'Focus Studio', icon: <HourglassMedium size={13} weight="fill" /> };
  if (pathname.startsWith('/journal')) return { title: 'Daily Journal', icon: <BookBookmark size={13} weight="fill" /> };
  if (pathname.startsWith('/circle')) return { title: 'Inner Circle', icon: <UsersThree size={13} weight="fill" /> };
  if (pathname.startsWith('/projects')) return { title: 'Projects', icon: <RocketLaunch size={13} weight="fill" /> };
  if (pathname.startsWith('/trips')) return { title: 'Trips & Packing', icon: <SuitcaseRolling size={13} weight="fill" /> };
  if (pathname.startsWith('/decisions')) return { title: 'Decisions', icon: <Scales size={13} weight="fill" /> };
  if (pathname.startsWith('/drive')) return { title: 'Drive & Docs', icon: <HardDrive size={13} weight="fill" /> };
  if (pathname.startsWith('/vault')) return { title: 'Encrypted Vault', icon: <ShieldCheck size={13} weight="fill" /> };
  return { title: 'Home', icon: <House size={13} weight="fill" /> };
}

export default function Layout({
  children, refresh, data, updateData }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const userProfile = useUserProfile();
  const { activePalette } = useM3Theme();

  const [moreOpen, setMoreOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [calendarPopupOpen, setCalendarPopupOpen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [homeLockedToast, setHomeLockedToast] = useState(false);
  const [isSubInterfaceOpen, setIsSubInterfaceOpen] = useState(false);

  // Path Memory Edge-Swipe back gesture
  useEdgeSwipeBack(!moreOpen && !quickAddOpen && !aiSheetOpen && !isSubInterfaceOpen);

  // Sub-interface visibility tracking (hides bottom navigation bar during full-screen sheets / modals)
  useEffect(() => {
    let count = 0;
    const handleSubOpen = () => {
      count++;
      setIsSubInterfaceOpen(true);
    };
    const handleSubClose = () => {
      count = Math.max(0, count - 1);
      if (count === 0) setIsSubInterfaceOpen(false);
    };

    window.addEventListener('lifeos-subinterface-open', handleSubOpen);
    window.addEventListener('lifeos-subinterface-close', handleSubClose);
    return () => {
      window.removeEventListener('lifeos-subinterface-open', handleSubOpen);
      window.removeEventListener('lifeos-subinterface-close', handleSubClose);
    };
  }, []);

  useEffect(() => {
    const handleOpenAi = () => setAiSheetOpen(true);
    window.addEventListener('lifeos-open-ai', handleOpenAi);
    return () => window.removeEventListener('lifeos-open-ai', handleOpenAi);
  }, []);

  // Notification permission check on mount
  useEffect(() => {
    checkNotificationPermission().catch(() => { });
  }, []);

  // Defer and debounce background notification sync so it never competes with initial app navigation
  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          syncAllNotifications(data).catch(() => { });
        }, { timeout: 4000 });
      } else {
        syncAllNotifications(data).catch(() => { });
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [data?.timetable, data?.tasks, data?.nutritionLogs, data?.workoutLogs, data?.calendarEvents, data?.laundryBatches]);

  // Reload & Refresh handler: syncs cloud data and cleanly refreshes the application
  const handleReload = async () => {
    if (isReloading) return;
    triggerHaptic('medium');
    setIsReloading(true);
    const minSpinPromise = new Promise((resolve) => setTimeout(resolve, 650));
    try {
      const refreshPromise = refresh ? refresh() : Promise.resolve();
      await Promise.all([
        Promise.race([refreshPromise, new Promise((resolve) => setTimeout(resolve, 800))]),
        minSpinPromise,
      ]);
      triggerHaptic('success');
    } catch (err) {
      console.warn('Refresh error:', err);
      await minSpinPromise;
      triggerHaptic('error');
    } finally {
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const pathname = (location.pathname || '').toLowerCase();
  const isHomeRoute = pathname === '/' || pathname === '';
  const showUnifiedHeader =
    !pathname.startsWith('/ai') &&
    !pathname.startsWith('/chat') &&
    !pathname.startsWith('/share/');
  const headerMeta = useMemo(() => getInterfaceHeaderMeta(pathname), [pathname]);

  const handleHeaderBack = useCallback(() => {
    triggerHaptic('light');
    const backEvent = new CustomEvent('lifeos-header-back', { cancelable: true });
    const notCancelled = window.dispatchEvent(backEvent);
    if (notCancelled) {
      handleAppBack(navigate);
    }
  }, [navigate]);

  // Customizable Quick Navigation: 4 slots (Home, Slot 2, Slot 3, Directory)
  const pinnedIds = useMemo(() => {
    const defaultPinned = ['gym', 'nutrition'];
    const custom = data?.settings?.navPinned;
    if (Array.isArray(custom) && custom.length === 2 && custom[0] && custom[1]) {
      return custom;
    }
    return defaultPinned;
  }, [data?.settings?.navPinned]);

  const slot2Item = useMemo(() => {
    return ALL_HUB_ITEMS.find((i) => i.id === pinnedIds[0]) || ALL_HUB_ITEMS.find((i) => i.id === 'gym')!;
  }, [pinnedIds]);

  const slot3Item = useMemo(() => {
    return ALL_HUB_ITEMS.find((i) => i.id === pinnedIds[1]) || ALL_HUB_ITEMS.find((i) => i.id === 'nutrition')!;
  }, [pinnedIds]);

  // Identify active tab key
  const activeTabKey = useMemo(() => {
    if (pathname === '/' || pathname === '') return 'home';
    if (pathname.startsWith(slot2Item.route)) return slot2Item.id;
    if (pathname.startsWith(slot3Item.route)) return slot3Item.id;
    return '';
  }, [pathname, slot2Item, slot3Item]);

  const [customizingSlotIndex, setCustomizingSlotIndex] = useState<number | null>(null);

  const navTabs: TabItem[] = useMemo(() => [
    {
      key: 'home',
      label: 'Home',
      route: '/',
      icon: <House size={20} weight="regular" />,
      activeIcon: <House size={20} weight="fill" />,
      tint: activePalette.secondarySeed || activePalette.seed,
      isCustomizable: false,
      quickActions: [
        { label: 'Add Task', action: () => startTransition(() => { navigate('/tasks'); }) },
        { label: 'Timetable', action: () => startTransition(() => { navigate('/timetable'); }) }
      ],
    },
    {
      key: slot2Item.id,
      label: slot2Item.label.split(' ')[0],
      route: slot2Item.route,
      icon: slot2Item.icon,
      activeIcon: slot2Item.icon,
      tint: getModuleTint(slot2Item.tintKey, activePalette.seed),
      isCustomizable: true,
      quickActions: [
        { label: 'Customize Quick Slot', action: () => setCustomizingSlotIndex(0) },
      ],
    },
    {
      key: slot3Item.id,
      label: slot3Item.label.split(' ')[0],
      route: slot3Item.route,
      icon: slot3Item.icon,
      activeIcon: slot3Item.icon,
      tint: getModuleTint(slot3Item.tintKey, activePalette.seed),
      isCustomizable: true,
      quickActions: [
        { label: 'Customize Quick Slot', action: () => setCustomizingSlotIndex(1) },
      ],
    },
  ], [slot2Item, slot3Item, navigate, activePalette]);

  const handleTabChange = useCallback((key: string) => {
    if (key === 'home') {
      if (pathname === '/' || pathname === '') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        startTransition(() => { navigate('/'); });
      }
    } else if (key === slot2Item.id) {
      prefetchRoute(slot2Item.route);
      startTransition(() => { navigate(slot2Item.route); });
    } else if (key === slot3Item.id) {
      prefetchRoute(slot3Item.route);
      startTransition(() => { navigate(slot3Item.route); });
    }
  }, [pathname, slot2Item.id, slot2Item.route, slot3Item.id, slot3Item.route, navigate]);

  const handleCustomizeSlot = (slotKey: string) => {
    triggerHaptic('medium');
    if (slotKey === 'home') {
      setHomeLockedToast(true);
      setTimeout(() => setHomeLockedToast(false), 2600);
      return;
    }
    if (slotKey === slot2Item.id) {
      setCustomizingSlotIndex(0);
    } else if (slotKey === slot3Item.id) {
      setCustomizingSlotIndex(1);
    }
  };

  const handleSelectCustomSlotItem = (selectedId: string) => {
    if (!updateData || customizingSlotIndex === null) return;
    triggerHaptic('success');
    const current = [...pinnedIds];
    const otherIdx = customizingSlotIndex === 0 ? 1 : 0;
    if (current[otherIdx] === selectedId) {
      const temp = current[customizingSlotIndex];
      current[customizingSlotIndex] = selectedId;
      current[otherIdx] = temp;
    } else {
      current[customizingSlotIndex] = selectedId;
    }
    updateData({
      settings: {
        ...(data?.settings || ({} as any)),
        navPinned: [current[0], current[1]] as [string, string],
      },
    });
    setCustomizingSlotIndex(null);
  };

  const handleResetDefaults = () => {
    if (!updateData) return;
    triggerHaptic('success');
    updateData({
      settings: {
        ...(data?.settings || ({} as any)),
        navPinned: ['gym', 'nutrition'] as [string, string],
      },
    });
    setCustomizingSlotIndex(null);
  };

  const handlePinSlot = (item: HubItem) => {
    if (!updateData) return;
    const current = [...pinnedIds];
    current[1] = current[0];
    current[0] = item.id;
    updateData({
      settings: {
        ...(data?.settings || ({} as any)),
        navPinned: [current[0], current[1]] as [string, string],
      },
    });
  };

  const quickAddOptions: ActionSheetOption[] = useMemo(() => [
    {
      key: 'task',
      label: 'New To-Do Task',
      icon: <CheckSquare size={20} weight="duotone" />,
      onClick: () => startTransition(() => { navigate('/tasks'); }),
    },
    {
      key: 'workout',
      label: 'Start Workout',
      icon: <Barbell size={20} weight="duotone" />,
      onClick: () => startTransition(() => { navigate('/gym/workout'); }),
    },
    {
      key: 'nutrition',
      label: 'Log Meal & Calories',
      icon: <ForkKnife size={20} weight="duotone" />,
      onClick: () => startTransition(() => { navigate('/nutrition'); }),
    },
    {
      key: 'spending',
      label: 'Log Expense',
      icon: <Wallet size={20} weight="duotone" />,
      onClick: () => startTransition(() => { navigate('/spending'); }),
    },
    {
      key: 'notes',
      label: 'Capture Note / Idea',
      icon: <NotePencil size={20} weight="duotone" />,
      onClick: () => startTransition(() => { navigate('/notes'); }),
    },
  ], [navigate]);

  // Mount-on-first-open trackers so closed heavy sheets cost zero startup & navigation work
  const [hasOpenedMore, setHasOpenedMore] = useState(false);
  const [hasOpenedSlotCustom, setHasOpenedSlotCustom] = useState(false);
  const [hasOpenedQuickAdd, setHasOpenedQuickAdd] = useState(false);
  const [hasOpenedCalendar, setHasOpenedCalendar] = useState(false);
  const [hasOpenedAi, setHasOpenedAi] = useState(false);

  useEffect(() => { if (moreOpen) setHasOpenedMore(true); }, [moreOpen]);
  useEffect(() => { if (customizingSlotIndex !== null) setHasOpenedSlotCustom(true); }, [customizingSlotIndex]);
  useEffect(() => { if (quickAddOpen) setHasOpenedQuickAdd(true); }, [quickAddOpen]);
  useEffect(() => { if (calendarPopupOpen) setHasOpenedCalendar(true); }, [calendarPopupOpen]);
  useEffect(() => { if (aiSheetOpen) setHasOpenedAi(true); }, [aiSheetOpen]);

  // Hide nav on sub-routes that manage their own full-screen flow
  const isSubRoute = useMemo(() => {
    return (
      pathname.startsWith('/gym/workout') ||
      pathname.startsWith('/ai') ||
      pathname.startsWith('/chat') ||
      (pathname.startsWith('/shopping/') && pathname !== '/shopping')
    );
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#0A84FF]/30 font-sans">
      {/* ── Ambient Light (Top 45vh Module Glow) ── */}
      <AmbientLight />

      {/* ── Unified Floating Capsule Header across all interfaces (Home & Sub-Interfaces) ── */}
      {showUnifiedHeader && (
        <CapsuleHeader
          title={headerMeta.title}
          icon={headerMeta.icon}
          onCenterClick={
            isHomeRoute
              ? () => {
                triggerHaptic('light');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
              : undefined
          }
          leading={
            isHomeRoute ? (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setMoreOpen(true);
                }}
                className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center glass-tile text-white text-xs font-bold cursor-pointer select-none shadow-sm active:scale-90 transition-transform shrink-0 touch-manipulation"
                title="Open App Directory & More Interfaces"
                aria-label="Open App Directory & More Interfaces"
              >
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName || 'Profile'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      background: 'var(--preset-gradient, linear-gradient(135deg, #7B4B36, #A46D52))',
                    }}
                  >
                    {userProfile.displayName ? userProfile.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleHeaderBack}
                className="w-9 h-9 rounded-full glass-tile flex items-center justify-center text-white/85 hover:text-white active:scale-90 transition-transform cursor-pointer touch-manipulation shrink-0"
                aria-label="Back"
                title="Back"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
            )
          }
          trailing={
            isHomeRoute ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setCalendarPopupOpen(true);
                  }}
                  className="w-9 h-9 rounded-full glass-tile flex items-center justify-center active:scale-90 transition-transform cursor-pointer touch-manipulation shrink-0"
                  style={{ color: 'var(--app-accent-text, #D29B7E)' }}
                  title="Calendar & Timeline"
                  aria-label="Calendar & Timeline"
                >
                  <CalendarBlank size={17} weight="duotone" />
                </button>

                <button
                  type="button"
                  onClick={handleReload}
                  disabled={isReloading}
                  className="w-9 h-9 rounded-full glass-tile flex items-center justify-center active:scale-90 transition-transform cursor-pointer touch-manipulation disabled:opacity-50 shrink-0"
                  style={{
                    color: isReloading
                      ? 'var(--app-accent-text, #D29B7E)'
                      : 'rgba(255, 255, 255, 0.85)',
                  }}
                  title="Sync & Reload"
                  aria-label="Sync & Reload"
                >
                  <motion.div
                    animate={isReloading ? { rotate: 360 } : { rotate: 0 }}
                    transition={
                      isReloading
                        ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
                        : { duration: 0.25, ease: 'easeOut' }
                    }
                    className="flex items-center justify-center pointer-events-none"
                  >
                    <ArrowClockwise size={16} weight="bold" />
                  </motion.div>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleReload}
                disabled={isReloading}
                className="w-9 h-9 rounded-full glass-tile flex items-center justify-center active:scale-90 transition-transform cursor-pointer touch-manipulation disabled:opacity-50 shrink-0"
                style={{ color: 'var(--app-accent-text, #D29B7E)' }}
                title="Sync & Reload"
                aria-label="Sync & Reload"
              >
                <motion.div
                  animate={isReloading ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    isReloading
                      ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
                      : { duration: 0.25, ease: 'easeOut' }
                  }
                  className="flex items-center justify-center pointer-events-none"
                >
                  <ArrowClockwise size={17} weight="bold" />
                </motion.div>
              </button>
            )
          }
        />
      )}

      {/* ── Main Content Area ── */}
      <main
        className="relative w-full"
      >
        <div className={`w-full max-w-lg mx-auto ${isSubRoute ? 'px-0 pt-0' : 'px-3.5 pt-0.5'}`}>

          {children}
          {!isSubRoute && !isSubInterfaceOpen && (
            <div
              className="w-full shrink-0 select-none pointer-events-none"
              style={{
                height: 'calc(56px + max(env(safe-area-inset-bottom, 0px), 8px) + 8px)',
              }}
              aria-hidden="true"
            />
          )}
        </div>
      </main>

      {/* ── Floating Liquid Glass Navigation Bar (Home + 2 Quick Slots + AI) ── */}
      {!isSubRoute && !isSubInterfaceOpen && (
        <>
          {/* Natural edge fade gradient behind navigation bar */}
          <div className="scroll-edge-bottom" />

          <div
            className="fixed bottom-[max(env(safe-area-inset-bottom,0px),12px)] inset-x-0 z-40 px-4 flex items-center justify-center max-w-lg mx-auto pointer-events-none"
          >
            <div className="w-full pointer-events-auto flex justify-center">
              <TabBar
                items={navTabs}
                activeKey={activeTabKey}
                onChange={handleTabChange}
                onCustomizeSlot={handleCustomizeSlot}
                onAiClick={() => {
                  triggerHaptic('medium');
                  startTransition(() => {
                    if (pathname === '/ai' || pathname === '/chat') {
                      navigate('/');
                    } else {
                      navigate('/ai');
                    }
                  });
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Unified In-Line App Directory Modal (Lazy + mount-on-first-open) ── */}
      {hasOpenedMore && (
        <Suspense fallback={null}>
          <MoreHubSheet
            isOpen={moreOpen}
            onClose={() => setMoreOpen(false)}
            items={ALL_HUB_ITEMS}
            data={data}
            onSelect={(item) => {
              const match = ALL_HUB_ITEMS.find((i) => i.id === item.id);
              if (match) {
                prefetchRoute(match.route);
                startTransition(() => {
                  navigate(match.route);
                });
              }
            }}
            onPinSlot={handlePinSlot}
          />
        </Suspense>
      )}

      {/* ── Home Tab Locked Notice Toast ── */}
      <AnimatePresence>
        {homeLockedToast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-20 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
          >
            <div className="px-4 py-2.5 rounded-2xl glass-nav nav-rim-light shadow-2xl flex items-center gap-2.5 bg-[#1C1C20]/95 text-white text-xs font-semibold">
              <LockKey size={16} weight="fill" style={{ color: 'var(--app-accent-text, #D29B7E)' }} />
              <span>Home interface is locked as your primary dashboard</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick Slot Customizer Sheet (Lazy + mount-on-first-open) ── */}
      {hasOpenedSlotCustom && (
        <Suspense fallback={null}>
          <SlotCustomizerSheet
            isOpen={customizingSlotIndex !== null}
            onClose={() => setCustomizingSlotIndex(null)}
            slotIndex={customizingSlotIndex}
            currentPinned={[slot2Item.id, slot3Item.id]}
            onSelectSlotModule={handleSelectCustomSlotItem}
            onResetDefaults={handleResetDefaults}
          />
        </Suspense>
      )}

      {/* ── Quick Add Action Sheet ── */}
      {hasOpenedQuickAdd && (
        <Suspense fallback={null}>
          <ActionSheet
            isOpen={quickAddOpen}
            onClose={() => setQuickAddOpen(false)}
            title="Quick Actions"
            options={quickAddOptions}
          />
        </Suspense>
      )}

      {/* ── Floating Calendar Quick Window ── */}
      {hasOpenedCalendar && (
        <Suspense fallback={null}>
          <CalendarQuickPopup
            isOpen={calendarPopupOpen}
            onClose={() => setCalendarPopupOpen(false)}
            data={data || ({} as any)}
            updateData={updateData || (async () => ({} as any))}
          />
        </Suspense>
      )}

      {/* ── Ask LifeOS AI Assistant Modal ── */}
      {hasOpenedAi && (
        <Suspense fallback={null}>
          <AskLifeOSModal
            isOpen={aiSheetOpen}
            onClose={() => setAiSheetOpen(false)}
            data={data || ({} as any)}
            updateData={updateData || (async () => ({} as any))}
          />
        </Suspense>
      )}
    </div>
  );
}
