import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export interface M3CarouselProps {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  showControls?: boolean;
}

/**
 * Material 3 Expressive Peek & Snap Carousel.
 * Provides horizontal paging with peek edges and smooth physics.
 */
export function M3Carousel({
  children,
  className = '',
  showControls = false,
}: M3CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    triggerHaptic('light');
    const scrollAmount = containerRef.current.clientWidth * 0.75;
    containerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`relative group ${className}`}>
      {showControls && (
        <>
          <button
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full m3-elevation-2 bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full m3-elevation-2 bg-[var(--md-surface-container-high)] text-[var(--md-on-surface)] items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory py-2 px-1 scroll-smooth"
        style={{ touchAction: 'pan-x pan-y' }}
      >
        {children}
      </div>
    </div>
  );
}

export default M3Carousel;
