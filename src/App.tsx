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
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { OutingsProvider } from './features/outings/context/OutingsContext';

const OutingsListPage = lazy(() => import('./features/outings/pages/OutingsListPage'));
const OutingDetailPage = lazy(() => import('./features/outings/pages/OutingDetailPage'));
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ErrorBoundary, RouteErrorBoundary } from './components/ErrorBoundary';
import AppLockOverlay from './components/security/AppLockOverlay';
import InAppUpdateModal from './components/InAppUpdateModal';
import { DayThemeProvider } from './theme/DayThemeProvider';
const DevPaletteBoard = import.meta.env.DEV ? lazy(() => import('./components/dev/PaletteBoard')) : null;
const DevShapeBoard = import.meta.env.DEV ? lazy(() => import('./components/dev/ShapeBoard')) : null;
import { subscribeToLockState, isAppLocked, handleAppBackgrounded, handleAppForegrounded } from './utils/security';
import { DEFAULT_DATA } from './db';
import { checkNotificationPermission, requestAndSyncNotifications, syncTimetableNotifications, syncTaskNotifications } from './utils/notifications';
import { scheduleWidgetSync } from './utils/widgetBridge';

function MainContent({
  data,
  refresh,
  updateData,
}: {
  data: any;
  refresh: () => Promise<any>;
  updateData: (partial: any) => Promise<any>;
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
    { path: '/settings', element: <RouteErrorBoundary routeName="Settings"><SettingsPage data={data} updateData={updateData} refresh={refresh} /></RouteErrorBoundary> },
    { path: '/vault', element: <RouteErrorBoundary routeName="Vault"><Vault data={data} updateData={updateData} /></RouteErrorBoundary> },
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
    <AnimatePresence mode="wait" initial={false}>
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

  useEffect(() => {
    // 5-second timeout safety: never gate render on hanging network auth
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timer);
      if (!currentUser && ((window as any).__LIFEOS_MOCK_AUTH__ || localStorage.getItem('lifeos_mock_auth') === 'true')) {
        setAuthLoading(false);
        return;
      }
      setUser(currentUser);
      setAuthLoading(false);
      try {
        if (currentUser) {
          localStorage.setItem('lifeos_cached_auth_user', JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          }));
        } else {
          localStorage.removeItem('lifeos_cached_auth_user');
        }
      } catch {
        // quota exceeded
      }
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const { data, loading: dataLoading, updateData, refresh } = useData(user);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Hardware Back Button: returns to Home ('/') from any screen, or exits if already on Home
  useEffect(() => {
    let backListener: any;
    const registerBackButton = async () => {
      try {
        backListener = await CapApp.addListener('backButton', () => {
          // If speed dial menu is currently open, close it first without navigating away
          if ((window as any).__lifeos_menu_open) {
            window.dispatchEvent(new CustomEvent('lifeos-close-menu'));
            return;
          }
          if (location.pathname !== '/' && location.pathname !== '') {
            navigate('/');
          } else {
            CapApp.exitApp();
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
            const raw = event.url.replace(/^lifeos:\/\//i, '').toLowerCase().trim();
            const clean = raw.startsWith('/') ? raw.slice(1) : raw;
            if (clean === 'tasks') {
              navigate('/tasks');
            } else if (clean === 'study') {
              navigate('/study');
            } else if (clean === 'home' || clean === '') {
              navigate('/');
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
        <Auth />
      </DayThemeProvider>
    );
  }

  return (
    <DayThemeProvider>
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
              />
            </OutingsProvider>
          </ErrorBoundary>
        </Layout>
      </div>
    </DayThemeProvider>
  );
}

export default App;
