import { App as CapApp } from '@capacitor/app';
import { triggerHaptic } from './haptics';

export type DismissibleHandler = () => boolean | void;

interface OverlayEntry {
  id: string;
  handler: DismissibleHandler;
}

// Stack of active dismissible overlays (LIFO)
const overlayStack: OverlayEntry[] = [];

/**
 * Register an active modal, sheet, or overlay into the back navigation stack.
 * Returns an unregister cleanup function.
 */
export function registerDismissible(id: string, handler: DismissibleHandler): () => void {
  const existingIdx = overlayStack.findIndex(item => item.id === id);
  if (existingIdx !== -1) {
    overlayStack.splice(existingIdx, 1);
  }

  overlayStack.push({ id, handler });

  return () => {
    unregisterDismissible(id);
  };
}

/**
 * Remove an overlay from the stack.
 */
export function unregisterDismissible(id: string) {
  const idx = overlayStack.findIndex(item => item.id === id);
  if (idx !== -1) {
    overlayStack.splice(idx, 1);
  }
}

/**
 * Attempt to dismiss the topmost active overlay.
 * Returns true if an overlay was dismissed, false if no overlays were active.
 */
export function triggerTopDismissible(): boolean {
  if (overlayStack.length === 0) return false;

  const top = overlayStack.pop();
  if (top) {
    try {
      const result = top.handler();
      if (result === false) {
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[BackNav] Error in dismiss handler:', e);
      return true;
    }
  }
  return false;
}

// ── Root Page Double-Tap Exit Guard ──

let lastBackPressedTime = 0;
let exitToastTimeout: any = null;

export function handleRootBackPress(): void {
  const now = Date.now();
  if (now - lastBackPressedTime < 2000) {
    // Second press within 2000ms: cleanly exit the app
    if (exitToastTimeout) clearTimeout(exitToastTimeout);
    removeExitToast();
    CapApp.exitApp();
  } else {
    // First press: register timestamp and display native-style pill toast
    lastBackPressedTime = now;
    triggerHaptic('light');
    showExitToast();
    if (exitToastTimeout) clearTimeout(exitToastTimeout);
    exitToastTimeout = setTimeout(() => {
      removeExitToast();
      lastBackPressedTime = 0;
    }, 2000);
  }
}

const TOAST_ID = 'lifeos-exit-guard-toast';

function showExitToast() {
  removeExitToast();
  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.innerText = 'Press back again to exit';
  toast.style.position = 'fixed';
  toast.style.bottom = 'calc(var(--sab, 0px) + 90px)';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%) translateY(10px)';
  toast.style.backgroundColor = 'rgba(25, 27, 31, 0.92)';
  toast.style.color = '#F3F4F6';
  toast.style.fontSize = '13px';
  toast.style.fontWeight = '500';
  toast.style.padding = '8px 18px';
  toast.style.borderRadius = '9999px';
  toast.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
  toast.style.zIndex = '99999';
  toast.style.pointerEvents = 'none';
  toast.style.transition = 'all 200ms cubic-bezier(0.2, 0, 0, 1)';
  toast.style.opacity = '0';
  toast.style.backdropFilter = 'blur(8px)';
  toast.style.border = '1px solid rgba(255, 255, 255, 0.08)';

  document.body.appendChild(toast);

  // Trigger smooth fade in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
}

function removeExitToast() {
  const existing = document.getElementById(TOAST_ID);
  if (existing) {
    existing.style.opacity = '0';
    existing.style.transform = 'translateX(-50%) translateY(8px)';
    setTimeout(() => {
      existing.remove();
    }, 200);
  }
}
