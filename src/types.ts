export interface StudySession {
  id: string;
  subject: string;
  topic?: string;
  date: string;
  startTime: string;
  duration: number;
  notes?: string;
  doubts?: string; // Add doubts feature (up to 10,000 words)
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  rest?: string;
  howTo?: string;
  iconKey?: string;
}

export interface WorkoutPlan {
  day: string;
  type: string;
  exercises: Exercise[];
}

export interface WorkoutLog {
  id: string;
  date: string;
  day: string;
  type: string;
  exercises: {
    name: string;
    howTo?: string;
    rest?: string;
    sets: { reps: number; weight: number; completed: boolean }[];
  }[];
  startTime?: number;
  endTime?: number;
  isSaved?: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  note?: string;
  date: string;
}

export interface TimetableBlock {
  id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  slot?: string;
  teacher?: string;
  room?: string;
  courseCode?: string;
  color?: string;
  topicsByDate?: Record<string, string>; // Saved by date/month (e.g. '2026-09-08' -> topic string)
}

export interface Task {
  id: string;
  text: string;
  subtask?: string; // "what to do actually" sub-option underneath main heading
  completed: boolean;
  date: string;
  linkedBlockId?: string;
}

export interface DayReview {
  date: string;
  mood: number;
  accomplished: string;
  improve: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
}

// ── Profile / Body Stats ───────────────────────────────────────────────────
export interface WeightLog {
  date: string;
  weight: number;
}

export type FitnessGoal = 
  | 'weight_loss'
  | 'weight_gain'
  | 'muscle_building'
  | 'body_recomp'
  | 'strength_building'
  | 'conditioning'
  | 'general_fitness'
  | 'mobility'
  | 'endurance'
  | 'body_toning';

export interface UserProfile {
  age: number;
  height: number; // cm
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  goalWeight: number; // kg
  weightHistory: WeightLog[];
  currentCalorieTarget: number;
  fitnessGoal?: FitnessGoal;
  dailyProteinTarget?: number; // grams
}

// ── Nutrition / Mess types ─────────────────────────────────────────────────
export type MessType = 'veg' | 'nonveg' | 'special';
export type MealSlot = 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'nightCanteen';
export type PortionSize = 0.5 | 1 | 1.5 | 2;

export interface MenuItem {
  name: string;
  estCalories: number;
}

export interface MealMenu {
  slot: MealSlot;
  items: MenuItem[];
}

export interface DayMenu {
  date: string; // 'yyyy-MM-dd'
  meals: MealMenu[];
}

export interface MenuMonth {
  month: string; // e.g., '2024-10'
  days: DayMenu[];
}

export interface EatLogItem {
  name: string;
  quantity: PortionSize;
  calories: number; // estimated based on quantity
}

export interface MealItemLog {
  id: string; // unique ID for editing extra items
  name: string;
  calories: number; // base calories for 1 portion
  portion: number; // e.g., 0.5, 1, 2
  isExtra: boolean; // true if added via "Ate something else?"
}

export interface NutritionLog {
  id: string;
  date: string;       // 'yyyy-MM-dd'
  isSaved?: boolean;  // Tracks if the user explicitly hit "Save"
  mealsEaten: {
    slot: MealSlot;
    items: MealItemLog[];
  }[];
  dailyTotal: number;
}
// ──────────────────────────────────────────────────────────────────────────

export interface AppData {
  studySessions: StudySession[];
  workoutPlans: WorkoutPlan[];
  workoutLogs: WorkoutLog[];
  expenses: Expense[];
  timetable: TimetableBlock[];
  tasks: Task[];
  reviews: DayReview[];
  settings: AppSettings;
  
  // Profile & Nutrition Module
  profile: UserProfile | null;
  menuMonths: MenuMonth[];
  nutritionLogs: NutritionLog[];
  messPreference: MessType;
  geminiApiKey: string;
}
