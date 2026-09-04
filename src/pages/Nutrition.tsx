import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Sparkles, Plus, X, Upload, Loader2, Sunrise, Sun, Cloud, Moon, Check, AlertTriangle, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { triggerHaptic } from '../utils/haptics';
import { getCoachTip, getDietAdvice, GEMINI_API_KEY } from '../utils/geminiCoach';
import { MONTHLY_MESS_MENU } from '../data/messMenu';
import type { AppData, MealSlot, NutritionLog, PortionSize, DayMenu } from '../types';

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

const PORTIONS: { val: PortionSize; label: string }[] = [
  { val: 0.5, label: '½' },
  { val: 1,   label: '1' },
  { val: 1.5, label: '1½' },
  { val: 2,   label: '2' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } } };

export default function Nutrition({ data, updateData }: NutritionProps) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonthStr = format(new Date(), 'yyyy-MM');
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showTextPaste, setShowTextPaste] = useState(false);
  const [pastedText, setPastedText] = useState('');
  
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
  
  // Free text extra item
  const [extraItemTxt, setExtraItemTxt] = useState('');
  const [estimating, setEstimating] = useState(false);

  // Current day's log
  const todayLog = (data.nutritionLogs || []).find(l => l.date === today) || {
    id: `nut-${today}`,
    date: today,
    mealsEaten: [],
    extraItems: [],
    dailyTotal: 0
  } as NutritionLog;

  const targetCals = data.profile?.currentCalorieTarget || 2000;
  const totalConsumed = todayLog.dailyTotal;
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
    } catch (err) {
      console.error(err);
      setCoachAdvice({ error: "Failed to load advice. Please try again." });
    } finally {
      setFetchingAdvice(false);
    }
  };

  const toggleMenuItem = async (mealSlot: MealSlot, itemName: string, estCals: number) => {
    triggerHaptic(5);
    const existingLog = { ...todayLog };
    
    let mealLog = existingLog.mealsEaten.find(m => m.slot === mealSlot);
    if (!mealLog) {
      mealLog = { slot: mealSlot, itemsSelected: [], portion: 1, calories: 0 };
      existingLog.mealsEaten.push(mealLog);
    }

    if (mealLog.itemsSelected.includes(itemName)) {
      mealLog.itemsSelected = mealLog.itemsSelected.filter(i => i !== itemName);
      mealLog.calories -= (estCals * mealLog.portion);
    } else {
      mealLog.itemsSelected.push(itemName);
      mealLog.calories += (estCals * mealLog.portion);
    }

    // Recalculate daily total
    existingLog.dailyTotal = existingLog.mealsEaten.reduce((s, m) => s + m.calories, 0);

    const logs = (data.nutritionLogs || []).filter(l => l.date !== today);
    await updateData({ nutritionLogs: [...logs, existingLog] });
  };

  const setMealPortion = async (mealSlot: MealSlot, portion: PortionSize) => {
    triggerHaptic(5);
    const existingLog = { ...todayLog };
    let mealLog = existingLog.mealsEaten.find(m => m.slot === mealSlot);
    if (!mealLog) return; // No items selected yet

    const oldPortion = mealLog.portion;
    mealLog.portion = portion;
    
    // Recalculate cals
    mealLog.calories = (mealLog.calories / oldPortion) * portion;
    existingLog.dailyTotal = existingLog.mealsEaten.reduce((s, m) => s + m.calories, 0);
    
    const logs = (data.nutritionLogs || []).filter(l => l.date !== today);
    await updateData({ nutritionLogs: [...logs, existingLog] });
  };

  const handleAddExtraItem = async () => {
    if (!extraItemTxt.trim()) return;
    setEstimating(true);
    triggerHaptic(10);
    
    try {
      const prompt = `Estimate the calories for this food item eaten: "${extraItemTxt}".
Return ONLY a valid JSON object like {"calories": 250, "name": "Standardized name"}. No markdown, no backticks.`;
      
      const res = await getCoachTip(prompt, data.geminiApiKey || GEMINI_API_KEY);
      const parsed = JSON.parse(res);
      
      const existingLog = { ...todayLog };
      existingLog.extraItems = [...(existingLog.extraItems || []), `${parsed.name} (${parsed.calories} kcal)`];
      existingLog.dailyTotal += parsed.calories;

      const logs = (data.nutritionLogs || []).filter(l => l.date !== today);
      await updateData({ nutritionLogs: [...logs, existingLog] });
      
      setExtraItemTxt('');
    } catch (err) {
      console.error(err);
    } finally {
      setEstimating(false);
    }
  };

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
            const mealLog = todayLog.mealsEaten.find(m => m.slot === mealObj.slot);
            const isOpen = expanded === mealObj.slot;

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
                    {mealLog && mealLog.calories > 0 && (
                      <span className="text-xs font-bold font-mono text-primary-light dark:text-primary-dark">
                        {Math.round(mealLog.calories)} kcal
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={16} className="text-muted-light dark:text-muted-dark" /> : <ChevronDown size={16} className="text-muted-light dark:text-muted-dark" />}
                  </div>
                </button>
                
                <AnimatePresence>
                  {isOpen && mealData && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 border-t border-border-light dark:border-border-dark pt-3">
                        <div className="space-y-2 mb-4">
                          {mealData.items.map(item => {
                            const isSelected = mealLog?.itemsSelected.includes(item.name);
                            const isRecommended = coachAdvice?.recommended?.some((r: any) => item.name.toLowerCase().includes(r.item?.toLowerCase()) || r.item?.toLowerCase().includes(item.name.toLowerCase()));
                            const isAvoid = coachAdvice?.avoid?.some((a: any) => item.name.toLowerCase().includes(a.item?.toLowerCase()) || a.item?.toLowerCase().includes(item.name.toLowerCase()));
                            
                            return (
                              <button
                                key={item.name}
                                onClick={() => toggleMenuItem(mealObj.slot, item.name, item.estCalories)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                  isSelected 
                                    ? 'bg-primary-light dark:bg-primary-dark border-transparent' 
                                    : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'border-bg-light dark:border-bg-dark text-bg-light dark:text-bg-dark' : 'border-border-light dark:border-border-dark text-transparent'}`}>
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                  <span className={`text-sm font-medium flex items-center gap-2 ${isSelected ? 'text-bg-light dark:text-bg-dark' : 'text-primary-light dark:text-primary-dark'}`}>
                                    {item.name}
                                    {isRecommended && <Leaf size={14} className={isSelected ? 'text-bg-light/90 dark:text-bg-dark/90' : 'text-emerald-500'} />}
                                    {isAvoid && <AlertTriangle size={14} className={isSelected ? 'text-bg-light/90 dark:text-bg-dark/90' : 'text-red-500'} />}
                                  </span>
                                </div>
                                <span className={`label-mono text-[10px] ${isSelected ? 'text-bg-light/70 dark:text-bg-dark/70' : 'text-muted-light dark:text-muted-dark'}`}>
                                  {item.estCalories} kcal
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Portions */}
                        {mealLog && mealLog.itemsSelected.length > 0 && (
                          <div className="flex items-center justify-between p-1 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
                            {PORTIONS.map(p => (
                              <button
                                key={p.val}
                                onClick={() => setMealPortion(mealObj.slot, p.val)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  mealLog.portion === p.val 
                                    ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light shadow-sm' 
                                    : 'text-secondary-light dark:text-secondary-dark'
                                }`}
                              >
                                {p.label} portion
                              </button>
                            ))}
                          </div>
                        )}
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

      {/* Extra Items Logger */}
      <motion.div variants={item} className="card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-purple-500" />
          <h3 className="font-bold text-sm text-primary-light dark:text-primary-dark">Ate something else?</h3>
        </div>
        
        {todayLog.extraItems && todayLog.extraItems.length > 0 && (
          <div className="space-y-2 mb-3">
            {todayLog.extraItems.map((ex, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-2 bg-surface-light dark:bg-surface-dark rounded-lg">
                <span className="text-secondary-light dark:text-secondary-dark">{ex}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 2 slices of pizza, 1 apple"
            value={extraItemTxt}
            onChange={(e) => setExtraItemTxt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddExtraItem()}
            className="input-field flex-1 text-sm py-2 px-3"
            disabled={estimating}
          />
          <button
            onClick={handleAddExtraItem}
            disabled={estimating || !extraItemTxt.trim()}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-primary-light dark:bg-primary-dark text-bg-light dark:text-bg-dark rounded-xl disabled:opacity-50"
          >
            {estimating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
