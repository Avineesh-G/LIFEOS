import React, { useMemo } from 'react';
import { getDailyQuotes, calculateMarqueeDuration } from '../utils/quoteEngine';
import { Sparkles } from 'lucide-react';

export default function DailyQuoteMarquee() {
  const quotes = useMemo(() => getDailyQuotes(5), []);
  const duration = useMemo(() => calculateMarqueeDuration(quotes), [quotes]);

  const categoryLabels: Record<string, string> = {
    studies: 'Studies',
    career: 'Career',
    finance: 'Finance',
    time: 'Time',
    character: 'Character',
  };

  // Single segment containing the daily quotes sequence, repeated twice for seamless 0% -> -50% translateX loop
  const renderSegment = (key: string) => (
    <div key={key} className="flex items-center shrink-0">
      {quotes.map((quote, idx) => {
        const categoryBadge = categoryLabels[quote.category] || 'Wisdom';
        return (
          <div key={`${key}-${quote.id}-${idx}`} className="flex items-center gap-4 sm:gap-6 px-4 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={11} className="text-accent shrink-0 opacity-80" />
              <span className="text-[9.5px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">
                {categoryBadge}
              </span>
            </div>

            <p className="text-[13.5px] sm:text-[15px] font-bold tracking-tight text-primary-light dark:text-primary-dark leading-none whitespace-nowrap">
              {quote.quote}
            </p>

            <span className="text-[11px] sm:text-xs font-semibold font-mono tracking-wider uppercase text-secondary-light dark:text-secondary-dark/90 whitespace-nowrap">
              — {quote.author}
            </span>

            <span className="text-accent/30 dark:text-accent/40 text-xs px-2 select-none">
              ✦
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div 
      className="w-full overflow-hidden py-1.5 -my-1 select-none pointer-events-auto cursor-default group"
      title="Tap or hold to pause"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
      }}
    >
      <div 
        className="animate-marquee items-center"
        style={{ '--marquee-duration': `${duration}s` } as React.CSSProperties}
      >
        {renderSegment('segment-1')}
        {renderSegment('segment-2')}
      </div>
    </div>
  );
}
