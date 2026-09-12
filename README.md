<div align="center">

# LifeOS

**A unified personal operating system for academics, fitness, nutrition, finances, and habits — with an AI coach built in.**

[![React](https://img.shields.io/badge/React-18.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/license-Private-lightgrey)]()

[Live Demo](https://lifeos-iota-one.vercel.app) · [Issues](https://github.com/Avineesh-G/LIFEOS/issues) · [Latest Release](https://github.com/Avineesh-G/LIFEOS/releases)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Why LifeOS](#why-lifeos)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Build & Deployment](#build--deployment)
- [Design Philosophy](#design-philosophy)
- [Data Model & Sync Strategy](#data-model--sync-strategy)
- [AI Coaching System](#ai-coaching-system)
- [Release Notes](#release-notes)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**LifeOS** is a single application that replaces the five or six disconnected apps most people use to manage their life — a gym tracker, a study timer, a budgeting app, a class timetable, a to-do list, and a habit tracker — with one cohesive, mobile-first system. It runs as a React web client backed by Firebase, and compiles into a signed, installable native Android app via Capacitor, complete with hardware haptics, 120fps page transitions, and a zero-reinstall live update engine.

What sets it apart from a typical tracker bundle is the **AI layer**: instead of the user deciding what to log every day, LifeOS tells them — "today is chest day," here's your calorie target, here's what's on the mess menu that fits it — and asks for the actuals afterward.

## Why LifeOS

Most personal trackers are passive: they wait for you to open the app, decide what to do, and enter data. LifeOS inverts that relationship in two specific ways:

1. **The gym module is prescriptive, not just descriptive.** Each day surfaces the planned muscle group from the user's split and prompts for the actual weight/reps/rounds performed, rather than letting the user browse and pick a routine from scratch.
2. **The nutrition module is goal-driven.** A one-time body profile (age, height, weight, goal weight, activity level) lets the AI calculate a daily calorie target and evaluate the monthly mess menu against it, rather than leaving portion and meal choices entirely up to the user.

## Features

### Home
- Daily "execution score" summarizing performance across every module
- One-tap cloud sync with a spinning refresh indicator and haptic confirmation
- Centered floating squircle navigation dock with a speed-dial menu for secondary modules

### Gym
- Day-based workout split with a weekly view
- Active workout session logger with rest timers and set-completion tracking
- Historical weight/rep analytics per exercise
- Interactive onboarding wizard to set up an initial split
- AI-suggested tweaks to the split over time, based on logged performance

### Nutrition
- Monthly mess-menu ingestion (uploaded as a PDF) with AI-extracted items and estimated calories
- Meal guidance weighted toward the user's weight-loss/goal-weight target

### Study
- Pomodoro and stopwatch timers
- Session history, including logged doubts/questions
- Year-round study activity heatmap

### Timetable
- Class schedule and topic recorder
- Tapping a scheduled block starts a pre-filled study timer session for that subject

### Spending
- Category-based budgeting
- Lightweight expense log (deliberately simpler than a dedicated finance app)

### Tasks
- Segmented, multi-color to-do list

### Progress
- Long-term habit streaks
- Radar-chart breakdowns of personal stats over time

### Platform-Level Features
- Native Android hardware back-button and swipe-gesture interception, routing back to Home from any section, with graceful app exit from Home
- Real hardware vibration haptics on key interactions
- Google Play Services sign-in
- Live Sync: in-app update detection with a clear "running latest version" state and one-tap apply when a new build is available
- Multi-user isolation with automatic default-data seeding for new sign-ins

## Architecture

```
┌─────────────────────────────┐
│         React Client        │
│  (Pages → Hooks → Firebase) │
└──────────────┬──────────────┘
               │ optimistic local-first writes
               ▼
┌─────────────────────────────┐
│   useData (sync hook)       │
│  - partial diff merge       │
│  - conflict-safe writes     │
└──────────────┬──────────────┘
               ▼
┌─────────────────────────────┐
│  Firebase Cloud Firestore   │
│  users/{uid} → per-user doc │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Capacitor Native Bridge   │
│  (Android haptics, auth,    │
│   back-navigation, updates) │
└─────────────────────────────┘
```

The web build and the native Android shell share one codebase: Capacitor wraps the compiled web app, and platform-specific behavior (haptics, hardware back button, Play Services auth) is layered on through Capacitor plugins rather than a separate native app.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS, Framer Motion |
| Bundler | Vite |
| Native Runtime | Capacitor 8 (Android), GPU-accelerated compositor transforms |
| Backend & Auth | Google Firebase (Cloud Firestore + Authentication) |
| Native Auth | Google Play Services via `@codetrix-studio/capacitor-google-auth` |
| Haptics | `@capacitor/haptics` (native Android vibration service) |
| Native Navigation | `@capacitor/app` (hardware back button / gesture interception) |
| AI Inference | Groq Cloud API — waterfall fallback across Qwen, GPT-OSS, and other hosted models |

## Project Structure

```
lifeos/
├── android/                             # Native Android Studio project
│   └── app/
│       ├── build.gradle                 # Version code/name, keystore config
│       ├── lifeos-release-key.jks       # Production release signing keystore
│       └── src/main/
│           ├── AndroidManifest.xml      # Permissions, hardware acceleration
│           └── res/                     # Adaptive launcher icons
├── public/
│   ├── LifeOS.apk                       # Production-signed release APK
│   ├── version.json                     # Release manifest for in-app update checks
│   ├── icon.svg                         # Master vector icon
│   └── icon-monochrome.svg              # Material You themed launcher icon
├── src/
│   ├── components/
│   │   ├── Layout.tsx                   # Navigation dock & viewport frame
│   │   ├── ErrorBoundary.tsx            # Crash handling & recovery
│   │   ├── BodyProfileForm.tsx          # Biometrics & fitness goals input
│   │   └── AnimatedIcons.tsx            # Custom SVG icon set
│   ├── data/
│   │   ├── defaultData.ts               # Fallback initial data structures
│   │   └── messMenu.ts                  # Monthly campus nutrition menu
│   ├── hooks/
│   │   ├── useData.ts                   # Optimistic local-first Firestore sync
│   │   └── useTheme.ts                  # Dynamic light/dark/system theming
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Gym.tsx / GymWorkout.tsx / GymSplit.tsx / GymExerciseHistory.tsx / GymOnboarding.tsx
│   │   ├── Nutrition.tsx
│   │   ├── Study.tsx / StudyTimer.tsx / StudyHistory.tsx / StudyHeatmap.tsx
│   │   ├── Spending.tsx
│   │   ├── Timetable.tsx
│   │   ├── Tasks.tsx
│   │   ├── Progress.tsx
│   │   ├── Settings.tsx                 # Live Sync, Groq AI key, theme
│   │   └── Auth.tsx
│   ├── utils/
│   │   ├── geminiCoach.ts               # AI coaching & diet-tip waterfall
│   │   └── haptics.ts                   # Capacitor haptic integration
│   ├── App.tsx                          # Routing & page transitions
│   ├── firebase.ts                      # Firestore & Auth client
│   ├── main.tsx                         # React 18 DOM mount point
│   └── types.ts                         # Shared TypeScript domain models
├── capacitor.config.ts
├── tailwind.config.js
└── vite.config.ts
```

## Getting Started

### Prerequisites
- Node.js (LTS) and npm
- A Firebase project with Cloud Firestore and Authentication enabled
- Android Studio, if building the native APK
- (Optional) A [Groq](https://groq.com/) API key for AI coaching — entered inside the app's Settings screen, not required to build or run

### Installation

```bash
git clone https://github.com/Avineesh-G/LIFEOS.git
cd LIFEOS
npm install
```

### Run the Dev Server

```bash
npm run dev
```

## Configuration

- Firebase project credentials are wired up in `src/firebase.ts`.
- The Groq API key is **not** an environment variable and is never bundled into the build — each user enters their own key in **Settings**, and it is written only to that user's private Firestore document (`users/{uid}`) plus device `localStorage`, keeping it out of Git history and the public JS bundle.

## Build & Deployment

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run build` | Produce a production web build |
| `npm run cap:sync` | Sync the web build into the native Android project |
| `npm run cap:build` | Compile a signed release APK |

The signed binary lands at `android/app/build/outputs/apk/release/app-release.apk` and is copied automatically to `public/LifeOS.apk`, where the in-app Live Sync update check reads it from.

The web build is deployed via Vercel at [lifeos-iota-one.vercel.app](https://lifeos-iota-one.vercel.app).

## Design Philosophy

LifeOS follows a minimal, calm, premium aesthetic rather than a heavily animated or skeuomorphic one:

- Typography, spacing, and borders carry the visual hierarchy — not shadows or gradients
- Framer Motion is used sparingly, for purposeful transitions (page changes, speed-dial menus) rather than decoration
- Monochrome base palette with a single configurable accent color
- Full light/dark/system theme support
- Page transitions use a `cubic-bezier(0.22, 1, 0.36, 1)` deceleration curve with compositor-only GPU transforms (`translateZ(0)`, `will-change`) to hold 120Hz on supported displays

## Data Model & Sync Strategy

- **Local-first, optimistic writes:** UI updates immediately; Firestore sync happens in the background.
- **Partial diff syncing:** `saveData` sends only the modified fields with `{ merge: true }`, so one feature's write can never overwrite another feature's collection.
- **Multi-user isolation:** each new sign-in is auto-seeded with default 7-day workout plans, initial settings, and empty data arrays — no shared state leaks between users on the same installed APK.
- **Automatic cloud healing:** on a detected discrepancy between local and cloud state, local progress is preserved and re-synced to Firestore rather than silently overwritten.

## AI Coaching System

- Coaching and diet-tip generation run through a **waterfall model cascade** on Groq Cloud — if the primary model is unavailable or rate-limited, the request automatically falls through to the next model in the list.
- Model reasoning tags (e.g. `<think>`) are stripped from responses before display.
- API keys are user-supplied and stored per-user in Firestore, never hardcoded or bundled at build time.
- Two coaching surfaces exist today: a **Gym coach** (assigns the day's muscle group, proposes split adjustments over time) and a **Nutrition coach** (extracts and scores the monthly mess menu against the user's calorie target).

## Release Notes

<details>
<summary><strong>v1.5 (Build 10)</strong> — Floating dock & speed-dial refinement</summary>

- Decoupled the navigation dock into independent floating squircle tiles, each with its own elevation, shadow, and tap physics
- Recalibrated the speed-dial action menu spacing to eliminate overlap with the floating dock, with a right-aligned staggered rise animation

</details>

<details>
<summary><strong>v1.5 (Build 9)</strong> — Centered dock & update UX</summary>

- Introduced the centered squircle floating navigation cluster with backdrop blur and haptic feedback
- Front-and-center access to Home, Gym, and Nutrition, with a secondary menu button for the rest
- Settings now shows a clear "running latest version" state with no redundant update button, and surfaces an "Apply Update" action only when a new build is actually available

</details>

<details>
<summary><strong>v1.5 (Build 8)</strong> — Native navigation, sync hardening, AI architecture</summary>

- Native Android hardware back-button and gesture interception, routing back to Home from any section with a graceful exit from Home
- Icon-only cloud sync button on Home with a 360° spin animation and haptic/emerald confirmation on success
- Multi-user isolation with automatic seeding for new users, plus strict partial-diff Firestore syncing to prevent cross-feature overwrites
- 120fps Material-3-style page transitions with compositor-only GPU transforms, memoized per-page computations
- Migrated AI key handling to a secure, user-supplied, client-managed model with a multi-model Groq waterfall fallback
- Gym section polish: fixed badge/pill overlap and removed a fragile stagger animation that caused blank-screen freezes on navigation

</details>

## Roadmap

- [ ] iOS build via Capacitor
- [ ] Expanded AI coach: cross-module insights (e.g. correlating sleep/study time with workout performance)
- [ ] Export/import for full personal data backup
- [ ] Web push notifications for scheduled timetable blocks

## License

Private repository. All rights reserved.
