# LifeOS

[![React](https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)

LifeOS is an all-in-one personal operating system built to unify academic schedules, strength training, daily habits, nutrition, expense tracking, and intelligent AI coaching into a single cohesive experience. Designed with a mobile-first philosophy, LifeOS features 120fps hardware-composited transitions, Material 3 Expressive aesthetics, real Android vibration haptics, and a zero-reinstall Live Sync update engine.

---

## What is New in Version 1.5 (Build 7)

### 1. Real-Time Bidirectional Firestore Database Sync
- **Live Snapshot Synchronization:** Powered by Firestore `onSnapshot`, changes made on any device (web browser, laptop, or mobile APK) are pushed instantaneously across all active sessions with zero manual reloads.
- **Home Screen One-Tap Database Sync:** Added a dedicated, tactile **Sync** button right beside the day and date badge on the Home dashboard. Tapping it triggers a direct server-level fetch (`getDocFromServer`), purges local stale caches, and provides immediate visual and haptic confirmation.
- **Instant Cache Hydration:** The app instantly hydrates state from localized storage on login before establishing real-time cloud listeners, eliminating blank screens or empty default data fallbacks.

### 2. Direct In-App Cloud Stream & Live Sync (Zero-Reinstall Architecture)
- **Direct Cloud Stream Integration:** The native Android shell is connected directly to the live cloud URL (`https://lifeos-gujjeti-avineeshs-projects.vercel.app`), with an offline-first Service Worker cache fallback. Every future update pushed to GitHub is streamed live over the air directly inside the app without requiring manual APK downloads or reinstallations.
- **Direct In-App Updates:** Tapping **"Check Updates"** or **"Sync & Apply Build"** in Settings immediately flushes stale web caches and applies the latest cloud deployment directly to the application on your phone.
- **In-Place Native Packaging:** Configured native `versionCode` to `7` and `versionName` to `"1.5"`. When installing native binary upgrades, Android executes an in-place upgrade preserving all user data and credentials.

### 3. Material 3 Fluid Transitions (120fps Zero-Lag Motion)
- **Fluid Deceleration Curve (240ms):** Tuned `AnimatedPage` with an organic `cubic-bezier(0.22, 1, 0.36, 1)` easing curve and a subtle 6px vertical rise (`y: 6 ➔ 0`) alongside opacity, creating a creamy, luxurious glide that eliminates abrupt cuts while remaining swift and responsive.
- **Compositor-Only GPU Transforms:** Powered by `translateZ(0)` and `will-change: opacity, transform` hardware acceleration, delivering rock-solid 120Hz refresh rates on high-refresh mobile displays with zero dropped frames.
- **Memoized Computing Engine:** Synchronous calculations across `Home.tsx`, `Study.tsx`, `Spending.tsx`, `Timetable.tsx`, and `Progress.tsx` are consolidated inside `useMemo` blocks, preventing main-thread blocking during tab navigation.

### 4. Secure In-App Groq AI Architecture
- **Client-Managed Secret Isolation:** Eliminates all hardcoded API keys and `.env` build bundling. Users enter their personal Groq API key securely in the Settings UI with show/hide masking.
- **Encrypted Persistence:** Keys are stored strictly within the user's private Firebase Firestore profile (`users/{uid}`) and device `localStorage`, completely out of Git version control and public JavaScript bundles.
- **Multi-Model Waterfall Fallback:** Intelligent cascade across active Groq models (`qwen/qwen3.8-27b`, `qwen/qwen3.6-27b`, `openai/gpt-oss-120b`, `groq/compound-mini`) with automated `<think>` reasoning tag sanitization.

### 5. Gym Section Polish & Zero-Blank Screen Fix
- **Header Badge Alignment:** Relocated completion indicators into the workout session metadata badge (`ALL DONE`) and sets pill (`13/13 sets ✓`), eliminating overlap collisions on mobile viewports.
- **State Transition Stabilization:** Removed fragile Framer Motion `staggerChildren` layout passes from the Gym dashboard, guaranteeing instantaneous navigation return without screen freezes.

---

## Codebase Structure & Architecture

```
lifeos/
├── android/                             # Native Android Studio project
│   ├── app/
│   │   ├── build.gradle                 # VersionCode 7, VersionName 1.5, Keystore config
│   │   ├── lifeos-release-key.jks       # Production release signing keystore
│   │   └── src/main/
│   │       ├── AndroidManifest.xml      # Permissions, hardware acceleration
│   │       └── res/                     # Vector-derived adaptive launcher icons
├── public/
│   ├── LifeOS.apk                       # Production-signed release APK package
│   ├── version.json                     # Release manifest for in-app update checks
│   ├── icon.svg                         # Master minimalist dark vector icon
│   └── icon-monochrome.svg              # Android 13+ Material You themed launcher
├── src/
│   ├── components/                      # Reusable UI primitives & layouts
│   │   ├── Layout.tsx                   # Rigid 8-column navigation dock & viewport frame
│   │   ├── ErrorBoundary.tsx            # Graceful crash handling & recovery
│   │   ├── BodyProfileForm.tsx          # User biometrics & fitness goals
│   │   └── AnimatedIcons.tsx            # Lightweight custom SVG icons
│   ├── data/
│   │   ├── defaultData.ts               # Fallback initial data structures
│   │   └── messMenu.ts                  # Monthly campus nutrition menu
│   ├── hooks/
│   │   ├── useData.ts                   # Optimistic local-first Firestore synchronization
│   │   └── useTheme.ts                  # Dynamic system dark/light adaptation
│   ├── pages/
│   │   ├── Home.tsx                     # Daily execution score & dashboard metrics
│   │   ├── Gym.tsx                      # Routine hub & weekly split tracker
│   │   ├── GymWorkout.tsx               # Active workout logger with rest timers
│   │   ├── GymSplit.tsx                 # Custom workout split editor
│   │   ├── GymExerciseHistory.tsx       # Historical weight/rep analytics
│   │   ├── GymOnboarding.tsx            # Interactive workout setup wizard
│   │   ├── Nutrition.tsx                # Mess menu tracker & AI food analysis
│   │   ├── Study.tsx                    # Focus session hub & weekly breakdown
│   │   ├── StudyTimer.tsx               # Pomodoro & stopwatch timer
│   │   ├── StudyHistory.tsx             # Logged academic sessions & doubts
│   │   ├── StudyHeatmap.tsx             # Year-round study activity heatmap
│   │   ├── Spending.tsx                 # Category budgeting & expense log
│   │   ├── Timetable.tsx                # Class schedule & topic recorder
│   │   ├── Tasks.tsx                    # Segmented multi-color TO-DO list
│   │   ├── Progress.tsx                 # Long-term habit streaks & radar charts
│   │   ├── Settings.tsx                 # In-App Live Sync, Groq AI key, theme
│   │   └── Auth.tsx                     # Native Google Play Services authentication
│   ├── utils/
│   │   ├── geminiCoach.ts               # Groq AI waterfall coach & diet tips
│   │   └── haptics.ts                   # Capacitor hardware vibrator integration
│   ├── App.tsx                          # Top-level routing & 120fps transitions
│   ├── firebase.ts                      # Cloud Firestore & Auth client
│   ├── main.tsx                         # React 18 DOM mount point
│   └── types.ts                         # TypeScript domain models
├── capacitor.config.ts                  # Capacitor 8 native bridge settings
├── package.json                         # Dependencies & project scripts
├── tailwind.config.js                   # M3 Expressive color tokens & surfaces
└── vite.config.ts                       # Fast Vite bundler configuration
```

---

## Core Technologies

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion
- **Native Runtime:** Capacitor 8 Android with Hardware GPU Acceleration
- **Backend & Auth:** Google Firebase (Cloud Firestore & Firebase Authentication)
- **Native Auth:** Google Play Services via `@codetrix-studio/capacitor-google-auth`
- **Haptics:** Native Android OS Vibration Services via `@capacitor/haptics`
- **AI Inference:** Groq Cloud API (Llama 3.3, Qwen 3.8, GPT-OSS)

---

## Build & Deployment Commands

### Development Server
```bash
npm run dev
```

### Production Web Build
```bash
npm run build
```

### Sync Web Build to Native Android
```bash
npm run cap:sync
```

### Compile Signed Release APK
```bash
npm run cap:build
```
The compiled, production-signed binary is generated at:
`android/app/build/outputs/apk/release/app-release.apk`
and automatically copied to:
`public/LifeOS.apk`

---

## License

Private repository. All rights reserved.
