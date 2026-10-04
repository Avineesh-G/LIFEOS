import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toolbar, ToolbarGroup, ToolbarButton } from './Toolbar';
import { CloudCheck, CloudSlash, CloudArrowUp, Sparkle, CaretLeft } from '../tokens/icons';
import { triggerHaptic } from '../../utils/haptics';
import { navigateBack } from '../../utils/backNavigation';

export interface LargeTitleHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  syncStatus?: 'synced' | 'syncing' | 'offline';
  onSyncClick?: () => void;
  onLunaClick?: () => void;
  actions?: React.ReactNode;
  tint?: string;
  className?: string;
}

export function LargeTitleHeader({
  title,
  subtitle,
  onBack,
  syncStatus = 'synced',
  onSyncClick,
  onLunaClick,
  actions,
  tint = '#0A84FF',
  className = '',
}: LargeTitleHeaderProps) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const syncIcon =
    syncStatus === 'syncing' ? (
      <CloudArrowUp className="animate-spin" />
    ) : syncStatus === 'offline' ? (
      <CloudSlash className="text-[rgba(235,235,245,0.40)]" />
    ) : (
      <CloudCheck className="text-[#30D158]" />
    );

  const handleBackClick = () => {
    triggerHaptic('light');
    if (onBack) {
      onBack();
    } else {
      navigateBack(navigate);
    }
  };

  return (
    <header className={`sticky top-0 z-30 w-full pt-[env(safe-area-inset-top,12px)] ${className}`}>
      {/* 44px Toolbar Row */}
      <Toolbar
        leading={
          onBack ? (
            <ToolbarGroup>
              <ToolbarButton
                icon={<CaretLeft size={20} weight="bold" />}
                label="Back"
                onClick={handleBackClick}
              />
            </ToolbarGroup>
          ) : undefined
        }
        center={
          <motion.div
            animate={{
              opacity: isScrolled ? 1 : 0,
              y: isScrolled ? 0 : 6,
            }}
            transition={{ duration: 0.15 }}
            className="text-[17px] font-bold text-white tracking-tight truncate"
          >
            {title}
          </motion.div>
        }
        trailing={actions || undefined}
      />

      {/* 34pt Large Title Area */}
      <div className="px-5 pt-2 pb-3 select-none">
        {subtitle && (
          <div className="text-[13px] font-semibold text-[rgba(235,235,245,0.60)] tracking-tight mb-0.5">
            {subtitle}
          </div>
        )}
        <motion.h1
          animate={{
            opacity: isScrolled ? 0 : 1,
            y: isScrolled ? -10 : 0,
          }}
          transition={{ duration: 0.15 }}
          className="text-[34px] leading-[41px] font-bold text-white tracking-[-0.02em]"
        >
          {title}
        </motion.h1>
      </div>
    </header>
  );
}
