import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import M3WavyProgressBar from './M3WavyProgressBar';
import { Sparkles, CheckCircle2 } from 'lucide-react';

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
 * 1. Intentional ~1 second deliberate preparation screen showing "Making everything ready for you...".
 * 2. Multi-layered Material 3 Expressive shapes with radiant violet/indigo/purple colors matching app UI/UX.
 * 3. Inside the shape: "Welcome Back" pill badge with clean Title Case user name.
 * 4. Butter-smooth 120 FPS transitions with zero frame drops, no stutters, and hardware-accelerated exit.
 * 5. Strict 10-minute cooldown saved instantly on mount to prevent reappearing on reload/refresh.
 */
export default function M3StartupGreeting({
  username,
  isAppReady,
  onComplete,
}: M3StartupGreetingProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [progressVal, setProgressVal] = useState(25);

  const displayName = useMemo(() => cleanDisplayName(username), [username]);

  // Immediately lock the 10-minute cooldown on mount so reload/refresh NEVER shows it again within 10 minutes
  useEffect(() => {
    try {
      localStorage.setItem('lifeos_last_startup_greeting_timestamp', String(Date.now()));
    } catch (e) {
      console.warn('Failed to save greeting timestamp:', e);
    }
  }, []);

  // Animate progress smoothly across 1 second: 25% -> 60% -> 90% -> 100%
  useEffect(() => {
    const t1 = setTimeout(() => setProgressVal(65), 300);
    const t2 = setTimeout(() => setProgressVal(90), 650);
    const t3 = setTimeout(() => {
      setProgressVal(100);
      setMinTimeElapsed(true);
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // When ~1s preparation elapsed AND app is hydrated, trigger buttery-smooth transition into Home
  useEffect(() => {
    if (minTimeElapsed && isAppReady) {
      setIsFinishing(true);
      const exitTimer = setTimeout(() => {
        setIsVisible(false);
      }, 320);
      return () => clearTimeout(exitTimer);
    }
  }, [minTimeElapsed, isAppReady]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          key="m3-startup-greeting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }}
          exit={{
            opacity: 0,
            scale: 1.04,
            transition: { duration: 0.35, ease: [0.05, 0.7, 0.1, 1.0] },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none bg-[#09070f] overflow-hidden"
          style={{
            willChange: 'opacity, transform',
            transform: 'translate3d(0, 0, 0)',
          }}
        >
          {/* Ambient Multi-Hue Pulsing Radial Aura */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.35, 0.5, 0.35],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-violet-600 via-purple-500 to-indigo-600 blur-[80px] pointer-events-none"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full">
            {/* ── Composite Material 3 Expressive Shapes Representation ── */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-6 cursor-pointer"
            >
              {/* Shape 1 (Outer Layer): Rotating 12-Lobed Scallop in Radiant Violet-Indigo Gradient */}
              <motion.svg
                viewBox="0 0 300 300"
                className="absolute inset-0 w-full h-full drop-shadow-[0_16px_36px_rgba(124,58,237,0.45)]"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.02, 1],
                }}
                transition={{
                  rotate: { duration: 26, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
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
                  scale: [0.96, 1, 0.96],
                }}
                transition={{
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
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
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-20 w-[190px] h-[190px] sm:w-[210px] sm:h-[210px] rounded-[48px] bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 border border-white/35 shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_16px_36px_rgba(124,58,237,0.5)] flex flex-col items-center justify-center p-4 text-center"
              >
                {/* Subtle Inner Glass Highlight */}
                <div className="absolute top-2 inset-x-6 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-full pointer-events-none" />

                {/* Pill Tag: Welcome Back */}
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm mb-2 shadow-sm"
                >
                  <Sparkles size={11} className="text-amber-300 animate-pulse" />
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-white/95 font-tag">
                    Welcome Back
                  </span>
                </motion.div>

                {/* User's Formatted Name Inside the Shape (NO PHOTOS) */}
                <motion.h1
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.35 }}
                  className="text-lg sm:text-xl font-black tracking-tight text-white leading-tight font-sans drop-shadow-md line-clamp-2 px-1"
                >
                  {displayName}
                </motion.h1>

                {/* Status Subtitle inside the shape */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.35 }}
                  className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-purple-200/90 font-mono uppercase"
                >
                  {isFinishing ? (
                    <>
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span>Ready to Launch</span>
                    </>
                  ) : (
                    <span>LifeOS 2.0 • Pro</span>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* ── Bottom Section: Sine-Wave Progress Bar & "Making everything ready for you" ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="w-52 flex flex-col items-center"
            >
              <M3WavyProgressBar
                progress={progressVal}
                activeColor="#C084FC"
                trackColor="#4C1D95"
                height={20}
              />
              <div className="flex items-center gap-1.5 text-xs font-medium text-purple-200/90 mt-2.5 font-sans tracking-wide">
                {isFinishing ? (
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-400 inline" /> Everything is ready!
                  </span>
                ) : (
                  <span>
                    Making everything ready for you
                    <span className="inline-flex overflow-hidden w-4 text-left">
                      <span className="animate-pulse">...</span>
                    </span>
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
