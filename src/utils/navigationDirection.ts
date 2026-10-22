/**
 * LifeOS Navigation Direction & Spatial Flow Engine
 * Determines transition direction (forward / backward) based on:
 * 1. Path-memory sequential back navigation (hardware back, header back, edge-swipe back)
 * 2. Bottom Tab Bar spatial order: Home (0) ↔ Slot 2 (1) ↔ Slot 3 (2)
 * 3. Hierarchical Hub destinations (More drawer / Bento tiles)
 */

import { wasLastNavBack, clearLastNavBack } from './backNavigation';

export type NavigationDirection = 1 | -1;

export interface TabRouteRef {
  id: string;
  route: string;
}

/**
 * Returns tab index for peer tab navigation, or -1 if deep/hub route
 */
export function getTabIndex(path: string, pinnedTabs?: TabRouteRef[]): number {
  if (!path || path === '/' || path === '') return 0;
  const clean = path.toLowerCase();

  if (pinnedTabs && pinnedTabs.length >= 2) {
    if (clean.startsWith(pinnedTabs[0].route.toLowerCase())) return 1;
    if (clean.startsWith(pinnedTabs[1].route.toLowerCase())) return 2;
  } else {
    if (clean.startsWith('/gym')) return 1;
    if (clean.startsWith('/nutrition')) return 2;
  }

  return -1;
}

/**
 * Derives whether navigation is Forward (+1) or Backward (-1)
 */
export function getNavigationDirection(
  fromPath: string,
  toPath: string,
  pinnedTabs?: TabRouteRef[]
): NavigationDirection {
  // 1. Check if back navigation triggered this transition (hardware back, header back, edge-swipe back)
  if (wasLastNavBack()) {
    clearLastNavBack();
    return -1; // Backward: enters from left, exits to right
  }

  const fromIdx = getTabIndex(fromPath, pinnedTabs);
  const toIdx = getTabIndex(toPath, pinnedTabs);

  // 2. Peer Tab-to-Tab navigation on the bottom bar (Home ↔ Slot 2 ↔ Slot 3)
  if (fromIdx !== -1 && toIdx !== -1) {
    if (toIdx > fromIdx) return 1; // Moving right: enters from right (+x), exits to left (-x)
    if (toIdx < fromIdx) return -1; // Moving left: enters from left (-x), exits to right (+x)
  }

  // 3. Returning from ANY deeper hub screen (or subpage) to ANY bottom navigation tab
  if (toIdx !== -1 && fromIdx === -1) {
    return -1; // Backward: returning down from a hub/subpage to the bottom dock
  }

  // 4. Entering into a deeper hub screen (or subpage) from ANY bottom navigation tab
  if (fromIdx !== -1 && toIdx === -1) {
    return 1; // Forward: drilling into a hub destination from the bottom dock
  }

  // 5. Navigating from parent to sub-page (e.g. /study -> /study/timer, /gym -> /gym/workout)
  if (toPath.startsWith(fromPath) && toPath !== fromPath) {
    return 1;
  }

  // 6. Returning from sub-page to parent
  if (fromPath.startsWith(toPath) && fromPath !== toPath) {
    return -1;
  }

  // 7. Default to forward (+1) for new hub destinations
  return 1;
}
