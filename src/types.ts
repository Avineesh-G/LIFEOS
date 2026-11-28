export type FocusMode = 'pomodoro' | 'deep' | 'sprint' | 'custom' | 'stopwatch';

export interface StudySession {
  id: string;
  subject: string;
  topic?: string;
  date: string;
  startTime: string;
  duration: number;
  notes?: string;
  doubts?: string; // Add doubts feature (up to 10,000 words)
  mode?: FocusMode;
  linkedTaskId?: string;
  linkedProjectId?: string;
  distractionsLogged?: number;
  completedAt?: string;
}

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  pushedTaskId?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: 'build' | 'academic' | 'career' | 'personal' | 'other';
  status: ProjectStatus;
  targetDate?: string; // 'yyyy-MM-dd'
  description?: string;
  blockerNote?: string;
  milestones: ProjectMilestone[];
  linkedDriveFileIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type TripCategory = 'home' | 'hostel' | 'weekend' | 'hackathon' | 'interview' | 'other';
export type PackingGroup = 'documents' | 'tech' | 'clothing' | 'essentials';

export interface TripPackingItem {
  id: string;
  name: string;
  group: PackingGroup;
  packed: boolean;
  quantity?: string;
}

export interface TripPlan {
  id: string;
  title: string;
  destination?: string;
  category: TripCategory;
  departureDate: string; // 'yyyy-MM-dd'
  returnDate?: string;
  bookingRef?: string;
  notes?: string;
  packingItems: TripPackingItem[];
  linkedOutingId?: string;
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DecisionStatus = 'open' | 'decided' | 'revisited';

export interface DecisionCriterion {
  id: string;
  label: string;
  weight: 1 | 2 | 3 | 4 | 5;
}

export interface DecisionOption {
  id: string;
  title: string;
  scores: Record<string, 1 | 2 | 3 | 4 | 5>;
  pros: string[];
  cons: string[];
}

export interface DecisionRecord {
  id: string;
  question: string;
  category: 'career' | 'finance' | 'tech' | 'study' | 'life';
  status: DecisionStatus;
  criteria: DecisionCriterion[];
  options: DecisionOption[];
  expectedOutcome?: string;
  chosenOptionId?: string;
  decidedAt?: string;
  revisitDate?: string; // 'yyyy-MM-dd'
  calendarEventId?: string;
  actualOutcome?: string;
  verdict?: 'right_call' | 'mixed' | 'lesson_learned';
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string; // 'yyyy-MM-dd'
  morningEnergy?: 1 | 2 | 3 | 4 | 5;
  morningFocusTheme?: string;
  morningPriorityTaskIds?: string[];
  morningNote?: string;
  nightMood?: 1 | 2 | 3 | 4 | 5;
  wins?: string[];
  gratitude?: string;
  improve?: string;
  brainDump?: string;
  rolledOverAt?: string;
  hideFromAi?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CircleRelation = 'family' | 'friend' | 'college' | 'work' | 'other';

export interface CircleInteraction {
  id: string;
  date: string; // 'yyyy-MM-dd'
  type: 'call' | 'meetup' | 'message';
  note?: string;
}

export interface CircleGiftIdea {
  id: string;
  text: string;
  gifted?: boolean;
}

export interface CirclePerson {
  id: string;
  name: string;
  relation: CircleRelation;
  phone?: string;
  birthday?: string; // 'MM-DD' or 'YYYY-MM-DD'
  catchUpIntervalDays?: number; // 0 = off, 7, 14, 30, 60
  lastContactedDate?: string; // 'yyyy-MM-dd'
  giftIdeas?: CircleGiftIdea[];
  notes?: string;
  linkedMoneyLentName?: string;
  linkedOutingPersonId?: string;
  interactions?: CircleInteraction[];
  createdAt: string;
  updatedAt: string;
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

export interface MoneyLentItem {
  id: string;
  personName: string;
  amount: number;
  date: string; // 'YYYY-MM-DD'
  note?: string;
  type?: 'given' | 'borrowed'; // 'given' (money lent to others) | 'borrowed' (money lent/borrowed from others)
  status: 'pending' | 'returned';
  returnedDate?: string; // 'YYYY-MM-DD'
  createdAt: string;
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
  dueDate?: string; // 'YYYY-MM-DD'
  startTime?: string; // 'HH:mm'
  endTime?: string; // 'HH:mm'
  reminderTime?: string; // 'HH:mm'
}

export interface DayReview {
  date: string;
  mood: number;
  accomplished: string;
  improve: string;
}

export type TransitionMode = 'fast' | 'efficient' | 'soft';
export type FluidIntensity = 'subtle' | 'balanced' | 'vivid';
export type ThemeMode = 'dynamic' | 'night';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  themeMode?: ThemeMode;
  accentColor: string;
  transitionMode?: TransitionMode;
  fluidIntensity?: FluidIntensity;
  notificationsEnabled?: boolean;
  notificationLeadMinutes?: number; // 5 | 10 | 15 | 20 (default 10)
  taskNotificationsEnabled?: boolean;
  timetableNotificationsEnabled?: boolean;
  navPinned?: [string, string];
  interfaceColors?: Record<string, string>;
  performanceMode?: 'auto' | 'full' | 'lite';
  reduceBlurEffects?: boolean;
  ambientLight?: 'off' | 'low' | 'medium';
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
  estProtein?: number;
  diet?: 'veg' | 'non-veg' | null;
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
  protein?: number; // base protein grams for 1 portion
  carbs?: number;
  fats?: number;
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
    isSkipped?: boolean; // User marked this meal as skipped
  }[];
  dailyTotal: number;
}
// ── Vault / Password Keeper Types ──────────────────────────────────────────
export type VaultCategory = 'study' | 'social' | 'work' | 'finance' | 'personal' | 'other';

export interface VaultItem {
  id: string;
  title: string;
  category: VaultCategory;
  usernameOrEmail: string;
  encryptedPassword: string; // Base64 ciphertext
  iv: string;                // Base64 12-byte IV
  websiteUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultConfig {
  hasMasterPin?: boolean;
  salt: string;
  hashedMasterPin?: string;
  useBiometrics?: boolean;
  useSystemLock?: boolean;
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

  // Vault / Password Keeper Module
  vaultItems?: VaultItem[];
  vaultConfig?: VaultConfig | null;

  // Laundry Module
  laundryBatches?: LaundryBatch[];

  // Shopping Lists Module
  shoppingLists?: ShoppingList[];

  // Notes & Ideas Module
  notes?: NoteItem[];

  // Money Lent Module (Loans to friends/colleagues, excluded from expenses)
  moneyLent?: MoneyLentItem[];

  // AI Chat History Module (Saved search and assistant sessions)
  aiChatHistory?: AiChatSession[];

  // Drive & Documents Module
  driveFolders?: DriveFolder[];
  driveFiles?: DriveFile[];
  driveStorage?: DriveStorageMetadata;
  _ownerUid?: string;

  // Calendar Module
  calendarEvents?: CalendarEvent[];

  // Journal & Wind-Down Module
  journalEntries?: JournalEntry[];

  // Inner Circle CRM Module
  circleContacts?: CirclePerson[];

  // Projects & Milestones Module
  projects?: ProjectItem[];

  // Trips & Smart Packing Module
  trips?: TripPlan[];

  // Decision Workbench Module
  decisions?: DecisionRecord[];
}

export type CalendarCategory = 'general' | 'study' | 'gym' | 'work' | 'personal' | 'meeting' | 'outing';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // 'yyyy-MM-dd'
  startTime?: string; // 'HH:mm'
  endTime?: string; // 'HH:mm'
  isAllDay?: boolean;
  category: CalendarCategory;
  color?: string;
  syncToTimeline?: boolean;
  syncToTasks?: boolean;
  notificationLeadMinutes?: number; // 0 (at start), 15, 20, 30, 60, 1440, or -1 (off)
  createdAt: string;
  updatedAt: string;
}

export interface AiChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pathname?: string;
  messages: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    dataSentContext?: string;
  }[];
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  pageView: 'white' | 'lined' | 'grid';
  monthKey: string; // 'YYYY-MM'
  isArchived: boolean;
  hideFromAi?: boolean;
  isLocked?: boolean;
  colorTone?: string;
  syncStatus?: 'synced' | 'syncing' | 'pending' | 'error';
  createdAt: string;
  updatedAt: string;
}

