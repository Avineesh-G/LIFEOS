/**
 * LifeOS — CardDetailTransition utilities & state restoration
 * Manages shared element keys and carousel index persistence across route transitions.
 */

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface StackTransitionState {
  stackIndex: number;
  filterTab?: string;
  searchQuery?: string;
}

const STORAGE_PREFIX = 'lifeos_stack_nav_';

/**
 * Persists originating carousel state before opening a detail page.
 */
export function recordStackNavigation(scope: string, state: StackTransitionState) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + scope, JSON.stringify(state));
  } catch {}
}

/**
 * Retrieves and consumes persisted carousel state on return to the list.
 */
export function getRestoredStackNavigation(scope: string): StackTransitionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + scope);
    if (!raw) return null;
    return JSON.parse(raw) as StackTransitionState;
  } catch {
    return null;
  }
}

/**
 * Generates coordinated Framer Motion layoutId keys for shared element transitions.
 */
export function getStackCardLayoutId(scope: string, id: string): string {
  return `stack-card-${scope}-${id}`;
}

export function getStackHeroLayoutId(scope: string, id: string): string {
  return `stack-hero-${scope}-${id}`;
}

export function getStackTitleLayoutId(scope: string, id: string): string {
  return `stack-title-${scope}-${id}`;
}
