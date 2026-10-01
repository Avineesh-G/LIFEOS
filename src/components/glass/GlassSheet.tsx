import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

export interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function GlassSheet({
  isOpen,
  onClose,
  children,
  title,
  className = '',
}: GlassSheetProps) {
  const { isLite } = usePerformanceMode();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Dimmed backdrop with blur-in */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ 
              opacity: 1, 
              backdropFilter: isLite ? 'none' : 'blur(16px)' 
            }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            className="absolute inset-0 bg-black/60 dark:bg-black/75"
            onClick={onClose}
          />

          {/* Sheet container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`
              relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-[32px] p-6 pb-10
              border-t border-[var(--rim,rgba(255,255,255,0.15))]
              bg-[#050B0D]/95 dark:bg-[#050B0D]/95 light:bg-white/95
              shadow-2xl outline-none
              ${className}
            `}
            style={{
              backdropFilter: isLite ? 'none' : 'blur(28px) saturate(140%)',
              WebkitBackdropFilter: isLite ? 'none' : 'blur(28px) saturate(140%)',
            }}
          >
            {/* Grab handle pill */}
            <div className="mb-4 flex justify-center">
              <div className="h-1.5 w-12 rounded-full bg-white/20 dark:bg-white/20 light:bg-black/20" />
            </div>

            {title && (
              <div className="mb-4 text-center text-lg font-semibold text-primary">
                {title}
              </div>
            )}

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default GlassSheet;
