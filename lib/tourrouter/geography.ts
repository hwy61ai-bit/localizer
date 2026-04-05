import { CITY_COORDS } from './constants';

export function isImperialCountry(country: string | null | undefined): boolean {
  if (!country) return true;
  const c = country.toLowerCase();
  return c.includes('usa') || c.includes('united states') || c.includes('us') ||
         c.includes('canada') || c.includes('mexico') || c === 'ca' || c === 'mx';
}

export function legCountry(c1: string | null | undefined, c2: string | null | undefined): string {
  if (isImperialCountry(c1) || isImperialCountry(c2)) return 'usa';
  return 'europe';
}

export function getCityCoords(city: string | null | undefined, _country?: string | null): [number, number] | null {
  if (!city) return null;
  const raw = city.toLowerCase().trim();

  // Direct lookup
  if (CITY_COORDS[raw]) return CITY_COORDS[raw];

  // Strip state/province abbreviation — "Nashville, TN" → "nashville"
  const beforeComma = raw.split(',')[0].trim();
  if (beforeComma !== raw && CITY_COORDS[beforeComma]) return CITY_COORDS[beforeComma];

  // Strip trailing 2-letter state code — "Nashville TN" → "nashville"
  const noState = raw.replace(/\s+[a-z]{2}$/i, '').trim();
  if (noState !== raw && CITY_COORDS[noState]) return CITY_COORDS[noState];

  // Strip leading "the " — "The Bronx" → "bronx"
  const noThe = raw.replace(/^the\s+/i, '').trim();
  if (noThe !== raw && CITY_COORDS[noThe]) return CITY_COORDS[noThe];

  // Try matching dictionary keys that start with our cleaned city name
  for (const k in CITY_COORDS) {
    if (k === beforeComma || k === noState) return CITY_COORDS[k];
  }

  return null;
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getRoadKm(
  city1: string | null | undefined, c1: string | null | undefined,
  city2: string | null | undefined, c2: string | null | undefined,
): number | null {
  const coords1 = getCityCoords(city1, c1);
  const coords2 = getCityCoords(city2, c2);
  if (!coords1 || !coords2) return null;
  return haversine(coords1[0], coords1[1], coords2[0], coords2[1]) * 1.3;
}

export function estimateDriveHours(km: number | null | undefined): number | null {
  if (!km) return null;
  return km / 80;
}

// ============================================================
// Mapbox-powered drive info (async, calls API route)
// Falls back to haversine estimates if unavailable
// ============================================================

export type DriveDataMap = Record<string, {
  distanceKm: number;
  distanceMiles: number;
  driveHours: number;
  driveSeconds: number;
  routeSummary: string;
}>;

export function buildDriveDataKey(city1: string | null | undefined, city2: string | null | undefined): string {
  const c1 = (city1 ?? "").toLowerCase().trim();
  const c2 = (city2 ?? "").toLowerCase().trim();
  return c1 + '|' + c2;
}

export interface MapboxDriveInfo {
  distanceKm: number;
  distanceMiles: number;
  driveSeconds: number;
  driveHours: number;
  routeSummary: string;
}

/**
 * Get real driving distance/time via the drive-info API route (Mapbox-backed).
 * Returns null if the API call fails — caller should fall back to getRoadKm/estimateDriveHours.
 */
export async function getMapboxDriveInfo(
  originCity: string,
  destCity: string
): Promise<MapboxDriveInfo | null> {
  try {
    const resp = await fetch('/api/tourrouter/drive-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originCity, destCity }),
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    return {
      distanceKm: data.distanceKm,
      distanceMiles: data.distanceMiles,
      driveSeconds: data.driveSeconds,
      driveHours: data.driveHours,
      routeSummary: data.routeSummary,
    };
  } catch {
    return null;
  }
}

/**
 * Client-side prefetch: calls /api/tourrouter/drive-info for each consecutive pair.
 * Use in client components.
 */
export async function prefetchDriveData(
  shows: { city: string; country: string; isOff?: boolean }[]
): Promise<DriveDataMap> {
  const map: DriveDataMap = {};
  const pairs: { from: string; to: string }[] = [];

  function isValidCity(s: { city: string; isOff?: boolean }): boolean {
    if (s.isOff) return false;
    const c = s.city?.trim().toLowerCase();
    return !!c && c !== 'off';
  }

  for (let i = 1; i < shows.length; i++) {
    if (!isValidCity(shows[i - 1]) || !isValidCity(shows[i])) continue;
    pairs.push({ from: shows[i - 1].city, to: shows[i].city });
  }

  const results = await Promise.all(
    pairs.map(async ({ from, to }) => {
      const info = await getMapboxDriveInfo(from, to);
      return { from, to, info };
    })
  );

  for (const { from, to, info } of results) {
    if (info) {
      map[buildDriveDataKey(from, to)] = {
        distanceKm: info.distanceKm,
        distanceMiles: info.distanceMiles,
        driveHours: info.driveHours,
        driveSeconds: info.driveSeconds,
        routeSummary: info.routeSummary,
      };
    }
  }

  return map;
}

export function fmtHours(h: number | null | undefined): string {
  if (h === null || h === undefined) return '?';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return hh + 'h ' + (mm > 0 ? mm + 'm' : '');
}

export function formatDateDisplay(dateObj: Date | null | undefined): string {
  if (!dateObj) return '\u2014';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return days[dateObj.getDay()] + ', ' + months[dateObj.getMonth()] + ' ' + dateObj.getDate() + ' ' + dateObj.getFullYear();
}
