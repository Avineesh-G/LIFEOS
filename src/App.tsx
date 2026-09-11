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

const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      {...pageTransition}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

function App() {
  const { theme, setTheme, accentColor, setAccentColor, mounted } = useTheme();
  
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
    <Layout theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor} refresh={refresh}>
      <ErrorBoundary>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><Home data={data!} refresh={refresh} updateData={updateData} /></AnimatedPage>} />
            <Route path="/study" element={<AnimatedPage><Study data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/study/timer" element={<AnimatedPage><StudyTimer data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/study/history" element={<AnimatedPage><StudyHistory data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/study/heatmap" element={<AnimatedPage><StudyHeatmap data={data!} /></AnimatedPage>} />
            <Route path="/gym" element={<AnimatedPage><Gym data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/gym/onboarding" element={<AnimatedPage><GymOnboarding data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/gym/workout" element={<AnimatedPage><GymWorkout data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/gym/split" element={<AnimatedPage><GymSplit data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/gym/history/:exerciseName" element={<AnimatedPage><GymExerciseHistory data={data!} /></AnimatedPage>} />
            <Route path="/nutrition" element={<AnimatedPage><Nutrition data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/spending" element={<AnimatedPage><Spending data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/timetable" element={<AnimatedPage><Timetable data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/tasks" element={<AnimatedPage><Tasks data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/progress" element={<AnimatedPage><Progress data={data!} /></AnimatedPage>} />
            <Route path="/history" element={<AnimatedPage><WorkHistory data={data!} updateData={updateData} /></AnimatedPage>} />
            <Route path="/settings" element={<AnimatedPage><SettingsPage theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor} data={data!} updateData={updateData} refresh={refresh} /></AnimatedPage>} />
          </Routes>
        </AnimatePresence>
      </ErrorBoundary>
    </Layout>
  );
}

export default App;
