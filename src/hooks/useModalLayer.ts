import { useEffect, useRef } from 'react';

/**
 * Central Modal Layer & Frozen Background Manager (LifeOS Prompt L)
 * 
 * Prevents background scroll, gestures, and touches whenever any popup,
 * sheet, dialog, or drawer is active.
 * 
 * Features:
 * - Reference counted stack for nested modals.
 * - Preserves exact background scrollTop (no jump to top).
 * - Locks overflow, touch-action, and overscroll-behavior.
 * - Sets inert / aria-hidden on background elements while keeping header chat button accessible.
 * - Leak-proof cleanup on unmount, close, or route navigation.
 */

interface ModalLayerOptions {
  id?: string;
  allowHeaderChat?: boolean;
}

// Global state for layer stack
let activeLayers: string[] = [];
let savedScrollY = 0;

function lockBackground(allowHeaderChat = false) {
  if (typeof document === 'undefined') return;

  if (activeLayers.length === 1) {
    // First modal opened: capture current scroll
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;

    // Freeze html & body
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.overscrollBehavior = 'none';

    // Mark background as frozen in DOM for CSS rules
    document.body.setAttribute('data-bg-frozen', 'true');

    // Mark main content inert
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.setAttribute('inert', '');
      mainEl.setAttribute('aria-hidden', 'true');
    }

    // Mark bottom nav inert
    const navEl = document.querySelector('.bottom-nav-wrapper');
    if (navEl) {
      navEl.setAttribute('inert', '');
      navEl.setAttribute('aria-hidden', 'true');
    }

    // Header buttons (except chat if permitted)
    const headerControls = document.querySelectorAll('header [data-header-action]');
    headerControls.forEach((el) => {
      const isChat = el.getAttribute('data-header-action') === 'chat';
      if (!isChat || !allowHeaderChat) {
        el.setAttribute('inert', '');
      }
    });
  }
}

function unlockBackground() {
  if (typeof document === 'undefined') return;

  if (activeLayers.length === 0) {
    // Release locks
    document.documentElement.style.overflow = '';
    document.documentElement.style.touchAction = '';
    document.documentElement.style.overscrollBehavior = '';
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    document.body.style.overscrollBehavior = '';

    document.body.removeAttribute('data-bg-frozen');

    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.removeAttribute('inert');
      mainEl.removeAttribute('aria-hidden');
    }

    const navEl = document.querySelector('.bottom-nav-wrapper');
    if (navEl) {
      navEl.removeAttribute('inert');
      navEl.removeAttribute('aria-hidden');
    }

    const headerControls = document.querySelectorAll('header [data-header-action]');
    headerControls.forEach((el) => {
      el.removeAttribute('inert');
    });

    // Restore scroll position without animation
    if (savedScrollY > 0) {
      window.scrollTo({ top: savedScrollY, behavior: 'instant' as any });
    }
  }
}

export function registerLayer(id: string, options?: ModalLayerOptions) {
  if (!activeLayers.includes(id)) {
    activeLayers.push(id);
    lockBackground(options?.allowHeaderChat);
  }
}

export function unregisterLayer(id: string) {
  activeLayers = activeLayers.filter((layerId) => layerId !== id);
  unlockBackground();
}

/**
 * Hook to automatically register and manage a modal layer's lifetime
 */
export function useModalLayer(isOpen: boolean, options?: ModalLayerOptions) {
  const layerIdRef = useRef<string>(options?.id || `layer-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    const id = layerIdRef.current;
    if (isOpen) {
      registerLayer(id, options);
    } else {
      unregisterLayer(id);
    }

    return () => {
      unregisterLayer(id);
    };
  }, [isOpen, options?.allowHeaderChat]);
}

/**
 * Utility to inspect layer count (for dev diagnostics)
 */
export function getActiveLayerCount(): number {
  return activeLayers.length;
}
