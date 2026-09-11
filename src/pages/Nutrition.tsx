import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, Sparkles, Plus, X, Upload, Loader2, Sunrise, Sun, Cloud, Moon, Check, AlertTriangle, Leaf, Save, Edit2, Trash2, Clock, History, Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import { getCoachTip, getDietAdvice, askFoodDoubt, GEMINI_API_KEY } from '../utils/geminiCoach';
import { MONTHLY_MESS_MENU } from '../data/messMenu';
import type { AppData, MealSlot, NutritionLog, MealItemLog } from '../types';

interface NutritionProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const MEALS: { slot: MealSlot; label: string; icon: React.ReactNode; time: string; dotColor: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', icon: <Sunrise size={16} className="text-amber-500" />, time: '7:00–9:00 AM', dotColor: 'bg-amber-400' },
  { slot: 'lunch', label: 'Lunch', icon: <Sun size={16} className="text-orange-500" />, time: '12:30–2:00 PM', dotColor: 'bg-orange-400' },
  { slot: 'snacks', label: 'Snacks', icon: <Cloud size={16} className="text-sky-500" />, time: '5:00–6:00 PM', dotColor: 'bg-sky-400' },
  { slot: 'dinner', label: 'Dinner', icon: <Moon size={16} className="text-indigo-500" />, time: '7:30–9:00 PM', dotColor: 'bg-indigo-400' },
  { slot: 'nightCanteen', label: 'Night Canteen', icon: <Moon size={16} className="text-purple-500" />, time: '10:30 PM–12:30 AM', dotColor: 'bg-purple-400' },
];

const getCurrentMealSlot = (): MealSlot => {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  const totalMin = hour * 60 + minute;
  // 10:30 PM (1350 mins) to 12:30 AM (30 mins)
  if (totalMin >= 1350 || totalMin < 30) return 'nightCanteen';
  if (totalMin < 630) return 'breakfast';
  if (totalMin < 930) return 'lunch';
  if (totalMin < 1110) return 'snacks';
  return 'dinner';
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.44, ease: 'easeOut' } } };

