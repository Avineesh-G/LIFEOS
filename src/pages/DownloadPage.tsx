import React, { useState } from 'react';
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
  Heart
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
        <div className="space-y-3.5 text-left text-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-border-light/40 dark:border-border-dark/40">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-light dark:text-muted-dark">MONDAY • SEP 14</p>
              <h4 className="text-sm font-black text-primary-light dark:text-primary-dark">Welcome back, Scholar 👋</h4>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 font-bold text-[11px] border border-orange-500/20">
              <Flame size={12} className="fill-orange-500" />
              <span>18 Day Streak</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark/90 border border-border-light dark:border-border-dark/80 shadow-sm">
              <div className="flex items-center justify-between text-muted-light dark:text-muted-dark mb-1">
                <span className="text-[10px] font-semibold">Deep Study</span>
                <Clock size={12} className="text-accent" />
              </div>
              <div className="text-base font-black text-primary-light dark:text-primary-dark">3h 45m</div>
              <div className="text-[10px] text-emerald-500 font-medium mt-0.5">85% of daily goal</div>
            </div>
            <div className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark/90 border border-border-light dark:border-border-dark/80 shadow-sm">
              <div className="flex items-center justify-between text-muted-light dark:text-muted-dark mb-1">
                <span className="text-[10px] font-semibold">Gym Split</span>
                <Dumbbell size={12} className="text-rose-500" />
              </div>
              <div className="text-base font-black text-primary-light dark:text-primary-dark">Push Day</div>
              <div className="text-[10px] text-rose-500 font-medium mt-0.5">Chest & Triceps</div>
            </div>
          </div>

          {/* Next Lecture Alert */}
          <div className="p-3 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-accent text-white">UPCOMING CLASS</span>
              <p className="font-bold text-primary-light dark:text-primary-dark text-xs pt-1">Advanced Algorithm Design</p>
              <p className="text-[10px] text-secondary-light dark:text-secondary-dark">Room 304 • Prof. Anderson (11:00 AM)</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-accent">In 24m</span>
            </div>
          </div>

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
      tagline: "Pomodoro Timers, Revision Tracking & Heatmaps",
      description: "Lock in with customizable countdown/stopwatch study timers. Watch your consistency compound with GitHub-style annual activity heatmaps and subject logs.",
      badge: "Deep Work",
      icon: BookOpen,
      renderMockup: () => (
        <div className="space-y-3.5 text-left text-xs">
          {/* Active Timer Display */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/15 via-surface-light dark:via-surface-dark to-surface-light dark:to-surface-dark border border-accent/30 text-center space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent">
              FOCUS SESSION ACTIVE
            </span>
            <div className="text-3xl font-black tracking-tight text-primary-light dark:text-primary-dark font-mono">
              24:48
            </div>
            <p className="text-[11px] text-secondary-light dark:text-secondary-dark font-medium">
              Subject: <span className="font-bold text-primary-light dark:text-primary-dark">Operating Systems (Memory Mgt)</span>
            </p>
            <div className="w-full bg-border-light dark:bg-border-dark h-1.5 rounded-full overflow-hidden">
              <div className="bg-accent h-full rounded-full" style={{ width: '62%' }} />
            </div>
          </div>

          {/* Activity Heatmap Mock */}
          <div className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-2">
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
            <div className="flex items-center justify-between text-[9px] text-muted-light dark:text-muted-dark pt-1">
              <span>Less</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-xs bg-border-light/40 dark:bg-border-dark/40" />
                <span className="w-2 h-2 rounded-xs bg-emerald-300 dark:bg-emerald-950" />
                <span className="w-2 h-2 rounded-xs bg-emerald-500 dark:bg-emerald-600" />
                <span className="w-2 h-2 rounded-xs bg-emerald-600 dark:bg-emerald-400" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      )
    },
    gym: {
      title: "Gym & Hypertrophy",
      tagline: "Track Splits, Sets, Reps & 1RM Records",
      description: "Full workout companion built for serious lifters. Log Push/Pull/Legs splits, record weights and RPE, and track progressive overload automatically.",
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
                <p className="text-[10px] text-rose-500 font-medium">Exercise 2 of 5</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-500">
              Live Session
            </span>
          </div>

          {/* Exercise Log Item */}
          <div className="p-3 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-primary-light dark:text-primary-dark">Incline Barbell Bench Press</h5>
                <p className="text-[10px] text-muted-light dark:text-muted-dark">Target: 3 Sets • Chest Hypertrophy</p>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                PR: 95 kg
              </span>
            </div>

            {/* Sets Table */}
            <div className="space-y-1.5 pt-1">
              <div className="grid grid-cols-4 text-[9px] font-bold text-muted-light dark:text-muted-dark px-1">
                <span>SET</span>
                <span>PREVIOUS</span>
                <span>WEIGHT</span>
                <span className="text-right">REPS</span>
              </div>
              <div className="grid grid-cols-4 items-center text-[10px] p-1.5 rounded-xl bg-bg-light dark:bg-bg-dark font-medium">
                <span className="font-bold text-accent">1</span>
                <span className="text-muted-light dark:text-muted-dark">80 kg × 10</span>
                <span className="font-bold text-primary-light dark:text-primary-dark">85 kg</span>
                <span className="text-right font-bold text-emerald-500 flex items-center justify-end gap-1">
                  10 <Check size={11} />
                </span>
              </div>
              <div className="grid grid-cols-4 items-center text-[10px] p-1.5 rounded-xl bg-bg-light dark:bg-bg-dark font-medium border border-accent/40">
                <span className="font-bold text-accent">2</span>
                <span className="text-muted-light dark:text-muted-dark">85 kg × 8</span>
                <span className="font-bold text-primary-light dark:text-primary-dark">90 kg</span>
                <span className="text-right font-bold text-emerald-500 flex items-center justify-end gap-1">
                  8 <Check size={11} />
                </span>
              </div>
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

          {/* Period 1: Done */}
          <div className="p-2.5 rounded-xl bg-surface-light/40 dark:bg-surface-dark/40 border border-border-light/40 dark:border-border-dark/40 opacity-60 flex items-center justify-between">
            <div>
              <p className="font-semibold text-[11px] line-through text-primary-light dark:text-primary-dark">Linear Algebra & Matrices</p>
              <p className="text-[9px] text-muted-light dark:text-muted-dark">09:00 AM - 10:00 AM • LT-2</p>
            </div>
            <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Done</span>
          </div>

          {/* Period 2: Live Right Now */}
          <div className="p-3 rounded-2xl bg-accent/15 border-2 border-accent text-primary-light dark:text-primary-dark shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-accent text-white animate-pulse">
                CURRENT LECTURE
              </span>
              <span className="text-[10px] font-bold text-accent">35m remaining</span>
            </div>
            <p className="font-black text-xs pt-1">Computer Networks & Sockets</p>
            <p className="text-[10px] text-secondary-light dark:text-secondary-dark">Room 402 • Lab Section A • Prof. Sharma</p>
          </div>

          {/* Period 3: Next */}
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
          {/* Calorie Dial & Macros */}
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

          {/* Today's Mess Menu */}
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
          <div className="w-14 h-14 mx-auto rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Lock size={26} className="text-accent animate-pulse" />
          </div>
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
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark text-primary-light dark:text-primary-dark font-sans selection:bg-accent selection:text-white transition-colors duration-300">
      
      {/* Glow Ambient Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25 dark:opacity-20 transition-all duration-700"
          style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute top-[60%] -left-[10%] w-[500px] h-[400px] rounded-full blur-[130px] opacity-15 dark:opacity-10"
          style={{ background: `radial-gradient(circle, #EC4899 0%, transparent 70%)` }}
        />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg-light/80 dark:bg-bg-dark/80 border-b border-border-light/60 dark:border-border-dark/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/icon.svg" 
              alt="LifeOS Logo" 
              className="w-9 h-9 rounded-xl object-contain shadow-md shadow-accent/20 border border-border-light/80 dark:border-border-dark/80" 
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight">LifeOS</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                v1.5.4
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-secondary-light dark:text-secondary-dark">
            <a href="#purpose" className="hover:text-accent transition-colors">The Purpose</a>
            <a href="#screenshots" className="hover:text-accent transition-colors">Screenshots</a>
            <a href="#features" className="hover:text-accent transition-colors">Pillars</a>
            <a href="#install" className="hover:text-accent transition-colors">Install Guide</a>
          </nav>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:bg-border-light/40 dark:hover:bg-border-dark/40 transition-colors"
              title="Toggle theme"
            >
              {isDarkLocal ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-indigo-600" />}
            </button>

            {/* Open Web App Link */}
            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-border-light dark:border-border-dark hover:border-accent/40 bg-surface-light dark:bg-surface-dark text-primary-light dark:text-primary-dark transition-all"
            >
              <span>Launch Web</span>
              <ExternalLink size={13} className="text-secondary-light dark:text-secondary-dark" />
            </a>

            {/* Quick Download Button in Nav */}
            <a
              href="/LifeOS.apk"
              download="LifeOS.apk"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-accent hover:opacity-95 text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download size={14} />
              <span>Download APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10">

        {/* Hero Section */}
        <section className="pt-16 pb-20 px-4 sm:px-6 text-center max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-xs font-bold text-accent"
          >
            <Sparkles size={14} />
            <span>Universal Android Build • 100% Free & Open</span>
          </motion.div>

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

          {/* Download Action Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
            className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Direct APK Download Button */}
            <a
              href="/LifeOS.apk"
              download="LifeOS.apk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-accent hover:opacity-95 text-white font-extrabold text-base shadow-xl shadow-accent/25 transition-all hover:scale-[1.03] active:scale-[0.98] group"
            >
              <Smartphone size={20} className="group-hover:-translate-y-0.5 transition-transform" />
              <div className="text-left">
                <div className="text-sm font-black leading-tight">Download LifeOS for Android</div>
                <div className="text-[11px] font-medium text-white/80">Direct APK • v1.5.4 • Free</div>
              </div>
              <Download size={18} className="ml-1 opacity-80" />
            </a>

            {/* Secondary: Web App / Read Story */}
            <a
              href="#purpose"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-accent/40 font-bold text-sm text-primary-light dark:text-primary-dark transition-all"
            >
              <span>Why We Built This</span>
              <ArrowRight size={16} className="text-accent" />
            </a>
          </motion.div>

          {/* Highlights Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-secondary-light dark:text-secondary-dark"
          >
            <span className="flex items-center gap-1.5"><ShieldCheck size={15} className="text-emerald-500" /> Biometric App Lock</span>
            <span className="flex items-center gap-1.5"><Zap size={15} className="text-amber-500" /> 0ms Instant Startup</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-blue-500" /> 100% Offline Ready</span>
            <span className="flex items-center gap-1.5"><Lock size={15} className="text-purple-500" /> Zero Trackers or Ads</span>
          </motion.div>
        </section>

        {/* The Purpose / Why We Built LifeOS Section */}
        <section id="purpose" className="py-16 px-4 sm:px-6 bg-surface-light/40 dark:bg-surface-dark/40 border-y border-border-light/60 dark:border-border-dark/60">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-black tracking-wider uppercase text-accent px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                The Philosophy
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark">
                Why Did We Build LifeOS?
              </h2>
              <p className="text-secondary-light dark:text-secondary-dark text-sm sm:text-base max-w-2xl mx-auto">
                The modern mobile app ecosystem is broken for disciplined students and high-achievers. Here is the exact problem LifeOS solves.
              </p>
            </div>

            {/* Before vs After Comparison Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Problem Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 space-y-4">
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
              </div>

              {/* Solution Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-accent/5 dark:bg-accent/10 border border-accent/25 space-y-4">
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
              </div>

            </div>

            {/* Creator Statement Quote */}
            <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-center space-y-2 max-w-2xl mx-auto shadow-sm">
              <Heart size={20} className="text-rose-500 mx-auto fill-rose-500/20" />
              <p className="text-xs sm:text-sm text-secondary-light dark:text-secondary-dark italic leading-relaxed">
                "LifeOS was created because I wanted a tool that actually respected my attention and time. No social algorithms, no subscription fees—just pure, uncompromising tools to build daily discipline."
              </p>
              <p className="text-xs font-bold text-primary-light dark:text-primary-dark pt-1">
                — Gujjeti Avineesh & the LifeOS Project
              </p>
            </div>
          </div>
        </section>

        {/* Interactive App Screenshots Showcase */}
        <section id="screenshots" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black tracking-wider uppercase text-accent px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              Visual Tour
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark">
              Explore the Real Application
            </h2>
            <p className="text-secondary-light dark:text-secondary-dark text-sm max-w-xl mx-auto">
              Tap each tab below to see how every module of LifeOS is crafted for instant speed, clarity, and ergonomics.
            </p>
          </div>

          {/* Tab Selection Bar */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(Object.keys(screenshots) as TabType[]).map((tabKey) => {
              const tab = screenshots[tabKey];
              const Icon = tab.icon;
              const isActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-[1.03]'
                      : 'bg-surface-light dark:bg-surface-dark text-secondary-light dark:text-secondary-dark border border-border-light dark:border-border-dark hover:border-accent/40'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.badge}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Screen Device Mockup */}
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
              
              <div className="pt-2">
                <a
                  href="/LifeOS.apk"
                  download="LifeOS.apk"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-accent/40 text-xs font-bold text-accent transition-all"
                >
                  <Download size={13} />
                  <span>Get this on your phone</span>
                </a>
              </div>
            </div>

            {/* Right: Realistic Phone Frame */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="relative w-full max-w-[340px] rounded-[44px] p-3 bg-neutral-900 shadow-2xl border-4 border-neutral-700/80 ring-1 ring-white/10">
                {/* Speaker Grill & Dynamic Island / Camera */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full z-30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                </div>

                {/* Inner Screen Surface */}
                <div className="relative rounded-[36px] overflow-hidden bg-bg-light dark:bg-bg-dark border border-border-light/20 dark:border-border-dark/30 pt-9 pb-6 px-4 min-h-[460px] flex flex-col justify-between">
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

                  {/* Android Home Indicator Bar */}
                  <div className="pt-4 flex justify-center">
                    <div className="w-28 h-1 rounded-full bg-neutral-400/40 dark:bg-neutral-600/60" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* The 5 Core Pillars Grid */}
        <section id="features" className="py-16 px-4 sm:px-6 bg-surface-light/30 dark:bg-surface-dark/30 border-t border-border-light/60 dark:border-border-dark/60">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-black tracking-wider uppercase text-accent px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                Architecture
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark">
                Engineered for Every Angle of Life
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 hover:border-accent/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                  <BookOpen size={20} />
                </div>
                <h4 className="text-base font-extrabold text-primary-light dark:text-primary-dark">Focus & Academics</h4>
                <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                  Pomodoro timers, deep work session logs, and GitHub-style visual heatmaps to track your daily study consistency over the semester.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 hover:border-accent/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                  <Dumbbell size={20} />
                </div>
                <h4 className="text-base font-extrabold text-primary-light dark:text-primary-dark">Gym Hypertrophy</h4>
                <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                  Push/Pull/Legs splits, workout set/rep logging, 1RM calculator, and progressive overload graphs to ensure real physical growth.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 hover:border-accent/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Utensils size={20} />
                </div>
                <h4 className="text-base font-extrabold text-primary-light dark:text-primary-dark">Nutrition & Mess Menus</h4>
                <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                  Log protein, carbs, calories, and keep track of your hostel mess schedule so you never miss breakfast or special meals.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 hover:border-accent/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                  <Calendar size={20} />
                </div>
                <h4 className="text-base font-extrabold text-primary-light dark:text-primary-dark">Real-Time Timetable</h4>
                <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                  Dynamic class schedules that highlight the current lecture in progress, classroom numbers, and countdowns to your next period.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 hover:border-accent/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                  <Wallet size={20} />
                </div>
                <h4 className="text-base font-extrabold text-primary-light dark:text-primary-dark">Spending & Budget</h4>
                <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                  Log student daily expenses, track where your allowance goes, and stay disciplined with visual category breakdowns.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 hover:border-accent/40 transition-colors">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="text-base font-extrabold text-primary-light dark:text-primary-dark">Biometric Privacy</h4>
                <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                  Native Android biometric fingerprint protection, encrypted offline sandbox, zero trackers, and zero external ad SDKs.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 3-Step Sideloading / Installation Guide */}
        <section id="install" className="py-20 px-4 sm:px-6 max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black tracking-wider uppercase text-accent px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              Installation Guide
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-primary-light dark:text-primary-dark">
              How to Install on Android
            </h2>
            <p className="text-secondary-light dark:text-secondary-dark text-sm max-w-xl mx-auto">
              Installing an APK directly is fast and safe. Here are the 3 quick steps to get LifeOS running on your phone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-black text-sm">
                1
              </span>
              <h4 className="text-base font-black text-primary-light dark:text-primary-dark">Tap Download</h4>
              <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                Click the <strong className="text-primary-light dark:text-primary-dark font-semibold">Download APK</strong> button. Your browser will begin downloading the <code className="text-[11px] bg-bg-light dark:bg-bg-dark px-1.5 py-0.5 rounded border border-border-light dark:border-border-dark">LifeOS.apk</code> package.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-black text-sm">
                2
              </span>
              <h4 className="text-base font-black text-primary-light dark:text-primary-dark">Allow Unknown Source</h4>
              <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                Chrome may ask: <em>"File might be harmful"</em>. Tap <strong className="text-emerald-500 font-semibold">Download anyway</strong>. (Google flags all non-Play Store independent builds this way).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark space-y-3 relative">
              <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-black text-sm">
                3
              </span>
              <h4 className="text-base font-black text-primary-light dark:text-primary-dark">Open & Install</h4>
              <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
                Tap the completed download notification or open your <strong className="text-primary-light dark:text-primary-dark font-semibold">Downloads</strong> app. Tap <strong className="text-accent font-semibold">Install</strong> and launch your operating system!
              </p>
            </div>

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
          <div className="max-w-3xl mx-auto p-8 sm:p-12 rounded-[36px] bg-gradient-to-b from-surface-light to-bg-light dark:from-surface-dark dark:to-bg-dark border border-border-light dark:border-border-dark shadow-2xl space-y-6">
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
              <a
                href="/LifeOS.apk"
                download="LifeOS.apk"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-accent hover:opacity-95 text-white font-black text-base shadow-xl shadow-accent/25 transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                <Download size={18} />
                <span>Download LifeOS.apk (v1.5.4)</span>
              </a>

              <a
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark font-bold text-sm text-primary-light dark:text-primary-dark hover:border-accent/40 transition-all"
              >
                <span>Launch Web Version</span>
                <ExternalLink size={14} className="text-secondary-light dark:text-secondary-dark" />
              </a>
            </div>

            <div className="text-[11px] text-muted-light dark:text-muted-dark pt-2">
              Android 8.0+ Required • ARM64 / Universal Build • Completely Safe & Free
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border-light/60 dark:border-border-dark/60 text-center text-xs text-secondary-light dark:text-secondary-dark space-y-2">
        <p className="font-semibold text-primary-light dark:text-primary-dark">
          LifeOS — Your Daily Life, Engineered.
        </p>
        <p className="text-[11px] text-muted-light dark:text-muted-dark">
          Built with dedication for student performance and daily discipline. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
