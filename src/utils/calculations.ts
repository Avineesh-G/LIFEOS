import { FitnessGoal } from '../types';

export interface FitnessGoalConfig {
  id: FitnessGoal;
  label: string;
  description: string;
  iconName: 'Flame' | 'TrendingUp' | 'Dumbbell' | 'Zap' | 'Shield' | 'Heart' | 'Sprout' | 'Compass' | 'Activity' | 'Sparkles';
  calOffset: number; // e.g. -500, +400, 0
  proteinMultiplier: number; // grams of protein per kg body weight
  recommendedSplit: string; // Recommended gym routine
  splitDescription: string;
}

export const FITNESS_GOALS: FitnessGoalConfig[] = [
  {
    id: 'weight_loss',
    label: 'Weight Loss',
    description: 'Safe 500 kcal deficit targeting lean fat reduction without metabolic slowdown.',
    iconName: 'Flame',
    calOffset: -500,
    proteinMultiplier: 2.0,
    recommendedSplit: 'Full Body & Metabolic HIIT',
    splitDescription: 'High-density resistance with short rest intervals and cardio intervals.'
  },
  {
    id: 'weight_gain',
    label: 'Weight Gain',
    description: 'Caloric surplus with high clean carbohydrates to gain overall mass.',
    iconName: 'TrendingUp',
    calOffset: 400,
    proteinMultiplier: 1.8,
    recommendedSplit: 'Heavy Compound Upper/Lower Split',
    splitDescription: 'Foundational multi-joint lifts with progressive overload and longer rest.'
  },
  {
    id: 'muscle_building',
    label: 'Muscle Building',
    description: 'Clean lean hypertrophy surplus with high protein for muscle volume.',
    iconName: 'Dumbbell',
    calOffset: 250,
    proteinMultiplier: 2.2,
    recommendedSplit: 'Push / Pull / Legs (PPL)',
    splitDescription: 'Dedicated muscle isolation with 8-12 rep ranges and volume hypertrophy.'
  },
  {
    id: 'body_recomp',
    label: 'Fat Loss + Muscle Gain',
    description: 'Body recomposition: high protein with mild deficit to burn fat while gaining muscle.',
    iconName: 'Zap',
    calOffset: -200,
    proteinMultiplier: 2.3,
    recommendedSplit: 'Upper / Lower Power & Hypertrophy',
    splitDescription: 'High tension lifting with progressive volume to stimulate muscle during deficit.'
  },
  {
    id: 'strength_building',
    label: 'Strength Building',
    description: 'Performance surplus to fuel heavy neuromuscular strength and power output.',
    iconName: 'Shield',
    calOffset: 200,
    proteinMultiplier: 2.0,
    recommendedSplit: 'Powerlifting / Heavy Compounds',
    splitDescription: 'Squat, Bench, Deadlift, Overhead Press in 3-6 rep ranges with 2-3m rest.'
  },
  {
    id: 'conditioning',
    label: 'Fitness & Conditioning',
    description: 'Cardiovascular efficiency, athletic work capacity, and stamina.',
    iconName: 'Heart',
    calOffset: 0,
    proteinMultiplier: 1.6,
    recommendedSplit: 'Functional Hybrid & Kettlebell Circuits',
    splitDescription: 'Continuous motion, athletic complexes, and heart rate elevation.'
  },
  {
    id: 'general_fitness',
    label: 'General Fitness',
    description: 'Equilibrium lifestyle maintenance, daily vitality, and healthy biomarkers.',
    iconName: 'Sprout',
    calOffset: 0,
    proteinMultiplier: 1.6,
    recommendedSplit: 'Balanced 3-Day Full Body Split',
    splitDescription: 'Sustainable, joint-friendly full body strength and aerobic conditioning.'
  },
  {
    id: 'mobility',
    label: 'Flexibility & Mobility',
    description: 'Joint longevity, range of motion, posture alignment, and active recovery.',
    iconName: 'Compass',
    calOffset: 0,
    proteinMultiplier: 1.4,
    recommendedSplit: 'Mobility Flow & Active Recovery',
    splitDescription: 'Dynamic stretching, thoracic opening, hip mobility, and core stabilization.'
  },
  {
    id: 'endurance',
    label: 'Stamina & Endurance',
    description: 'Aerobic glycogen fuel, mitochondrial density, and distance capacity.',
    iconName: 'Activity',
    calOffset: 150,
    proteinMultiplier: 1.5,
    recommendedSplit: 'Endurance & Cardio Interval Split',
    splitDescription: 'Higher rep endurance circuits (15-20 reps) paired with steady-state cardio.'
  },
  {
    id: 'body_toning',
    label: 'Body Toning',
    description: 'Mild deficit with high protein to reveal muscle definition and tighten physique.',
    iconName: 'Sparkles',
    calOffset: -300,
    proteinMultiplier: 2.0,
    recommendedSplit: 'Toning Supersets & Core Focus',
    splitDescription: '12-15 rep supersets with minimal rest and core tightening emphasis.'
  }
];

export function calculateBMR(age: number, height: number, weight: number, gender: 'male' | 'female' | 'other'): number {
  // Mifflin-St Jeor Equation
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'male') {
    bmr += 5;
  } else if (gender === 'female') {
    bmr -= 161;
  } else {
    // For 'other', use an average
    bmr -= 78; 
  }
  return bmr;
}

export function calculateTDEE(bmr: number, activityLevel: 'sedentary' | 'light' | 'moderate' | 'active'): number {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725
  };
  return bmr * multipliers[activityLevel];
}

export function calculateCalorieTarget(
  tdee: number, 
  currentWeight: number, 
  goalWeight: number,
  fitnessGoal?: FitnessGoal
): number {
  if (fitnessGoal) {
    const config = FITNESS_GOALS.find(g => g.id === fitnessGoal);
    if (config) {
      const calculated = tdee + config.calOffset;
      // Minimum safe floor of 1400 kcal
      return Math.round(Math.max(calculated, 1400));
    }
  }

  // Fallback to weight-based calculation if no explicit fitness goal set
  if (currentWeight > goalWeight) {
    const target = tdee - 500;
    return Math.round(Math.max(target, 1400));
  } else if (currentWeight < goalWeight) {
    return Math.round(tdee + 300);
  } else {
    return Math.round(tdee);
  }
}

export function calculateProteinTarget(weight: number, fitnessGoal?: FitnessGoal): number {
  const config = FITNESS_GOALS.find(g => g.id === fitnessGoal);
  const multiplier = config ? config.proteinMultiplier : 1.8;
  return Math.round(weight * multiplier);
}
