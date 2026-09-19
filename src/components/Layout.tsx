import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Dumbbell, Utensils, Menu, X, RotateCw, Bell, LucideIcon, Check, ArrowLeftRight
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import {
  checkNotificationPermission,
  requestAndSyncNotifications,
  syncTimetableNotifications,
  syncTaskNotifications,
  syncNutritionNotifications,
} from '../utils/notifications';
import {
  NAV_MODULE_REGISTRY,
  NavConfig,
  getModuleById,
  NavModuleId
} from '../config/navRegistry';
import { loadNavConfig, saveNavConfig } from '../utils/navStorage';
import { NavSlotPickerModal } from './NavSlotPickerModal';
import { SectionAccentBlob } from './SectionAccentBlob';
import { NavigationHubSheet } from './NavigationHubSheet';
import { MotionScheme } from '../utils/motionConfig';
import {
  getSectionFromPathname,
  getNavPillBg,
  getNavSquircleBg,
} from '../theme/sectionSeedColors';
import { useDayTheme } from '../theme/DayThemeProvider';
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

  // Customizable Nav Bar States
  const [navConfig, setNavConfig] = useState<NavConfig>(loadNavConfig);
  const [isNavEditing, setIsNavEditing] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<1 | 2 | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggeredRef = useRef(false);
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const squircleRef = useRef<HTMLButtonElement | null>(null);
  // Guards against double-toggle during the squircle icon swap animation (~120ms)
  const squircleAnimatingRef = useRef(false);

  const slot1Module = getModuleById(navConfig.slot1);
  const slot2Module = getModuleById(navConfig.slot2);

  const primaryDockItems = [
    { icon: Home, label: 'Home', path: '/', isFixed: true, slot: 0 },
    { icon: slot1Module.icon, label: slot1Module.label, path: slot1Module.path, isFixed: false, slot: 1 },
    { icon: slot2Module.icon, label: slot2Module.label, path: slot2Module.path, isFixed: false, slot: 2 },
  ];

  const handleSelectModule = (targetSlot: 1 | 2, moduleId: NavModuleId) => {
    const nextConfig: NavConfig = {
      ...navConfig,
      [targetSlot === 1 ? 'slot1' : 'slot2']: moduleId,
    };
    setNavConfig(nextConfig);
    saveNavConfig(nextConfig);
    triggerHaptic('light');
  };

  const handleSwapSlots = (targetSlot: 1 | 2) => {
    const nextConfig: NavConfig = {
      slot1: navConfig.slot2,
      slot2: navConfig.slot1,
    };
    setNavConfig(nextConfig);
    saveNavConfig(nextConfig);
    const otherSlotNumber = targetSlot === 1 ? 2 : 1;
    triggerHaptic('medium');
    setToastMessage(`Swapped with Slot ${otherSlotNumber}`);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isLongPressTriggeredRef.current = false;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      triggerHaptic('medium');
      setIsNavEditing(true);
      setMenuOpen(false);
    }, 600);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  };

  const handlePointerUpOrLeave = () => {
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

  // Close speed dial menu when navigating or pressing escape
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Sync menu open state for Android hardware back button handling
  useEffect(() => {
    (window as any).__lifeos_menu_open = menuOpen;
    const handleCloseMenu = () => setMenuOpen(false);
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
      const input = el as HTMLInputElement;
      const type = (input.type || 'text').toLowerCase();
      const nonKeyboardTypes = [
        'date',
        'time',
        'datetime-local',
        'month',
        'week',
        'checkbox',
        'radio',
        'range',
        'color',
        'file',
        'button',
        'submit',
        'reset',
        'hidden',
        'image',
      ];
      return !nonKeyboardTypes.includes(type) && !input.readOnly && !input.disabled;
    }
    return false;
  };

  // Hide floating navigation dock when mobile virtual keyboard is open
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const isShrunk = window.visualViewport.height < window.innerHeight - 120;
        if (!isShrunk) {
          setIsKeyboardOpen(false);
        } else if (isVirtualKeyboardInput(document.activeElement)) {
          setIsKeyboardOpen(true);
        }
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (isVirtualKeyboardInput(target)) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (!isVirtualKeyboardInput(active)) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const [navVisible, setNavVisible] = useState(true);

  // Global event listener to force reveal nav dock and clear keyboard lock
  useEffect(() => {
    const handleShowNav = () => {
      setNavVisible(true);
      setIsKeyboardOpen(false);
    };
    window.addEventListener('lifeos-show-nav', handleShowNav);
    return () => {
      window.removeEventListener('lifeos-show-nav', handleShowNav);
    };
  }, []);

  // Automatically reset nav visibility, keyboard state, and close speed dial on route change
  useEffect(() => {
    setNavVisible(true);
    setMenuOpen(false);
    setIsKeyboardOpen(false);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [location.pathname]);

  // OneStop auto-hiding navigation: hides when scrolling down, reappears when scrolling back up
  useEffect(() => {
    let lastScrollY = window.scrollY || document.documentElement.scrollTop;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || document.documentElement.scrollTop;
          const delta = currentScrollY - lastScrollY;

          // When near the top of the page, navigation is always visible
          if (currentScrollY <= 20) {
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

    // NOTE: MutationObserver removed — it fired on every DOM mutation,
    // running synchronously on the main thread at tap time and causing
    // input delay (janky first frame after tapping the More button).
    // Custom events are sufficient for all LifeOS sub-interface cases.

    return () => {
      window.removeEventListener('lifeos-subinterface-open', handleSubOpen);
      window.removeEventListener('lifeos-subinterface-close', handleSubClose);
    };
  }, []);

  // Sub-routes where focused task execution happens (workout session, shopping list items, study timer, etc.)
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
  // Inactive icons: rendered in a muted tone (roughly 55% opacity of the pill's "on-container" color)
  const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.55)' : 'rgba(15, 23, 42, 0.55)';

  const navTabs = [
    {
      id: 'home',
      path: '/',
      icon: Home,
      isActive: location.pathname === '/' || ['/tasks', '/progress', '/history', '/laundry'].includes(location.pathname),
      label: 'Home',
    },
    {
      id: 'gym',
      path: '/gym',
      icon: Dumbbell,
      isActive: location.pathname.startsWith('/gym'),
      label: 'Gym',
    },
    {
      id: 'nutrition',
      path: '/nutrition',
      icon: Utensils,
      isActive: location.pathname === '/nutrition',
      label: 'Nutrition',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || ['/tasks', '/progress', '/history', '/laundry'].includes(location.pathname);
    return location.pathname.startsWith(path);
  };

  const isPrimaryPath = (path: string) => {
    if (path === '/') return true;
    if (path === '/gym') return true;
    if (path === '/nutrition') return true;
    return false;
  };

  const isSecondaryActive = NAV_MODULE_REGISTRY.some(
    item => !isPrimaryPath(item.path) && isActive(item.path)
  );


  // Current page label for header
  const currentNav =
    location.pathname === '/'
      ? { label: 'Home' }
      : NAV_MODULE_REGISTRY.find(n => isActive(n.path));
  const pageLabel = currentNav?.label ?? 'LifeOS';

  return (
    <div className="relative min-h-screen text-primary-light dark:text-primary-dark transition-colors duration-200">
      {/* ── Material 3 Expressive Background System: Neutral Canvas + Single Off-Canvas Organic Blob ── */}
      <SectionAccentBlob />

      {/* ── Top In-Page Minimalist Controls (Floating Minimalist Pill Directly on Wallpaper) ── */}
      <header 
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none gpu-composited"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 h-9 max-w-xl mx-auto">
          {/* Left: LifeOS Floating Micro-Badge directly on wallpaper */}
          <button
            onPointerDown={() => triggerHaptic('light')}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 border border-white/20 text-white active:scale-95 transition-transform select-none shadow-sm"
            title="Scroll to top"
            aria-label="LifeOS, scroll to top"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--md-primary)] animate-pulse" />
            <span className="font-bold text-xs tracking-tight font-sans text-white">
              LifeOS
            </span>
          </button>

          {/* Right Controls: Notification Enable Alert + Reload Squircle Button */}
          <div className="pointer-events-auto flex items-center gap-2">
            {!hasNotificationPermission && (
              <button
                onPointerDown={() => triggerHaptic('light')}
                onClick={async () => {
                  triggerHaptic('medium');
                  const granted = await requestAndSyncNotifications(data, updateData);
                  setHasNotificationPermission(granted);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 border border-white/20 text-white font-bold text-xs active:scale-95 transition-transform shadow-sm"
                title="Allow phone notifications for Timetable & Tasks"
              >
                <Bell size={13} className="text-white animate-bounce" />
                <span>Allow Alerts</span>
              </button>
            )}

            <button
              onPointerDown={() => triggerHaptic('light')}
              onClick={handleReload}
              disabled={isReloading}
              className={`w-8 h-8 flex items-center justify-center rounded-[12px] overflow-hidden bg-black/30 dark:bg-black/55 border border-white/20 text-white active:scale-95 transition-all shadow-sm ${
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
          paddingTop: 'calc(3.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(5.25rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-2 sm:pt-4">
          {children}
        </div>
      </main>

      {/* ── Compact Material 3 Expressive Navigation Hub Modal Sheet ── */}
      <NavigationHubSheet
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeSection={activeSection}
        isDark={isDark}
        returnFocusRef={squircleRef}
      />

      {/* ── Edit Mode Outside Click Dismiss Backdrop ── */}
      {isNavEditing && !pickerSlot && (
        <div
          className="fixed inset-0 z-[95] pointer-events-auto bg-black/20 dark:bg-black/40"
          onClick={() => {
            triggerHaptic('light');
            setIsNavEditing(false);
          }}
        />
      )}

      {/* ── Toast Notification for Slot Swapping ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] px-4 py-2 rounded-full bg-black/90 dark:bg-white/95 text-white dark:text-black text-xs font-bold shadow-xl flex items-center gap-2 border border-white/20 dark:border-black/10 pointer-events-none select-none whitespace-nowrap"
          >
            <ArrowLeftRight size={13} strokeWidth={2.4} className="text-[var(--accent-primary)]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed Bottom Divided Navigation Bar (Pill + Squircle, Per-Interface Color) ── */}
      {(() => {
        const isNavHidden = isKeyboardOpen || subInterfaceOpen || isSubRoute || (!navVisible && !menuOpen);
        return (
          <motion.nav
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
              bottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
              pointerEvents: isNavHidden ? 'none' : 'auto',
              touchAction: 'manipulation',
            }}
            className="fixed left-0 right-0 z-[100] flex items-center justify-center px-4 gpu-composited select-none"
            role="navigation"
            aria-label="Main Navigation"
          >
            <div className="relative pointer-events-auto flex items-center gap-[14px]">
              {/* 1. Nav pill (left element): full stadium/pill, fixed height 64px, width sized to content with 20px h-padding */}
              <div
                className="h-[64px] px-[20px] rounded-full flex items-center gap-[28px] border border-black/[0.06] dark:border-white/[0.12] shadow-[0_10px_28px_rgba(0,0,0,0.10)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.45)] select-none"
                style={{
                  backgroundColor: pillBg,
                  transition: 'background-color 220ms cubic-bezier(0.2, 0, 0, 1), border-color 220ms cubic-bezier(0.2, 0, 0, 1)',
                }}
              >
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = tab.isActive;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        triggerHaptic('nav');
                        if (menuOpen) setMenuOpen(false);
                        navigate(tab.path);
                      }}
                      className="relative w-[40px] h-[40px] rounded-full flex items-center justify-center select-none focus:outline-none transition-transform active:scale-95"
                      aria-label={tab.label}
                    >
                      {/* Active icon chip: 40px diameter filled circle chip in interface solid accent color */}
                      {active && (
                        <motion.div
                          layoutId="navActiveChip"
                          className="absolute inset-0 rounded-full shadow-xs"
                          style={{
                            backgroundColor: solidAccent,
                            transition: 'background-color 220ms cubic-bezier(0.2, 0, 0, 1)',
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      {/* Icon size: 24px, active in white, inactive in 55% opacity */}
                      <Icon
                        size={24}
                        strokeWidth={active ? 2.5 : 2.2}
                        className="relative z-10 transition-colors duration-200"
                        style={{
                          color: active ? '#FFFFFF' : inactiveColor,
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* 2. More button (right element, separate squircle): 64px x 64px, border-radius 28px */}
              <motion.button
                ref={squircleRef}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => {
                  // Guard: if icon-swap animation is in progress, still toggle
                  // but skip haptic to avoid double-feedback. Never ignore the tap.
                  if (!squircleAnimatingRef.current) {
                    squircleAnimatingRef.current = true;
                    setTimeout(() => { squircleAnimatingRef.current = false; }, 150);
                    triggerHaptic('light');
                  }
                  setMenuOpen(prev => !prev);
                }}
                className="w-[64px] h-[64px] shrink-0 rounded-[28px] flex items-center justify-center border border-white/20 shadow-[0_10px_28px_rgba(0,0,0,0.18)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.45)] select-none focus:outline-none cursor-pointer relative overflow-hidden"
                style={{
                  backgroundColor: squircleBg,
                  transition: 'background-color 220ms cubic-bezier(0.2, 0, 0, 1), border-color 220ms cubic-bezier(0.2, 0, 0, 1)',
                }}
                aria-label="More Menu"
                aria-expanded={menuOpen}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {menuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 1 }}
                    >
                      <X size={26} strokeWidth={2.4} className="text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="grid"
                      initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 1 }}
                    >
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                        <circle cx="7" cy="7" r="2.4" />
                        <circle cx="17" cy="7" r="2.4" />
                        <circle cx="7" cy="17" r="2.4" />
                        <circle cx="17" cy="17" r="2.4" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.nav>
        );
      })()}

      {/* ── Slot Picker BottomSheet Modal ── */}
      <NavSlotPickerModal
        isOpen={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        targetSlot={pickerSlot || 1}
        currentSlotModuleId={pickerSlot === 1 ? navConfig.slot1 : navConfig.slot2}
        otherSlotModuleId={pickerSlot === 1 ? navConfig.slot2 : navConfig.slot1}
        onSelectModule={handleSelectModule}
        onSwapSlots={handleSwapSlots}
      />

    </div>
  );
}
