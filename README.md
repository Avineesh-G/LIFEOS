<div align="center">

# 🌌 LifeOS

**The Unified Personal Operating System for High-Performance Living**  
*Academics · Hypertrophy Fitness · Nutrition · Campus Life · Biometric Vault · Home Screen Widget*

[![Version](https://img.shields.io/badge/Version-v1.2.1_(Build_2)-6366F1?style=for-the-badge&logo=android&logoColor=white)](https://lifeos-gujjeti-avineeshs-projects.vercel.app/download)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase_Cloud-FFA000?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)

<br />

### [📱 Download Direct APK (v1.2.1)](https://lifeos-gujjeti-avineeshs-projects.vercel.app/LifeOS.apk) · [🌐 Launch Live Web App](https://lifeos-gujjeti-avineeshs-projects.vercel.app/) · [✨ Interactive Showcase](https://lifeos-gujjeti-avineeshs-projects.vercel.app/download) · [🐛 Report Bug](https://github.com/Avineesh-G/LIFEOS/issues)

<br />

</div>

---

## 📖 Executive Summary

Modern students and professionals juggle between 5 to 7 fragmented, ad-ridden apps every single day:
- A gym workout & progressive overload logger ($10/mo)
- A Pomodoro focus & study timer ($6/mo)
- An expense & personal budget tracker ($8/mo)
- A college timetable schedule & classroom planner
- A hostel mess menu & macro nutrition tracker
- A daily task manager & habit tracker
- A password keeper or notes vault

**LifeOS eliminates this digital clutter completely.** Designed and engineered by **Gujjeti Avineesh**, LifeOS unifies daily execution into a single, cohesive, offline-first operating system. Built with **React 18, TypeScript, Tailwind CSS, and Capacitor 8**, it compiles into a signed, hardware-accelerated native Android app supporting native biometrics, 120Hz display refresh rates, home screen glanceable widgets, and zero subscription paywalls.

---

## ⚡ What's New in v1.2.1 (Build 2)

- 🔤 **Pixel-Style Typography System**: Unified `Google Sans Flex` variable typeface across the entire app — zero font mixing. Implements the 4-weight Pixel hierarchy (400 Regular, 500 Medium, 600 SemiBold, 700 Bold-rare) and a 4-level tonal text hierarchy (`#F2F3F5` primary, `#B8BBC3` secondary, `#858994` tertiary, `#5F626B` disabled in dark mode).
- 🧭 **Navigation Bar Redesign**: Floating pill (icon-only tabs) + separate squircle More button. Both pill and squircle recolor per active interface. Hides on scroll-down, reappears on scroll-up with smooth fade transition. Auto-hides inside sub-interface routes.
- 📋 **Navigation Hub Sheet**: Compact bottom-sheet More menu opened by the squircle button — 10 destinations in a content-hugging layout (max 60dvh/420px), safe-area aware, drag-to-dismiss with Framer Motion spring physics.
- 🏠 **Per-Interface Background System**: Each main interface carries its own faintly seed-tinted canvas (`#FDFDFD` light / `#121316` dark at ~5% seed blend) with a single organic blob accent and interface-keyed ambient gradient.
- 🐛 **Blank Screen Hardening**: Structural fixes to prevent recurring blank-screen-after-HMR issues — lazy import chains, React error boundaries, service worker cache-busting, and HMR stability guards.

- 📱 **Per-Widget Metric Customization (`WidgetConfigActivity`)**: Configure each placed widget instance independently! Select 2 to 3 metrics to display on your home screen:
  1. 🔥 **Current Streak**: Consecutive study and active habit consistency count.
  2. ✓ **Tasks Done Today**: Completed vs total scheduled tasks tally (`x/y`).
  3. ⏱ **Study Time Today**: Formatted focus time tracked today (`1h 30m`).
  4. 📅 **Next Scheduled Block**: Real-time next class or lecture time and subject from your timetable.
  5. 💳 **Safe-to-Spend / Today's Spent**: Daily expense tracking and safe-to-spend allowance.
- 📐 **Adaptive Slot-Based Widget Architecture**: The home screen widget dynamically adapts its layout — rendering a prominent hero left tile alongside either a full-height single right tile (for 2 selected metrics) or two stacked tiles (for 3 selected metrics).
- 🛠️ **Fixed Stuck Blank Widget (RemoteViews Inflation)**: Resolved launcher host fallback issue caused by unannotated view tags by ensuring 100% `@RemoteView`-compatible view inflation and per-widget isolated error handling.
- 🧹 **Automatic Orphaned Widget Cleanup (`onDeleted`)**: Unplaced or removed widget instances automatically clean up their corresponding configuration entries from SharedPreferences.
- 🥗 **Nutrition Navigation Persistence**: Resolved bottom navigation dock visibility when switching between past dates in the Nutrition module.
- 🎨 **Settings Toggle: Dynamic Theme vs. Full Night Theme**: Centralized toggle locking either dynamic circadian transitions (6 day phases) or tranquil permanent midnight aesthetics.

---

## 🎯 Core Features & Modules

### 📱 1. Native Android Home Screen Widget
- **Glanceable Tri-Metric Display**: Real-time study streak count, today's task completion tally (`Done / Total`), and total study minutes logged today (`Xh Ym`).
- **Circadian Theming Engine**: Synchronized with the app's 6 day-phase color system natively inside Android `RemoteViews`.
- **Stat Deep-Links**: Direct routing into relevant app modules from widget tiles.
- **Asynchronous Data Bridge**: Zero UI thread contention through background executor dispatch and Capacitor Preferences persistence.

### 🎨 2. Circadian Ambient Sky & Dynamic Theming
- **6 Natural Day Phases**: Mathematically maps device time to *Dawn* (05:00–08:00), *Morning* (08:00–12:00), *Afternoon* (12:00–17:00), *Dusk* (17:00–19:00), *Evening* (19:00–22:00), and *Night* (22:00–05:00).
- **Procedural Pixel-Sky Canvas**: Multi-tiered pixel background with atmospheric gradients, dithering, and low-overhead requestAnimationFrame star shimmer.
- **Dynamic Fluid UI Tokens**: CSS variable transitions (400ms cubic-bezier) altering card surfaces, borders, text contrast, and accents automatically.
- **Adaptive Typography Density**: Variable font weights dynamically adjusting heading and body typography between high-energy daytime and calm evening reading.

### 🏋️ 3. Gym & Hypertrophy Tracker
- **Intelligent Split Management**: Push/Pull/Legs, Upper/Lower, or custom routines with interactive weekly schedules.
- **Live Session Logger**: Log weights, reps, and RPE with automated rest interval timers and set checkboxes.
- **Progressive Overload Analytics**: Real-time 1RM estimations (Brzycki formula), personal records (PRs), and volume tracking per exercise.
- **Customizable Routine Library**: Add, reorder, and modify workouts with custom exercise sets and target reps.

### 📚 4. Deep Focus Study & Academics
- **Hardware-Synced Study Timer**: Persistent wall-clock time tracking that never drifts or freezes when the device screen sleeps or the app minimizes.
- **Continuous Foreground Service**: Active Android notification with live elapsed time display and pause/stop triggers.
- **365-Day Consistency Heatmap**: GitHub-style activity grid visualizing daily study intensity and focus streaks.
- **Subject-Wise Analytics**: Track study distribution across subjects with session notes and exam doubts log.

### 📅 5. Smart Class Timetable
- **Active Period Highlighter**: Dynamically pinpoints current and upcoming lectures based on real-time clock hours.
- **Room & Instructor Details**: Displays lecture hall numbers, lab locations, and professor names.
- **Proactive Notification Leads**: Scheduled local notifications (5 to 20 minutes before class) to ensure you never miss a lecture.
- **Tap-to-Study Shortcut**: Launch a focused study session directly from any syllabus block.

### 🥗 6. Campus Nutrition & Mess Menus
- **Daily Macro Target Engine**: Tracks protein, carbohydrate, fat, and total caloric intake against personal fitness goals.
- **Hostel Mess Integration**: Pre-configured campus meal menus across breakfast, lunch, high tea, and dinner.
- **Meal Logging**: Check off consumed mess meals or add custom foods with instant macronutrient calculation.

### 🧺 7. Hostel Laundry Manager
- **Batch Tracking**: Track submitted laundry batches with handover dates and expected delivery timelines.
- **Itemized Counting**: Categorize shirts, pants, undergarments, and bedsheets with automated tallying.
- **Status Indicators**: Instant visual indicators for pending, in-wash, and returned laundry bags.

### 💰 8. Frictionless Expense & Budget Tracker
- **Lightning Fast Logging**: Log expenditures in under 3 seconds with minimal taps.
- **Student-Centric Categories**: Mess & Food, Academics, Travel, Gym & Supplements, Personal, and Miscellaneous.
- **Monthly Allowance Guardrails**: Visual progress meters warning when approaching budget thresholds.

### 🔐 9. Biometric App Lock & Password Vault
- **Hardware Biometrics**: Secured via Android Jetpack Biometrics (`BIOMETRIC_STRONG | DEVICE_CREDENTIAL`) supporting fingerprint, face unlock, and device PIN fallback.
- **AES-256-GCM Password Vault**: Client-side encrypted credential keeper for university portals, Wi-Fi logins, and academic accounts with PBKDF2 key derivation.
- **Background Auto-Lock**: Configurable security timeouts (Instant, 30s, 1m, 5m) when the app is backgrounded.

---

## 🏗️ System Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      LifeOS Unified Client (React 18)                     │
│  (Home · Gym · Study · Nutrition · Timetable · Spending · Settings · Vault)│
└─────────────────────┬───────────────────────────────┬─────────────────────┘
                      │                               │
                      ▼                               ▼
       ┌─────────────────────────────┐ ┌─────────────────────────────┐
       │     useDayPhase() Hook      │ │    useData (Sync Engine)    │
       │  - Real-time phase clock    │ │  - Optimistic local cache   │
       │  - ThemeMode (Dynamic/Night)│ │  - Partial diff merge       │
       │  - Preferences persistence  │ │  - Firestore background sync│
       └──────────────┬──────────────┘ └──────────────┬──────────────┘
                      │                               │
        ┌─────────────┴─────────────┐                 │
        ▼                           ▼                 ▼
┌───────────────────┐     ┌───────────────────┐ ┌───────────────────────────┐
│ DayThemeProvider  │     │   usePixelSky()   │ │ Firebase Cloud Firestore  │
│ - CSS custom vars │     │ - PixelSkyCanvas  │ │ users/{uid} private doc   │
│ - 400ms transition│     │ - Twinkle layer   │ └───────────────────────────┘
└───────────────────┘     └───────────────────┘               │
                                                              ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                          Capacitor Native Bridge                          │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐ │
│ │ WidgetUpdaterPlugin  │ │  ApkInstallerPlugin  │ │ TimerForegroundSvc  │ │
│ │ - Off-thread executor│ │ - Sideload installer │ │ - Wall-clock timer  │ │
│ │ - SharedPreferences  │ │ - SHA-256 validation │ │ - Persistent alerts │ │
│ └──────────────────────┘ └──────────────────────┘ └─────────────────────┘ │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐ │
│ │   NativeBiometric    │ │   CapacitorHaptics   │ │ LocalNotifications  │ │
│ └──────────────────────┘ └──────────────────────┘ └─────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Domain | Technology | Description |
|---|---|---|
| **Core Framework** | React 18.3 | Concurrent rendering, functional components, hooks |
| **Language** | TypeScript 5.5 | Strictly typed domain models and interfaces |
| **Styling & Design** | Tailwind CSS 3.4 | Utility-first styling with custom glassmorphic tokens |
| **Typography** | Clash Display & Satoshi | Adaptive variable fonts with dynamic weight scaling |
| **Animations** | Framer Motion 11 | GPU-composited 120fps physics-based transitions |
| **Build Tooling** | Vite 8 + Rolldown | Blazing fast HMR and optimized production bundles |
| **Native Runtime** | Capacitor 8 | Native Android container with modern plugin bridge |
| **Android Layer** | Kotlin 2.0 & Java 17 | Android SDK 34+ target, AndroidX, Gradle 8.14 |
| **Cloud Backend** | Google Firebase | Cloud Firestore for real-time document synchronization |
| **Authentication** | Firebase Auth | Google OAuth 2.0 and biometric-backed local sessions |
| **Home Screen Widget** | Android AppWidget | Native `RemoteViews`, `AppWidgetProvider`, day-phase styling |
| **Security & Cryptography** | Web Crypto API | AES-256-GCM client-side encryption with PBKDF2 |
| **Hosting & CDN** | Vercel Edge Network | Dual-hosting distribution for web client and raw APK |

---

## 📁 Repository Structure

```
lifeos/
├── android/                             # Android Studio native project
│   ├── app/
│   │   ├── build.gradle                 # Version code (28), version name (1.6.3), keystores
│   │   ├── lifeos-release-key.jks       # Signed production keystore
│   │   └── src/main/
│   │       ├── java/com/avineesh/lifeos/
│   │       │   ├── MainActivity.java            # BridgeActivity & 120Hz display configuration
│   │       │   ├── WidgetUpdaterPlugin.kt       # Off-thread widget sync plugin
│   │       │   ├── LifeOSWidgetProvider.kt      # AppWidgetProvider with circadian theme rendering
│   │       │   ├── ApkInstallerPlugin.java      # In-app native APK installer session
│   │       │   ├── TimerForegroundService.java  # Persistent notification countdown service
│   │       │   └── TimerNotificationPlugin.java # Foreground timer bridge
│   │       └── res/
│   │           ├── layout/widget_layout.xml     # Native 4x2 AppWidget UI hierarchy
│   │           ├── values/widget_phase_colors.xml # Circadian color definitions for native widgets
│   │           └── xml/lifeos_widget_info.xml   # AppWidgetProvider metadata
├── public/
│   ├── LifeOS.apk                       # Production-signed release APK (~8.3 MB)
│   ├── version.json                     # Live release manifest with SHA-256 checksum
│   ├── icon.svg                         # Vector icon asset
│   └── icon-monochrome.svg              # Material You dynamic themed icon
├── scripts/
│   ├── generate-widget-colors.js        # Extracts CSS palettes into Android XML colors
│   └── prepare-release.js               # Computes SHA-256, updates manifest, stages APK
├── src/
│   ├── components/                      # Reusable UI elements (Buttons, Skeletons, Modals)
│   ├── config/                          # Navigation and route configuration
│   ├── hooks/
│   │   ├── useDayPhase.ts               # Single source of truth for circadian phases & theme mode
│   │   ├── usePixelSky.ts               # Ambient pixel canvas flow controller
│   │   └── useData.ts                   # Optimistic local-first Firestore synchronization hook
│   ├── pages/
│   │   ├── DownloadPage.tsx             # Interactive public landing & APK download page
│   │   ├── Home.tsx                     # Daily dashboard and circadian hero
│   │   ├── Gym.tsx / GymWorkout.tsx     # Workout routines and live set tracker
│   │   ├── Study.tsx / StudyTimer.tsx   # Pomodoro timer and academic logs
│   │   ├── Nutrition.tsx                # Mess menu and macronutrient tracking
│   │   ├── Timetable.tsx                # Period schedule and classroom timetable
│   │   ├── Spending.tsx                 # Student expense and budget ledger
│   │   ├── Settings.tsx                 # System preferences, biometric setup, theme toggles
│   │   └── Auth.tsx                     # Google and email authentication gateway
│   ├── theme/
│   │   ├── DayThemeProvider.tsx         # Injects CSS variables and 400ms phase transitions
│   │   ├── typography.ts                # Phase-dependent font weight calculations
│   │   └── pixelSkyPalettes.ts          # Color matrices for all 6 day phases
│   ├── utils/
│   │   ├── widgetBridge.ts              # Memoized, debounced native widget sync bridge
│   │   ├── updater.ts                   # In-app APK update checker & installer client
│   │   ├── security.ts                  # Biometric lock controller
│   │   └── haptics.ts                   # Tactile vibration feedback system
│   ├── App.tsx                          # Root router and lifecycle coordinator
│   ├── firebase.ts                      # Firebase SDK configuration
│   └── types.ts                         # Domain data models and TypeScript types
├── capacitor.config.ts                  # Capacitor native project configuration
├── tailwind.config.js                   # Design tokens and custom theme extension
└── vite.config.ts                       # Vite build configuration
```

---

## 🚀 Quickstart for Developers

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: npm v9+
- **Java Development Kit**: JDK 17
- **Android Studio**: Ladybug / Meerkat (SDK 34+)
- **Firebase Project**: Firestore Database and Authentication enabled

### 1. Clone & Install
```bash
git clone https://github.com/Avineesh-G/LIFEOS.git
cd LIFEOS/lifeos
npm install
```

### 2. Environment Configuration
Create a `.env` file in the `lifeos/` directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Start Development Server
```bash
npm run dev
```
Visit `http://localhost:5173/download` for the showcase page or `http://localhost:5173/` for the application.

---

## 📦 Build & Release Pipeline

| Command | Action Performed |
|---|---|
| `npm run dev` | Spins up local Vite development server with instant HMR |
| `npm run build` | Compiles TypeScript and builds production distribution in `dist/` |
| `npm run generate:widget-colors` | Generates native Android XML color resources from `pixelSkyPalettes.ts` |
| `npm run cap:sync` | Compiles web assets, generates colors, and synchronizes to Android assets |
| `npm run cap:build` | Syncs assets and compiles signed release APK via Gradle |
| `npm run release:prep` | Computes SHA-256 checksum and updates `public/version.json` |
| `npm run cap:open` | Opens Android Studio directly for native debugging |

### Release Compilation (Command Line)
```bash
# 1. Sync web bundle to Android
npm run cap:sync

# 2. Compile signed release APK
cd android
./gradlew assembleRelease
cd ..

# 3. Prepare release assets & compute checksum
npm run release:prep
```

The signed release APK will be generated at:  
`android/app/build/outputs/apk/release/app-release.apk`  
and automatically mirrored to `public/LifeOS.apk` for hosting.

---

## 📱 Sideload Installation Guide (Android)

1. Open your mobile browser and navigate to:  
   👉 **[https://lifeos-gujjeti-avineeshs-projects.vercel.app/download](https://lifeos-gujjeti-avineeshs-projects.vercel.app/download)**
2. Tap **Download LifeOS for Android** to fetch `LifeOS.apk`.
3. When prompted by Android Chrome regarding direct APK downloads (*"File might be harmful"*), select **Download anyway**.
4. Open the downloaded APK and select **Install**. If prompted, toggle **Allow from this source** in your browser permissions.
5. Launch LifeOS and add the **LifeOS Widget** to your home screen!

---

## 📜 Version History & Changelog

### **v1.6.4 (Build 29)** — *Current Release*
- **Nutrition Date Tracking Navigation Fix**: Resolved an issue where opening the date picker or browsing past dates in Nutrition caused the floating bottom navigation bar to remain hidden until a page reload.
- **Intelligent Virtual Keyboard Detection**: Refined keyboard focus detection in `Layout.tsx` to distinguish actual text input fields from system picker dialogs (`date`, `time`, `checkbox`, `radio`), preventing false keyboard state locks.
- **Route & Date Change Auto-Reveal**: Navigation dock automatically resets its visibility and clears virtual keyboard locks whenever switching routes or date tabs.

### **v1.6.3 (Build 28)**
- **Dynamic Day Theme vs. Full Night Theme**: Added a toggle in Settings enabling users to lock the entire application into a tranquil, deep midnight aesthetic (01:30 AM circadian progress) with persistent star twinkle animations.
- **Preferences-Backed Theme Persistence**: Theme mode persists across cold starts and offline restarts via `@capacitor/preferences`.
- **Architectural Centralization**: Centralized theme logic into `useDayPhase()`, allowing all downstream consumers (`PixelSkyCanvas`, `DayThemeProvider`, `typography.ts`) to adapt with zero consumer-side code duplication.

### **v1.6.2 (Build 27)**
- **Widget Refresh Frame Drop Elimination**: Resolved micro-stutters during task completion and study session end by offloading SharedPreferences writes and widget updates to a background worker thread in `WidgetUpdaterPlugin.kt`.
- **Memoized Streak & Task Counting**: Optimized `widgetBridge.ts` with memoized streak calculations and single-pass task counting, reducing bridge IPC overhead.
- **Debounced Widget Synchronization**: Implemented 150ms debounced synchronization so widget refresh runs strictly after UI animations and haptics finish painting.

### **v1.6.1 (Build 23)**
- **Native Android Home Screen Widget**: Released 4×2 glanceable AppWidget with real-time streak, tasks done, study minutes, and circadian day-phase styling.
- **Deep-Link Intent Routing**: Connected widget tiles directly to internal app routes (`lifeos://progress`, `lifeos://tasks`, `lifeos://study`).
- **Circadian Theme Export Script**: Created automated script converting TypeScript palette definitions to Android XML resource files.

### **v1.6.0 (Build 20)**
- **Circadian Ambient Day-Phase System**: Introduced 6 natural day phases with mathematical progress calculations.
- **Pixel-Sky Ambient Canvas**: Implemented multi-tiered procedural sky with smooth transitions and performance tiering.
- **Adaptive Font Weight Density**: Variable font scaling for headings and body copy synchronized with daily energy curves.

### **v1.5.5 (Build 15)**
- **Biometric Credentials Vault**: Encrypted AES-256-GCM vault protected by hardware biometrics.
- **Persistent Wall-Clock Timer**: Non-drifting study stopwatch backed by Android Foreground Service.
- **Instant Cold-Start Optimization**: Synchronous cache hydration eliminating startup spinners.

---

## 👤 Author & Maintainer

**Gujjeti Avineesh**  
*Architect, Designer & Full-Stack Developer*

- **GitHub**: [@Avineesh-G](https://github.com/Avineesh-G)
- **Project Repository**: [https://github.com/Avineesh-G/LIFEOS](https://github.com/Avineesh-G/LIFEOS)
- **Live Deployment**: [https://lifeos-gujjeti-avineeshs-projects.vercel.app](https://lifeos-gujjeti-avineeshs-projects.vercel.app)

---

## 📄 License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute this software with attribution. See the [LICENSE](LICENSE) file for details.

<div align="center">

<br />

**Built with pride for discipline, high achievement, and daily clarity.**  
*LifeOS © 2026. All rights reserved.*

</div>
