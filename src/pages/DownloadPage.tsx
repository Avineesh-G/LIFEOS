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
  Layers, 
  Calendar, 
  Check, 
  ExternalLink,
  QrCode, 
  Share2, 
  Play, 
  Pause, 
  RotateCcw, 
  Wifi, 
  Battery, 
  X, 
  Copy, 
  Cpu, 
  Bot, 
  Compass, 
  Palette, 
  Briefcase, 
  ListTodo, 
  ShoppingBag, 
  RefreshCw, 
  Eye, 
  FileText,
  Mic,
  Brain,
  ChevronRight,
  ShieldAlert,
  Flame,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DownloadPageProps {
  theme?: string;
  setTheme?: (t: any) => void;
  accentColor?: string;
}

type ModuleId = 
  | 'home' 
  | 'gym' 
  | 'nutrition' 
  | 'study' 
  | 'flow'
  | 'recall'
  | 'transcribe'
  | 'timetable' 
  | 'spending' 
  | 'outings' 
  | 'tasks' 
  | 'notes' 
  | 'shopping' 
  | 'laundry' 
  | 'vault' 
  | 'colors'
  | 'luna';

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

const THEME_PALETTES = [
  { id: 'burgundy', name: 'Burgundy', primary: '#8B1E3F', secondary: '#B82E58', darkText: '#5A0B22' },
  { id: 'deep-navy', name: 'Deep Navy', primary: '#183B5B', secondary: '#2C5784', darkText: '#0E2338' },
  { id: 'emerald', name: 'Emerald', primary: '#087F5B', secondary: '#12B886', darkText: '#05523A' },
  { id: 'plum', name: 'Plum', primary: '#6A1B6D', secondary: '#9C27B0', darkText: '#451047' },
  { id: 'indigo', name: 'Indigo', primary: '#4936A3', secondary: '#6741D9', darkText: '#2F2070' },
  { id: 'terracotta', name: 'Terracotta', primary: '#A84A32', secondary: '#D95B3B', darkText: '#702D1E' },
  { id: 'teal', name: 'Teal', primary: '#087F83', secondary: '#15AABF', darkText: '#055356' },
  { id: 'rose', name: 'Rose', primary: '#A83F5D', secondary: '#D64E77', darkText: '#702339' },
  { id: 'mocha', name: 'Mocha', primary: '#765548', secondary: '#966B5A', darkText: '#4A342B' },
  { id: 'slate', name: 'Slate', primary: '#53616D', secondary: '#738494', darkText: '#343E47' },
];

