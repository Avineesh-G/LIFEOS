/**
 * LifeOS — Instant Synchronous User Profile Cache
 * Eliminates avatar loading delay and fallback flashes ("U") on app start
 * by caching both user profile metadata and offline base64 image data.
 */

import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export interface CachedUserProfile {
  photoURL: string | null;
  displayName: string | null;
  email: string | null;
  avatarBase64?: string | null;
}

const STORAGE_KEY = 'lifeos_cached_auth_user';
const AVATAR_BASE64_KEY = 'lifeos_cached_avatar_base64';

let memoryCachedProfile: CachedUserProfile | null = null;
let memoryCachedAvatarBase64: string | null = null;

/**
 * Converts a remote photo URL into a compressed base64 data URI in background
 * and persists to localStorage for 0ms instant first-render.
 */
function cacheAvatarAsBase64(url: string): void {
  if (typeof window === 'undefined' || !url || url.startsWith('data:')) return;
  
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 96;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          memoryCachedAvatarBase64 = dataUrl;
          try {
            localStorage.setItem(AVATAR_BASE64_KEY, dataUrl);
          } catch {}
        }
      } catch {
        // Canvas taint fallback (CORS on some CDNs)
      }
    };
    img.src = url;
  } catch {}
}

/**
 * Returns the cached user profile synchronously from memory or localStorage.
 * Guaranteed 0ms response time on initial render.
 */
export function getCachedUserProfile(): CachedUserProfile {
  if (memoryCachedProfile) {
    return memoryCachedProfile;
  }

  if (typeof window === 'undefined') {
    return { photoURL: null, displayName: null, email: null, avatarBase64: null };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const cachedBase64 = localStorage.getItem(AVATAR_BASE64_KEY);
    if (cachedBase64) {
      memoryCachedAvatarBase64 = cachedBase64;
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      const effectivePhoto = cachedBase64 || parsed.photoURL || null;

      memoryCachedProfile = {
        photoURL: effectivePhoto,
        displayName: parsed.displayName || null,
        email: parsed.email || null,
        avatarBase64: cachedBase64 || null,
      };

      // Trigger background refresh if remote URL exists
      if (parsed.photoURL && !parsed.photoURL.startsWith('data:')) {
        cacheAvatarAsBase64(parsed.photoURL);
      }

      return memoryCachedProfile;
    }
  } catch {
    // quota or parsing issue
  }

  return { photoURL: null, displayName: null, email: null, avatarBase64: null };
}

/**
 * Update the memory and localStorage profile cache.
 */
export function updateCachedUserProfile(profile: Partial<CachedUserProfile>): void {
  const current = getCachedUserProfile();
  const effectivePhoto = memoryCachedAvatarBase64 || profile.photoURL || current.photoURL;

  memoryCachedProfile = {
    ...current,
    ...profile,
    photoURL: effectivePhoto,
    avatarBase64: memoryCachedAvatarBase64,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...profile }));

    if (profile.photoURL && !profile.photoURL.startsWith('data:')) {
      cacheAvatarAsBase64(profile.photoURL);
    }
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
      const remotePhoto = auth.currentUser.photoURL || null;
      const cachedBase64 = memoryCachedAvatarBase64 || localStorage.getItem(AVATAR_BASE64_KEY);
      const fresh: CachedUserProfile = {
        photoURL: cachedBase64 || remotePhoto,
        displayName: auth.currentUser.displayName || null,
        email: auth.currentUser.email || null,
        avatarBase64: cachedBase64 || null,
      };
      setProfile(fresh);
      updateCachedUserProfile(fresh);
      if (remotePhoto) {
        cacheAvatarAsBase64(remotePhoto);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const remotePhoto = currentUser.photoURL || null;
        const cachedBase64 = memoryCachedAvatarBase64 || localStorage.getItem(AVATAR_BASE64_KEY);
        const fresh: CachedUserProfile = {
          photoURL: cachedBase64 || remotePhoto,
          displayName: currentUser.displayName || null,
          email: currentUser.email || null,
          avatarBase64: cachedBase64 || null,
        };
        setProfile(fresh);
        updateCachedUserProfile(fresh);
        if (remotePhoto) {
          cacheAvatarAsBase64(remotePhoto);
        }
      } else {
        const currentStored = localStorage.getItem(STORAGE_KEY);
        if (!currentStored) {
          memoryCachedProfile = null;
          memoryCachedAvatarBase64 = null;
          setProfile({ photoURL: null, displayName: null, email: null, avatarBase64: null });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return profile;
}

/**
 * Explicitly clears the in-memory and persistent profile cache upon sign out.
 */
export function clearUserProfileCache(): void {
  memoryCachedProfile = null;
  memoryCachedAvatarBase64 = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AVATAR_BASE64_KEY);
  } catch {}
}
