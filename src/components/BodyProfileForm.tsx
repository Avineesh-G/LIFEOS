import { useState, useMemo } from 'react';
import { UserProfile, FitnessGoal } from '../types';
import { 
  calculateBMR, 
  calculateTDEE, 
  calculateCalorieTarget, 
  calculateProteinTarget,
  FITNESS_GOALS 
} from '../utils/calculations';
import { 
  Flame, 
  TrendingUp, 
  Dumbbell, 
  Zap, 
  Shield, 
  Heart, 
  Sprout, 
  Compass, 
  Activity, 
  Sparkles, 
  Target, 
  Check 
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface BodyProfileFormProps {
  initialProfile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  onCancel?: () => void;
}

const GoalIcon = ({ name, size = 18, className = '' }: { name: string; size?: number; className?: string }) => {
  switch (name) {
    case 'Flame': return <Flame size={size} className={className} />;
    case 'TrendingUp': return <TrendingUp size={size} className={className} />;
    case 'Dumbbell': return <Dumbbell size={size} className={className} />;
    case 'Zap': return <Zap size={size} className={className} />;
    case 'Shield': return <Shield size={size} className={className} />;
    case 'Heart': return <Heart size={size} className={className} />;
    case 'Sprout': return <Sprout size={size} className={className} />;
    case 'Compass': return <Compass size={size} className={className} />;
    case 'Activity': return <Activity size={size} className={className} />;
    case 'Sparkles': return <Sparkles size={size} className={className} />;
    default: return <Target size={size} className={className} />;
  }
};

export default function BodyProfileForm({ initialProfile, onSave, onCancel }: BodyProfileFormProps) {
  const [age, setAge] = useState(initialProfile?.age?.toString() || '');
  const [height, setHeight] = useState(initialProfile?.height?.toString() || '');
  const [weight, setWeight] = useState(initialProfile?.weightHistory?.[0]?.weight?.toString() || '');
  const [goalWeight, setGoalWeight] = useState(initialProfile?.goalWeight?.toString() || '');
  const [gender, setGender] = useState<UserProfile['gender']>(initialProfile?.gender || 'male');
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(initialProfile?.activityLevel || 'sedentary');
  
  // Fitness Goal State (10 specific activity targets)
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(() => {
    if (initialProfile?.fitnessGoal) return initialProfile.fitnessGoal;
    const w = initialProfile?.weightHistory?.[0]?.weight || 75;
    const gw = initialProfile?.goalWeight || 70;
    return w > gw ? 'weight_loss' : w < gw ? 'weight_gain' : 'general_fitness';
  });

  const [isSaved, setIsSaved] = useState(false);

  // Real-time live estimate
  const liveTarget = useMemo(() => {
    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const goalWeightNum = parseFloat(goalWeight);
    if (!ageNum || !heightNum || !weightNum || !goalWeightNum) return null;

    const bmr = calculateBMR(ageNum, heightNum, weightNum, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const target = calculateCalorieTarget(tdee, weightNum, goalWeightNum, fitnessGoal);
    const proteinTarget = calculateProteinTarget(weightNum, fitnessGoal);
    const goalConfig = FITNESS_GOALS.find(g => g.id === fitnessGoal);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      target: Math.round(target),
      proteinTarget,
      goalLabel: goalConfig?.label || 'Target',
      calOffset: goalConfig?.calOffset || 0,
      recommendedSplit: goalConfig?.recommendedSplit || 'Custom Split',
      splitDescription: goalConfig?.splitDescription || '',
    };
  }, [age, height, weight, goalWeight, gender, activityLevel, fitnessGoal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const goalWeightNum = parseFloat(goalWeight);

    if (!ageNum || !heightNum || !weightNum || !goalWeightNum) return;

    triggerHaptic('save');
    const bmr = calculateBMR(ageNum, heightNum, weightNum, gender);
    const tdee = calculateTDEE(bmr, activityLevel);
    const target = calculateCalorieTarget(tdee, weightNum, goalWeightNum, fitnessGoal);
    const proteinTarget = calculateProteinTarget(weightNum, fitnessGoal);

    const newProfile: UserProfile = {
      age: ageNum,
      height: heightNum,
      gender,
      activityLevel,
      goalWeight: goalWeightNum,
      weightHistory: initialProfile?.weightHistory?.length 
        ? [...initialProfile.weightHistory, { date: new Date().toISOString().split('T')[0], weight: weightNum }]
        : [{ date: new Date().toISOString().split('T')[0], weight: weightNum }],
      currentCalorieTarget: Math.round(target),
      fitnessGoal,
      dailyProteinTarget: proteinTarget,
    };

    onSave(newProfile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2200);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Biological Metrics (2x2 Numeric Inputs) */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
          1. Body Metrics & Weight Target
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/[0.025] dark:bg-white/[0.04] p-3.5 rounded-[20px] border border-border-light dark:border-border-dark focus-within:border-accent/60 transition-all">
            <label className="text-[10px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono">
              Age (Years)
            </label>
            <input 
              type="number" 
              value={age} 
              onChange={e => setAge(e.target.value)} 
              className="w-full bg-transparent text-xl font-black text-primary-light dark:text-primary-dark focus:outline-none font-sans" 
              required 
              placeholder="20"
            />
          </div>

          <div className="bg-black/[0.025] dark:bg-white/[0.04] p-3.5 rounded-[20px] border border-border-light dark:border-border-dark focus-within:border-accent/60 transition-all">
            <label className="text-[10px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono">
              Height (cm)
            </label>
            <input 
              type="number" 
              value={height} 
              onChange={e => setHeight(e.target.value)} 
              className="w-full bg-transparent text-xl font-black text-primary-light dark:text-primary-dark focus:outline-none font-sans" 
              required 
              placeholder="175"
            />
          </div>

          <div className="bg-black/[0.025] dark:bg-white/[0.04] p-3.5 rounded-[20px] border border-border-light dark:border-border-dark focus-within:border-accent/60 transition-all">
            <label className="text-[10px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono">
              Present Weight
            </label>
            <div className="flex items-baseline justify-between">
              <input 
                type="number" 
                step="0.1"
                value={weight} 
                onChange={e => setWeight(e.target.value)} 
                className="w-full bg-transparent text-xl font-black text-primary-light dark:text-primary-dark focus:outline-none font-sans" 
                required 
                placeholder="75"
              />
              <span className="text-xs font-bold text-muted-light dark:text-muted-dark font-mono">kg</span>
            </div>
          </div>

          <div className="bg-black/[0.025] dark:bg-white/[0.04] p-3.5 rounded-[20px] border border-border-light dark:border-border-dark focus-within:border-accent/60 transition-all">
            <label className="text-[10px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono">
              Goal Weight
            </label>
            <div className="flex items-baseline justify-between">
              <input 
                type="number" 
                step="0.1"
                value={goalWeight} 
                onChange={e => setGoalWeight(e.target.value)} 
                className="w-full bg-transparent text-xl font-black text-primary-light dark:text-primary-dark focus:outline-none font-sans" 
                required 
                placeholder="70"
              />
              <span className="text-xs font-bold text-muted-light dark:text-muted-dark font-mono">kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Fitness & Nutrition Goal Selector (10 Activity Modes) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark font-mono">
            2. Primary Fitness & Nutrition Goal
          </label>
          <span className="text-[10px] font-mono font-medium text-accent">
            Directs AI & Calorie Engine
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FITNESS_GOALS.map((goal) => {
            const isSelected = fitnessGoal === goal.id;
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => {
                  setFitnessGoal(goal.id);
                }}
                className={`p-3.5 rounded-[20px] text-left border transition-all duration-150 active:scale-[0.98] relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-accent/15 dark:bg-accent/25 border-accent shadow-sm'
                    : 'bg-black/[0.02] dark:bg-white/[0.035] border-border-light dark:border-border-dark hover:border-accent/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className={`w-8 h-8 rounded-[12px] flex items-center justify-center transition-colors shrink-0 ${
                    isSelected 
                      ? 'bg-accent text-white shadow-sm' 
                      : 'bg-black/[0.04] dark:bg-white/[0.06] text-secondary-light dark:text-secondary-dark'
                  }`}>
                    <GoalIcon name={goal.iconName} size={16} />
                  </div>

                  <span className={`text-[10px] font-mono font-bold shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full border ${
                    goal.calOffset < 0
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25'
                      : goal.calOffset > 0
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                      : 'bg-black/5 dark:bg-white/10 text-secondary-light dark:text-secondary-dark border-border-light/70 dark:border-border-dark/70'
                  }`}>
                    {goal.calOffset > 0 ? `+${goal.calOffset}` : goal.calOffset < 0 ? `${goal.calOffset}` : '±0'} kcal
                  </span>
                </div>

                <div className="mb-1">
                  <span className={`text-xs sm:text-sm font-bold font-sans leading-tight block ${
                    isSelected ? 'text-accent dark:text-accent font-black' : 'text-primary-light dark:text-primary-dark'
                  }`}>
                    {goal.label}
                  </span>
                </div>

                <p className="text-[11px] text-secondary-light dark:text-secondary-dark leading-snug line-clamp-2">
                  {goal.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Biological Gender */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
          3. Biological Gender
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['male', 'female', 'other'] as const).map(g => {
            const isSelected = gender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`py-2.5 px-3 text-xs font-bold rounded-full border transition-all active:scale-[0.97] capitalize font-sans ${
                  isSelected 
                    ? 'bg-[#6750A4] text-white dark:bg-[#D0BCFF] dark:text-[#21005D] border-transparent shadow-sm' 
                    : 'bg-black/[0.025] dark:bg-white/[0.035] border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark hover:border-accent/40'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Activity Level */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
          4. Daily Activity Level
        </label>
        <div className="relative">
          <select 
            value={activityLevel} 
            onChange={e => setActivityLevel(e.target.value as any)}
            className="w-full bg-black/[0.025] dark:bg-white/[0.04] border border-border-light dark:border-border-dark rounded-[18px] px-4 py-3 text-xs sm:text-sm font-semibold text-primary-light dark:text-primary-dark focus:outline-none focus:ring-2 focus:ring-accent/30 appearance-none cursor-pointer"
          >
            <option value="sedentary">Sedentary · Desk job, minimal exercise</option>
            <option value="light">Light · 1–3 workout days / week</option>
            <option value="moderate">Moderate · 3–5 workout days / week</option>
            <option value="active">Active · 6–7 intense training days / week</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-light dark:text-muted-dark">
            ▼
          </div>
        </div>
      </div>

      {/* 5. Live Metabolic & Goal Target Preview */}
      {liveTarget && (
        <div className="rounded-[24px] p-4 sm:p-5 bg-m3-mint-container dark:bg-m3-mint-darkContainer text-m3-mint-text dark:text-m3-mint-darkText border border-m3-mint-badge/60 dark:border-m3-mint-darkBadge/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 opacity-80">
                <Target size={14} /> Calculated Goal: {liveTarget.goalLabel}
              </span>
              <p className="text-2xl font-black font-sans leading-none mt-1">
                {liveTarget.target} <span className="text-xs font-bold font-mono">kcal/day</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider block opacity-80">Daily Protein</span>
              <span className="text-lg font-black font-sans text-emerald-800 dark:text-emerald-300">
                {liveTarget.proteinTarget}g
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-m3-mint-badge/40 dark:border-m3-mint-darkBadge/40 flex items-center justify-between text-[11px] font-mono">
            <span className="opacity-80">BMR: {liveTarget.bmr} kcal</span>
            <span className="opacity-80">TDEE: {liveTarget.tdee} kcal</span>
            <span className="font-bold opacity-90">
              {liveTarget.calOffset > 0 ? `+${liveTarget.calOffset} surplus` : liveTarget.calOffset < 0 ? `${liveTarget.calOffset} deficit` : 'Equilibrium'}
            </span>
          </div>

          <div className="p-2.5 rounded-[16px] bg-white/40 dark:bg-black/20 text-[11px] flex items-center gap-2">
            <Dumbbell size={15} className="shrink-0 text-m3-mint-text dark:text-m3-mint-darkText" />
            <span className="font-medium truncate">
              <strong>Gym Recommendation:</strong> {liveTarget.recommendedSplit}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2.5 pt-1">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-full border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark font-bold text-xs sm:text-sm active:scale-[0.97] transition-all hover:bg-black/5 dark:hover:bg-white/5"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit"
          className={`flex-1 py-3.5 rounded-full font-bold text-xs sm:text-sm active:scale-[0.97] transition-all shadow-sm flex items-center justify-center gap-2 ${
            isSaved 
              ? 'bg-[#146C3E] dark:bg-[#A6EDC2] text-white dark:text-[#19261E]' 
              : 'bg-[#6750A4] dark:bg-[#D0BCFF] text-white dark:text-[#21005D] hover:opacity-95'
          }`}
        >
          {isSaved ? (
            <>
              <Check size={16} className="stroke-[3]" /> Profile Saved
            </>
          ) : (
            'Save Profile & Calibrate AI'
          )}
        </button>
      </div>

      <p className="text-[10px] text-muted-light dark:text-muted-dark text-center font-mono">
        Metabolic estimates calculated using Mifflin-St Jeor & clinical macro coefficients.
      </p>
    </form>
  );
}
