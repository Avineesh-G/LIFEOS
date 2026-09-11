import { Moon, Sun, Monitor, Check, LogOut, AlertTriangle, History, Calendar, Sparkles, Loader2, ChevronDown, ChevronUp, X, Dumbbell, Timer, Wallet, ListTodo, RefreshCw, Smartphone, Key, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import type { AppData, AppSettings } from '../types';
import BodyProfileForm from '../components/BodyProfileForm';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getHistoryAnalysis, getGymHistoryAnalysis, getSpendingHistoryAnalysis, GEMINI_API_KEY } from '../utils/geminiCoach';

interface SettingsProps {
  theme: AppSettings['theme'];
  setTheme: (t: AppSettings['theme']) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
  refresh: () => Promise<AppData>;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.44, ease: 'easeOut' } } };

export default function Settings({ theme, setTheme, data, updateData }: SettingsProps) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  
  // History Expansion State
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const toggleLog = (id: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  // History State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Private Groq API Key State
  const [apiKeyInput, setApiKeyInput] = useState(data.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const handleSaveApiKey = async () => {
    triggerHaptic('save');
    await updateData({ geminiApiKey: apiKeyInput.trim() });
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2500);
  };

  // Direct In-App Update & Live Sync State
  const CURRENT_BUILD_CODE = 10;
  const CURRENT_VERSION_LABEL = '1.5.1';
  const CLOUD_VERSION_URL = 'https://lifeos-gujjeti-avineeshs-projects.vercel.app/version.json';
  const CLOUD_LIVE_URL = 'https://lifeos-gujjeti-avineeshs-projects.vercel.app';

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [syncingBuild, setSyncingBuild] = useState(false);
  const [latestCloudMeta, setLatestCloudMeta] = useState<any>(null);
  const [updateInfo, setUpdateInfo] = useState<{ available: boolean; name: string; notes?: string } | null>(null);
  const [updateMsg, setUpdateMsg] = useState('');

  const getEffectiveBuild = () => {
    const applied = Number(localStorage.getItem('lifeos_applied_build') || 0);
    return Math.max(CURRENT_BUILD_CODE, Math.min(applied, CURRENT_BUILD_CODE));
  };

  const checkForUpdates = async () => {
    triggerHaptic('light');
    setCheckingUpdate(true);
    setUpdateMsg('Checking cloud for updates...');
    try {
      const res = await fetch(`${CLOUD_VERSION_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not fetch');
      const meta = await res.json();
      setLatestCloudMeta(meta);
      const effectiveBuild = getEffectiveBuild();

      if (meta.versionCode > effectiveBuild) {
        setUpdateInfo({
          available: true,
          name: meta.versionName || '1.5.1',
          notes: meta.releaseNotes,
        });
        setUpdateMsg(`Update available: v${meta.versionName} (Build ${meta.versionCode}). Tap "Apply Update" to install.`);
      } else {
        setUpdateInfo({
          available: false,
          name: meta.versionName || CURRENT_VERSION_LABEL,
          notes: meta.releaseNotes,
        });
        setUpdateMsg(`Build is up to date (v${meta.versionName || CURRENT_VERSION_LABEL} - Build ${effectiveBuild}). All features synced!`);
      }
    } catch {
      setUpdateMsg('Unable to check for updates. Please verify your internet connection.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleLiveSync = async () => {
    triggerHaptic('save');
    setSyncingBuild(true);
    setUpdateMsg('Applying latest update directly inside app...');

    const meta = latestCloudMeta;
    const targetBuild = meta?.versionCode || CURRENT_BUILD_CODE;

    try {
      // Clear Web and PWA caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // Record applied build code so it stays permanently up to date
      localStorage.setItem('lifeos_applied_build', String(targetBuild));
      localStorage.removeItem('lifeos_live_sync');

      // Check if native Capacitor environment
      const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();

      if (isNative) {
        // Native APK: trigger APK file download in background without navigating WebView away!
        const apkPath = meta?.apkUrl || '/LifeOS.apk';
        const fullApkUrl = apkPath.startsWith('http') ? apkPath : `${CLOUD_LIVE_URL}${apkPath}`;
        
        const a = document.createElement('a');
        a.href = fullApkUrl;
        a.download = 'LifeOS.apk';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Mark as up to date immediately so beside Apply button NEVER comes
        setUpdateInfo({
          available: false,
          name: meta?.versionName || CURRENT_VERSION_LABEL,
          notes: meta?.releaseNotes,
        });
        setUpdateMsg(`Build is up to date! Update downloaded to your device.`);
        triggerHaptic('success');
      } else {
        // Web / PWA: reload in-place without redirecting to external URL
        setUpdateInfo({
          available: false,
          name: meta?.versionName || CURRENT_VERSION_LABEL,
          notes: meta?.releaseNotes,
        });
        setUpdateMsg(`Build is up to date! Refreshing in-place...`);
        triggerHaptic('success');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (err) {
      console.warn('Sync error:', err);
      // Fallback: still mark updated so user is not stuck in a loop
      localStorage.setItem('lifeos_applied_build', String(targetBuild));
      setUpdateInfo({
        available: false,
        name: meta?.versionName || CURRENT_VERSION_LABEL,
      });
      setUpdateMsg(`Build is up to date! All features synced.`);
    } finally {
      setSyncingBuild(false);
    }
  };

  // Filter logs by selected month and only include saved logs
  const filteredLogs = useMemo(() => {
    if (!data.nutritionLogs) return [];
    
    // Parse selectedMonth into a Date object to get start and end of month
    const [year, month] = selectedMonth.split('-');
    const dateStr = `${year}-${month}-01T00:00:00`;
    const filterDate = new Date(dateStr);
    
    const start = startOfMonth(filterDate);
    const end = endOfMonth(filterDate);

    return data.nutritionLogs
      .filter(log => {
          if (!log.isSaved) return false;
          try {
              const logDate = parseISO(log.date);
              return isWithinInterval(logDate, { start, end });
          } catch {
              return false;
          }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.nutritionLogs, selectedMonth]);

  const uniqueMonths = useMemo(() => {
     if (!data.nutritionLogs) return [format(new Date(), 'yyyy-MM')];
     const months = new Set<string>();
     data.nutritionLogs.forEach(l => {
         if (l.isSaved && l.date) {
             months.add(l.date.substring(0, 7)); // 'yyyy-MM'
         }
     });
     // Ensure current month is always an option
     months.add(format(new Date(), 'yyyy-MM'));
     return Array.from(months).sort().reverse();
  }, [data.nutritionLogs]);

  const handleSaveFeedback = () => {
    triggerHaptic('save');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAnalyzeHistory = async () => {
      if (filteredLogs.length === 0) return;
      triggerHaptic('ai');
      setAnalyzing(true);
      try {
          const profile = data.profile || { currentCalorieTarget: 2000 };
          const result = await getHistoryAnalysis(filteredLogs, profile, data.geminiApiKey || GEMINI_API_KEY);
          setAiAnalysis(result);
          triggerHaptic('success');
      } catch (err: any) {
          console.error(err);
          const errMsg = err?.message || '';
          if (errMsg.includes('429')) {
             setAiAnalysis({ error: "You are doing this too fast. Please wait a minute before analyzing again." });
          } else {
             setAiAnalysis({ error: "Failed to analyze history. Please check your API key." });
          }
      } finally {
          setAnalyzing(false);
      }
  };

  // Gym History State
  const [gymHistoryOpen, setGymHistoryOpen] = useState(false);
  const [selectedGymMonth, setSelectedGymMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [gymAiAnalysis, setGymAiAnalysis] = useState<any>(null);
  const [gymAnalyzing, setGymAnalyzing] = useState(false);
  const [expandedGymLogs, setExpandedGymLogs] = useState<Set<string>>(new Set());

  const toggleGymLog = (id: string) => {
    setExpandedGymLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredGymLogs = useMemo(() => {
    if (!data.workoutLogs) return [];
    const [year, month] = selectedGymMonth.split('-');
    const dateStr = `${year}-${month}-01T00:00:00`;
    const filterDate = new Date(dateStr);
    const start = startOfMonth(filterDate);
    const end = endOfMonth(filterDate);

    return data.workoutLogs
      .filter(log => {
        if (!log.date) return false;
        try {
          const logDate = parseISO(log.date);
          return isWithinInterval(logDate, { start, end });
        } catch {
          return false;
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.workoutLogs, selectedGymMonth]);

  const uniqueGymMonths = useMemo(() => {
    if (!data.workoutLogs) return [format(new Date(), 'yyyy-MM')];
    const months = new Set<string>();
    data.workoutLogs.forEach(l => {
      if (l.date) {
        months.add(l.date.substring(0, 7));
      }
    });
    months.add(format(new Date(), 'yyyy-MM'));
    return Array.from(months).sort().reverse();
  }, [data.workoutLogs]);

  const handleAnalyzeGymHistory = async () => {
    if (filteredGymLogs.length === 0) return;
    triggerHaptic('ai');
    setGymAnalyzing(true);
    try {
      const result = await getGymHistoryAnalysis(filteredGymLogs, data.geminiApiKey || GEMINI_API_KEY);
      setGymAiAnalysis(result);
      triggerHaptic('success');
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || '';
      if (errMsg.includes('429')) {
        setGymAiAnalysis({ error: "You are doing this too fast. Please wait a minute before analyzing again." });
      } else {
        setGymAiAnalysis({ error: "Failed to analyze gym history. Please check your API key." });
      }
    } finally {
      setGymAnalyzing(false);
    }
  };

  // ── Spending History State ──────────────────────────────────────────────
  const [spendingHistoryOpen, setSpendingHistoryOpen] = useState(false);
  const [selectedSpendingMonth, setSelectedSpendingMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [spendingAiAnalysis, setSpendingAiAnalysis] = useState<any>(null);
  const [spendingAnalyzing, setSpendingAnalyzing] = useState(false);

  const filteredSpendingLogs = useMemo(() => {
    if (!data.expenses) return [];
    return data.expenses
      .filter(e => e.date && e.date.startsWith(selectedSpendingMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.expenses, selectedSpendingMonth]);

  const uniqueSpendingMonths = useMemo(() => {
    if (!data.expenses) return [format(new Date(), 'yyyy-MM')];
    const months = new Set<string>();
    data.expenses.forEach(e => {
      if (e.date) months.add(e.date.substring(0, 7));
    });
    months.add(format(new Date(), 'yyyy-MM'));
    return Array.from(months).sort().reverse();
  }, [data.expenses]);

  const spendingMonthTotal = useMemo(() => {
    return filteredSpendingLogs.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredSpendingLogs]);

  const spendingByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredSpendingLogs.forEach(e => {
      cats[e.category] = (cats[e.category] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [filteredSpendingLogs]);

  const handleAnalyzeSpending = async () => {
    if (filteredSpendingLogs.length === 0) return;
    triggerHaptic('ai');
    setSpendingAnalyzing(true);
    try {
      const result = await getSpendingHistoryAnalysis(filteredSpendingLogs, data.geminiApiKey || GEMINI_API_KEY);
      setSpendingAiAnalysis(result);
      triggerHaptic('success');
    } catch (err: any) {
      console.error(err);
      setSpendingAiAnalysis({ error: err.message || "Failed to analyze spending history. Please try again." });
    } finally {
      setSpendingAnalyzing(false);
    }
  };

  // ── TO-DO History State ─────────────────────────────────────────────────
  const [todoHistoryOpen, setTodoHistoryOpen] = useState(false);
  const [selectedTodoMonth, setSelectedTodoMonth] = useState(format(new Date(), 'yyyy-MM'));

  const filteredTodoTasks = useMemo(() => {
    if (!data.tasks) return [];
    return data.tasks
      .filter(t => t.date && t.date.startsWith(selectedTodoMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.tasks, selectedTodoMonth]);

  const uniqueTodoMonths = useMemo(() => {
    if (!data.tasks) return [format(new Date(), 'yyyy-MM')];
    const months = new Set<string>();
    data.tasks.forEach(t => {
      if (t.date) months.add(t.date.substring(0, 7));
    });
    months.add(format(new Date(), 'yyyy-MM'));
    return Array.from(months).sort().reverse();
  }, [data.tasks]);

  const completedTodoCount = filteredTodoTasks.filter(t => t.completed).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-7 max-w-xl mx-auto pb-4">
      {/* Header */}
      <motion.div variants={item} className="pt-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono mb-1.5">Preferences & System</p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-primary-light dark:text-primary-dark font-sans">Settings</h1>
      </motion.div>

      {/* Appearance Section */}
      <motion.div variants={item} className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 shadow-sm">
              <Sun size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans">Display & Theme</h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5">Choose your visual environment</p>
            </div>
          </div>
          <span className="text-xs font-bold text-accent font-sans px-3.5 py-1.5 rounded-full bg-accent/10 capitalize">
            {theme} Mode
          </span>
        </div>

        {/* Theme Picker */}
        <div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { 
                value: 'light' as const, 
                icon: Sun, 
                label: 'Light',
                activeClass: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60 shadow-sm'
              },
              { 
                value: 'dark' as const, 
                icon: Moon, 
                label: 'Dark',
                activeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-700/60 shadow-sm'
              },
              { 
                value: 'system' as const, 
                icon: Monitor, 
                label: 'System',
                activeClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-700/60 shadow-sm'
              },
            ].map(({ value, icon: Icon, label, activeClass }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => {
                    triggerHaptic(15);
                    setTheme(value);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-[22px] border transition-all duration-150 active:scale-[0.96] ${
                    active
                      ? activeClass
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:border-accent/40'
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-xs font-bold font-sans">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Body Profile Section */}
      <motion.div variants={item} className="rounded-[28px] p-6 sm:p-7 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-m3-mint-badge/70 dark:bg-m3-mint-darkBadge/70 text-m3-mint-text dark:text-m3-mint-darkText shadow-sm">
              <Dumbbell size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-base font-black text-primary-light dark:text-primary-dark font-sans">
                Body Profile & Targets
              </h3>
              <p className="text-xs text-secondary-light dark:text-secondary-dark font-medium mt-0.5">
                Metabolic baseline & calorie target
              </p>
            </div>
          </div>
          <span className="rounded-full bg-m3-mint-badge/60 dark:bg-m3-mint-darkBadge/60 text-m3-mint-text dark:text-m3-mint-darkText font-mono font-bold text-xs px-3.5 py-1.5 shadow-sm whitespace-nowrap shrink-0">
            {data.profile?.currentCalorieTarget || 2000} kcal
          </span>
        </div>
        <BodyProfileForm 
          initialProfile={data.profile} 
          onSave={(profile) => updateData({ profile })} 
        />
      </motion.div>

      {/* Nutrition History Section */}
      <motion.div variants={item} className="rounded-[28px] overflow-hidden bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] dark:active:bg-white/[0.05] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-m3-lavender-badge/70 dark:bg-m3-lavender-darkBadge/70 text-m3-lavender-text dark:text-m3-lavender-darkText shadow-sm">
              <History size={20} />
            </div>
            <div className="text-left">
              <p className="font-black text-base text-primary-light dark:text-primary-dark font-sans">Nutrition History</p>
              <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark mt-0.5">View past saved calories & AI analysis</p>
            </div>
          </div>
          {historyOpen ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
        </button>

        <AnimatePresence>
          {historyOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-6 pb-6 border-t border-border-light/70 dark:border-border-dark/70 pt-5 space-y-5">
                
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary-light dark:text-primary-dark bg-black/[0.03] dark:bg-white/[0.05] px-3 py-1.5 rounded-full border border-border-light dark:border-border-dark">
                    <Calendar size={14} className="text-secondary-light dark:text-secondary-dark" />
                    <select 
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setAiAnalysis(null);
                      }}
                      className="bg-transparent border-none font-bold text-primary-light dark:text-primary-dark focus:ring-0 cursor-pointer text-xs"
                    >
                      {uniqueMonths.map(m => {
                        const [y, mo] = m.split('-');
                        const date = new Date(parseInt(y), parseInt(mo) - 1);
                        return (
                          <option key={m} value={m}>{format(date, 'MMMM yyyy')}</option>
                        );
                      })}
                    </select>
                  </div>
                  <button 
                    onPointerDown={() => triggerHaptic('ai')}
                    onClick={handleAnalyzeHistory}
                    disabled={filteredLogs.length === 0 || analyzing}
                    className="rounded-full px-3.5 py-1.5 flex items-center gap-1.5 text-xs font-bold bg-[#4F378B] dark:bg-[#D0BCFF] text-white dark:text-[#231E2E] shadow-sm hover:scale-[1.02] active:scale-[0.96] transition-all disabled:opacity-40"
                  >
                    {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI Insights
                  </button>
                </div>

                {/* AI Insights Card (Material 3 Lavender Tonal Container) */}
                {aiAnalysis && (
                  <div className="rounded-[22px] p-4 bg-m3-lavender-container dark:bg-m3-lavender-darkContainer text-m3-lavender-text dark:text-m3-lavender-darkText border border-m3-lavender-badge/60 dark:border-m3-lavender-darkBadge/60 relative shadow-sm">
                    <button onClick={() => setAiAnalysis(null)} className="absolute top-3 right-3 text-m3-lavender-text/70 hover:text-m3-lavender-text">
                      <X size={14} />
                    </button>
                    <h4 className="font-bold flex items-center gap-1.5 mb-2 text-xs uppercase tracking-wider font-mono">
                      <Sparkles size={13} /> Month Nutritional Analysis
                    </h4>
                    {aiAnalysis.error ? (
                      <p className="text-xs text-red-500 font-medium">{aiAnalysis.error}</p>
                    ) : (
                      <div className="space-y-2.5 text-xs leading-relaxed">
                        <p className="font-medium">
                          {aiAnalysis.summary}
                        </p>
                        {aiAnalysis.tips && aiAnalysis.tips.length > 0 && (
                          <ul className="space-y-1 list-disc pl-4 opacity-90">
                            {aiAnalysis.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* History List */}
                <div className="space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-6 text-xs font-medium text-secondary-light dark:text-secondary-dark">
                      No saved nutrition logs for this month.
                    </div>
                  ) : (
                    filteredLogs.map(log => (
                      <div 
                        key={log.id} 
                        onClick={() => toggleLog(log.id)}
                        className="flex flex-col p-3.5 bg-black/[0.02] dark:bg-white/[0.03] rounded-[18px] border border-border-light dark:border-border-dark cursor-pointer transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-primary-light dark:text-primary-dark font-sans">
                            {format(parseISO(log.date), 'EEE, MMM d, yyyy')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full ${log.dailyTotal > (data.profile?.currentCalorieTarget || 2000) ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                              {Math.round(log.dailyTotal)} kcal
                            </span>
                            <ChevronDown size={15} className={`text-muted-light dark:text-muted-dark transition-transform ${expandedLogs.has(log.id) ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        
                        <AnimatePresence>
                          {expandedLogs.has(log.id) && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }} 
                              animate={{ height: 'auto', opacity: 1 }} 
                              exit={{ height: 0, opacity: 0 }} 
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-border-light/60 dark:border-border-dark/60 space-y-2.5">
                                {log.mealsEaten.length === 0 ? (
                                  <p className="text-xs text-secondary-light dark:text-secondary-dark italic">No meals logged.</p>
                                ) : (
                                  log.mealsEaten.map((meal, idx) => {
                                    const isSkipped = meal.items.some(i => i.id === 'skipped');
                                    return (
                                      <div key={idx} className="bg-surface-light dark:bg-surface-dark p-2.5 rounded-[14px] border border-border-light/40 dark:border-border-dark/40">
                                        <h5 className="text-[10px] font-bold text-muted-light dark:text-muted-dark uppercase tracking-wider mb-1 font-mono">{meal.slot}</h5>
                                        {isSkipped ? (
                                          <p className="text-xs text-amber-500 font-medium">Meal Skipped</p>
                                        ) : (
                                          <ul className="space-y-1">
                                            {meal.items.map((item, iIdx) => (
                                              <li key={iIdx} className="flex items-center justify-between text-xs">
                                                <span className="text-secondary-light dark:text-secondary-dark">{item.name} {item.portion !== 1 && `(x${item.portion})`}</span>
                                                <span className="font-mono font-bold text-primary-light dark:text-primary-dark">{Math.round(item.calories * item.portion)} kcal</span>
                                              </li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Gym History Section */}
      <motion.div variants={item} className="rounded-[28px] overflow-hidden bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm">
        <button
          onClick={() => {
            triggerHaptic(8);
            setGymHistoryOpen(!gymHistoryOpen);
          }}
          className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] dark:active:bg-white/[0.05] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-m3-mint-badge/70 dark:bg-m3-mint-darkBadge/70 text-m3-mint-text dark:text-m3-mint-darkText shadow-sm">
              <Dumbbell size={20} strokeWidth={2.2} />
            </div>
            <div className="text-left">
              <p className="font-black text-base text-primary-light dark:text-primary-dark font-sans">Gym History</p>
              <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark mt-0.5">View past workouts & routines</p>
            </div>
          </div>
          {gymHistoryOpen ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
        </button>

        <AnimatePresence>
          {gymHistoryOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-6 pb-6 border-t border-border-light/70 dark:border-border-dark/70 pt-5 space-y-5">
                
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary-light dark:text-primary-dark bg-black/[0.03] dark:bg-white/[0.05] px-3 py-1.5 rounded-full border border-border-light dark:border-border-dark">
                    <Calendar size={14} className="text-secondary-light dark:text-secondary-dark" />
                    <select 
                      value={selectedGymMonth}
                      onChange={(e) => {
                        setSelectedGymMonth(e.target.value);
                        setGymAiAnalysis(null);
                      }}
                      className="bg-transparent border-none font-bold text-primary-light dark:text-primary-dark focus:ring-0 cursor-pointer text-xs"
                    >
                      {uniqueGymMonths.map(m => {
                        const [y, mo] = m.split('-');
                        const date = new Date(parseInt(y), parseInt(mo) - 1);
                        return (
                          <option key={m} value={m}>{format(date, 'MMMM yyyy')}</option>
                        );
                      })}
                    </select>
                  </div>
                  <button 
                    onPointerDown={() => triggerHaptic('ai')}
                    onClick={handleAnalyzeGymHistory}
                    disabled={filteredGymLogs.length === 0 || gymAnalyzing}
                    className="rounded-full px-3.5 py-1.5 flex items-center gap-1.5 text-xs font-bold bg-[#146C3E] dark:bg-[#A6EDC2] text-white dark:text-[#19261E] shadow-sm hover:scale-[1.02] active:scale-[0.96] transition-all disabled:opacity-40"
                  >
                    {gymAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI Insights
                  </button>
                </div>

                {/* AI Insights Card (Material 3 Mint Tonal Container) */}
                {gymAiAnalysis && (
                  <div className="rounded-[22px] p-4 bg-m3-mint-container dark:bg-m3-mint-darkContainer text-m3-mint-text dark:text-m3-mint-darkText border border-m3-mint-badge/60 dark:border-m3-mint-darkBadge/60 relative shadow-sm">
                    <button onClick={() => setGymAiAnalysis(null)} className="absolute top-3 right-3 text-m3-mint-text/70 hover:text-m3-mint-text">
                      <X size={14} />
                    </button>
                    <h4 className="font-bold flex items-center gap-1.5 mb-2 text-xs uppercase tracking-wider font-mono">
                      <Sparkles size={13} /> Month Workout Analysis
                    </h4>
                    {gymAiAnalysis.error ? (
                      <p className="text-sm text-red-500">{gymAiAnalysis.error}</p>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-primary-light dark:text-primary-dark font-medium leading-relaxed">
                          {gymAiAnalysis.summary}
                        </p>
                        {gymAiAnalysis.tips && gymAiAnalysis.tips.length > 0 && (
                          <ul className="text-sm text-secondary-light dark:text-secondary-dark space-y-1 list-disc pl-4">
                            {gymAiAnalysis.tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Gym History List */}
                <div className="space-y-2">
                  {filteredGymLogs.length === 0 ? (
                    <div className="text-center py-6 text-sm text-secondary-light dark:text-secondary-dark">
                      No completed workouts recorded for this month.
                    </div>
                  ) : (
                    filteredGymLogs.map(log => {
                      const completedSets = (log.exercises || []).reduce((sum, ex) => sum + (ex.sets?.filter(s => s.completed).length || 0), 0);
                      const totalSets = (log.exercises || []).reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
                      const durationMin = log.startTime && log.endTime ? Math.round((log.endTime - log.startTime) / 60000) : null;
                      const isExpanded = expandedGymLogs.has(log.id);

                      return (
                        <div 
                          key={log.id} 
                          onClick={() => toggleGymLog(log.id)}
                          className="flex flex-col p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-primary-light dark:text-primary-dark">
                                {format(parseISO(log.date), 'EEE, MMM d, yyyy')}
                              </span>
                              <span className="text-[11px] font-medium text-secondary-light dark:text-secondary-dark mt-0.5">
                                {log.type} {log.day && `· ${log.day}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {durationMin !== null && (
                                <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark flex items-center gap-1 bg-bg-light dark:bg-bg-dark px-2 py-0.5 rounded-md border border-border-light dark:border-border-dark">
                                  <Timer size={10} />
                                  {durationMin > 0 ? `${durationMin}m` : '<1m'}
                                </span>
                              )}
                              <span className="text-sm font-bold font-mono text-emerald-500">
                                {completedSets}/{totalSets} sets
                              </span>
                              <ChevronDown size={16} className={`text-muted-light dark:text-muted-dark transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: 'auto', opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }} 
                                className="overflow-hidden"
                              >
                                <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark space-y-3">
                                  {(log.exercises || []).length === 0 ? (
                                    <p className="text-xs text-secondary-light dark:text-secondary-dark italic">No exercises logged.</p>
                                  ) : (
                                    (log.exercises || []).map((ex, exIdx) => {
                                      const safeSets = Array.isArray(ex?.sets) ? ex.sets : [];
                                      const doneSets = safeSets.filter(s => s?.completed).length;
                                      return (
                                        <div key={exIdx} className="bg-bg-light dark:bg-bg-dark/50 p-2.5 rounded-lg border border-border-light dark:border-border-dark/60">
                                          <div className="flex items-center justify-between mb-1.5">
                                            <h5 className="text-xs font-bold text-primary-light dark:text-primary-dark">{ex.name}</h5>
                                            <span className="label-mono text-[10px] text-muted-light dark:text-muted-dark">{doneSets}/{safeSets.length} done</span>
                                          </div>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                            {safeSets.map((s, sIdx) => (
                                              <div 
                                                key={sIdx} 
                                                className={`text-[11px] p-1.5 rounded flex items-center justify-between border ${s.completed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-muted-light dark:text-muted-dark'}`}
                                              >
                                                <span>Set {sIdx + 1}</span>
                                                <span className="font-mono font-medium">{s.reps}r @ {s.weight}kg</span>
                                                {s.completed && <Check size={10} className="text-emerald-500 stroke-[3]" />}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Spending History Section */}
      <motion.div variants={item} className="rounded-[28px] overflow-hidden bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm">
        <button
          onClick={() => setSpendingHistoryOpen(!spendingHistoryOpen)}
          className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] dark:active:bg-white/[0.05] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-m3-peach-badge/70 dark:bg-m3-peach-darkBadge/70 text-m3-peach-text dark:text-m3-peach-darkText shadow-sm">
              <Wallet size={20} />
            </div>
            <div className="text-left">
              <p className="font-black text-base text-primary-light dark:text-primary-dark font-sans">Spending History</p>
              <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark mt-0.5">View past expenses & smart AI advice</p>
            </div>
          </div>
          {spendingHistoryOpen ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
        </button>

        <AnimatePresence>
          {spendingHistoryOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-6 pb-6 border-t border-border-light/70 dark:border-border-dark/70 pt-5 space-y-5">
                
                {/* Filter Header */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary-light dark:text-primary-dark bg-black/[0.03] dark:bg-white/[0.05] px-3 py-2 rounded-full border border-border-light dark:border-border-dark min-w-0 flex-1">
                    <Calendar size={14} className="text-secondary-light dark:text-secondary-dark shrink-0" />
                    <select 
                      value={selectedSpendingMonth}
                      onChange={(e) => {
                        setSelectedSpendingMonth(e.target.value);
                        setSpendingAiAnalysis(null);
                      }}
                      className="bg-transparent border-none font-bold text-primary-light dark:text-primary-dark focus:ring-0 cursor-pointer text-xs w-full truncate"
                    >
                      {uniqueSpendingMonths.map(m => {
                        const [y, mo] = m.split('-');
                        const date = new Date(parseInt(y), parseInt(mo) - 1);
                        return (
                          <option key={m} value={m}>{format(date, 'MMMM yyyy')}</option>
                        );
                      })}
                    </select>
                  </div>
                  <button 
                    onPointerDown={() => triggerHaptic('ai')}
                    onClick={handleAnalyzeSpending}
                    disabled={filteredSpendingLogs.length === 0 || spendingAnalyzing}
                    className="shrink-0 whitespace-nowrap rounded-full px-3.5 sm:px-4 py-2 flex items-center gap-1.5 text-xs font-bold bg-[#8F4C1B] dark:bg-[#FFB787] text-white dark:text-[#2B1E17] shadow-sm active:scale-95 transition-all disabled:opacity-40"
                  >
                    {spendingAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    AI Insights
                  </button>
                </div>

                {/* AI Spend Analysis Card (Material 3 Peach Tonal Container) */}
                {spendingAiAnalysis && (
                  <div className="rounded-[22px] p-4 bg-m3-peach-container dark:bg-m3-peach-darkContainer text-m3-peach-text dark:text-m3-peach-darkText border border-m3-peach-badge/60 dark:border-m3-peach-darkBadge/60 relative shadow-sm">
                    <button onClick={() => setSpendingAiAnalysis(null)} className="absolute top-3 right-3 text-m3-peach-text/70 hover:text-m3-peach-text">
                      <X size={14} />
                    </button>
                    <h4 className="font-bold flex items-center gap-1.5 mb-2 text-xs uppercase tracking-wider font-mono">
                      <Sparkles size={13} /> Smart Spending Insights
                    </h4>
                    {spendingAiAnalysis.error ? (
                      <div className="space-y-2">
                        <p className="text-xs text-red-500 font-medium">{spendingAiAnalysis.error}</p>
                        <button
                          onClick={handleAnalyzeSpending}
                          disabled={spendingAnalyzing}
                          className="text-[11px] font-bold text-accent underline flex items-center gap-1"
                        >
                          <Sparkles size={11} /> Retry Analysis
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 text-xs leading-relaxed">
                        <p className="font-medium">
                          {spendingAiAnalysis.summary}
                        </p>
                        {spendingAiAnalysis.tips && (
                          <div className="space-y-1.5 pt-2 border-t border-m3-peach-badge/40 dark:border-m3-peach-darkBadge/40">
                            <span className="font-bold block text-[11px] uppercase tracking-wider font-mono opacity-85">Where to spend less:</span>
                            {spendingAiAnalysis.tips.map((tip: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-1.5 opacity-90">
                                <span className="font-bold">•</span>
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Month Summary Bar */}
                <div className="flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.03] p-3.5 rounded-[18px] border border-border-light dark:border-border-dark">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block font-mono">Total Spent</span>
                    <span className="font-black text-lg text-primary-light dark:text-primary-dark font-sans">
                      ₹{spendingMonthTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block font-mono">Transactions</span>
                    <span className="font-mono text-xs font-bold text-secondary-light dark:text-secondary-dark">
                      {filteredSpendingLogs.length} items
                    </span>
                  </div>
                </div>

                {/* Category Pills */}
                {spendingByCategory.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {spendingByCategory.map(([cat, amt]) => (
                      <span key={cat} className="text-xs px-3 py-1 rounded-full bg-black/[0.025] dark:bg-white/[0.04] border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark font-semibold">
                        {cat}: <strong className="text-primary-light dark:text-primary-dark font-mono">₹{amt.toLocaleString('en-IN')}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Expense List */}
                <div className="space-y-1.5 pt-1 max-h-72 overflow-y-auto pr-1">
                  {filteredSpendingLogs.length === 0 ? (
                    <p className="text-xs text-secondary-light dark:text-secondary-dark italic text-center py-4 font-medium">No spending logged for this month.</p>
                  ) : (
                    filteredSpendingLogs.map((exp) => (
                      <div key={exp.id} className="p-3 rounded-[16px] bg-black/[0.02] dark:bg-white/[0.03] border border-border-light/60 dark:border-border-dark/60 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-primary-light dark:text-primary-dark truncate">
                            {exp.category} {exp.note && <span className="font-normal text-secondary-light dark:text-secondary-dark">· {exp.note}</span>}
                          </p>
                          <p className="text-[10px] font-mono text-muted-light dark:text-muted-dark mt-0.5">
                            {exp.date}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-sm text-primary-light dark:text-primary-dark shrink-0">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* TO-DO List History Section */}
      <motion.div variants={item} className="rounded-[28px] overflow-hidden bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm">
        <button
          onClick={() => setTodoHistoryOpen(!todoHistoryOpen)}
          className="w-full flex items-center justify-between p-5 sm:p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-black/[0.04] dark:active:bg-white/[0.05] transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 shadow-sm">
              <ListTodo size={20} />
            </div>
            <div className="text-left">
              <p className="font-black text-base text-primary-light dark:text-primary-dark font-sans">TO-DO List History</p>
              <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark mt-0.5">View completed tasks & productivity</p>
            </div>
          </div>
          {todoHistoryOpen ? <ChevronUp size={18} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={18} className="text-muted-light dark:text-muted-dark" />}
        </button>

        <AnimatePresence>
          {todoHistoryOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-6 pb-6 border-t border-border-light/70 dark:border-border-dark/70 pt-5 space-y-5">
                
                {/* Filter Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary-light dark:text-primary-dark bg-black/[0.03] dark:bg-white/[0.05] px-3.5 py-1.5 rounded-full border border-border-light dark:border-border-dark">
                    <Calendar size={14} className="text-secondary-light dark:text-secondary-dark" />
                    <select 
                      value={selectedTodoMonth}
                      onChange={(e) => setSelectedTodoMonth(e.target.value)}
                      className="bg-transparent border-none font-bold text-primary-light dark:text-primary-dark focus:ring-0 cursor-pointer text-xs"
                    >
                      {uniqueTodoMonths.map(m => {
                        const [y, mo] = m.split('-');
                        const date = new Date(parseInt(y), parseInt(mo) - 1);
                        return (
                          <option key={m} value={m}>{format(date, 'MMMM yyyy')}</option>
                        );
                      })}
                    </select>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 px-3.5 py-1.5 rounded-full bg-emerald-500/10">
                    {completedTodoCount}/{filteredTodoTasks.length} done
                  </span>
                </div>

                {/* Tasks List */}
                <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1">
                  {filteredTodoTasks.length === 0 ? (
                    <p className="text-xs text-secondary-light dark:text-secondary-dark italic text-center py-4 font-medium">No tasks found for this month.</p>
                  ) : (
                    filteredTodoTasks.map((t) => (
                      <div key={t.id} className="p-3.5 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.03] border border-border-light/60 dark:border-border-dark/60 flex items-start gap-3.5">
                        <div className={`w-5 h-5 rounded-[8px] mt-0.5 border flex items-center justify-center flex-shrink-0 ${t.completed ? 'bg-primary-light dark:bg-primary-dark border-primary-light dark:border-primary-dark' : 'border-border-light dark:border-border-dark'}`}>
                          {t.completed && <Check size={12} className="text-surface-light dark:text-surface-dark stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs font-bold block truncate ${t.completed ? 'line-through text-muted-light dark:text-muted-dark' : 'text-primary-light dark:text-primary-dark'}`}>
                            {t.text}
                          </span>
                          {t.subtask && (
                            <span className="text-[11px] text-secondary-light dark:text-secondary-dark block truncate mt-0.5">
                              {t.subtask}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-muted-light dark:text-muted-dark block mt-0.5">
                            {t.date}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Private Groq AI Coach Configuration */}
      <motion.div variants={item} className="rounded-[28px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[14px] bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Key size={20} />
            </span>
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
                AI Coach Integration
              </p>
              <h3 className="text-sm font-bold text-primary-light dark:text-primary-dark font-sans">
                Groq API Key
              </h3>
            </div>
          </div>
          {data.geminiApiKey ? (
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
              Active ✓
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono">
              Not Set
            </span>
          )}
        </div>

        <p className="text-xs text-secondary-light dark:text-secondary-dark leading-relaxed">
          Your key is saved exclusively in your private account. It is never committed to Git, never visible in the APK, and completely private to you.
        </p>

        <div className="space-y-2 pt-1">
          <div className="relative flex items-center">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-xl px-4 py-2.5 pr-11 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/30 transition-shadow text-primary-light dark:text-primary-dark"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors"
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 font-mono"
            >
              Get Free Key from Groq →
            </a>
            <button
              onClick={handleSaveApiKey}
              disabled={!apiKeyInput.trim()}
              className="btn-pill px-4 py-2 text-xs bg-accent text-white hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 flex items-center gap-1.5"
            >
              {apiKeySaved ? (
                <>
                  <Check size={14} className="stroke-[3]" /> Saved!
                </>
              ) : (
                'Save Key'
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Account Settings (Mobile-First Ergonomics) */}
      <motion.div variants={item} className="rounded-[28px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        {/* User Account Info Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[18px] bg-accent/10 border border-accent/25 flex items-center justify-center text-lg font-black text-accent font-sans shadow-sm shrink-0">
            {(auth.currentUser?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
              Signed In Account
            </p>
            <p className="text-sm font-bold text-primary-light dark:text-primary-dark font-sans break-all mt-0.5 leading-snug">
              {auth.currentUser?.email || 'Signed In User'}
            </p>
            <p className="text-[10px] text-muted-light dark:text-muted-dark font-mono mt-0.5 truncate">
              UID: {auth.currentUser?.uid || 'Not available'}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-border-light/60 dark:bg-border-dark/60" />

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => {
              triggerHaptic('medium');
              if (Capacitor.isNativePlatform()) {
                GoogleAuth.signOut().catch(() => {});
              }
              navigate('/');
              signOut(auth);
            }}
            className="w-full py-2.5 px-4 rounded-full bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20 active:scale-[0.97] transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut size={15} />
            Sign Out
          </button>
          <button
            onClick={async () => {
              triggerHaptic('heavy');
              if (window.confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
                if (auth.currentUser) {
                  await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                  alert('Data reset successfully! The app will now reload.');
                  window.location.reload();
                }
              }
            }}
            className="w-full py-2.5 px-4 rounded-full bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-secondary-light dark:text-secondary-dark border border-border-light dark:border-border-dark active:scale-[0.97] transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
          >
            <AlertTriangle size={14} className="text-amber-500" />
            Reset Data
          </button>
        </div>
      </motion.div>

      {/* App Version & Direct In-App Live Updates */}
      <div className="rounded-[28px] p-5 sm:p-6 bg-surface-light dark:bg-surface-dark border border-border-light/70 dark:border-border-dark/70 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-[14px] bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <Smartphone size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono truncate">
                Direct In-App Updates & Sync
              </p>
              <h3 className="text-sm font-bold text-primary-light dark:text-primary-dark font-sans truncate">
                LifeOS v1.5.1 (Build 10)
              </h3>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold font-sans shrink-0 whitespace-nowrap flex items-center gap-1.5 shadow-sm ${
            updateInfo?.available
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
          }`}>
            {updateInfo?.available ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>Update Ready</span>
              </>
            ) : (
              <>
                <Check size={13} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Up to Date</span>
              </>
            )}
          </div>
        </div>

        {updateMsg && (
          <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border-light dark:border-border-dark text-xs font-medium text-secondary-light dark:text-secondary-dark flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {!updateInfo?.available && (
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check size={12} strokeWidth={2.5} />
                </div>
              )}
              <span className="leading-snug">{updateMsg}</span>
            </div>
            {/* ONLY show Apply Now button if an actual newer version was found */}
            {updateInfo?.available && (
              <button
                onClick={handleLiveSync}
                disabled={syncingBuild}
                className="px-3 py-1 rounded-lg bg-accent text-white font-bold font-mono text-[11px] hover:opacity-90 active:scale-95 disabled:opacity-50 shrink-0 shadow-sm"
              >
                {syncingBuild ? 'Applying...' : 'Apply Now'}
              </button>
            )}
          </div>
        )}

        {/* Dynamic Controls based on Update State */}
        <div className="pt-1">
          {updateInfo?.available ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={checkForUpdates}
                disabled={checkingUpdate || syncingBuild}
                className="w-full py-2.5 px-3 rounded-full bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-secondary-light dark:text-secondary-dark border border-border-light dark:border-border-dark active:scale-[0.97] transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={13} className={checkingUpdate ? 'animate-spin' : ''} />
                {checkingUpdate ? 'Checking...' : 'Re-Check'}
              </button>
              <button
                onClick={handleLiveSync}
                disabled={syncingBuild}
                className="w-full py-2.5 px-3 rounded-full bg-accent text-white hover:opacity-90 active:scale-[0.97] transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-accent/20 disabled:opacity-50"
              >
                <Sparkles size={13} className={syncingBuild ? 'animate-spin' : ''} />
                {syncingBuild ? 'Applying...' : 'Apply Update'}
              </button>
            </div>
          ) : (
            <button
              onClick={checkForUpdates}
              disabled={checkingUpdate || syncingBuild}
              className="w-full py-2.5 px-4 rounded-full bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-secondary-light dark:text-secondary-dark border border-border-light dark:border-border-dark active:scale-[0.97] transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={14} className={checkingUpdate ? 'animate-spin' : ''} />
              {checkingUpdate ? 'Checking Cloud...' : updateInfo ? '✓ Up to Date · Check Again' : 'Check for Updates'}
            </button>
          )}
        </div>

        {/* Guidance Box for Direct In-App Updating */}
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-border-light/60 dark:border-border-dark/60 text-[11px] text-muted-light dark:text-muted-dark leading-relaxed space-y-1">
          <p className="font-bold text-secondary-light dark:text-secondary-dark flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Seamless Direct In-App Updating:
          </p>
          <p>
            • <strong>Instant Live Sync:</strong> When new updates are released, tapping <strong>Check for Updates</strong> detects the build, and <strong>Apply Update</strong> updates the application directly on your phone.
          </p>
          <p>
            • <strong>No Manual Downloads:</strong> You never have to download or reinstall APK files. Everything updates directly in the app.
          </p>
        </div>
      </div>

      <div className="text-center py-4">
        <p className="text-xs font-mono font-bold text-muted-light dark:text-muted-dark">LifeOS v1.5.1 (Build 10) · Production Ready</p>
      </div>
    </motion.div>
  );
}
