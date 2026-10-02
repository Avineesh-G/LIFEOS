import { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCw, Bell, Sparkles
} from 'lucide-react';
import AskLifeOSModal from './ai/AskLifeOSModal';
import { ExpandAllIcon, CollapseContentIcon, CloudDoneIcon, CloudOffIcon } from './icons/MaterialSymbols';
import { PulseBubbleIcon } from './icons/PulseBubbleIcon';
import { triggerHaptic } from '../utils/haptics';
import {
  checkNotificationPermission,
  requestAndSyncNotifications,
  syncTimetableNotifications,
  syncTaskNotifications,
  syncNutritionNotifications,
} from '../utils/notifications';
import { SectionAccentBlob } from './SectionAccentBlob';
import { ScallopShape } from './ScallopShape';
import { NavigationHubSheet } from './NavigationHubSheet';
import { M3ProgressIndicator } from './m3/M3Shapes';
import M3NotificationBanner from './M3NotificationBanner';
import { MotionScheme } from '../utils/motionConfig';
import {
  getSectionFromPathname,
  getNavPillBg,
  getNavSquircleBg,
} from '../theme/sectionSeedColors';
import { useDayTheme } from '../theme/DayThemeProvider';
import { useNavConfig } from '../hooks/useNavConfig';
import { DESTINATIONS } from '../config/hubDestinations';
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

