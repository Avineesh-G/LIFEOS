import { useState } from 'react';
import { UserProfile } from '../types';
import { calculateBMR, calculateTDEE, calculateCalorieTarget } from '../utils/calculations';

interface BodyProfileFormProps {
  initialProfile: UserProfile | null;
  onSave: (profile: UserProfile) => void;
  onCancel?: () => void;
}

export default function BodyProfileForm({ initialProfile, onSave, onCancel }: BodyProfileFormProps) {
  const [age, setAge] = useState(initialProfile?.age?.toString() || '');
  const [height, setHeight] = useState(initialProfile?.height?.toString() || '');
  const [weight, setWeight] = useState(initialProfile?.weightHistory[0]?.weight?.toString() || '');
  const [goalWeight, setGoalWeight] = useState(initialProfile?.goalWeight?.toString() || '');
  const [gender, setGender] = useState<UserProfile['gender']>(initialProfile?.gender || 'male');
  const [activityLevel, setActivityLevel] = useState<UserProfile['activityLevel']>(initialProfile?.activityLevel || 'sedentary');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const goalWeightNum = parseFloat(goalWeight);

    if (!ageNum || !heightNum || !weightNum || !goalWeightNum) return;

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
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-secondary-light dark:text-secondary-dark mb-1">Age</label>
          <input 
            type="number" 
            value={age} 
            onChange={e => setAge(e.target.value)} 
            className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-primary-light dark:text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent-light" 
            required 
            placeholder="Years"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-light dark:text-secondary-dark mb-1">Height (cm)</label>
          <input 
            type="number" 
            value={height} 
            onChange={e => setHeight(e.target.value)} 
            className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-primary-light dark:text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent-light" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-light dark:text-secondary-dark mb-1">Current Weight (kg)</label>
          <input 
            type="number" 
            value={weight} 
            onChange={e => setWeight(e.target.value)} 
            className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-primary-light dark:text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent-light" 
            required 
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary-light dark:text-secondary-dark mb-1">Goal Weight (kg)</label>
          <input 
            type="number" 
            value={goalWeight} 
            onChange={e => setGoalWeight(e.target.value)} 
            className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2 text-primary-light dark:text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent-light" 
            required 
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary-light dark:text-secondary-dark mb-1">Gender</label>
        <div className="flex gap-2">
          {['male', 'female', 'other'].map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g as any)}
              className={`flex-1 py-2 text-sm rounded-xl border transition-all ${
                gender === g 
                  ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light border-primary-light dark:border-primary-dark' 
                  : 'bg-bg-light dark:bg-bg-dark border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark'
              }`}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-secondary-light dark:text-secondary-dark mb-1">Activity Level</label>
        <select 
          value={activityLevel} 
          onChange={e => setActivityLevel(e.target.value as any)}
          className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark rounded-xl px-3 py-2.5 text-primary-light dark:text-primary-dark focus:outline-none focus:ring-1 focus:ring-accent-light appearance-none"
        >
          <option value="sedentary">Sedentary (Office job, little exercise)</option>
          <option value="light">Light (1-3 days/week exercise)</option>
          <option value="moderate">Moderate (3-5 days/week exercise)</option>
          <option value="active">Active (6-7 days/week hard exercise)</option>
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border-light dark:border-border-dark text-secondary-light dark:text-secondary-dark font-medium active:scale-[0.98] transition-all"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit"
          className="flex-1 py-2.5 rounded-xl bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light font-medium active:scale-[0.98] transition-all"
        >
          Save Profile
        </button>
      </div>
      
      <p className="text-[10px] text-muted-light dark:text-muted-dark text-center mt-2">
        Estimates are based on the Mifflin-St Jeor equation. Not medical advice.
      </p>
    </form>
  );
}
