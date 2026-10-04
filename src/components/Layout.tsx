import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  House,
  Barbell,
  BookOpen,
  ForkKnife,
  List,
  ArrowClockwise,
  Bell,
  Sparkle,
  CalendarCheck,
  Wallet,
  CheckSquare,
  Flame,
  NotePencil,
  Sun,
  Brain,
  Microphone,
  TShirt,
  ShoppingCart,
  Receipt,
  ClockCounterClockwise,
  ShieldCheck,
  Gear,
} from '../ui/tokens/icons';
import { TabBar, TabItem } from '../ui/navigation/TabBar';
import { BottomCircle } from '../ui/navigation/BottomCircle';
import { MoreHubSheet, HubItem } from '../ui/navigation/MoreHubSheet';
import { ActionSheet, ActionSheetOption } from '../ui/feedback/ActionSheet';
import { GlassSurface } from '../ui/glass/GlassSurface';
import AskLifeOSModal from './ai/AskLifeOSModal';
import { triggerHaptic } from '../utils/haptics';
import {
  checkNotificationPermission,
  requestAndSyncNotifications,
  syncTimetableNotifications,
  syncTaskNotifications,
  syncNutritionNotifications,
} from '../utils/notifications';
import { MODULE_TINTS } from '../ui/tokens/colors';
import type { AppData, AppSettings } from '../types';

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
  { id: 'morning', label: 'Morning Plan', route: '/morning', icon: <Sun size={24} weight="duotone" />, tintKey: 'tasks' },
  { id: 'tasks', label: 'To-Do Tasks', route: '/tasks', icon: <CheckSquare size={24} weight="duotone" />, tintKey: 'tasks' },
  { id: 'timetable', label: 'Timetable', route: '/timetable', icon: <CalendarCheck size={24} weight="duotone" />, tintKey: 'timetable' },
  { id: 'laundry', label: 'Laundry', route: '/laundry', icon: <TShirt size={24} weight="duotone" />, tintKey: 'laundry' },

  // Learn & Focus
  { id: 'study', label: 'Study', route: '/study', icon: <BookOpen size={24} weight="duotone" />, tintKey: 'study' },
  { id: 'flow', label: 'Flow Room', route: '/flow', icon: <Flame size={24} weight="duotone" />, tintKey: 'flow' },
  { id: 'recall', label: 'Active Recall', route: '/recall', icon: <Brain size={24} weight="duotone" />, tintKey: 'flashcards' },
  { id: 'transcribe', label: 'Transcriber', route: '/transcribe', icon: <Microphone size={24} weight="duotone" />, tintKey: 'transcriber' },
  { id: 'notes', label: 'Notes & Ideas', route: '/notes', icon: <NotePencil size={24} weight="duotone" />, tintKey: 'notes' },
  { id: 'brainDump', label: 'Brain Dump', route: '/brain-dump', icon: <Sparkle size={24} weight="duotone" />, tintKey: 'braindump' },

  // Health & Fitness
  { id: 'gym', label: 'Gym', route: '/gym', icon: <Barbell size={24} weight="duotone" />, tintKey: 'gym' },
  { id: 'nutrition', label: 'Nutrition', route: '/nutrition', icon: <ForkKnife size={24} weight="duotone" />, tintKey: 'nutrition' },

  // Money & Finance
  { id: 'spending', label: 'Spending', route: '/spending', icon: <Wallet size={24} weight="duotone" />, tintKey: 'spending' },
  { id: 'shopping', label: 'Shopping Lists', route: '/shopping', icon: <ShoppingCart size={24} weight="duotone" />, tintKey: 'shopping' },
  { id: 'outings', label: 'Outing Splitter', route: '/outings', icon: <Receipt size={24} weight="duotone" />, tintKey: 'outing' },

  // Security & System
  { id: 'vault', label: 'Secure Vault', route: '/vault', icon: <ShieldCheck size={24} weight="duotone" />, tintKey: 'vault' },
  { id: 'history', label: 'Work History', route: '/history', icon: <ClockCounterClockwise size={24} weight="duotone" />, tintKey: 'history' },
  { id: 'settings', label: 'Settings', route: '/settings', icon: <Gear size={24} weight="duotone" />, tintKey: 'home' },
];

