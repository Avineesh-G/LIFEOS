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
import Timetable from './pages/Timetable';
import Tasks from './pages/Tasks';
import Laundry from './pages/Laundry';
import Progress from './pages/Progress';
import WorkHistory from './pages/WorkHistory';
import SettingsPage from './pages/Settings';
import Vault from './pages/Vault';
import DownloadPage from './pages/DownloadPage';
import Auth from './pages/Auth';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { TransitionMode } from './types';
import AppLockOverlay from './components/security/AppLockOverlay';
import InAppUpdateModal from './components/InAppUpdateModal';
import PixelSkyCanvas from './components/PixelSkyCanvas';
import { DayThemeProvider } from './theme/DayThemeProvider';
import { subscribeToLockState, isAppLocked, handleAppBackgrounded, handleAppForegrounded } from './utils/security';
import { DEFAULT_DATA } from './db';
import { checkNotificationPermission, requestAndSyncNotifications, syncTimetableNotifications, syncTaskNotifications } from './utils/notifications';
import { syncWidgetData } from './utils/widgetBridge';

function MainContent({
  data,
  refresh,
  updateData,
  transitionMode,
  setTransitionMode,
}: {
  data: any;
  refresh: () => Promise<any>;
  updateData: (partial: any) => Promise<any>;
  transitionMode: TransitionMode;
  setTransitionMode: (m: TransitionMode) => void;
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
    { path: '/', element: <Home data={data} refresh={refresh} updateData={updateData} /> },
    { path: '/study', element: <Study data={data} updateData={updateData} /> },
    { path: '/study/timer', element: <StudyTimer data={data} updateData={updateData} /> },
    { path: '/study/history', element: <StudyHistory data={data} updateData={updateData} /> },
    { path: '/study/heatmap', element: <StudyHeatmap data={data} /> },
    { path: '/gym', element: <Gym data={data} updateData={updateData} /> },
    { path: '/gym/onboarding', element: <GymOnboarding data={data} updateData={updateData} /> },
    { path: '/gym/workout', element: <GymWorkout data={data} updateData={updateData} /> },
    { path: '/gym/split', element: <GymSplit data={data} updateData={updateData} /> },
    { path: '/gym/history/:exerciseName', element: <GymExerciseHistory data={data} /> },
    { path: '/nutrition', element: <Nutrition data={data} updateData={updateData} /> },
    { path: '/spending', element: <Spending data={data} updateData={updateData} /> },
    { path: '/timetable', element: <Timetable data={data} updateData={updateData} /> },
    { path: '/tasks', element: <Tasks data={data} updateData={updateData} /> },
    { path: '/laundry', element: <Laundry data={data} updateData={updateData} /> },
    { path: '/progress', element: <Progress data={data} /> },
    { path: '/history', element: <WorkHistory data={data} updateData={updateData} /> },
    { path: '/settings', element: <SettingsPage transitionMode={transitionMode} setTransitionMode={setTransitionMode} data={data} updateData={updateData} refresh={refresh} /> },
    { path: '/vault', element: <Vault data={data} updateData={updateData} /> },
    { path: '*', element: <Home data={data} refresh={refresh} updateData={updateData} /> },
  ]);

  const motionProps = getPageMotionProps(prefersReducedMotion);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="w-full overflow-x-hidden gpu-composited"
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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
    return () => unsubscribe();
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
            } else if (clean === 'progress') {
              navigate('/progress');
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

  // Sync widget snapshot whenever data changes
  useEffect(() => {
    if (data) {
      syncWidgetData(data);
    }
  }, [data]);

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
              syncWidgetData(data);
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
          syncWidgetData(data);
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
        <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
          <PixelSkyCanvas />
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </DayThemeProvider>
    );
  }

  if (!user) {
    return (
      <DayThemeProvider>
        <PixelSkyCanvas />
        <Auth />
      </DayThemeProvider>
    );
  }

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

  return (
    <DayThemeProvider>
      <PixelSkyCanvas />
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
            <MainContent
              data={safeData}
              refresh={refresh}
              updateData={updateData}
              transitionMode={transitionMode}
              setTransitionMode={setTransitionMode}
            />
          </ErrorBoundary>
        </Layout>
      </div>
    </DayThemeProvider>
  );
}

export default App;
