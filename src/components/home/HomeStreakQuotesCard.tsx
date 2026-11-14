import React, { useMemo, useState } from 'react';
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

  return (
    <div
      className="droplet-card px-4 py-3 sm:py-3.5 flex items-center gap-3.5 select-none overflow-hidden relative shadow-lg"
      style={{
        boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.22), inset 0 -1px 1px 0 rgba(255, 255, 255, 0.03), 0 8px 24px -4px rgba(0, 0, 0, 0.70)',
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

      {/* ── Right: Flowing Marquee of Quotes ── */}
      <div
        className="relative flex-1 overflow-hidden min-w-0"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
        }}
        aria-label="Daily Inspirational Quotes Stream"
      >
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