export default function Layout({ children, refresh, data, updateData }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [moreOpen, setMoreOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleOpenAi = () => setAiSheetOpen(true);
    window.addEventListener('lifeos-open-ai', handleOpenAi);
    return () => window.removeEventListener('lifeos-open-ai', handleOpenAi);
  }, []);

  // Notification permission check on mount
  useEffect(() => {
    let cancelled = false;
    async function checkOnce() {
      const granted = await checkNotificationPermission();
      if (!cancelled) setHasNotificationPermission(granted);
    }
    checkOnce();
    return () => { cancelled = true; };
  }, []);

  // Sync scheduled notifications on data changes
  useEffect(() => {
    checkNotificationPermission().then(granted => {
      if (!granted) return;
      if (data?.timetable) syncTimetableNotifications(data.timetable, data.settings?.notificationLeadMinutes || 10);
      if (data?.tasks) syncTaskNotifications(data.tasks, data.settings?.notificationLeadMinutes || 10);
      syncNutritionNotifications();
    });
  }, [data?.timetable, data?.tasks]);

  // Smooth auto-hiding header on scroll down, reappearing on scroll up
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (currentScrollY > lastScrollY && currentScrollY > 36) {
            setHeaderVisible(false);
          } else if (currentScrollY < lastScrollY - 6 || currentScrollY <= 12) {
            setHeaderVisible(true);
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Reload handler
  const handleReload = async () => {
    if (isReloading) return;
    triggerHaptic('light');
    setIsReloading(true);
    try {
      if (refresh) await refresh();
      window.location.reload();
    } catch (err) {
      console.warn('Refresh error:', err);
      window.location.reload();
    } finally {
      setIsReloading(false);
    }
  };

  const pathname = (location.pathname || '').toLowerCase();

  // Active module tint
  const activeModuleTint = useMemo(() => {
    if (pathname.startsWith('/gym')) return MODULE_TINTS.gym;
    if (pathname.startsWith('/study') || pathname.startsWith('/flow') || pathname.startsWith('/recall')) return MODULE_TINTS.study;
    if (pathname.startsWith('/nutrition')) return MODULE_TINTS.nutrition;
    if (pathname.startsWith('/spending')) return MODULE_TINTS.spending;
    if (pathname.startsWith('/shopping')) return MODULE_TINTS.shopping;
    if (pathname.startsWith('/outings')) return MODULE_TINTS.outing;
    if (pathname.startsWith('/vault')) return MODULE_TINTS.vault;
    if (pathname.startsWith('/laundry')) return MODULE_TINTS.laundry;
    if (pathname.startsWith('/tasks')) return MODULE_TINTS.tasks;
    if (pathname.startsWith('/notes') || pathname.startsWith('/brain-dump')) return MODULE_TINTS.notes;
    return '#0A84FF';
  }, [pathname]);

  // Customizable Quick Navigation (Max 4 slots: Slot 1 is Home, Slot 4 is Ask AI, Slot 2 & 3 are user customizable)
  const pinnedIds = useMemo(() => {
    const defaultPinned = ['gym', 'study'];
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
    return ALL_HUB_ITEMS.find((i) => i.id === pinnedIds[1]) || ALL_HUB_ITEMS.find((i) => i.id === 'study')!;
  }, [pinnedIds]);

  // Identify active tab key
  const activeTabKey = useMemo(() => {
    if (pathname === '/' || pathname === '') return 'home';
    if (pathname.startsWith(slot2Item.route)) return slot2Item.id;
    if (pathname.startsWith(slot3Item.route)) return slot3Item.id;
    return '';
  }, [pathname, slot2Item, slot3Item]);

  const navTabs: TabItem[] = [
    {
      key: 'home',
      label: 'Home',
      icon: <House size={22} weight="regular" />,
      activeIcon: <House size={22} weight="fill" />,
      tint: '#0A84FF',
    },
    {
      key: slot2Item.id,
      label: slot2Item.label.split(' ')[0],
      icon: slot2Item.icon,
      activeIcon: slot2Item.icon,
      tint: MODULE_TINTS[slot2Item.tintKey] || '#FF453A',
    },
    {
      key: slot3Item.id,
      label: slot3Item.label.split(' ')[0],
      icon: slot3Item.icon,
      activeIcon: slot3Item.icon,
      tint: MODULE_TINTS[slot3Item.tintKey] || '#64D2FF',
    },
  ];

  const handleTabChange = (key: string) => {
    triggerHaptic('selection');
    if (key === 'home') navigate('/');
    else if (key === slot2Item.id) navigate(slot2Item.route);
    else if (key === slot3Item.id) navigate(slot3Item.route);
  };

  const handlePinSlot = (item: HubItem) => {
    if (!updateData) return;
    const current = [...pinnedIds];
    // Replace the least recently pinned slot
    current[1] = current[0];
    current[0] = item.id;
    updateData({
      settings: {
        ...(data?.settings || ({} as any)),
        navPinned: [current[0], current[1]] as [string, string],
      },
    });
  };

  const quickAddOptions: ActionSheetOption[] = [
    {
      key: 'task',
      label: 'New To-Do Task',
      icon: <CheckSquare size={20} weight="duotone" className="text-[#0A84FF]" />,
      onClick: () => navigate('/tasks'),
    },
    {
      key: 'workout',
      label: 'Start Workout',
      icon: <Barbell size={20} weight="duotone" className="text-[#FF453A]" />,
      onClick: () => navigate('/gym/workout'),
    },
    {
      key: 'nutrition',
      label: 'Log Meal & Calories',
      icon: <ForkKnife size={20} weight="duotone" className="text-[#30D158]" />,
      onClick: () => navigate('/nutrition'),
    },
    {
      key: 'spending',
      label: 'Log Expense',
      icon: <Wallet size={20} weight="duotone" className="text-[#BF5AF2]" />,
      onClick: () => navigate('/spending'),
    },
    {
      key: 'flow',
      label: 'Focus Flow Room',
      icon: <Flame size={20} weight="duotone" className="text-[#FF9F0A]" />,
      onClick: () => navigate('/flow'),
    },
    {
      key: 'notes',
      label: 'Capture Note / Idea',
      icon: <NotePencil size={20} weight="duotone" className="text-[#63E6E2]" />,
      onClick: () => navigate('/notes'),
    },
  ];

  // Hide nav on sub-routes that manage their own full-screen flow
  const isSubRoute = useMemo(() => {
    return (
      pathname.startsWith('/study/timer') ||
      pathname.startsWith('/gym/workout') ||
      (pathname.startsWith('/shopping/') && pathname !== '/shopping') ||
      pathname.startsWith('/flow')
    );
  }, [pathname]);

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#0A84FF]/30 font-sans">
      {/* ── Smooth Auto-Hiding Liquid Glass Top Header ── */}
      <motion.header
        animate={{
          y: headerVisible ? 0 : -80,
          opacity: headerVisible ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="sticky top-0 left-0 right-0 z-30 pointer-events-none w-full"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          paddingBottom: '6px',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
        }}
      >
        <div className="flex items-center justify-between h-11 w-full max-w-lg mx-auto min-w-0">
          {/* 1. TOP-LEFT: 3-Bars Menu Button for App Directory */}
          <GlassSurface
            as="button"
            interactive
            onClick={() => {
              triggerHaptic('light');
              setMoreOpen(true);
            }}
            className="pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center border border-white/12 select-none shadow-lg cursor-pointer text-white/90 hover:text-white"
            title="Open App Directory"
            aria-label="Open App Directory"
          >
            <List size={22} weight="bold" />
          </GlassSurface>

          {/* 2. TOP-RIGHT: Clean Free Action Capsule (Alerts, Sync/Refresh) */}
          <GlassSurface
            className="pointer-events-auto h-10 px-2 rounded-full flex items-center gap-1.5 border border-white/12 shadow-lg select-none"
          >
            {/* Clean Free Notification Button */}
            <button
              type="button"
              onClick={async () => {
                triggerHaptic('medium');
                const granted = await requestAndSyncNotifications(data, updateData);
                setHasNotificationPermission(granted);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer relative"
              title="Alerts & Notifications"
              aria-label="Alerts & Notifications"
            >
              <Bell size={18} weight={hasNotificationPermission ? 'regular' : 'fill'} className={hasNotificationPermission ? '' : 'text-[#FFD60A]'} />
              {!hasNotificationPermission && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FFD60A] ring-2 ring-black" />
              )}
            </button>

            <span className="w-[1px] h-3.5 bg-white/15 shrink-0" />

            {/* Sync & Refresh Button */}
            <button
              type="button"
              onClick={handleReload}
              disabled={isReloading}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer disabled:opacity-50"
              title="Sync & Reload"
              aria-label="Sync & Reload"
            >
              <ArrowClockwise
                size={17}
                weight="bold"
                className={isReloading ? 'animate-spin text-[#0A84FF]' : ''}
              />
            </button>
          </GlassSurface>
        </div>
      </motion.header>

      {/* ── Main Content Area ── */}
      <main
        className="relative z-10 w-full"
        style={{
          paddingBottom: isSubRoute ? '24px' : 'calc(84px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="w-full max-w-lg mx-auto px-3.5 pt-0.5">
          {children}
        </div>
      </main>

      {/* ── Floating Liquid Glass Navigation Bar (4 Slots Centered) ── */}
      {!isSubRoute && (
        <>
          {/* Natural edge fade gradient behind navigation bar */}
          <div className="scroll-edge-bottom" />

          <div
            className="fixed bottom-[max(env(safe-area-inset-bottom,0px),12px)] inset-x-0 z-40 px-4 flex items-center justify-center max-w-lg mx-auto pointer-events-none"
          >
            {/* Connected Liquid Metaball TabBar with AI Pod */}
            <div className="w-full pointer-events-auto flex justify-center">
              <TabBar
                items={navTabs}
                activeKey={activeTabKey}
                onChange={handleTabChange}
                onAiClick={() => setAiSheetOpen(true)}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Unified In-Line App Directory Modal ── */}
      <MoreHubSheet
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        items={ALL_HUB_ITEMS}
        onSelect={(item) => {
          const match = ALL_HUB_ITEMS.find((i) => i.id === item.id);
          if (match) {
            navigate(match.route);
          }
        }}
        onPinSlot={handlePinSlot}
      />

      {/* ── Quick Add Action Sheet ── */}
      <ActionSheet
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title="Quick Actions"
        options={quickAddOptions}
      />

      {/* ── Ask LifeOS AI Assistant Modal ── */}
      <AskLifeOSModal
        isOpen={aiSheetOpen}
        onClose={() => setAiSheetOpen(false)}
        data={data || ({} as any)}
        updateData={updateData || (async () => ({} as any))}
      />
    </div>
  );
}
