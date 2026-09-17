import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export interface InteractiveBiometricScanProps {
  isLocked?: boolean;
  size?: number;
  onScan?: () => void;
  className?: string;
}

/**
 * Usable Interactive Biometric Scan.
 * Sweeps a holographic laser beam across the security lock squircle with biometric double-click haptics.
 */
export default function InteractiveBiometricScan({
  isLocked = true,
  size = 28,
  onScan,
  className = '',
}: InteractiveBiometricScanProps) {
  const [isScanning, setIsScanning] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic('heavy');
    setIsScanning(true);

    setTimeout(() => {
      triggerHaptic('success');
      setIsScanning(false);
    }, 450);
    if (onScan) {
      onScan();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.06 }}
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
      title="Biometric Security (Tap to authenticate)"
    >
      {/* Holographic Laser Sweep Line */}
      {isScanning && (
        <motion.div
          initial={{ y: -size / 2, opacity: 0 }}
          animate={{ y: [ -size / 2, size / 2, -size / 2 ], opacity: [0, 1, 0] }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="absolute inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee] pointer-events-none z-20"
        />
      )}

      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="overflow-visible">
        {/* Outer Shield Container */}
        <path
          d="M12 22S19 18 19 12V5L12 2L5 5V12C5 18 12 22 12 22Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isLocked ? 'text-rose-500/80 dark:text-rose-400/80' : 'text-emerald-500/80 dark:text-emerald-400/80'}
        />

        {/* Shackle */}
        <motion.path
          d="M8.5 11V8.5C8.5 6.57 10.07 5 12 5C13.93 5 15.5 6.57 15.5 8.5V11"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className={isLocked ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}
          animate={{
            y: isLocked ? 0 : -2.5,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        />

        {/* Padlock Body */}
        <rect
          x="7.5"
          y="10.5"
          width="9"
          height="7.5"
          rx="2"
          className={isLocked ? 'fill-rose-500/20 stroke-rose-500' : 'fill-emerald-500/20 stroke-emerald-500'}
          strokeWidth="1.6"
        />

        {/* Keyhole */}
        <circle cx="12" cy="13.5" r="1.2" className="fill-current text-primary-light dark:text-primary-dark" />
        <line x1="12" y1="14" x2="12" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
