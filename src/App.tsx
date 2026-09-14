import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import Auth from './pages/Auth';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { TransitionMode } from './types';
import AppLockOverlay from './components/security/AppLockOverlay';
import { setAppLocked, subscribeToLockState, isAppLocked } from './utils/security';

const getTransitionConfig = (mode: TransitionMode) => {
  switch (mode) {
    case 'fast':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.08, ease: 'easeOut' }
      };
    case 'soft':
      return {
        initial: { opacity: 0, y: 8, scale: 0.992 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -4, scale: 0.996 },
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] }
      };
    case 'efficient':
    default:
      return {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -2 },
        transition: { duration: 0.16, ease: [0.25, 1, 0.5, 1] }
      };
  }
};

function AnimatedPage({ children, mode = 'efficient' }: { children: React.ReactNode; mode?: TransitionMode }) {
  const config = getTransitionConfig(mode);
  return (
    <motion.div
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={config.transition}
      className="w-full gpu-composited contain-paint"
    >
      {children}
    </motion.div>
  );
}

function App() {
  const { theme, setTheme, accentColor, setAccentColor, transitionMode, setTransitionMode, mounted } = useTheme();
  
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

  // Background auto-lock: lock app whenever sent to background or phone locked
  useEffect(() => {
    let stateListener: any;
    const registerStateListener = async () => {
      try {
        stateListener = await CapApp.addListener('appStateChange', (state) => {
          if (!state.isActive) {
            setAppLocked(true);
          }
        });
      } catch {}
    };
    registerStateListener();
    return () => {
      if (stateListener) {
        stateListener.remove();
      }
    };
  }, []);

  const [isLocked, setIsLocked] = useState(() => isAppLocked());

  useEffect(() => {
    return subscribeToLockState(setIsLocked);
  }, []);

  if (!mounted || (authLoading && !user) || (user && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <AppLockOverlay />
      <div
        className="w-full min-h-screen transition-all duration-300 ease-out"
        style={{
          filter: isLocked ? 'blur(36px) saturate(40%)' : 'none',
          opacity: isLocked ? 0.2 : 1,
          pointerEvents: isLocked ? 'none' : 'auto',
        }}
      >
        <Layout theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor} refresh={refresh}>
          <ErrorBoundary>
            <AnimatePresence mode={transitionMode === 'soft' ? 'wait' : 'popLayout'} initial={false}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<AnimatedPage mode={transitionMode}><Home data={data!} refresh={refresh} updateData={updateData} /></AnimatedPage>} />
                <Route path="/study" element={<AnimatedPage mode={transitionMode}><Study data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/study/timer" element={<AnimatedPage mode={transitionMode}><StudyTimer data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/study/history" element={<AnimatedPage mode={transitionMode}><StudyHistory data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/study/heatmap" element={<AnimatedPage mode={transitionMode}><StudyHeatmap data={data!} /></AnimatedPage>} />
                <Route path="/gym" element={<AnimatedPage mode={transitionMode}><Gym data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/gym/onboarding" element={<AnimatedPage mode={transitionMode}><GymOnboarding data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/gym/workout" element={<AnimatedPage mode={transitionMode}><GymWorkout data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/gym/split" element={<AnimatedPage mode={transitionMode}><GymSplit data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/gym/history/:exerciseName" element={<AnimatedPage mode={transitionMode}><GymExerciseHistory data={data!} /></AnimatedPage>} />
                <Route path="/nutrition" element={<AnimatedPage mode={transitionMode}><Nutrition data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/spending" element={<AnimatedPage mode={transitionMode}><Spending data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/timetable" element={<AnimatedPage mode={transitionMode}><Timetable data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/tasks" element={<AnimatedPage mode={transitionMode}><Tasks data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/progress" element={<AnimatedPage mode={transitionMode}><Progress data={data!} /></AnimatedPage>} />
                <Route path="/history" element={<AnimatedPage mode={transitionMode}><WorkHistory data={data!} updateData={updateData} /></AnimatedPage>} />
                <Route path="/settings" element={<AnimatedPage mode={transitionMode}><SettingsPage theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor} transitionMode={transitionMode} setTransitionMode={setTransitionMode} data={data!} updateData={updateData} refresh={refresh} /></AnimatedPage>} />
              </Routes>
            </AnimatePresence>
          </ErrorBoundary>
        </Layout>
      </div>
    </>
  );
}

export default App;
