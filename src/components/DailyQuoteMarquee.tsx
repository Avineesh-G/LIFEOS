import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check, 
  Shuffle
} from 'lucide-react';
import { 
  getCurrentDailyQuote, 
  advanceToNextQuote, 
  getPreviousSeenQuote, 
  shuffleToNextQuote 
} from '../utils/quoteEngine';
import { triggerHaptic } from '../utils/haptics';

interface DailyQuoteMarqueeProps {
  embedded?: boolean;
}

export default function DailyQuoteMarquee({ embedded = false }: DailyQuoteMarqueeProps) {
  const [quoteState, setQuoteState] = useState(() => getCurrentDailyQuote());
  const [copied, setCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const activeQuote = quoteState.quote;

  // Auto-advance active quote every 12 seconds unless hovered/paused
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
    triggerHaptic('light');
    setQuoteState(shuffleToNextQuote());
  }, []);

  const handleCopy = useCallback(async () => {
    if (!activeQuote) return;
    triggerHaptic('light');
    try {
      await navigator.clipboard.writeText(`"${activeQuote.quote}" — ${activeQuote.author}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [activeQuote]);

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

  const currentMeta = categoryMeta[activeQuote?.category] || {
    label: 'Wisdom',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/25',
    dotClass: 'bg-purple-500',
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={
        embedded
          ? 'relative z-10 space-y-4 select-none'
          : 'relative overflow-hidden rounded-[32px] p-5 sm:p-6 bg-white/80 dark:bg-[#16171D]/80 backdrop-blur-xl border border-purple-500/20 dark:border-purple-500/25 shadow-sm hover:shadow-md transition-all group select-none space-y-4'
      }
    >
      {!embedded && (
        <>
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-gradient-to-br from-purple-500/12 via-indigo-500/8 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500/8 to-transparent blur-3xl pointer-events-none" />
        </>
      )}

      {/* ── Top Header Row ── */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Main Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-500/30 text-[11px] font-mono font-bold tracking-wider uppercase shadow-xs">
            <Sparkles size={12} className="text-purple-600 dark:text-purple-400 animate-pulse shrink-0" />
            <span>DAILY WISDOM</span>
          </div>

          {/* Dynamic Category Pill */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider border shadow-xs ${currentMeta.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentMeta.dotClass}`} />
            {currentMeta.label}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleShuffle}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/[0.03] dark:bg-white/[0.06] hover:bg-purple-500/15 text-secondary-light dark:text-secondary-dark hover:text-purple-600 dark:hover:text-purple-300 active:scale-95 transition-all"
            title="Shuffle quote"
          >
            <Shuffle size={13} />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/[0.03] dark:bg-white/[0.06] hover:bg-purple-500/15 text-secondary-light dark:text-secondary-dark hover:text-purple-600 dark:hover:text-purple-300 active:scale-95 transition-all"
            title="Copy quote"
          >
            {copied ? <Check size={13} className="text-emerald-500 stroke-[2.5]" /> : <Copy size={13} />}
          </button>

          <div className="h-4 w-px bg-border-light dark:bg-border-dark mx-1" />

          <button
            type="button"
            onClick={handlePrev}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/[0.03] dark:bg-white/[0.06] hover:bg-purple-500/15 text-secondary-light dark:text-secondary-dark hover:text-purple-600 dark:hover:text-purple-300 active:scale-95 transition-all"
            title="Previous quote"
          >
            <ChevronLeft size={15} />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-black/[0.03] dark:bg-white/[0.06] hover:bg-purple-500/15 text-secondary-light dark:text-secondary-dark hover:text-purple-600 dark:hover:text-purple-300 active:scale-95 transition-all"
            title="Next quote"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Featured Hero Quote ── */}
      <div className="relative z-10 my-1 min-h-[64px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeQuote?.id || quoteState.seenIndex}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-3.5 gpu-composited"
          >
            <p className="text-[16px] sm:text-[18px] md:text-[20px] font-extrabold text-primary-light dark:text-primary-dark tracking-tight leading-relaxed sm:leading-relaxed">
              <span className="text-purple-500 dark:text-purple-400 font-serif mr-1">“</span>
              {activeQuote?.quote}
              <span className="text-purple-500 dark:text-purple-400 font-serif ml-1">”</span>
            </p>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-secondary-light dark:text-secondary-dark/90">
                <span className="text-purple-500 dark:text-purple-400 font-sans text-sm font-black">—</span>
                <span>{activeQuote?.author}</span>
              </div>

              {/* Interactive Index Pill */}
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 dark:bg-purple-500/15 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-mono font-bold tracking-wider transition-all active:scale-95 group/pill shrink-0 shadow-xs"
                title="Next quote"
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
    </div>
  );
}
