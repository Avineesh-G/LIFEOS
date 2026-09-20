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

function DailyQuoteMarquee({ embedded = false }: DailyQuoteMarqueeProps) {
  const [quoteState, setQuoteState] = useState(() => getCurrentDailyQuote());
  const [copied, setCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeQuote = quoteState.quote;

  useEffect(() => {
    setIsExpanded(false);
  }, [quoteState]);

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
          : 'relative overflow-hidden rounded-[24px] p-5 sm:p-6 m3-elevation-1 border border-[var(--md-outline-variant)] transition-all duration-300 group select-none space-y-4'
      }
    >
      {!embedded && (
        <>
          {/* Subtle Ambient Radial Glows (Zero-blur radial gradients) */}
          <div 
            className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.12 }}
          />
          <div 
            className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.08 }}
          />
        </>
      )}

      {/* ── Top Header Row ── */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {/* Main Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30 text-[11px] font-tag font-bold tracking-wider uppercase shadow-xs shrink-0">
            <Sparkles size={12} className="text-[var(--accent)] animate-pulse shrink-0" />
            <span>DAILY WISDOM</span>
          </div>

          {/* Dynamic Category Pill */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-tag font-bold uppercase tracking-wider border shadow-xs shrink-0 ${currentMeta.badgeClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentMeta.dotClass}`} />
            {currentMeta.label}
          </span>
        </div>

        {/* Action Controls: Pill-row for secondary controls + Standalone Squircle for standout action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Wide Pill Housing Secondary Actions (Prev, Shuffle, Copy, Next) */}
          <div className="inline-flex items-center p-0.5 rounded-full bg-[var(--md-surface-container)] border border-[var(--md-outline-variant)]">
            <button
              type="button"
              onClick={handlePrev}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all bouncy-tap"
              title="Previous quote"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all bouncy-tap"
              title="Shuffle quote"
            >
              <Shuffle size={12} />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all bouncy-tap"
              title="Copy quote"
            >
              {copied ? <Check size={12} className="text-emerald-500 stroke-[2.5]" /> : <Copy size={12} />}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--md-on-surface-variant)] hover:text-[var(--md-on-surface)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all bouncy-tap"
              title="Next quote"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 2. Standalone Squircle Button Set Apart for Primary Action (Favorite / Save) */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            onClick={() => {
              triggerHaptic('save');
              setIsFavorited(!isFavorited);
            }}
            className={`w-8 h-8 rounded-[16px] flex items-center justify-center border transition-all ${
              isFavorited
                ? 'bg-[var(--md-primary)] text-[var(--md-on-primary)] border-[var(--md-primary)] shadow-xs'
                : 'bg-[var(--md-surface-container)] text-[var(--md-on-surface-variant)] hover:text-[var(--md-primary)] border-[var(--md-outline-variant)]'
            }`}
            title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Sparkles size={14} className={isFavorited ? 'fill-current' : ''} />
          </motion.button>
        </div>
      </div>

      {/* ── Featured Hero Quote with Clean Line-Clamp ── */}
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
            <div>
              <p className={`text-[16px] sm:text-[18px] md:text-[20px] font-heading font-bold text-[var(--md-on-surface)] tracking-tight leading-relaxed break-words ${isExpanded ? '' : 'line-clamp-3'}`}>
                <span className="text-[var(--md-primary)] font-serif mr-1">“</span>
                {activeQuote?.quote}
                <span className="text-[var(--md-primary)] font-serif ml-1">”</span>
              </p>
              {activeQuote?.quote && activeQuote.quote.length > 100 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs font-bold text-[var(--md-primary)] hover:underline mt-1 inline-flex items-center"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-tag font-bold uppercase tracking-wider text-[var(--md-on-surface-variant)] min-w-0">
                <span className="text-[var(--md-primary)] font-heading text-sm font-bold shrink-0">—</span>
                <span className="truncate max-w-[220px]">{activeQuote?.author}</span>
              </div>

              {/* Interactive Index Pill */}
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--md-surface-container)] hover:bg-[var(--md-surface-container-high)] text-[var(--md-primary)] border border-[var(--md-outline-variant)] text-[11px] font-bold tracking-wider transition-all active:scale-95 group/pill shrink-0 shadow-none"
                title="Next quote"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-primary)] animate-pulse" />
                <span className="inline-flex items-baseline font-stat font-bold text-[var(--md-primary)] leading-none">
                  <span className="font-stat select-none">#</span>
                  <span className="font-stat">{quoteState.seenIndex + 1}</span>
                </span>
                <span className="opacity-40">•</span>
                <span className="opacity-75 text-[10px] uppercase font-tag">Today</span>
                <ChevronRight size={12} className="opacity-50 group-hover/pill:opacity-100 group-hover/pill:translate-x-0.5 transition-all" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default React.memo(DailyQuoteMarquee);
