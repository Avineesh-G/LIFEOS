import { useState, useMemo } from 'react';
import { UserProfile } from '../types';
import { calculateBMR, calculateTDEE, calculateCalorieTarget } from '../utils/calculations';
import { Flame, Target, Zap, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface BodyProfileFormProps {
  initialProfile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  onCancel?: () => void;
}

export default function BodyProfileForm({ initialProfile, onSave, onCancel }: BodyProfileFormProps) {
  const [age, setAge] = useState(initialProfile?.age?.toString() || '');
  const [height, setHeight] = useState(initialProfile?.height?.toString() || '');
  const [weight, setWeight] = useState(initialProfile?.weightHistory?.[0]?.weight?.toString() || '');
  const [goalWeight, setGoalWeight] = useState(initialProfile?.goalWeight?.toString() || '');
  const [gender, setGender] = useState<UserProfile['gender']>(initialProfile?.gender || 'male');
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(initialProfile?.activityLevel || 'sedentary');
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
    const target = calculateCalorieTarget(tdee, weightNum, goalWeightNum);
    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      target: Math.round(target),
    };
  }, [age, height, weight, goalWeight, gender, activityLevel]);

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
    const target = calculateCalorieTarget(tdee, weightNum, goalWeightNum);

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
    };

    onSave(newProfile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2200);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 2x2 Numeric Inputs with M3 Tonal Containers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/[0.025] dark:bg-white/[0.04] p-3.5 rounded-[20px] border border-border-light dark:border-border-dark focus-within:border-accent/60 transition-all">
          <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono">
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
          <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono">
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
          <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono">
            Current Weight
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
          <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-1 font-mono">
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

      {/* Gender Segmented Chips */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
          Biological Gender
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['male', 'female', 'other'] as const).map(g => {
            const isSelected = gender === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setGender(g);
                }}
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

      {/* Activity Level Selector */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark block mb-2 font-mono">
          Activity Level
        </label>
        <div className="relative">
          <select 
            value={activityLevel} 
            onChange={e => {
              triggerHaptic(8);
              setActivityLevel(e.target.value as any);
            }}
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

      {/* Material 3 Expressive Live Metabolic Target Preview */}
      {liveTarget && (
        <div className="rounded-[22px] p-4 bg-m3-mint-container dark:bg-m3-mint-darkContainer text-m3-mint-text dark:text-m3-mint-darkText border border-m3-mint-badge/60 dark:border-m3-mint-darkBadge/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 opacity-80">
              <Target size={14} /> Calculated Daily Goal
            </span>
            <span className="text-xl font-black font-sans leading-none">
              {liveTarget.target} <span className="text-xs font-bold font-mono">kcal/day</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-m3-mint-badge/40 dark:border-m3-mint-darkBadge/40 text-[11px] font-mono">
            <span className="opacity-75">BMR: {liveTarget.bmr} kcal</span>
            <span className="opacity-75">TDEE: {liveTarget.tdee} kcal</span>
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
            'Save Profile'
          )}
        </button>
      </div>

      <p className="text-[10px] text-muted-light dark:text-muted-dark text-center font-mono">
        Metabolic estimates calculated using the Mifflin-St Jeor equation.
      </p>
    </form>
  );
}
