import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import M3WavyProgressBar from './M3WavyProgressBar';
import { Sparkles } from 'lucide-react';

interface M3StartupGreetingProps {
  username: string;
  photoURL?: string | null;
  isAppReady: boolean;
  onComplete: () => void;
}

/**
 * Formats raw usernames (e.g. "GUJJETI AVINEESH 24BCA7481") into elegant Title Case
 * and removes student roll codes.
 */
function cleanDisplayName(raw: string): string {
  if (!raw) return 'Friend';
  // Strip student roll numbers like 24BCA7481
  let cleaned = raw.replace(/\b[0-9]{2}[A-Za-z]{2,5}[0-9]{3,6}\b/gi, '').trim();
  // Strip email domains if passed as email
  if (cleaned.includes('@')) {
    cleaned = cleaned.split('@')[0];
  }
  // Convert dots/underscores to spaces
  cleaned = cleaned.replace(/[._-]+/g, ' ').trim();

  // Convert ALL CAPS or lowercase to Clean Title Case: "GUJJETI AVINEESH" -> "Gujjeti Avineesh"
  if (cleaned.length > 1) {
    cleaned = cleaned
      .toLowerCase()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return cleaned || 'Friend';
}

// Material 3 Expressive 12-Lobed Scallop / Flower Path (Vibrant outer petal geometry)
const M3_12_SCALLOP_PATH = `
  M 150,16
  C 168,16 180,30 196,36
  C 212,42 228,40 240,52
  C 252,64 250,80 256,96
  C 262,112 276,124 276,144
  C 276,164 262,176 256,192
  C 250,208 252,224 240,236
  C 228,248 212,246 196,252
  C 180,258 168,272 150,272
  C 132,272 120,258 104,252
  C 88,246 72,248 60,236
  C 48,224 50,208 44,192
  C 38,176 24,164 24,144
  C 24,124 38,112 44,96
  C 50,80 48,64 60,52
  C 72,40 88,42 104,36
  C 120,30 132,16 150,16 Z
`;

// Material 3 Expressive 8-Lobed Starburst Path (Middle accent geometry)
const M3_8_STARBURST_PATH = `
  M 150,25
  C 170,25 185,55 205,65
  C 225,75 255,90 255,110
  C 255,130 225,145 235,165
  C 245,185 220,215 200,225
  C 180,235 170,265 150,265
  C 130,265 120,235 100,225
  C 80,215 55,185 65,165
  C 75,145 45,130 45,110
  C 45,90 75,75 95,65
  C 115,55 130,25 150,25 Z
`;

/**
 * Material 3 Expressive Startup Greeting
 * Requirements:
 * 1. Slow and smooth animations with transition effect when entering Home screen.
 * 2. Multi-layered Material 3 Expressive shapes with radiant, rich violet/indigo/purple colors (NO dark black blob).
 * 3. Inside the shape: "WELCOME BACK", cleaned Title Case user name. NO user photos.
 * 4. Sine-wave progress bar underneath matching user reference.
 */
export default function M3StartupGreeting({
  username,
  isAppReady,
  onComplete,
}: M3StartupGreetingProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const displayName = useMemo(() => cleanDisplayName(username), [username]);

  // Keep screen visible for ~3.2s for a slow, peaceful, luxurious experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  // When both min duration has elapsed AND app data is hydrated, trigger smooth exit
  useEffect(() => {
    if (minTimeElapsed && isAppReady) {
      setIsFinishing(true);
      const exitTimer = setTimeout(() => {
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(exitTimer);
    }
  }, [minTimeElapsed, isAppReady]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          key="m3-startup-greeting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }}
          exit={{
            opacity: 0,
            scale: 1.12,
            filter: 'blur(24px)',
            transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none bg-[#09070f] overflow-hidden"
          style={{
            willChange: 'opacity, transform, filter',
            transform: 'translateZ(0)',
          }}
        >
          {/* Ambient Multi-Hue Pulsing Radial Aura */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.35, 0.55, 0.35],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-violet-600 via-purple-500 to-indigo-600 blur-[90px] pointer-events-none"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full">
            {/* ── Composite Material 3 Expressive Shapes Representation ── */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center mb-8">
              
              {/* Shape 1 (Outer Layer): Rotating 12-Lobed Scallop in Radiant Violet-Indigo Gradient */}
              <motion.svg
                viewBox="0 0 300 300"
                className="absolute inset-0 w-full h-full drop-shadow-[0_20px_40px_rgba(124,58,237,0.45)]"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.03, 1],
                }}
                transition={{
                  rotate: { duration: 32, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <defs>
                  <linearGradient id="m3ScallopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="45%" stopColor="#8B5CF6" />
                    <stop offset="80%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
                <path
                  d={M3_12_SCALLOP_PATH}
                  fill="url(#m3ScallopGrad)"
                />
              </motion.svg>

              {/* Shape 2 (Middle Layer): Counter-Rotating 8-Lobed Starburst Accent with Frosted Glow */}
              <motion.svg
                viewBox="0 0 300 300"
                className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] pointer-events-none opacity-40 mix-blend-screen"
                animate={{
                  rotate: [360, 0],
                  scale: [0.95, 1, 0.95],
                }}
                transition={{
                  rotate: { duration: 24, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <defs>
                  <linearGradient id="m3StarGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EC4899" />
                    <stop offset="50%" stopColor="#C084FC" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>
                <path
                  d={M3_8_STARBURST_PATH}
                  fill="url(#m3StarGrad)"
                />
              </motion.svg>

              {/* Shape 3 (Core Canvas / Squircle Badge): Inside this sits "WELCOME BACK [USER NAME]" */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-20 w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] rounded-[52px] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 border border-white/35 shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_20px_45px_rgba(124,58,237,0.5)] backdrop-blur-md flex flex-col items-center justify-center p-5 text-center"
              >
                {/* Subtle Inner Glass Highlight */}
                <div className="absolute top-2 inset-x-8 h-10 bg-gradient-to-b from-white/30 to-transparent rounded-full pointer-events-none" />

                {/* Pill Tag: Welcome Back */}
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur-md mb-2 shadow-sm"
                >
                  <Sparkles size={11} className="text-amber-300 animate-pulse" />
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-white/95 font-tag">
                    Welcome Back
                  </span>
                </motion.div>

                {/* User's Formatted Name Inside the Shape (NO PHOTOS) */}
                <motion.h1
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight font-sans drop-shadow-md line-clamp-2 px-2"
                >
                  {displayName}
                </motion.h1>

                {/* Status Subtitle inside the shape */}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="mt-3 text-[10px] font-semibold tracking-wider text-purple-200/80 font-mono uppercase"
                >
                  LifeOS 2.0 • Ready
                </motion.span>
              </motion.div>
            </div>

            {/* ── Bottom Section: Sine-Wave Progress Bar & Status ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="w-48 flex flex-col items-center"
            >
              <M3WavyProgressBar
                progress={isFinishing ? 100 : 70}
                activeColor="#C084FC"
                trackColor="#4C1D95"
                height={20}
              />
              <p className="text-[11px] font-medium text-purple-300/80 mt-2.5 font-mono tracking-wide">
                {isFinishing ? 'Entering Home...' : 'Preparing LifeOS...'}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
