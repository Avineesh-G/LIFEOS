import React, { useState, useEffect, useMemo } from 'react';
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
  Copy,
  Cpu,
  Bot,
  Compass,
  Palette,
  Briefcase,
  ListTodo,
  ShoppingBag,
  Bell,
  RefreshCw,
  Eye,
  Sliders,
  Award,
  Terminal,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DownloadPageProps {
  theme?: string;
  setTheme?: (t: any) => void;
  accentColor?: string;
}

export type ModuleId = 
  | 'home' 
  | 'study' 
  | 'gym' 
  | 'nutrition' 
  | 'spending' 
  | 'vault' 
  | 'timetable' 
  | 'tasks' 
  | 'notes' 
  | 'shopping' 
  | 'outings' 
  | 'laundry' 
  | 'history' 
  | 'colors';

interface ModuleConfig {
  id: ModuleId;
  name: string;
  shortName: string;
  tagline: string;
  category: string;
  accent: string;
  accentTint: string;
  icon: any;
  bulletPoints: string[];
}

const MODULES: ModuleConfig[] = [
  {
    id: 'home',
    name: 'Home Engine & Daily Brief',
    shortName: 'Home',
    tagline: 'Ambient System Intelligence & Unified Snapshot',
    category: 'Core System',
    accent: '#2563EB',
    accentTint: '#60A5FA',
    icon: Compass,
    bulletPoints: [
      'Gemini AI daily briefing summarizing upcoming classes, target calories, and tasks',
      'Dynamic date pill with live clock isolated for 0% battery overhead',
      'Rive vector avatar with interactive streak and mood animations',
      'Habit dot indicators across Study, Gym, Tasks, and Expenses at a glance',
    ],
  },
  {
    id: 'study',
    name: 'Study Hub & Focus Engine',
    shortName: 'Study',
    tagline: 'Pomodoro Timer, Subject Tracking & Annual Heatmaps',
    category: 'Academics',
    accent: '#0891B2',
    accentTint: '#38BDF8',
    icon: BookOpen,
    bulletPoints: [
      'Interactive Pomodoro countdown timer with customizable focus & break cycles',
      'Subject-wise session logging with deep-work duration metrics',
      'GitHub-style annual study heatmap visualizing year-long discipline',
      'Exam target countdowns and revision notes tagging',
    ],
  },
  {
    id: 'gym',
    name: 'Gym & Split Routine Tracker',
    shortName: 'Gym',
    tagline: 'PPL Splits, Set Logging & Live Rest Countdown',
    category: 'Fitness',
    accent: '#E11D48',
    accentTint: '#FB7185',
    icon: Dumbbell,
    bulletPoints: [
      'Custom split manager (Push / Pull / Legs / Upper / Lower / Custom)',
      'High-speed set, repetition, and weight tracking with previous-session PR hints',
      'Automated floating rest timer with subtle haptic vibration triggers',
      'Exercise history library and muscle recovery guidelines',
    ],
  },
  {
    id: 'nutrition',
    name: 'Nutrition & Macro Analytics',
    shortName: 'Nutrition',
    tagline: 'Caloric Targets, Macro Rings & Water Tracker',
    category: 'Health',
    accent: '#D97706',
    accentTint: '#FBBF24',
    icon: Utensils,
    bulletPoints: [
      'Dynamic circular macro distribution rings (Protein, Carbohydrates, Healthy Fats)',
      'Target calorie burn vs intake budget with visual surplus/deficit indicators',
      'One-tap water intake logger with daily hydration goal progress',
      'Meal category logs (Breakfast, Lunch, Dinner, Post-Workout Snacks)',
    ],
  },
  {
    id: 'spending',
    name: 'Financial Ledger & Budgets',
    shortName: 'Finance',
    tagline: 'Envelope Budgeting, Categories & Spending Velocity',
    category: 'Finance',
    accent: '#15803D',
    accentTint: '#4ADE80',
    icon: Wallet,
    bulletPoints: [
      'Monthly budget envelope tracking with real-time remaining allowance calculation',
      'Categorized expense tagging (Food, Transit, Bills, Health, Books, Entertainment)',
      'Spending velocity charts illustrating weekly burn rate vs monthly cap',
      '100% private and offline: zero bank credential access or telemetry scraping',
    ],
  },
  {
    id: 'vault',
    name: 'Biometric Secure Vault',
    shortName: 'Vault',
    tagline: 'Hardware Biometrics & Encrypted Local Storage',
    category: 'Security',
    accent: '#2034A0',
    accentTint: '#818CF8',
    icon: Lock,
    bulletPoints: [
      'Hardware-level biometric unlock (Fingerprint / Face ID) via Android BiometricPrompt',
      'Fallback secure PIN encryption with automated lock timeout on app backgrounding',
      'Encrypted vault for recovery keys, sensitive passwords, private credentials, and confidential notes',
      'Isolated sandbox: credentials never leave the device hardware',
    ],
  },
  {
    id: 'timetable',
    name: 'Weekly Timetable & Schedule',
    shortName: 'Timetable',
    tagline: 'Period Matrix, Room Locator & Background Alarms',
    category: 'Academics',
    accent: '#0891B2',
    accentTint: '#22D3EE',
    icon: Calendar,
    bulletPoints: [
      '7-day multi-period timetable grid with room numbers and professor credits',
      'Android WorkManager notification alarms dispatched 10-15 mins before lectures',
      'Real-time "Upcoming Class" countdown card directly on Home dashboard',
      'Home screen widget synchronization for viewing today\'s schedule at a glance',
    ],
  },
  {
    id: 'tasks',
    name: 'Priority Tasks & To-Do',
    shortName: 'Tasks',
    tagline: 'Eisenhower Matrix & Tactile Haptic Completion',
    category: 'Productivity',
    accent: '#7C3AED',
    accentTint: '#A78BFA',
    icon: ListTodo,
    bulletPoints: [
      'Eisenhower prioritization badges (High, Medium, Normal, Backlog)',
      'Category filtering (Work, Academic, Personal, Errands) with quick-entry drawer',
      'Tactile haptic completion with fluid celebratory micro-interactions',
      'Overdue deadline warnings and recurring task rollover',
    ],
  },
  {
    id: 'notes',
    name: 'Notes & Creative Ideas Board',
    shortName: 'Notes',
    tagline: 'Masonry Board, Paper Textures & Tag Taxonomy',
    category: 'Creativity',
    accent: '#8436E9',
    accentTint: '#C084FC',
    icon: FileText,
    bulletPoints: [
      'Masonry grid and compact list view with live search & instant filtering',
      'Lined notebook and grid paper textures tailored for reading and quick memos',
      'Color-coded taxonomy tags for separating project brainstorming from class notes',
      'Autosave engine with instant local storage commit',
    ],
  },
  {
    id: 'shopping',
    name: 'Categorized Shopping Lists',
    shortName: 'Shopping',
    tagline: 'Grouped Aisles & Strike-Through Checklist',
    category: 'Lifestyle',
    accent: '#254BB5',
    accentTint: '#93C5FD',
    icon: ShoppingBag,
    bulletPoints: [
      'Aisle and category grouping (Produce, Dairy, Pantry, Fitness Supplements)',
      'Instant strike-through checkbox status with haptic feedback while shopping',
      'Estimated total cart budget calculation before reaching the checkout counter',
      'One-tap list sharing for family or roommates',
    ],
  },
  {
    id: 'outings',
    name: 'Outings & Trip Itinerary Planner',
    shortName: 'Outings',
    tagline: 'Day-by-Day Schedules, Packing & Split Costs',
    category: 'Lifestyle',
    accent: '#8C500A',
    accentTint: '#C88A58',
    icon: Compass,
    bulletPoints: [
      'Multi-day itinerary timeline with spot schedules and navigation links',
      'Luggage & essential packing checklist with completion percentage meter',
      'Group expense logging with automatic per-person split calculator',
      'Emergency contacts and location bookmarking',
    ],
  },
  {
    id: 'laundry',
    name: 'Laundry Cycle Monitor',
    shortName: 'Laundry',
    tagline: 'Machine Timers & Push Notification Dispatch',
    category: 'Utility',
    accent: '#0D9488',
    accentTint: '#2DD4BF',
    icon: Clock,
    bulletPoints: [
      'Dedicated Washer and Dryer cycle countdown timers with quick presets',
      'Android native local notification dispatch when machine cycles complete',
      'Detergent reorder reminders and load cycle statistics',
      'Prevents forgotten wet clothes with persistent notification alerts',
    ],
  },
  {
    id: 'history',
    name: 'Career & Work History',
    shortName: 'History',
    tagline: 'Chronological Timeline & Milestone Badges',
    category: 'Career',
    accent: '#8C1D40',
    accentTint: '#D66FA0',
    icon: Briefcase,
    bulletPoints: [
      'Interactive career milestone timeline tracking promotions and deliverables',
      'Project portfolio showcase with tech stack tags and impact metrics',
      'Skill acquisition tracker logging engineering competencies',
      'One-click export ready for portfolio and CV synchronizations',
    ],
  },
  {
    id: 'colors',
    name: 'Material 3 Color Families',
    shortName: 'Theming',
    tagline: 'OKLab ΔE Mathematical Separation Customizer',
    category: 'Personalization',
    accent: '#2563EB',
    accentTint: '#8DB0FF',
    icon: Palette,
    bulletPoints: [
      'Powered by @material/material-color-utilities with OKLab ΔE perceptual distance',
      'Personalize any interface with curated color families (Royal Blue, Emerald, Amethyst, Amber, etc.)',
      'Guarantees WCAG AAA text contrast across both day and night dynamic transitions',
      'Live in-app swatch preview with instant persistence',
    ],
  },
];

