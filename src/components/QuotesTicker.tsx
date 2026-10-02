import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getDailyQuotesStream, QuoteItem } from '../data/quotes';

export default function QuotesTicker() {
  const [isPaused, setIsPaused] = useState(false);

  // Deterministically fetch today's unique pool of quotes (guaranteed to not repeat on the same date)
  const quotes: QuoteItem[] = useMemo(() => {
    return getDailyQuotesStream(new Date(), 8);
  }, []);

  // Duplicate the list to create a seamless infinite marquee loop
  const marqueeItems = useMemo(() => [...quotes, ...quotes], [quotes]);

  return (
    <div
      className="relative w-full py-1 overflow-hidden select-none"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      aria-label="Daily Inspirational Quotes Marquee"
    >
      <motion.div
        className="flex items-center gap-10 whitespace-nowrap will-change-transform cursor-default"
        animate={{
          x: isPaused ? undefined : ['0%', '-50%'],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 75,
            ease: 'linear',
          },
        }}
      >
        {marqueeItems.map((item, idx) => (
          <div
            key={`${item.id}-${idx}`}
            className="inline-flex items-center gap-2 text-xs sm:text-[13px] text-[var(--md-on-surface-variant)] tracking-tight font-medium"
          >
            <span className="text-[var(--md-primary)] font-bold text-sm leading-none opacity-80 select-none">
              “
            </span>
            <span className="text-[var(--md-on-surface)] italic leading-relaxed">
              {item.quote}
            </span>
            <span className="text-[var(--md-primary)] font-bold text-sm leading-none opacity-80 select-none">
              ”
            </span>
            <span className="text-[var(--md-on-surface-variant)]/60 select-none mx-0.5 font-bold">
              —
            </span>
            <strong className="font-extrabold text-[var(--md-primary)] tracking-wide font-heading">
              {item.author}
            </strong>

            {/* Subtle separator dot between quotes */}
            <span className="w-1 h-1 rounded-full bg-[var(--md-outline-variant)] ml-8 select-none shrink-0 opacity-80" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