const MODULES: ModuleConfig[] = [
  {
    id: 'home',
    name: 'Home Intelligence & Rhythm',
    shortName: 'Home',
    tagline: 'Ambient Circadian Lighting & Unified Daily Feed',
    category: 'Core System',
    accent: '#8B1E3F',
    accentTint: '#B82E58',
    icon: Compass,
    bulletPoints: [
      'Circadian day phases smoothly adapting surface tones across Dawn, Morning, Dusk, and Night',
      'Morning Battle Plan briefing synthesizing today\'s classes, target calories, and priorities',
      'Unified lifestyle feed with scheduled workout split, urgent task pills, and live date chips',
      'Marquee motivation ticker with continuous high-performance mindset quotes',
    ],
  },
  {
    id: 'gym',
    name: 'Hypertrophy Gym & Split Architect',
    shortName: 'Gym',
    tagline: 'Set Logger, 1RM Engine & Floating Rest Timer',
    category: 'Fitness',
    accent: '#E11D48',
    accentTint: '#FB7185',
    icon: Dumbbell,
    bulletPoints: [
      'Split Architect with PPL, Upper/Lower, Cardio, or fully customizable 7-day routine builder',
      'High-speed set, repetition, and weight tracking with previous-session PR hints & RPE metrics',
      'Automated floating rest timer with tactile haptic completion feedback',
      'Automated 1RM Brzycki formula calculation and historical exercise progression curves',
    ],
  },
  {
    id: 'nutrition',
    name: 'Nutrition & Campus Fuel Engine',
    shortName: 'Nutrition',
    tagline: 'Calorie Rings, Campus Mess Schedules & Water HUD',
    category: 'Health',
    accent: '#D97706',
    accentTint: '#FBBF24',
    icon: Utensils,
    bulletPoints: [
      'Circular macro distribution rings (Protein, Carbohydrates, Healthy Fats) with deficit targets',
      'Pre-configured campus mess schedules (Breakfast, Lunch, Snacks, Dinner, Night Canteen)',
      'One-tap water hydration tracker with daily target progress (+250ml / +500ml quick increments)',
      'Meal category logs with macronutrient percentage breakdown and surplus guardrails',
    ],
  },
  {
    id: 'study',
    name: 'Study Hub & Focus Engine',
    shortName: 'Study',
    tagline: 'Subject Analytics, Deep Work & Annual Heatmaps',
    category: 'Academics',
    accent: '#0891B2',
    accentTint: '#38BDF8',
    icon: BookOpen,
    bulletPoints: [
      'Customizable focus intervals with subject tagging and deep work duration tracking',
      'GitHub-style 365-day annual study heatmap visualizing year-round discipline',
      'Subject-wise session breakdowns, revision velocity, and exam countdowns',
      'Hardware-synced study session logger with zero background battery overhead',
    ],
  },
  {
    id: 'flow',
    name: 'Flow Room & Soundscapes',
    shortName: 'Flow Room',
    tagline: 'Zero-Download Audio Synthesis & Ambient Immersion',
    category: 'Focus',
    accent: '#6366F1',
    accentTint: '#818CF8',
    icon: Zap,
    bulletPoints: [
      'Client-side Web Audio API synthesizer for zero-download noise generation',
      'Ambient audio soundscapes: Binaural Beats (Alpha/Beta focus), Pure Brown Noise, and Rain',
      'Full-screen minimalist Pomodoro timer designed for zero distraction and pure flow',
      'Auto-resumes and suspends audio context cleanly on route change',
    ],
  },
  {
    id: 'recall',
    name: 'Active Recall Flashcards',
    shortName: 'Recall',
    tagline: 'Spaced Repetition Decks & Self-Rating Engine',
    category: 'Academics',
    accent: '#8B5CF6',
    accentTint: '#C4B5FD',
    icon: Brain,
    bulletPoints: [
      'Spaced repetition algorithm scheduling cards based on mastery rating (Again, Hard, Good, Easy)',
      'Clean flashcard popups with distraction-free flipping and gesture ratings',
      'Deck organization by university courses, technical subjects, and certification modules',
      'Retain 2x more knowledge with scientifically proven active recall scheduling',
    ],
  },
  {
    id: 'transcribe',
    name: 'Smart Voice Transcriber',
    shortName: 'Transcribe',
    tagline: 'Speech-to-Text Lectures & Instant AI Summaries',
    category: 'Productivity',
    accent: '#EC4899',
    accentTint: '#F472B6',
    icon: Mic,
    bulletPoints: [
      'Live speech-to-text recording engine for university lectures, meetings, and brainstorming',
      'Instant AI bullet-point summarization extracting key takeaways and action items',
      'One-tap export directly into Notes & Ideas board or Eisenhower tasks',
      'Hardware microphone level visualizer with pause, resume, and audio waveform feedback',
    ],
  },
  {
    id: 'timetable',
    name: 'College Timetable & Matrix',
    shortName: 'Timetable',
    tagline: 'Period Matrix, Room Locator & Notification Alarms',
    category: 'Academics',
    accent: '#0D9488',
    accentTint: '#2DD4BF',
    icon: Calendar,
    bulletPoints: [
      '7-day multi-period timetable grid with lecture rooms, instructors, and credits',
      'Android native WorkManager alarms dispatched 10-15 minutes prior to classes',
      'Real-time "Upcoming Lecture" countdown pill directly on Home dashboard',
      'Clean horizontal scrollable period view with active lecture time-highlighting',
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
      'Categorized expense tagging (Food, Transit, Bills, Books, Entertainment, Health)',
      'Spending velocity charts illustrating weekly burn rate vs monthly cap',
      '100% private and offline: zero bank credential access or telemetry scraping',
    ],
  },
  {
    id: 'outings',
    name: 'Outings & Trip Expense Splitter',
    shortName: 'Outings',
    tagline: 'Day-by-Day Itineraries, Packing & Group Debt Settler',
    category: 'Lifestyle',
    accent: '#A84A32',
    accentTint: '#D95B3B',
    icon: Compass,
    bulletPoints: [
      'Multi-day trip itinerary timeline with location spots and packing checklist',
      'Group expense logging with automated net settlement matrix (who owes whom)',
      'One-tap clipboard payment summary ready to paste into WhatsApp / Telegram groups',
      'Standard clean vertical view layout with instant offline sync',
    ],
  },
  {
    id: 'tasks',
    name: 'Priority Tasks & Eisenhower HUD',
    shortName: 'Tasks',
    tagline: 'Eisenhower Matrix & Tactile Haptic Completion',
    category: 'Productivity',
    accent: '#7C3AED',
    accentTint: '#A78BFA',
    icon: ListTodo,
    bulletPoints: [
      'Eisenhower prioritization quadrants (Urgent & Important, Plan, Delegate, Backlog)',
      'Category filtering (Work, Academic, Personal, Errands) with rapid quick-entry drawer',
      'Tactile haptic completion with fluid celebratory micro-interactions',
      'Overdue deadline warnings and automated recurring task rollover',
    ],
  },
  {
    id: 'notes',
    name: 'Notes & Creative Ideas Board',
    shortName: 'Notes',
    tagline: 'Masonry Board, Paper Textures & Tag Taxonomy',
    category: 'Creativity',
    accent: '#9333EA',
    accentTint: '#C084FC',
    icon: FileText,
    bulletPoints: [
      'Dual-view rich markdown note-taking with live search & instant tag filtering',
      'Lined notebook and grid paper textures tailored for reading and quick memos',
      'Color-coded taxonomy tags for separating project brainstorming from class notes',
      'Autosave engine with instant local storage commit',
    ],
  },
  {
    id: 'shopping',
    name: 'Categorized Shopping Lists',
    shortName: 'Shopping',
    tagline: 'Aisle Grouping, Estimated Cart & Checklists',
    category: 'Lifestyle',
    accent: '#2563EB',
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
    id: 'laundry',
    name: 'Hostel Laundry Cycle Monitor',
    shortName: 'Laundry',
    tagline: 'Washer & Dryer Timers with Local Push Alerts',
    category: 'Utility',
    accent: '#087F83',
    accentTint: '#15AABF',
    icon: Clock,
    bulletPoints: [
      'Dedicated Washer and Dryer cycle countdown timers with quick presets',
      'Android native local notification dispatch when machine cycles complete',
      'Detergent reorder reminders and load cycle statistics',
      'Prevents forgotten wet clothes with persistent notification alerts',
    ],
  },
  {
    id: 'vault',
    name: 'Biometric Hardware Vault',
    shortName: 'Vault',
    tagline: 'Hardware Biometrics & AES-256-GCM Encryption',
    category: 'Security',
    accent: '#183B5B',
    accentTint: '#818CF8',
    icon: Lock,
    bulletPoints: [
      'Hardware-level biometric unlock (Fingerprint / Face ID) via AndroidX BiometricPrompt',
      'AES-256-GCM client-side encryption with PBKDF2 key derivation for private credentials',
      'Auto-lock timeout protection whenever the app leaves the foreground',
      'Completely isolated sandbox: sensitive vault data never leaves local device hardware',
    ],
  },
  {
    id: 'colors',
    name: 'Material 3 Color Engine',
    shortName: 'Theming',
    tagline: '10 Curated Palettes & True OLED Pure Black',
    category: 'Personalization',
    accent: '#8B1E3F',
    accentTint: '#B82E58',
    icon: Palette,
    bulletPoints: [
      '10 mathematically balanced color families (Burgundy, Deep Navy, Emerald, Plum, etc.)',
      'True OLED Pure Black (#000000) base with liquid glass tonal card elevation',
      'Guarantees WCAG AAA contrast across both day and night dynamic transitions',
      'Live in-app swatch preview with instant persistence and zero restart required',
    ],
  },
  {
    id: 'luna',
    name: 'Luna AI Autonomous Core',
    shortName: 'Luna AI',
    tagline: 'Speech-to-Action Parser & Neural Daily Briefs',
    category: 'Intelligence',
    accent: '#F59E0B',
    accentTint: '#FCD34D',
    icon: Bot,
    bulletPoints: [
      'Autonomous action execution: turns spoken sentences into structured database mutations',
      'Action Confirmation Cards allowing 1-tap review before logging workouts, tasks, or expenses',
      'Daily Briefing synthesizer reviewing calendar, upcoming deadlines, and calorie targets',
      'Natural language Brain Dump parser categorizing unstructured thoughts automatically',
    ],
  },
];

