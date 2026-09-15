<div align="center">

# LifeOS

**A unified personal operating system for academics, fitness, nutrition, finances, and habits — with native biometric protection and an AI coach built in.**

[![React](https://img.shields.io/badge/React-18.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android_8.0+-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Release](https://img.shields.io/badge/Version-v1.5.5-6366F1)](https://lifeos-iota-one.vercel.app/download)

### [🚀 Download & Explore LifeOS](https://lifeos-iota-one.vercel.app/download) · [🌐 Web Version](https://lifeos-iota-one.vercel.app) · [🐛 Report Issues](https://github.com/Avineesh-G/LIFEOS/issues)

</div>

---

## Table of Contents

- [Overview](#overview)
- [How to Download & Install](#how-to-download--install)
- [Why LifeOS](#why-lifeos)
- [Core Modules](#core-modules)
- [Platform & Security Features](#platform--security-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started for Developers](#getting-started-for-developers)
- [Build & Deployment](#build--deployment)
- [Data Model & Sync Strategy](#data-model--sync-strategy)
- [AI Coaching System](#ai-coaching-system)
- [Release Notes](#release-notes)
- [Creator & License](#creator--license)

---

## Overview

**LifeOS** is a single, cohesive operating system designed to replace the 5–6 disconnected, subscription-heavy apps most students and high-achievers juggle:
- A workout & gym set tracker ($10/mo)
- A Pomodoro & study session tracker ($6/mo)
- An expense & budgeting manager ($8/mo)
- A class schedule & period timetable
- A nutrition & hostel mess meal guide
- A daily task & habit tracker

Instead of fighting notification spam, predatory subscriptions, and data harvesting, LifeOS unifies your daily execution into a **single, lightning-fast, offline-ready application** engineered by **Gujjeti Avineesh**.

It runs as a responsive progressive web client backed by Google Firebase and compiles into a signed, hardware-accelerated Android application via Capacitor with native biometrics, 120fps transitions, and offline-first data caching.

---

## How to Download & Install

LifeOS is distributed independently without app store middleman fees or mandatory subscriptions. Follow these simple steps to install it on your device:

### 📱 Android Installation (Step-by-Step)

1. **Visit the Official Showcase & Download Page**:  
   Open the official download page on your phone (or scan the on-screen QR code from a computer):  
   👉 **[https://lifeos-iota-one.vercel.app/download](https://lifeos-iota-one.vercel.app/download)**

2. **Explore & Tap "Download LifeOS for Android"**:  
   Read about the core modules, try the interactive live timers and gym set mockups, and tap the download button. The browser will begin downloading the lightweight package (`LifeOS.apk` ~7.5 MB).

3. **Allow "Unknown Sources" / Direct Sideloading**:  
   When Android Chrome prompts:  
   > *"File might be harmful. Do you want to download LifeOS.apk anyway?"*  
   Tap **Download anyway**. *(Google flags all direct third-party builds not hosted on the Play Store this way. LifeOS is 100% open, private, and tracker-free).*

4. **Tap to Install & Launch**:  
   Open your browser’s `Downloads` or tap the completed download notification, tap **Install**, and launch LifeOS!

---

### 💻 Web & Desktop Access

Don't have an Android device, or prefer using LifeOS from your laptop? You can launch the full web version directly in any modern browser:  
👉 **[Launch LifeOS Web App](https://lifeos-iota-one.vercel.app/)**

---

## Why LifeOS

Most personal trackers are passive: they wait for you to open the app, decide what to log, and demand a monthly subscription to view your history. LifeOS inverts that relationship:

1. **Prescriptive Gym Hypertrophy**: Each day automatically surfaces your planned muscle group from your split (e.g. Push, Pull, Legs) and logs weights, reps, and RPE with instant 1RM calculations.
2. **Goal-Driven Nutrition**: A one-time body profile calculates your daily calorie & macro targets and evaluates your campus mess menu against your targets.
3. **Academic Clarity**: Your college timetable dynamically highlights your active lecture in real-time with countdowns and lab room numbers.
4. **Zero Paywalls or Distractions**: 100% free forever, zero ads, zero third-party trackers, and zero clutter.

---

## Core Modules

### 🏋️ Gym & Hypertrophy
- Day-based workout split with interactive weekly views
- Active workout session logger with rest timers and set-completion checkboxes
- Progressive overload weight/rep analytics and PR tracking per exercise
- Built-in 1RM estimation formulas and rest interval triggers
- Interactive onboarding wizard to customize push/pull/legs or full-body routines

### 📚 Academics & Focus
- Pomodoro and deep work countdown/stopwatch timers
- Subject-based session logging with revision notes and questions
- GitHub-style 365-day study consistency heatmap
- Academic task and assignment priority tracking

### 📅 Live Timetable
- Weekly course and lecture schedule
- Real-time indicator highlighting the period in progress with room numbers and instructor info
- Direct tap-to-study integration: launch a study timer directly from an upcoming syllabus block

### 🥗 Nutrition & Mess Menus
- Daily macro tracking: Protein, Carbs, Fats, and Calorie targets
- College/hostel mess menu integration (breakfast, lunch, snacks, dinner)
- Instant meal calorie estimation and goal alignment

### 💰 Spending & Budget
- Lightweight student budgeting designed to minimize friction
- Category-based expenditure tracking (Mess, Academics, Travel, Gym, Personal)
- Visual breakdown of daily and monthly allowances

### 🔒 Fortified Privacy & Security
- Native Android biometric authentication (`BIOMETRIC_STRONG | DEVICE_CREDENTIAL`)
- Fingerprint and device PIN lock protecting logs, finances, and journal entries
- Automatic background lock with configurable cooldown timeouts
- Encrypted local sandbox caching

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│              LifeOS Unified Client (React 18)             │
│   (Pages: Home • Gym • Study • Nutrition • Timetable)     │
└─────────────┬───────────────────────────────┬─────────────┘
              │                               │
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   useData (Sync Hook)     │   │     Public Showcase       │
│  - Optimistic local cache │   │  - /download landing page │
│  - Partial diff merge     │   │  - Interactive mockups    │
│  - Conflict-safe writes   │   │  - QR code sideload modal │
└─────────────┬─────────────┘   └─────────────┬─────────────┘
              │                               │
              ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│  Firebase Cloud Firestore │   │  Static Production Build  │
│  users/{uid} private doc  │   │  Vercel CDN + LifeOS.apk  │
└─────────────┬─────────────┘   └───────────────────────────┘
              │
              ▼
┌───────────────────────────────────────────────────────────┐
│                  Capacitor Native Bridge                  │
│  (Biometric lock, haptics, gesture back-button, offline)  │
└───────────────────────────────────────────────────────────┘
```

The web build and the native Android shell share one codebase: Capacitor wraps the compiled web app, and platform-specific capabilities (biometrics, hardware back button, vibration haptics) are layered seamlessly without maintaining two separate codebases.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion |
| **Bundler** | Vite 8 |
| **Native Runtime** | Capacitor 8 (Android SDK 34+), GPU-accelerated transforms |
| **Backend & Storage** | Google Firebase (Cloud Firestore + Authentication) |
| **Native Biometrics** | `@capgo/capacitor-native-biometric` |
| **Haptics** | `@capacitor/haptics` (Android Vibration Service) |
| **Navigation** | `@capacitor/app` (Hardware back button / gesture interception) |
| **Deployment** | Vercel (Edge CDN + Static APK Hosting) |

---

## Project Structure

```
lifeos/
├── android/                             # Native Android Studio project
│   └── app/
│       ├── build.gradle                 # Version code, keystore config
│       ├── lifeos-release-key.jks       # Production release signing keystore
│       └── src/main/
│           ├── AndroidManifest.xml      # Hardware acceleration & permissions
│           └── res/                     # Adaptive launcher icons
├── public/
│   ├── LifeOS.apk                       # Production-signed release APK (~7.5 MB)
│   ├── version.json                     # Release manifest for in-app update checks
│   ├── icon.svg                         # Official vector brand logo
│   └── icon-monochrome.svg              # Material You themed monochrome icon
├── src/
│   ├── components/
│   │   ├── Layout.tsx                   # Dock & navigation layout
│   │   ├── ErrorBoundary.tsx            # Graceful crash handling
│   │   └── security/                    # Biometric lock overlay
│   ├── pages/
│   │   ├── DownloadPage.tsx             # Public showcase & interactive download page
│   │   ├── Home.tsx                     # Daily dashboard & execution score
│   │   ├── Gym.tsx / GymWorkout.tsx     # Workout logger & splits
│   │   ├── Study.tsx / StudyTimer.tsx   # Pomodoro focus & heatmaps
│   │   ├── Nutrition.tsx                # Macros & mess schedule
│   │   ├── Timetable.tsx                # Real-time period schedule
│   │   ├── Spending.tsx                 # Budget & expense tracker
│   │   ├── Settings.tsx                 # Security, themes & live update
│   │   └── Auth.tsx                     # Authentication gateway
│   ├── utils/
│   │   ├── security.ts                  # Biometric lock manager & state
│   │   └── haptics.ts                   # Capacitor vibration triggers
│   ├── App.tsx                          # App routing & /download bypass
│   ├── firebase.ts                      # Firestore & Auth initialization
│   └── types.ts                         # Shared TypeScript domain models
├── capacitor.config.ts
├── tailwind.config.js
└── vite.config.ts
```

---

## Getting Started for Developers

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS 18+) and npm
- A Firebase project with Firestore and Authentication enabled
- Android Studio (if building or testing the native APK)

### Installation

```bash
# Clone the repository
git clone https://github.com/Avineesh-G/LIFEOS.git
cd LIFEOS/lifeos

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173/download` to explore the showcase page, or `http://localhost:5173/` for the application.

---

## Build & Deployment

| Command | Purpose |
|---|---|
| `npm run dev` | Launch local Vite dev server |
| `npm run build` | Compile TypeScript and produce production bundle in `dist/` |
| `npm run cap:sync` | Sync production web bundle into the native Android assets |
| `npm run cap:build` | Compile production-signed release APK (`app-release.apk`) |
| `npm run cap:open` | Launch project directly inside Android Studio |

### Production Hosting
Whenever changes are pushed to the `main` branch of `https://github.com/Avineesh-G/LIFEOS.git`, Vercel automatically compiles and deploys:
- **Showcase Website**: `https://lifeos-iota-one.vercel.app/download`
- **Native APK**: `https://lifeos-iota-one.vercel.app/LifeOS.apk`
- **Web App**: `https://lifeos-iota-one.vercel.app/`

---

## Data Model & Sync Strategy

- **Local-first, optimistic writes:** The UI updates instantly; Firestore synchronization completes asynchronously in the background.
- **Partial diff syncing:** `saveData` transmits only altered keys using `{ merge: true }`, ensuring modules never overwrite each other's collections.
- **Multi-user isolation:** Each new account is seeded with isolated 7-day workout plans, initial default settings, and clean arrays—preventing cross-user leakage on shared devices.

---

## Release Notes

<details open>
<summary><strong>v1.5.5 (Build 15)</strong> — Biometric Password Vault, Persistent Background Timer & Instant Startup</summary>

- **Biometric Password & Credentials Vault**: AES-256-GCM encrypted vault protected directly by your phone's native biometrics and screen lock (fingerprint, face, PIN/pattern). Zero master passwords to forget.
- **Persistent Wall-Clock Study Timer**: Timer accurately tracks elapsed time using hardware wall-clock timestamps and foreground resume hooks, ensuring the timer never freezes or pauses when the phone screen turns off.
- **Direct 0ms Instant Startup**: Synchronous cache hydration eliminates startup delay; the home dashboard loads immediately with zero loading spinner.
- **Smooth 60/120fps GPU Navigation**: Removed blocking unmount transitions and fixed the white screen issue when returning from 3-dots speed-dial interfaces.
- **Gym & Activity Crash Fixes**: Resolved form saving blank screen glitches and improved table rendering across all modules.

</details>

<details>
<summary><strong>v1.5.4</strong> — Dedicated Showcase Website & Rich Interactive Tour</summary>

- Launched the standalone, public-facing **Product Showcase & APK Download Website** at `/download`.
- Built interactive "living" mobile mockups with live study Pomodoro timers, interactive gym set completion checkmarks, and real-time clock.
- Added floating glassmorphic orbit metric chips (*18-Day Streak*, *New 1RM PR: 95 kg*, *Class in 24m*).
- Added an interactive **Cost & Clutter Eliminator** calculator showing up to $360/year saved.
- Integrated desktop-to-mobile **QR Code Scanner Modal** for effortless sideloading.
- Preserved 100% of existing core application routes and biometric security logic.

</details>

<details>
<summary><strong>v1.5.0 - v1.5.3</strong> — Biometric App Lock & Performance Hardening</summary>

- Integrated Android Jetpack Biometrics (`BIOMETRIC_STRONG | DEVICE_CREDENTIAL`) with configurable background cooldowns.
- Redesigned floating navigation squircle dock with backdrop blur and tactile haptics.
- 120fps GPU compositor page transitions using custom cubic-bezier curves.
- In-app Live Sync engine to detect newer APK builds.

</details>

---

## Creator & License

Built with dedication for student discipline, high performance, and focused living.

- **Author & Architect**: **Gujjeti Avineesh**
- **Repository**: [https://github.com/Avineesh-G/LIFEOS](https://github.com/Avineesh-G/LIFEOS)
- **Download**: [https://lifeos-iota-one.vercel.app/download](https://lifeos-iota-one.vercel.app/download)

*All rights reserved. LifeOS Project.*
