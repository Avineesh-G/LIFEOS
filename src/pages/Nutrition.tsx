import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Sparkles, Plus, X, Upload, Loader2, Sunrise, Sun, Cloud, Moon, Check, AlertTriangle, Leaf, Save, Edit2, Trash2, Clock, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import { getCoachTip, getDietAdvice, GEMINI_API_KEY } from '../utils/geminiCoach';
import { MONTHLY_MESS_MENU } from '../data/messMenu';
import type { AppData, MealSlot, NutritionLog, MealItemLog } from '../types';

interface NutritionProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

const MEALS: { slot: MealSlot; label: string; icon: React.ReactNode; time: string; dotColor: string }[] = [
  { slot: 'breakfast', label: 'Breakfast', icon: <Sunrise size={16} className="text-amber-500" />,    time: '7:00–9:00 AM',    dotColor: 'bg-amber-400' },
  { slot: 'lunch',     label: 'Lunch',     icon: <Sun size={16} className="text-orange-500" />,        time: '12:30–2:00 PM',  dotColor: 'bg-orange-400' },
  { slot: 'snacks',    label: 'Snacks',    icon: <Cloud size={16} className="text-sky-500" />,          time: '5:00–6:00 PM',   dotColor: 'bg-sky-400' },
  { slot: 'dinner',    label: 'Dinner',    icon: <Moon size={16} className="text-indigo-500" />,        time: '7:30–9:00 PM',   dotColor: 'bg-indigo-400' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } } };

