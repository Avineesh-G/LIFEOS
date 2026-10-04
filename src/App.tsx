import React, { useEffect, useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { useRoutes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducedMotion, getPageMotionProps } from './utils/motionConfig';
import { App as CapApp } from '@capacitor/app';
import { useTheme } from './hooks/useTheme';
import { useData } from './hooks/useData';
import Layout from './components/Layout';
import Home from './pages/Home';
import PageLoadingFallback from './components/common/PageLoadingFallback';

// Dynamic lazy imports for instant cold start & efficient chunking
const Study = lazy(() => import('./pages/Study'));
const StudyTimer = lazy(() => import('./pages/StudyTimer'));
const StudyHistory = lazy(() => import('./pages/StudyHistory'));
const StudyHeatmap = lazy(() => import('./pages/StudyHeatmap'));
const Gym = lazy(() => import('./pages/Gym'));
const GymWorkout = lazy(() => import('./pages/GymWorkout'));
const GymSplit = lazy(() => import('./pages/GymSplit'));
const GymExerciseHistory = lazy(() => import('./pages/GymExerciseHistory'));
const GymOnboarding = lazy(() => import('./pages/GymOnboarding'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const Spending = lazy(() => import('./pages/Spending'));
const ShoppingLists = lazy(() => import('./pages/ShoppingLists'));
const ShoppingListDetail = lazy(() => import('./pages/ShoppingListDetail'));
const Timetable = lazy(() => import('./pages/Timetable'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Laundry = lazy(() => import('./pages/Laundry'));
const WorkHistory = lazy(() => import('./pages/WorkHistory'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const Vault = lazy(() => import('./pages/Vault'));
const DownloadPage = lazy(() => import('./pages/DownloadPage'));
const Auth = lazy(() => import('./pages/Auth'));
const DevShapes = lazy(() => import('./pages/DevShapes'));
const MorningBriefing = lazy(() => import('./pages/MorningBriefing'));
const BrainDump = lazy(() => import('./pages/BrainDump'));
const FlowRoom = lazy(() => import('./pages/FlowRoom'));
const ActiveRecall = lazy(() => import('./pages/ActiveRecall'));
const VoiceTranscribe = lazy(() => import('./pages/VoiceTranscribe'));
const OutingsListPage = lazy(() => import('./features/outings/pages/OutingsListPage'));
const OutingDetailPage = lazy(() => import('./features/outings/pages/OutingDetailPage'));
const ThemeSettings = lazy(() => import('./pages/ThemeSettings'));
const Notes = lazy(() => import('./pages/Notes'));
const KitPreview = lazy(() => import('./ui/kit/KitPreview'));

import { OutingsProvider } from './features/outings/context/OutingsContext';
import { detectSquircleSupport } from './utils/squircleDetect';
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
import { ThemeProvider } from './theme/ThemeContext';
import { M3FeedbackProvider } from './components/m3/M3FeedbackContext';
const DevPaletteBoard = import.meta.env.DEV ? lazy(() => import('./components/dev/PaletteBoard')) : null;
const DevShapeBoard = import.meta.env.DEV ? lazy(() => import('./components/dev/ShapeBoard')) : null;
import { subscribeToLockState, isAppLocked, handleAppBackgrounded, handleAppForegrounded } from './utils/security';
import { DEFAULT_DATA } from './db';
import { checkNotificationPermission, requestAndSyncNotifications, syncTimetableNotifications, syncTaskNotifications } from './utils/notifications';
import { scheduleWidgetSync } from './utils/widgetBridge';
import { triggerTopDismissible, handleRootBackPress, recordNavigation, handleAppBack } from './utils/backNavigation';

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
    { path: '/settings/appearance', element: <RouteErrorBoundary routeName="Appearance & Theme"><Suspense fallback={<div className="p-8 text-center text-on-surface-variant">Loading Theme Settings...</div>}><ThemeSettings /></Suspense></RouteErrorBoundary> },
    { path: '/settings/interface-colors', element: <RouteErrorBoundary routeName="Appearance & Theme"><Suspense fallback={<div className="p-8 text-center text-on-surface-variant">Loading Theme Settings...</div>}><ThemeSettings /></Suspense></RouteErrorBoundary> },
    { path: '/vault', element: <RouteErrorBoundary routeName="Vault"><Vault data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/notes', element: <RouteErrorBoundary routeName="Notes & Ideas"><Suspense fallback={<div className="p-8 text-center text-secondary">Loading Notes...</div>}><Notes data={data} updateData={updateData} /></Suspense></RouteErrorBoundary> },
    { path: '/notes/:id', element: <RouteErrorBoundary routeName="Notes & Ideas Editor"><Suspense fallback={<div className="p-8 text-center text-secondary">Loading Note...</div>}><Notes data={data} updateData={updateData} /></Suspense></RouteErrorBoundary> },
    { path: '/morning', element: <RouteErrorBoundary routeName="Morning Battle Plan"><MorningBriefing data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/brain-dump', element: <RouteErrorBoundary routeName="Brain Dump HUD"><BrainDump data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/flow', element: <RouteErrorBoundary routeName="Flow Room"><FlowRoom data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/recall', element: <RouteErrorBoundary routeName="Active Recall"><ActiveRecall data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/transcribe', element: <RouteErrorBoundary routeName="Voice Transcriber"><VoiceTranscribe data={data} updateData={updateData} /></RouteErrorBoundary> },
    { path: '/kit', element: <RouteErrorBoundary routeName="UI Kit Preview"><Suspense fallback={<PageLoadingFallback />}><KitPreview /></Suspense></RouteErrorBoundary> },
    { path: '/dev/shapes', element: <RouteErrorBoundary routeName="Squircle Shapes Board"><DevShapes /></RouteErrorBoundary> },
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
        <Suspense fallback={<PageLoadingFallback />}>
          {routeElements}
        </Suspense>
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
    recordNavigation(location.pathname);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Hardware / System Back Button: LIFO overlays -> Speed dial -> Sequential Path Memory -> Root Double-Tap Exit
  useEffect(() => {
    let backListener: any;
    const registerBackButton = async () => {
      try {
        backListener = await CapApp.addListener('backButton', () => {
          handleAppBack(navigate);
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
  }, [navigate]);

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
      <ThemeProvider>
        <DayThemeProvider>
          <Suspense fallback={<PageLoadingFallback />}>
            <DownloadPage />
          </Suspense>
        </DayThemeProvider>
      </ThemeProvider>
    );
  }

  if (authLoading && !user) {
    return (
      <ThemeProvider>
        <DayThemeProvider>
          <PageLoadingFallback />
        </DayThemeProvider>
      </ThemeProvider>
    );
  }

  if (!user) {
    return (
      <ThemeProvider>
        <DayThemeProvider>
          <NetworkStatusModal />
          <Suspense fallback={<PageLoadingFallback />}>
            <Auth />
          </Suspense>
        </DayThemeProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <DayThemeProvider>
        <M3FeedbackProvider>
          <NetworkStatusModal />
          <CloudMigrationModal user={user} data={safeData} updateData={updateData} />
          <AppLockOverlay />
          <InAppUpdateModal />
          <div
            className="w-full min-h-screen bg-black transition-[filter,opacity] duration-200 ease-out"
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
    </ThemeProvider>
  );
}

export default App;
