/**
 * Material 3 Expressive State Layer Ripple System
 * 
 * Implements the standard Material 3 state-layer specification:
 * An expanding circular highlight layer using --md-primary at low opacity (12%)
 * emanating directly from the touch/click origin point on interactive surfaces.
 */

let initialized = false;

export function initM3StateLayer(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  window.addEventListener(
    'pointerdown',
    (e: PointerEvent) => {
      // Find closest interactive element across all interactive roles
      const target = (e.target as HTMLElement)?.closest(
        'button, [role="button"], a, input[type="submit"], input[type="checkbox"], .card-interactive, [data-m3-interactive], .bouncy-tap, .interactive-item, label.cursor-pointer, .nav-item, [onclick]'
      ) as HTMLElement | null;

      if (!target || target.getAttribute('data-no-ripple') === 'true' || target.hasAttribute('disabled')) {
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

  // Ensure container clips child ripples and establishes stacking context
  const computedStyle = window.getComputedStyle(container);
  if (computedStyle.position === 'static') {
    container.style.position = 'relative';
  }
  if (computedStyle.overflow !== 'hidden') {
    container.style.overflow = 'hidden';
  }

  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;

  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;

  container.appendChild(ripple);

  // Clean up after animation finishes
  setTimeout(() => {
    ripple.remove();
  }, 420);
}
