import React from 'react';
import { Camera, Compass, Microphone, ForkKnife, Flame } from '../ui/tokens/icons';
import { CURRENT_VERSION_NAME } from '../version';

export interface AppUpdate {
  id: string;
  category: string;
  icon: React.ReactNode;
  title: string;
  dateTime: string;
  fullDateTime: string;
  tag: string;
  colorClass: string;
  summary: string;
  points: string[];
  contactEmails: string[];
}

export const OFFICIAL_DEVELOPER_EMAILS = [
  'avineeshgujjeti2006@gmail.com',
  'avineeshgujjeti@outlook.com',
];

export const APP_UPDATES: AppUpdate[] = [
  {
    id: 'update-auto-voice-vision',
    category: 'Universal Voice AI',
    icon: React.createElement(Microphone, { size: 13, weight: 'bold' }),
    title: 'Universal Voice & Vision AI',
    dateTime: 'Nov 4 • 11:15 PM',
    fullDateTime: 'Wednesday, Nov 4, 2026 • 11:15 PM',
    tag: `v${CURRENT_VERSION_NAME} • Latest`,
    colorClass: 'text-[#0A84FF]',
    summary: 'Universal automatic language analysis for microphone speech, zero-hallucination transcription, and multimodal study notes vision in Luna AI.',
    points: [
      'Universal Automatic Voice Recognition: Luna AI automatically analyzes and detects the spoken human language (English, Telugu, Hindi, Tamil, Kannada, Marathi, Bengali, and all global languages) and transcribes with zero cross-language hallucination.',
      'Instant Chat Paste: Spoken queries are instantly analyzed, transcribed, and pasted directly into the chat input bar with detected language feedback.',
      'Camera & Notes Vision: Capture live exam analysis notes, handwritten formulas, or whiteboard problems using camera or file upload.',
      'Strict Design Integrity: Pure Phosphor icons, zero emojis, and butter-smooth 120 FPS navigation across all devices.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
  },
  {
    id: 'update-camera-vision',
    category: 'Vision AI',
    icon: React.createElement(Camera, { size: 13, weight: 'bold' }),
    title: 'Camera & Vision AI',
    dateTime: 'Nov 4 • 9:30 PM',
    fullDateTime: 'Wednesday, Nov 4, 2026 • 09:30 PM',
    tag: 'v3.3.3',
    colorClass: 'text-[#30D158]',
    summary: 'Capture exam analysis notes, handwritten doubts, or lecture whiteboards directly in Luna AI with multimodal recognition.',
    points: [
      'Multimodal Photo Input: Snap live pictures or attach up to 3 study sheets from phone storage or laptop webcam.',
      'Groq Qwen 27B Vision: High-speed OCR and contextual comprehension for handwritten notes, equations, and tables.',
      'Smart Interface Categorization: Automatically sorts points into Notes, Study Doubts, or Daily Tasks based on context.',
      '1-Tap Action Cards: Interactive confirmation cards let you review and add items directly into target interfaces.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
  },
  {
    id: 'update-outings-planner',
    category: 'Trips & Outings',
    icon: React.createElement(Compass, { size: 13, weight: 'bold' }),
    title: 'Outings Planner',
    dateTime: 'Oct 28 • 4:15 PM',
    fullDateTime: 'Wednesday, Oct 28, 2026 • 04:15 PM',
    tag: 'v3.3.2',
    colorClass: 'text-[#0A84FF]',
    summary: 'AI-powered weekend trip generator tailored for student budgets and low-cost transit routes in LifeOS.',
    points: [
      'Smart Itinerary Architect: Generates timing, transit commute routes, and estimated expenses for weekend getaways.',
      'Spot Discovery: Curated student-friendly cafes, viewpoints, and attractions within your target budget.',
      'Checklists & Finance Sync: Compiles packing checklists and automatically links trip costs to the LifeOS Finance ledger.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
  },
  {
    id: 'update-voice-transcriber',
    category: 'Speech AI',
    icon: React.createElement(Microphone, { size: 13, weight: 'bold' }),
    title: 'Voice Transcriber',
    dateTime: 'Oct 20 • 11:00 AM',
    fullDateTime: 'Tuesday, Oct 20, 2026 • 11:00 AM',
    tag: 'v3.3.1',
    colorClass: 'text-[#BF5AF2]',
    summary: 'Record voice notes and lectures with rapid Whisper AI speech-to-text and instant bullet summarization in LifeOS.',
    points: [
      'Whisper Turbo Engine: High-fidelity voice transcription for fast lectures, ideas, and revision notes.',
      'Automated Bullet Takeaways: Automatically extracts crisp action points and key concept summaries.',
      'Notes Integration: Saves full transcripts and bullet points directly into the LifeOS Notes interface with timestamps.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
  },
  {
    id: 'update-mess-macros',
    category: 'Nutrition',
    icon: React.createElement(ForkKnife, { size: 13, weight: 'bold' }),
    title: 'Mess Menu & Macros',
    dateTime: 'Oct 12 • 1:30 PM',
    fullDateTime: 'Monday, Oct 12, 2026 • 01:30 PM',
    tag: 'v3.3.0',
    colorClass: 'text-[#FF9F0A]',
    summary: 'Campus mess timetable sync with real-time calorie estimation and daily macronutrient tracking in LifeOS Nutrition.',
    points: [
      'November Campus Timetable: Live meal schedules for breakfast, lunch, snacks, and dinner rotations.',
      'Macro Target Estimator: Calculates protein, carbs, and fats calibrated specifically for mess dining.',
      'Daily Goal Progress: Visual calorie and macro rings with quick adjustments to hit fitness goals.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
  },
  {
    id: 'update-focus-flow',
    category: 'Focus Flow',
    icon: React.createElement(Flame, { size: 13, weight: 'bold' }),
    title: 'Deep Work Room',
    dateTime: 'Oct 05 • 6:45 PM',
    fullDateTime: 'Monday, Oct 05, 2026 • 06:45 PM',
    tag: 'v3.2.0',
    colorClass: 'text-[#FF453A]',
    summary: 'Distraction-free Pomodoro deep focus environment with ambient soundscapes and study streak analytics in LifeOS.',
    points: [
      'Custom Sprint Intervals: Seamless work-rest cycles optimized for exam preparation and code sprints.',
      'Focus Audio Soundscapes: Integrated white noise, rain, and binaural audio to isolate room distractions.',
      'Study Heatmap & Streaks: Tracks daily focused hours, milestone badges, and consistency trends in the Study heatmap.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
  },
];

