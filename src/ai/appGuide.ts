/**
 * LifeOS Comprehensive Application Structure & Feature Guide
 * Standardized reference for the "Ask LifeOS" AI Assistant.
 * 
 * Rules:
 * 1. Contains complete step-by-step guides, locations, settings, and navigation.
 * 2. Does NOT contain user personal data (privacy-first stage).
 * 3. Enforces strict scope limits (only LifeOS app mechanics).
 */

export interface InterfaceGuide {
  id: string;
  name: string;
  routes: string[];
  purpose: string;
  mainFeatures: string[];
  commonActions: { action: string; steps: string }[];
  settingsLocation?: string;
}

export const APP_GUIDE_DATA: Record<string, InterfaceGuide> = {
  home: {
    id: 'home',
    name: 'Home',
    routes: ['/'],
    purpose: 'Executive overview dashboard showing active session status, 7-day rolling calendar strip, daily brief, and quick habit progress.',
    mainFeatures: [
      'Live clock & date header pill',
      'Ask LifeOS AI floating pill launcher',
      'Material 3 Expressive Daily Brief card',
      '7-Day interactive rolling calendar strip with fluid day cells',
      '4-Pillar quick progress preview (Study, Gym, Tasks, Spending)',
      'Today To-Do list preview with interactive checkboxes',
    ],
    commonActions: [
      { action: 'Launch AI Assistant', steps: 'Tap the floating Ask LifeOS pill on Home or the 4th fixed sparkle tab in the bottom dock.' },
      { action: 'Switch calendar day', steps: 'Tap any day pill (3 past days, today, or 3 future days) on the 7-day strip.' },
      { action: 'Quick complete task', steps: 'Tap the checkbox next to any task in the Tasks Today list.' },
      { action: 'View detailed section', steps: 'Tap any of the 4 pillar cards (Study, Gym, Tasks, Spending) to navigate directly.' },
    ],
  },

  study: {
    id: 'study',
    name: 'Study',
    routes: ['/study', '/study/timer', '/study/history', '/study/heatmap'],
    purpose: 'Focus timer, study session logging, topic notes, doubt tracking, and 365-day consistency heatmap.',
    mainFeatures: [
      'Interactive Stopwatch / Pomodoro timer with vibration signals',
      'Subject selector with customizable subject list',
      'Doubt & notes logger (supports up to 10,000 words per session)',
      'Session history log with subject breakdown',
      '365-Day study consistency heatmap',
    ],
    commonActions: [
      { action: 'Start a study session', steps: 'Navigate to Study > Select Subject > Tap "Start Session" to open StudyTimer.' },
      { action: 'Log session notes & doubts', steps: 'Inside StudyTimer or after finishing, enter notes in the Notes/Doubts text field.' },
      { action: 'View 365-day study heatmap', steps: 'Tap "View Heatmap" at the top right of the Study page.' },
      { action: 'View session history', steps: 'Tap "Study History" button to view past logged focus sessions.' },
    ],
  },

  gym: {
    id: 'gym',
    name: 'Gym & Workouts',
    routes: ['/gym', '/gym/workout', '/gym/split', '/gym/exercise-history', '/gym/onboarding'],
    purpose: 'Workout split management, set/rep/weight logging, rest timers, exercise instructions, and progressive overload tracking.',
    mainFeatures: [
      'Weekly workout split editor (Push, Pull, Legs, Upper, Lower, Rest)',
      'Live workout session logger with set checkboxes, rep count & weight inputs',
      'Automatic rest timer overlay',
      'Exercise guide with execution tips',
      'Exercise weight history log',
      'Gym onboarding setup wizard',
    ],
    commonActions: [
      { action: 'Start today workout', steps: 'Navigate to Gym > Tap "Start Workout" for today split or choose a routine.' },
      { action: 'Log sets and weight', steps: 'Enter weight (kg) and reps, then tap the set checkmark to complete.' },
      { action: 'Customize workout split', steps: 'Tap "Edit Split" on the Gym home screen to modify exercises per day.' },
      { action: 'Check exercise history', steps: 'Tap "Exercise History" or select any exercise to view previous PRs and weight trends.' },
    ],
  },

  nutrition: {
    id: 'nutrition',
    name: 'Nutrition & Mess',
    routes: ['/nutrition'],
    purpose: 'College mess menu integration, daily calorie/protein tracking, extra food logging, and portion size estimation.',
    mainFeatures: [
      '5 Meal Slots: Breakfast, Lunch, Snacks, Dinner, Night Canteen',
      'Portion size selectors (0.5x, 1.0x, 1.5x, 2.0x)',
      'Calorie & protein target progress rings',
      'Custom extra food item logger ("Ate something else?")',
      'Veg / Non-Veg mess menu filter',
    ],
    commonActions: [
      { action: 'Log a mess meal', steps: 'Navigate to Nutrition > Select Meal Slot (e.g. Lunch) > Select items eaten > Tap "Save Meal".' },
      { action: 'Adjust portion size', steps: 'Tap the portion pill next to an item (0.5x, 1x, 1.5x, 2x).' },
      { action: 'Log outside / extra food', steps: 'Tap "+ Log Extra Food", enter item name & estimated calories, then save.' },
      { action: 'Set calorie target', steps: 'Go to Settings > Body Profile & Targets to update daily calorie target.' },
    ],
  },

  spending: {
    id: 'spending',
    name: 'Spending & Money',
    routes: ['/spending'],
    purpose: 'Daily expense tracker, category breakdown, budget monitoring, and Money Lent (peer loan) tracking.',
    mainFeatures: [
      'Quick expense entry with amount (₹), category, and note',
      'Monthly total spending & category breakdown chart',
      'Money Lent tab: Track loans given to friends with pending/returned status',
      'Expense history feed with edit & delete actions',
    ],
    commonActions: [
      { action: 'Add an expense', steps: 'Navigate to Spending > Tap "+ Add Expense" > Enter amount (₹), select category & note > Save.' },
      { action: 'Log money lent to a friend', steps: 'Go to Spending > Switch to "Money Lent" tab > Tap "+ Add Money Lent" > Enter person name, amount & note.' },
      { action: 'Mark lent money as returned', steps: 'In the Money Lent tab, tap "Mark Returned" next to the person entry.' },
    ],
  },

  tasks: {
    id: 'tasks',
    name: 'To-Do Tasks',
    routes: ['/tasks'],
    purpose: 'Daily task list, subtasks, task scheduling, completion toggles, and timetable class integration.',
    mainFeatures: [
      'Quick task creation with main text and subtask details',
      'Date picker assignment (Today, Tomorrow, or specific date)',
      'Interactive completion checkboxes with haptic feedback',
      'Completion status filter (All, Pending, Completed)',
    ],
    commonActions: [
      { action: 'Add a new task', steps: 'Navigate to To-Do Tasks > Type task in input bar > Add subtask detail if needed > Tap Add.' },
      { action: 'Complete a task', steps: 'Tap the interactive checkbox next to the task.' },
      { action: 'Filter tasks', steps: 'Use the filter pills (All, Pending, Completed) at the top of the task list.' },
    ],
  },

  timetable: {
    id: 'timetable',
    name: 'Timetable',
    routes: ['/timetable'],
    purpose: 'Weekly academic class schedule, lecture slots, room numbers, teacher names, and per-date lecture topic tracking.',
    mainFeatures: [
      'Day-by-day weekly timetable grid (Monday – Sunday)',
      'Class details: Subject, time slot (e.g. 09:00 - 10:00), room number, teacher',
      'Per-date topic logger: save what was taught in specific lectures',
      'Automatic Android notification alerts 10m before class',
    ],
    commonActions: [
      { action: 'Add class block', steps: 'Navigate to Timetable > Select Day > Tap "+ Add Class" > Enter subject, start/end time, room & teacher.' },
      { action: 'Log topic taught today', steps: 'Tap on a class card > Enter topic in "Topic Taught Today" field > Save.' },
    ],
  },

  notes: {
    id: 'notes',
    name: 'Notes & Ideas',
    routes: ['/notes'],
    purpose: 'Distraction-free notebook with page view styles, month grouping, archiving, and color accenting.',
    mainFeatures: [
      'Page view styles: Blank White, Lined Paper, Grid Paper',
      'Month grouping (e.g. October 2026)',
      'Note archiving & search filter',
      'Color tone accent tags',
    ],
    commonActions: [
      { action: 'Create note', steps: 'Navigate to Notes & Ideas > Tap "+ New Note" > Enter title and content.' },
      { action: 'Change paper background style', steps: 'Open note > Tap the style selector to toggle between Blank, Lined, or Grid.' },
      { action: 'Archive a note', steps: 'Tap the Archive icon on any note card.' },
    ],
  },

  vault: {
    id: 'vault',
    name: 'Vault (Password Keeper)',
    routes: ['/vault'],
    purpose: 'Secure local password vault protected by phone screen lock (biometrics/PIN) and AES-GCM encryption.',
    mainFeatures: [
      'Categories: Study, Social, Work, Finance, Personal, Other',
      'AES-256-GCM encryption on device',
      'Protected by Android Biometrics / Master PIN',
      'Copy username/password with quick auto-clear clipboard',
      'IMPORTANT SECURITY RULE: AI assistant ONLY explains how to navigate Vault; AI assistant NEVER reads, handles, or requests actual passwords.',
    ],
    commonActions: [
      { action: 'Open Vault', steps: 'Navigate to Vault (via bottom dock or More Hub) > Authenticate via Phone Screen Lock / Fingerprint.' },
      { action: 'Add account credentials', steps: 'Tap "+ Add Vault Item" > Select category, enter title, username/email, and password > Save.' },
      { action: 'Copy password securely', steps: 'Tap the copy icon next to password field (auto-clears from clipboard).' },
    ],
  },

  shopping: {
    id: 'shopping',
    name: 'Shopping Lists',
    routes: ['/shopping'],
    purpose: 'Categorized shopping & grocery lists with item checking, quantities, and list templates.',
    mainFeatures: [
      'Multiple list management (Groceries, Tech, Hostel, Supplies)',
      'Item quantities (e.g. "2 kg", "1 pack")',
      'Interactive item checking',
      'Save lists as reusable templates',
    ],
    commonActions: [
      { action: 'Create shopping list', steps: 'Navigate to Shopping Lists > Tap "+ New List" > Enter list name & category.' },
      { action: 'Add item to list', steps: 'Open list > Type item name and quantity > Tap Add.' },
    ],
  },

  outings: {
    id: 'outings',
    name: 'Outing Expenses',
    routes: ['/outings'],
    purpose: 'Group trip expense splitting, per-friend balances, and compressed local IndexedDB receipt photo storage.',
    mainFeatures: [
      'Group outing creation with participant list',
      'Expense splitting (equal or exact per person)',
      'On-device compressed receipt image cache (IndexedDB)',
      'Settlement calculations ("Who owes whom")',
    ],
    commonActions: [
      { action: 'Create an outing', steps: 'Navigate to Outing Expenses > Tap "+ New Outing" > Enter title & add friends.' },
      { action: 'Add shared expense', steps: 'Open outing > Tap "+ Add Expense" > Select payer, amount, who split, and attach receipt photo if needed.' },
      { action: 'Check settlements', steps: 'Open outing > Scroll to "Settlements & Balances" section.' },
    ],
  },

  laundry: {
    id: 'laundry',
    name: 'Laundry Tracker',
    routes: ['/laundry'],
    purpose: 'Hostel/service laundry batch tracker with garment category counters and return date reminders.',
    mainFeatures: [
      'Clothing counters by category (Shirts, Pants, Undergarments, Towels, Bedsheets)',
      'Submission date & expected return date logger',
      'Batch status: Pending, Submitted, Received',
    ],
    commonActions: [
      { action: 'Log new laundry batch', steps: 'Navigate to Laundry > Tap "+ New Batch" > Count clothes by category > Set expected return date > Save.' },
      { action: 'Mark laundry as received', steps: 'Tap "Mark Received" on an active pending batch.' },
    ],
  },

  history: {
    id: 'history',
    name: 'Life History Log',
    routes: ['/history'],
    purpose: 'Timeline view of past study focus hours, workout sessions, task completions, and daily mood reviews.',
    mainFeatures: [
      'Chronological activity feed',
      'Daily mood & reflection reviews',
      'Filter by category (All, Study, Gym, Tasks)',
    ],
    commonActions: [
      { action: 'View past activity history', steps: 'Navigate to History (via More Hub) > Scroll timeline feed.' },
      { action: 'Add daily review', steps: 'In History screen, tap "Log Daily Review" > Select mood rating (1-5) and write reflection.' },
    ],
  },

  settings: {
    id: 'settings',
    name: 'Settings & System Preferences',
    routes: ['/settings'],
    purpose: 'Central control panel for notifications, appearance, performance, security, body targets, AI configuration, backups, and reset.',
    mainFeatures: [
      'Notifications & Reminders: System alerts & lead time selection (5m, 10m, 15m, 20m)',
      'Appearance & Theme: Light Mode / Dark Mode toggle',
      'Interface Colors: Personalize tonal accent colors',
      'Performance Mode: Auto / Full / Lite toggle',
      'Reduce Blur Effects: Replaces glass blurs with crisp translucent surfaces',
      'Navigation Bar Haptics: Tactile feedback slider (0% - 100%)',
      'App Security & Lock: Phone screen lock protection toggle (Fingerprint / PIN)',
      'Body Profile & Targets: Calorie target & metabolic baseline',
      'AI Coach Integration (Groq): Mode A (API Key), Mode B (Proxy URL), Privacy read toggle, Section permissions grid, Action proposals switch, Clear Chat button',
      'Data Backup & Recovery: Versioned JSON export & encrypted import restore',
      'Account & Reset: Sign Out & Reset All Data options',
    ],
    commonActions: [
      { action: 'Change app theme', steps: 'Go to Settings > Appearance & Theme > Toggle Light Mode / Dark Mode.' },
      { action: 'Change app color', steps: 'Go to Settings > Interface Colors (or tap "Personalize") to open color selection.' },
      { action: 'Set Groq API Key', steps: 'Go to Settings > AI Coach Integration > Enter key in "Groq API Key (Mode A)" > Tap Save.' },
      { action: 'Enable Reduce Blur Effects', steps: 'Go to Settings > Performance Mode > Toggle "Reduce blur effects".' },
      { action: 'Check for app updates', steps: 'Go to Settings > Scroll to bottom > Tap "Check for App Update".' },
    ],
  },

  interfaceColors: {
    id: 'interface-colors',
    name: 'Interface Colors Personalization',
    routes: ['/settings/interface-colors'],
    purpose: 'Single teal/cyan color accent system matching Android 17 Gemini Intelligence design language.',
    mainFeatures: [
      'Single Unified Accent System: Teal/Cyan default accent (#2DD4BF)',
      'App Color Picker: Recolors all glass surfaces, glow cards, and navigation accents consistently',
    ],
    commonActions: [
      { action: 'Change app accent color', steps: 'Navigate to Settings > Interface Colors > Select color swatch or enter custom hex code.' },
    ],
  },
};

