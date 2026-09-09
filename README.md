# LifeOS (Flow)

[![React](https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

LifeOS (branded as Flow) is an all-in-one personal management and execution operating system designed to unify daily habits, academic pursuits, strength training, nutrition, spending, and task workflows. Engineered as a mobile-first Progressive Web App (PWA), LifeOS emphasizes ergonomics, tactile haptic feedback, modern aesthetics inspired by Google Material 3 Expressive, and intelligent Groq AI inference.

---

## What is New in Version 1.4

### Zero-Latency Performance & Instant Responsiveness
- **Synchronous Optimistic State Updates:** Re-engineered the core data pipeline (`useData.ts`) to immediately update React state and persist to local cache synchronously (0ms response time). Checkbox toggles, task additions, and class topic saves respond instantaneously while Firestore synchronization executes seamlessly in the background.
- **Eliminated 400ms Page Transition Delays:** Removed `mode="wait"` and blocking exit animations from the routing layer (`App.tsx`). Navigation between tabs now mounts immediately (0ms delay) with a snappy 150ms opacity settle.
- **Truly Fixed, Hardware-Immovable Background:** Re-architected ambient wallpaper rendering directly to top-level `<body>` layers (`#bg-fixed-layer` and `#bg-tint-layer`) with `100lvh` sizing. The background remains 100% stationary and never jitters, moves, or scales during touch scrolling or mobile browser address bar collapse.
- **GPU-Efficient Native Bottom Gradient:** Replaced expensive `WebkitMaskImage` and double `backdrop-filter` compositing with a lightweight native CSS gradient, delivering fluid 60–120fps scrolling.

### Premium Modern UI Overhaul
- **Design System Inspiration:** Modern expressive aesthetic inspired by Google Material 3 Expressive, embracing organic container curvature, responsive tactile surfaces, and vivid accented color harmonies.
- **Global Typography Upgrade:** Transitioned the primary application font to **Google Sans Flex**, delivering a premium, highly legible, and fluid typographic experience across all device sizes.
- **Rigid Navigation Dock (Zero Sideways Drift):** Replaced the scrollable bar with a rigid 8-column responsive grid (`grid grid-cols-8 max-w-md`). Every navigation icon is firmly locked in its slot, preventing horizontal sliding or displacement on mobile phone viewports.
- **TO-DO List Cards & Dock Clearance:** Remade task cards with elevated contrast and depth, automatically suppressed `"NA"` placeholder subtasks, and added bottom clearance to the Add Task modal so save actions never clash with the floating dock.
- **Gym Daily Protocol Hero Card:** Re-engineered the hero workout card for mobile phone aspect ratios, eliminating duplicate split badges and balancing action buttons (`Routine Split` and `Start / Resume Workout`).
- **Settings Account & History Polish:** Restructured the user account card into a clean two-tier layout ensuring complete, unclipped email visibility with a balanced 2-column grid for `Sign Out` and `Reset Data`. Aligned history month selectors and `AI Insights` buttons on a single row without text wrapping.

### Tasks & Visual Progress
- **Segmented Completion Bar:** Upgraded the TO-DO tasks progress bar from a monochrome fill to a dynamic, segmented multi-color track. Each individual task completion progressively fills a segment using a curated, vibrant color palette.

### Robust AI Fallback Waterfall
- **Multi-Model Resilience:** Re-engineered the Groq AI coach pipeline to prevent downtime during free-tier API rate limits (HTTP 429). The system now employs an intelligent 4-model waterfall fallback mechanism, automatically gracefully degrading from `qwen/qwen3.8-27b` to smaller, faster models (`llama-3.3-70b-versatile`, `llama3-8b-8192`, `gemma2-9b-it`) with staggered retry delays.

---

## What is New in Version 1.3

### Real-Time Device Theme Synchronization
- **Dynamic System Adaptation:** Integrated an active `prefers-color-scheme` media query listener that automatically detects device-level dark or light mode changes in phone settings and switches the interface immediately without requiring manual selection or page reloads.
- **Status Bar Matching:** Synchronizes browser and native status bar color metadata (`#09090B` for dark mode and `#FFFFFF` for light mode) to blend seamlessly with the system shell.
- **Material You Themed Icons:** Configured a dedicated monochrome vector icon in the Web App Manifest (`purpose: "monochrome"`). On Android 13+ devices with Themed Icons enabled, the home screen launcher dynamically tints the app icon with the system wallpaper palette without requiring special permissions.

### Gym Stability and Completion Lifecycle
- **Defensive Data Normalization:** Implemented automatic sanitization for workout logs and sets across Firestore and local storage, ensuring that corrupted logs or missing fields never cause render crashes or white screens.
- **Completed vs Resume Status:** Once a workout is saved and locked, the Gym dashboard hero action switches from "Resume" to an emerald "Completed" state with a checkmark badge. When a new calendar day begins, the status automatically returns to "Start".
- **React Error Boundary:** Wrapped the entire application routing layer in an error boundary to provide a clean recovery view with reload controls in the event of unexpected exceptions.

### Ergonomic Navigation Bar Haptics
- **Dedicated Navigation Preset:** Added an ultra-light 12ms tactile vibration pulse specifically calibrated for bottom dock navigation switches, accompanied by subtle acoustic feedback (frequency 170Hz, duration 12ms).
- **Double-Buzz Prevention:** Implemented an event throttle preventing duplicate haptic firings when pointer down and click events trigger in rapid succession.

### Study Session Doubts and In-Depth Inquiry
- **Session Doubts Drawer:** Deep study logs now feature an integrated inquiry module where users can capture concepts, academic questions, and unresolved doubts directly under any saved study session in Study History.
- **10,000-Word Capacity:** Equipped with a word limit of up to 10,000 words per session, supported by a live JetBrains Mono word and character counter.
- **Lock Protection:** Implemented an edit lock once saved to guarantee that notes and queries are not lost or overwritten during fast navigation.

### Global No-Overwrite Protection
- **Immutable Log State:** Applied systematic safeguard architecture across all modules (Nutrition, Gym Workout, Timetable, and Study Doubts).
- **Explicit Unlock Controls:** Once an entry is committed and saved, inputs become read-only and actions convert into a secure "Saved & Locked" status. Modifying previously logged entries requires an explicit tap on "Unlock to Edit".

### Streamlined Gym Architecture with Dedicated Cardio
- **Clean Workout Logging:** Eliminated superfluous timers and start/end time pickers from the daily workout logging interface, focusing on set, repetition, weight, and exercise accuracy.
- **Cardio Split Integration:** Added a Cardio category directly within the split selection screen alongside Push, Pull, Legs, Upper, Lower, Full Body, and Core.
- **Circuit Presets:** Integrated quick-start cardio circuits including Zone 2 Base Building, High Intensity Interval Training (HIIT), Incline Treadmill Endurance, and Recovery Flush.

### Settings Spending History and AI Budget Optimizer
- **Categorized Spending Archive:** Added an interactive spending history accordion in Settings, grouping transactions into calendar months.
- **AI Spend Insights:** Features an integrated Groq AI budget evaluation model that scans monthly transaction logs, flags non-essential expenses, and provides prioritized, actionable advice on where to cut expenditures.

### Timetable Lecture Topics by Month
- **Attached Topic Subsection:** Each lecture card now features an expandable "Today's Topic Discussed" subsection to record syllabus coverage and key concepts.
- **Monthly Topic History:** Automatically structures lecture coverage by calendar month, enabling students to review past discussions prior to examinations.

### Context-Aware Nutrition and Food Doubt Assistant
- **Automated Meal Slot Focus:** The nutrition screen inspects the current local time on initial load and expands the corresponding meal slot (Breakfast, Lunch, Snacks, or Dinner).
- **Food Doubt ("Can I eat this?"):** Positioned directly beneath the daily calorie progress indicator, this AI assistant evaluates whether off-menu or external foods fit current macro targets. All responses are plain text and strictly constrained to under 100 characters.

### TO-DO List Actionable Subtasks and Settings Archive
- **Task Specifics ("What to do actually"):** Tasks now feature an optional subtask descriptor beneath the main title to define clear execution steps.
- **Home and List Synchronization:** Subtasks render cleanly on both the dedicated TO-DO List interface and the Home dashboard preview.
- **Task History Accordion:** Settings now includes a TO-DO history accordion detailing completed tasks, categories, and timestamps.

### Ambient UI and Mobile System Integration
- **Mobile Header Architecture and Safe-Area Geometry:** Restructured the fixed top navigation bar with explicit top safe-area inset padding (`env(safe-area-inset-top)`) and a dedicated 56px content row, ensuring full clearance beneath hardware camera cutouts and dynamic islands.
- **Natural System Default Status Bar:** Standardized system theme color configuration (`#FFFFFF` in light mode and `#09090B` in dark mode) across `useTheme.ts`, `manifest.json`, and `index.html` to eliminate contrasting black lines and maintain a unified native aesthetic.
- **Vector App Branding on Login:** Updated the authentication interface (`/auth`) to render the official high-resolution vector emblem (`/icon.svg`) with smooth corner curvature and subtle depth.
- **PWA Cache Invalidation (v6):** Service worker cache bumped to `lifeos-v6` guaranteeing immediate client-side retrieval of updated interface assets without stale cache delays.
- **Floating Dock Ergonomics:** Bottom navigation raised slightly with an ambient gradient backdrop blur to ensure comfort across curved and gesture-navigated displays.
- **Extended Content Clearance:** Page containers provide generous bottom padding to eliminate content occlusion behind the floating navigation bar.
- **Invisible AI Pipeline:** Removed the manual API key input card in Settings; AI operations utilize a robust background integration.

---

## Core Architecture and Features

### 1. Daily TO-DO Management
- Quick task creation with custom categorization (Academic, Fitness, Personal, Urgent).
- Actionable subtasks clarifying actual execution requirements.
- Dynamic completion toggling with vibration haptics.
- Historical logging with completed task counts and category distributions.

### 2. Physical Training and Gym Engine
- Comprehensive workout logging tracking exercises, sets, weights, and repetitions.
- Rapid exercise selection across Chest, Back, Shoulders, Arms, Legs, Core, and Cardio.
- Split configuration saving routines across seven distinct training archetypes.
- Monthly workout history in Settings with AI-driven training volume and progressive overload analysis.
- One-tap quick weight adjustments (+1kg, +2.5kg, +5kg) and auto-select number fields.

### 3. Nutrition and Mess Meal Tracking
- Interactive calorie and macronutrient rings tracking daily energy budgets.
- Four daily meal slots: Breakfast (07:30 - 10:00), Lunch (12:00 - 14:30), Snacks (17:00 - 18:30), and Dinner (19:30 - 22:00).
- Automatic time-slot expansion highlighting the active meal period.
- AI Dietician analysis evaluating weekly nutrition trends.
- Quick Food Doubt evaluator delivering advice in under 100 characters.

### 4. Academic Scheduler and Deep Study
- Schedule mapping with subject names, teacher info, room locations, and time slots.
- Real-time ongoing class detection with theme color fills and live indicator badges.
- Monthly lecture topic recording attached to each class.
- Pomodoro deep-focus timer with background execution and sound alerts.
- Study history with subject-wise time breakdowns and 10,000-word doubt journals.

### 5. Financial Ledger and Expense Intelligence
- Rapid expense logging with tags (Food, Academic, Transport, Entertainment, Utility).
- Monthly spending summaries with category breakdowns.
- Settings Spending History with AI budget critique and savings suggestions.

### 6. Central Progress Matrix
- Aggregated monthly streaks and consistency scores.
- Visual completion graphs powered by Recharts.
- Subject balance radar and workout frequency metrics.

---

## Technical Stack

### Frontend Core
- **React 18.3**: Declarative UI architecture utilizing custom hooks and memoized context.
- **TypeScript 5.5**: Strict type safety covering all entity models, session records, and state transitions.
- **Vite 8.2**: High-speed build tool with hot module replacement and optimized asset pipeline.

### Styling and Animation
- **Tailwind CSS 3.4**: Utility-first responsive design supporting full dark and light mode adaptation.
- **Framer Motion 11.18**: Layout animations, spring transitions, gesture interactions, and sheet modals.
- **Lucide React**: Vector iconography for modern mobile interfaces.
- **Canvas Confetti**: Rewarding completion animations upon goal attainment.

### Cloud and Artificial Intelligence
- **Firebase Authentication**: Google OAuth authentication.
- **Cloud Firestore**: Real-time cloud synchronization with offline persistence support.
- **Groq AI SDK (`qwen/qwen3.8-27b`)**: High-speed LLM inference for workout analysis, dietary coaching, budget reviews, and food evaluations.

---

## Typography Standards

LifeOS adheres to strict typographical guidelines:
- **90% Google Sans Flex**: Applied to all structural headings, body text, buttons, and navigation for a premium, highly legible, and fluid typographic experience.
- **10% JetBrains Mono**: Reserved exclusively for numeric indicators, timestamps, weights, sets, reps, and counters to ensure instant scannability.

---

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Avineesh-G/LIFEOS.git
cd LIFEOS/lifeos
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

4. Run local development server:
```bash
npm run dev
```

5. Build production bundle:
```bash
npm run build
```

6. Preview production build:
```bash
npm run preview
```

---

## License

Private project developed for personal life management and academic execution. All rights reserved.
