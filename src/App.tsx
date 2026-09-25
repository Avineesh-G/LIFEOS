import { useRoutes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion, getPageMotionProps } from './utils/motionConfig';
import { App as CapApp } from '@capacitor/app';
import { useTheme } from './hooks/useTheme';
import { useData } from './hooks/useData';
import Layout from './components/Layout';
import Home from './pages/Home';
import Study from './pages/Study';
import StudyTimer from './pages/StudyTimer';
import StudyHistory from './pages/StudyHistory';
import StudyHeatmap from './pages/StudyHeatmap';
import Gym from './pages/Gym';
import GymWorkout from './pages/GymWorkout';
import GymSplit from './pages/GymSplit';
import GymExerciseHistory from './pages/GymExerciseHistory';
import GymOnboarding from './pages/GymOnboarding';
import Nutrition from './pages/Nutrition';
import Spending from './pages/Spending';
import ShoppingLists from './pages/ShoppingLists';
import ShoppingListDetail from './pages/ShoppingListDetail';
import Timetable from './pages/Timetable';
import Tasks from './pages/Tasks';
import Laundry from './pages/Laundry';
import WorkHistory from './pages/WorkHistory';
import SettingsPage from './pages/Settings';
import Vault from './pages/Vault';
import DownloadPage from './pages/DownloadPage';
import Auth from './pages/Auth';
import React, { useEffect, useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { OutingsProvider } from './features/outings/context/OutingsContext';

const OutingsListPage = lazy(() => import('./features/outings/pages/OutingsListPage'));
const OutingDetailPage = lazy(() => import('./features/outings/pages/OutingDetailPage'));
const InterfaceColorsSettings = lazy(() => import('./pages/InterfaceColorsSettings'));
const Notes = lazy(() => import('./pages/Notes'));
import { auth } from './firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { ErrorBoundary, RouteErrorBoundary } from './components/ErrorBoundary';
import AppLockOverlay from './components/security/AppLockOverlay';
import InAppUpdateModal from './components/InAppUpdateModal';
import NetworkStatusModal from './components/NetworkStatusModal';
import CloudMigrationModal from './components/CloudMigrationModal';
import { DayThemeProvider } from './theme/DayThemeProvider';
import { M3FeedbackProvider } from './components/m3/M3FeedbackContext';
const DevPaletteBoard = import.meta.env.DEV ? lazy(() => import('./components/dev/PaletteBoard')) : null;
const DevShapeBoard = import.meta.env.DEV ? lazy(() => import('./components/dev/ShapeBoard')) : null;
import { subscribeToLockState, isAppLocked, handleAppBackgrounded, handleAppForegrounded } from './utils/security';
import { DEFAULT_DATA } from './db';
import { checkNotificationPermission, requestAndSyncNotifications, syncTimetableNotifications, syncTaskNotifications } from './utils/notifications';
import { scheduleWidgetSync } from './utils/widgetBridge';
import { triggerTopDismissible, handleRootBackPress } from './utils/backNavigation';
import M3StartupGreeting from './components/M3StartupGreeting';

function MainContent({
  data,
  refresh,
  updateData,
  resetAllData,
  onSignOut,
}: {
  data: any;
  refresh: () => Promise<any>;
  updateData: (partial: any) => Promise<any>;
  resetAllData?: () => Promise<void>;
  onSignOut?: () => Promise<void> | void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const location = useLocation();

  // Always reset scroll to top immediately when switching interfaces
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const timer = setTimeout(() => {
      document.documentElement.style.scrollBehavior = '';
    }, 60);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const routeElements = useRoutes([
    { path: '/', element: <RouteErrorBoundary routeName="Home"><Home data={data} refresh={refresh} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/study', element: <RouteErrorBoundary routeName="Study"><Study data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/study/timer', element: <RouteErrorBoundary routeName="Study Timer"><StudyTimer data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/study/history', element: <RouteErrorBoundary routeName="Study History"><StudyHistory data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/study/heatmap', element: <RouteErrorBoundary routeName="Study Analytics"><StudyHeatmap data={data} /></RouteErrorBoundary> },
    { path: '/gym', element: <RouteErrorBoundary routeName="Gym"><Gym data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/gym/onboarding', element: <RouteErrorBoundary routeName="Gym Onboarding"><GymOnboarding data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/gym/workout', element: <RouteErrorBoundary routeName="Workout"><GymWorkout data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/gym/split', element: <RouteErrorBoundary routeName="Gym Split"><GymSplit data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/gym/history/:exerciseName', element: <RouteErrorBoundary routeName="Exercise History"><GymExerciseHistory data={data} /></RouteErrorBoundary> },
    { path: '/nutrition', element: <RouteErrorBoundary routeName="Nutrition"><Nutrition data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/spending', element: <RouteErrorBoundary routeName="Spending"><Spending data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/shopping', element: <RouteErrorBoundary routeName="Shopping Lists"><ShoppingLists data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/shopping/:listId', element: <RouteErrorBoundary routeName="Shopping List Detail"><ShoppingListDetail data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/outings', element: <RouteErrorBoundary routeName="Outing Expenses"><Suspense fallback={<div className="p-8 text-center text-secondary">Loading outings...</div>}><OutingsListPage /></Suspense></RouteErrorBoundary> },
    { path: '/outings/:id', element: <RouteErrorBoundary routeName="Outing Detail"><Suspense fallback={<div className="p-8 text-center text-secondary">Loading outing...</div>}><OutingDetailPage /></Suspense></RouteErrorBoundary> },
    { path: '/outings/:id/add', element: <RouteErrorBoundary routeName="Add Outing Expense"><Suspense fallback={<div className="p-8 text-center text-secondary">Loading outing...</div>}><OutingDetailPage /></Suspense></RouteErrorBoundary> },
    { path: '/outings/:id/expense/:expenseId', element: <RouteErrorBoundary routeName="Edit Outing Expense"><Suspense fallback={<div className="p-8 text-center text-secondary">Loading outing...</div>}><OutingDetailPage /></Suspense></RouteErrorBoundary> },
    { path: '/outings/:id/settle', element: <RouteErrorBoundary routeName="Settle Outing"><Suspense fallback={<div className="p-8 text-center text-secondary">Loading outing...</div>}><OutingDetailPage /></Suspense></RouteErrorBoundary> },
    { path: '/timetable', element: <RouteErrorBoundary routeName="Timetable"><Timetable data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/tasks', element: <RouteErrorBoundary routeName="Tasks"><Tasks data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/laundry', element: <RouteErrorBoundary routeName="Laundry"><Laundry data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/history', element: <RouteErrorBoundary routeName="History"><WorkHistory data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/settings', element: <RouteErrorBoundary routeName="Settings"><SettingsPage data={data} updateData={updateData} refresh={refresh} resetAllData={resetAllData} onSignOut={onSignOut} /></RouteErrorBoundary> },
    { path: '/settings/interface-colors', element: <RouteErrorBoundary routeName="Interface Colors"><Suspense fallback={<div className="p-8 text-center text-secondary">Loading Interface Colors...</div>}><InterfaceColorsSettings data={data} updateData={updateData} /></Suspense></RouteErrorBoundary> },
    { path: '/vault', element: <RouteErrorBoundary routeName="Vault"><Vault data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/notes', element: <RouteErrorBoundary routeName="Notes & Ideas"><Suspense fallback={<div className="p-8 text-center text-secondary">Loading Notes...</div>}><Notes data={data} updateData={updateData} /></Suspense></RouteErrorBoundary> },
    { path: '/notes/:id', element: <RouteErrorBoundary routeName="Notes & Ideas Editor"><Suspense fallback={<div className="p-8 text-center text-secondary">Loading Note...</div>}><Notes data={data} updateData={updateData} /></Suspense></RouteErrorBoundary> },
    ...(import.meta.env.DEV && DevPaletteBoard ? [{
      path: '/dev/palette',
      element: (
        <RouteErrorBoundary routeName="Palette Board">
          <Suspense fallback={<div className="p-8 text-center text-secondary">Loading Palette Board...</div>}>
            <DevPaletteBoard />
          </Suspense>
        </RouteErrorBoundary>
      )
    }] : []),
    ...(import.meta.env.DEV && DevShapeBoard ? [
      {
        path: '/dev/shapes',
        element: (
          <RouteErrorBoundary routeName="Shape Board">
            <Suspense fallback={<div className="p-8 text-center text-secondary">Loading Shape Board...</div>}>
              <DevShapeBoard />
            </Suspense>
          </RouteErrorBoundary>
        )
      },
      {
        path: '/dev-shapes',
        element: (
          <RouteErrorBoundary routeName="Shape Board">
            <Suspense fallback={<div className="p-8 text-center text-secondary">Loading Shape Board...</div>}>
              <DevShapeBoard />
            </Suspense>
          </RouteErrorBoundary>
        )
      }
    ] : []),
    { path: '*', element: <RouteErrorBoundary routeName="Home"><Home data={data} refresh={refresh} updateData={updateData} /></RouteErrorBoundary> },
  ]);

  const motionProps = getPageMotionProps(prefersReducedMotion);

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location.pathname}
        className="w-full gpu-composited"
        style={{ minHeight: '100%' }}
        {...motionProps}
      >
        {routeElements}
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const { transitionMode, setTransitionMode } = useTheme();
  
  // Instantly hydrate cached user from localStorage for zero startup delay
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('lifeos_cached_auth_user');
      return cached ? (JSON.parse(cached) as User) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(() => {
    try {
      return !localStorage.getItem('lifeos_cached_auth_user');
    } catch {
      return true;
    }
  });

  const handleSignOut = useCallback(async () => {
    try {
      localStorage.removeItem('lifeos_cached_auth_user');
      localStorage.removeItem('lifeos_mock_auth');
      (window as any).__LIFEOS_MOCK_AUTH__ = false;
      setUser(null);

      if (Capacitor.isNativePlatform()) {
        try {
          await GoogleAuth.initialize({
            clientId: '527411007566-7gburgck4bkde6pevhn6in759lmr0cg2.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
            grantOfflineAccess: false,
          });
          await Promise.race([
            GoogleAuth.signOut(),
            new Promise((res) => setTimeout(res, 1000)),
          ]);
        } catch (e) {
          console.warn('Native GoogleAuth signout:', e);
        }
      }
      await signOut(auth).catch(() => {});
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const onGlobalSignOut = () => {
      handleSignOut();
    };
    window.addEventListener('lifeos-sign-out', onGlobalSignOut);
    return () => window.removeEventListener('lifeos-sign-out', onGlobalSignOut);
  }, [handleSignOut]);

  useEffect(() => {
    // 5-second timeout safety: never gate render on hanging network auth
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timer);
      if (currentUser) {
        setUser(currentUser);
        setAuthLoading(false);
        try {
          localStorage.setItem('lifeos_cached_auth_user', JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          }));
        } catch {
          // quota exceeded
        }
      } else {
        if (((window as any).__LIFEOS_MOCK_AUTH__ || localStorage.getItem('lifeos_mock_auth') === 'true') && localStorage.getItem('lifeos_cached_auth_user')) {
          setAuthLoading(false);
          return;
        }
        setUser(null);
        setAuthLoading(false);
        try {
          localStorage.removeItem('lifeos_cached_auth_user');
          localStorage.removeItem('lifeos_mock_auth');
        } catch {
          // quota exceeded
        }
      }
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const { data, loading: dataLoading, updateData, refresh, resetAllData } = useData(user);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Hardware Back Button: LIFO overlay dismissal -> sub-route history traversal -> root double-tap exit guard
  useEffect(() => {
    let backListener: any;
    const registerBackButton = async () => {
      try {
        backListener = await CapApp.addListener('backButton', () => {
          // 1. Topmost active overlay (modals, sheets, dialogs)
          if (triggerTopDismissible()) {
            return;
          }

          // 2. If speed dial menu is currently open, close it first without navigating away
          if ((window as any).__lifeos_menu_open) {
            window.dispatchEvent(new CustomEvent('lifeos-close-menu'));
            return;
          }

          // 3. Hierarchical navigation for sub-routes
          const path = location.pathname.toLowerCase();
          if (path !== '/' && path !== '') {
            // Check if nested sub-route (e.g. /gym/workout, /study/timer, /shopping/:id, /outings/:id, etc.)
            const isNestedRoute = (
              (path.startsWith('/gym/') && path !== '/gym') ||
              (path.startsWith('/study/') && path !== '/study') ||
              (path.startsWith('/shopping/') && path !== '/shopping') ||
              (path.startsWith('/outings/') && path !== '/outings') ||
              (path.startsWith('/settings/') && path !== '/settings')
            );

            if (isNestedRoute) {
              navigate(-1);
            } else {
              // Primary sections return to Home ('/')
              navigate('/');
            }
          } else {
            // 4. Root Home Page double-tap exit protection
            handleRootBackPress();
          }
        });
      } catch {
        // Safe fallback on desktop browsers where Capacitor App plugin is idle
      }
    };
    registerBackButton();

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, [location.pathname, navigate]);

  // Deep linking for widget tap targets: lifeos://tasks, lifeos://study, lifeos://progress
  useEffect(() => {
    let urlListener: any;
    const registerUrlListener = async () => {
      try {
        urlListener = await CapApp.addListener('appUrlOpen', (event) => {
          if (event?.url) {
            const raw = event.url.replace(/^lifeos:\/\//i, '').trim();
            const clean = (raw.startsWith('/') ? raw.slice(1) : raw).split('?')[0].toLowerCase();
            if (clean.startsWith('notes')) {
              navigate('/notes');
            } else if (clean.startsWith('gym/workout')) {
              navigate('/gym/workout');
            } else if (clean.startsWith('gym')) {
              navigate('/gym');
            } else if (clean.startsWith('study/timer')) {
              navigate('/study/timer');
            } else if (clean.startsWith('study')) {
              navigate('/study');
            } else if (clean.startsWith('tasks')) {
              navigate('/tasks');
            } else if (clean.startsWith('shopping')) {
              navigate('/shopping');
            } else if (clean === 'home' || clean === '' || clean === 'progress') {
              navigate('/');
            } else {
              navigate('/' + clean);
            }
          }
        });
      } catch {}
    };
    registerUrlListener();

    return () => {
      if (urlListener) {
        urlListener.remove();
      }
    };
  }, [navigate]);

  // Background auto-lock & Cooldown: handle app minimize & resume
  useEffect(() => {
    let stateListener: any;
    const registerStateListener = async () => {
      try {
        stateListener = await CapApp.addListener('appStateChange', (state) => {
          if (!state.isActive) {
            handleAppBackgrounded();
          } else {
            handleAppForegrounded();
            if (data) {
              scheduleWidgetSync(data, 500);
            }
          }
        });
      } catch {}
    };
    registerStateListener();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleAppBackgrounded();
      } else {
        handleAppForegrounded();
        if (data) {
          scheduleWidgetSync(data, 500);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (stateListener) {
        stateListener.remove();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [data]);

  const [isLocked, setIsLocked] = useState(() => isAppLocked());

  useEffect(() => {
    return subscribeToLockState(setIsLocked);
  }, []);

  const safeData = data || DEFAULT_DATA;

  // Startup Greeting Cooldown: Strict 10-minute cooldown to prevent repeating when reopening/refreshing frequently
  const [hasGreeted, setHasGreeted] = useState(() => {
    try {
      const last = localStorage.getItem('lifeos_last_startup_greeting_timestamp');
      if (last) {
        const elapsed = Date.now() - parseInt(last, 10);
        if (elapsed < 10 * 60 * 1000) {
          return true; // Greeted within the last 10 minutes, strictly skip greeting
        }
      }
      return false;
    } catch {
      return false;
    }
  });

  const handleGreetingComplete = () => {
    try {
      localStorage.setItem('lifeos_last_startup_greeting_timestamp', String(Date.now()));
    } catch {}
    setHasGreeted(true);
  };

  const greetingUsername = useMemo(() => {
    if (user?.displayName && user.displayName.trim()) {
      return user.displayName.trim();
    }
    if (user?.email) {
      const handle = user.email.split('@')[0];
      return handle.charAt(0).toUpperCase() + handle.slice(1);
    }
    return 'Friend';
  }, [user?.displayName, user?.email]);

  // Prompt phone OS native notification permission directly on app start if not yet allowed
  useEffect(() => {
    if (user) {
      checkNotificationPermission().then(granted => {
        if (!granted) {
          const t = setTimeout(() => {
            requestAndSyncNotifications(safeData, updateData);
          }, 1000);
          return () => clearTimeout(t);
        } else {
          if (safeData?.timetable) syncTimetableNotifications(safeData.timetable, safeData.settings?.notificationLeadMinutes || 10);
          if (safeData?.tasks) syncTaskNotifications(safeData.tasks, safeData.settings?.notificationLeadMinutes || 10);
        }
      });
    }
  }, [user?.uid]);

  if (location.pathname.toLowerCase().startsWith('/download')) {
    return (
      <DayThemeProvider>
        <DownloadPage />
      </DayThemeProvider>
    );
  }

  if (authLoading && !user) {
    return (
      <DayThemeProvider>
        <div className="min-h-screen flex items-center justify-center bg-transparent">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </DayThemeProvider>
    );
  }

  if (!user) {
    return (
      <DayThemeProvider>
        <NetworkStatusModal />
        <Auth />
      </DayThemeProvider>
    );
  }

  return (
    <DayThemeProvider>
      <M3FeedbackProvider>
        {!hasGreeted && user && (
          <M3StartupGreeting
            username={greetingUsername}
            photoURL={user.photoURL}
            isAppReady={!dataLoading && Boolean(data)}
            onComplete={handleGreetingComplete}
          />
        )}
        <NetworkStatusModal />
        <CloudMigrationModal user={user} data={safeData} updateData={updateData} />
        <AppLockOverlay />
        <InAppUpdateModal />
        <div
          className="w-full min-h-screen transition-[filter,opacity] duration-200 ease-out"
          style={{
            filter: isLocked ? 'blur(36px) saturate(40%)' : undefined,
            opacity: isLocked ? 0.2 : 1,
            pointerEvents: isLocked ? 'none' : 'auto',
          }}
        >
          <Layout refresh={refresh} data={safeData} updateData={updateData}>
            <ErrorBoundary>
              <OutingsProvider>
                <MainContent
                  data={safeData}
                  refresh={refresh}
                  updateData={updateData}
                  resetAllData={resetAllData}
                  onSignOut={handleSignOut}
                />
              </OutingsProvider>
            </ErrorBoundary>
          </Layout>
        </div>
      </M3FeedbackProvider>
    </DayThemeProvider>
  );
}

export default App;