export default function Nutrition({ data, updateData }: NutritionProps) {
  const navigate = useNavigate();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Selected date menu resolution
  const selectedDateObj = useMemo(() => {
    try {
      return parseISO(selectedDate);
    } catch {
      return new Date();
    }
  }, [selectedDate]);

  const selectedDayOfMonth = selectedDateObj.getDate();
  const todayMenu = MONTHLY_MESS_MENU.find(m => m.date === selectedDayOfMonth) || MONTHLY_MESS_MENU[0];

  const [coachAdvice, setCoachAdvice] = useState<any>(null);
  const [fetchingAdvice, setFetchingAdvice] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  // Auto-expand current meal slot based on time
  const [expanded, setExpanded] = useState<MealSlot | null>(getCurrentMealSlot);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  // Food Doubt State (AI Can I eat this?)
  const [foodDoubtQuery, setFoodDoubtQuery] = useState('');
  const [foodDoubtAnswer, setFoodDoubtAnswer] = useState<string | null>(null);
  const [foodDoubtLoading, setFoodDoubtLoading] = useState(false);
  const [foodDoubtError, setFoodDoubtError] = useState<string | null>(null);

  // Free text extra items per slot
  const [extraTexts, setExtraTexts] = useState<Record<string, string>>({});
  const [estimatingSlot, setEstimatingSlot] = useState<MealSlot | null>(null);

  // Edit Extra Item state
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [editExtraName, setEditExtraName] = useState('');
  const [editExtraCals, setEditExtraCals] = useState('');

  // Draft Log initialization for selected date
  const existingLogForDate = useMemo(() => {
    return (data.nutritionLogs || []).find(l => l.date === selectedDate);
  }, [data.nutritionLogs, selectedDate]);

  const [isLocked, setIsLocked] = useState(!!existingLogForDate?.isSaved);
  const [draftLog, setDraftLog] = useState<NutritionLog>(() => {
    if (existingLogForDate) {
      const isOldFormat = existingLogForDate.mealsEaten.some((m: any) => 'itemsSelected' in m);
      if (isOldFormat) {
        return {
          id: `nut-${selectedDate}`,
          date: selectedDate,
          isSaved: false,
          mealsEaten: [],
          dailyTotal: 0
        };
      }
      return existingLogForDate;
    }
    return {
      id: `nut-${selectedDate}`,
      date: selectedDate,
      isSaved: false,
      mealsEaten: [],
      dailyTotal: 0
    };
  });

  // When selectedDate changes, sync draftLog & isLocked with data
  useEffect(() => {
    const log = (data.nutritionLogs || []).find(l => l.date === selectedDate);
    if (log) {
      const isOldFormat = log.mealsEaten.some((m: any) => 'itemsSelected' in m);
      if (isOldFormat) {
        setDraftLog({
          id: `nut-${selectedDate}`,
          date: selectedDate,
          isSaved: false,
          mealsEaten: [],
          dailyTotal: 0
        });
      } else {
        setDraftLog(log);
      }
      setIsLocked(!!log.isSaved);
    } else {
      setDraftLog({
        id: `nut-${selectedDate}`,
        date: selectedDate,
        isSaved: false,
        mealsEaten: [],
        dailyTotal: 0
      });
      setIsLocked(false);
    }
  }, [selectedDate, data.nutritionLogs]);

  const targetCals = data.profile?.currentCalorieTarget || 2000;
  const totalConsumed = draftLog.dailyTotal;
  const ringPct = Math.min((totalConsumed / targetCals) * 100, 100);
  const ringColor = ringPct < 85 ? '#10b981' : ringPct <= 100 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 42;
  const strokeDash = (ringPct / 100) * circumference;

  const handleGetAdvice = async () => {
    if (!todayMenu) return;
    setFetchingAdvice(true);
    setShowCoach(true);
    triggerHaptic('ai');
    try {
      const p = data.profile || { goalWeight: 'maintain', currentCalorieTarget: 2000 };
      const advice = await getDietAdvice(todayMenu, p, data.geminiApiKey || GEMINI_API_KEY);
      setCoachAdvice(advice);
      triggerHaptic('success');
    } catch (err: any) {
      console.error(err);
      if (err.message === 'NO_API_KEY' || (err instanceof Error && err.message === 'NO_API_KEY')) {
        setCoachAdvice({ error: "Please enter your Groq API Key in Settings to use the AI Coach." });
      } else {
        setCoachAdvice({ error: "Failed to load advice. Please try again." });
      }
    } finally {
      setFetchingAdvice(false);
    }
  };

  const handleAskFoodDoubt = async () => {
    if (!foodDoubtQuery.trim()) return;
    triggerHaptic('ai');
    setFoodDoubtLoading(true);
    setFoodDoubtError(null);
    setFoodDoubtAnswer(null);
    try {
      const res = await askFoodDoubt(foodDoubtQuery.trim(), data.profile, data.geminiApiKey || GEMINI_API_KEY);
      setFoodDoubtAnswer(res);
      triggerHaptic('success');
    } catch (err: any) {
      console.error(err);
      setFoodDoubtError('Failed to get answer. Please try again.');
    } finally {
      setFoodDoubtLoading(false);
    }
  };

  const calculateDailyTotal = (meals: NutritionLog['mealsEaten']) => {
    let total = 0;
    meals.forEach(m => {
      m.items.forEach(i => {
        total += (i.calories * i.portion);
      });
    });
    return total;
  };

  const toggleMenuItem = (mealSlot: MealSlot, itemName: string, estCals: number) => {
    triggerHaptic(5);
    setDraftLog(prev => {
      const newLog = { ...prev, mealsEaten: [...prev.mealsEaten] };
      const mealIdx = newLog.mealsEaten.findIndex(m => m.slot === mealSlot);

      let mealLog;
      if (mealIdx >= 0) {
        mealLog = { ...newLog.mealsEaten[mealIdx], items: [...newLog.mealsEaten[mealIdx].items] };
        newLog.mealsEaten[mealIdx] = mealLog;
      } else {
        mealLog = { slot: mealSlot, items: [] };
        newLog.mealsEaten.push(mealLog);
      }

      const existingItemIdx = mealLog.items.findIndex(i => i.id === itemName && !i.isExtra);
      if (existingItemIdx >= 0) {
        // Remove item
        mealLog.items.splice(existingItemIdx, 1);
      } else {
        // Add item with portion 1
        mealLog.items.push({
          id: itemName,
          name: itemName,
          calories: estCals,
          portion: 1,
          isExtra: false
        });
      }

      newLog.dailyTotal = calculateDailyTotal(newLog.mealsEaten);
      newLog.isSaved = false;
      return newLog;
    });
  };

  const updateItemPortion = (mealSlot: MealSlot, itemId: string, change: number) => {
    triggerHaptic(5);
    setDraftLog(prev => {
      const newLog = { ...prev, mealsEaten: [...prev.mealsEaten] };
      const mealIdx = newLog.mealsEaten.findIndex(m => m.slot === mealSlot);
      if (mealIdx === -1) return prev;

      const mealLog = { ...newLog.mealsEaten[mealIdx], items: [...newLog.mealsEaten[mealIdx].items] };
      newLog.mealsEaten[mealIdx] = mealLog;

      const itemIdx = mealLog.items.findIndex(i => i.id === itemId);
      if (itemIdx === -1) return prev;

      const item = { ...mealLog.items[itemIdx] };
      mealLog.items[itemIdx] = item;

      // Update portion
      item.portion += change;

      // Prevent portion dropping below 0
      if (item.portion <= 0) {
        mealLog.items.splice(itemIdx, 1);
      }

      newLog.dailyTotal = calculateDailyTotal(newLog.mealsEaten);
      newLog.isSaved = false;
      return newLog;
    });
  };

  const handleAddExtraItem = async (mealSlot: MealSlot) => {
    const txt = extraTexts[mealSlot] || '';
    if (!txt.trim()) return;

    setEstimatingSlot(mealSlot);
    triggerHaptic(10);

    try {
      const prompt = `Estimate the calories for this food item eaten: "${txt}".
Return ONLY a valid JSON object like {"calories": 250, "name": "Standardized name"}. No markdown, no backticks.`;

      const res = await getCoachTip(prompt, data.geminiApiKey || GEMINI_API_KEY);
      const parsed = JSON.parse(res);

      setDraftLog(prev => {
        const newLog = { ...prev, mealsEaten: [...prev.mealsEaten] };
        const mealIdx = newLog.mealsEaten.findIndex(m => m.slot === mealSlot);

        let mealLog;
        if (mealIdx >= 0) {
          mealLog = { ...newLog.mealsEaten[mealIdx], items: [...newLog.mealsEaten[mealIdx].items] };
          newLog.mealsEaten[mealIdx] = mealLog;
        } else {
          mealLog = { slot: mealSlot, items: [] };
          newLog.mealsEaten.push(mealLog);
        }

        mealLog.items.push({
          id: Date.now().toString(),
          name: parsed.name,
          calories: parsed.calories,
          portion: 1,
          isExtra: true
        });

        newLog.dailyTotal = calculateDailyTotal(newLog.mealsEaten);
        newLog.isSaved = false;
        return newLog;
      });

      setExtraTexts(prev => ({ ...prev, [mealSlot]: '' }));
    } catch (err: any) {
      console.error(err);
      if (err.message === 'NO_API_KEY' || (err instanceof Error && err.message === 'NO_API_KEY')) {
        alert("Please enter your Groq API Key in Settings to estimate calories.");
      } else {
        alert("Failed to estimate calories. Please try again.");
      }
    } finally {
      setEstimatingSlot(null);
    }
  };

  const handleDeleteExtraItem = (mealSlot: MealSlot, itemId: string) => {
    setDraftLog(prev => {
      const newLog = { ...prev, mealsEaten: [...prev.mealsEaten] };
      const mealIdx = newLog.mealsEaten.findIndex(m => m.slot === mealSlot);
      if (mealIdx >= 0) {
        const mealLog = { ...newLog.mealsEaten[mealIdx], items: [...newLog.mealsEaten[mealIdx].items] };
        newLog.mealsEaten[mealIdx] = mealLog;
        mealLog.items = mealLog.items.filter(i => i.id !== itemId);
      }
      newLog.dailyTotal = calculateDailyTotal(newLog.mealsEaten);
      newLog.isSaved = false;
      return newLog;
    });
  }

  const handleSkipMeal = (mealSlot: MealSlot) => {
    triggerHaptic(5);
    setDraftLog(prev => {
      const newLog = { ...prev, mealsEaten: [...prev.mealsEaten] };
      const mealIdx = newLog.mealsEaten.findIndex(m => m.slot === mealSlot);

      let mealLog;
      if (mealIdx >= 0) {
        mealLog = { ...newLog.mealsEaten[mealIdx], items: [...newLog.mealsEaten[mealIdx].items] };
        newLog.mealsEaten[mealIdx] = mealLog;
      } else {
        mealLog = { slot: mealSlot, items: [] };
        newLog.mealsEaten.push(mealLog);
      }

      const skippedIdx = mealLog.items.findIndex(i => i.id === 'skipped');
      if (skippedIdx >= 0) {
        mealLog.items.splice(skippedIdx, 1);
      } else {
        mealLog.items = [{
          id: 'skipped',
          name: 'Meal Skipped',
          calories: 0,
          portion: 1,
          isExtra: false
        }];
      }

      newLog.dailyTotal = calculateDailyTotal(newLog.mealsEaten);
      newLog.isSaved = false;
      return newLog;
    });
  };

  const saveEditedExtraItem = (mealSlot: MealSlot, itemId: string) => {
    triggerHaptic(5);
    const parsedCals = parseInt(editExtraCals);

    setDraftLog(prev => {
      const newLog = { ...prev, mealsEaten: [...prev.mealsEaten] };
      const mealIdx = newLog.mealsEaten.findIndex(m => m.slot === mealSlot);
      if (mealIdx >= 0) {
        const mealLog = { ...newLog.mealsEaten[mealIdx], items: [...newLog.mealsEaten[mealIdx].items] };
        newLog.mealsEaten[mealIdx] = mealLog;

        const itemIdx = mealLog.items.findIndex(i => i.id === itemId);
        if (itemIdx >= 0) {
          const item = { ...mealLog.items[itemIdx] };
          mealLog.items[itemIdx] = item;

          if (editExtraName.trim()) item.name = editExtraName.trim();
          if (!isNaN(parsedCals) && parsedCals >= 0) item.calories = parsedCals;
        }
      }
      newLog.dailyTotal = calculateDailyTotal(newLog.mealsEaten);
      newLog.isSaved = false;
      return newLog;
    });
    setEditingExtraId(null);
  }

  const handleSaveDay = async () => {
    triggerHaptic('save');
    const finalLog = { ...draftLog, date: selectedDate, isSaved: true };
    setDraftLog(finalLog);
    setIsLocked(true);

    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);

    const otherLogs = (data.nutritionLogs || []).filter(l => l.date !== selectedDate);
    await updateData({ nutritionLogs: [...otherLogs, finalLog] });
  };

  const isToday = selectedDate === todayStr;
  const isYesterday = selectedDate === format(subDays(new Date(), 1), 'yyyy-MM-dd');

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 max-w-xl mx-auto pb-4">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between pt-2">
        <button
          onClick={() => { triggerHaptic(10); navigate('/'); }}
          className="w-10 h-10 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-center hover:opacity-85 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
            {format(selectedDateObj, 'EEEE, d MMM yyyy')}
          </p>
          <h1 className="text-xl font-black text-primary-light dark:text-primary-dark font-sans">Nutrition Protocol</h1>
        </div>
        <div className="w-10 flex justify-end">
          {!isToday && (
            <button
              onClick={() => {
                triggerHaptic(5);
                setSelectedDate(todayStr);
              }}
              className="text-[11px] font-bold px-2 py-1 rounded-lg bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 transition-all"
              title="Jump to Today"
            >
              Today
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Date Navigator Bar (Log any particular date) ── */}
      <motion.div variants={item} className="card p-3 flex items-center justify-between gap-2 shadow-sm border border-border-light/80 dark:border-border-dark/80">
        <button
          onClick={() => {
            triggerHaptic(5);
            setSelectedDate(prev => format(subDays(parseISO(prev), 1), 'yyyy-MM-dd'));
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark hover:border-accent/50 active:scale-95 transition-all text-secondary-light dark:text-secondary-dark"
          title="Previous Day"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Date Selector Pill with Native Date Picker */}
        <label className="relative flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-bg-light dark:bg-bg-dark border border-border-light/80 dark:border-border-dark/80 cursor-pointer hover:border-accent/40 transition-colors">
          <Calendar size={15} className="text-accent flex-shrink-0" />
          <span className="text-xs font-bold text-primary-light dark:text-primary-dark font-sans">
            {isToday ? 'Today' : isYesterday ? 'Yesterday' : format(selectedDateObj, 'EEE, d MMM')}
          </span>
          <span className="text-[10px] text-muted-light dark:text-muted-dark font-mono">
            ({format(selectedDateObj, 'yyyy-MM-dd')})
          </span>
          {existingLogForDate?.isSaved ? (
            <span className="ml-1 w-2 h-2 rounded-full bg-emerald-500" title="Saved" />
          ) : draftLog.dailyTotal > 0 ? (
            <span className="ml-1 w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
          ) : null}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                triggerHaptic(5);
                setSelectedDate(e.target.value);
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>

        <button
          onClick={() => {
            triggerHaptic(5);
            setSelectedDate(prev => format(addDays(parseISO(prev), 1), 'yyyy-MM-dd'));
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark hover:border-accent/50 active:scale-95 transition-all text-secondary-light dark:text-secondary-dark"
          title="Next Day"
        >
          <ChevronRight size={18} />
        </button>
      </motion.div>

      {/* Material 3 Expressive Peach/Mint Tonal Calorie Hero Container */}
      <motion.div
        variants={item}
        className="rounded-[28px] p-6 bg-m3-peach-container dark:bg-m3-peach-darkContainer text-m3-peach-text dark:text-m3-peach-darkText border border-m3-peach-badge/50 dark:border-m3-peach-darkBadge/50 shadow-m3-subtle flex items-center gap-6"
      >
        <div className="relative flex-shrink-0">
          <svg width="104" height="104" viewBox="0 0 104 104">
            <circle cx="52" cy="52" r="44" fill="none" stroke="currentColor" strokeWidth="9" className="text-black/10 dark:text-white/10" />
            <circle
              cx="52" cy="52" r="44"
              fill="none"
              stroke={ringColor}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              transform="rotate(-90 52 52)"
              style={{ transition: 'stroke-dasharray 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black font-sans leading-none">{Math.round(totalConsumed)}</span>
            <span className="text-[10px] font-bold tracking-wider uppercase opacity-75 font-mono mt-0.5">kcal</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75 font-mono">Target</span>
            <span className="font-mono font-bold text-sm">{targetCals} kcal</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-75 font-mono">Remaining</span>
            <span className={`font-mono font-bold text-sm ${totalConsumed > targetCals ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {Math.round(Math.max(0, targetCals - totalConsumed))} kcal
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, ringPct)}%`, backgroundColor: ringColor }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Food Doubt Card (Can I eat this?) ── */}
      <motion.div variants={item} className="card p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[14px] bg-m3-lavender-badge/70 dark:bg-m3-lavender-darkBadge/70 text-m3-lavender-text dark:text-m3-lavender-darkText flex items-center justify-center shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary-light dark:text-primary-dark">Food Doubt · Can I eat this?</h3>
              <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark">Instant AI verdict for items outside your meal</p>
            </div>
          </div>
          {foodDoubtAnswer && (
            <button
              onClick={() => {
                setFoodDoubtAnswer(null);
                setFoodDoubtQuery('');
              }}
              className="text-xs font-bold text-accent hover:underline"
            >
              Ask Another
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={foodDoubtQuery}
            onChange={(e) => setFoodDoubtQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !foodDoubtLoading && handleAskFoodDoubt()}
            placeholder="e.g. 2 slices of pepperoni pizza, iced mocha, samosa..."
            className="flex-1 bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-primary-light dark:text-primary-dark"
          />
          <button
            onPointerDown={() => triggerHaptic('ai')}
            onClick={handleAskFoodDoubt}
            disabled={foodDoubtLoading || !foodDoubtQuery.trim()}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 active:scale-95 text-white transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
          >
            {foodDoubtLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>Ask</span>
          </button>
        </div>

        {foodDoubtError && (
          <p className="text-xs text-red-500">{foodDoubtError}</p>
        )}

        <AnimatePresence>
          {foodDoubtAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 rounded-xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 text-xs text-primary-light dark:text-primary-dark leading-relaxed flex items-start gap-2.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
              <p className="flex-1 font-medium">{foodDoubtAnswer}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Menu Cards */}
      {todayMenu && (
        <motion.div variants={item} className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="label-mono text-secondary-light dark:text-secondary-dark">Today's Mess Menu ({todayMenu.dayName} {todayMenu.date})</h2>
            <button
              onPointerDown={() => triggerHaptic('ai')}
              onClick={handleGetAdvice}
              className="btn-ghost-pill px-3 py-1 flex items-center gap-1.5 text-xs text-emerald-500 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <Sparkles size={12} />
              AI Diet Coach
            </button>
          </div>

          <AnimatePresence>
            {showCoach && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                <div className="card p-4 border border-emerald-500/30 bg-emerald-500/5 relative">
                  <button onClick={() => setShowCoach(false)} className="absolute top-3 right-3 text-emerald-500/70 hover:text-emerald-500">
                    <X size={16} />
                  </button>
                  <h3 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3 text-sm">
                    <Sparkles size={16} /> Personalized Advice
                  </h3>

                  {fetchingAdvice ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3">
                      <Loader2 size={24} className="animate-spin text-emerald-500" />
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Analyzing menu & goals...</p>
                    </div>
                  ) : coachAdvice?.error ? (
                    <p className="text-sm text-red-500">{coachAdvice.error}</p>
                  ) : coachAdvice && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">Recommended</h4>
                        <ul className="text-sm text-secondary-light dark:text-secondary-dark space-y-1 list-disc pl-4">
                          {coachAdvice.recommended?.map((r: any, i: number) => <li key={i}><strong>{r.item}</strong>: {r.reason}</li>)}
                        </ul>
                      </div>
                      {coachAdvice.avoid && coachAdvice.avoid.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Danger / Avoid</h4>
                          <ul className="text-sm text-secondary-light dark:text-secondary-dark space-y-1 list-disc pl-4 marker:text-red-500">
                            {coachAdvice.avoid.map((a: any, i: number) => <li key={i}><strong>{a.item}</strong>: {a.reason}</li>)}
                          </ul>
                        </div>
                      )}
                      <div className="p-3 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                        <p className="text-xs text-primary-light dark:text-primary-dark italic">"{coachAdvice.strategy}"</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {MEALS.map(mealObj => {
            const mealData = todayMenu.meals.find((m: any) => m.slot === mealObj.slot);
            const mealLog = draftLog.mealsEaten.find(m => m.slot === mealObj.slot);
            const isOpen = expanded === mealObj.slot;

            // Calculate total calories for this slot
            const slotCals = mealLog ? mealLog.items.reduce((s, i) => s + (i.calories * i.portion), 0) : 0;
            const isSkipped = mealLog?.items.some(i => i.id === 'skipped');

            return (
              <div key={mealObj.slot} className="card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 active:bg-bg-light dark:active:bg-bg-dark transition-colors"
                  onClick={() => setExpanded(isOpen ? null : mealObj.slot)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${mealObj.dotColor} bg-opacity-20 text-current`}>
                      {mealObj.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-primary-light dark:text-primary-dark">{mealObj.label}</p>
                      <p className="label-mono text-[10px] text-muted-light dark:text-muted-dark">{mealObj.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {slotCals > 0 && !isSkipped && (
                      <span className="text-xs font-bold font-mono text-primary-light dark:text-primary-dark">
                        {Math.round(slotCals)} kcal
                      </span>
                    )}
                    {isSkipped && (
                      <span className="text-xs font-bold text-amber-500">
                        Skipped
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={16} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={16} className="text-muted-light dark:text-muted-dark" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 border-t border-border-light dark:border-border-dark pt-3">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xs font-bold text-secondary-light dark:text-secondary-dark uppercase tracking-wider">
                            {mealObj.slot === 'nightCanteen' ? 'Night Canteen (10:30 PM–12:30 AM)' : 'Menu Items'}
                          </h4>
                          <button onClick={() => handleSkipMeal(mealObj.slot)} className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${isSkipped ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:bg-bg-light dark:hover:bg-bg-dark text-secondary-light dark:text-secondary-dark'}`}>
                            {isSkipped ? 'Undo Skip' : 'Skip Meal'}
                          </button>
                        </div>

                        {isSkipped ? (
                          <div className="py-6 text-center bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                            <p className="text-amber-600 dark:text-amber-400 font-medium text-sm">You skipped {mealObj.label.toLowerCase()}</p>
                          </div>
                        ) : (
                          <>
                            {/* Standard Menu Items if present */}
                            {mealData && mealData.items.length > 0 && (
                              <div className="space-y-2 mb-4">
                                {mealData.items.map((item: any) => {
                                  const loggedItem = mealLog?.items.find(i => i.id === item.name && !i.isExtra);
                                  const isSelected = !!loggedItem;

                                  const isRecommended = coachAdvice?.recommended?.some((r: any) => item.name.toLowerCase().includes(r.item?.toLowerCase()) || r.item?.toLowerCase().includes(item.name.toLowerCase()));
                                  const isAvoid = coachAdvice?.avoid?.some((a: any) => item.name.toLowerCase().includes(a.item?.toLowerCase()) || a.item?.toLowerCase().includes(item.name.toLowerCase()));

                                  return (
                                    <div
                                      key={item.name}
                                      className={`w-full flex flex-col p-3 rounded-xl border transition-all ${isSelected
                                          ? 'bg-primary-light/10 dark:bg-primary-dark/10 border-primary-light/30 dark:border-primary-dark/30'
                                          : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark'
                                        }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <button
                                          className="flex items-center gap-3 flex-1 text-left"
                                          onClick={() => toggleMenuItem(mealObj.slot, item.name, item.estCalories)}
                                        >
                                          <div className={`w-5 h-5 rounded-md border flex flex-shrink-0 items-center justify-center ${isSelected ? 'border-primary-light dark:border-primary-dark bg-primary-light dark:bg-primary-dark text-bg-light dark:text-bg-dark' : 'border-border-light dark:border-border-dark text-transparent'}`}>
                                            <Check size={12} strokeWidth={3} />
                                          </div>
                                          <span className={`text-sm font-medium flex flex-wrap items-center gap-2 ${isSelected ? 'text-primary-light dark:text-primary-dark' : 'text-primary-light dark:text-primary-dark'}`}>
                                            {item.name}
                                            {isRecommended && <Leaf size={14} className={isSelected ? 'text-emerald-500' : 'text-emerald-500'} />}
                                            {isAvoid && <AlertTriangle size={14} className={isSelected ? 'text-red-500' : 'text-red-500'} />}
                                          </span>
                                        </button>

                                        {/* Item Portions Stepper */}
                                        {isSelected && (
                                          <div className="flex items-center gap-2 ml-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg px-2 py-1">
                                            <button
                                              className="text-muted-light dark:text-muted-dark hover:text-primary-light px-1"
                                              onClick={(e) => { e.stopPropagation(); updateItemPortion(mealObj.slot, item.name, -0.5); }}
                                            >
                                              -
                                            </button>
                                            <span className="text-xs font-bold w-6 text-center">{loggedItem.portion}</span>
                                            <button
                                              className="text-muted-light dark:text-muted-dark hover:text-primary-light px-1"
                                              onClick={(e) => { e.stopPropagation(); updateItemPortion(mealObj.slot, item.name, 0.5); }}
                                            >
                                              +
                                            </button>
                                          </div>
                                        )}
                                        {!isSelected && (
                                          <span className={`label-mono text-[10px] text-muted-light dark:text-muted-dark ml-2`}>
                                            {item.estCalories} kcal
                                          </span>
                                        )}
                                      </div>
                                      {isSelected && (
                                        <div className="text-[10px] text-muted-light dark:text-muted-dark mt-2 ml-8 font-mono">
                                          Total: {Math.round(loggedItem.calories * loggedItem.portion)} kcal
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Night Canteen Quick Suggestions */}
                            {mealObj.slot === 'nightCanteen' && (
                              <div className="mb-3">
                                <p className="text-[11px] font-mono text-muted-light dark:text-muted-dark mb-1.5">Quick Canteen Picks:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {['Maggi', 'Egg Roll', 'Chicken Roll', 'Cold Coffee', 'Sandwich', 'Tea', 'French Fries'].map(chip => (
                                    <button
                                      key={chip}
                                      type="button"
                                      onClick={() => {
                                        triggerHaptic(5);
                                        setExtraTexts(prev => ({ ...prev, [mealObj.slot]: chip }));
                                      }}
                                      className="text-xs px-2.5 py-1 rounded-lg bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-accent/40 text-secondary-light dark:text-secondary-dark transition-colors"
                                    >
                                      + {chip}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Extra / Logged Items List for this slot */}
                            {mealLog && mealLog.items.filter(i => i.isExtra).length > 0 && (
                              <div className="mt-4 mb-4 space-y-2">
                                <h4 className="text-xs font-bold text-secondary-light dark:text-secondary-dark uppercase tracking-wider mb-2">
                                  {mealObj.slot === 'nightCanteen' ? 'Logged Canteen Items' : 'Extra Items'}
                                </h4>
                                {mealLog.items.filter(i => i.isExtra).map((extra) => (
                                  <div key={extra.id} className="p-3 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl">
                                    {editingExtraId === extra.id ? (
                                      <div className="space-y-3">
                                        <input
                                          type="text"
                                          value={editExtraName}
                                          onChange={(e) => setEditExtraName(e.target.value)}
                                          className="input-field text-sm w-full py-1.5 px-3"
                                          placeholder="Item name"
                                        />
                                        <div className="flex gap-2">
                                          <input
                                            type="number"
                                            value={editExtraCals}
                                            onChange={(e) => setEditExtraCals(e.target.value)}
                                            className="input-field text-sm flex-1 py-1.5 px-3"
                                            placeholder="Calories for 1 portion"
                                          />
                                          <button onClick={() => saveEditedExtraItem(mealObj.slot, extra.id)} className="btn-primary py-1 px-3 text-xs">Save</button>
                                          <button onClick={() => setEditingExtraId(null)} className="btn-secondary py-1 px-3 text-xs">Cancel</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-primary-light dark:text-primary-dark">{extra.name}</span>
                                          <div className="flex items-center gap-1">
                                            {/* Extra Item Portions Stepper */}
                                            <div className="flex items-center gap-2 bg-bg-light dark:bg-bg-dark rounded-lg px-2 py-0.5">
                                              <button
                                                className="text-muted-light dark:text-muted-dark hover:text-primary-light px-1"
                                                onClick={(e) => { e.stopPropagation(); updateItemPortion(mealObj.slot, extra.id, -0.5); }}
                                              >
                                                -
                                              </button>
                                              <span className="text-xs font-bold w-6 text-center">{extra.portion}</span>
                                              <button
                                                className="text-muted-light dark:text-muted-dark hover:text-primary-light px-1"
                                                onClick={(e) => { e.stopPropagation(); updateItemPortion(mealObj.slot, extra.id, 0.5); }}
                                              >
                                                +
                                              </button>
                                            </div>

                                            <button onClick={() => { setEditingExtraId(extra.id); setEditExtraName(extra.name); setEditExtraCals(extra.calories.toString()); }} className="p-1.5 text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark transition-colors">
                                              <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteExtraItem(mealObj.slot, extra.id)} className="p-1.5 text-red-500/70 hover:text-red-500 transition-colors">
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="text-[10px] text-muted-light dark:text-muted-dark mt-1 font-mono">
                                          {extra.calories} kcal/portion • Total: {Math.round(extra.calories * extra.portion)} kcal
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Extra / Canteen Item Input with AI calorie estimation */}
                            <div className="mt-4 pt-3 border-t border-dashed border-border-light dark:border-border-dark">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-purple-500" />
                                <span className="text-xs font-medium text-secondary-light dark:text-secondary-dark">
                                  {mealObj.slot === 'nightCanteen' ? 'Ate at Night Canteen? (AI estimates cals)' : 'Ate something else? (AI estimates cals)'}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder={mealObj.slot === 'nightCanteen' ? 'e.g. 1 plate Maggi, 1 cold coffee' : 'e.g. 2 slices of pizza, 1 apple'}
                                  value={extraTexts[mealObj.slot] || ''}
                                  onChange={(e) => setExtraTexts(prev => ({ ...prev, [mealObj.slot]: e.target.value }))}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddExtraItem(mealObj.slot)}
                                  className="input-field flex-1 text-sm py-2 px-3"
                                  disabled={estimatingSlot === mealObj.slot}
                                />
                                <button
                                  onClick={() => handleAddExtraItem(mealObj.slot)}
                                  disabled={estimatingSlot === mealObj.slot || !(extraTexts[mealObj.slot]?.trim())}
                                  className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary-light dark:bg-primary-dark text-bg-light dark:text-bg-dark rounded-xl disabled:opacity-50"
                                >
                                  {estimatingSlot === mealObj.slot ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Save Button & Locked Protection */}
      <motion.div variants={item} className="pt-4">
        {draftLog.isSaved && isLocked ? (
          <div className="card p-5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Check size={20} className="stroke-[3]" />
              <p className="font-bold text-base">Day's Nutrition Saved & Protected!</p>
            </div>
            <p className="text-xs text-secondary-light dark:text-secondary-dark">
              Total: {Math.round(draftLog.dailyTotal)} kcal. Locked against accidental overwriting.
            </p>
            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  setIsLocked(false);
                }}
                className="btn-ghost-pill flex-1 py-2.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 flex items-center justify-center gap-1.5"
              >
                <Unlock size={14} /> Unlock to Edit
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-pill flex-1 py-2.5 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <button
            onPointerDown={() => triggerHaptic('save')}
            onClick={handleSaveDay}
            className={`relative overflow-hidden w-full h-14 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 shadow-md active:scale-95 ${showSavedFeedback ? 'bg-emerald-500 text-white' : 'btn-primary'}`}
          >
            <AnimatePresence mode="wait">
              {showSavedFeedback ? (
                <motion.div key="saved" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.4 }} className="flex items-center gap-2">
                  <Check size={20} /> Saved for {format(new Date(draftLog.date), 'MMM d')}
                </motion.div>
              ) : (
                <motion.div key="save" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.4 }} className="flex items-center gap-2">
                  <Save size={20} /> Save Day's Nutrition
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        )}
      </motion.div>



    </motion.div>
  );
}

