/**
 * Material 3 Expressive State Layer Ripple System
 * 
 * Implements the standard Material 3 state-layer specification:
 * An expanding circular highlight layer using --md-primary at low opacity (12%)
 * emanating directly from the touch/click origin point on interactive surfaces.
 *
 * Performance optimizations:
 * - Immediate fast-path bailout for nav bars, sheets, and [data-no-ripple] elements.
 * - Avoids calling window.getComputedStyle on tap to prevent synchronous style recalculation.
 */

let initialized = false;

export function initM3StateLayer(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  window.addEventListener(
    'pointerdown',
    (e: PointerEvent) => {
      const rawTarget = e.target as HTMLElement | null;
      if (!rawTarget) return;

      // Fast bailout: never run ripple calculations on navigation bars, sheets, dialogs, or opted-out elements
      if (
        rawTarget.closest(
          '[data-no-ripple="true"], nav, [role="navigation"], [role="dialog"], [aria-label="Main Navigation"]'
        )
      ) {
        return;
      }

      // Find closest interactive element
      const target = rawTarget.closest(
        'button, [role="button"], a, input[type="submit"], input[type="checkbox"], .card-interactive, [data-m3-interactive], .bouncy-tap, .interactive-item, label.cursor-pointer, [onclick]'
      ) as HTMLElement | null;

      if (!target || target.hasAttribute('disabled')) {
        return;
      }

      createM3Ripple(e, target);
    },
    { passive: true }
  );
}

export function createM3Ripple(e: PointerEvent | React.PointerEvent, container: HTMLElement): void {
  const rect = container.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.4;

  const ripple = document.createElement('span');
  ripple.className = 'm3-state-layer-ripple';

  // Fast inline positioning without getComputedStyle layout query
  if (!container.style.position || container.style.position === 'static') {
    container.style.position = 'relative';
  }
  if (!container.style.overflow || container.style.overflow !== 'hidden') {
    container.style.overflow = 'hidden';
  }

  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  container.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 420);
}
