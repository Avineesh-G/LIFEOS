<div align="center">

<img src="public/icon.svg" width="100" height="100" alt="LifeOS Logo" />

# LifeOS

**The Unified Personal Operating System for High-Performance Living**  
*Academics · Hypertrophy Fitness · Nutrition · Campus Life · Biometric Vault · Home Screen Widget*

[![Version](https://img.shields.io/badge/Version-v1.2.3_(Build_13)-6366F1?style=for-the-badge&logo=android&logoColor=white)](https://lifeos-gujjeti-avineeshs-projects.vercel.app/download)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Capacitor](https://img.shields.io/badge/Capacitor_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase_Cloud-FFA000?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)

<br />

### [Download Direct APK (v1.2.3)](https://lifeos-gujjeti-avineeshs-projects.vercel.app/LifeOS.apk) · [Launch Live Web App](https://lifeos-gujjeti-avineeshs-projects.vercel.app/) · [Interactive Showcase](https://lifeos-gujjeti-avineeshs-projects.vercel.app/download) · [Report Bug](https://github.com/Avineesh-G/LIFEOS/issues)

<br />

</div>

---

## Executive Summary

Modern students and professionals often juggle between five to seven fragmented, subscription-gated applications:
- A progressive overload and gym workout logger
- A Pomodoro focus timer and study manager
- A daily spending and budget ledger
- A group outings and shared trip expense splitter
- A college timetable and classroom schedule organizer
- A campus mess menu and macronutrient tracker
- A password keeper and encrypted notes vault

LifeOS unifies daily execution into a single, cohesive, offline-first personal operating system. Designed and engineered by Gujjeti Avineesh, LifeOS is built with React 18, TypeScript, Tailwind CSS, and Capacitor 8. It compiles into a hardware-accelerated Android application supporting native biometrics, 120Hz display refresh rates, glanceable home screen widgets, and an autonomous in-app update mechanism with zero subscription paywalls.

---

## What is New in v1.2.3 (Build 13)

- **Outing Expenses Architecture & Sheet Refinement**: Completely resolved modal bottom sheet touch-scrolling blockers by scoping gesture detection to drag handles via Framer Motion drag controls. Restored clean natural document flow across Outing creation, expense logging, and balance settlements with verified zero input overlap.
- **Single Viewport Scroller Architecture**: Enforced a single top-level viewport scroller across all routes and sub-interfaces, completely eliminating trapped nested scroll areas and preserving 100% swipe responsiveness on physical Android devices.
- **Autonomous In-App APK Updater**: Native updater client backed by SHA-256 cryptographic verification and seamless Android PackageInstaller integration, enabling zero-friction sideload updates directly from the edge CDN.
- **Pixel-Style Typography System**: Unified Google Sans Flex variable typeface across the entire platform. Implements strict tonal text hierarchy (primary, secondary, tertiary, and disabled states) across light and dark themes.
- **Per-Interface Ambient Canvas**: Dedicated seed-tinted backgrounds for each primary workspace (Home, Gym, Study, Nutrition, Outings, Spending, Timetable, Vault) with organic corner accents and ambient circadian palettes.
- **Automated Quality & Regression Gates**: 1,260-point layout matrix validation across six viewports, continuous scroll regression suite, and automated palette perceptual distance verification (Delta E >= 13.0).

---

## Core Modules & Capabilities

### 1. Native Android Home Screen Widget
- **Configurable Glanceable Display**: Displays real-time focus streaks, daily task completion tallies, and logged study minutes directly on the launcher.
- **Circadian Theming Engine**: Synchronizes with the application's six day-phase color system natively inside Android RemoteViews.
- **Direct Module Deep-Linking**: Direct intent routing into relevant operational areas straight from widget tiles.
- **Non-Blocking Data Bridge**: Zero UI thread contention via background executor dispatch and Capacitor Preferences persistence.

### 2. Circadian Ambient Theming & Color Science
- **Six Natural Day Phases**: Mathematically maps device time to Dawn (05:00-08:00), Morning (08:00-12:00), Afternoon (12:00-17:00), Dusk (17:00-19:00), Evening (19:00-22:00), and Night (22:00-05:00).
- **Procedural Canvas**: Multi-tiered background canvas with atmospheric gradients and low-overhead star shimmer.
- **Dynamic Fluid Design Tokens**: CSS custom property transitions altering card surfaces, borders, text contrast, and accents automatically.
- **Strict Color Accessibility**: Enforces WCAG AAA compliance and Delta E >= 13.0 perceptual distance between interface seed colors.

### 3. Gym & Hypertrophy Tracker
- **Workout Routine Management**: Supports Push/Pull/Legs, Upper/Lower, and custom training splits with interactive weekly schedules.
- **Live Session Logger**: Log weights, reps, and RPE with automated rest interval timers and set completion checks.
- **Progressive Overload Analytics**: Real-time one-rep maximum estimations (Brzycki equation), personal record badges, and volume tracking per muscle group.

### 4. Deep Focus Study & Academics
- **Hardware-Synced Focus Stopwatch**: Persistent wall-clock time tracking that never drifts or freezes when the device screen sleeps or the app is minimized.
- **Foreground Service Integration**: Persistent Android notification with live elapsed time display and pause/resume triggers.
- **365-Day Consistency Heatmap**: Visual activity grid charting daily study intensity and academic milestones.
- **Subject-Wise Analytics**: Track study time distribution across subjects with session notes and exam doubts log.

### 5. Smart Class Timetable
- **Active Period Highlighter**: Dynamically highlights current and upcoming lectures based on real-time clock hours.
- **Room & Faculty Details**: Displays lecture hall numbers, lab locations, and instructor details.
- **Proactive Notification Leads**: Scheduled notifications prior to lectures to prevent missed sessions.

### 6. Campus Nutrition & Mess Menus
- **Daily Macro Target Engine**: Tracks protein, carbohydrate, fat, and caloric intake against fitness goals.
- **Hostel Mess Integration**: Pre-configured campus meal menus across breakfast, lunch, high tea, and dinner.
- **Rapid Meal Logging**: Check off consumed mess meals or record custom foods with instant macronutrient breakdown.

### 7. Outing Expenses & Group Settlements
- **Group Trip & Outing Tracking**: Record outings with destinations, optional budgets, and participant rosters.
- **Rapid Expense Logging**: Log shared expenses, assign payment sources, and select split modes (Equal, Custom, or Personal).
- **On-Device Receipt Compression**: Client-side image compression storing compressed receipts locally in IndexedDB.
- **Settle-Up Optimization**: Instant net balance calculations identifying who owes whom with single-tap clipboard recap sharing.

### 8. Frictionless Expense & Budget Tracker
- **Rapid Entry**: Log personal expenditures in seconds with minimal interactions.
- **Categorized Accounting**: Mess & Food, Academics, Travel, Gym, Personal, and Miscellaneous ledgers.
- **Allowance Guardrails**: Visual progress meters warning when approaching defined monthly spending limits.

### 9. Hostel Laundry Manager
- **Batch Tracking**: Monitor submitted laundry batches with handover dates and expected delivery timelines.
- **Itemized Counting**: Categorize apparel, linen, and delicates with automated tallying.
- **Status Workflows**: Visual state indicators for pending, processing, and collected laundry bags.

### 10. Biometric Credentials Vault
- **Hardware Biometrics**: Secured via Android Jetpack Biometrics supporting fingerprint, face unlock, and device PIN fallback.
- **AES-256-GCM Encryption**: Client-side encrypted credential keeper for portals and academic accounts with PBKDF2 key derivation.
- **Background Auto-Lock**: Configurable security timeouts when the application is backgrounded.

---

## System Architecture

```
+---------------------------------------------------------------------------+
|                     LifeOS Unified Client (React 18)                      |
|  (Home · Gym · Study · Nutrition · Timetable · Outings · Vault · Settings) |
+---------------------+-------------------------------+---------------------+
                      |                               |
                      v                               v
       +-----------------------------+ +-----------------------------+
       |     useDayPhase() Hook      | |    useData (Sync Engine)    |
       |  - Real-time phase clock    | |  - Optimistic local cache   |
       |  - ThemeMode (Dynamic/Night)| |  - IndexedDB storage        |
       |  - Preferences persistence  | |  - Firestore background sync|
       +--------------+--------------+ +--------------+--------------+
                      |                               |
        +-------------+-------------+                 |
        v                           v                 v
+-------------------+     +-------------------+ +---------------------------+
| DayThemeProvider  |     |   usePixelSky()   | | Firebase Cloud Firestore  |
| - CSS custom vars |     | - PixelSkyCanvas  | | users/{uid} private doc   |
| - Tonal palettes  |     | - Twinkle layer   | +---------------------------+
+-------------------+     +-------------------+               |
                                                              v
+---------------------------------------------------------------------------+
|                          Capacitor Native Bridge                          |
| +----------------------+ +----------------------+ +---------------------+ |
| | WidgetUpdaterPlugin  | |  ApkInstallerPlugin  | | TimerForegroundSvc  | |
| | - Off-thread executor| | - Sideload installer | | - Wall-clock timer  | |
| | - SharedPreferences  | | - SHA-256 validation | | - Persistent alerts | |
| +----------------------+ +----------------------+ +---------------------+ |
| +----------------------+ +----------------------+ +---------------------+ |
| |   NativeBiometric    | |   CapacitorHaptics   | | LocalNotifications  | |
| +----------------------+ +----------------------+ +---------------------+ |
+---------------------------------------------------------------------------+
```

---

## Technology Stack

| Domain | Technology | Description |
|---|---|---|
| **Core Framework** | React 18.3 | Concurrent rendering, functional components, custom hooks |
| **Language** | TypeScript 5.5 | Strictly typed domain models and interfaces |
| **Styling & Design** | Tailwind CSS 3.4 | Utility-first styling with custom Material 3 tokens |
| **Typography** | Google Sans Flex | Adaptive variable font with unified weight hierarchy |
| **Animations** | Framer Motion 11 | GPU-composited 120fps physics-based transitions |
| **Build Tooling** | Vite 8 + Rolldown | High-performance bundling and instant HMR |
| **Native Runtime** | Capacitor 8 | Native Android container with modern plugin bridge |
| **Android Layer** | Kotlin 2.0 & Java 17 | Android SDK 34+ target, AndroidX, Gradle 8.14 |
| **Cloud Backend** | Google Firebase | Cloud Firestore for encrypted cloud synchronization |
| **Authentication** | Firebase Auth | Google OAuth 2.0 and biometric-backed local sessions |
| **Home Screen Widget** | Android AppWidget | Native RemoteViews, AppWidgetProvider, circadian theming |
| **Security & Cryptography** | Web Crypto API | AES-256-GCM client-side encryption with PBKDF2 |
| **Hosting & CDN** | Vercel Edge Network | Global distribution for web application and release APK |

---

## Repository Structure

```
lifeos/
├── android/                             # Android Studio native project
│   ├── app/
│   │   ├── build.gradle                 # Version code (13), version name (1.2.3), signing configs
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
│   │           ├── layout/widget_layout.xml     # Native AppWidget UI hierarchy
│   │           ├── values/widget_phase_colors.xml # Circadian color definitions for native widgets
│   │           └── xml/lifeos_widget_info.xml   # AppWidgetProvider metadata
├── public/
│   ├── LifeOS.apk                       # Production-signed release APK (~14 MB)
│   ├── version.json                     # Live release manifest with SHA-256 checksum
│   ├── icon.svg                         # Vector application icon
│   └── icon-monochrome.svg              # Material You dynamic themed icon
├── scripts/
│   ├── check-palette.ts                 # Validates Delta E distances and WCAG contrast
│   ├── test-layout-matrix.ts            # 1,260-point multi-viewport layout validation
│   ├── test-scroll-regression.ts        # Comprehensive vertical scroll test suite
│   ├── test-sheet-scroll.mjs            # Modal bottom sheet touch and zero-overlap test
│   ├── test-updater.ts                  # Updater logic and SHA-256 verification tests
│   └── generate-widget-colors.js        # Extracts CSS palettes into Android XML colors
├── src/
│   ├── components/                      # Reusable UI elements (BottomSheet, Nav, Buttons)
│   ├── config/                          # Route and navigation configuration
│   ├── features/                        # Domain feature modules (outings, workouts, etc.)
│   │   └── outings/                     # Group expense tracking and split balancing
│   ├── hooks/                           # Lifecycle, theme, and data hooks
│   ├── pages/                           # Application views (Home, Gym, Study, Nutrition, etc.)
│   ├── theme/                           # Color tokens, section seeds, and typography
│   ├── utils/                           # Storage, updater, haptics, and security utilities
│   ├── App.tsx                          # Root router and lifecycle coordinator
│   └── firebase.ts                      # Firebase SDK initialization
├── capacitor.config.ts                  # Capacitor native container configuration
├── tailwind.config.js                   # Design tokens and theme extensions
└── vite.config.ts                       # Vite build configuration
```

---

## Development Quickstart

### Prerequisites
- Node.js v18.0.0 or higher
- npm v9 or higher
- Java Development Kit (JDK) 17
- Android Studio (Ladybug or newer, Android SDK 34+)
- Google Firebase account with Firestore and Authentication enabled

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
Navigate to `http://localhost:5173/` in your browser.

---

## Build & Release Verification

| Command | Action Performed |
|---|---|
| `npm run dev` | Starts local Vite development server with instant HMR |
| `npm run build` | Compiles TypeScript and builds production web bundle in `dist/` |
| `npm run check:palette` | Verifies contrast ratios and Delta E perceptual color distances |
| `npm run test:updater` | Tests version parsing, downgrade prevention, and SHA-256 validation |
| `npm run test:matrix` | Runs 1,260-point multi-viewport layout validation across all routes |
| `npm run test:scroll` | Verifies vertical touch and wheel scroll responsiveness |
| `npm run cap:sync` | Compiles web bundle, updates colors, and syncs to Android platform |

### Release Compilation (Android APK)
```bash
# 1. Compile web bundle and sync to Android
npm run cap:sync

# 2. Compile signed release APK via Gradle
cd android
./gradlew assembleRelease
cd ..

# 3. Stage APK and update version manifest
Copy-Item -Path android/app/build/outputs/apk/release/app-release.apk -Destination public/LifeOS.apk -Force
```

---

## Sideload Installation Guide (Android)

1. Open your device mobile browser and navigate to:  
   **[https://lifeos-gujjeti-avineeshs-projects.vercel.app/download](https://lifeos-gujjeti-avineeshs-projects.vercel.app/download)**
2. Tap **Download LifeOS for Android** to fetch `LifeOS.apk`.
3. When prompted by Android regarding direct APK downloads (*"File might be harmful"*), select **Download anyway**.
4. Open the downloaded file and choose **Install**. Enable **Allow from this source** in browser permissions if required.
5. Open LifeOS and pin the **LifeOS Widget** to your home screen.

---

## Author & Maintainer

**Gujjeti Avineesh**  
Architect, Designer & Full-Stack Developer  

- GitHub: [@Avineesh-G](https://github.com/Avineesh-G)
- Project Repository: [https://github.com/Avineesh-G/LIFEOS](https://github.com/Avineesh-G/LIFEOS)
- Live Deployment: [https://lifeos-gujjeti-avineeshs-projects.vercel.app](https://lifeos-gujjeti-avineeshs-projects.vercel.app)

---

## License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute this software with attribution. See the [LICENSE](LICENSE) file for details.

<div align="center">

<br />

**Built with pride for discipline, high achievement, and daily clarity.**  
*LifeOS. All rights reserved.*

</div>
