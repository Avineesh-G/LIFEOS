import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Dumbbell, 
  BookOpen, 
  Utensils, 
  Clock, 
  Wallet, 
  Lock, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Moon, 
  Sun, 
  HelpCircle, 
  Layers, 
  Flame, 
  Calendar, 
  Check, 
  ExternalLink,
  Heart,
  QrCode,
  Share2,
  Play,
  Pause,
  RotateCcw,
  Wifi,
  Battery,
  ChevronDown,
  X,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DownloadPageProps {
  theme?: string;
  setTheme?: (t: any) => void;
  accentColor?: string;
}

type TabType = 'dashboard' | 'study' | 'gym' | 'timetable' | 'nutrition' | 'security';

export default function DownloadPage({ theme = 'dark', setTheme, accentColor = '#6366F1' }: DownloadPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isDarkLocal, setIsDarkLocal] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  // Interactive Study Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60 - 12); // 24:48
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Interactive Gym Sets Completion State
  const [gymSets, setGymSets] = useState([
    { id: 1, prev: '80 kg × 10', weight: '85 kg', reps: '10', completed: true },
    { id: 2, prev: '85 kg × 8', weight: '90 kg', reps: '8', completed: true },
    { id: 3, prev: '90 kg × 6', weight: '95 kg', reps: '6', completed: false },
  ]);

  const toggleSet = (id: number) => {
    setGymSets(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  // Interactive Subscription / Fatigue Calculator State
  const [selectedApps, setSelectedApps] = useState<Record<string, { cost: number; name: string; checked: boolean }>>({
    gym: { name: 'Premium Gym & Workout Tracker', cost: 12, checked: true },
    study: { name: 'Pomodoro Study & Heatmap App', cost: 6, checked: true },
    budget: { name: 'Finance & Expense Tracker', cost: 8, checked: true },
    timetable: { name: 'Class Schedule & Routine App', cost: 4, checked: true },
  });

  const toggleAppSelection = (key: string) => {
    setSelectedApps(prev => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked }
    }));
  };

  const monthlySavings = Object.values(selectedApps).reduce((acc, a) => a.checked ? acc + a.cost : acc, 0);
  const yearlySavings = monthlySavings * 12;
  const activeAppsCount = Object.values(selectedApps).filter(a => a.checked).length;

  // Real-time Mockup Phone Clock
  const [phoneTime, setPhoneTime] = useState('09:41');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setPhoneTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // UI Modals & Toast State
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleTheme = () => {
    const nextDark = !isDarkLocal;
    setIsDarkLocal(nextDark);
    if (setTheme) {
      setTheme(nextDark ? 'dark' : 'light');
    } else if (typeof document !== 'undefined') {
      if (nextDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const copyShareLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  const screenshots: Record<TabType, {
    title: string;
    tagline: string;
    description: string;
    badge: string;
    icon: any;
    renderMockup: () => React.ReactNode;
  }> = {
    dashboard: {
      title: "Command Center",
      tagline: "Your Entire Day at a Single Glance",
      description: "Get morning clarity with your daily streak, today's schedule, active study stats, nutrition totals, and curated stoic quotes to start with focus.",
      badge: "Overview",
      icon: Layers,
      renderMockup: () => (
        <div className="space-y-3 text-left text-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-border-light/40 dark:border-border-dark/40">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-light dark:text-muted-dark">MONDAY • SEP 14</p>
              <h4 className="text-sm font-black text-primary-light dark:text-primary-dark">Welcome back, Scholar</h4>
            </div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 font-bold text-[11px] border border-orange-500/20"
            >
              <Flame size={12} className="fill-orange-500 animate-pulse" />
              <span>18 Day Streak</span>
            </motion.div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <motion.div whileHover={{ y: -2 }} className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark/90 border border-border-light dark:border-border-dark/80 shadow-sm">
              <div className="flex items-center justify-between text-muted-light dark:text-muted-dark mb-1">
                <span className="text-[10px] font-semibold">Deep Study</span>
                <Clock size={12} className="text-accent" />
              </div>
              <div className="text-base font-black text-primary-light dark:text-primary-dark">3h 45m</div>
              <div className="text-[10px] text-emerald-500 font-medium mt-0.5">85% of daily goal</div>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark/90 border border-border-light dark:border-border-dark/80 shadow-sm">
              <div className="flex items-center justify-between text-muted-light dark:text-muted-dark mb-1">
                <span className="text-[10px] font-semibold">Gym Split</span>
                <Dumbbell size={12} className="text-rose-500" />
              </div>
              <div className="text-base font-black text-primary-light dark:text-primary-dark">Push Day</div>
              <div className="text-[10px] text-rose-500 font-medium mt-0.5">Chest & Triceps</div>
            </motion.div>
          </div>

          {/* Next Lecture Alert */}
          <motion.div whileHover={{ scale: 1.01 }} className="p-3 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-accent text-white">UPCOMING CLASS</span>
              <p className="font-bold text-primary-light dark:text-primary-dark text-xs pt-1">Advanced Algorithm Design</p>
              <p className="text-[10px] text-secondary-light dark:text-secondary-dark">Room 304 • Prof. Anderson (11:00 AM)</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-accent">In 24m</span>
            </div>
          </motion.div>

          {/* Daily Quote Card */}
          <div className="p-3 rounded-2xl bg-surface-light/60 dark:bg-surface-dark/50 border border-border-light/60 dark:border-border-dark/60 italic text-[10px] text-secondary-light dark:text-secondary-dark leading-relaxed">
            "You have power over your mind - not outside events. Realize this, and you will find strength."
            <span className="block font-semibold not-italic text-right text-primary-light/70 dark:text-primary-dark/70 mt-1">— Marcus Aurelius</span>
          </div>
        </div>
      )
    },
    study: {
      title: "Focus & Academics",
      tagline: "Live Pomodoro, Revision Tracking & Heatmaps",
      description: "Lock in with interactive countdown study timers. Tap 'Start / Pause' below to try it live! Consistency compiles into GitHub-style annual heatmaps.",
      badge: "Deep Work",
      icon: BookOpen,
      renderMockup: () => (
        <div className="space-y-3 text-left text-xs">
          {/* Active Timer Display - INTERACTIVE */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/15 via-surface-light dark:via-surface-dark to-surface-light dark:to-surface-dark border border-accent/30 text-center space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-emerald-500 animate-ping' : 'bg-accent'}`} />
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                {isTimerRunning ? 'TIMER RUNNING' : 'INTERACTIVE FOCUS TIMER'}
              </span>
            </div>
            
            <div className="text-3xl font-black tracking-tight text-primary-light dark:text-primary-dark font-mono">
              {formatTimer(timerSeconds)}
            </div>

            <p className="text-[10px] text-secondary-light dark:text-secondary-dark font-medium">
              Subject: <span className="font-bold text-primary-light dark:text-primary-dark">Operating Systems (Memory Mgt)</span>
            </p>

            {/* Interactive Control Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-accent text-white font-bold text-[11px] hover:opacity-90 shadow-sm transition-transform active:scale-95"
              >
                {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
                <span>{isTimerRunning ? 'Pause' : 'Start Focus'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setIsTimerRunning(false); setTimerSeconds(25 * 60); }}
                className="p-1 rounded-xl border border-border-light dark:border-border-dark text-muted-light hover:text-primary-light transition-colors"
                title="Reset timer"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            <div className="w-full bg-border-light dark:bg-border-dark h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-300" 
                style={{ width: `${((25 * 60 - timerSeconds) / (25 * 60)) * 100}%` }} 
              />
            </div>
          </div>

          {/* Activity Heatmap Mock */}
          <div className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary-light dark:text-primary-dark">Study Consistency Heatmap</span>
              <span className="text-[10px] text-emerald-500 font-bold">142 Total Hours</span>
            </div>
            <div className="grid grid-cols-12 gap-1 pt-1">
              {[
                3, 2, 4, 1, 0, 4, 3, 2, 4, 3, 4, 2,
                1, 4, 3, 2, 4, 4, 3, 1, 0, 4, 3, 4,
                4, 3, 2, 4, 3, 4, 1, 3, 4, 4, 2, 4,
                2, 4, 4, 3, 2, 4, 4, 3, 4, 2, 3, 4
              ].map((val, idx) => {
                const colors = [
                  'bg-border-light/40 dark:bg-border-dark/40',
                  'bg-emerald-300 dark:bg-emerald-950',
                  'bg-emerald-400 dark:bg-emerald-800',
                  'bg-emerald-500 dark:bg-emerald-600',
                  'bg-emerald-600 dark:bg-emerald-400',
                ];
                return (
                  <div 
                    key={idx} 
                    className={`h-2.5 rounded-sm ${colors[val]} transition-transform hover:scale-125`} 
                  />
                );
              })}
            </div>
          </div>
        </div>
      )
    },
    gym: {
      title: "Gym & Hypertrophy",
      tagline: "Track Splits, Sets, Reps & 1RM Records",
      description: "Full workout companion. Tap any set checkmark below to mark it completed! Includes 1RM estimation, rest timer, and progressive overload graphs.",
      badge: "Discipline",
      icon: Dumbbell,
      renderMockup: () => (
        <div className="space-y-3 text-left text-xs">
          {/* Active Workout Card */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-rose-500 text-white">
                <Dumbbell size={14} />
              </div>
              <div>
                <p className="font-extrabold text-primary-light dark:text-primary-dark">Push Day A</p>
                <p className="text-[10px] text-rose-500 font-medium">Exercise 2 of 5 • Chest & Shoulders</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500">
              Live Session
            </span>
          </div>

          {/* Exercise Log Item - INTERACTIVE CHECKMARKS */}
          <div className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-primary-light dark:text-primary-dark">Incline Barbell Bench Press</h5>
                <p className="text-[9px] text-muted-light dark:text-muted-dark">Target: 3 Sets • Tap right box to toggle set</p>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                PR: 95 kg
              </span>
            </div>

            {/* Sets Table */}
            <div className="space-y-1.5 pt-1">
              <div className="grid grid-cols-4 text-[9px] font-bold text-muted-light dark:text-muted-dark px-1">
                <span>SET</span>
                <span>PREV</span>
                <span>WEIGHT</span>
                <span className="text-right">REPS / LOG</span>
              </div>
              {gymSets.map((s) => (
                <div 
                  key={s.id} 
                  onClick={() => toggleSet(s.id)}
                  className={`grid grid-cols-4 items-center text-[10px] p-1.5 rounded-xl cursor-pointer transition-all ${
                    s.completed 
                      ? 'bg-emerald-500/10 border border-emerald-500/30' 
                      : 'bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark'
                  }`}
                >
                  <span className="font-bold text-accent">{s.id}</span>
                  <span className="text-muted-light dark:text-muted-dark text-[9px]">{s.prev}</span>
                  <span className="font-bold text-primary-light dark:text-primary-dark">{s.weight}</span>
                  <span className="text-right font-bold flex items-center justify-end gap-1">
                    <span>{s.reps}</span>
                    <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] transition-all ${
                      s.completed ? 'bg-emerald-500 text-white' : 'border border-border-light dark:border-border-dark text-transparent'
                    }`}>
                      ✓
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    timetable: {
      title: "Class & Period Timetable",
      tagline: "Live Countdown to Every Lecture & Lab",
      description: "Never wonder what classroom you belong in. LifeOS highlights your current period in real-time, displays lab details, and alerts you before classes start.",
      badge: "Academics",
      icon: Calendar,
      renderMockup: () => (
        <div className="space-y-2.5 text-left text-xs">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-extrabold text-primary-light dark:text-primary-dark">Today's Class Schedule</span>
            <span className="text-[10px] font-bold text-accent">Week B (Odd Sem)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-surface-light/40 dark:bg-surface-dark/40 border border-border-light/40 dark:border-border-dark/40 opacity-60 flex items-center justify-between">
            <div>
              <p className="font-semibold text-[11px] line-through text-primary-light dark:text-primary-dark">Linear Algebra & Matrices</p>
              <p className="text-[9px] text-muted-light dark:text-muted-dark">09:00 AM - 10:00 AM • LT-2</p>
            </div>
            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Done</span>
          </div>

          <motion.div whileHover={{ scale: 1.01 }} className="p-3 rounded-2xl bg-accent/15 border-2 border-accent text-primary-light dark:text-primary-dark shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-accent text-white animate-pulse">
                CURRENT LECTURE
              </span>
              <span className="text-[10px] font-bold text-accent">35m remaining</span>
            </div>
            <p className="font-black text-xs pt-1">Computer Networks & Sockets</p>
            <p className="text-[10px] text-secondary-light dark:text-secondary-dark">Room 402 • Lab Section A • Prof. Sharma</p>
          </motion.div>

          <div className="p-2.5 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-between">
            <div>
              <p className="font-bold text-[11px] text-primary-light dark:text-primary-dark">Database Systems Lab</p>
              <p className="text-[9px] text-muted-light dark:text-muted-dark">01:30 PM - 03:30 PM • CS Lab 3</p>
            </div>
            <span className="text-[9px] font-bold text-muted-light dark:text-muted-dark">After Lunch</span>
          </div>
        </div>
      )
    },
    nutrition: {
      title: "Nutrition & Hostel Mess",
      tagline: "Macro Targets, Calorie Fuel & Daily Meals",
      description: "Hit your daily protein, carbs, and fat goals. Includes integrated hostel/college mess menus so you know today's breakfast, lunch, and dinner in advance.",
      badge: "Health",
      icon: Utensils,
      renderMockup: () => (
        <div className="space-y-3 text-left text-xs">
          <div className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary-light dark:text-primary-dark">Daily Macro Balance</span>
              <span className="text-[10px] text-accent font-bold">1,850 / 2,400 kcal</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="p-2 rounded-xl bg-bg-light dark:bg-bg-dark text-center">
                <span className="text-[9px] text-muted-light dark:text-muted-dark block">PROTEIN</span>
                <span className="text-xs font-black text-rose-500">142g</span>
                <span className="text-[8px] text-muted-light block">/ 160g</span>
              </div>
              <div className="p-2 rounded-xl bg-bg-light dark:bg-bg-dark text-center">
                <span className="text-[9px] text-muted-light dark:text-muted-dark block">CARBS</span>
                <span className="text-xs font-black text-amber-500">195g</span>
                <span className="text-[8px] text-muted-light block">/ 250g</span>
              </div>
              <div className="p-2 rounded-xl bg-bg-light dark:bg-bg-dark text-center">
                <span className="text-[9px] text-muted-light dark:text-muted-dark block">FATS</span>
                <span className="text-xs font-black text-blue-500">54g</span>
                <span className="text-[8px] text-muted-light block">/ 70g</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-primary-light dark:text-primary-dark">Today's Mess Schedule</span>
              <span className="text-[9px] text-emerald-500 font-bold">Special Monday</span>
            </div>
            <div className="text-[10px] space-y-1 text-secondary-light dark:text-secondary-dark">
              <p><span className="font-bold text-primary-light dark:text-primary-dark">Lunch:</span> Paneer Butter Masala, Jeera Rice, Dal Tadka, Roti</p>
              <p><span className="font-bold text-primary-light dark:text-primary-dark">Dinner:</span> Egg Curry / Kadai Mushroom, Chapati, Salad</p>
            </div>
          </div>
        </div>
      )
    },
    security: {
      title: "Biometric Fortress",
      tagline: "Fingerprint & PIN Protection for Your Life",
      description: "Keep your journals, gym notes, and financial records safe from roommates and prying eyes with native Android biometric lock and zero external trackers.",
      badge: "Privacy",
      icon: ShieldCheck,
      renderMockup: () => (
        <div className="space-y-4 text-center py-4 text-xs">
          <motion.div 
            animate={{ scale: [1, 1.06, 1] }} 
            transition={{ duration: 2, repeat: Infinity }}
            className="w-14 h-14 mx-auto rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-lg shadow-accent/20"
          >
            <Lock size={26} className="text-accent" />
          </motion.div>
          <div>
            <h5 className="font-black text-sm text-primary-light dark:text-primary-dark">LifeOS Is Locked</h5>
            <p className="text-[10px] text-secondary-light dark:text-secondary-dark mt-1 max-w-[200px] mx-auto">
              Scan your biometric fingerprint or enter PIN to resume your session.
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark inline-flex items-center gap-2 text-[10px] text-muted-light dark:text-muted-dark">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Encrypted local sandbox storage</span>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-primary-light dark:text-primary-dark font-sans selection:bg-accent selection:text-white transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {copiedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-pill-light dark:bg-pill-dark text-white dark:text-black text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/10"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Link copied to clipboard! Share it with friends.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal for Desktop to Mobile Sideload */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-2xl text-center space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-border-light/60 dark:hover:bg-border-dark/60 text-muted-light hover:text-primary-light transition-colors"
              >
                <X size={18} />
              </button>
              
              <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto">
                <QrCode size={24} />
              </div>

              <div>
                <h3 className="text-lg font-black text-primary-light dark:text-primary-dark">Scan to Download on Phone</h3>
                <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1">
                  Point your phone's camera at this QR code to download <strong className="text-primary-light dark:text-primary-dark">LifeOS.apk</strong> directly.
                </p>
              </div>

              {/* High-Contrast Crisp QR Code Vector */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-inner border border-neutral-200">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://github.com/Avineesh-G/LIFEOS/raw/main/public/LifeOS.apk&format=svg" 
                  alt="Download LifeOS APK QR Code" 
                  className="w-44 h-44 object-contain"
                />
              </div>

              <p className="text-[11px] text-muted-light dark:text-muted-dark break-all">
                Direct URL: <a href="https://github.com/Avineesh-G/LIFEOS/raw/main/public/LifeOS.apk" target="_blank" rel="noopener noreferrer" className="bg-bg-light dark:bg-bg-dark px-1.5 py-0.5 rounded text-[10px] text-accent hover:underline">github.com/Avineesh-G/LIFEOS/raw/main/public/LifeOS.apk</a>
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Ambient Background Glow Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.22, 0.32, 0.22]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[720px] h-[520px] rounded-full blur-[140px]"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, #8B5CF6 50%, transparent 70%)` }}
        />
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.12, 0.22, 0.12]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[50%] -left-[15%] w-[550px] h-[450px] rounded-full blur-[140px]"
          style={{ background: `radial-gradient(circle, #EC4899 0%, transparent 70%)` }}
        />
      </div>

      {/* Top Sticky Glass Navbar */}
      <header className="sticky top-0 z-40 bg-bg-light/95 dark:bg-bg-dark/95 border-b border-border-light/60 dark:border-border-dark/60 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/icon.svg" 
              alt="LifeOS Logo" 
              className="w-9 h-9 rounded-xl object-contain shadow-md shadow-accent/20 border border-border-light/80 dark:border-border-dark/80 transition-transform hover:scale-105" 
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight">LifeOS</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                v1.6.2
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-secondary-light dark:text-secondary-dark">
            <a href="#purpose" className="hover:text-accent transition-colors">The Purpose</a>
            <a href="#screenshots" className="hover:text-accent transition-colors">Live Demo</a>
            <a href="#calculator" className="hover:text-accent transition-colors">Savings</a>
            <a href="#install" className="hover:text-accent transition-colors">Install Guide</a>
          </nav>

          <div className="flex items-center gap-2">
            {/* Share / Copy Link Button */}
            <button
              onClick={copyShareLink}
              className="p-2 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:bg-border-light/40 dark:hover:bg-border-dark/40 transition-colors text-secondary-light dark:text-secondary-dark hover:text-primary-light"
              title="Share / Copy Link"
            >
              <Share2 size={16} />
            </button>

            {/* QR Code Modal Trigger */}
            <button
              onClick={() => setShowQrModal(true)}
              className="hidden sm:inline-flex p-2 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:bg-border-light/40 dark:hover:bg-border-dark/40 transition-colors text-secondary-light dark:text-secondary-dark hover:text-primary-light"
              title="Scan QR to Download"
            >
              <QrCode size={16} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:bg-border-light/40 dark:hover:bg-border-dark/40 transition-colors"
              title="Toggle theme"
            >
              {isDarkLocal ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
            </button>

            {/* Download APK Button */}
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="https://github.com/Avineesh-G/LIFEOS/raw/main/public/LifeOS.apk"
              download="LifeOS.apk"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-accent hover:opacity-95 text-white shadow-md shadow-accent/20 transition-all"
            >
              <Download size={14} />
              <span>Download APK</span>
            </motion.a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10">

        {/* Hero Section */}
        <section className="pt-16 pb-16 px-4 sm:px-6 text-center max-w-4xl mx-auto space-y-8">
          
          {/* Live Pulsing Radar Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-600 dark:text-emerald-400"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>v1.6.2 Live Release • 100% Free & Universal</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="text-4xl sm:text-6xl font-black tracking-tight leading-tight sm:leading-snug text-primary-light dark:text-primary-dark"
          >
            <span className="block mb-2 sm:mb-3">One Operating System</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent via-indigo-500 to-purple-500 pb-1">
              For Your Entire Daily Life.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="space-y-3 max-w-2xl mx-auto pt-1"
          >
            <p className="text-base sm:text-xl font-medium text-primary-light/90 dark:text-primary-dark/90 leading-relaxed">
              Stop juggling 5 separate bloated, ad-ridden apps.
            </p>
            <p className="text-sm sm:text-base text-secondary-light dark:text-secondary-dark leading-relaxed font-normal">
              LifeOS integrates your <strong className="text-primary-light dark:text-primary-dark font-semibold">study sessions, gym splits, meal nutrition, class timetable, and expenses</strong> into one sleek, offline-first dashboard.
            </p>
          </motion.div>

          {/* Hero Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Primary Direct Download Button */}
            <motion.a
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              href="https://lifeos-gujjeti-avineeshs-projects.vercel.app/LifeOS.apk"
              download="LifeOS.apk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-accent hover:opacity-95 text-white font-extrabold text-base shadow-xl shadow-accent/25 transition-all group"
            >
              <Smartphone size={20} className="group-hover:-translate-y-0.5 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-black leading-tight">Download LifeOS for Android</div>
                <div className="text-[11px] font-medium text-white/80">Direct APK • v1.6.2 • ~8.5 MB Free</div>
              </div>
              <Download size={18} className="ml-1 opacity-80" />
            </motion.a>

            {/* QR Code Quick Trigger */}
            <button
              onClick={() => setShowQrModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-accent/40 font-bold text-sm text-primary-light dark:text-primary-dark transition-all"
            >
              <QrCode size={18} className="text-accent" />
              <span>Scan QR Code</span>
            </button>
          </motion.div>

          {/* Key Feature Metric Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-secondary-light dark:text-secondary-dark"
          >
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-500" /> Biometric App Lock</span>
            <span className="flex items-center gap-1.5"><Zap size={15} className="text-amber-500" /> 0ms Instant Startup</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-blue-500" /> 100% Offline Ready</span>
            <span className="flex items-center gap-1.5"><Lock size={15} className="text-purple-500" /> Zero Trackers or Ads</span>
          </motion.div>
        </section>

        {/* The Purpose / Why We Built LifeOS Section */}
        <section id="purpose" className="py-20 px-4 sm:px-6 bg-surface-light/40 dark:bg-surface-dark/40 border-y border-border-light/60 dark:border-border-dark/60">
          <div className="max-w-5xl mx-auto space-y-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-3"
            >
              <span className="text-xs font-black tracking-wider uppercase text-accent px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                The Philosophy
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark">
                Why Did We Build LifeOS?
              </h2>
              <p className="text-secondary-light dark:text-secondary-dark text-sm sm:text-base max-w-2xl mx-auto">
                The modern mobile app ecosystem is broken for disciplined students and high-achievers. Here is the exact problem LifeOS solves.
              </p>
            </motion.div>

            {/* Before vs After Comparison Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Problem Card */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -3 }}
                className="p-6 sm:p-8 rounded-3xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-500 font-bold">
                    ✕
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-primary-light dark:text-primary-dark">The Multi-App Chaos</h3>
                    <p className="text-xs text-rose-500 font-semibold">How students usually manage their routine</p>
                  </div>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-secondary-light dark:text-secondary-dark">
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span><strong>App Fatigue:</strong> Juggling 5 different apps for study pomodoro, gym sets, class schedule, meal tracking, and expenses.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span><strong>Subscriptions Everywhere:</strong> Every workout and study app now demands $9.99/month just to unlock basic history or export logs.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span><strong>Attention Traps & Ads:</strong> Constant notification spam, gamified gimmicks, and intrusive ads destroying deep focus.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-rose-500 font-bold">✕</span>
                    <span><strong>Privacy Invasions:</strong> Your personal schedule, habits, and notes uploaded and sold to marketing data brokers.</span>
                  </li>
                </ul>
              </motion.div>

              {/* Solution Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -3 }}
                className="p-6 sm:p-8 rounded-3xl bg-accent/5 dark:bg-accent/10 border border-accent/25 space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-accent text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-primary-light dark:text-primary-dark">The LifeOS Philosophy</h3>
                    <p className="text-xs text-accent font-semibold">Engineered from real necessity</p>
                  </div>
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-secondary-light dark:text-secondary-dark">
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>One Unified Dashboard:</strong> Move effortlessly from your morning class timetable to afternoon study sessions to your evening gym split.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>100% Free Forever:</strong> No paywalls, no trial expirations, no subscriptions. Built for you to win, not to milk your wallet.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Zero Ads, Zero Distractions:</strong> Pure, ultra-fast interface designed to get you in, log your work, and get you back to real life.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Fortified Biometric Security:</strong> Lock your app with fingerprint or PIN so roommates and passersby cannot snoop your logs.</span>
                  </li>
                </ul>
              </motion.div>

            </div>

            {/* Creator Statement Quote */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-center space-y-2 max-w-2xl mx-auto shadow-sm"
            >
              <Heart size={20} className="text-rose-500 mx-auto fill-rose-500/20" />
              <p className="text-xs sm:text-sm text-secondary-light dark:text-secondary-dark italic leading-relaxed">
                "LifeOS was created because I wanted a tool that actually respected my attention and time. No social algorithms, no subscription fees—just pure, uncompromising tools to build daily discipline."
              </p>
              <p className="text-xs font-bold text-primary-light dark:text-primary-dark pt-1">
                — Gujjeti Avineesh & the LifeOS Project
              </p>
            </motion.div>
          </div>
        </section>

        {/* Interactive App Screenshots Showcase with Floating Orbit Badges */}
        <section id="screenshots" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <span className="text-xs font-black tracking-wider uppercase text-accent px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              Interactive Visual Tour
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark">
              Experience the Real Interface
            </h2>
            <p className="text-secondary-light dark:text-secondary-dark text-sm max-w-xl mx-auto">
              Tap the tabs below to test live interactive widgets (try starting the study timer or checking gym sets!).
            </p>
          </motion.div>

          {/* Tab Selection Bar with Animated Background Indicator */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(Object.keys(screenshots) as TabType[]).map((tabKey) => {
              const tab = screenshots[tabKey];
              const Icon = tab.icon;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-white'
                      : 'bg-surface-light dark:bg-surface-dark text-secondary-light dark:text-secondary-dark border border-border-light dark:border-border-dark hover:border-accent/40'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 rounded-2xl bg-accent shadow-lg shadow-accent/30 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={15} />
                  <span>{tab.badge}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen Device Mockup with Orbiting Badges */}
          <div className="grid lg:grid-cols-12 gap-8 items-center pt-4">
            
            {/* Left: Tab Explanatory Content */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-accent/10 text-accent font-black text-xs">
                <span>{screenshots[activeTab].badge} MODULE</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-primary-light dark:text-primary-dark leading-tight">
                {screenshots[activeTab].title}
              </h3>
              <p className="text-accent font-bold text-sm">
                {screenshots[activeTab].tagline}
              </p>
              <p className="text-secondary-light dark:text-secondary-dark text-sm leading-relaxed">
                {screenshots[activeTab].description}
              </p>
              
              <div className="pt-2 flex items-center gap-3">
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href="https://github.com/Avineesh-G/LIFEOS/raw/main/public/LifeOS.apk"
                  download="LifeOS.apk"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/20 transition-all"
                >
                  <Download size={13} />
                  <span>Get this on your phone</span>
                </motion.a>

                <button
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs font-semibold text-secondary-light dark:text-secondary-dark hover:text-primary-light"
                >
                  <QrCode size={13} />
                  <span>Scan QR</span>
                </button>
              </div>
            </div>

            {/* Right: Phone Frame with Floating Orbit Badges */}
            <div className="lg:col-span-7 flex justify-center relative">
              
              {/* Floating Orbit Chip 1 (Top Left) */}
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden sm:flex absolute -top-4 -left-8 z-30 p-2.5 rounded-2xl bg-surface-light/95 dark:bg-surface-dark/95 border border-border-light dark:border-border-dark shadow-xl items-center gap-2 text-xs font-bold"
              >
                <div className="w-7 h-7 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center">
                  <Flame size={14} className="fill-orange-500" />
                </div>
                <div>
                  <div className="text-[11px] font-black text-primary-light dark:text-primary-dark">18 Day Streak</div>
                  <div className="text-[9px] text-emerald-500 font-semibold">Active & Consistent</div>
                </div>
              </motion.div>

              {/* Floating Orbit Chip 2 (Bottom Left) */}
              <motion.div
                animate={{ y: [6, -6, 6] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="hidden sm:flex absolute -bottom-4 -left-6 z-30 p-2.5 rounded-2xl bg-surface-light/95 dark:bg-surface-dark/95 border border-border-light dark:border-border-dark shadow-xl items-center gap-2 text-xs font-bold"
              >
                <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
                  <Dumbbell size={14} />
                </div>
                <div>
                  <div className="text-[11px] font-black text-primary-light dark:text-primary-dark">New 1RM PR</div>
                  <div className="text-[9px] text-rose-500 font-semibold">95 kg Bench Press</div>
                </div>
              </motion.div>

              {/* Floating Orbit Chip 3 (Top Right) */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="hidden sm:flex absolute top-12 -right-6 z-30 p-2.5 rounded-2xl bg-surface-light/95 dark:bg-surface-dark/95 border border-border-light dark:border-border-dark shadow-xl items-center gap-2 text-xs font-bold"
              >
                <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                  <Clock size={14} />
                </div>
                <div>
                  <div className="text-[11px] font-black text-primary-light dark:text-primary-dark">Class in 24m</div>
                  <div className="text-[9px] text-accent font-semibold">Room 304 (Lab A)</div>
                </div>
              </motion.div>

              {/* The Phone Chassis */}
              <div className="relative w-full max-w-[340px] rounded-[44px] p-3 bg-neutral-900 shadow-2xl border-4 border-neutral-700/80 ring-1 ring-white/10 transition-transform duration-300 hover:scale-[1.01]">
                
                {/* Speaker Grill & Dynamic Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                </div>

                {/* Inner Screen Surface */}
                <div className="relative rounded-[36px] overflow-hidden bg-bg-light dark:bg-bg-dark border border-border-light/20 dark:border-border-dark/30 pt-7 pb-5 px-4 min-h-[460px] flex flex-col justify-between">
                  
                  {/* Real-time Status Bar */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-secondary-light dark:text-secondary-dark px-1 mb-2">
                    <span>{phoneTime}</span>
                    <div className="flex items-center gap-1.5 opacity-80">
                      <Wifi size={11} />
                      <Battery size={13} className="text-emerald-500" />
                    </div>
                  </div>

                  {/* Animated Tab Screen Content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      {screenshots[activeTab].renderMockup()}
                    </motion.div>
                  </AnimatePresence>

                  {/* Android Gesture Bar */}
                  <div className="pt-3 flex justify-center">
                    <div className="w-28 h-1 rounded-full bg-neutral-400/40 dark:bg-neutral-600/60" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Interactive Subscription & App-Fatigue Calculator */}
        <section id="calculator" className="py-20 px-4 sm:px-6 bg-surface-light/30 dark:bg-surface-dark/30 border-y border-border-light/60 dark:border-border-dark/60">
          <div className="max-w-4xl mx-auto space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-3"
            >
              <span className="text-xs font-black tracking-wider uppercase text-emerald-500 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Cost & Clutter Eliminator
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark">
                How Much Are You Wasting on Other Apps?
              </h2>
              <p className="text-secondary-light dark:text-secondary-dark text-sm max-w-xl mx-auto">
                Toggle the apps you currently juggle to calculate your yearly financial savings and mental clarity gained with LifeOS.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-12 gap-6 items-center">
              
              {/* Checkboxes Area */}
              <div className="md:col-span-7 space-y-3">
                {Object.entries(selectedApps).map(([key, app]) => (
                  <motion.div
                    key={key}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => toggleAppSelection(key)}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                      app.checked 
                        ? 'bg-surface-light dark:bg-surface-dark border-accent/40 shadow-sm' 
                        : 'bg-surface-light/40 dark:bg-surface-dark/40 border-border-light/40 dark:border-border-dark/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                        app.checked ? 'bg-accent text-white' : 'border border-border-light dark:border-border-dark'
                      }`}>
                        {app.checked ? '✓' : ''}
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-primary-light dark:text-primary-dark">{app.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-rose-500">${app.cost}/mo</span>
                  </motion.div>
                ))}
              </div>

              {/* Results Total Card */}
              <div className="md:col-span-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-accent/15 via-surface-light dark:via-surface-dark to-surface-light dark:to-surface-dark border border-accent/30 text-center space-y-4 shadow-xl">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent">YOUR YEARLY SAVINGS</span>
                  <div className="text-4xl sm:text-5xl font-black text-emerald-500 mt-1">
                    ${yearlySavings}
                  </div>
                  <p className="text-xs text-secondary-light dark:text-secondary-dark mt-0.5">
                    Saved each year • ($0 LifeOS fee)
                  </p>
                </div>

                <div className="pt-2 border-t border-border-light dark:border-border-dark space-y-1.5 text-xs text-secondary-light dark:text-secondary-dark">
                  <div className="flex justify-between font-semibold">
                    <span>Apps Replaced:</span>
                    <strong className="text-primary-light dark:text-primary-dark">{activeAppsCount} separate apps</strong>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Mental Friction:</span>
                    <strong className="text-emerald-500">Zero notification ads</strong>
                  </div>
                </div>

                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  href="https://github.com/Avineesh-G/LIFEOS/raw/main/public/LifeOS.apk"
                  download="LifeOS.apk"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent text-white font-extrabold text-xs shadow-md shadow-accent/25"
                >
                  <Download size={14} />
                  <span>Eliminate Clutter — Download APK</span>
                </motion.a>
              </div>

            </div>
          </div>
        </section>

        {/* The 5 Core Pillars Grid with Hover Lighting */}
        <section id="features" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <span className="text-xs font-black tracking-wider uppercase text-accent px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark">
              Engineered for Every Angle of Life
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {[
              { icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10', title: 'Focus & Academics', desc: 'Pomodoro timers, deep work session logs, and GitHub-style visual heatmaps to track your daily study consistency over the semester.' },
              { icon: Dumbbell, color: 'text-rose-500', bg: 'bg-rose-500/10', title: 'Gym Hypertrophy', desc: 'Push/Pull/Legs splits, workout set/rep logging, 1RM calculator, and progressive overload graphs to ensure real physical growth.' },
              { icon: Utensils, color: 'text-amber-500', bg: 'bg-amber-500/10', title: 'Nutrition & Mess Menus', desc: 'Log protein, carbs, calories, and keep track of your hostel mess schedule so you never miss breakfast or special meals.' },
              { icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-500/10', title: 'Real-Time Timetable', desc: 'Dynamic class schedules that highlight the current lecture in progress, classroom numbers, and countdowns to your next period.' },
              { icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-500/10', title: 'Spending & Budget', desc: 'Log student daily expenses, track where your allowance goes, and stay disciplined with visual category breakdowns.' },
              { icon: ShieldCheck, color: 'text-cyan-500', bg: 'bg-cyan-500/10', title: 'Biometric Privacy', desc: 'Native Android biometric fingerprint protection, encrypted offline sandbox, zero trackers, and zero external ad SDKs.' }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 hover:border-accent/50 transition-all shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center font-bold`}>
                    <Icon size={20} />
                  </div>
                  <h4 className="text-base font-extrabold text-primary-light dark:text-primary-dark">{feature.title}</h4>
                  <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              );
            })}

          </div>
        </section>

        {/* 3-Step Sideloading / Installation Guide */}
        <section id="install" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-3"
          >
            <span className="text-xs font-black tracking-wider uppercase text-accent px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              Installation Guide
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark">
              How to Install on Android
            </h2>
            <p className="text-secondary-light dark:text-secondary-dark text-sm max-w-xl mx-auto">
              Installing an APK directly is fast and safe. Here are the 3 quick steps to get LifeOS running on your phone.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            
            <motion.div whileHover={{ y: -3 }} className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-black text-sm shadow-md shadow-accent/20">
                1
              </span>
              <h4 className="text-base font-black text-primary-light dark:text-primary-dark">Tap Download</h4>
              <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                Click the <strong className="text-primary-light dark:text-primary-dark font-semibold">Download APK</strong> button. Your browser will download the lightweight <code className="text-[11px] bg-bg-light dark:bg-bg-dark px-1.5 py-0.5 rounded border border-border-light dark:border-border-dark">LifeOS.apk</code> package.
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -3 }} className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-black text-sm shadow-md shadow-accent/20">
                2
              </span>
              <h4 className="text-base font-black text-primary-light dark:text-primary-dark">Allow Unknown Source</h4>
              <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                Chrome may ask: <em>"File might be harmful"</em>. Tap <strong className="text-emerald-500 font-semibold">Download anyway</strong>. (Google flags all non-Play Store independent builds this way).
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -3 }} className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-black text-sm shadow-md shadow-accent/20">
                3
              </span>
              <h4 className="text-base font-black text-primary-light dark:text-primary-dark">Open & Install</h4>
              <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                Tap the completed download notification or open your <strong className="text-primary-light dark:text-primary-dark font-semibold">Downloads</strong> app. Tap <strong className="text-accent font-semibold">Install</strong> and launch your operating system!
              </p>
            </motion.div>

          </div>

          {/* Quick FAQ / Security Callout */}
          <div className="p-5 rounded-2xl bg-accent/10 border border-accent/25 flex items-start gap-3.5 text-xs text-secondary-light dark:text-secondary-dark">
            <HelpCircle size={18} className="text-accent shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-primary-light dark:text-primary-dark">Why is LifeOS distributed directly as an APK?</p>
              <p className="leading-relaxed">
                Direct distribution keeps LifeOS 100% free, avoids expensive annual developer fees, and lets us push immediate updates without waiting days for third-party store approvals.
              </p>
            </div>
          </div>
        </section>

        {/* Final Bottom Download Call-to-Action */}
        <section className="py-20 px-4 sm:px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto p-8 sm:p-12 rounded-[36px] bg-gradient-to-b from-surface-light to-bg-light dark:from-surface-dark dark:to-bg-dark border border-border-light dark:border-border-dark shadow-2xl space-y-6"
          >
            <img 
              src="/icon.svg" 
              alt="LifeOS Logo" 
              className="w-14 h-14 mx-auto rounded-2xl object-contain shadow-xl shadow-accent/25 border border-border-light/80 dark:border-border-dark/80" 
            />

            <h2 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark tracking-tight">
              Ready to Upgrade Your Daily Discipline?
            </h2>

            <p className="text-secondary-light dark:text-secondary-dark text-sm max-w-lg mx-auto">
              Join students and lifters who have reclaimed their routine with LifeOS. Instant download, zero sign-up friction.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="https://lifeos-gujjeti-avineeshs-projects.vercel.app/LifeOS.apk"
                download="LifeOS.apk"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-accent hover:opacity-95 text-white font-black text-base shadow-xl shadow-accent/25 transition-all"
              >
                <Download size={18} />
                <span>Download LifeOS.apk (v1.6.2)</span>
              </motion.a>

              <button
                onClick={() => setShowQrModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark font-bold text-sm text-primary-light dark:text-primary-dark hover:border-accent/40 transition-all"
              >
                <QrCode size={16} className="text-accent" />
                <span>Scan QR Code</span>
              </button>
            </div>

            <div className="text-[11px] text-muted-light dark:text-muted-dark pt-2">
              Android 8.0+ Required • ARM64 / Universal Build • Completely Safe & Free
            </div>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border-light/60 dark:border-border-dark/60 text-center text-xs text-secondary-light dark:text-secondary-dark space-y-2">
        <p className="font-semibold text-primary-light dark:text-primary-dark">
          LifeOS — Your Daily Life, Engineered.
        </p>
        <p className="text-[11px] text-muted-light dark:text-muted-dark">
          Built with dedication for student performance and daily discipline by Gujjeti Avineesh.
        </p>
      </footer>

    </div>
  );
}
