import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export interface InteractiveClockProps {
  isRunning?: boolean;
  progressPercent?: number; // 0 to 100
  size?: number;
  onClick?: () => void;
  className?: string;
  showAura?: boolean;
}

/**
 * Usable Interactive Chrono-Clock.
 * Hands rotate smoothly when running, with spring snap-to-rest on pause and tactile click on tap.
 */
export default function InteractiveClock({
  isRunning = false,
  progressPercent = 0,
  size = 28,
  onClick,
  className = '',
  showAura = true,
}: InteractiveClockProps) {
  const [activeRotation, setActiveRotation] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setActiveRotation(prev => (prev + 6) % 360);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic(isRunning ? 'light' : 'medium');
    if (onClick) {
      onClick();
    }
  };

  const strokeWidth = Math.max(1.8, size * 0.08);
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none focus:outline-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={isRunning ? 'Deep Work running (Tap to interact)' : 'Deep Work paused (Tap to interact)'}
    >
      {/* Running Ambient Glow Aura */}
      {showAura && isRunning && (
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-indigo-500/25 blur-md pointer-events-none"
        />
      )}

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative z-10 overflow-visible">
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-black/10 dark:text-white/10"
        />

        {/* Progress Arc */}
        {progressPercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth + 0.5}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-indigo-500 dark:text-indigo-400 transition-[stroke-dashoffset] duration-500"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        )}

        {/* Hour Marks (4 subtle cardinal ticks) */}
        {[0, 90, 180, 270].map(deg => (
          <line
            key={deg}
            x1={center}
            y1={center - radius + strokeWidth}
            x2={center}
            y2={center - radius + strokeWidth * 2.2}
            stroke="currentColor"
            strokeWidth={strokeWidth * 0.75}
            strokeLinecap="round"
            className="text-black/30 dark:text-white/30"
            style={{ transform: `rotate(${deg}deg)`, transformOrigin: '50% 50%' }}
          />
        ))}

        {/* Hour Hand (Short & thicker) */}
        <motion.line
          x1={center}
          y1={center}
          x2={center}
          y2={center - radius * 0.5}
          stroke="currentColor"
          strokeWidth={strokeWidth * 1.1}
          strokeLinecap="round"
          className="text-primary-light dark:text-primary-dark"
          animate={{ rotate: isRunning ? activeRotation / 12 : 45 }}
          transition={{ ease: 'linear' }}
          style={{ transformOrigin: '50% 50%' }}
        />

        {/* Minute Hand (Longer) */}
        <motion.line
          x1={center}
          y1={center}
          x2={center}
          y2={center - radius * 0.75}
          stroke="currentColor"
          strokeWidth={strokeWidth * 0.9}
          strokeLinecap="round"
          className="text-indigo-600 dark:text-indigo-400"
          animate={{ rotate: isRunning ? activeRotation : 120 }}
          transition={{ ease: 'linear' }}
          style={{ transformOrigin: '50% 50%' }}
        />

        {/* Center Pivot Jewel */}
        <circle
          cx={center}
          cy={center}
          r={strokeWidth * 1.2}
          className="fill-indigo-500 dark:fill-indigo-400"
        />
      </svg>
    </motion.div>
  );
}