// Interactive Gemini AI Demo Prompts
const GEMINI_PROMPTS = [
  {
    title: 'Workout Split',
    prompt: 'Plan a 4-day hypertrophy split balancing chest and back',
    response: 'Here is your optimal 4-day split:\n• Day 1 (Push): Incline DB Press 4x8, Dips 3x10, Lateral Raises 4x15\n• Day 2 (Pull): Barbell Rows 4x8, Lat Pulldowns 3x10, Facepulls 4x15\n• Day 3 (Rest / Light Cardio): 30m brisk walk & mobility\n• Day 4 (Legs & Arms): Squats 4x8, RDLs 3x10, Bicep/Tricep superset 3x12.',
  },
  {
    title: 'Study Schedule',
    prompt: 'Structure a 3-hour deep work block for Algorithms',
    response: 'Recommended 180-min Pomodoro sequence:\n• Block 1 (50m): Dynamic Programming recurrence relations\n• Rest (10m): Hydrate, avoid screen\n• Block 2 (50m): LeetCode Medium problem solving (Graph BFS/DFS)\n• Rest (10m): Quick walk\n• Block 3 (50m): Review mistakes & write summary notes in Notes Hub.',
  },
  {
    title: 'Macro Target',
    prompt: 'Calculate daily macros for 75kg athlete in caloric deficit',
    response: 'For a moderate 350 kcal deficit:\n• Daily Calories: 2,100 kcal\n• Protein: 165g (31%) — Preserves lean muscle mass\n• Carbohydrates: 210g (40%) — Fuels intense training\n• Healthy Fats: 65g (29%) — Supports hormonal balance & recovery.',
  },
  {
    title: 'Weekly Budget',
    prompt: 'Help me allocate a monthly student allowance of $600',
    response: 'Suggested 50/30/20 envelope allocation:\n• Groceries & Food: $280 ($70/week)\n• Academic & Transit: $120 (Metro pass + books)\n• Social & Outings: $100 ($25/weekend)\n• Emergency Savings: $100 (Direct to Vault reserve).',
  },
];

