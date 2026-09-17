import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Menu, X, RotateCw, Bell, LucideIcon, Check, ArrowLeftRight
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

  // Hide floating navigation dock when mobile virtual keyboard is open
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const isShrunk = window.visualViewport.height < window.innerHeight - 120;
        setIsKeyboardOpen(isShrunk);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA' && !active.isContentEditable)) {
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

  // Automatically reset nav visibility and close speed dial on route change
  useEffect(() => {
    setNavVisible(true);
    setMenuOpen(false);
  }, [location.pathname]);

  // OneStop auto-hiding navigation: hides when scrolling down, reappears when scrolling back up
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - lastScrollY;

          // Near page top, navigation is always visible
          if (currentScrollY <= 45) {
            setNavVisible(true);
          } else if (Math.abs(delta) > 8) {
            if (delta > 0) {
              // Scrolling down -> hide nav
              setNavVisible(false);
              setMenuOpen(false);
            } else {
              // Scrolling back up -> reveal nav
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isPrimaryPath = (path: string) => {
    if (path === '/') return true;
    if (path === slot1Module.path) return true;
    if (path === slot2Module.path) return true;
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


      {/* ── Top In-Page Minimalist Controls (Option B: Pure Floating · Moves with page scroll) ── */}
      <header 
        className="absolute top-0 left-0 right-0 z-30 pointer-events-none gpu-composited"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 h-9 max-w-xl mx-auto">
          {/* Left: LifeOS Floating Micro-Badge */}
          <button
            onPointerDown={() => triggerHaptic('light')}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--card-surface)] border border-[var(--card-border)] shadow-xs active:scale-95 transition-all duration-300 select-none hover:bg-[var(--card-surface)]"
            title="Scroll to top"
            aria-label="LifeOS, scroll to top"
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="font-bold text-xs tracking-tight text-primary-light dark:text-primary-dark font-sans">
              LifeOS
            </span>
          </button>

          {/* Right Controls: Notification Enable Alert (if not granted) + Reload Button */}
          <div className="pointer-events-auto flex items-center gap-2">
            {!hasNotificationPermission && (
              <button
                onPointerDown={() => triggerHaptic('light')}
                onClick={async () => {
                  triggerHaptic('medium');
                  const granted = await requestAndSyncNotifications(data, updateData);
                  setHasNotificationPermission(granted);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/15 dark:bg-indigo-500/25 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs active:scale-95 transition-all shadow-xs"
                title="Allow phone notifications for Timetable & Tasks"
              >
                <Bell size={13} className="text-indigo-500 animate-bounce" />
                <span>Allow Alerts</span>
              </button>
            )}

            <button
              onPointerDown={() => triggerHaptic('light')}
              onClick={handleReload}
              disabled={isReloading}
              className={`w-8 h-8 flex items-center justify-center rounded-full bg-[var(--card-surface)] border border-[var(--card-border)] text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark active:scale-95 transition-all duration-300 shadow-xs ${
                isReloading ? 'text-accent border-accent/40 bg-accent/15' : ''
              }`}
              aria-label="Reload and sync data"
              title="Reload and sync data"
            >
              <RotateCw size={14} strokeWidth={2.4} className={`transition-transform duration-300 ${isReloading ? 'animate-spin text-accent' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content (Reframed with Edge-to-Edge Fluid Flow & Spacious Breathing Room) ── */}
      <main 
        className="relative z-10 min-h-screen"
        style={{
          paddingTop: 'calc(3.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(8.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="max-w-xl mx-auto px-4 sm:px-6 pt-2 sm:pt-4 pb-8">
          {children}
        </div>
      </main>

      {/* ── Backdrop Overlay for Speed-Dial Menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => {
              triggerHaptic('light');
              setMenuOpen(false);
            }}
            className="fixed inset-0 bg-black/40 dark:bg-black/65 z-40 pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* ── Speed-Dial Popup Menu Panel (Three Dots Navigation Hub) ── */}
      <AnimatePresence>
        {menuOpen && (
          <div
            className="fixed z-50 pointer-events-none flex flex-col items-end justify-end w-full max-w-xs left-1/2 -translate-x-1/2 px-4"
            style={{ bottom: 'calc(6.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-full rounded-[28px] p-2.5 liquid-glass border border-[var(--card-border)] shadow-[0_20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-1"
            >
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--card-border)]/60">
                <span className="label-mono text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)]">
                  Navigation Hub
                </span>
                <span className="text-[10px] font-bold text-[var(--pill-active-text)] bg-[var(--pill-active-bg)] px-2 py-0.5 rounded-full border border-[var(--card-border)]">
                  {pageLabel}
                </span>
              </div>

              <div className="max-h-[60vh] overflow-y-auto no-scrollbar space-y-1 py-1">
                {NAV_MODULE_REGISTRY.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        triggerHaptic('nav');
                        setMenuOpen(false);
                        navigate(item.path);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[20px] transition-all active:scale-[0.98] select-none ${
                        active
                          ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border border-[var(--card-border)] font-bold shadow-xs'
                          : 'hover:bg-[var(--card-surface)] text-[var(--text-primary)] font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          active
                            ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                            : 'bg-black/5 dark:bg-white/10 text-[var(--text-secondary)]'
                        }`}>
                          <Icon size={16} strokeWidth={2.2} />
                        </div>
                        <span className="text-xs sm:text-sm tracking-tight truncate font-sans">
                          {item.label}
                        </span>
                      </div>

                      {active ? (
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0 mr-1" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--card-border)] shrink-0 mr-1 opacity-60" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* ── Fixed Bottom Divided Navigation Bar (Split Island Dynamic Dock) ── */}
      <nav
        className="fixed left-0 right-0 z-[100] pointer-events-none flex items-center justify-center px-3 sm:px-4 gpu-composited"
        style={{
          bottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
          transform: isKeyboardOpen || (!navVisible && !menuOpen)
            ? 'translateY(calc(100% + 2.5rem))'
            : 'translateY(0)',
          opacity: isKeyboardOpen || (!navVisible && !menuOpen) ? 0 : 1,
          transition: 'transform 420ms cubic-bezier(0.32,0,0.67,0), opacity 380ms cubic-bezier(0.32,0,0.67,0)',
          pointerEvents: isKeyboardOpen || (!navVisible && !menuOpen) ? 'none' : 'auto',
        }}
        role="navigation"
        aria-label="Main Navigation"
      >
        <div className="relative pointer-events-auto flex items-center gap-2 sm:gap-2.5 max-w-md">
          {/* Edit Mode Done / Hint Floating Affordance */}
          <AnimatePresence>
            {isNavEditing && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute -top-11 left-0 right-0 flex items-center justify-between px-2 pointer-events-auto select-none"
              >
                <span className="text-[10px] sm:text-[11px] font-bold font-mono text-[var(--accent-primary)] bg-[var(--card-surface)] px-2.5 py-1 rounded-full border border-[var(--card-border)] shadow-xs">
                  Tap slot to change
                </span>
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsNavEditing(false);
                  }}
                  className="px-3.5 py-1 rounded-full bg-[var(--accent-primary)] text-white text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
                >
                  <Check size={12} strokeWidth={3} />
                  <span>Done</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Divided Segment: Home, Slot 1, Slot 2 */}
          <div className="flex items-center px-2 py-1.5 rounded-[28px] bg-[var(--card-surface)] border border-[var(--card-border)] shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] transition-colors duration-300">
            {primaryDockItems.map((item, idx) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              const isEditable = !item.isFixed;
              const wiggleClass = isNavEditing && isEditable
                ? (item.slot === 1 ? 'animate-nav-wiggle-1 nav-slot-editable-active' : 'animate-nav-wiggle-2 nav-slot-editable-active')
                : '';

              return (
                <div key={item.slot} className="flex items-center">
                  {idx > 0 && (
                    <div className="w-[1px] h-5 bg-[var(--card-border)] rounded-full mx-0.5 opacity-80" />
                  )}
                  <button
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUpOrLeave}
                    onPointerLeave={handlePointerUpOrLeave}
                    onPointerCancel={handlePointerUpOrLeave}
                    onClick={() => {
                      if (isLongPressTriggeredRef.current) {
                        isLongPressTriggeredRef.current = false;
                        return;
                      }
                      if (isNavEditing) {
                        if (isEditable) {
                          triggerHaptic('light');
                          setPickerSlot(item.slot as 1 | 2);
                        } else {
                          triggerHaptic('light');
                        }
                        return;
                      }
                      triggerHaptic('nav');
                      if (menuOpen) setMenuOpen(false);
                      navigate(item.path);
                    }}
                    title={isNavEditing && isEditable ? `Customize ${item.label}` : item.label}
                    className={`relative flex flex-col items-center justify-center w-[68px] sm:w-[74px] py-1.5 px-2 rounded-[20px] transition-all duration-150 active:scale-95 select-none focus:outline-none ${wiggleClass} ${
                      active && !isNavEditing
                        ? 'text-[var(--pill-active-text)] font-bold'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold'
                    }`}
                  >
                    {active && !isNavEditing && (
                      <motion.div
                        layoutId="activeTabBadge"
                        className="absolute inset-0 rounded-[18px] bg-[var(--pill-active-bg)] border border-[var(--card-border)] shadow-xs"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      />
                    )}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={item.path}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.15 }}
                        className="relative z-10 flex flex-col items-center justify-center pointer-events-none"
                      >
                        <Icon size={20} strokeWidth={active && !isNavEditing ? 2.5 : 2.2} className="transition-transform duration-150" />
                        <span className="text-[10.5px] sm:text-[11px] tracking-tight mt-0.5 leading-none">
                          {item.label}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Divided Companion Satellite: More / Menu Launcher (Three Dots) */}
          <div className="flex items-center justify-center p-1.5 rounded-[26px] bg-[var(--card-surface)] border border-[var(--card-border)] shadow-[0_12px_36px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] transition-colors duration-300">
            <button
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUpOrLeave}
              onPointerLeave={handlePointerUpOrLeave}
              onPointerCancel={handlePointerUpOrLeave}
              onClick={() => {
                if (isLongPressTriggeredRef.current) {
                  isLongPressTriggeredRef.current = false;
                  return;
                }
                if (isNavEditing) {
                  triggerHaptic('light');
                  return;
                }
                triggerHaptic('light');
                setMenuOpen(!menuOpen);
              }}
              title="More Sections"
              aria-expanded={menuOpen}
              className={`relative flex flex-col items-center justify-center w-[58px] sm:w-[64px] py-1.5 px-2 rounded-[20px] transition-all duration-150 active:scale-95 select-none focus:outline-none ${
                menuOpen || isSecondaryActive
                  ? 'text-[var(--pill-active-text)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold'
              }`}
            >
              {(menuOpen || isSecondaryActive) && (
                <div
                  className="absolute inset-0 rounded-[18px] bg-[var(--pill-active-bg)] border border-[var(--card-border)] shadow-xs transition-opacity duration-150"
                />
              )}
              {menuOpen ? (
                <X size={20} strokeWidth={2.4} className="relative z-10 transition-transform duration-150" />
              ) : (
                <Menu size={20} strokeWidth={2.2} className="relative z-10 transition-transform duration-150" />
              )}
              <span className="relative z-10 text-[10.5px] sm:text-[11px] tracking-tight mt-0.5 leading-none">
                {menuOpen ? 'Close' : 'More'}
              </span>
            </button>
          </div>
        </div>
      </nav>

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
