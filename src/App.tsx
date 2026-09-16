import { useRoutes, useLocation, useNavigate } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import { AnimatePresence, motion } from 'framer-motion';
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
import Progress from './pages/Progress';
import WorkHistory from './pages/WorkHistory';
import { Settings } from 'lucide-react'; // Fallback import just in case
import SettingsPage from './pages/Settings';
import Vault from './pages/Vault';
import DownloadPage from './pages/DownloadPage';
import Auth from './pages/Auth';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { TransitionMode, FluidIntensity } from './types';
import AppLockOverlay from './components/security/AppLockOverlay';
import { setAppLocked, subscribeToLockState, isAppLocked, handleAppBackgrounded, handleAppForegrounded } from './utils/security';
import { DEFAULT_DATA } from './db';

const getTransitionConfig = (mode: TransitionMode) => {
  switch (mode) {
    case 'fast':
      return {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.98 },
        transition: { duration: 0.12, ease: 'easeOut' }
      };
    case 'soft':
      return {
        initial: { opacity: 0, y: 24, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -16, scale: 0.97 },
        transition: { duration: 0.30, ease: [0.16, 1, 0.3, 1] }
      };
    case 'efficient':
    default:
      return {
        initial: { opacity: 0, x: 28 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -28 },
        transition: { duration: 0.22, ease: [0.25, 1, 0.5, 1] }
      };
  }
};

function MainContent({
  data,
  refresh,
  updateData,
  theme,
  setTheme,
  accentColor,
  setAccentColor,
  transitionMode,
  setTransitionMode,
  fluidIntensity,
  setFluidIntensity,
}: {
  data: any;
  refresh: () => Promise<any>;
  updateData: (partial: any) => Promise<any>;
  theme: any;
  setTheme: (t: any) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  transitionMode: TransitionMode;
  setTransitionMode: (m: TransitionMode) => void;
  fluidIntensity: FluidIntensity;
  setFluidIntensity: (i: FluidIntensity) => void;
}) {
  const location = useLocation();
  const transitionConfig = getTransitionConfig(transitionMode);

  const routeElements = useRoutes(
    [
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
      { path: '/progress', element: <Progress data={data} /> },
      { path: '/history', element: <WorkHistory data={data} updateData={updateData} /> },
      { path: '/settings', element: <SettingsPage theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor} transitionMode={transitionMode} setTransitionMode={setTransitionMode} fluidIntensity={fluidIntensity} setFluidIntensity={setFluidIntensity} data={data} updateData={updateData} refresh={refresh} /> },
      { path: '/vault', element: <Vault data={data} updateData={updateData} /> },
      { path: '*', element: <Home data={data} refresh={refresh} updateData={updateData} /> },
    ],
    location
  );

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={transitionConfig.initial}
        animate={transitionConfig.animate}
        exit={transitionConfig.exit}
        transition={transitionConfig.transition}
        className="w-full overflow-x-hidden gpu-composited"
      >
        {routeElements}
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const { theme, setTheme, accentColor, setAccentColor, transitionMode, setTransitionMode, fluidIntensity, setFluidIntensity, mounted } = useTheme();
  
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
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (stateListener) {
        stateListener.remove();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const [isLocked, setIsLocked] = useState(() => isAppLocked());

  useEffect(() => {
    return subscribeToLockState(setIsLocked);
  }, []);

  if (location.pathname.toLowerCase().startsWith('/download')) {
    return <DownloadPage theme={theme} setTheme={setTheme} accentColor={accentColor} />;
  }

  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const safeData = data || DEFAULT_DATA;

  return (
    <>
      <AppLockOverlay />
      <div
        className="w-full min-h-screen transition-[filter,opacity] duration-200 ease-out"
        style={{
          filter: isLocked ? 'blur(36px) saturate(40%)' : undefined,
          opacity: isLocked ? 0.2 : 1,
          pointerEvents: isLocked ? 'none' : 'auto',
        }}
      >
        <Layout theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor} refresh={refresh}>
          <ErrorBoundary>
            <MainContent
              data={safeData}
              refresh={refresh}
              updateData={updateData}
              theme={theme}
              setTheme={setTheme}
              accentColor={accentColor}
              setAccentColor={setAccentColor}
              transitionMode={transitionMode}
              setTransitionMode={setTransitionMode}
              fluidIntensity={fluidIntensity}
              setFluidIntensity={setFluidIntensity}
            />
          </ErrorBoundary>
        </Layout>
      </div>
    </>
  );
}

export default App;