export default function Layout({ children, refresh, data, updateData }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(true);
  const permissionCheckedRef = useRef(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));

  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const handleCloseAi = useCallback(() => setAiSheetOpen(false), []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleOpenAi = () => setAiSheetOpen(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('lifeos-open-ai', handleOpenAi);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('lifeos-open-ai', handleOpenAi);
    };
  }, []);

  // Dynamic Navigation Configuration Hook
  const {
    pinned,
    pillDestinations,
    hubDestinations,
    setSlot,
    reset: resetNav,
  } = useNavConfig({ data, updateData });

  // Hub Edit Mode State (can be triggered by 450ms long press on pill slots)
  const [hubEditMode, setHubEditMode] = useState(false);
  const [hubSelectedSlot, setHubSelectedSlot] = useState<1 | 2>(1);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const squircleRef = useRef<HTMLButtonElement | null>(null);
  // Guards against double-toggle during the squircle icon swap animation (~120ms)
  const squircleAnimatingRef = useRef(false);
  const navRef = useRef<HTMLElement | null>(null);

  // Measure bottom nav pill actual rendered height into CSS variable --nav-h
  useEffect(() => {
    if (!navRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = Math.round(entry.contentRect.height);
        if (height > 0) {
          document.documentElement.style.setProperty('--nav-h', `${height}px`);
        }
      }
    });
    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, []);

  const handleSlotPointerDown = (slotIndex: number, e: React.PointerEvent) => {
    isLongPressTriggeredRef.current = false;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (slotIndex === 0 || slotIndex === 3) {
      // Home (0) and AI (3) are fixed and cannot be customized
      return;
    }

    const targetSlot = slotIndex as 1 | 2;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      triggerHaptic('medium');
      setHubEditMode(true);
      setHubSelectedSlot(targetSlot);
      setMenuOpen(true);
    }, 450);
  };

  const handleSlotPointerMove = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handleSlotPointerUpOrLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // ONE-TIME permission check on mount — never re-request if already granted
  useEffect(() => {
    let cancelled = false;
    async function checkOnce() {
      if (permissionCheckedRef.current) return;
      permissionCheckedRef.current = true;
      const granted = await checkNotificationPermission();
      if (cancelled) return;
      setHasNotificationPermission(granted);
      if (!granted) {
        // Ask once, after a short delay so the UI is settled
        setTimeout(async () => {
          if (cancelled) return;
          const res = await requestAndSyncNotifications(data, updateData);
          if (!cancelled) setHasNotificationPermission(res);
        }, 1500);
      }
    }
    checkOnce();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-sync scheduled notifications whenever timetable / tasks data changes (no permission re-request)
  useEffect(() => {
    checkNotificationPermission().then(granted => {
      if (!granted) return;
      if (data?.timetable) syncTimetableNotifications(data.timetable, data.settings?.notificationLeadMinutes || 10);
      if (data?.tasks) syncTaskNotifications(data.tasks, data.settings?.notificationLeadMinutes || 10);
      syncNutritionNotifications();
    });
  }, [data?.timetable, data?.tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReload = async () => {
    if (isReloading) return;
    triggerHaptic('light');
    setIsReloading(true);
    try {
      // 0. Ensure notification permissions are requested from the phone system if not granted
      const hasPerm = await checkNotificationPermission();
      if (!hasPerm) {
        const granted = await requestAndSyncNotifications(data, updateData);
        setHasNotificationPermission(granted);
      } else {
        // Sync upcoming reminders
        if (data?.timetable) await syncTimetableNotifications(data.timetable, data.settings?.notificationLeadMinutes || 10);
        if (data?.tasks) await syncTaskNotifications(data.tasks, data.settings?.notificationLeadMinutes || 10);
        await syncNutritionNotifications();
      }

      // 1. Evict any browser / PWA caches
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        } catch (e) {
          console.warn('Cache clear error:', e);
        }
      }

      // 2. Unregister / update service workers so newest code is fetched
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.update();
            await reg.unregister();
          }
        } catch (e) {
          console.warn('SW update error:', e);
        }
      }

      // 3. Perform data refresh
      if (refresh) {
        await refresh();
      }

      // 4. Preserve greeting cooldown timestamp so reload NEVER triggers greeting screen
      try {
        localStorage.setItem('lifeos_last_startup_greeting_timestamp', String(Date.now()));
      } catch (e) {
        console.warn('Could not write greeting timestamp:', e);
      }

      // 5. Force reload
      window.location.reload();
    } catch (err) {
      console.warn('Refresh error:', err);
      try {
        localStorage.setItem('lifeos_last_startup_greeting_timestamp', String(Date.now()));
      } catch {}
      window.location.reload();
    } finally {
      setIsReloading(false);
    }
  };

  // Close speed dial menu when navigating
  useEffect(() => {
    setMenuOpen(false);
    setHubEditMode(false);
  }, [location.pathname]);

  // Sync menu open state for Android hardware back button handling
  useEffect(() => {
    (window as any).__lifeos_menu_open = menuOpen;
    const handleCloseMenu = () => {
      // If hub is in edit mode, let NavigationHubSheet handle exiting edit mode first
      if ((window as any).__lifeos_hub_edit_mode) {
        return;
      }
      setMenuOpen(false);
      setHubEditMode(false);
    };
    window.addEventListener('lifeos-close-menu', handleCloseMenu);
    return () => {
      window.removeEventListener('lifeos-close-menu', handleCloseMenu);
    };
  }, [menuOpen]);

  // Helper: Determine if element opens a mobile virtual keyboard (excluding date/time/button inputs)
  const isVirtualKeyboardInput = (el: Element | null): boolean => {
    if (!el || !(el instanceof HTMLElement)) return false;
    if (el.tagName === 'TEXTAREA' || el.isContentEditable) return true;
    if (el.tagName === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      // Input types that definitely summon a soft keyboard
      return ['text', 'search', 'email', 'number', 'password', 'tel', 'url'].includes(type);
    }
    return false;
  };


  // Directional scroll listener: hides nav on scroll down, shows on scroll up
  const [navVisible, setNavVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
          const delta = currentScrollY - lastScrollY;

          // If at the very top of page, always reveal nav
          if (currentScrollY <= 15) {
            setNavVisible(true);
          } else if (Math.abs(delta) > 5) {
            if (delta > 0) {
              // Scrolling down -> hide nav smoothly
              setNavVisible(false);
              setMenuOpen(false);
            } else {
              // Scrolling back up -> reveal nav smoothly
              setNavVisible(true);
            }
          }

          lastScrollY = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Detect when any sub-interface (BottomSheet, Modal, Dialog) is open across all interfaces
  const [subInterfaceOpen, setSubInterfaceOpen] = useState(false);

  useEffect(() => {
    const handleSubOpen = () => setSubInterfaceOpen(true);
    const handleSubClose = () => {
      setTimeout(() => {
        const hasOpen = Boolean(
          document.body.getAttribute('data-subinterface-open') === 'true' ||
          document.querySelector('[data-subinterface-open="true"]')
        );
        setSubInterfaceOpen(hasOpen);
      }, 60);
    };

    window.addEventListener('lifeos-subinterface-open', handleSubOpen);
    window.addEventListener('lifeos-subinterface-close', handleSubClose);

    return () => {
      window.removeEventListener('lifeos-subinterface-open', handleSubOpen);
      window.removeEventListener('lifeos-subinterface-close', handleSubClose);
    };
  }, []);

  // Sub-routes where focused task execution happens
  const isSubRoute = useMemo(() => {
    const path = (location.pathname || '').toLowerCase();
    if (
      path.startsWith('/study/timer') ||
      path.startsWith('/study/history') ||
      path.startsWith('/study/heatmap') ||
      path.startsWith('/gym/workout') ||
      path.startsWith('/gym/split') ||
      path.startsWith('/gym/onboarding') ||
      path.startsWith('/gym/history/') ||
      (path.startsWith('/shopping/') && path !== '/shopping')
    ) {
      return true;
    }
    return false;
  }, [location.pathname]);

  const { isDark } = useDayTheme();
  const activeSection = getSectionFromPathname(location.pathname);
  const pillBg = getNavPillBg(activeSection, isDark, location.pathname);
  const squircleBg = getNavSquircleBg(activeSection, isDark, location.pathname);
  const solidAccent = squircleBg;
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(15, 23, 42, 0.55)';

  // Cumulative rotation for the active scallop indicator — spins 30° on each interface switch
  const [scallopRotation, setScallopRotation] = useState(0);
  const prevSectionRef = useRef(activeSection);
  useEffect(() => {
    if (activeSection !== prevSectionRef.current) {
      prevSectionRef.current = activeSection;
      setScallopRotation((r) => r + 30);
    }
  }, [activeSection]);

  const currentPath = (location.pathname || '').toLowerCase();

  const isRouteMatching = useCallback(
    (dest: { route: string; matchRoutes?: string[] }) => {
      const targetRoute = dest.route.toLowerCase();
      if (targetRoute !== '/' && (currentPath === targetRoute || currentPath.startsWith(targetRoute + '/'))) {
        return true;
      }
      if (dest.matchRoutes && dest.matchRoutes.length > 0) {
        return dest.matchRoutes.some((r) => {
          const lowerR = r.toLowerCase();
          if (lowerR === '/') return currentPath === '/' || currentPath === '';
          return currentPath === lowerR || currentPath.startsWith(lowerR + '/');
        });
      }
      return false;
    },
    [currentPath]
  );

  const isSlot1Active = isRouteMatching(pillDestinations[1]);
  const isSlot2Active = !isSlot1Active && isRouteMatching(pillDestinations[2]);
  const isHubActive = !isSlot1Active && !isSlot2Active && hubDestinations.some((d) => isRouteMatching(d));
  const isHomeActive = !isSlot1Active && !isSlot2Active && !isHubActive;

  const navTabs = [
    {
      id: 'home',
      path: pillDestinations[0].route,
      icon: pillDestinations[0].icon,
      isActive: isHomeActive,
      label: pillDestinations[0].label,
      slotIndex: 0,
    },
    {
      id: pillDestinations[1].id,
      path: pillDestinations[1].route,
      icon: pillDestinations[1].icon,
      isActive: isSlot1Active,
      label: pillDestinations[1].label,
      slotIndex: 1,
    },
    {
      id: pillDestinations[2].id,
      path: pillDestinations[2].route,
      icon: pillDestinations[2].icon,
      isActive: isSlot2Active,
      label: pillDestinations[2].label,
      slotIndex: 2,
    },
  ];

  return (
    <div className="relative min-h-screen text-[var(--md-on-surface)] transition-colors duration-200 w-full max-w-full bg-[var(--md-surface)]">
      {/* ── Material 3 Expressive Background System: Neutral Canvas + Single Off-Canvas Organic Blob ── */}
      <SectionAccentBlob />

      {/* ── Top Header (LifeOS Chip + 3-Button Cluster: Chat, Cloud, Refresh) ── */}
      <header 
        className="sticky top-0 left-0 right-0 z-30 pointer-events-none gpu-composited w-full overflow-hidden"
        style={{
          paddingTop: 'max(var(--sat, env(safe-area-inset-top, 0px)), 8px)',
          paddingBottom: '6px',
          paddingLeft: 'max(var(--sal, 0px), 12px)',
          paddingRight: 'max(var(--sar, 0px), 12px)',
        }}
      >
        <div className="flex items-center justify-between h-10 w-full max-w-[720px] md:max-w-[800px] mx-auto min-w-0">
          {/* Left: LifeOS Floating Micro-Badge directly on wallpaper */}
          <button
            onPointerDown={() => triggerHaptic('light')}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-surface-container-high)]/90 border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] active:scale-95 transition-transform select-none shadow-xs cursor-pointer shrink-0 max-w-[140px]"
            title="Scroll to top"
            aria-label="LifeOS, scroll to top"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--md-primary)] animate-pulse shrink-0" />
            <span className="font-bold text-xs tracking-tight truncate text-gradient-dark">
              LifeOS
            </span>
          </button>

          {/* Right Controls: Three 40px Tonal Circle Buttons [Chat, Cloud, Refresh] (8px gap) */}
          <div className="pointer-events-auto flex items-center gap-2 shrink-0">
            {!hasNotificationPermission && (
              <button
                onPointerDown={() => triggerHaptic('light')}
                onClick={async () => {
                  triggerHaptic('medium');
                  const granted = await requestAndSyncNotifications(data, updateData);
                  setHasNotificationPermission(granted);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[var(--md-secondary-container)] border border-[var(--md-outline-variant)] text-[var(--md-on-secondary-container)] font-bold text-[11px] active:scale-95 transition-transform shadow-xs cursor-pointer shrink-0 mr-1"
                title="Allow phone notifications for Timetable & Tasks"
              >
                <Bell size={13} className="animate-bounce shrink-0 text-[var(--md-primary)]" />
                <span className="hidden compact:inline">Allow Alerts</span>
              </button>
            )}

            {/* 1. Header Chat Icon Button (Pulse Bubble) */}
            <button
              data-header-action="chat"
              onPointerDown={() => triggerHaptic('light')}
              onClick={() => {
                triggerHaptic('medium');
                setAiSheetOpen(prev => !prev);
              }}
              className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-all select-none cursor-pointer shrink-0 shadow-xs active:scale-95 ${
                aiSheetOpen
                  ? 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] border-2 border-[var(--md-primary)] ring-2 ring-[var(--md-primary)]/20'
                  : 'bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)]'
              }`}
              title={aiSheetOpen ? 'Close Ask LifeOS' : 'Ask LifeOS AI Assistant'}
              aria-label="Ask LifeOS"
              aria-expanded={aiSheetOpen}
            >
              <PulseBubbleIcon size={20} filled={aiSheetOpen} />
            </button>

            {/* 2. Cloud Sync Status Symbol */}
            <div
              data-header-action="cloud"
              className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center border transition-all shadow-xs shrink-0 select-none ${
                isOnline
                  ? 'bg-[var(--md-surface-container-high)] text-[var(--md-primary)] border-[var(--md-outline-variant)]'
                  : 'bg-amber-500/20 text-amber-500 border-amber-500/40 animate-pulse'
              }`}
              title={isOnline ? 'Online — Connected to Cloud' : 'Offline — Operating from Local Storage'}
              aria-label={isOnline ? 'Online — Connected to Cloud' : 'Offline — Operating from Local Storage'}
            >
              {isOnline ? (
                <CloudDoneIcon size={18} />
              ) : (
                <CloudOffIcon size={18} />
              )}
            </div>

            {/* 3. Refresh and Sync Data Button */}
            <button
              data-header-action="refresh"
              onPointerDown={() => triggerHaptic('light')}
              onClick={handleReload}
              disabled={isReloading}
              className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center bg-[var(--md-surface-container-high)] hover:bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] text-[var(--md-on-surface)] active:scale-95 transition-all shadow-xs cursor-pointer shrink-0 ${
                isReloading ? 'border-[var(--md-primary)] bg-[var(--md-primary-container)] text-[var(--md-primary)]' : ''
              }`}
              aria-label="Reload and sync data"
              title="Reload and sync data"
            >
              {isReloading ? (
                <M3ProgressIndicator size={18} color="var(--md-primary)" />
              ) : (
                <RotateCw size={16} strokeWidth={2.2} className="transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content (Streamlined with clean top alignment under sticky header) ── */}
      <main 
        className="relative z-10 w-full box-border"
        style={{
          paddingTop: '4px',
          paddingBottom: 'calc(var(--nav-h, 64px) + var(--sab, env(safe-area-inset-bottom, 0px)) + 24px)',
          paddingLeft: 'var(--sal, 0px)',
          paddingRight: 'var(--sar, 0px)',
        }}
      >
        <div className="w-full max-w-[720px] md:max-w-[800px] mx-auto px-2.5 compact:px-3 sm:px-4 md:px-6 pt-0.5 sm:pt-1">
          <M3NotificationBanner />
          {children}
        </div>
      </main>

      {/* ── Compact Material 3 Expressive Navigation Hub Modal Sheet ── */}
      <NavigationHubSheet
        isOpen={menuOpen}
        onClose={() => {
          setMenuOpen(false);
          setHubEditMode(false);
        }}
        activeSection={activeSection}
        isDark={isDark}
        returnFocusRef={squircleRef}
        pinned={pinned}
        onSetSlot={setSlot}
        onResetNav={resetNav}
        initialEditMode={hubEditMode}
        initialSelectedSlot={hubSelectedSlot}
        onExitEditMode={() => setHubEditMode(false)}
      />

      {/* ── Compact Bottom Navigation Wrapper (.bottom-nav-wrapper) ── */}
      <div className="bottom-nav-wrapper">
        {/* Atmospheric Blur Layer (.bottom-nav-atmosphere) */}
        <motion.div
          className="bottom-nav-atmosphere"
          initial={false}
          animate={{
            y: aiSheetOpen ? 120 : 0,
            opacity: aiSheetOpen ? 0 : 1,
          }}
          transition={{
            y: { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 },
            opacity: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
          }}
        />

        {/* Compact Floating Navigation Bar */}
        {(() => {
          const isNavHidden = aiSheetOpen;
          return (
            <motion.nav
              ref={navRef}
              initial={false}
              animate={{
                y: isNavHidden ? 120 : 0,
                opacity: isNavHidden ? 0 : 1,
                scale: isNavHidden ? 0.93 : 1,
              }}
              transition={{
                y: { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 },
                opacity: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
              }}
              style={{
                marginBottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
                pointerEvents: isNavHidden ? 'none' : 'auto',
                touchAction: 'manipulation',
              }}
              className="relative z-10 flex items-center justify-center px-3 compact:px-3 sm:px-4 gpu-composited select-none"
              role="navigation"
              aria-label="Main Navigation"
            >
                <div className="relative pointer-events-auto flex items-center gap-2.5 sm:gap-3">
                  {/* 1. Nav pill (left element): 3 quick items in M3 surface container */}
                  <div
                    className="h-[52px] compact:h-[56px] px-3.5 sm:px-5 rounded-full flex items-center gap-3 sm:gap-6 bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] shadow-m3-elevation-2 select-none relative transition-colors duration-250"
                  >
                    {navTabs.map((tab) => {
                      const Icon = tab.icon;
                      const active = tab.isActive;
                      return (
                        <button
                          key={tab.id}
                          data-no-ripple="true"
                          onPointerDown={(e) => handleSlotPointerDown(tab.slotIndex, e)}
                          onPointerMove={handleSlotPointerMove}
                          onPointerUp={handleSlotPointerUpOrLeave}
                          onPointerCancel={handleSlotPointerUpOrLeave}
                          onPointerLeave={handleSlotPointerUpOrLeave}
                          onClick={() => {
                            if (isLongPressTriggeredRef.current) {
                              isLongPressTriggeredRef.current = false;
                              return;
                            }
                            triggerHaptic('nav');
                            if (menuOpen) setMenuOpen(false);
                            startTransition(() => { navigate(tab.path); });
                          }}
                          className="relative w-9 h-9 compact:w-10 compact:h-10 flex items-center justify-center select-none focus:outline-none transition-transform active:scale-95 cursor-pointer"
                          aria-label={tab.label}
                        >
                          {/* Active icon chip: 12-lobed scallop shape with primary fill */}
                          <div
                            className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              active ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                            }`}
                          >
                            <motion.div
                              animate={{ rotate: scallopRotation }}
                              transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.8 }}
                              className="w-full h-full flex items-center justify-center"
                            >
                              <ScallopShape fill="var(--md-primary)" className="w-full h-full drop-shadow-sm" />
                            </motion.div>
                          </div>
                          {/* Icon */}
                          <Icon
                            className="relative z-10 transition-colors duration-200 w-5 h-5 compact:w-5.5 compact:h-5.5"
                            strokeWidth={active ? 2.5 : 2.2}
                            style={{
                              color: active ? 'var(--md-on-primary, #FFFFFF)' : 'var(--md-on-surface-variant)',
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>

              {/* 2. More button (right element, separate scallop shape): M3 primary fill */}
              <motion.button
                ref={squircleRef}
                data-no-ripple="true"
                whileTap={{ scale: 0.94 }}
                animate={{ scale: menuOpen ? 0.96 : 1 }}
                transition={{ type: 'tween', duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  if (!squircleAnimatingRef.current) {
                    squircleAnimatingRef.current = true;
                    setTimeout(() => { squircleAnimatingRef.current = false; }, 120);
                    triggerHaptic('light');
                  }
                  setMenuOpen(prev => !prev);
                }}
                className="w-[52px] h-[52px] compact:w-[56px] compact:h-[56px] shrink-0 flex items-center justify-center select-none focus:outline-none cursor-pointer relative"
                style={{
                  filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.18))',
                }}
                aria-label="More Menu"
                aria-expanded={menuOpen}
              >
                {/* Scallop shape background */}
                <div className="absolute inset-[-2px] pointer-events-none flex items-center justify-center">
                  <ScallopShape
                    fill="var(--md-primary)"
                    className="w-full h-full"
                  />
                </div>

                {/* Active accent dot when current route is in the hub */}
                {isHubActive && !menuOpen && (
                  <span
                    className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--md-on-primary)] ring-2 ring-[var(--md-primary)] z-10"
                    aria-hidden="true"
                  />
                )}

                <AnimatePresence mode="popLayout" initial={false}>
                  {menuOpen ? (
                    <motion.div
                      key="close"
                      className="relative z-10 flex items-center justify-center"
                      initial={{ rotate: -45, opacity: 0, scale: 0.75 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 45, opacity: 0, scale: 0.75 }}
                      transition={{ type: 'tween', duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <CollapseContentIcon className="w-6 h-6 text-[var(--md-on-primary, #FFFFFF)]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="grid"
                      className="relative z-10 flex items-center justify-center"
                      initial={{ rotate: 45, opacity: 0, scale: 0.75 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -45, opacity: 0, scale: 0.75 }}
                      transition={{ type: 'tween', duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <ExpandAllIcon className="w-6 h-6 text-[var(--md-on-primary, #FFFFFF)]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.nav>
        );
      })()}
      </div>

      {/* ── Global Ask LifeOS AI Assistant Sheet (Pop-Up over active interface) ── */}
      <AskLifeOSModal
        isOpen={aiSheetOpen}
        onClose={handleCloseAi}
        data={data || ({} as any)}
        updateData={updateData || (async () => ({} as any))}
      />
    </div>
  );
}
