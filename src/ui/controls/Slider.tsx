import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
  tint?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Liquid Glass Slider (as specified in Apple Liquid Glass Target):
 * Knob turns into an expanded liquid glass lens while pressed/dragged.
 */
export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  tint = '#0A84FF',
  className = '',
  disabled = false,
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const handlePointer = (clientX: number) => {
    if (!trackRef.current || disabled) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const rawVal = min + ratio * (max - min);
    const steppedVal = Math.round(rawVal / step) * step;
    const clampedVal = Math.min(max, Math.max(min, steppedVal));
    if (clampedVal !== value) {
      triggerHaptic('selection');
      onChange(clampedVal);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handlePointer(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full h-9 flex items-center select-none cursor-pointer touch-none ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Track Background Capsule */}
      <div className="relative w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
        {/* Filled Track Progress */}
        <div
          className="h-full rounded-full transition-[width] duration-75"
          style={{
            width: `${percentage}%`,
            backgroundColor: tint,
            boxShadow: `0 0 12px ${tint}80`,
          }}
        />
      </div>

      {/* Liquid Lens Knob */}
      <motion.div
        animate={{
          left: `${percentage}%`,
          scale: isDragging ? 1.18 : 1,
          width: isDragging ? 32 : 24,
          height: isDragging ? 32 : 24,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full glass-nav nav-rim-light flex items-center justify-center pointer-events-none"
        style={{
          backgroundColor: isDragging ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.95)',
          boxShadow: isDragging
            ? '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.8)'
            : '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0.5px rgba(255,255,255,0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Optical Lens Center Core when dragged */}
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: tint }}
          />
        )}
      </motion.div>
    </div>
  );
}

export default Slider;