// Interactive Luna AI Prompts
const LUNA_PROMPTS = [
  {
    title: 'Workout Log',
    prompt: 'Log 4 sets of Incline Dumbbell Press at 32kg for 8 reps with RPE 8',
    response: '🤖 Luna AI Action Prepared:\n• Action: LOG_WORKOUT\n• Exercise: Incline Dumbbell Press\n• Sets: 4 sets × 8 reps @ 32 kg (RPE 8.0)\n• Estimated 1RM: 40.5 kg (Brzycki)\n• Target Rest: 90s countdown initialized.\n[Action Ready to Commit to Local DB]',
  },
  {
    title: 'Study Deep Work',
    prompt: 'Block 90 minutes of Operating Systems focus with brown noise',
    response: '🤖 Luna AI Action Prepared:\n• Action: START_FLOW_SESSION\n• Duration: 90 Minutes (2 × 45m Pomodoro cycles)\n• Subject: Operating Systems (Virtual Memory & Paging)\n• Soundscape: Pure Brown Noise (Synthesizing via Web Audio)\n• Timetable Conflict Check: Clear until 15:30 lecture.',
  },
  {
    title: 'Mess Nutrition',
    prompt: 'Log college mess dinner: 3 rotis, paneer curry, and dal with 500ml water',
    response: '🤖 Luna AI Action Prepared:\n• Action: LOG_MEAL\n• Category: Dinner (Campus Mess)\n• Estimated Macros: 680 kcal | 28g Protein | 82g Carbs | 24g Fat\n• Daily Calorie Goal Progress: 1,940 / 2,200 kcal (88%)\n• Water HUD: +500ml logged (Total today: 3.1L / 3.5L target).',
  },
  {
    title: 'Outing Expense',
    prompt: 'Paid 1400 rupees for group dinner at cafe with Rohan, Vikram, and me',
    response: '🤖 Luna AI Action Prepared:\n• Action: LOG_OUTING_EXPENSE\n• Outing: Weekend Cafe Trip\n• Amount: ₹1,400 paid by You\n• Split: ₹466.67 each (Rohan, Vikram, You)\n• Balance Matrix: Rohan owes ₹467, Vikram owes ₹467.\n• Clipboard summary generated for WhatsApp group.',
  },
];

