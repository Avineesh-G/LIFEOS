import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toolbar, ToolbarGroup, ToolbarButton } from './Toolbar';
import { CaretLeft } from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { navigateBack } from '../../utils/backNavigation';

export interface LargeTitleHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
  tint?: string;
  className?: string;
}

/**
 * Liquid Glass v2 Large Title Header (Section 4.1):
 * - Height 44 below safe area top inset + 8. Single row toolbar.
 * - Leading 40px glass circle with back CaretLeft.
 * - Large title sits directly under toolbar (12px gap) with subtitle above it in text-2.
 * - On scroll, title collapses into the toolbar center (17px semibold).
 */
export function LargeTitleHeader({
  title,
  subtitle,
  onBack,
  actions,
  tint = '#0A84FF',
  className = '',
}: LargeTitleHeaderProps) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollY > 28);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBackClick = () => {
    triggerHaptic('light');
    if (onBack) {
      onBack();
    } else {
      navigateBack(navigate);
    }
  };

  return (
    <div className={`w-full select-none ${className}`}>
      {/* ── 1. Top Toolbar (Sticky, Single Row) ── */}
      <header
        className="sticky top-0 z-30 w-full"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          paddingBottom: '4px',
        }}
      >
        <Toolbar
          leading={
            <ToolbarGroup>
              <ToolbarButton
                icon={<CaretLeft size={20} weight="bold" />}
                label="Back"
                onClick={handleBackClick}
              />
            </ToolbarGroup>
          }
          center={
            <motion.div
              animate={{
                opacity: isScrolled ? 1 : 0,
                y: isScrolled ? 0 : 6,
              }}
              transition={{ duration: 0.16 }}
              className="text-inline-title text-white tracking-tight truncate text-center"
            >
              {title}
            </motion.div>
          }
          trailing={actions || undefined}
        />
      </header>

      {/* ── 2. Large Title Block (12px Gap Below Toolbar) ── */}
      <div className="px-4 pt-3 pb-3">
        {subtitle && (
          <div className="text-sub font-medium text-white/70 mb-1">
            {subtitle}
          </div>
        )}
        <h1 className="text-large-title text-white tracking-[-0.02em]">
          {title}
        </h1>
      </div>
    </div>
  );
}

export default LargeTitleHeader;
