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
  showBack?: boolean;
}

/**
 * Pure iOS Liquid Glass Large Title Header + Unified Single Theme Color
 * Letters stay crisp pure white so text never blends or hides against dark surfaces.
 */
export function LargeTitleHeader({
  title,
  subtitle,
  onBack,
  actions,
  tint: _tint,
  className = '',
  showBack = true,
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

  const accentText = 'var(--app-accent-text, #5AC8FA)';
  const accentPrimary = 'var(--app-accent, #0A84FF)';

  return (
    <div className={`w-full select-none ${className}`}>
      {/* ── 1. Top Toolbar (Sticky, Single Row) ── */}
      <header
        className={`sticky top-0 z-30 w-full transition-colors duration-200 ${
          isScrolled ? 'shadow-[0_10px_24px_rgba(0,0,0,0.85)]' : 'bg-transparent'
        }`}
        style={{
          paddingTop: 'calc(max(var(--sat, 0px), env(safe-area-inset-top, 0px), 24px) + 8px)',
          paddingBottom: '8px',
          background: isScrolled ? 'rgba(0, 0, 0, 0.92)' : undefined,
        }}
      >
        <Toolbar
          leading={
            showBack ? (
              <ToolbarGroup>
                <ToolbarButton
                  icon={<CaretLeft size={20} weight="bold" />}
                  label="Back"
                  tint={accentText}
                  onClick={handleBackClick}
                />
              </ToolbarGroup>
            ) : (
              <div className="w-10" />
            )
          }
          center={
            <motion.div
              animate={{
                opacity: isScrolled ? 1 : 0,
                y: isScrolled ? 0 : 6,
              }}
              transition={{ duration: 0.16 }}
              className="text-inline-title text-white tracking-tight truncate text-center flex items-center gap-1.5"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: accentText }}
              />
              <span className="truncate">{title}</span>
            </motion.div>
          }
          trailing={actions || undefined}
        />
      </header>

      {/* ── 2. Large Title Block (Crisp Pure White + Delicate Theme Indicator) ── */}
      <div className="px-1.5 pt-2 pb-3">
        {subtitle && (
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: `linear-gradient(135deg, ${accentPrimary}, ${accentText})`,
              }}
            />
            <div
              className="text-sub font-medium truncate"
              style={{ color: `color-mix(in srgb, ${accentText} 45%, rgba(242, 242, 247, 0.85))` }}
            >
              {subtitle}
            </div>
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
