import React, { useMemo, useState } from 'react';
import { getDailyQuotesStream, QuoteItem } from '../data/quotes';

export default function QuotesTicker() {
  const [isPaused, setIsPaused] = useState(false);

  // Deterministically fetch today's unique pool of quotes (guaranteed not to repeat on the same date)
  const quotes: QuoteItem[] = useMemo(() => {
    return getDailyQuotesStream(new Date(), 8);
  }, []);

  // Duplicate the list to create a seamless infinite marquee loop
  const marqueeItems = useMemo(() => [...quotes, ...quotes], [quotes]);

  return (
    <div
      className="relative w-full py-1.5 overflow-hidden select-none cursor-default"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      aria-label="Daily Inspirational Quotes Marquee"
    >
      <div
        className="animate-quote-marquee flex items-center gap-12 whitespace-nowrap"
        style={{
          animationPlayState: isPaused ? 'paused' : 'running',
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
            <span className="text-[var(--md-on-surface)] italic leading-relaxed font-sans">
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

            {/* Glowing subtle divider between quote items */}
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-primary)]/40 ml-10 select-none shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