/**
 * Maps location pathname to corresponding interface guide ID.
 */
export function getInterfaceIdFromPath(pathname: string): string {
  const cleanPath = (pathname || '/').toLowerCase().split('?')[0];

  if (cleanPath === '/' || cleanPath === '') return 'home';
  if (cleanPath.startsWith('/study')) return 'study';
  if (cleanPath.startsWith('/gym')) return 'gym';
  if (cleanPath.startsWith('/nutrition')) return 'nutrition';
  if (cleanPath.startsWith('/spending')) return 'spending';
  if (cleanPath.startsWith('/tasks')) return 'tasks';
  if (cleanPath.startsWith('/timetable')) return 'timetable';
  if (cleanPath.startsWith('/notes')) return 'notes';
  if (cleanPath.startsWith('/vault')) return 'vault';
  if (cleanPath.startsWith('/shopping')) return 'shopping';
  if (cleanPath.startsWith('/outings')) return 'outings';
  if (cleanPath.startsWith('/laundry')) return 'laundry';
  if (cleanPath.startsWith('/history')) return 'history';
  if (cleanPath.startsWith('/settings/interface-colors')) return 'interfaceColors';
  if (cleanPath.startsWith('/settings')) return 'settings';

  return 'home';
}

/**
 * Builds a compact system prompt for Groq AI containing scope rules, current screen context,
 * and relevant step-by-step guides.
 */
