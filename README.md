# LifeOS (Flow)

[![React](https://img.shields.io/badge/React-18.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

LifeOS (branded as **Flow**) is a comprehensive, personal life operating system designed to act as a unified dashboard for tracking daily habits, workouts, nutrition, studying, and spending. Built with a premium glassmorphic and minimalist UI, it operates seamlessly as a Progressive Web App (PWA) across all mobile and desktop devices.

---

## Architecture & Features

- **Auth & Cloud Sync**
  Powered by Firebase Authentication (Google Sign-in) and Firestore, ensuring your data is securely synced in real-time across all your devices. No guest access; your data stays safe in your account.
  
- **Gym & Workout Tracking**
  Log daily workouts, track sets, reps, and weights. View your PRs (Personal Records) and visualize progress over time.

### Nutrition & AI Tracking
- **Smart Dietician:** Get personalized Groq AI insights on your recent eating trends
- **Meal Planning:** Add extra items outside the predefined mess menu
- **Skipped Meals:** Mark any meal slot as skipped; accurately reflected in history (v1.1)
- **Interactive Tracking:** Calorie progress ring dynamically fills as you log your day
- **Smooth Save Feedback:** Visual confirmation for saved meals with polished transition effects

### Premium UI/UX
- **Buttery-Smooth Animations:** Powered by `framer-motion` for gliding page transitions and interactive elements (Refined in v1.1)
- **Responsive Elements:** Perfectly tuned CSS transitions for hover, tap, and state changes
- **Dark Mode First:** Seamlessly switches between light and true-dark themes

- **Study Timer & Timetable**
  Pomodoro-style study timers with deep work tracking. Detailed timetable schedules with teacher, slot, and room mapping (v1.1).

- **Spending Tracker**
  Keep a close eye on your daily expenses with categorized inputs and monthly summaries.

- **Progress Dashboard**
  A high-level overview of your monthly trends, streaks, and top subjects/activities.

- **Fully Installable PWA**
  Designed to feel exactly like a native app on iOS and Android.

---

## Technology Stack

### Languages & Frameworks
- **React 18**
- **TypeScript**
- **JavaScript**
- **Vite** (Build Tool)

### Styling & UI
- **Tailwind CSS**
- **Framer Motion** (Fluid animations)
- **Lucide React** (Iconography)

### Backend & AI
- **Firebase** (Auth, Firestore)
- **Groq API** (`qwen/qwen3.8-27b`) for intelligent nutrition and workout parsing

---

## Getting Started

**1. Clone the repository**
```bash
git clone https://github.com/Avineesh-G/LIFEOS.git
cd LIFEOS/lifeos
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
Create a `.env` file in the root directory and add your Firebase keys:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**4. Run the development server**
```bash
npm run dev
```

**5. Build for Production**
```bash
npm run build
```

---

## UI/UX Design

The application is built on a strict typographic rule for maximum readability:
- **90% Plus Jakarta Sans**: Used for all structural elements (headings, buttons, body text) to provide a friendly, premium, native-app feel.
- **10% JetBrains Mono**: Used exclusively for technical data (reps, weights, dates, small labels) to ensure crisp readability and scan-ability.