export default function Nutrition({ data, updateData }: NutritionProps) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [coachAdvice, setCoachAdvice] = useState<any>(null);
  const [fetchingAdvice, setFetchingAdvice] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  // Find today's menu from the 31-day monthly menu based on current date
  const todayMenu = useMemo(() => {
    const currentDate = new Date().getDate();
    const monthlyMenu = MONTHLY_MESS_MENU.find(m => m.date === currentDate);
    if (!monthlyMenu) return undefined;
    return {
      ...monthlyMenu,
      fullDateStr: today
    };
  }, [today]);

  const [expanded, setExpanded] = useState<MealSlot | null>('breakfast');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  
  // Free text extra items per slot
  const [extraTexts, setExtraTexts] = useState<Record<string, string>>({});
  const [estimatingSlot, setEstimatingSlot] = useState<MealSlot | null>(null);

  // Edit Extra Item state
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [editExtraName, setEditExtraName] = useState('');
  const [editExtraCals, setEditExtraCals] = useState('');

  // Draft Log initialization
  const [draftLog, setDraftLog] = useState<NutritionLog>(() => {
    const existing = (data.nutritionLogs || []).find(l => l.date === today);
    if (existing) {
      // Migrate old format to new format if needed (if it has itemsSelected)
      const isOldFormat = existing.mealsEaten.some((m: any) => 'itemsSelected' in m);
      if (isOldFormat) {
        return {
          id: `nut-${today}`,
          date: today,
          isSaved: false,
          mealsEaten: [],
          dailyTotal: 0
        };
      }
      return existing;
    }
    return {
      id: `nut-${today}`,
      date: today,
      isSaved: false,
      mealsEaten: [],
      dailyTotal: 0
    };
  });

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
    triggerHaptic(10);
    try {
      const p = data.profile || { goalWeight: 'maintain', currentCalorieTarget: 2000 };
      const advice = await getDietAdvice(todayMenu, p, data.geminiApiKey || GEMINI_API_KEY);
      setCoachAdvice(advice);
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
    triggerHaptic(10);
    const finalLog = { ...draftLog, isSaved: true };
    setDraftLog(finalLog);
    
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
    
    const otherLogs = (data.nutritionLogs || []).filter(l => l.date !== today);
    await updateData({ nutritionLogs: [...otherLogs, finalLog] });
  };

  const savedHistory = (data.nutritionLogs || [])
    .filter(l => l.isSaved && l.date !== today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 max-w-xl mx-auto pb-24">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between pt-2">
        <button
          onClick={() => { triggerHaptic(10); navigate('/'); }}
          className="w-9 h-9 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-center hover:opacity-80 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <p className="label-mono text-secondary-light dark:text-secondary-dark text-[10px]">{format(new Date(), 'EEEE, d MMM')}</p>
          <h1 className="text-lg font-bold text-primary-light dark:text-primary-dark">Nutrition</h1>
        </div>
        <div className="w-9" />
      </motion.div>

      {/* Progress */}
      <motion.div variants={item} className="card p-5 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-bg-light dark:text-bg-dark" />
            <circle
              cx="48" cy="48" r="42"
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              transform="rotate(-90 48 48)"
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-extrabold font-mono text-primary-light dark:text-primary-dark leading-none">{Math.round(totalConsumed)}</span>
            <span className="label-mono text-muted-light dark:text-muted-dark" style={{ fontSize: 8 }}>kcal</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="label-mono text-secondary-light dark:text-secondary-dark">Target</span>
            <span className="font-bold text-sm text-primary-light dark:text-primary-dark">{targetCals} kcal</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="label-mono text-secondary-light dark:text-secondary-dark">Remaining</span>
            <span className={`font-bold text-sm ${totalConsumed > targetCals ? 'text-red-500' : 'text-emerald-500'}`}>
              {Math.round(Math.max(0, targetCals - totalConsumed))} kcal
            </span>
          </div>
        </div>
      </motion.div>

      {/* Menu Cards */}
      {todayMenu && (
        <motion.div variants={item} className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="label-mono text-secondary-light dark:text-secondary-dark">Today's Mess Menu ({todayMenu.dayName} {todayMenu.date})</h2>
            <button 
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
            const mealData = todayMenu.meals.find(m => m.slot === mealObj.slot);
            const mealLog = draftLog.mealsEaten.find(m => m.slot === mealObj.slot);
            const isOpen = expanded === mealObj.slot;
            
            // Calculate total calories for this slot
            const slotCals = mealLog ? mealLog.items.reduce((s, i) => s + (i.calories * i.portion), 0) : 0;

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
                    {slotCals > 0 && (
                      <span className="text-xs font-bold font-mono text-primary-light dark:text-primary-dark">
                        {Math.round(slotCals)} kcal
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={16} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={16} className="text-muted-light dark:text-muted-dark" />}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isOpen && mealData && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 border-t border-border-light dark:border-border-dark pt-3">
                        
                        {/* Standard Menu Items */}
                        <div className="space-y-2 mb-4">
                          {mealData.items.map(item => {
                            const loggedItem = mealLog?.items.find(i => i.id === item.name && !i.isExtra);
                            const isSelected = !!loggedItem;
                            
                            const isRecommended = coachAdvice?.recommended?.some((r: any) => item.name.toLowerCase().includes(r.item?.toLowerCase()) || r.item?.toLowerCase().includes(item.name.toLowerCase()));
                            const isAvoid = coachAdvice?.avoid?.some((a: any) => item.name.toLowerCase().includes(a.item?.toLowerCase()) || a.item?.toLowerCase().includes(item.name.toLowerCase()));
                            
                            return (
                              <div
                                key={item.name}
                                className={`w-full flex flex-col p-3 rounded-xl border transition-all ${
                                  isSelected 
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
                        
                        {/* Extra Items List for this slot */}
                        {mealLog && mealLog.items.filter(i => i.isExtra).length > 0 && (
                            <div className="mt-4 mb-4 space-y-2">
                                <h4 className="text-xs font-bold text-secondary-light dark:text-secondary-dark uppercase tracking-wider mb-2">Extra Items</h4>
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

                        {/* Add Extra Item Input */}
                        <div className="mt-4 pt-3 border-t border-dashed border-border-light dark:border-border-dark">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={14} className="text-purple-500" />
                                <span className="text-xs font-medium text-secondary-light dark:text-secondary-dark">Ate something else?</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g. 2 slices of pizza, 1 apple"
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

                      </div>
                    </motion.div>
                  )}
                  {isOpen && !mealData && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                       <div className="px-4 pb-4 text-center">
                         <p className="text-sm text-secondary-light dark:text-secondary-dark">No menu items parsed for this meal.</p>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Save Button */}
      <motion.div variants={item} className="pt-4">
        <button 
          onClick={handleSaveDay}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-md active:scale-95 ${showSavedFeedback ? 'bg-emerald-500 text-white' : 'btn-primary'}`}
        >
          {showSavedFeedback ? (
             <><Check size={20} /> Saved for {format(new Date(draftLog.date), 'MMM d')}</>
          ) : (
             <><Save size={20} /> Save Day's Nutrition</>
          )}
        </button>
      </motion.div>



    </motion.div>
  );
}