export default function DownloadPage({ theme = 'dark', setTheme }: DownloadPageProps) {
  const [activeModule, setActiveModule] = useState<ModuleId>('home');
  const [isDarkLocal, setIsDarkLocal] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  // Interactive Focus Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60 - 24);
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

  // Interactive Workout Sets State
  const [gymSets, setGymSets] = useState([
    { id: 1, name: 'Bench Press', reps: '10 reps', weight: '80 kg', done: true },
    { id: 2, name: 'Bench Press', reps: '8 reps', weight: '85 kg', done: true },
    { id: 3, name: 'Bench Press', reps: '6 reps', weight: '90 kg', done: false },
    { id: 4, name: 'Incline Dumbbell', reps: '12 reps', weight: '28 kg', done: false },
  ]);

  const toggleGymSet = (id: number) => {
    setGymSets(prev => prev.map(s => s.id === id ? { ...s, done: !s.done } : s));
  };

  // Interactive Gemini Assistant Sandbox
  const [activeGeminiIndex, setActiveGeminiIndex] = useState(0);
  const [geminiCustomQuery, setGeminiCustomQuery] = useState('');
  const [isGeminiGenerating, setIsGeminiGenerating] = useState(false);
  const [geminiDisplayResponse, setGeminiDisplayResponse] = useState(GEMINI_PROMPTS[0].response);

  const handleSelectGeminiPrompt = (index: number) => {
    setActiveGeminiIndex(index);
    setIsGeminiGenerating(true);
    setTimeout(() => {
      setGeminiDisplayResponse(GEMINI_PROMPTS[index].response);
      setIsGeminiGenerating(false);
    }, 350);
  };

  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiCustomQuery.trim()) return;
    setIsGeminiGenerating(true);
    setTimeout(() => {
      setGeminiDisplayResponse(
        `Gemini AI Analysis for "${geminiCustomQuery.trim()}":\n• Action 1: Scheduled automatic reminder into your LifeOS Timetable.\n• Action 2: Calculated nutrition & calorie impact (+120 kcal adjustment).\n• Action 3: Added milestone checkpoint to Tasks with High Priority tag.`
      );
      setIsGeminiGenerating(false);
      setGeminiCustomQuery('');
    }, 450);
  };

  // Interactive Subscription Calculator
  const [subs, setSubs] = useState<Record<string, { cost: number; name: string; checked: boolean }>>({
    gym: { name: 'Workout Logger Pro', cost: 12, checked: true },
    study: { name: 'Pomodoro & Heatmap App', cost: 7, checked: true },
    budget: { name: 'Budget & Finance Tracker', cost: 9, checked: true },
    timetable: { name: 'Schedule & Routine Manager', cost: 5, checked: true },
    vault: { name: 'Encrypted Password Vault', cost: 6, checked: true },
  });

  const toggleSub = (key: string) => {
    setSubs(prev => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked },
    }));
  };

  const monthlySavings = Object.values(subs).reduce((acc, s) => s.checked ? acc + s.cost : acc, 0);
  const yearlySavings = monthlySavings * 12;

  // Real-time Phone Clock
  const [phoneTime, setPhoneTime] = useState('09:41');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setPhoneTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Modals & Clipboard
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const SHA_256_HASH = '342d3989f63029cccff5b99f5c5ea68b9e48e9a00513cd6d665c5fbfabe81f69';
  const APK_DOWNLOAD_URL = 'https://lifeos-gujjeti-avineeshs-projects.vercel.app/LifeOS.apk';
  const LIVE_WEB_URL = 'https://lifeos-gujjeti-avineeshs-projects.vercel.app/';

  const copySha = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(SHA_256_HASH);
      setCopiedSha(true);
      setTimeout(() => setCopiedSha(false), 2000);
    }
  };

  const copyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const toggleTheme = () => {
    const next = !isDarkLocal;
    setIsDarkLocal(next);
    if (setTheme) {
      setTheme(next ? 'dark' : 'light');
    } else if (typeof document !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const currentMod = useMemo(() => {
    return MODULES.find(m => m.id === activeModule) || MODULES[0];
  }, [activeModule]);

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-600/30 transition-colors duration-300 ${isDarkLocal ? 'bg-[#090A0F] text-[#F3F4F8]' : 'bg-[#F8F9FD] text-[#131418]'}`}>
      
      {/* ── Android 17 / Gemini Ambient System Glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[140px] opacity-35 transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${currentMod.accent} 0%, #7C3AED 40%, transparent 75%)`,
          }}
        />
        <div 
          className="absolute top-[60%] right-[-10%] w-[650px] h-[650px] rounded-full blur-[160px] opacity-25"
          style={{ background: 'radial-gradient(circle, #0891B2 0%, #2563EB 50%, transparent 70%)' }}
        />
      </div>

      {/* ── Top Navigation Bar: Android 17 System Chip + Controls ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.08] dark:border-white/[0.08] bg-white/70 dark:bg-[#090A0F]/75 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Android 17 Gemini Chip */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-600/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#0E111A] rounded-[14px] flex items-center justify-center">
                <Sparkles size={20} className="text-blue-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight font-heading">LifeOS</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/20 uppercase tracking-wider">
                  v2.1.3
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                <Bot size={12} className="text-indigo-400" />
                <span>Android 17 • Gemini AI Ambient Engine</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Dock */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 hover:scale-105 transition-all"
            >
              {isDarkLocal ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <a
              href={LIVE_WEB_URL}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white/60 dark:bg-zinc-900/60 text-xs font-bold hover:border-blue-500/50 transition-all"
            >
              <Eye size={14} className="text-blue-500" />
              <span>Try Live Web App</span>
            </a>

            <a
              href={APK_DOWNLOAD_URL}
              download="LifeOS.apk"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all"
            >
              <Download size={15} />
              <span>Download APK</span>
            </a>
          </div>

        </div>
      </header>

      {/* ── Hero Section: Material 3 Expressive & Android 17 Intelligence ── */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto text-center space-y-8">
        
        {/* Android 17 Ambient Pill */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-rose-500/10 border border-blue-500/25 text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm"
        >
          <Bot size={14} className="text-purple-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Android 17 Ready • Material 3 Expressive • Gemini AI Ambient Intelligence</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.08] font-heading"
        >
          Your Entire Daily Life,{' '}
          <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-rose-500 bg-clip-text text-transparent">
            Engineered Into One
          </span>{' '}
          Operating System.
        </motion.h1>

        {/* Hero Description */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed"
        >
          Consolidate your workouts, academics, nutrition, financial budget, weekly timetable, biometric vault, 
          and task matrix into a single, offline-first native mobile application. Zero subscription paywalls. Zero telemetry tracking.
        </motion.p>

        {/* Hero Action CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
        >
          <a
            href={APK_DOWNLOAD_URL}
            download="LifeOS.apk"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all"
          >
            <Download size={20} />
            <span>Download Signed APK (13.7 MB)</span>
          </a>

          <button
            onClick={() => setShowQrModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 font-bold text-sm text-zinc-800 dark:text-zinc-200 hover:border-blue-500/50 hover:scale-105 transition-all shadow-sm"
          >
            <QrCode size={18} className="text-blue-500" />
            <span>Scan Mobile QR</span>
          </button>

          <button
            onClick={copyLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-blue-500 transition-all"
          >
            <Share2 size={16} />
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </motion.div>

        {/* Feature Pills */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60">
            <CheckCircle2 size={14} className="text-emerald-500" /> 100% Offline-First
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60">
            <ShieldCheck size={14} className="text-blue-500" /> SHA-256 Verified
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60">
            <Zap size={14} className="text-amber-500" /> 120 FPS Fluid Motion
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-800/60">
            <Bot size={14} className="text-purple-500" /> Gemini AI Engine
          </span>
        </div>

      </section>

      {/* ── Android 17 Gemini AI Ambient Intelligence Playground ── */}
      <section className="relative z-10 py-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="p-6 sm:p-10 rounded-[32px] bg-gradient-to-br from-indigo-950/40 via-zinc-900/90 to-zinc-950/90 border border-indigo-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-6">
          
          {/* Subtle Ambient Halo */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] bg-indigo-600/20 pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                <span className="text-xs font-black tracking-widest uppercase text-indigo-400 font-tag">
                  Ambient Intelligence Core
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-heading">
                Integrated with Gemini AI
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Experience context-aware intelligence that proactively synthesizes your daily schedule, workout loads, and study blocks.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold shrink-0 self-start sm:self-auto">
              <Cpu size={14} className="text-indigo-400" />
              <span>Android 17 Ambient Assistant</span>
            </div>
          </div>

          {/* Interactive Prompt Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Tap to test real Gemini outputs:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GEMINI_PROMPTS.map((gp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectGeminiPrompt(idx)}
                  className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all ${
                    activeGeminiIndex === idx
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                      : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60 hover:border-indigo-500/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] opacity-80">
                    <Sparkles size={12} />
                    <span>{gp.title}</span>
                  </div>
                  <div className="line-clamp-2 text-[11px] font-normal leading-tight opacity-90">
                    "{gp.prompt}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live AI Response Display */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#090A10] border border-indigo-500/30 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800/80 pb-2">
              <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                <Bot size={14} /> Gemini Intelligence Output
              </span>
              <span className="text-[10px] text-zinc-500">Zero latency • Offline context</span>
            </div>
            
            <div className="text-zinc-200 leading-relaxed whitespace-pre-line min-h-[90px] flex items-center">
              {isGeminiGenerating ? (
                <div className="flex items-center gap-2 text-indigo-400 py-4">
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Synthesizing routines and neural data...</span>
                </div>
              ) : (
                geminiDisplayResponse
              )}
            </div>
          </div>

          {/* Custom Prompt Box */}
          <form onSubmit={handleCustomQuery} className="flex gap-2">
            <input
              type="text"
              value={geminiCustomQuery}
              onChange={(e) => setGeminiCustomQuery(e.target.value)}
              placeholder="Ask Gemini AI anything about your daily routine, workouts, or timetable..."
              className="flex-1 px-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isGeminiGenerating}
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-indigo-600/30"
            >
              <Sparkles size={14} />
              <span>Ask AI</span>
            </button>
          </form>

        </div>
      </section>

      {/* ── Interactive 14-Module Showcase: Material 3 Expressive Architecture ── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
        
        {/* Section Heading */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-extrabold uppercase tracking-wider">
            <Layers size={14} />
            <span>Complete Functional Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-heading">
            Every Module Engineered to Perfection
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base">
            LifeOS includes 14 specialized, deeply integrated interfaces. Select any module below to inspect its features and interactive live mockup.
          </p>
        </div>

        {/* Horizontal Module Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start lg:justify-center px-2">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const isSel = m.id === activeModule;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  isSel
                    ? 'text-white shadow-lg shadow-blue-600/25 scale-105'
                    : 'bg-zinc-200/70 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:border-zinc-500/40 border border-transparent'
                }`}
                style={{
                  backgroundColor: isSel ? m.accent : undefined,
                }}
              >
                <Icon size={14} />
                <span>{m.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Module View Card */}
        <div className="p-6 sm:p-10 rounded-[36px] bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-xl grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Feature Highlights */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="space-y-2">
              <span 
                className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block"
                style={{
                  backgroundColor: `${currentMod.accent}20`,
                  color: currentMod.accent,
                }}
              >
                {currentMod.category}
              </span>
              <h3 className="text-2xl sm:text-4xl font-black tracking-tight font-heading">
                {currentMod.name}
              </h3>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                {currentMod.tagline}
              </p>
            </div>

            {/* Bullet Points */}
            <div className="space-y-3 pt-2">
              {currentMod.bulletPoints.map((bp, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${currentMod.accent}25`, color: currentMod.accent }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {bp}
                  </span>
                </div>
              ))}
            </div>

            {/* Try Interactive Action in Mockup */}
            <div className="pt-2 text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <Sparkles size={14} style={{ color: currentMod.accent }} />
              <span>Try the live interactive controls on the right phone frame 👉</span>
            </div>
          </div>

          {/* Right Column: Interactive Phone Mockup Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[310px] sm:w-[330px] rounded-[48px] p-3.5 bg-zinc-950 border-[6px] border-zinc-800 shadow-2xl shadow-black/60 relative overflow-hidden text-left">
              
              {/* Phone Speaker & Dynamic Island Camera */}
              <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-950" />
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 px-3 pb-2 border-b border-zinc-800/60 font-mono">
                <span>{phoneTime}</span>
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Wifi size={11} />
                  <Battery size={11} />
                </div>
              </div>

              {/* Mockup Screen Canvas */}
              <div className="p-3.5 bg-[#0C0E14] text-white rounded-[32px] min-h-[420px] flex flex-col justify-between space-y-4">
                
                {/* Header within screen */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: currentMod.accent }}
                    >
                      <currentMod.icon size={15} />
                    </div>
                    <span className="font-extrabold text-xs tracking-tight">{currentMod.shortName}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold font-mono">
                    ONLINE
                  </span>
                </div>

                {/* Module-Specific Live Interactive Preview */}
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  
                  {/* STUDY INTERACTIVE PREVIEW */}
                  {activeModule === 'study' && (
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-cyan-500/30 text-center space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        {isTimerRunning ? 'FOCUS SESSION ACTIVE' : 'POMODORO TIMER'}
                      </div>
                      <div className="text-4xl font-black font-mono tracking-tight text-white">
                        {formatTimer(timerSeconds)}
                      </div>
                      <p className="text-[10px] text-zinc-400">Subject: Operating Systems</p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsTimerRunning(!isTimerRunning)}
                          className="px-4 py-1.5 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center gap-1 shadow-md hover:bg-cyan-500"
                        >
                          {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
                          <span>{isTimerRunning ? 'Pause' : 'Start Focus'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsTimerRunning(false); setTimerSeconds(25 * 60); }}
                          className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
                        >
                          <RotateCcw size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* GYM INTERACTIVE PREVIEW */}
                  {activeModule === 'gym' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-400">
                        <span>PUSH DAY (Chest/Tri)</span>
                        <span>Rest: 90s</span>
                      </div>
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                        {gymSets.map(set => (
                          <div 
                            key={set.id}
                            onClick={() => toggleGymSet(set.id)}
                            className={`p-2 rounded-xl border flex items-center justify-between text-[11px] cursor-pointer transition-all ${
                              set.done ? 'bg-rose-500/15 border-rose-500/40 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            <div>
                              <div className="font-bold">{set.name}</div>
                              <div className="text-[10px] opacity-75">{set.weight} • {set.reps}</div>
                            </div>
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${set.done ? 'bg-rose-600 border-rose-500 text-white' : 'border-zinc-700'}`}>
                              {set.done && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-500 text-center">Tap any set to toggle completion</p>
                    </div>
                  )}

                  {/* NUTRITION PREVIEW */}
                  {activeModule === 'nutrition' && (
                    <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-3 text-center">
                      <div className="text-[10px] font-bold text-amber-400">DAILY CALORIE BUDGET</div>
                      <div className="text-3xl font-black font-mono">1,840 <span className="text-xs text-zinc-500 font-sans">/ 2,200 kcal</span></div>
                      <div className="grid grid-cols-3 gap-1.5 text-[10px] pt-1">
                        <div className="p-1.5 rounded-xl bg-zinc-800/80">
                          <div className="text-rose-400 font-bold">142g</div>
                          <div className="text-zinc-500">Protein</div>
                        </div>
                        <div className="p-1.5 rounded-xl bg-zinc-800/80">
                          <div className="text-amber-400 font-bold">185g</div>
                          <div className="text-zinc-500">Carbs</div>
                        </div>
                        <div className="p-1.5 rounded-xl bg-zinc-800/80">
                          <div className="text-emerald-400 font-bold">54g</div>
                          <div className="text-zinc-500">Fats</div>
                        </div>
                      </div>
                      <div className="text-[10px] text-blue-400 font-semibold flex items-center justify-center gap-1">
                        <span>💧 Water: 2.8L / 3.5L Target</span>
                      </div>
                    </div>
                  )}

                  {/* DEFAULT / OTHER MODULES MOCKUP DISPLAY */}
                  {activeModule !== 'study' && activeModule !== 'gym' && activeModule !== 'nutrition' && (
                    <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentMod.accent }} />
                        <span className="text-xs font-bold text-zinc-200">{currentMod.name}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-300 space-y-1">
                        <div className="font-semibold text-white">Active System Snapshot</div>
                        <div className="text-[10px] text-zinc-400">
                          Real-time hardware synchronized state with Android WorkManager.
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: '78%', backgroundColor: currentMod.accent }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                        <span>Status: 100% Synced</span>
                        <span>0ms Latency</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Divided Navigation Dock in Mockup */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center gap-4 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                    <Compass size={14} className="text-blue-500" />
                    <Dumbbell size={14} />
                    <Utensils size={14} />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
                    <Layers size={14} />
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

      </section>

      {/* ── Subscription Fatigue Calculator ── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-[36px] bg-gradient-to-b from-zinc-900 to-[#0A0B10] border border-zinc-800 shadow-2xl text-left space-y-8">
          
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              Zero Subscription Fatigue
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-heading">
              Replace 5 Separate Paid Subscriptions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Most productivity platforms charge $5–$15 per month for fitness trackers, Pomodoro timers, and budgeting apps. LifeOS consolidates them all under one high-performance, free open-source APK.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            
            {/* Toggleable Checklist */}
            <div className="space-y-2.5">
              {Object.entries(subs).map(([key, s]) => (
                <div
                  key={key}
                  onClick={() => toggleSub(key)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    s.checked ? 'bg-zinc-800/80 border-emerald-500/40 text-white' : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border ${s.checked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-zinc-700'}`}>
                      {s.checked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <span className="text-xs font-bold">{s.name}</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-zinc-400">${s.cost}/mo</span>
                </div>
              ))}
            </div>

            {/* Total Savings Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Money Saved</span>
              <div className="text-5xl sm:text-6xl font-black text-white font-mono">
                ${yearlySavings}
                <span className="text-lg text-emerald-400 font-sans block">/ year</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                By sideloading LifeOS directly onto your Android device, you get a clean, lifetime operating system without recurring monthly fees.
              </p>
              <div className="pt-2">
                <a
                  href={APK_DOWNLOAD_URL}
                  download="LifeOS.apk"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Download size={14} />
                  <span>Download LifeOS Free</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 3-Step Sideloading & Installation Walkthrough ── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        
        <div className="text-center space-y-3">
          <span className="text-xs font-black uppercase tracking-wider text-blue-500 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            Installation Walkthrough
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-heading">
            How to Install on Android in 30 Seconds
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            Android allows direct APK installation. Here are the 3 quick steps to sideload LifeOS onto your device safely.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 relative shadow-sm">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/30">
              1
            </span>
            <h4 className="text-base font-black">Download APK</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Tap the <strong>Download APK</strong> button. Your mobile browser will fetch the signed <strong>LifeOS.apk</strong> package (14.4 MB).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 relative shadow-sm">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/30">
              2
            </span>
            <h4 className="text-base font-black">Allow Unknown Source</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Chrome may display a standard prompt: <em>"File might be harmful"</em>. Tap <strong>Download anyway</strong> (Android standard notice for all direct non-store APKs).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 relative shadow-sm">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-600/30">
              3
            </span>
            <h4 className="text-base font-black">Tap Install & Launch</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Open the downloaded file from notifications or your Downloads app, tap <strong>Install</strong>, and launch your personalized LifeOS!
            </p>
          </div>

        </div>

        {/* SHA-256 Checksum Card */}
        <div className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-zinc-600 dark:text-zinc-300">
            <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
            <div>
              <span className="font-bold">Cryptographic Integrity Checksum (SHA-256):</span>
              <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 break-all select-all pt-0.5">
                {SHA_256_HASH}
              </div>
            </div>
          </div>
          <button
            onClick={copySha}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs shrink-0 flex items-center gap-1.5 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
          >
            <Copy size={13} />
            <span>{copiedSha ? 'Copied!' : 'Copy Hash'}</span>
          </button>
        </div>

      </section>

      {/* ── Final Call to Action ── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-4xl mx-auto text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-[40px] bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-rose-600/20 border border-blue-500/30 shadow-2xl backdrop-blur-xl space-y-6">
          
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-600/40">
            <Sparkles size={28} />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-heading">
            Upgrade to LifeOS Today
          </h2>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto">
            Take command of your day with genuine Material 3 Expressive motion and Gemini AI ambient intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={APK_DOWNLOAD_URL}
              download="LifeOS.apk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-base shadow-xl shadow-blue-600/40 transition-all hover:scale-105 active:scale-95"
            >
              <Download size={18} />
              <span>Download LifeOS.apk (v2.1.3)</span>
            </a>

            <button
              onClick={() => setShowQrModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-sm hover:border-blue-500/50 transition-all"
            >
              <QrCode size={16} className="text-blue-500" />
              <span>Mobile QR Code</span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Android 8.0+ Required • ARM64 / Universal Build • 100% Free & Open Source
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-10 border-t border-zinc-200/80 dark:border-zinc-800/80 text-center text-xs text-zinc-500 space-y-2">
        <p className="font-bold text-zinc-700 dark:text-zinc-300">
          LifeOS — Your Daily Routine, Engineered.
        </p>
        <p className="text-[11px]">
          Crafted with Material 3 Expressive, Capacitor 8, and Gemini AI by Gujjeti Avineesh.
        </p>
      </footer>

      {/* ── Mobile QR Code Modal ── */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center max-w-sm w-full space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center mx-auto">
                <QrCode size={24} />
              </div>

              <h3 className="text-lg font-black text-zinc-900 dark:text-white font-heading">
                Scan with Phone Camera
              </h3>

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Aim your phone camera at the QR code below to download the APK directly on your device.
              </p>

              {/* QR Image via public QR server */}
              <div className="p-4 rounded-2xl bg-white flex items-center justify-center border border-zinc-200 w-48 h-48 mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(APK_DOWNLOAD_URL)}`}
                  alt="LifeOS Download QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-[11px] font-mono text-zinc-400 break-all select-all">
                {APK_DOWNLOAD_URL}
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 font-bold text-xs hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
