import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateBack, canGoBack } from '../utils/backNavigation';
import { triggerHaptic } from '../utils/haptics';

/**
 * Path Memory Edge-Swipe Back Hook (Section 7):
 * Detects touch start from the left 28px screen edge and executes navigateBack when dragged > 60px right.
 */
export function useEdgeSwipeBack(enabled = true) {
  const navigate = useNavigate();
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isSwipingRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Only trigger if starting near left edge (<= 28px)
      if (touch.clientX <= 28) {
        startXRef.current = touch.clientX;
        startYRef.current = touch.clientY;
        isSwipingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwipingRef.current || startXRef.current === null || startYRef.current === null) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = Math.abs(touch.clientY - startYRef.current);

      // Cancel if swiping predominantly vertically
      if (deltaY > deltaX && deltaY > 30) {
        isSwipingRef.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwipingRef.current || startXRef.current === null) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startXRef.current;

      if (deltaX > 60 && canGoBack()) {
        triggerHaptic('light');
        navigateBack(navigate);
      }

      startXRef.current = null;
      startYRef.current = null;
      isSwipingRef.current = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, navigate]);
}

export default useEdgeSwipeBack;
