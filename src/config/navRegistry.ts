import { LucideIcon } from 'lucide-react';
import {
  DESTINATIONS,
  DestinationId,
  HubDestination,
  getDestinationById,
} from './hubDestinations';

export type { DestinationId };
export type NavModuleId = DestinationId;

export interface NavConfig {
  version: 1;
  pinned: [DestinationId, DestinationId]; // Slot 1, Slot 2
}

export const DEFAULT_NAV: NavConfig = {
  version: 1,
  pinned: ['gym', 'nutrition'],
};

export const DEFAULT_NAV_CONFIG = DEFAULT_NAV;

const VALID_DESTINATION_SET = new Set<string>(DESTINATIONS.map(d => d.id));

/**
 * Validates and self-heals raw navigation config from localStorage or Firestore.
 * Handles migration from legacy `{ slot1, slot2 }` to `{ version: 1, pinned: [slot1, slot2] }`.
 * Ensures exactly 2 distinct valid destinations (never 'home', never duplicate).
 */
export function validateNavConfig(raw: any): NavConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_NAV;
  }

  // 1. Check for legacy format: { slot1, slot2 }
  if (
    typeof raw.slot1 === 'string' &&
    typeof raw.slot2 === 'string' &&
    VALID_DESTINATION_SET.has(raw.slot1) &&
    VALID_DESTINATION_SET.has(raw.slot2) &&
    raw.slot1 !== raw.slot2 &&
    raw.slot1 !== 'home' &&
    raw.slot2 !== 'home'
  ) {
    return {
      version: 1,
      pinned: [raw.slot1 as DestinationId, raw.slot2 as DestinationId],
    };
  }

  // 2. Check for current format: { version: 1, pinned: [id1, id2] } or { pinned: [id1, id2] }
  if (Array.isArray(raw.pinned) && raw.pinned.length === 2) {
    const [p1, p2] = raw.pinned;
    if (
      typeof p1 === 'string' &&
      typeof p2 === 'string' &&
      VALID_DESTINATION_SET.has(p1) &&
      VALID_DESTINATION_SET.has(p2) &&
      p1 !== p2 &&
      p1 !== 'home' &&
      p2 !== 'home'
    ) {
      return {
        version: 1,
        pinned: [p1 as DestinationId, p2 as DestinationId],
      };
    }
  }

  return DEFAULT_NAV;
}

// ── Backward Compatibility Helpers ──────────────────────────────────────────

export interface NavModuleDefinition {
  id: NavModuleId;
  label: string;
  path: string;
  icon: LucideIcon;
  color?: string;
  description?: string;
}

export const NAV_MODULE_REGISTRY: NavModuleDefinition[] = DESTINATIONS.map(d => ({
  id: d.id,
  label: d.label,
  path: d.route,
  icon: d.icon,
  description: d.label,
}));

export function getModuleById(id: NavModuleId): NavModuleDefinition {
  const dest = getDestinationById(id);
  if (dest) {
    return {
      id: dest.id,
      label: dest.label,
      path: dest.route,
      icon: dest.icon,
      description: dest.label,
    };
  }
  const fallback = DESTINATIONS[0];
  return {
    id: fallback.id,
    label: fallback.label,
    path: fallback.route,
    icon: fallback.icon,
    description: fallback.label,
  };
}
