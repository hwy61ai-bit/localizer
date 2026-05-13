import { getCityCoords, buildDriveDataKey, type DriveDataMap } from './geography';

const KM_PER_MILE = 1.60934;

/**
 * Server-side prefetch: calls getDriveInfo() directly (no HTTP round-trip).
 * Use in API routes / server components.
 */
export async function prefetchDriveDataServer(
  shows: { city: string; country: string; isOff?: boolean }[]
): Promise<DriveDataMap> {
  const map: DriveDataMap = {};
  const pairs: { from: string; to: string; fromCountry: string; toCountry: string }[] = [];

  function isValidCity(s: { city: string; isOff?: boolean }): boolean {
    if (s.isOff) return false;
    const c = s.city?.trim().toLowerCase();
    return !!c && c !== 'off';
  }

  for (let i = 1; i < shows.length; i++) {
    if (!isValidCity(shows[i - 1]) || !isValidCity(shows[i])) continue;
    pairs.push({
      from: shows[i - 1].city,
      to: shows[i].city,
      fromCountry: shows[i - 1].country,
      toCountry: shows[i].country,
    });
  }

  const results = await Promise.all(
    pairs.map(async ({ from, to, fromCountry, toCountry }) => {
      try {
        const info = await getDriveInfo(from, to, fromCountry, toCountry);
        return { from, to, info };
      } catch {
        return { from, to, info: null };
      }
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

// ============================================================
// Geocoding: CITY_COORDS → geocode_cache → Mapbox API
// ============================================================

export async function geocodeCity(
  city: string,
  country?: string,
  state?: string
): Promise<{ lat: number; lng: number; formattedName: string }> {
  // When country is provided, prefer the country-aware geocoding system in ./geocoding.
  // Uses dynamic import to avoid pulling server-only deps (next/headers via supabaseServer)
  // into client bundles that import this module via the @/lib/tourrouter barrel.
  // Falls through to the legacy path on null/error or when country is missing.
  if (country) {
    try {
      const { getCityCoordinates } = await import('./geocoding');
      const result = await getCityCoordinates(city, country, state);
      if (result) {
        return { lat: result.lat, lng: result.lng, formattedName: city };
      }
    } catch {
      // fall through to legacy path
    }
  }

  // 1. Check CITY_COORDS (free, instant)
  const coords = getCityCoords(city);
  if (coords) {
    return { lat: coords[0], lng: coords[1], formattedName: city };
  }

  const cityKey = city.toLowerCase().trim();

  // 2. Check geocode_cache table
  const cacheResp = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/geocode_cache?city_input=eq.${encodeURIComponent(cityKey)}&select=lat,lng,formatted_name&limit=1`,
    {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
      },
      cache: 'no-store',
    }
  );

  if (cacheResp.ok) {
    const rows = await cacheResp.json();
    if (rows.length > 0) {
      return {
        lat: Number(rows[0].lat),
        lng: Number(rows[0].lng),
        formattedName: rows[0].formatted_name || city,
      };
    }
  }

  // 3. Call Mapbox Geocoding API
  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  if (!MAPBOX_TOKEN) {
    throw new Error('MAPBOX_ACCESS_TOKEN not configured');
  }

  const mapboxResp = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city)}.json?access_token=${MAPBOX_TOKEN}&limit=1`,
    { cache: 'no-store' }
  );

  if (!mapboxResp.ok) {
    throw new Error(`Mapbox geocoding failed: ${mapboxResp.status}`);
  }

  const mapboxData = await mapboxResp.json();
  const feature = mapboxData.features?.[0];
  if (!feature) {
    throw new Error(`No geocoding results for: ${city}`);
  }

  const [lng, lat] = feature.center;
  const formattedName = feature.place_name || city;

  return { lat, lng, formattedName };
}

/**
 * Cache a geocode result in Supabase. Requires service role key.
 */
export async function cacheGeocode(
  cityInput: string,
  lat: number,
  lng: number,
  formattedName: string,
  serviceRoleKey: string
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/geocode_cache`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        city_input: cityInput.toLowerCase().trim(),
        lat,
        lng,
        formatted_name: formattedName,
      }),
      cache: 'no-store',
    }
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase ${response.status} ${response.statusText} on geocode_cache: ${body.slice(0, 500)}`);
  }
}

// ============================================================
// Directions: drive_cache → Mapbox Directions API
// ============================================================

export interface DriveInfo {
  distanceKm: number;
  distanceMiles: number;
  driveSeconds: number;
  driveHours: number;
  routeSummary: string;
}

export async function getDriveInfo(
  originCity: string,
  destCity: string,
  originCountry?: string,
  destCountry?: string,
  originState?: string,
  destState?: string
): Promise<DriveInfo> {
  const originKey = originCity.toLowerCase().trim();
  const destKey = destCity.toLowerCase().trim();
  const oc = (originCountry || '').toUpperCase().trim();
  const dc = (destCountry || '').toUpperCase().trim();

  // 1. Check drive_cache table (skip when either country is missing — incomplete data)
  if (oc && dc) {
    const cacheResp = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/drive_cache?origin_city=eq.${encodeURIComponent(originKey)}&origin_country=eq.${encodeURIComponent(oc)}&dest_city=eq.${encodeURIComponent(destKey)}&dest_country=eq.${encodeURIComponent(dc)}&select=distance_km,distance_miles,drive_seconds,drive_hours,route_summary&limit=1`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        cache: 'no-store',
      }
    );

    if (cacheResp.ok) {
      const rows = await cacheResp.json();
      if (rows.length > 0) {
        const r = rows[0];
        return {
          distanceKm: Number(r.distance_km),
          distanceMiles: Number(r.distance_miles),
          driveSeconds: Number(r.drive_seconds),
          driveHours: Number(r.drive_hours),
          routeSummary: r.route_summary || '',
        };
      }
    }
  }

  // 2. Geocode both cities
  const [origin, dest] = await Promise.all([
    geocodeCity(originCity, originCountry, originState),
    geocodeCity(destCity, destCountry, destState),
  ]);

  // 3. Call Mapbox Directions API
  const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
  if (!MAPBOX_TOKEN) {
    throw new Error('MAPBOX_ACCESS_TOKEN not configured');
  }

  const directionsResp = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?access_token=${MAPBOX_TOKEN}`,
    { cache: 'no-store' }
  );

  if (!directionsResp.ok) {
    throw new Error(`Mapbox directions failed: ${directionsResp.status}`);
  }

  const directionsData = await directionsResp.json();
  const route = directionsData.routes?.[0];
  if (!route) {
    throw new Error(`No route found: ${originCity} → ${destCity}`);
  }

  const distanceKm = route.distance / 1000;
  const distanceMiles = distanceKm / KM_PER_MILE;
  const driveSeconds = route.duration;
  const driveHours = driveSeconds / 3600;
  const routeSummary = route.legs?.[0]?.summary || '';

  return { distanceKm, distanceMiles, driveSeconds, driveHours, routeSummary };
}

/**
 * Cache a drive result in Supabase. Requires service role key.
 */
export async function cacheDriveInfo(
  originCity: string,
  originCountry: string,
  destCity: string,
  destCountry: string,
  originCoords: { lat: number; lng: number },
  destCoords: { lat: number; lng: number },
  info: DriveInfo,
  serviceRoleKey: string
): Promise<void> {
  const oc = (originCountry || '').toUpperCase().trim();
  const dc = (destCountry || '').toUpperCase().trim();
  if (!oc || !dc) return;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/drive_cache`,
    {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        origin_city: originCity.toLowerCase().trim(),
        origin_country: oc,
        origin_lat: originCoords.lat,
        origin_lng: originCoords.lng,
        dest_city: destCity.toLowerCase().trim(),
        dest_country: dc,
        dest_lat: destCoords.lat,
        dest_lng: destCoords.lng,
        distance_km: info.distanceKm,
        distance_miles: info.distanceMiles,
        drive_seconds: Math.round(info.driveSeconds),
        drive_hours: info.driveHours,
        route_summary: info.routeSummary,
        fetched_at: new Date().toISOString(),
      }),
      cache: 'no-store',
    }
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase ${response.status} ${response.statusText} on drive_cache: ${body.slice(0, 500)}`);
  }
}
