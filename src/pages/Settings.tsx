import { Moon, Sun, Monitor, Check, LogOut, AlertTriangle, History, Calendar, Sparkles, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
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
import { getHistoryAnalysis, GEMINI_API_KEY } from '../utils/geminiCoach';

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
    triggerHaptic(15);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAnalyzeHistory = async () => {
      if (filteredLogs.length === 0) return;
      triggerHaptic(10);
      setAnalyzing(true);
      try {
          const profile = data.profile || { currentCalorieTarget: 2000 };
          const result = await getHistoryAnalysis(filteredLogs, profile, data.geminiApiKey || GEMINI_API_KEY);
          setAiAnalysis(result);
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

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 max-w-xl mx-auto pb-24">
      {/* Header */}
      <motion.div variants={item} className="pt-2">
        <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Preferences</p>
        <h1 className="text-4xl font-bold tracking-tight leading-none text-primary-light dark:text-primary-dark">Settings</h1>
      </motion.div>

      {/* Appearance Section */}
      <motion.div variants={item} className="card p-5 space-y-4">
        <p className="label-mono text-secondary-light dark:text-secondary-dark">Appearance</p>

        {/* Theme Picker */}
        <div>
          <label className="block text-sm font-medium text-primary-light dark:text-primary-dark mb-3">Theme</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'system' as const, icon: Monitor, label: 'System' },
            ].map(({ value, icon: Icon, label }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => {
                    triggerHaptic(15);
                    setTheme(value);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all duration-150 active:scale-[0.97] ${
                    active
                      ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light border-primary-light dark:border-primary-dark shadow-sm'
                      : 'bg-bg-light dark:bg-bg-dark border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
      
      {/* Body Profile Section */}
      <motion.div variants={item} className="card p-5 space-y-4">
        <p className="label-mono text-secondary-light dark:text-secondary-dark">Body Profile & Targeting</p>
        <BodyProfileForm 
          initialProfile={data.profile} 
          onSave={(profile) => updateData({ profile })} 
        />
      </motion.div>

      {/* Nutrition History Section */}
      <motion.div variants={item} className="card overflow-hidden">
        <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full flex items-center justify-between p-5 active:bg-bg-light dark:active:bg-bg-dark transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-500">
                    <History size={16} />
                </div>
                <div className="text-left">
                    <p className="font-bold text-sm text-primary-light dark:text-primary-dark">Nutrition History</p>
                    <p className="label-mono text-[10px] text-muted-light dark:text-muted-dark">View past saved calories</p>
                </div>
            </div>
            {historyOpen ? <ChevronUp size={16} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={16} className="text-muted-light dark:text-muted-dark" />}
        </button>

        <AnimatePresence>
            {historyOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-border-light dark:border-border-dark pt-4 space-y-4">
                        
                        {/* Filter Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium text-primary-light dark:text-primary-dark">
                                <Calendar size={16} className="text-secondary-light dark:text-secondary-dark" />
                                <select 
                                    value={selectedMonth}
                                    onChange={(e) => {
                                        setSelectedMonth(e.target.value);
                                        setAiAnalysis(null);
                                    }}
                                    className="bg-transparent border-none font-bold text-primary-light dark:text-primary-dark focus:ring-0 cursor-pointer"
                                >
                                    {uniqueMonths.map(m => {
                                        const [y, mo] = m.split('-');
                                        const date = new Date(parseInt(y), parseInt(mo) - 1);
                                        return (
                                            <option key={m} value={m}>{format(date, 'MMMM yyyy')}</option>
                                        )
                                    })}
                                </select>
                            </div>
                            <button 
                                onClick={handleAnalyzeHistory}
                                disabled={filteredLogs.length === 0 || analyzing}
                                className="btn-ghost-pill px-3 py-1 flex items-center gap-1.5 text-xs text-purple-500 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                            >
                                {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                AI Insights
                            </button>
                        </div>

                        {/* AI Insights Card */}
                        {aiAnalysis && (
                            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 relative">
                                <button onClick={() => setAiAnalysis(null)} className="absolute top-2 right-2 text-purple-500/70 hover:text-purple-500">
                                    <X size={14} />
                                </button>
                                <h4 className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2 mb-2 text-xs uppercase tracking-wider">
                                    <Sparkles size={14} /> Month Analysis
                                </h4>
                                {aiAnalysis.error ? (
                                    <p className="text-sm text-red-500">{aiAnalysis.error}</p>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm text-primary-light dark:text-primary-dark font-medium leading-relaxed">
                                            {aiAnalysis.summary}
                                        </p>
                                        {aiAnalysis.tips && aiAnalysis.tips.length > 0 && (
                                            <ul className="text-sm text-secondary-light dark:text-secondary-dark space-y-1 list-disc pl-4">
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
                                <div className="text-center py-6 text-sm text-secondary-light dark:text-secondary-dark">
                                    No saved data for this month.
                                </div>
                            ) : (
                                filteredLogs.map(log => (
                                    <div 
                                        key={log.id} 
                                        onClick={() => toggleLog(log.id)}
                                        className="flex flex-col p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-primary-light dark:text-primary-dark">
                                                    {format(parseISO(log.date), 'EEE, MMM d, yyyy')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold font-mono ${log.dailyTotal > (data.profile?.currentCalorieTarget || 2000) ? 'text-red-500' : 'text-emerald-500'}`}>
                                                    {Math.round(log.dailyTotal)} kcal
                                                </span>
                                                <ChevronDown size={16} className={`text-muted-light dark:text-muted-dark transition-transform ${expandedLogs.has(log.id) ? 'rotate-180' : ''}`} />
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
                                                    <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark space-y-3">
                                                        {log.mealsEaten.length === 0 ? (
                                                            <p className="text-xs text-secondary-light dark:text-secondary-dark italic">No meals logged.</p>
                                                        ) : (
                                                            log.mealsEaten.map((meal, idx) => {
                                                                const isSkipped = meal.items.some(i => i.id === 'skipped');
                                                                return (
                                                                <div key={idx}>
                                                                    <h5 className="text-[10px] font-bold text-muted-light dark:text-muted-dark uppercase tracking-wider mb-1">{meal.slot}</h5>
                                                                    {isSkipped ? (
                                                                        <p className="text-xs text-amber-500 font-medium">Meal Skipped</p>
                                                                    ) : (
                                                                        <ul className="space-y-1">
                                                                            {meal.items.map((item, iIdx) => (
                                                                                <li key={iIdx} className="flex items-center justify-between text-xs">
                                                                                    <span className="text-secondary-light dark:text-secondary-dark">{item.name} {item.portion !== 1 && `(x${item.portion})`}</span>
                                                                                    <span className="font-mono text-primary-light dark:text-primary-dark">{Math.round(item.calories * item.portion)}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </div>
                                                            )})
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

      {/* Advanced Settings */}
      <motion.div variants={item} className="card p-5 space-y-4">
        <p className="label-mono text-secondary-light dark:text-secondary-dark">Advanced</p>
        
        <div>
          <label className="block text-sm font-medium text-primary-light dark:text-primary-dark mb-1">Groq API Key</label>
          <div className="flex gap-2">
            <input 
              type="password" 
              value={data.geminiApiKey || ''} 
              onChange={e => updateData({ geminiApiKey: e.target.value })} 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSaveFeedback();
                }
              }}
              className="flex-1 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-primary-light dark:text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent-light" 
              placeholder="gsk_..."
            />
            <button
              onClick={handleSaveFeedback}
              className={`btn-pill px-4 py-2 text-sm transition-all flex items-center gap-1.5 ${isSaved ? 'bg-emerald-500 text-white' : ''}`}
            >
              {isSaved ? <><Check size={14} /> Saved!</> : 'Save'}
            </button>
          </div>
          <p className="text-[10px] text-muted-light dark:text-muted-dark mt-1">Required for AI Coach, AI Insights, and Nutrition parsing.</p>
        </div>
      </motion.div>

      {/* Account Settings */}
      <motion.div variants={item} className="card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Account</p>
            <p className="text-sm font-medium text-primary-light dark:text-primary-dark truncate" title={auth.currentUser?.email || ''}>{auth.currentUser?.email}</p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                navigate('/');
                signOut(auth);
              }}
              className="whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              Sign Out
            </button>
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to reset all your data? This cannot be undone.')) {
                  if (auth.currentUser) {
                    await deleteDoc(doc(db, 'users', auth.currentUser.uid));
                    alert('Data reset successfully! The app will now reload.');
                    window.location.reload();
                  }
                }
              }}
              className="whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors text-xs font-medium"
            >
              <AlertTriangle size={14} />
              Reset Data
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="text-center py-4">
        <p className="label-mono text-muted-light dark:text-muted-dark">LifeOS v1.1</p>
      </motion.div>
    </motion.div>
  );
}
