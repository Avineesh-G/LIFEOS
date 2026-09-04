# LifeOS (Flow) 🌱

LifeOS (branded as **Flow**) is a comprehensive, personal life operating system designed to act as a unified dashboard for tracking daily habits, workouts, nutrition, studying, and spending. Built with a premium glassmorphic/minimalist UI, it operates seamlessly as a Progressive Web App (PWA) across all mobile and desktop devices.

## ✨ Features

- **Auth & Cloud Sync:** Powered by Firebase Authentication (Google Sign-in) and Firestore, ensuring your data is securely synced in real-time across all your devices. No guest access; your data stays safe in your account.
- **Gym & Workout Tracking:** Log daily workouts, track sets, reps, and weights. View your PRs (Personal Records) and visualize progress over time.
- **Nutrition & Mess Menu:** AI-powered nutrition logging (using Groq / Gemini). View your daily Mess Menu effortlessly.
- **Study Timer & Tracking:** Pomodoro-style study timers with deep work tracking. Categorize your study sessions by subject.
- **Spending Tracker:** Keep a close eye on your daily expenses with categorized inputs and monthly summaries.
- **Progress Dashboard:** A high-level overview of your monthly trends, streaks, and top subjects/activities.
- **Fully Installable PWA:** Designed to feel exactly like a native app on iOS and Android.

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion (for fluid animations), Lucide React (for iconography)
- **Typography:** Plus Jakarta Sans (Primary UI) & JetBrains Mono (Data/Labels)
- **Backend & Database:** Firebase (Auth, Firestore)
- **AI Integration:** Groq API (`qwen/qwen3.8-27b`) for intelligent nutrition and workout parsing

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Avineesh-G/LIFEOS.git
   cd LIFEOS/lifeos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add your Firebase and Groq keys:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GROQ_API_KEY=your_groq_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## 🎨 UI/UX Design
The app is built on a 90/10 typographic rule:
- **90% Plus Jakarta Sans**: Used for all structural elements (headings, buttons, body text) to provide a friendly, premium, native-app feel.
- **10% JetBrains Mono**: Used exclusively for technical data (reps, weights, dates, small labels) to ensure crisp readability and scan-ability.