export default function DownloadPage({ theme = 'dark', setTheme }: DownloadPageProps) {
  const [activeModule, setActiveModule] = useState<ModuleId>('home');
  const [selectedAccent, setSelectedAccent] = useState(THEME_PALETTES[0]); // Burgundy default
  const [isDarkLocal, setIsDarkLocal] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  // Dynamic Version Manifest Hydration
  const [manifest, setManifest] = useState({
    versionName: '3.3.2',
    versionCode: 69,
    releaseDate: '2026-10-26',
    apkSize: '8.93 MB',
    apkSizeBytes: 9361966,
    sha256: '5dde67a98741b1b6368e1f312682cfdbe63355c90aeb2d6b1b4db5faa73cc34a',
    releaseNotes: '• Layout Restoration across Outings, Nutrition, Shopping Lists, and Laundry\n• Native Stability: 100% stable, jitter-free navigation\n• Full 120fps Performance: Optimized memory footprint',
    apkUrl: 'https://lifeos-gujjeti-avineeshs-projects.vercel.app/LifeOS.apk',
  });

  useEffect(() => {
    fetch('/version.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.versionName) {
          setManifest(data);
        }
      })
      .catch(() => {});
  }, []);

  // Interactive Focus Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60 - 15);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
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
    { id: 1, name: 'Incline DB Press', reps: '10 reps', weight: '32 kg', done: true },
    { id: 2, name: 'Incline DB Press', reps: '8 reps', weight: '34 kg', done: true },
    { id: 3, name: 'Incline DB Press', reps: '8 reps', weight: '34 kg', done: false },
    { id: 4, name: 'Weighted Dips', reps: '12 reps', weight: '+15 kg', done: false },
  ]);

  const toggleGymSet = (id: number) => {
    setGymSets((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
  };

  // Interactive Tasks State
  const [interactiveTasks, setInteractiveTasks] = useState([
    { id: 1, text: 'Submit Operating Systems Lab 4', priority: 'Urgent', done: true },
    { id: 2, text: 'Review Spaced Repetition Flashcards', priority: 'High', done: false },
    { id: 3, text: 'Laundry dryer cycle pickup', priority: 'Medium', done: false },
  ]);

  const toggleTask = (id: number) => {
    setInteractiveTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  // Interactive Luna Assistant Sandbox
  const [activeLunaIndex, setActiveLunaIndex] = useState(0);
  const [lunaCustomQuery, setLunaCustomQuery] = useState('');
  const [isLunaGenerating, setIsLunaGenerating] = useState(false);
  const [lunaDisplayResponse, setLunaDisplayResponse] = useState(LUNA_PROMPTS[0].response);

  const handleSelectLunaPrompt = (index: number) => {
    setActiveLunaIndex(index);
    setIsLunaGenerating(true);
    setTimeout(() => {
      setLunaDisplayResponse(LUNA_PROMPTS[index].response);
      setIsLunaGenerating(false);
    }, 300);
  };

  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lunaCustomQuery.trim()) return;
    setIsLunaGenerating(true);
    setTimeout(() => {
      setLunaDisplayResponse(
        `🤖 Luna Autonomous Engine Analysis for "${lunaCustomQuery.trim()}":\n• Parsed Intent: MULTI_MODULE_MUTATION\n• Action 1: Dispatched high-priority checkpoint into Tasks Matrix.\n• Action 2: Calculated nutrition & calorie impact (+140 kcal adjustment).\n• Action 3: Synced local Android WorkManager reminder with 0ms latency.\n[Committed to offline IndexedDB]`
      );
      setIsLunaGenerating(false);
      setLunaCustomQuery('');
    }, 400);
  };

  // Interactive Subscription Calculator
  const [subs, setSubs] = useState<Record<string, { cost: number; name: string; checked: boolean }>>({
    gym: { name: 'Hypertrophy Workout Logger', cost: 12, checked: true },
    study: { name: 'Pomodoro & Heatmap Pro', cost: 7, checked: true },
    nutrition: { name: 'Macro Counter & Diet App', cost: 14, checked: true },
    transcribe: { name: 'AI Voice Lecture Transcriber', cost: 10, checked: true },
    budget: { name: 'Finance & Splitter App', cost: 8, checked: true },
    vault: { name: 'Encrypted Password Vault', cost: 6, checked: true },
  });

  const toggleSub = (key: string) => {
    setSubs((prev) => ({
      ...prev,
      [key]: { ...prev[key], checked: !prev[key].checked },
    }));
  };

  const monthlySavings = Object.values(subs).reduce((acc, s) => (s.checked ? acc + s.cost : acc), 0);
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

  const copySha = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(manifest.sha256);
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
    return MODULES.find((m) => m.id === activeModule) || MODULES[0];
  }, [activeModule]);

  return (
    <div 
      className={`min-h-screen font-sans selection:bg-rose-500/30 transition-colors duration-300 ${
        isDarkLocal ? 'bg-[#000000] text-[#F3F4F8]' : 'bg-[#F8F9FA] text-[#131418]'
      }`}
      style={{
        // Inject active accent as CSS variable
        ['--theme-accent' as any]: selectedAccent.primary,
        ['--theme-accent-tint' as any]: selectedAccent.secondary,
      }}
    >
      
      {/* ── Ambient Radial Atmosphere Glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[1000px] h-[650px] rounded-full blur-[140px] opacity-30 transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${selectedAccent.primary} 0%, rgba(139, 30, 63, 0.4) 40%, transparent 75%)`,
          }}
        />
        <div 
          className="absolute top-[65%] right-[-10%] w-[650px] h-[650px] rounded-full blur-[160px] opacity-20"
          style={{ 
            background: `radial-gradient(circle, ${selectedAccent.secondary} 0%, rgba(20, 20, 25, 0.8) 50%, transparent 70%)` 
          }}
        />
      </div>

      {/* ── Top Navigation Bar: Liquid Glass Bar ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] dark:border-white/[0.08] bg-white/80 dark:bg-[#000000]/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Version Badge */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl p-0.5 shadow-lg flex items-center justify-center transition-colors"
              style={{
                background: `linear-gradient(135deg, ${selectedAccent.primary}, ${selectedAccent.secondary})`,
                boxShadow: `0 8px 24px -4px ${selectedAccent.primary}40`,
              }}
            >
              <div className="w-full h-full bg-[#0C0E14] rounded-[14px] flex items-center justify-center p-1">
                <img src="/icon.svg" width="22" height="22" alt="LifeOS Logo" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight font-heading">LifeOS</span>
                <span 
                  className="text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider"
                  style={{
                    backgroundColor: `${selectedAccent.primary}20`,
                    borderColor: `${selectedAccent.primary}40`,
                    color: selectedAccent.secondary,
                  }}
                >
                  v{manifest.versionName} (Build {manifest.versionCode})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                <Bot size={12} style={{ color: selectedAccent.secondary }} />
                <span>Material 3 Expressive • Luna AI Core</span>
              </div>
            </div>
          </div>

          {/* Center: Accent Color Selector Swatches (Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-1">Accent:</span>
            {THEME_PALETTES.slice(0, 6).map((pal) => (
              <button
                key={pal.id}
                onClick={() => setSelectedAccent(pal)}
                aria-label={`Select ${pal.name} theme`}
                className={`w-5 h-5 rounded-full transition-transform ${
                  selectedAccent.id === pal.id ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-110 opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: pal.primary }}
              />
            ))}
          </div>

          {/* Quick Actions Dock */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-10 h-10 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:scale-105 transition-all"
            >
              {isDarkLocal ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <a
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 text-xs font-bold hover:border-zinc-500 transition-all"
            >
              <Eye size={14} style={{ color: selectedAccent.secondary }} />
              <span>Launch Web App</span>
            </a>

            <a
              href={manifest.apkUrl}
              download="LifeOS.apk"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-extrabold text-xs sm:text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
              style={{
                backgroundColor: selectedAccent.primary,
                boxShadow: `0 8px 24px -4px ${selectedAccent.primary}60`,
              }}
            >
              <Download size={15} />
              <span>Download APK</span>
            </a>
          </div>

        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto text-center space-y-8">
        
        {/* Release Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-bold shadow-sm"
          style={{
            backgroundColor: `${selectedAccent.primary}15`,
            borderColor: `${selectedAccent.primary}35`,
            color: selectedAccent.secondary,
          }}
        >
          <Sparkles size={14} />
          <span>v{manifest.versionName} Released • True OLED Pure Black • 120 FPS Fluid Motion</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-5xl mx-auto leading-[1.08] font-heading"
        >
          Your Entire Daily Life,{' '}
          <span 
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(135deg, ${selectedAccent.secondary}, #FFFFFF 70%)`,
            }}
          >
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
          Consolidate your hypertrophy fitness, nutrition & mess meals, deep work pomodoros, college timetable, 
          expense budgeting, biometric vault, and Luna AI autonomous action execution into a single, offline-first 
          native mobile application. Zero subscription paywalls. Zero telemetry tracking.
        </motion.p>

        {/* Hero Action CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
        >
          <a
            href={manifest.apkUrl}
            download="LifeOS.apk"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-white font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-all"
            style={{
              backgroundColor: selectedAccent.primary,
              boxShadow: `0 12px 32px -4px ${selectedAccent.primary}60`,
            }}
          >
            <Download size={20} />
            <span>Download Signed APK ({manifest.apkSize})</span>
          </a>

          <button
            onClick={() => setShowQrModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 font-bold text-sm text-zinc-800 dark:text-zinc-200 hover:scale-105 transition-all shadow-sm"
          >
            <QrCode size={18} style={{ color: selectedAccent.secondary }} />
            <span>Scan Mobile QR</span>
          </button>

          <button
            onClick={copyLink}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-white transition-all"
          >
            <Share2 size={16} />
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
        </motion.div>

        {/* Feature Pills */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">
            <CheckCircle2 size={14} className="text-emerald-500" /> 100% Offline-First
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">
            <ShieldCheck size={14} className="text-blue-500" /> SHA-256 Verified
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">
            <Zap size={14} className="text-amber-500" /> 120 FPS Fluid Motion
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">
            <Bot size={14} style={{ color: selectedAccent.secondary }} /> Luna AI Core
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800">
            <Lock size={14} className="text-indigo-400" /> Hardware Biometrics
          </span>
        </div>

      </section>

      {/* ── Interactive Luna AI Autonomous Playground ── */}
      <section className="relative z-10 py-12 px-4 sm:px-6 max-w-5xl mx-auto">
        <div 
          className="p-6 sm:p-10 rounded-[32px] border shadow-2xl relative overflow-hidden space-y-6"
          style={{
            backgroundColor: isDarkLocal ? '#0E1017' : '#FFFFFF',
            borderColor: `${selectedAccent.primary}40`,
          }}
        >
          {/* Subtle Ambient Halo */}
          <div 
            className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-25"
            style={{ backgroundColor: selectedAccent.primary }}
          />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ backgroundColor: selectedAccent.secondary }}
                />
                <span 
                  className="text-xs font-black tracking-widest uppercase font-tag"
                  style={{ color: selectedAccent.secondary }}
                >
                  Autonomous Intelligence Engine
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-heading">
                Luna AI Action Core
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Experience voice-to-action parsing that transforms natural spoken prompts into structured, offline local database transactions.
              </p>
            </div>
            <div 
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold shrink-0 self-start sm:self-auto"
              style={{
                backgroundColor: `${selectedAccent.primary}20`,
                borderColor: `${selectedAccent.primary}40`,
                color: selectedAccent.secondary,
              }}
            >
              <Cpu size={14} />
              <span>Offline-First Autonomous Agent</span>
            </div>
          </div>

          {/* Interactive Prompt Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Tap to test real Luna action execution:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LUNA_PROMPTS.map((lp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLunaPrompt(idx)}
                  className={`p-3 rounded-2xl text-left border text-xs font-bold transition-all ${
                    activeLunaIndex === idx
                      ? 'text-white shadow-md'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-500'
                  }`}
                  style={{
                    backgroundColor: activeLunaIndex === idx ? selectedAccent.primary : undefined,
                    borderColor: activeLunaIndex === idx ? selectedAccent.secondary : undefined,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] opacity-80">
                    <Sparkles size={12} />
                    <span>{lp.title}</span>
                  </div>
                  <div className="line-clamp-2 text-[11px] font-normal leading-tight opacity-90">
                    "{lp.prompt}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live AI Response Display */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#05060A] border border-zinc-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-zinc-800/80 pb-2">
              <span className="flex items-center gap-1.5 font-bold" style={{ color: selectedAccent.secondary }}>
                <Bot size={14} /> Luna Neural Pipeline Output
              </span>
              <span className="text-[10px] text-zinc-500">Zero telemetry • Offline context</span>
            </div>
            
            <div className="text-zinc-200 leading-relaxed whitespace-pre-line min-h-[90px] flex items-center">
              {isLunaGenerating ? (
                <div className="flex items-center gap-2 py-4" style={{ color: selectedAccent.secondary }}>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Parsing natural language parameters into structured JSON...</span>
                </div>
              ) : (
                lunaDisplayResponse
              )}
            </div>
          </div>

          {/* Custom Prompt Box */}
          <form onSubmit={handleCustomQuery} className="flex gap-2">
            <input
              type="text"
              value={lunaCustomQuery}
              onChange={(e) => setLunaCustomQuery(e.target.value)}
              placeholder="Give Luna an action command (e.g. 'Add 500 pushups this week' or 'Log $15 taxi ride')..."
              className="flex-1 px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isLunaGenerating}
              className="px-5 py-3 rounded-2xl text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md disabled:opacity-50"
              style={{
                backgroundColor: selectedAccent.primary,
              }}
            >
              <Sparkles size={14} />
              <span>Execute</span>
            </button>
          </form>

        </div>
      </section>

      {/* ── Complete 17-Module Architecture Showcase ── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
        
        {/* Section Heading */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div 
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-extrabold uppercase tracking-wider"
            style={{
              backgroundColor: `${selectedAccent.primary}15`,
              borderColor: `${selectedAccent.primary}30`,
              color: selectedAccent.secondary,
            }}
          >
            <Layers size={14} />
            <span>Complete Unified Workspace</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-heading">
            Every Aspect of Daily Life, Solved.
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base">
            LifeOS integrates 17 dedicated interfaces. Select any module below to inspect its features and live interactive preview.
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
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-zinc-200/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-500/40 border border-transparent'
                }`}
                style={{
                  backgroundColor: isSel ? m.accent : undefined,
                  boxShadow: isSel ? `0 6px 20px -4px ${m.accent}60` : undefined,
                }}
              >
                <Icon size={14} />
                <span>{m.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Detailed Module View Card */}
        <div className="p-6 sm:p-10 rounded-[36px] bg-white dark:bg-[#0D0F16] border border-zinc-200 dark:border-zinc-800 shadow-xl grid lg:grid-cols-12 gap-8 items-center">
          
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

            {/* Interactive hint */}
            <div className="pt-2 text-xs font-bold text-zinc-400 flex items-center gap-1.5">
              <Sparkles size={14} style={{ color: currentMod.accent }} />
              <span>Interact with the live module controls in the phone frame below</span>
            </div>
          </div>

          {/* Right Column: Interactive Phone Mockup Frame */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[310px] sm:w-[330px] rounded-[48px] p-3.5 bg-zinc-950 border-[6px] border-zinc-800 shadow-2xl relative overflow-hidden text-left">
              
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
              <div className="p-3.5 bg-[#000000] text-white rounded-[32px] min-h-[420px] flex flex-col justify-between space-y-4">
                
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
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold font-mono">
                    120 FPS
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

                  {/* FLOW ROOM AUDIO PREVIEW */}
                  {activeModule === 'flow' && (
                    <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center space-y-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center justify-center gap-1">
                        <Zap size={12} /> Flow Room Active
                      </div>
                      <div className="text-2xl font-black font-mono text-white">Binaural Beats (Alpha 10Hz)</div>
                      <p className="text-[10px] text-zinc-400">Zero-download client Web Audio synthesis</p>
                      <div className="flex justify-center gap-1.5 pt-1">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-600/30 text-indigo-300 text-[10px] font-bold">Rain</span>
                        <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold">Alpha Wave</span>
                        <span className="px-2.5 py-1 rounded-full bg-indigo-600/30 text-indigo-300 text-[10px] font-bold">Brown Noise</span>
                      </div>
                    </div>
                  )}

                  {/* GYM INTERACTIVE PREVIEW */}
                  {activeModule === 'gym' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-400">
                        <span>PUSH HYPERTROPHY</span>
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
                        <span>Water: 2.8L / 3.5L Target</span>
                      </div>
                    </div>
                  )}

                  {/* TASKS INTERACTIVE PREVIEW */}
                  {activeModule === 'tasks' && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Priority Matrix</div>
                      <div className="space-y-1.5">
                        {interactiveTasks.map(task => (
                          <div 
                            key={task.id}
                            onClick={() => toggleTask(task.id)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] cursor-pointer transition-all ${
                              task.done ? 'bg-purple-950/20 border-purple-500/40 opacity-60 line-through' : 'bg-zinc-900 border-zinc-800'
                            }`}
                          >
                            <span className="font-medium text-white">{task.text}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                              {task.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-zinc-500 text-center">Tap to toggle completion</p>
                    </div>
                  )}

                  {/* DEFAULT / OTHER MODULES MOCKUP DISPLAY */}
                  {activeModule !== 'study' && activeModule !== 'flow' && activeModule !== 'gym' && activeModule !== 'nutrition' && activeModule !== 'tasks' && (
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
                        <div className="h-full rounded-full" style={{ width: '84%', backgroundColor: currentMod.accent }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                        <span>Status: 100% Offline</span>
                        <span>0ms Latency</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Divided Navigation Dock in Mockup */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center gap-4 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                    <Compass size={14} style={{ color: selectedAccent.secondary }} />
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

      {/* ── Visual UI Gallery Showcase ── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span 
            className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border"
            style={{
              backgroundColor: `${selectedAccent.primary}15`,
              borderColor: `${selectedAccent.primary}30`,
              color: selectedAccent.secondary,
            }}
          >
            Real UI Exposure
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-heading">
            Authentic Screen Previews
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Engineered exclusively with clean vector iconography, Google Sans Flex variable typography, and liquid glass cards.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Compass size={20} />
            </div>
            <h4 className="text-base font-black">Home Intelligence HUD</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Circadian day phases that adapt lighting automatically, live class countdowns, scheduled workout splits, and habit dots.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Dumbbell size={20} />
            </div>
            <h4 className="text-base font-black">Hypertrophy Fitness Tracker</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Split Architect for PPL and custom routines, live set recording with previous session PR hints, and automated rest timers.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Utensils size={20} />
            </div>
            <h4 className="text-base font-black">Nutrition & Mess Meal Plans</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Calorie and macro distribution rings paired with pre-configured college mess menus for breakfast, lunch, snacks, and dinner.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <h4 className="text-base font-black">Pomodoro & 365-Day Heatmap</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Deep work timer with subject logs and an annual GitHub-style consistency grid visualizing everyday discipline.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Lock size={20} />
            </div>
            <h4 className="text-base font-black">Biometric Hardware Vault</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Native fingerprint & face unlock via AndroidX BiometricPrompt protecting client-side AES-256 encrypted passwords & notes.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm hover:border-zinc-700 transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <h4 className="text-base font-black">Finance & Trip Bill Splitter</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Daily spending envelopes with weekly burn velocity and group trip split calculators generating instant WhatsApp payment texts.
            </p>
          </div>

        </div>
      </section>

      {/* ── Subscription Fatigue Calculator ── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-[36px] bg-gradient-to-b from-zinc-900 to-[#000000] border border-zinc-800 shadow-2xl text-left space-y-8">
          
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              Zero Subscription Fatigue
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-heading">
              Replace 6 Disconnected Paid Subscriptions
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Most productivity utilities charge $6–$14 per month individually. LifeOS unifies them all into one private, hardware-accelerated, free open-source APK.
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
                By sideloading LifeOS directly onto your Android device, you gain a lifetime personal operating system without monthly paywalls or forced accounts.
              </p>
              <div className="pt-2">
                <a
                  href={manifest.apkUrl}
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
          <span 
            className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border"
            style={{
              backgroundColor: `${selectedAccent.primary}15`,
              borderColor: `${selectedAccent.primary}30`,
              color: selectedAccent.secondary,
            }}
          >
            Installation Walkthrough
          </span>
          <h2 className="text-3xl sm:text-4xl font-black font-heading">
            How to Install on Android in 30 Seconds
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            Android natively supports direct APK installation. Follow these 3 easy steps to install LifeOS safely.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 relative shadow-sm">
            <span 
              className="w-8 h-8 rounded-full text-white flex items-center justify-center font-black text-sm shadow-md"
              style={{ backgroundColor: selectedAccent.primary }}
            >
              1
            </span>
            <h4 className="text-base font-black">Download APK</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Tap the <strong>Download APK</strong> button. Your mobile browser will fetch the signed <strong>LifeOS.apk</strong> package ({manifest.apkSize}).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 relative shadow-sm">
            <span 
              className="w-8 h-8 rounded-full text-white flex items-center justify-center font-black text-sm shadow-md"
              style={{ backgroundColor: selectedAccent.primary }}
            >
              2
            </span>
            <h4 className="text-base font-black">Tap "Download Anyway"</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Chrome may display a standard notice: <em>"File might be harmful"</em>. Tap <strong>Download anyway</strong> (Android standard notice for all direct non-store APKs).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 relative shadow-sm">
            <span 
              className="w-8 h-8 rounded-full text-white flex items-center justify-center font-black text-sm shadow-md"
              style={{ backgroundColor: selectedAccent.primary }}
            >
              3
            </span>
            <h4 className="text-base font-black">Tap Install & Launch</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Open the downloaded file from notifications or Downloads, tap <strong>Install</strong>, and launch your personalized LifeOS!
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
                {manifest.sha256}
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
        <div 
          className="p-8 sm:p-12 rounded-[40px] border shadow-2xl backdrop-blur-xl space-y-6"
          style={{
            backgroundColor: isDarkLocal ? '#090B10' : '#FFFFFF',
            borderColor: `${selectedAccent.primary}40`,
          }}
        >
          <div 
            className="w-14 h-14 rounded-2xl text-white flex items-center justify-center mx-auto shadow-xl"
            style={{
              backgroundColor: selectedAccent.primary,
              boxShadow: `0 8px 24px -4px ${selectedAccent.primary}60`,
            }}
          >
            <Sparkles size={28} />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight font-heading">
            Upgrade to LifeOS Today
          </h2>

          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto">
            Take command of your day with genuine Material 3 Expressive motion and Luna AI autonomous intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={manifest.apkUrl}
              download="LifeOS.apk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-white font-black text-base shadow-xl transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: selectedAccent.primary,
                boxShadow: `0 10px 28px -4px ${selectedAccent.primary}60`,
              }}
            >
              <Download size={18} />
              <span>Download LifeOS.apk (v{manifest.versionName})</span>
            </a>

            <button
              onClick={() => setShowQrModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-bold text-sm hover:border-zinc-500 transition-all"
            >
              <QrCode size={16} style={{ color: selectedAccent.secondary }} />
              <span>Mobile QR Code</span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Android 8.0+ Required • ARM64 Universal Build • 100% Free & Open Source
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-10 border-t border-zinc-200/80 dark:border-zinc-800/80 text-center text-xs text-zinc-500 space-y-2">
        <p className="font-bold text-zinc-700 dark:text-zinc-300">
          LifeOS — The Unified Personal Operating System.
        </p>
        <p className="text-[11px]">
          Crafted with Material 3 Expressive, Liquid Glass, Capacitor 8, and Luna AI Core by Gujjeti Avineesh.
        </p>
      </footer>

      {/* ── Mobile QR Code Modal ── */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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

              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: `${selectedAccent.primary}20`,
                  color: selectedAccent.secondary,
                }}
              >
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
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(manifest.apkUrl)}`}
                  alt="LifeOS Download QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-[11px] font-mono text-zinc-400 break-all select-all">
                {manifest.apkUrl}
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
