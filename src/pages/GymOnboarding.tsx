import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../utils/haptics';
import { DynamicAnimatedIcon, AnimatedTrophy, AnimatedTarget, AnimatedDumbbell, AnimatedUser, AnimatedFlame, AnimatedActivity, AnimatedZap } from '../components/AnimatedIcons';
import type { AppData } from '../types';

interface GymOnboardingProps {
  data: AppData;
  updateData: (partial: Partial<AppData>) => Promise<AppData>;
}

// Step 1: Fitness Goal
const FITNESS_GOALS = [
  { id: 'weight_loss', title: 'Weight Loss', desc: 'Burn fat, tone up & get lean', icon: 'flame', highlight: 'Fat-loss priority' },
  { id: 'muscle_build', title: 'Muscle Build', desc: 'Gain mass, build strength & size', icon: 'dumbbell', highlight: 'Hypertrophy priority' },
];

// Step 5: Pace Options
const PACE_OPTIONS = [
  { id: 'intense', title: 'Fast and Intense', desc: 'Aggressive plan with high-intensity workouts and strict targets.', icon: 'zap' },
  { id: 'normal', title: 'Normal pace is OK', desc: 'Healthy and balanced approach. Trust the process!', icon: 'activity' },
  { id: 'steady', title: 'Steady and gradual', desc: 'Sustainable long-term lifestyle changes, no rush.', icon: 'heart' },
  { id: 'auto', title: 'Let the app decide', desc: "We'll analyse your data and pick the best pace for you.", icon: 'sparkles' },
];

// Step 6: Injury Options
const INJURY_OPTIONS = [
  { id: 'none', label: 'No injuries', icon: 'user', area: 'All clear' },
  { id: 'shoulders', label: 'Shoulders', icon: 'activity', area: 'Rotator cuff & delts' },
  { id: 'back', label: 'Back', icon: 'activity', area: 'Lower & upper spine' },
  { id: 'waist', label: 'Waist', icon: 'activity', area: 'Core & oblique strain' },
  { id: 'wrist', label: 'Wrist', icon: 'zap', area: 'Grip & joints' },
  { id: 'knee', label: 'Knee', icon: 'zap', area: 'Patella & ligaments' },
];

// Step 8: Equipment Options
const EQUIPMENT_OPTIONS = [
  { id: 'bodyweight', title: 'Bodyweight', desc: 'Bodyweight training at home or anywhere.', icon: 'user' },
  { id: 'portable', title: 'Portable', desc: 'Dumbbells, kettlebells, resistance bands.', icon: 'dumbbell' },
  { id: 'gym', title: 'Full Gym', desc: 'Barbells, Smith machine, cables & more.', icon: 'target' },
];

const STEPS = [
  'Fitness Goal',
  'Current Weight',
  'Target Weight',
  'Age',
  'Pace',
  'Injuries',
  'Body Shape',
  'Equipment',
  'Prediction',
  'Plan Ready',
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.44, ease: 'easeOut' } } };

