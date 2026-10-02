import { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCw, Bell, Sparkles
} from 'lucide-react';
import AskLifeOSModal from './ai/AskLifeOSModal';
import ChatPillInput from './ai/ChatPillInput';
import { ExpandAllIcon, CollapseContentIcon, CloudDoneIcon, CloudOffIcon } from './icons/MaterialSymbols';
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

  const [isFormPopupOpen, setIsFormPopupOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isPillSlim, setIsPillSlim] = useState(false);
  const [isShortScreen, setIsShortScreen] = useState(() => (typeof window !== 'undefined' ? window.innerHeight <= 700 : false));
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleOpenAi = () => setAiSheetOpen(true);
    const handleFormPopupToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      setIsFormPopupOpen(Boolean(customEvent.detail?.isOpen));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('lifeos-open-ai', handleOpenAi);
    window.addEventListener('lifeos-form-popup-toggle', handleFormPopupToggle);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('lifeos-open-ai', handleOpenAi);
      window.removeEventListener('lifeos-form-popup-toggle', handleFormPopupToggle);
    };
  }, []);

  // Responsive Screen Height Check (700px threshold)
  useEffect(() => {
    const checkHeight = () => setIsShortScreen(window.innerHeight <= 700);
    window.addEventListener('resize', checkHeight);
    return () => window.removeEventListener('resize', checkHeight);
  }, []);

  // Virtual Keyboard Observer via visualViewport
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setIsKeyboardOpen(heightDiff > 120);
      }
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
    };
  }, []);

  // Passive Scroll Awareness for Ask LifeOS Pill (Shrinks on scroll down > 24px, expands on scroll up > 12px)
  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;

      requestAnimationFrame(() => {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        const diff = scrollY - lastScrollYRef.current;

        if (aiSheetOpen || isFormPopupOpen) {
          setIsPillSlim(false);
          lastScrollYRef.current = scrollY;
          tickingRef.current = false;
          return;
        }

        if (scrollY <= 10) {
          setIsPillSlim(false);
        } else if (scrollY + clientHeight >= scrollHeight - 20) {
          setIsPillSlim(false);
        } else if (diff > 24) {
          setIsPillSlim(true);
          lastScrollYRef.current = scrollY;
        } else if (diff < -12) {
          setIsPillSlim(false);
          lastScrollYRef.current = scrollY;
        }

        tickingRef.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [aiSheetOpen, isFormPopupOpen]);

  // Compute and set --dock-h CSS variable dynamically for exact page bottom clearance
  useEffect(() => {
    const row1H = isShortScreen ? 44 : 48;
    const row2H = isFormPopupOpen ? 0 : isPillSlim ? (isShortScreen ? 32 : 36) : (isShortScreen ? 44 : 48);
    const gap = isFormPopupOpen ? 0 : 6;
    const bottomMargin = isShortScreen ? 24 : 32;
    const totalDockH = row1H + row2H + gap + bottomMargin;
    document.documentElement.style.setProperty('--dock-h', `${totalDockH}px`);
  }, [isShortScreen, isFormPopupOpen, isPillSlim]);

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
    <div className="relative min-h-screen text-primary-light dark:text-primary-dark transition-colors duration-200 w-full max-w-full">
      {/* ── Material 3 Expressive Background System: Neutral Canvas + Single Off-Canvas Organic Blob ── */}
      <SectionAccentBlob />

      {/* ── Top In-Page Minimalist Controls (Floating Minimalist Pill Directly on Wallpaper) ── */}
      <header 
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none gpu-composited w-full overflow-hidden"
        style={{
          paddingTop: 'max(var(--sat, env(safe-area-inset-top, 0px)), 12px)',
          paddingLeft: 'max(var(--sal, 0px), 12px)',
          paddingRight: 'max(var(--sar, 0px), 12px)',
        }}
      >
        <div className="flex items-center justify-between h-9 w-full max-w-[720px] md:max-w-[800px] mx-auto min-w-0">
          {/* Left: LifeOS Floating Micro-Badge directly on wallpaper */}
          <button
            onPointerDown={() => triggerHaptic('light')}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-black/50 border border-white/20 text-white active:scale-95 transition-transform select-none shadow-sm cursor-pointer shrink-0"
            title="Scroll to top"
            aria-label="LifeOS, scroll to top"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--md-primary)] animate-pulse" />
            <span className="font-bold text-xs tracking-tight font-sans text-white">
              LifeOS
            </span>
          </button>

          {/* Right Controls: Notification Enable Alert + Reload Squircle Button */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!hasNotificationPermission && (
              <button
                onPointerDown={() => triggerHaptic('light')}
                onClick={async () => {
                  triggerHaptic('medium');
                  const granted = await requestAndSyncNotifications(data, updateData);
                  setHasNotificationPermission(granted);
                }}
                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-black/50 border border-white/20 text-white font-bold text-xs active:scale-95 transition-transform shadow-sm cursor-pointer shrink-0"
                title="Allow phone notifications for Timetable & Tasks"
              >
                <Bell size={13} className="text-white animate-bounce shrink-0" />
                <span className="hidden compact:inline">Allow Alerts</span>
              </button>
            )}

            {/* Network Status Symbol: Cloud symbol when online, offline symbol when offline */}
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-[12px] overflow-hidden border transition-all shadow-sm shrink-0 select-none ${
                isOnline
                  ? 'bg-black/30 dark:bg-black/55 border-white/20 text-emerald-400'
                  : 'bg-amber-500/25 border-amber-500/40 text-amber-300 animate-pulse'
              }`}
              title={isOnline ? 'Online — Connected to Cloud' : 'Offline — Operating from Local Storage'}
              aria-label={isOnline ? 'Online — Connected to Cloud' : 'Offline — Operating from Local Storage'}
            >
              {isOnline ? (
                <CloudDoneIcon size={16} />
              ) : (
                <CloudOffIcon size={16} />
              )}
            </div>

            <button
              onPointerDown={() => triggerHaptic('light')}
              onClick={handleReload}
              disabled={isReloading}
              className={`w-8 h-8 flex items-center justify-center rounded-[12px] overflow-hidden bg-black/30 dark:bg-black/55 border border-white/20 text-white active:scale-95 transition-all shadow-sm cursor-pointer shrink-0 ${
                isReloading ? 'border-white/60 bg-white/20' : ''
              }`}
              style={{ contain: 'paint' }}
              aria-label="Reload and sync data"
              title="Reload and sync data"
            >
              {isReloading ? (
                <M3ProgressIndicator size={16} color="#FFFFFF" />
              ) : (
                <RotateCw size={14} strokeWidth={2.4} className="text-white transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content (Streamlined with precise bottom dock clearance via --dock-h) ── */}
      <main 
        className="relative z-10 min-h-screen box-border"
        style={{
          paddingTop: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 12px) + 44px)',
          paddingBottom: 'calc(var(--dock-h, 126px) + var(--sab, env(safe-area-inset-bottom, 0px)) + 16px)',
          paddingLeft: 'var(--sal, 0px)',
          paddingRight: 'var(--sar, 0px)',
        }}
      >
        <div className="w-full max-w-[720px] md:max-w-[800px] mx-auto px-2.5 compact:px-3 sm:px-4 md:px-6 pt-2 sm:pt-4">
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

      {/* ── Compact Bottom Navigation Dock v2 (.bottom-nav-wrapper) ── */}
      {typeof document !== 'undefined' && createPortal(
        <div className="bottom-nav-wrapper fixed inset-x-0 bottom-0 pointer-events-none z-[1000] flex justify-center px-3 sm:px-4 box-border">
          {/* Atmospheric Blur Layer (.bottom-nav-atmosphere) */}
          <motion.div
            className="bottom-nav-atmosphere"
            initial={false}
            animate={{
              y: (isKeyboardOpen && !aiSheetOpen) ? 160 : 0,
              opacity: (isKeyboardOpen && !aiSheetOpen) ? 0 : 1,
            }}
            transition={{
              y: { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 },
              opacity: { duration: 0.2 },
            }}
          />

          {/* Compact Dock Container (Row 1 + Row 2) */}
          <motion.nav
            ref={navRef}
            initial={false}
            animate={{
              y: (isKeyboardOpen && !aiSheetOpen) ? 160 : 0,
              opacity: (isKeyboardOpen && !aiSheetOpen) ? 0 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 28,
              mass: 0.8,
            }}
            style={{
              marginBottom: `calc(max(12px, var(--sab, env(safe-area-inset-bottom, 0px))) + ${isShortScreen ? '8px' : '16px'})`,
              pointerEvents: (isKeyboardOpen && !aiSheetOpen) ? 'none' : 'auto',
              touchAction: 'manipulation',
            }}
            className="relative z-10 flex flex-col items-center gap-1.5 w-full max-w-[560px] mx-auto gpu-composited select-none box-border"
            role="navigation"
            aria-label="Main Navigation"
          >
            {/* ROW 1: Nav Pill (Home, Gym, Nutrition) + More Orb */}
            <div className="flex items-center gap-2.5 sm:gap-3 w-full min-w-0 pointer-events-auto box-border">
              {/* 1. Nav pill (left element): compact stadium container with glass backdrop */}
              <div
                className={`flex-1 min-w-0 rounded-full flex items-center justify-around border border-teal-500/25 dark:border-teal-500/35 shadow-[0_8px_32px_rgba(0,0,0,0.35)] select-none relative transition-all duration-200 ${
                  isShortScreen ? 'h-[44px] px-2 sm:px-3' : 'h-[48px] px-2.5 sm:px-3.5'
                }`}
                style={{
                  backgroundColor: 'rgba(5, 13, 15, 0.88)',
                  backdropFilter: 'blur(22px) saturate(135%)',
                  WebkitBackdropFilter: 'blur(22px) saturate(135%)',
                }}
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
                      className={`relative flex items-center justify-center select-none focus:outline-none transition-transform active:scale-95 cursor-pointer min-w-[44px] ${
                        isShortScreen ? 'w-9 h-9' : 'w-10 h-10'
                      }`}
                      aria-label={tab.label}
                    >
                      {/* Localized active turquoise glow centered on active element */}
                      {active && <div className="nav-active-glow" />}

                      {/* Active icon chip: 12-lobed scallop shape */}
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
                          <ScallopShape fill={solidAccent} className="w-full h-full drop-shadow-sm" />
                        </motion.div>
                      </div>
                      {/* Icon */}
                      <Icon
                        className="relative z-10 transition-colors duration-200 w-5 h-5 sm:w-6 sm:h-6"
                        strokeWidth={active ? 2.5 : 2.2}
                        style={{
                          color: active ? '#FFFFFF' : inactiveColor,
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* 2. More button (right element, flat surface without blur) */}
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
                className={`shrink-0 flex items-center justify-center select-none focus:outline-none cursor-pointer relative rounded-full ${
                  isShortScreen ? 'w-[44px] h-[44px]' : 'w-[48px] h-[48px]'
                }`}
                style={{
                  transition: 'filter 220ms cubic-bezier(0.2, 0, 0, 1)',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
                }}
                aria-label="More Menu"
                aria-expanded={menuOpen}
              >
                {/* Scallop shape background */}
                <div className="absolute inset-[-2px] pointer-events-none flex items-center justify-center">
                  <ScallopShape
                    fill={squircleBg}
                    className="w-full h-full"
                    pathStyle={{
                      transition: 'fill 220ms cubic-bezier(0.2, 0, 0, 1)',
                    }}
                  />
                </div>

                {/* Active accent dot when current route is in the hub */}
                {isHubActive && !menuOpen && (
                  <span
                    className="absolute top-[8px] right-[8px] w-2 h-2 rounded-full bg-white ring-2 ring-black/20 z-10"
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
                      <CollapseContentIcon className="w-5 h-5 text-white" />
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
                      <ExpandAllIcon className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* ROW 2: Ask LifeOS Pill (ChatPillInput) */}
            <AnimatePresence>
              {!isFormPopupOpen && (
                <motion.div
                  initial={{ y: 40, opacity: 0, height: 0 }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    height: isPillSlim ? (isShortScreen ? 32 : 36) : (isShortScreen ? 44 : 48),
                  }}
                  exit={{ y: 40, opacity: 0, height: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 28,
                  }}
                  onClick={() => {
                    if (isPillSlim) setIsPillSlim(false);
                    setAiSheetOpen(true);
                  }}
                  className="w-full pointer-events-auto cursor-pointer relative overflow-hidden rounded-full shrink-0 min-w-0 box-border"
                >
                  <ChatPillInput
                    inputQuery={""}
                    setInputQuery={() => {}}
                    onSend={() => setAiSheetOpen(true)}
                    isGenerating={false}
                    isRecording={false}
                    transcribing={false}
                    onToggleRecord={() => setAiSheetOpen(true)}
                    inputRef={{ current: null } as any}
                    isSlim={isPillSlim}
                    disabled={!isOnline}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.nav>
        </div>,
        document.body
      )}

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
