import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { M3_CLOVER_PATH, M3_SCALLOP_PATH } from './m3/M3Shapes';
import M3WavyProgressBar from './M3WavyProgressBar';

interface M3StartupGreetingProps {
  username: string;
  photoURL?: string | null;
  isAppReady: boolean;
  onComplete: () => void;
}

/**
 * Material 3 Expressive Greeting Screen
 * Greets the user with "Welcome back, [Gmail Username]" alongside live M3 animations
 * while the entire application and data layers prepare for instant usage in the background.
 */
export default function M3StartupGreeting({
  username,
  photoURL,
  isAppReady,
  onComplete,
}: M3StartupGreetingProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Keep visible for at least 1.4s so the user can enjoy the greeting and live M3 animations
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1400);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Once minimum greeting animation time is done AND background app is ready, gracefully exit
    if (minTimeElapsed && isAppReady) {
      const exitTimer = setTimeout(() => {
        setIsVisible(false);
      }, 150);
      return () => clearTimeout(exitTimer);
    }
  }, [minTimeElapsed, isAppReady]);

  const cleanName = username || 'Friend';
  const initial = cleanName.charAt(0).toUpperCase();

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          key="m3-startup-greeting"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: 'blur(10px)',
            transition: { duration: 0.35, ease: [0.2, 0, 0, 1] },
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none bg-[var(--md-surface)] overflow-hidden"
          style={{
            willChange: 'opacity, transform, filter',
            transform: 'translateZ(0)',
          }}
        >
          {/* Subtle Ambient Radial Lighting for 120 FPS GPU depth */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.12, 0.22, 0.12],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-80 h-80 rounded-full bg-gradient-to-tr from-[var(--md-primary)] to-[var(--md-tertiary)] blur-3xl pointer-events-none"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
            {/* Live M3 Expressive Morphing Geometric Shape */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-6">
              {/* Spinning/pulsing background M3 8-Lobed Scallop */}
              <motion.svg
                viewBox="0 0 48 48"
                className="absolute inset-0 w-full h-full text-[var(--md-primary)]/15 dark:text-[var(--md-primary)]/20"
                fill="currentColor"
                animate={{
                  rotate: [0, 90, 180, 270, 360],
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  rotate: { duration: 14, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <path d={M3_SCALLOP_PATH} />
              </motion.svg>

              {/* Counter-rotating 4-Lobed Clover */}
              <motion.svg
                viewBox="0 0 48 48"
                className="absolute inset-2 w-20 h-20 sm:w-24 sm:h-24 text-[var(--md-primary)]/25 dark:text-[var(--md-primary)]/35"
                fill="currentColor"
                animate={{
                  rotate: [360, 270, 180, 90, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <path d={M3_CLOVER_PATH} />
              </motion.svg>

              {/* User Avatar / Monogram Center */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                className="relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-[22px] bg-gradient-to-br from-[var(--md-primary)] to-[var(--md-tertiary)] flex items-center justify-center shadow-lg border-2 border-white/20 overflow-hidden"
              >
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={cleanName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-wide">
                    {initial}
                  </span>
                )}
              </motion.div>
            </div>

            {/* Staggered Typography Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-1.5"
            >
              <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[var(--md-primary)] font-tag">
                Welcome back,
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--md-on-surface)]">
                {cleanName}
              </h1>
            </motion.div>

            {/* Live M3 Wavy Indicator & Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.28, duration: 0.3 }}
              className="mt-6 w-44"
            >
              <M3WavyProgressBar
                progress={minTimeElapsed && isAppReady ? 100 : 70}
                activeColor="#C084FC"
                trackColor="#581C87"
                height={18}
              />
              <p className="text-[11px] font-medium text-[var(--md-on-surface-variant)] mt-2 font-mono">
                {minTimeElapsed && isAppReady ? 'Ready' : 'Preparing LifeOS...'}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
