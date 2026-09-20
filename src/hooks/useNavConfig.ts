import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  DESTINATIONS,
  HOME_DESTINATION,
  DestinationId,
  HubDestination,
  HomeDestination,
  getDestinationById,
} from '../config/hubDestinations';
import {
  NavConfig,
  DEFAULT_NAV,
  validateNavConfig,
} from '../config/navRegistry';
import { loadNavConfig, saveNavConfig } from '../utils/navStorage';
import type { AppData } from '../types';

interface UseNavConfigOptions {
  data?: AppData;
  updateData?: (partial: Partial<AppData>) => Promise<any>;
}

export interface UseNavConfigReturn {
  config: NavConfig;
  pinned: [DestinationId, DestinationId];
  pillDestinations: [HomeDestination, HubDestination, HubDestination];
  hubDestinations: HubDestination[];
  setPinned: (pinned: [DestinationId, DestinationId]) => void;
  setSlot: (slot: 1 | 2, id: DestinationId) => void;
  reset: () => void;
}

export function useNavConfig(options?: UseNavConfigOptions): UseNavConfigReturn {
  const { data, updateData } = options || {};

  // Initialize config: prefer data.settings.navPinned if valid, otherwise localStorage, then DEFAULT_NAV
  const [config, setConfig] = useState<NavConfig>(() => {
    if (data?.settings?.navPinned) {
      return validateNavConfig({ pinned: data.settings.navPinned });
    }
    return loadNavConfig();
  });

  // Track the latest data settings for debounced write
  const dataRef = useRef(data);
  dataRef.current = data;

  const updateDataRef = useRef(updateData);
  updateDataRef.current = updateData;

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync if incoming remote data changes
  useEffect(() => {
    if (data?.settings?.navPinned) {
      const validated = validateNavConfig({ pinned: data.settings.navPinned });
      const currentPinned = config.pinned;
      if (
        validated.pinned[0] !== currentPinned[0] ||
        validated.pinned[1] !== currentPinned[1]
      ) {
        setConfig(validated);
        saveNavConfig(validated);
      }
    }
  }, [data?.settings?.navPinned]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Internal helper to apply new pinned pair and trigger debounced sync
  const applyPinned = useCallback((newPinned: [DestinationId, DestinationId]) => {
    const validated = validateNavConfig({ version: 1, pinned: newPinned });

    // 1. Immediate local state update (0ms UI latency)
    setConfig(validated);

    // 2. Immediate local storage persistence
    saveNavConfig(validated);

    // 3. Debounced (300ms) write to Firestore settings store
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (updateDataRef.current) {
        const currentSettings = dataRef.current?.settings || {
          theme: 'system',
          accentColor: '#6366F1',
        };
        updateDataRef.current({
          settings: {
            ...currentSettings,
            navPinned: [validated.pinned[0], validated.pinned[1]],
          },
        }).catch((err) => {
          console.warn('Failed to sync navPinned to Firebase:', err);
        });
      }
    }, 300);
  }, []);

  const setPinned = useCallback(
    (newPinned: [DestinationId, DestinationId]) => {
      applyPinned(newPinned);
    },
    [applyPinned]
  );

  const setSlot = useCallback(
    (slot: 1 | 2, id: DestinationId) => {
      const [slot1, slot2] = config.pinned;

      if (slot === 1) {
        if (id === slot1) return;
        if (id === slot2) {
          // Swap slots
          applyPinned([slot2, slot1]);
        } else {
          applyPinned([id, slot2]);
        }
      } else {
        if (id === slot2) return;
        if (id === slot1) {
          // Swap slots
          applyPinned([slot2, slot1]);
        } else {
          applyPinned([slot1, id]);
        }
      }
    },
    [config.pinned, applyPinned]
  );

  const reset = useCallback(() => {
    applyPinned(DEFAULT_NAV.pinned);
  }, [applyPinned]);

  // Derived pill destinations: [Home, Slot 1, Slot 2]
  const pillDestinations = useMemo<[HomeDestination, HubDestination, HubDestination]>(() => {
    const s1 = getDestinationById(config.pinned[0]) || DESTINATIONS[0];
    const s2 = getDestinationById(config.pinned[1]) || DESTINATIONS[1];
    return [HOME_DESTINATION, s1, s2];
  }, [config.pinned]);

  // Derived hub destinations: exactly 10 destinations not in pinned
  const hubDestinations = useMemo<HubDestination[]>(() => {
    const pinnedSet = new Set<string>(config.pinned);
    return DESTINATIONS.filter((d) => !pinnedSet.has(d.id));
  }, [config.pinned]);

  return {
    config,
    pinned: config.pinned,
    pillDestinations,
    hubDestinations,
    setPinned,
    setSlot,
    reset,
  };
}
