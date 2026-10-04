/**
 * LifeOS Geolocation & Local Context Service
 * Provides privacy-first device location detection with city/region resolution.
 */

export interface UserLocation {
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  source: 'gps' | 'manual' | 'timezone_fallback';
  timestamp: number;
}

const LOCATION_STORAGE_KEY = 'lifeos_user_location';
let cachedLocation: UserLocation | null = null;

/**
 * Derives a fallback city based on the browser's IANA timezone.
 */
export function getTimezoneFallbackLocation(): UserLocation {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('Asia/Kolkata')) {
      return {
        city: 'Bengaluru',
        region: 'Karnataka',
        country: 'India',
        source: 'timezone_fallback',
        timestamp: Date.now(),
      };
    }
    const parts = tz.split('/');
    const city = parts[parts.length - 1]?.replace(/_/g, ' ') || 'Local City';
    return {
      city,
      country: parts[0] || 'Local',
      source: 'timezone_fallback',
      timestamp: Date.now(),
    };
  } catch {
    return {
      city: 'Local City',
      source: 'timezone_fallback',
      timestamp: Date.now(),
    };
  }
}

/**
 * Gets the current cached or stored location.
 */
export function getStoredLocation(): UserLocation {
  if (cachedLocation) return cachedLocation;

  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Valid for 24 hours
      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
        cachedLocation = parsed;
        return parsed;
      }
    }
  } catch {}

  const fallback = getTimezoneFallbackLocation();
  cachedLocation = fallback;
  return fallback;
}

/**
 * Saves or overrides user location preference.
 */
export function setManualLocation(city: string, region?: string): UserLocation {
  const loc: UserLocation = {
    city: city.trim(),
    region: region?.trim(),
    source: 'manual',
    timestamp: Date.now(),
  };
  cachedLocation = loc;
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
  } catch {}
  return loc;
}

/**
 * Requests browser/device geolocation with reverse geocoding.
 */
export async function requestDeviceLocation(): Promise<UserLocation> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return getStoredLocation();
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let loc: UserLocation = {
          latitude,
          longitude,
          source: 'gps',
          timestamp: Date.now(),
        };

        try {
          // Free Nominatim reverse geocode with low timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            loc.city = address.city || address.town || address.village || address.suburb || address.state_district;
            loc.region = address.state;
            loc.country = address.country;
            loc.formattedAddress = data.display_name;
          }
        } catch (e) {
          // If reverse geocoding fails or times out, use timezone city with gps coords
          const tzFallback = getTimezoneFallbackLocation();
          loc.city = tzFallback.city;
          loc.region = tzFallback.region;
        }

        cachedLocation = loc;
        try {
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
        } catch {}

        resolve(loc);
      },
      (err) => {
        console.warn('Geolocation permission denied or timed out:', err.message);
        resolve(getStoredLocation());
      },
      { timeout: 5000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  });
}