export default function GymOnboarding({ updateData }: GymOnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const totalSteps = STEPS.length;

  // Form State
  const [goal, setGoal] = useState<'weight_loss' | 'muscle_build'>('weight_loss');
  const [currentWeight, setCurrentWeight] = useState(95);
  const [targetWeight, setTargetWeight] = useState(75);
  const [unit, setUnit] = useState<'KG' | 'LB'>('KG');
  const [age, setAge] = useState(20);
  const [pace, setPace] = useState('normal');
  const [selectedInjury, setSelectedInjury] = useState('none');
  const [bodyFat, setBodyFat] = useState(25); // body fat % slider (15–45)
  const [equipment, setEquipment] = useState('gym');
  const [height] = useState(175);

  const bmi = (currentWeight / ((height / 100) * (height / 100))).toFixed(1);
  const bmiNumber = parseFloat(bmi);
  const bmiStatus = bmiNumber < 18.5 ? 'Underweight' : bmiNumber < 25 ? 'Normal' : 'Overweight';
  const bmiBarPos = Math.min(Math.max(((bmiNumber - 15) / (40 - 15)) * 100, 0), 100);
  const weightLossPct = Math.round(((currentWeight - targetWeight) / currentWeight) * 100);

  // Predict goal date (rough: 0.5kg/week at normal pace)
  const weeksNeeded = Math.round((currentWeight - targetWeight) / 0.5);
  const goalDate = new Date();
  goalDate.setDate(goalDate.getDate() + weeksNeeded * 7);
  const goalDateStr = goalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const handleNext = () => {
    triggerHaptic(15);
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      updateData({});
      navigate('/gym');
    }
  };

  const handleBack = () => {
    triggerHaptic(10);
    if (step > 1) setStep(step - 1);
    else navigate('/gym');
  };

  const stepVariant = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
    transition: { duration: 0.4 },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 max-w-xl mx-auto pb-10">

      {/* Header & Progress Bar */}
      <motion.div variants={item} className="flex items-center justify-between pt-2">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-center hover:opacity-80 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Segmented progress bar */}
        <div className="flex-1 mx-4 flex items-center gap-0.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i + 1 <= step
                  ? 'bg-primary-light dark:bg-primary-dark'
                  : 'bg-border-light dark:bg-border-dark'
              }`}
            />
          ))}
        </div>

        <span className="label-mono text-muted-light dark:text-muted-dark w-10 text-right">{step}/{totalSteps}</span>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── STEP 1: Fitness Goal ── */}
        {step === 1 && (
          <motion.div key="s1" {...stepVariant} className="space-y-5">
            <div>
              <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Step 1 · Goal</p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                What's your fitness goal?
              </h1>
              <p className="text-xs text-muted-light dark:text-muted-dark mt-1">Your goal is our roadmap — let's make it happen!</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FITNESS_GOALS.map((g) => {
                const sel = goal === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => { triggerHaptic(12); setGoal(g.id as 'weight_loss' | 'muscle_build'); }}
                    className={`card p-5 text-center flex flex-col items-center justify-between h-52 transition-all duration-150 active:scale-[0.97] ${
                      sel ? 'border-primary-light dark:border-primary-dark ring-1 ring-primary-light dark:ring-primary-dark shadow-sm' : 'hover:border-secondary-light dark:hover:border-secondary-dark'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark flex items-center justify-center text-3xl">
                      <DynamicAnimatedIcon iconKey={g.icon} size={32} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-primary-light dark:text-primary-dark">{g.title}</h3>
                      <p className="text-[11px] text-muted-light dark:text-muted-dark mt-1 leading-snug">{g.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      sel ? 'bg-primary-light dark:bg-primary-dark border-primary-light dark:border-primary-dark'
                          : 'border-border-light dark:border-border-dark'
                    }`}>
                      {sel && <Check size={10} strokeWidth={3} className="text-primary-dark dark:text-primary-light" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── STEP 2: Current Weight ── */}
        {step === 2 && (
          <motion.div key="s2" {...stepVariant} className="space-y-5">
            <div>
              <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Step 2 · Weight</p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                Your current weight
              </h1>
            </div>

            {/* Unit Switcher */}
            <div className="flex justify-center gap-2">
              {(['LB', 'KG'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => { triggerHaptic(10); setUnit(u); }}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    unit === u
                      ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light'
                      : 'bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark text-muted-light dark:text-muted-dark'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            <div className="card p-6 text-center space-y-6">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-7xl font-extrabold text-primary-light dark:text-primary-dark font-mono tracking-tight">{currentWeight}</span>
                <span className="text-2xl font-medium text-secondary-light dark:text-secondary-dark">{unit.toLowerCase()}</span>
              </div>

              {/* Ruler Slider */}
              <div className="space-y-2">
                <input
                  type="range" min="40" max="160" value={currentWeight}
                  onChange={(e) => setCurrentWeight(parseInt(e.target.value))}
                  className="w-full cursor-pointer h-2 bg-bg-light dark:bg-bg-dark rounded-lg border border-border-light dark:border-border-dark accent-gray-900"
                />
                <div className="flex justify-between label-mono text-muted-light dark:text-muted-dark px-1">
                  <span>40</span><span>80</span><span>120</span><span>160</span>
                </div>
              </div>

              {/* BMI Bar */}
              <div className="pt-4 border-t border-border-light dark:border-border-dark space-y-2 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-primary-light dark:text-primary-dark">Current BMI</span>
                  <span className={`label-mono px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    bmiStatus === 'Normal' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : bmiStatus === 'Underweight' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                  }`}>{bmi} · {bmiStatus}</span>
                </div>
                {/* Gradient bar with marker */}
                <div className="relative h-2 w-full rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #60a5fa, #34d399, #fbbf24, #f87171)' }}>
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-800 shadow" style={{ left: `calc(${bmiBarPos}% - 6px)` }} />
                </div>
                <div className="flex justify-between label-mono text-muted-light dark:text-muted-dark" style={{ fontSize: 9 }}>
                  <span>Underweight</span><span>Normal</span><span>Overweight</span>
                </div>
                <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed pt-1">
                  {bmiStatus === 'Normal' ? 'Great! Your BMI is in a healthy range.' : `Your BMI is on the ${bmiStatus.toLowerCase()} side. We'll help you get to the ideal range.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 3: Target Weight ── */}
        {step === 3 && (
          <motion.div key="s3" {...stepVariant} className="space-y-5">
            <div>
              <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Step 3 · Target</p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                Your target weight
              </h1>
            </div>

            {/* Unit Switcher */}
            <div className="flex justify-center gap-2">
              {(['LB', 'KG'] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => { triggerHaptic(10); setUnit(u); }}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    unit === u
                      ? 'bg-primary-light dark:bg-primary-dark text-primary-dark dark:text-primary-light'
                      : 'bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark text-muted-light dark:text-muted-dark'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            <div className="card p-6 text-center space-y-6">
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-7xl font-extrabold text-primary-light dark:text-primary-dark font-mono tracking-tight">{targetWeight}</span>
                <div className="text-left">
                  <span className="text-2xl font-medium text-secondary-light dark:text-secondary-dark block">{unit.toLowerCase()}</span>
                  <span className="label-mono text-muted-light dark:text-muted-dark text-[10px]">from {currentWeight}{unit.toLowerCase()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  type="range" min="40" max={currentWeight} value={targetWeight}
                  onChange={(e) => setTargetWeight(parseInt(e.target.value))}
                  className="w-full cursor-pointer h-2 bg-bg-light dark:bg-bg-dark rounded-lg border border-border-light dark:border-border-dark accent-gray-900"
                />
              </div>

              <div className="p-4 bg-bg-light dark:bg-bg-dark rounded-xl border border-border-light dark:border-border-dark text-left">
                <p className="flex items-center gap-1.5 font-semibold text-primary-light dark:text-primary-dark">
                  <AnimatedDumbbell size={16} /> Challenge target — you'll lose{' '}
                  <span className="text-emerald-500 font-mono">{weightLossPct}%</span> of your weight
                </p>
                <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
                  Persist in structured workouts to achieve a healthier figure.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 4: Age Wheel ── */}
        {step === 4 && (
          <motion.div key="s4" {...stepVariant} className="space-y-5">
            <div>
              <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Step 4 · Age</p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                Your age
              </h1>
              <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
                Age information helps us more accurately assess your metabolic level.
              </p>
            </div>

            <div className="card p-6 flex flex-col items-center space-y-4">
              {/* Wheel visual */}
              <div className="flex flex-col items-center gap-1 py-2 w-full">
                {[age - 2, age - 1].map((a) => (
                  <span key={a} className="text-2xl font-mono text-muted-light dark:text-muted-dark opacity-30 py-1">{a > 0 ? a : ''}</span>
                ))}
                <div className="w-full bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark px-6 py-4 rounded-2xl flex items-baseline justify-center gap-3 my-1">
                  <span className="text-5xl font-extrabold font-mono text-primary-light dark:text-primary-dark">{age}</span>
                  <span className="text-base font-semibold text-secondary-light dark:text-secondary-dark">years old</span>
                </div>
                {[age + 1, age + 2].map((a) => (
                  <span key={a} className="text-2xl font-mono text-muted-light dark:text-muted-dark opacity-30 py-1">{a}</span>
                ))}
              </div>

              <input
                type="range" min="16" max="80" value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="w-full cursor-pointer h-2 bg-bg-light dark:bg-bg-dark rounded-lg border border-border-light dark:border-border-dark accent-gray-900"
              />
            </div>
          </motion.div>
        )}

        {/* ── STEP 5: Pace ── */}
        {step === 5 && (
          <motion.div key="s5" {...stepVariant} className="space-y-5">
            <div>
              <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Step 5 · Pace</p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                What pace would you like to achieve your goal?
              </h1>
            </div>

            <div className="space-y-3">
              {PACE_OPTIONS.map((opt) => {
                const sel = pace === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { triggerHaptic(12); setPace(opt.id); }}
                    className={`w-full text-left transition-all duration-150 active:scale-[0.985] flex rounded-2xl border overflow-hidden ${
                      sel
                        ? 'border-primary-light dark:border-primary-dark shadow-sm'
                        : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-secondary-light dark:hover:border-secondary-dark'
                    }`}
                  >
                    {/* Left accent strip */}
                    <div className={`w-1 flex-shrink-0 transition-all duration-150 ${sel ? 'bg-primary-light dark:bg-primary-dark' : 'bg-transparent'}`} />
                    <div className="flex-1 p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark flex items-center justify-center shrink-0">
                            <DynamicAnimatedIcon iconKey={opt.icon} size={20} />
                          </div>
                          <span className="font-bold text-base text-primary-light dark:text-primary-dark">{opt.title}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          sel ? 'bg-primary-light dark:bg-primary-dark border-primary-light dark:border-primary-dark' : 'border-border-light dark:border-border-dark'
                        }`}>
                          {sel && <Check size={10} strokeWidth={3} className="text-primary-dark dark:text-primary-light" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-light dark:text-muted-dark mt-2 leading-relaxed pl-9">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── STEP 6: Injuries ── */}
        {step === 6 && (
          <motion.div key="s6" {...stepVariant} className="space-y-5">
            <div>
              <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Step 6 · Injuries</p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                Have you suffered any injuries recently?
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {INJURY_OPTIONS.map((inj) => {
                const sel = selectedInjury === inj.id;
                return (
                  <button
                    key={inj.id}
                    onClick={() => { triggerHaptic(12); setSelectedInjury(inj.id); }}
                    className={`card p-4 text-left relative transition-all duration-150 active:scale-[0.97] flex flex-col justify-between h-36 ${
                      sel ? 'border-primary-light dark:border-primary-dark ring-1 ring-primary-light dark:ring-primary-dark shadow-sm' : 'hover:border-secondary-light dark:hover:border-secondary-dark'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-primary-light dark:text-primary-dark">{inj.label}</span>
                        {sel && (
                          <div className="w-4 h-4 rounded-full bg-primary-light dark:bg-primary-dark flex items-center justify-center">
                            <Check size={9} strokeWidth={3} className="text-primary-dark dark:text-primary-light" />
                          </div>
                        )}
                      </div>
                      <p className="label-mono text-muted-light dark:text-muted-dark" style={{ fontSize: 9 }}>{inj.area}</p>
                    </div>
                    <div className="self-end flex items-center justify-center w-14 h-14 rounded-2xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark text-2xl">
                      <DynamicAnimatedIcon iconKey={inj.icon} size={24} />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── STEP 7: Body Shape / Body Fat ── */}
        {step === 7 && (
          <motion.div key="s7" {...stepVariant} className="space-y-5">
            <div>
              <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Step 7 · Body Shape</p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                Choose your desired body shape
              </h1>
              <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
                Slide to set your target body fat percentage.
              </p>
            </div>

            <div className="card p-6 space-y-6">
              {/* Before / After visual using emoji + arrows */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-32 rounded-2xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark flex items-center justify-center text-5xl">
                    <div className="text-5xl mb-4 text-primary-light dark:text-primary-dark flex justify-center">
                      <DynamicAnimatedIcon iconKey={bodyFat > 30 ? 'user' : bodyFat > 20 ? 'activity' : 'dumbbell'} size={48} />
                    </div>
                  </div>
                  <span className="label-mono text-muted-light dark:text-muted-dark">Current</span>
                </div>
                <div className="flex gap-1 text-2xl opacity-30">
                  <span>›</span><span>›</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-32 rounded-2xl bg-bg-light dark:bg-bg-dark border border-primary-light dark:border-primary-dark flex items-center justify-center">
                    <div className="text-5xl mb-4 text-primary-light dark:text-primary-dark flex justify-center">
                      <DynamicAnimatedIcon iconKey={bodyFat < 18 ? 'dumbbell' : bodyFat < 25 ? 'activity' : 'user'} size={48} />
                    </div>
                  </div>
                  <span className="label-mono text-emerald-500">Target</span>
                </div>
              </div>

              {/* Body fat slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="label-mono text-secondary-light dark:text-secondary-dark">Body fat target</span>
                  <span className="font-bold text-lg text-primary-light dark:text-primary-dark font-mono">{bodyFat}%</span>
                </div>
                <input
                  type="range" min="8" max="45" value={bodyFat}
                  onChange={(e) => setBodyFat(parseInt(e.target.value))}
                  className="w-full cursor-pointer h-2 bg-bg-light dark:bg-bg-dark rounded-lg border border-border-light dark:border-border-dark accent-gray-900"
                />
                <div className="flex justify-between label-mono text-muted-light dark:text-muted-dark" style={{ fontSize: 9 }}>
                  <span>Body fat &lt;15%</span>
                  <span>&gt;40%</span>
                </div>
              </div>

              {/* Body fat interpretation */}
              <div className="p-3 bg-bg-light dark:bg-bg-dark rounded-xl border border-border-light dark:border-border-dark text-center">
                <p className="font-semibold text-sm text-primary-light dark:text-primary-dark">
                  {bodyFat < 15 ? 'Athletic / Competition' : bodyFat < 20 ? 'Fit & Toned' : bodyFat < 25 ? 'Active & Healthy' : bodyFat < 32 ? 'Average' : 'Just Starting Out'}
                </p>
                <p className="label-mono text-muted-light dark:text-muted-dark mt-1">
                  {bodyFat}% target body fat
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 8: Equipment ── */}
        {step === 8 && (
          <motion.div key="s8" {...stepVariant} className="space-y-5">
            <div>
              <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Step 8 · Equipment</p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                Choose your preferred training equipment
              </h1>
              <p className="text-xs text-muted-light dark:text-muted-dark mt-1">
                We'll personalise your plan based on what you have access to.
              </p>
            </div>

            <div className="space-y-3">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const sel = equipment === eq.id;
                return (
                  <button
                    key={eq.id}
                    onClick={() => { triggerHaptic(12); setEquipment(eq.id); }}
                    className={`w-full card p-5 text-left flex items-center justify-between transition-all duration-150 active:scale-[0.985] ${
                      sel ? 'border-primary-light dark:border-primary-dark ring-1 ring-primary-light dark:ring-primary-dark shadow-sm' : 'hover:border-secondary-light dark:hover:border-secondary-dark'
                    }`}
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-primary-light dark:text-primary-dark">{eq.title}</span>
                        {sel && (
                          <div className="w-4 h-4 rounded-full bg-primary-light dark:bg-primary-dark flex items-center justify-center">
                            <Check size={9} strokeWidth={3} className="text-primary-dark dark:text-primary-light" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">{eq.desc}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark flex items-center justify-center text-2xl flex-shrink-0">
                      <DynamicAnimatedIcon iconKey={eq.icon} size={24} />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── STEP 9: Prediction Curve ── */}
        {step === 9 && (
          <motion.div key="s9" {...stepVariant} className="space-y-5">
            <div>
              <p className="label-mono text-secondary-light dark:text-secondary-dark mb-1">Almost there!</p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                We predict you'll reach{' '}
                <span className="font-mono text-emerald-500">{targetWeight}kg</span>{' '}
                by {goalDateStr}
              </h1>
            </div>

            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between label-mono text-muted-light dark:text-muted-dark">
                <span>Today · {currentWeight}kg</span>
                <span className="text-emerald-500 font-bold">Goal · {targetWeight}kg</span>
              </div>

              {/* SVG Curve */}
              <div className="h-32 w-full bg-bg-light dark:bg-bg-dark rounded-2xl border border-border-light dark:border-border-dark overflow-hidden relative">
                <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                  {/* Filled area */}
                  <defs>
                    <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M 10 15 C 80 15 140 65 290 60 L 290 80 L 10 80 Z" fill="url(#curveGrad)" />
                  {/* Curve line */}
                  <path d="M 10 15 C 80 15 140 65 290 60" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Start dot */}
                  <circle cx="10" cy="15" r="5" fill="#f59e0b" />
                  {/* End dot + trophy */}
                  <circle cx="290" cy="60" r="5" fill="#10b981" />
                  {/* Vertical dashed lines */}
                  <line x1="10" y1="15" x2="10" y2="80" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
                  <line x1="290" y1="60" x2="290" y2="80" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
                </svg>
                {/* Date labels */}
                <div className="absolute bottom-2 left-4 label-mono text-muted-light dark:text-muted-dark" style={{ fontSize: 9 }}>Today</div>
                <div className="absolute bottom-2 right-4 label-mono text-emerald-500 font-bold" style={{ fontSize: 9 }}>{goalDateStr}</div>
              </div>

              <div className="p-3 bg-bg-light dark:bg-bg-dark rounded-xl border border-border-light dark:border-border-dark text-center">
                <p className="font-bold text-sm text-primary-light dark:text-primary-dark"><AnimatedTrophy size={16} className="inline mr-1" /> Excellent!</p>
                <p className="text-xs text-muted-light dark:text-muted-dark mt-0.5">
                  We've got a clear understanding of you and your body goals.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── STEP 10: Final Summary — Plan Ready ── */}
        {step === 10 && (
          <motion.div key="s10" {...stepVariant} className="space-y-5">
            <div>
              <p className="label-mono text-emerald-500 mb-1 flex items-center gap-1">
                <Sparkles size={12} /> Your plan is ready
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-primary-light dark:text-primary-dark leading-tight">
                Tailor-made for your foundation
              </h1>
              <p className="text-xs text-muted-light dark:text-muted-dark mt-1">Kickstart your journey today!</p>
            </div>

            {/* Summary hero card */}
            <div className="card p-5 space-y-4">
              <p className="label-mono text-secondary-light dark:text-secondary-dark">About You</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Height', value: `${height}cm` },
                  { label: 'Weight', value: `${currentWeight}kg` },
                  { label: 'Age', value: `${age}` },
                ].map((s) => (
                  <div key={s.label} className="bg-bg-light dark:bg-bg-dark p-3 rounded-xl text-center border border-border-light dark:border-border-dark">
                    <p className="label-mono text-muted-light dark:text-muted-dark" style={{ fontSize: 9 }}>{s.label}</p>
                    <p className="font-bold text-sm text-primary-light dark:text-primary-dark mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* BMI bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary-light dark:text-primary-dark flex items-center gap-1.5"><AnimatedActivity size={16}/> BMI data</span>
                  <span className={`label-mono px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    bmiStatus === 'Normal' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                  }`}>{bmi} · {bmiStatus}</span>
                </div>
                <div className="relative h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #60a5fa, #34d399, #fbbf24, #f87171)' }}>
                  <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-800 shadow" style={{ left: `calc(${bmiBarPos}% - 5px)` }} />
                </div>
                <p className="label-mono text-muted-light dark:text-muted-dark text-[9px]">
                  Suggest to {bmiStatus === 'Underweight' ? 'gain' : 'lose'} weight
                </p>
              </div>

              <div className="border-t border-border-light dark:border-border-dark pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-light dark:text-secondary-dark flex items-center gap-1.5"><AnimatedTarget size={16}/> Target body shape</span>
                  <span className="font-bold text-primary-light dark:text-primary-dark">{bodyFat < 20 ? 'Toned' : bodyFat < 28 ? 'Fit' : 'Healthy'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-light dark:text-secondary-dark flex items-center gap-1.5"><AnimatedZap size={16}/> Fitness ability</span>
                  <span className="font-bold text-primary-light dark:text-primary-dark">{pace === 'intense' ? 'Advanced' : pace === 'normal' ? 'Intermediate' : 'Beginner'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Continue Button */}
      <motion.button
        variants={item}
        onClick={handleNext}
        className="btn-pill w-full py-4 text-sm font-semibold tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-[0.985] transition-all"
      >
        {step === totalSteps ? 'START MY PLAN' : 'CONTINUE'}
        {step < totalSteps && <ChevronRight size={16} />}
      </motion.button>

    </motion.div>
  );
}
