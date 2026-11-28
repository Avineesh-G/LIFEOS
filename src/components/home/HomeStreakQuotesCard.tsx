import React, { useMemo, useState, useEffect } from 'react';
import { Quotes } from '../../ui/tokens/icons';
import type { QuoteItem } from '../../data/quotes';

interface HomeStreakQuotesCardProps {}

const FALLBACK_QUOTE: QuoteItem = {
  id: 0,
  quote: 'Small disciplined actions compounded daily build an extraordinary life.',
  author: 'LifeOS',
  category: 'life',
};

let cachedQuotesStream: QuoteItem[] | null = null;

const HomeStreakQuotesCard = React.memo(function HomeStreakQuotesCard(_props: HomeStreakQuotesCardProps = {}) {
  const [quotes, setQuotes] = useState<QuoteItem[]>(() => cachedQuotesStream || [FALLBACK_QUOTE]);
  const [isPaused, setIsPaused] = useState(false);

  // Lazy-load the 197KB quotes dataset asynchronously after first paint so Home cold-start stays instant
  useEffect(() => {
    if (cachedQuotesStream) return;
    let cancelled = false;
    import('../../data/quotes')
      .then((mod) => {
        const stream = mod.getDailyQuotesStream(new Date(), 10);
        cachedQuotesStream = stream;
        if (!cancelled) {
          React.startTransition(() => {
            setQuotes(stream);
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Pause continuous GPU marquee when modal sheets are open or browser tab is backgrounded
  useEffect(() => {
    const onSubOpen = () => setIsPaused(true);
    const onSubClose = () => setIsPaused(false);
    const onVis = () => setIsPaused(document.hidden);
    window.addEventListener('lifeos-subinterface-open', onSubOpen);
    window.addEventListener('lifeos-subinterface-close', onSubClose);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('lifeos-subinterface-open', onSubOpen);
      window.removeEventListener('lifeos-subinterface-close', onSubClose);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const marqueeItems = useMemo(() => [...quotes, ...quotes], [quotes]);

  return (
    <div
      className="droplet-card px-4 py-3 sm:py-3.5 flex items-center gap-3 select-none overflow-hidden relative shadow-lg"
      style={{
        boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.75)',
      }}
    >
      {/* ── Left: Single Theme Inspirational Quotes Emblem ── */}
      <div
        className="shrink-0 flex items-center justify-center w-7 h-7 rounded-xl shadow-sm select-none"
        style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--app-accent-text, #64D2FF) 18%, #1C1C22) 0%, color-mix(in srgb, var(--app-accent, #0A84FF) 8%, #151519) 100%)',
          color: 'var(--app-accent-text, #64D2FF)',
        }}
      >
        <Quotes size={16} weight="duotone" />
      </div>

      {/* ── Clean Specular Vertical Divider ── */}
      <div className="w-[1px] h-5 bg-gradient-to-b from-white/20 via-white/10 to-transparent shrink-0 select-none" />

      {/* ── Right: Flowing Marquee of Quotes (High-Legibility Single-Hue Theme Finish) ── */}
      <div
        className="relative flex-1 overflow-hidden min-w-0 pointer-events-none"
        aria-label="Daily Inspirational Quotes Stream"
      >
        {/* Lightweight hardware-accelerated edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-[#141416] to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-[#141416] to-transparent pointer-events-none z-10" />

        <div
          className="animate-quote-marquee flex items-center gap-12 whitespace-nowrap"
          style={isPaused ? { animationPlayState: 'paused' } : undefined}
        >
          {marqueeItems.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="inline-flex items-center gap-2 text-[13px] tracking-normal font-medium leading-none"
            >
              <span
                className="font-semibold tracking-normal"
                style={{ color: 'color-mix(in srgb, var(--app-accent-text, #64D2FF) 55%, #FFFFFF)' }}
              >
                "{item.quote}"
              </span>
              <span className="text-white/40 select-none mx-0.5 font-bold">
                —
              </span>
              <strong className="font-bold text-white/90 tracking-wide text-[12px] uppercase">
                {item.author}
              </strong>

              {/* Subtle glowing spacer dot matching theme accent */}
              <span
                className="w-1.5 h-1.5 rounded-full ml-10 select-none shrink-0"
                style={{
                  backgroundColor: 'var(--app-accent-text, #64D2FF)',
                  opacity: 0.75,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default HomeStreakQuotesCard;
