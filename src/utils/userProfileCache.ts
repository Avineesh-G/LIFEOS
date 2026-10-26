/**
 * LifeOS — Instant Synchronous User Profile Cache
 * Eliminates avatar loading delay and fallback flashes ("U") on app start.
 */

import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface CachedUserProfile {
  photoURL: string | null;
  displayName: string | null;
  email: string | null;
}

const STORAGE_KEY = 'lifeos_cached_auth_user';

let memoryCachedProfile: CachedUserProfile | null = null;

/**
 * Returns the cached user profile synchronously from memory or localStorage.
 * Guaranteed 0ms response time on initial render.
 */
export function getCachedUserProfile(): CachedUserProfile {
  if (memoryCachedProfile) {
    return memoryCachedProfile;
  }

  if (typeof window === 'undefined') {
    return { photoURL: null, displayName: null, email: null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoryCachedProfile = {
        photoURL: parsed.photoURL || null,
        displayName: parsed.displayName || null,
        email: parsed.email || null,
      };

      // Warm up image in browser cache if URL exists
      if (memoryCachedProfile.photoURL) {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.src = memoryCachedProfile.photoURL;
      }

      return memoryCachedProfile;
    }
  } catch {
    // quota or parsing issue
  }

  return { photoURL: null, displayName: null, email: null };
}

/**
 * Update the memory and localStorage profile cache.
 */
export function updateCachedUserProfile(profile: Partial<CachedUserProfile>): void {
  const current = getCachedUserProfile();
  memoryCachedProfile = {
    ...current,
    ...profile,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...profile }));
  } catch {}
}

/**
 * React hook to access cached user profile instantly with zero delay,
 * automatically updating when Firebase auth state changes.
 */
export function useUserProfile(): CachedUserProfile {
  const [profile, setProfile] = useState<CachedUserProfile>(() => getCachedUserProfile());

  useEffect(() => {
    // Initial sync with auth.currentUser if already available
    if (auth.currentUser) {
      const fresh: CachedUserProfile = {
        photoURL: auth.currentUser.photoURL || null,
        displayName: auth.currentUser.displayName || null,
        email: auth.currentUser.email || null,
      };
      setProfile(fresh);
      updateCachedUserProfile(fresh);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const fresh: CachedUserProfile = {
          photoURL: currentUser.photoURL || null,
          displayName: currentUser.displayName || null,
          email: currentUser.email || null,
        };
        setProfile(fresh);
        updateCachedUserProfile(fresh);
      } else {
        // If user explicitly signed out, memory cache clears
        const currentStored = localStorage.getItem(STORAGE_KEY);
        if (!currentStored) {
          memoryCachedProfile = null;
          setProfile({ photoURL: null, displayName: null, email: null });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return profile;
}
