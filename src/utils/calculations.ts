import { UserProfile } from '../types';

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

export function calculateCalorieTarget(tdee: number, currentWeight: number, goalWeight: number): number {
  // Safe weight loss is usually ~500 kcal deficit. 
  // Minimum safe floor: 1200 for females, 1500 for males (we'll just use a safe floor of 1400 generically here to be safe)
  
  if (currentWeight > goalWeight) {
    // Weight loss
    const target = tdee - 500;
    return Math.max(target, 1400); // Floor
  } else if (currentWeight < goalWeight) {
    // Weight gain
    return tdee + 300; // Small surplus
  } else {
    // Maintenance
    return tdee;
  }
}
