import { useState, useEffect, useRef, useMemo, useCallback, startTransition } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCw, Bell
} from 'lucide-react';
import { ExpandAllIcon, CollapseContentIcon } from './icons/MaterialSymbols';
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

    if (slotIndex === 0) {
      // Home is fixed and cannot be customized
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

      // 4. Force reload
      window.location.reload();
    } catch (err) {
      console.warn('Refresh error:', err);
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

  // Virtual keyboard detection: hide nav bar when keyboard is up to prevent occlusion
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      if (isVirtualKeyboardInput(e.target as Element)) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      // Give a tiny tick so if focus moves between inputs, we don't flash the nav
      setTimeout(() => {
        if (!isVirtualKeyboardInput(document.activeElement)) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    // VisualViewport fallback: tracks real-time screen shrinkage when keyboard slides in on Android/iOS
    const handleViewportResize = () => {
      if (window.visualViewport) {
        // If viewport height drops significantly below window innerHeight, keyboard is open
        const heightDiff = window.innerHeight - window.visualViewport.height;
        if (heightDiff > 140) {
          setIsKeyboardOpen(true);
        } else if (!isVirtualKeyboardInput(document.activeElement)) {
          setIsKeyboardOpen(false);
        }
      }
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
      window.visualViewport.addEventListener('scroll', handleViewportResize);
    }

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
        window.visualViewport.removeEventListener('scroll', handleViewportResize);
      }
    };
  }, []);

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
  const pillBg = getNavPillBg(activeSection, isDark);
  const squircleBg = getNavSquircleBg(activeSection, isDark);
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
              <RotateCw size={14} strokeWidth={2.4} className={`transition-transform duration-300 ${isReloading ? 'animate-spin text-white' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content (Streamlined with precise bottom dock clearance) ── */}
      <main 
        className="relative z-10 min-h-screen"
        style={{
          paddingTop: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 12px) + 44px)',
          paddingBottom: 'calc(var(--nav-h, 64px) + var(--sab, env(safe-area-inset-bottom, 0px)) + 24px)',
          paddingLeft: 'var(--sal, 0px)',
          paddingRight: 'var(--sar, 0px)',
        }}
      >
        <div className="w-full max-w-[720px] md:max-w-[800px] mx-auto px-2.5 compact:px-3 sm:px-4 md:px-6 pt-2 sm:pt-4">
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

      {/* ── Fixed Bottom Divided Navigation Bar (Pill + Squircle, Per-Interface Color) ── */}
      {(() => {
        const isNavHidden = isKeyboardOpen || subInterfaceOpen || isSubRoute || (!navVisible && !menuOpen);
        return (
          <motion.nav
            ref={navRef}
            initial={false}
            animate={{
              y: isNavHidden ? 100 : 0,
              opacity: isNavHidden ? 0 : 1,
              scale: isNavHidden ? 0.93 : 1,
            }}
            transition={{
              y: { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 },
              opacity: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
              scale: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
            }}
            style={{
              bottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 12px)',
              pointerEvents: isNavHidden ? 'none' : 'auto',
              touchAction: 'manipulation',
            }}
            className="fixed left-0 right-0 z-[100] flex items-center justify-center px-2 compact:px-3 sm:px-4 gpu-composited select-none"
            role="navigation"
            aria-label="Main Navigation"
          >
            <div className="relative pointer-events-auto flex items-center gap-2 compact:gap-3 sm:gap-[14px]">
              {/* 1. Nav pill (left element): full stadium/pill, fluid height, width sized to content */}
              <div
                className="h-[52px] compact:h-[58px] sm:h-[64px] px-2.5 compact:px-3.5 sm:px-[20px] rounded-full flex items-center gap-2 compact:gap-4 sm:gap-[28px] border border-black/[0.06] dark:border-white/[0.12] shadow-[0_10px_28px_rgba(0,0,0,0.10)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.45)] select-none"
                style={{
                  backgroundColor: pillBg,
                  opacity: 1,
                  transition: 'background-color 220ms cubic-bezier(0.2, 0, 0, 1), border-color 220ms cubic-bezier(0.2, 0, 0, 1)',
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
                      className="relative w-[34px] h-[34px] compact:w-[38px] compact:h-[38px] sm:w-[40px] sm:h-[40px] flex items-center justify-center select-none focus:outline-none transition-transform active:scale-95 cursor-pointer"
                      aria-label={tab.label}
                    >
                      {/* Active icon chip: 12-lobed scallop shape — rotates 30° on each interface switch */}
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
                      {/* Icon: active in white, inactive in 55% opacity */}
                      <Icon
                        className="relative z-10 transition-colors duration-200 w-[19px] h-[19px] compact:w-[21px] compact:h-[21px] sm:w-[24px] sm:h-[24px]"
                        strokeWidth={active ? 2.5 : 2.2}
                        style={{
                          color: active ? '#FFFFFF' : inactiveColor,
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* 2. More button (right element, separate scallop shape): responsive dimensions */}
              <motion.button
                ref={squircleRef}
                data-no-ripple="true"
                whileTap={{ scale: 0.94 }}
                animate={{ scale: menuOpen ? 0.96 : 1 }}
                transition={{ type: 'tween', duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  // Guard: if icon-swap animation is in progress, still toggle
                  // but skip haptic to avoid double-feedback. Never ignore the tap.
                  if (!squircleAnimatingRef.current) {
                    squircleAnimatingRef.current = true;
                    setTimeout(() => { squircleAnimatingRef.current = false; }, 120);
                    triggerHaptic('light');
                  }
                  setMenuOpen(prev => !prev);
                }}
                className="w-[52px] h-[52px] compact:w-[58px] compact:h-[58px] sm:w-[64px] sm:h-[64px] shrink-0 flex items-center justify-center select-none focus:outline-none cursor-pointer relative"
                style={{
                  transition: 'filter 220ms cubic-bezier(0.2, 0, 0, 1)',
                  filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.22))',
                }}
                aria-label="More Menu"
                aria-expanded={menuOpen}
              >
                {/* Scallop shape background — bleeds 4px beyond tap target for visual emphasis */}
                <div className="absolute inset-[-4px] pointer-events-none flex items-center justify-center">
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
                    className="absolute top-[10px] right-[10px] sm:top-[14px] sm:right-[14px] w-2 h-2 rounded-full bg-white ring-2 ring-black/20 z-10"
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
                      <CollapseContentIcon className="w-[20px] h-[20px] compact:w-[23px] compact:h-[23px] sm:w-[26px] sm:h-[26px] text-white" />
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
                      <ExpandAllIcon className="w-[20px] h-[20px] compact:w-[23px] compact:h-[23px] sm:w-[26px] sm:h-[26px] text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.nav>
        );
      })()}

    </div>
  );
}
