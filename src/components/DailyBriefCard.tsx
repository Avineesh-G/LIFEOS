import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import type { AppData } from '../types';
import {
  getDailyBriefData,
  type DailyBriefData,
  type SuggestionModule,
} from '../utils/dailyBriefEngine';
import {
  AutoAwesomeIcon,
  TargetCheckIcon,
  ScheduleIcon,
  WarningAmberIcon,
  CheckCircleRoundedIcon,
  PlayArrowRoundedIcon,
  ExerciseIcon,
  ShoppingCartIcon,
  LaundryIcon,
  Book2Icon,
  ListAltCheckIcon,
} from './icons/MaterialSymbols';

interface DailyBriefCardProps {
  data: AppData;
  updateData?: (partial: Partial<AppData>) => Promise<AppData>;
}

export default function DailyBriefCard({ data }: DailyBriefCardProps) {
  const navigate = useNavigate();

  // Tick every 60 seconds to keep available window and time of day real-time accurate
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Compute deterministic daily brief state
  const brief: DailyBriefData = useMemo(() => {
    return getDailyBriefData(data, now);
  }, [data, now]);

  const handlePrimaryAction = useCallback(() => {
    triggerHaptic('medium');
    const { actionRoute, actionContext } = brief.recommendation;

    if (actionRoute === '/study/timer' && actionContext?.taskName) {
      navigate(`/study/timer?subject=${encodeURIComponent(actionContext.taskName)}`);
    } else {
      navigate(actionRoute);
    }
  }, [brief.recommendation, navigate]);

  const handleAction = useCallback((route: string) => {
    triggerHaptic('light');
    navigate(route);
  }, [navigate]);

  // Helper to get module icon
  const getModuleIcon = (module: SuggestionModule, size = 14, className = '') => {
    switch (module) {
      case 'gym':
        return <ExerciseIcon size={size} className={className} />;
      case 'shopping':
        return <ShoppingCartIcon size={size} className={className} />;
      case 'laundry':
        return <LaundryIcon size={size} className={className} />;
      case 'study':
        return <Book2Icon size={size} className={className} />;
      case 'timetable':
        return <ScheduleIcon size={size} className={className} />;
      case 'tasks':
      default:
        return <TargetCheckIcon size={size} className={className} />;
    }
  };

  return (
    <motion.div
      layout
      className="rounded-[32px] p-5 sm:p-6 bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)] m3-elevation-1 relative overflow-hidden select-none transition-all duration-300 space-y-4"
    >
      {/* ── Top Header Row: M3 Chip & Dynamic Window Status ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Daily Brief Chip with M3 Auto Awesome Sparkle */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-tag font-bold tracking-wider uppercase bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] border border-[var(--md-outline-variant)] shadow-none">
            <AutoAwesomeIcon size={13} className="text-[var(--md-primary)] shrink-0" />
            <span>{brief.timeOfDayLabel}</span>
          </span>

          {/* Time Window Pill */}
          {brief.timeWindow.availableMinutes !== null && brief.timeWindow.availableMinutes > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-tag font-bold tracking-wide bg-[var(--md-primary-container)]/70 text-[var(--md-on-primary-container)] border border-[var(--md-outline-variant)] font-stat">
              <ScheduleIcon size={12} className="shrink-0" />
              <span>{brief.timeWindow.availableMinutes}m window</span>
            </span>
          ) : brief.timeWindow.type === 'in_progress' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-tag font-bold tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>In Session</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-tag font-semibold tracking-wide bg-[var(--md-surface-container-high)] text-[var(--md-on-surface-variant)] border border-[var(--md-outline-variant)]">
              <span>Open Schedule</span>
            </span>
          )}
        </div>

        {/* Progress Micro-Signal */}
        {brief.progressSummary.hasActivity && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--md-on-surface-variant)] font-stat">
            <CheckCircleRoundedIcon size={13} className="text-emerald-500 shrink-0" />
            <span>
              {brief.progressSummary.completedCount}/{brief.progressSummary.totalCount} tasks
              {brief.progressSummary.studyMinutes > 0 ? ` · ${brief.progressSummary.studyFormatted}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Greeting & Contextual State Line ── */}
      <div className="space-y-0.5">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--md-on-surface)] leading-snug">
          {brief.greeting}
        </h2>
        <p className="text-xs sm:text-[13px] font-medium text-[var(--md-on-surface-variant)] leading-relaxed tracking-tight">
          {brief.contextSummary}
        </p>
      </div>

      {/* ── Core Recommendation Hero Surface (Material 3 Tonal Container) ── */}
      <div className="p-4 sm:p-4.5 rounded-[24px] bg-[var(--md-surface-container-high)]/90 border border-[var(--md-outline-variant)] space-y-3 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {getModuleIcon(brief.recommendation.module, 14, 'text-[var(--md-primary)] shrink-0')}
              <span className="text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--md-primary)]">
                {brief.recommendation.badgeLabel}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[var(--md-on-surface)] leading-snug break-words">
              {brief.recommendation.title}
            </h3>

            {brief.recommendation.subtitle && (
              <p className="text-xs text-[var(--md-on-surface-variant)] line-clamp-1 break-words">
                {brief.recommendation.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Supporting Metadata & Action Buttons Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[var(--md-outline-variant)]/40">
          <span className="text-[11.5px] font-medium text-[var(--md-on-surface-variant)] font-stat">
            {brief.recommendation.metadata}
          </span>

          <div className="flex items-center gap-2">
            {/* Primary Action Button */}
            <button
              onClick={handlePrimaryAction}
              className="py-2 px-4 rounded-full bg-[var(--md-primary)] text-[var(--md-on-primary)] text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-95 transition-all select-none shadow-none cursor-pointer"
            >
              {brief.recommendation.type === 'focus_task' || brief.recommendation.type === 'study_session' ? (
                <PlayArrowRoundedIcon size={14} className="fill-current shrink-0" />
              ) : brief.recommendation.type === 'workout' ? (
                <ExerciseIcon size={14} className="shrink-0" />
              ) : (
                <AutoAwesomeIcon size={13} className="shrink-0" />
              )}
              <span>{brief.recommendation.actionLabel}</span>
            </button>

            {/* Secondary Action */}
            <button
              onClick={() => handleAction(brief.recommendation.type === 'focus_task' ? '/tasks' : brief.recommendation.actionRoute)}
              className="py-2 px-3 rounded-full bg-[var(--md-surface-container)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-container-highest)] border border-[var(--md-outline-variant)] text-xs font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all select-none cursor-pointer"
            >
              <span className="text-[11px]">
                {brief.recommendation.module === 'gym' ? 'Split' : brief.recommendation.module === 'shopping' ? 'Lists' : 'Details'}
              </span>
              <ChevronRight size={13} className="text-[var(--md-on-surface-variant)] shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Smart Multi-Module Suggestions Dock (M3 Interactive Chips) ── */}
      {brief.smartSuggestions.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          <span className="text-[10px] font-tag font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)]/80 px-1">
            Suggested Next Actions
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {brief.smartSuggestions.map(s => (
              <button
                key={s.id}
                onClick={() => handleAction(s.actionRoute)}
                className="p-2 sm:p-2.5 rounded-[18px] bg-[var(--md-surface-container-low)] hover:bg-[var(--md-surface-container-high)] border border-[var(--md-outline-variant)] flex items-center gap-2 transition-all cursor-pointer bouncy-tap text-left min-w-0"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--md-surface-container-highest)] flex items-center justify-center text-[var(--md-primary)] shrink-0">
                  {getModuleIcon(s.module, 13)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-[var(--md-on-surface)] truncate leading-tight">
                    {s.label}
                  </p>
                  {s.sublabel && (
                    <p className="text-[9.5px] font-medium text-[var(--md-on-surface-variant)] truncate leading-tight mt-0.5">
                      {s.sublabel}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Urgent Attention Capsule (Rendered ONLY if genuine urgency exists) ── */}
      <AnimatePresence>
        {brief.attention && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (brief.attention?.actionRoute) {
                triggerHaptic('light');
                navigate(brief.attention.actionRoute);
              }
            }}
            className="flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-[18px] bg-[var(--md-error-container)]/25 border border-[var(--md-error-container)]/50 text-[var(--md-on-surface)] cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2 min-w-0">
              <WarningAmberIcon
                size={15}
                className={brief.attention.severity === 'urgent' ? 'text-amber-500 shrink-0' : 'text-[var(--md-primary)] shrink-0'}
              />
              <span className="text-xs font-medium truncate">
                {brief.attention.text}
              </span>
            </div>
            <ChevronRight size={13} className="text-[var(--md-on-surface-variant)] shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
