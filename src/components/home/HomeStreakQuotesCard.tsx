import React, { useMemo, useState, useEffect } from 'react';
import { Badge } from '../../ui';
import { getDailyQuotesStream, QuoteItem } from '../../data/quotes';

interface HomeStreakQuotesCardProps {
  streakDays: number;
}

// Map quote categories to crisp, vibrant luminescent colors (words have high-contrast color, category name is never mentioned)
const CATEGORY_TINTS: Record<string, string> = {
  money: '#34D399',         // Vibrant Emerald Mint (Finance & Wealth)
  study: '#38BDF8',         // Crisp Sky Blue (Knowledge & Learning)
  character: '#FBBF24',     // Warm Amber Gold (Discipline & Mindset)
  life: '#C084FC',          // Amethyst Purple (Wisdom & Purpose)
  social: '#6EE7B7',        // Light Aqua Green (Health & Relationships)
  communication: '#FB7185', // Coral Rose (Voice & Motivation)
};

export default function HomeStreakQuotesCard({ streakDays }: HomeStreakQuotesCardProps) {
  const [isPaused, setIsPaused] = useState(false);

  // Deterministically fetch today's unique pool of quotes (guaranteed not to repeat on the same date)
  const quotes: QuoteItem[] = useMemo(() => {
    return getDailyQuotesStream(new Date(), 10);
  }, []);

  // Duplicate the list for seamless infinite loop marquee animation
  const marqueeItems = useMemo(() => [...quotes, ...quotes], [quotes]);

  // Pause marquee during active scroll to eliminate GPU composite overhead
  useEffect(() => {
    let scrollTimer: any = null;
    const handleScroll = () => {
      setIsPaused(true);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        setIsPaused(false);
      }, 180);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  return (
    <div
      className="droplet-card px-4 py-3 sm:py-3.5 flex items-center gap-3.5 select-none overflow-hidden relative shadow-lg"
      style={{
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.75)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* ── Left: Streak Badge ── */}
      <div className="shrink-0">
        <Badge count={streakDays} label="Day Streak" points={12} color="#FF7A45" />
      </div>

      {/* ── Clean Specular Vertical Divider ── */}
      <div className="w-[1px] h-6 bg-gradient-to-b from-white/20 via-white/10 to-transparent shrink-0 select-none" />

      {/* ── Right: Flowing Marquee of Quotes (GPU-Friendly Edge Fades, Zero mask-image Overhead) ── */}
      <div
        className="relative flex-1 overflow-hidden min-w-0"
        aria-label="Daily Inspirational Quotes Stream"
      >
        {/* Lightweight hardware-accelerated edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#141416] to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-[#141416] to-transparent pointer-events-none z-10" />

        <div
          className="animate-quote-marquee flex items-center gap-12 whitespace-nowrap"
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {marqueeItems.map((item, idx) => {
            const tint = CATEGORY_TINTS[item.category] || '#FBBF24';
            return (
              <div
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-2 text-[13px] tracking-normal font-medium leading-none"
              >
                <span
                  className="font-semibold tracking-normal"
                  style={{
                    color: tint,
                    textShadow: `0 0 12px ${tint}33`,
                  }}
                >
                  "{item.quote}"
                </span>
                <span className="text-white/35 select-none mx-0.5 font-bold">
                  —
                </span>
                <strong className="font-extrabold text-white tracking-wide text-[12.5px] uppercase">
                  {item.author}
                </strong>

                {/* Specular glowing spacer dot between quotes */}
                <span
                  className="w-1.5 h-1.5 rounded-full ml-10 select-none shrink-0"
                  style={{
                    backgroundColor: tint,
                    boxShadow: `0 0 8px ${tint}`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
