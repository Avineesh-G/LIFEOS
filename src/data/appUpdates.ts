import React from 'react';
import { Camera, Compass, Microphone, ForkKnife, CalendarCheck, Wallet, HardDrive, ShieldCheck } from '../ui/tokens/icons';
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
  developerGithub?: string;
}

export const OFFICIAL_DEVELOPER_EMAILS = [
  'avineeshgujjeti2006@gmail.com',
  'avineeshgujjeti@outlook.com',
];

export const OFFICIAL_DEVELOPER_GITHUB = 'https://github.com/Avineesh-G/LIFEOS';

export const APP_UPDATES: AppUpdate[] = [
  {
    id: 'update-v3-3-8-calendar-dock-droplet-fixes',
    category: 'Calendar & Mobile UX',
    icon: React.createElement(CalendarCheck, { size: 13, weight: 'bold' }),
    title: 'Calendar Safe Insets & Mobile Liquid Droplet Architecture',
    dateTime: 'Nov 12 • 08:00 PM',
    fullDateTime: 'Thursday, Nov 12, 2026 • 08:00 PM',
    tag: `v${CURRENT_VERSION_NAME} • Latest`,
    colorClass: 'text-[#5E5CE6]',
    summary: 'Calendar status bar collision resolution with back button navigation, complete floating bottom navigation dock clearance, liquid water droplet styling, and non-truncating category filters.',
    points: [
      'Calendar Top Status Bar Clearance: Lowered Calendar top controls with native safe-area insets and integrated dedicated Back navigation button, preventing collision with phone punch-holes and status bar indicators.',
      'Zero Bottom Dock Collision: Enhanced bottom scroll padding and added a generous clearance spacer so scheduled tasks and events sit comfortably above the floating navigation dock.',
      'Liquid Water Droplet Day Drawer: Redesigned the Selected Day drawer inside a squircle liquid glass chassis with specular micro-sheens, and optimized mobile cell heights to 58px for spacious viewing.',
      'No-Truncation Category Pills: Added horizontal smooth scroll track with shrink-prevention, keeping filters like Study & Exams, Gym & Fitness, and Work & Projects fully readable.',
      'Separated Calendar Experience: Removed redundant Full Calendar button from Home screen and placed Calendar as the lead module under Plan & Operations in More Hub, while Home calendar icon triggers instant quick agenda popup.',
      'Drive Folder & File Palette Harmony: Deep Burgundy (#9F1239) and jewel tones registered with files dynamically inheriting their parent folder accent colors.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
    developerGithub: OFFICIAL_DEVELOPER_GITHUB,
  },
  {
    id: 'update-v3-3-7-liquid-calendar-notifications',
    category: 'Calendar & Liquid UI',
    icon: React.createElement(CalendarCheck, { size: 13, weight: 'bold' }),
    title: 'Professional Calendar & Liquid Design',
    dateTime: 'Nov 12 • 12:30 PM',
    fullDateTime: 'Thursday, Nov 12, 2026 • 12:30 PM',
    tag: 'v3.3.7',
    colorClass: 'text-[#5E5CE6]',
    summary: 'Professional Apple/Google calendar suite, Liquid Design color typography, smart 30-min nutrition nudges, morning/evening gym alerts, and Outings glass redesign.',
    points: [
      'Apple & Google Calendar Engine: Multi-view calendar suite featuring full Month grid, 24-hour hourly Time Grid with live NOW indicator, and Agenda schedule feed.',
      'Header Quick Calendar: Added calendar button to top-right header capsule opening a floating popup for instant timeline inspection and quick adds.',
      'Liquid Design Color Evolution: Color strictly lives on words, numbers, and glyphs with translucent liquid droplets, eliminating heavy solid background blobs.',
      'Smart Nutrition Nudges: Automated 30-minute meal entry alerts throughout daytime hours (8:00 AM – 9:30 PM) that automatically mute once food is logged.',
      'Morning & Evening Gym Alarms: Dedicated 8:00 AM preparation and 6:00 PM wrap-up workout reminders that mute as soon as workout sets are logged.',
      'Outings Liquid Glass Redesign: Translucent glass controls, high-contrast inputs, and clean typography matching core LifeOS liquid styling.',
      'Drive Upload Progress Ticker: Smooth continuous progress count from 5% to 100% and optimized image preview sizing preventing UI collisions.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
    developerGithub: OFFICIAL_DEVELOPER_GITHUB,
  },
  {
    id: 'update-tenant-isolation-drive-polish',
    category: 'Tenant Security & Drive',
    icon: React.createElement(ShieldCheck, { size: 13, weight: 'bold' }),
    title: 'Tenant Isolation & Drive Upgrades',
    dateTime: 'Nov 8 • 01:30 PM',
    fullDateTime: 'Sunday, Nov 8, 2026 • 01:30 PM',
    tag: 'v3.3.6',
    colorClass: 'text-[#30D158]',
    summary: 'Airtight multi-tenant user data isolation, continuous Drive upload percentage ticker, burgundy folder color accents, and precision notification dispatch.',
    points: [
      'Zero Cross-User Sync: Complete tenant isolation across local cache, Firestore auto-healing, and Outings to guarantee strict privacy between different user accounts.',
      'Active Upload Ticker: Real-time dynamic progress percentage ticker during Drive uploads from 25% through 100% completion.',
      'Jewel-Tone Folder Accents: Added Burgundy (#9F1239) and dynamic folder color inheritance across file icons and reader badges.',
      'Streamlined File Inspector: Clean reader modal layout with optimized image sizing and removed direct downloads/QR codes for sleek mobile viewing.',
      'Precision Event Alarms: Enhanced Android exact alarm scheduling with prompt notifications 20 minutes before events and starting reminders.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
    developerGithub: OFFICIAL_DEVELOPER_GITHUB,
  },
  {
    id: 'update-drive-docs-ai-inspector',
    category: 'Drive & AI Routing',
    icon: React.createElement(HardDrive, { size: 13, weight: 'bold' }),
    title: 'Drive & AI Document Inspector',
    dateTime: 'Nov 5 • 07:45 PM',
    fullDateTime: 'Thursday, Nov 5, 2026 • 07:45 PM',
    tag: 'v3.3.5',
    colorClass: 'text-[#0A84FF]',
    summary: 'Built-in 5.0 GB Drive & Docs cloud storage, in-reader AI intelligence that extracts and routes document receipts, and optimized native edge header layouts.',
    points: [
      'LifeOS Drive & Docs Hub: Fast local-first cloud storage with 5.0 GB quota, instant multi-file uploads, and cross-device QR transfer.',
      'In-Reader AI Document Inspector: AI reads images and documents in reading mode, extracts amounts, items, and tasks, and routes directly to Finance, Gym, Nutrition, Tasks, or Notes.',
      'Native Android Edge Refinement: Zero header overshadowing, optimized status bar clearance, and pinned bottom actions for smooth one-hand mobile ergonomics.',
      'Mobile Stability: Unified split-chip controls, secure delete confirmation safeguards, and zero frame drops on Android WebView.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
  },
  {
    id: 'update-auto-voice-vision',
    category: 'Universal Voice AI',
    icon: React.createElement(Microphone, { size: 13, weight: 'bold' }),
    title: 'Universal Voice & Vision AI',
    dateTime: 'Nov 4 • 11:15 PM',
    fullDateTime: 'Wednesday, Nov 4, 2026 • 11:15 PM',
    tag: 'v3.3.4',
    colorClass: 'text-[#0A84FF]',
    summary: 'Universal automatic language analysis for microphone speech, zero-hallucination transcription, and multimodal notes vision in Luna AI.',
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
    summary: 'Capture exam analysis notes, handwritten formulas, or lecture whiteboards directly in Luna AI with multimodal recognition.',
    points: [
      'Multimodal Photo Input: Snap live pictures or attach up to 3 note sheets from phone storage or laptop webcam.',
      'Groq Qwen 27B Vision: High-speed OCR and contextual comprehension for handwritten notes, equations, and tables.',
      'Smart Interface Categorization: Automatically sorts points into Notes, Formulas, or Daily Tasks based on context.',
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
    id: 'update-timetable-classes',
    category: 'Timetable & Classes',
    icon: React.createElement(CalendarCheck, { size: 13, weight: 'bold' }),
    title: 'Timetable & Classes Hub',
    dateTime: 'Oct 20 • 11:00 AM',
    fullDateTime: 'Tuesday, Oct 20, 2026 • 11:00 AM',
    tag: 'v3.3.1',
    colorClass: 'text-[#BF5AF2]',
    summary: 'Real-time class schedule planner with automatic reminders, venue room tracking, and rapid subject switching in LifeOS.',
    points: [
      'Dynamic Class Schedule: Daily and weekly timetable views tailored for university lectures and lab sessions.',
      'Timetable Lead Reminders: Native 10-minute notifications keep you punctual for every scheduled lecture slot.',
      'One-Tap Navigation: Quick-launch timetable directly from the home Quick Hub or bottom navigation drawer.',
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
    id: 'update-finances-ledger',
    category: 'Finances',
    icon: React.createElement(Wallet, { size: 13, weight: 'bold' }),
    title: 'Finance & Expense Tracker',
    dateTime: 'Oct 05 • 6:45 PM',
    fullDateTime: 'Monday, Oct 05, 2026 • 06:45 PM',
    tag: 'v3.2.0',
    colorClass: 'text-[#30D158]',
    summary: 'Daily expense logging, budget monitoring, category insights, and offline-first finance management in LifeOS.',
    points: [
      'Rapid Expense Logging: Record food, travel, and miscellaneous spends in under 3 seconds with auto-categorization.',
      'Budget Limit Alerts: Visual balance metrics that safeguard your monthly student budget.',
      'Offline-Ready Storage: Secure local-first persistence synced automatically with cloud backups.',
    ],
    contactEmails: OFFICIAL_DEVELOPER_EMAILS,
  },
];
