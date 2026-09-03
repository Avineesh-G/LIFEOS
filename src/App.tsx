import { Routes, Route, useLocation } from 'react-router-dom';
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
import { Settings } from 'lucide-react'; // Fallback import just in case
import SettingsPage from './pages/Settings';
import Auth from './pages/Auth';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: 'easeOut' }
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div {...pageTransition} className="w-full">
      {children}
    </motion.div>
  );
}

function App() {
  const { theme, setTheme, accentColor, setAccentColor, mounted } = useTheme();
  
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { data, loading: dataLoading, updateData, refresh } = useData(user);
  const location = useLocation();

  if (!mounted || authLoading || (user && dataLoading)) {
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
    <Layout theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<AnimatedPage><Home data={data!} /></AnimatedPage>} />
          <Route path="/study" element={<AnimatedPage><Study data={data!} updateData={updateData} /></AnimatedPage>} />
          <Route path="/study/timer" element={<AnimatedPage><StudyTimer data={data!} updateData={updateData} /></AnimatedPage>} />
          <Route path="/study/history" element={<AnimatedPage><StudyHistory data={data!} /></AnimatedPage>} />
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
          <Route path="/settings" element={<AnimatedPage><SettingsPage theme={theme} setTheme={setTheme} accentColor={accentColor} setAccentColor={setAccentColor} data={data!} updateData={updateData} refresh={refresh} /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