export function getSystemPromptForContext(pathname: string): string {
  const activeId = getInterfaceIdFromPath(pathname);
  const activeGuide = APP_GUIDE_DATA[activeId] || APP_GUIDE_DATA.home;

  let prompt = `You are "Ask LifeOS", the built-in intelligent mobile assistant for the LifeOS app (React 18, TypeScript, Tailwind, Framer Motion, Capacitor Android).

STRICT SCOPE RULES (CODE ENFORCED):
1. You MUST ONLY answer questions about the LifeOS app: how it works, feature guides, step-by-step instructions, settings locations, and navigation.
2. If the user asks ANY off-topic question (general knowledge, coding, weather, history, advice, non-LifeOS topics), you MUST POLITELY DECLINE in exactly ONE short sentence, and suggest a LifeOS question. Example: "I can only assist with using LifeOS features and navigation. Try asking 'How do I add an expense?' or 'How do I log a workout?'".
3. NEVER output URLs or links of any format (no http://, https://, www, or domain links).
4. You possess NO personal user data (privacy-first mode). Only explain app structure and features.
5. Never invent or hallucinate features not present in LifeOS.

NAVIGATION SYSTEM OVERVIEW:
- Floating Navigation Bar at the bottom of the screen has:
  • Slot 0: Home (Fixed)
  • Slot 1 & Slot 2: Pinned customizable destination slots (e.g. Study, Gym, Spending, Tasks)
  • Slot 3: Fixed AI Assistant button (Glass pill with 4-point sparkle icon) which opens this 70% height pop-up sheet!
  • More Hub Button (Scallop shape icon on the right): Opens full grid of all 10+ app interfaces. You can long-press slots to re-order pinned tabs.

CURRENTLY OPEN SCREEN context:
User is currently viewing: "${activeGuide.name}" (route: ${pathname})
Purpose: ${activeGuide.purpose}
Main Features on this screen: ${activeGuide.mainFeatures.join('; ')}
Common actions on this screen:
${activeGuide.commonActions.map(a => `- ${a.action}: ${a.steps}`).join('\n')}

QUICK GUIDE FOR OTHER KEY SCREENS:
`;

  // Include concise summaries of all other screens so questions like "where is X?" can be answered
  Object.values(APP_GUIDE_DATA).forEach(guide => {
    if (guide.id !== activeId) {
      prompt += `\n• ${guide.name} (route ${guide.routes[0]}): ${guide.purpose}. Common steps: ${guide.commonActions[0]?.action || 'Use interface'} (${guide.commonActions[0]?.steps || 'Navigate via More Hub'})`;
    }
  });

  return prompt;
}