// ── Laundry Module ─────────────────────────────────────────────────────────
export interface LaundryItemCount {
  category: string;
  count: number;
}

export interface LaundryBatch {
  id: string;
  submitDate: string; // 'YYYY-MM-DD'
  returnDate?: string; // 'YYYY-MM-DD' manual entry of expected/actual return
  items: LaundryItemCount[];
  totalClothes: number;
  status: 'pending' | 'submitted' | 'received';
  notes?: string;
  createdAt: string;
}

// ── Shopping Lists Module ──────────────────────────────────────────────────
export interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string; // e.g. "2", "1 bag", "500g"
  checked: boolean;
  notes?: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  items: ShoppingItem[];
  category?: string;
}

// ── Drive & Document Locker Module ──────────────────────────────────────────
export interface DriveFolder {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriveFile {
  id: string;
  name: string;
  folderId?: string | null;
  fileSize: number; // in bytes
  mimeType: string;
  storagePath: string;
  downloadUrl: string;
  localCachedUri?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriveStorageMetadata {
  usedBytes: number;
  maxBytes: number; // 5 * 1024 * 1024 * 1024 (5 GB)
  fileCount: number;
  folderCount: number;
  lastCalculatedAt: string;
}

export interface PublicShareRecord {
  shareId: string;
  ownerUid: string;
  ownerEmail?: string;
  type: 'file' | 'folder';
  itemId: string;
  title: string;
  fileSize: number;
  mimeType?: string;
  downloadUrl: string;
  folderItems?: { id: string; name: string; size: number; downloadUrl: string; mimeType?: string }[];
  createdAt: string;
  expiresAt?: string | null;
  isRevoked: boolean;
}
