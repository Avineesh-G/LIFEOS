import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Shuffle, 
  GraduationCap, 
  Briefcase, 
  Coins, 
  Clock, 
  Shield, 
  Target, 
  Zap, 
  ChevronDown,
  LucideIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  getCurrentDailyQuote, 
  advanceToNextQuote, 
  getPreviousSeenQuote, 
  shuffleToNextQuote, 
  PillarType 
} from '../utils/quoteEngine';
import { triggerHaptic } from '../utils/haptics';

interface DailyQuoteMarqueeProps {
  embedded?: boolean;
}

export default function DailyQuoteMarquee({ embedded = false }: DailyQuoteMarqueeProps) {
  const [quoteState, setQuoteState] = useState(() => getCurrentDailyQuote());
  const [copied, setCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showActionPrompt, setShowActionPrompt] = useState(false);

  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [committedTheme, setCommittedTheme] = useState<string | null>(() => {
    return localStorage.getItem('lifeos_committed_theme_' + todayKey);
  });

  const activeQuote = quoteState.quote;

  // Auto-advance active quote every 12 seconds unless paused
  // Guaranteed: Automatically advances to next unseen quote for today without repeating!
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setQuoteState(advanceToNextQuote());
    }, 12000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNext = useCallback(() => {
    triggerHaptic('light');
    setQuoteState(advanceToNextQuote());
  }, []);

  const handlePrev = useCallback(() => {
    triggerHaptic('light');
    setQuoteState((prev) => getPreviousSeenQuote(prev.seenIndex));
  }, []);

  const handleShuffle = useCallback(() => {
    triggerHaptic('medium');
    setQuoteState(shuffleToNextQuote());
  }, []);

  const handleCopy = useCallback(async () => {
    if (!activeQuote) return;
    triggerHaptic('save');
    try {
      await navigator.clipboard.writeText(`"${activeQuote.quote}" — ${activeQuote.author}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [activeQuote]);

  const handlePillarSelect = (categoryKey: PillarType) => {
    triggerHaptic('light');
    setQuoteState(advanceToNextQuote(categoryKey));
  };

  const isCommitted = committedTheme === activeQuote?.category;

  const handleToggleCommit = () => {
    if (isCommitted) {
      triggerHaptic('light');
      localStorage.removeItem('lifeos_committed_theme_' + todayKey);
      setCommittedTheme(null);
    } else {
      triggerHaptic('save');
      localStorage.setItem('lifeos_committed_theme_' + todayKey, activeQuote.category);
      setCommittedTheme(activeQuote.category);
    }
  };

  const categoryMeta: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
    studies: {
      label: 'Studies',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
      dotClass: 'bg-emerald-500',
    },
    career: {
      label: 'Career',
      badgeClass: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25',
      dotClass: 'bg-indigo-500',
    },
    finance: {
      label: 'Finance',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
      dotClass: 'bg-amber-500',
    },
    time: {
      label: 'Time Mastery',
      badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/25',
      dotClass: 'bg-purple-500',
    },
    character: {
      label: 'Character',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25',
      dotClass: 'bg-rose-500',
    },
  };

  const pillars: { key: PillarType; label: string; icon: LucideIcon; color: string; activeClass: string }[] = [
    { key: 'studies', label: 'Studies', icon: GraduationCap, color: 'text-emerald-500', activeClass: 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 border-emerald-500' },
    { key: 'career', label: 'Career', icon: Briefcase, color: 'text-indigo-500', activeClass: 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/25 border-indigo-500' },
    { key: 'finance', label: 'Finance', icon: Coins, color: 'text-amber-500', activeClass: 'bg-amber-500 text-white shadow-sm shadow-amber-500/25 border-amber-500' },
    { key: 'time', label: 'Time', icon: Clock, color: 'text-purple-500', activeClass: 'bg-purple-500 text-white shadow-sm shadow-purple-500/25 border-purple-500' },
    { key: 'character', label: 'Character', icon: Shield, color: 'text-rose-500', activeClass: 'bg-rose-500 text-white shadow-sm shadow-rose-500/25 border-rose-500' },
  ];

  const actionMissions: Record<string, { title: string; challenge: string }> = {
    studies: {
      title: 'Deep Focus Mission',
      challenge: 'Dedicate 60–90 minutes of undistracted immersion to your hardest subject today.',
    },
    career: {
      title: 'High-Leverage Mission',
      challenge: 'Identify the #1 highest-leverage task that drives real outcomes and tackle it first.',
    },
    finance: {
      title: 'Mindful Spending Mission',
      challenge: 'Delay any impulse purchase by 24 hours and log every single expense today.',
    },
    time: {
      title: 'Time Mastery Mission',
      challenge: 'Ruthlessly guard your peak morning hours against passive scrolling and trivial distractions.',
    },
    character: {
      title: 'Stoic Composure Mission',
      challenge: 'When confronted with unexpected friction or delay today, respond with calm poise.',
    },
  };

  const currentMeta = categoryMeta[activeQuote?.category] || {
    label: 'Wisdom',
    badgeClass: 'bg-accent/15 text-accent border-accent/25',
    dotClass: 'bg-accent',
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={
        embedded
          ? 'relative z-10 space-y-3.5 select-none'
          : 'relative overflow-hidden rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 bg-gradient-to-br from-white via-neutral-50/80 to-purple-50/40 dark:from-[#1A1C23] dark:via-[#16171D] dark:to-[#131218] border border-purple-500/20 dark:border-purple-500/25 shadow-sm hover:shadow-md transition-all group select-none'
      }
    >
      {!embedded && (
        <>
          {/* Decorative Radial Glows & Elegant Watermark */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-transparent blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-gradient-to-tr from-accent/10 to-transparent blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-1 text-purple-900/[0.04] dark:text-purple-300/[0.04] select-none pointer-events-none font-serif text-8xl leading-none">
            “
          </div>
        </>
      )}

      {/* ── Top Header Row ── */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3.5 sm:mb-4">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Main Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-500/30 text-[10.5px] sm:text-xs font-mono font-bold tracking-wider uppercase">
            <Sparkles size={12} className="text-purple-600 dark:text-purple-400 animate-pulse shrink-0" />
            <span>DAILY WISDOM</span>
          </div>

          {/* Dynamic Category Pill */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider border ${currentMeta.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentMeta.dotClass}`} />
            {currentMeta.label}
          </span>

          {/* Non-repeating daily counter */}
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/5 border border-purple-500/15">
            Auto-rotating • No Repeats
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShuffle}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-black/[0.03] dark:bg-white/[0.05] hover:bg-purple-500/15 text-secondary-light dark:text-secondary-dark hover:text-purple-600 dark:hover:text-purple-300 active:scale-95 transition-all"
            title="Shuffle to next unique quote"
          >
            <Shuffle size={13} />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-black/[0.03] dark:bg-white/[0.05] hover:bg-purple-500/15 text-secondary-light dark:text-secondary-dark hover:text-purple-600 dark:hover:text-purple-300 active:scale-95 transition-all"
            title="Copy quote"
          >
            {copied ? <Check size={13} className="text-emerald-500 stroke-[2.5]" /> : <Copy size={13} />}
          </button>

          <div className="h-4 w-px bg-border-light dark:bg-border-dark mx-0.5" />

          <button
            type="button"
            onClick={handlePrev}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-black/[0.03] dark:bg-white/[0.05] hover:bg-purple-500/15 text-secondary-light dark:text-secondary-dark hover:text-purple-600 dark:hover:text-purple-300 active:scale-95 transition-all"
            title="Previous viewed quote"
          >
            <ChevronLeft size={15} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-black/[0.03] dark:bg-white/[0.05] hover:bg-purple-500/15 text-secondary-light dark:text-secondary-dark hover:text-purple-600 dark:hover:text-purple-300 active:scale-95 transition-all"
            title="Next unique quote"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Featured Hero Quote (The Main Attraction) ── */}
      <div className="relative z-10 my-1 sm:my-2 min-h-[82px] sm:min-h-[92px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeQuote?.id || quoteState.seenIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="space-y-2.5 gpu-composited"
          >
            <p className="text-[16px] sm:text-[18px] md:text-[20px] font-extrabold text-primary-light dark:text-primary-dark tracking-tight leading-relaxed sm:leading-snug">
              <span className="text-purple-500 dark:text-purple-400 font-serif mr-1">“</span>
              {activeQuote?.quote}
              <span className="text-purple-500 dark:text-purple-400 font-serif ml-1">”</span>
            </p>

            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-mono font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark/90">
                <span className="text-purple-500 dark:text-purple-400 font-sans text-sm font-black">—</span>
                <span>{activeQuote?.author}</span>
              </div>

              {/* Interactive Principle Index Pill */}
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/15 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-mono font-bold tracking-wider transition-all active:scale-95 group/pill shrink-0"
                title="Next unique quote"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span>#{quoteState.seenIndex + 1}</span>
                <span className="opacity-40">•</span>
                <span className="opacity-75 text-[10px] uppercase">Today</span>
                <ChevronRight size={12} className="opacity-50 group-hover/pill:opacity-100 group-hover/pill:translate-x-0.5 transition-all" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Interactive Life Pillars Dock & Daily Focus Commitment (Replaces STREAM Marquee) ── */}
      <div className="relative z-10 mt-3 pt-3 border-t border-purple-500/15 dark:border-purple-500/20 space-y-2.5">
        {/* 5-Pillar Interactive Strip - 100% Mobile & APK Visible */}
        <div className="grid grid-cols-5 gap-1 sm:gap-1.5 w-full">
          {pillars.map((pillar) => {
            const isActive = activeQuote?.category === pillar.key;
            const IconComponent = pillar.icon;
            return (
              <button
                key={pillar.key}
                type="button"
                onClick={() => handlePillarSelect(pillar.key)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 px-1 sm:px-2 rounded-xl text-[9.5px] sm:text-[11px] font-mono font-bold tracking-tight transition-all active:scale-95 border ${
                  isActive
                    ? pillar.activeClass
                    : 'bg-black/[0.03] dark:bg-white/[0.04] text-secondary-light dark:text-secondary-dark border-transparent hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                }`}
                title={`Explore ${pillar.label} wisdom`}
              >
                <IconComponent size={12} className={isActive ? 'text-white' : pillar.color} />
                <span className="truncate">{pillar.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls: Commit Focus & Action Mission */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleToggleCommit}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 shadow-xs ${
              isCommitted
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-500/25'
            }`}
          >
            {isCommitted ? (
              <>
                <Check size={13} className="stroke-[3]" />
                <span>Focus Theme Locked</span>
              </>
            ) : (
              <>
                <Target size={13} className="text-purple-600 dark:text-purple-400" />
                <span>Commit as Today's Focus</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowActionPrompt(!showActionPrompt);
            }}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 border ${
              showActionPrompt
                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40'
                : 'bg-black/[0.03] dark:bg-white/[0.05] hover:bg-amber-500/10 text-secondary-light dark:text-secondary-dark hover:text-amber-600 dark:hover:text-amber-300 border-border-light/70 dark:border-border-dark/70'
            }`}
          >
            <Zap size={12} className={showActionPrompt ? 'text-amber-500 fill-amber-500' : 'text-amber-500'} />
            <span>Action Mission</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${showActionPrompt ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expandable Action Mission Drawer */}
        <AnimatePresence>
          {showActionPrompt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 rounded-2xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-500/25 mt-1 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <Zap size={11} className="text-amber-500 fill-amber-500" />
                  <span>{actionMissions[activeQuote?.category]?.title || 'Daily Action Mission'}</span>
                </div>
                <p className="text-xs sm:text-[13px] font-medium text-amber-900/90 dark:text-amber-200 leading-snug">
                  {actionMissions[activeQuote?.category]?.challenge}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
