import type { User } from "firebase/auth";

const LOCATION_ALLOWED_KEY = "figus_location_allowed";
const LOCATION_UNAVAILABLE_KEY = "figus_location_unavailable";

export function canAskBrowserLocation() {
  if (typeof window === "undefined") return false;
  if (!("geolocation" in navigator)) return false;

  // Chrome/Android bloquea geolocation en http://192.168.x.x.
  // localhost sí se considera seguro; producción debe usar HTTPS.
  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  return window.isSecureContext || isLocalhost;
}

export function hasLocationAllowedOnDevice() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LOCATION_ALLOWED_KEY) === "true";
}

export function isLocationUnavailableOnDevice() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LOCATION_UNAVAILABLE_KEY) === "true";
}

export async function refreshSmartLocation(user?: User | null, options?: { force?: boolean }) {
  if (typeof window === "undefined") return false;

  if (!canAskBrowserLocation()) {
    window.localStorage.setItem(LOCATION_UNAVAILABLE_KEY, "true");
    return false;
  }

  const alreadyAllowed = window.localStorage.getItem(LOCATION_ALLOWED_KEY) === "true";

  if (!alreadyAllowed && !options?.force) return false;

  return new Promise<boolean>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        window.localStorage.setItem(LOCATION_ALLOWED_KEY, "true");
        window.localStorage.removeItem(LOCATION_UNAVAILABLE_KEY);
        window.localStorage.setItem("figus_lat", String(lat));
        window.localStorage.setItem("figus_lng", String(lng));
        window.localStorage.setItem("figus_location_updated_at", new Date().toISOString());

        if (user) {
          try {
            const { saveMyFiguLocation } = await import("@/services/figus");
            await saveMyFiguLocation(user, lat, lng);
          } catch {
            // No bloquea la experiencia si falla Supabase.
          }
        }

        resolve(true);
      },
      () => {
        window.localStorage.setItem(LOCATION_UNAVAILABLE_KEY, "true");
        resolve(false);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 5,
        timeout: 8000,
      }
    );
  });
}


export async function syncStoredLocation(user?: User | null) {
  if (typeof window === "undefined" || !user) return false;

  const lat = Number(window.localStorage.getItem("figus_lat"));
  const lng = Number(window.localStorage.getItem("figus_lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

  try {
    const { saveMyFiguLocation } = await import("@/services/figus");
    await saveMyFiguLocation(user, lat, lng);
    return true;
  } catch {
    return false;
  }
}
