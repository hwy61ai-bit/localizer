/**
 * lib/tourrouter/geocoding.ts
 *
 * Three-tier geocoding and airport resolution for TourRouter.
 *
 * Lookup order for coordinates:
 *   Tier 1: In-memory cache (CITY_COORDS pre-loaded + runtime lookups)
 *   Tier 2: geo_cities table in Supabase
 *   Tier 3: Mapbox geocoding API → write-back to geo_cities
 *
 * Lookup order for airports:
 *   Tier 1: CITY_AIRPORTS constant
 *   Tier 2: geo_cities.iata_code (exact city match)
 *   Tier 3: nearest_airport RPC (within 150km)
 *
 * Cache key format (used consistently throughout this module):
 *   "${city.toLowerCase().trim()}|${country.toUpperCase().trim()}"
 *
 * State is not included in the cache key because tour_shows does not have a
 * state field. When state is available (e.g. from geo_cities results), it's
 * used as a disambiguation hint in Tier 2 queries, not as a key component.
 */

import { CITY_COORDS, CITY_AIRPORTS, AIRPORT_COORDS } from './constants';
import type { AirportInfo } from './flights';
import { supabaseServer } from '@/lib/supabaseServer';

// ---------------------------------------------------------------------------
// In-memory coordinate cache
// ---------------------------------------------------------------------------
const coordsCache = new Map<string, { lat: number; lng: number }>();

// Pre-load CITY_COORDS into the cache. CITY_COORDS keys are bare city names
// ("austin", "london") without country info, so they go in under the legacy
// key format (bare lowercase). The canonical key format (city|COUNTRY) is used
// by newer code paths; when a canonical lookup misses, the code falls back to
// checking the legacy bare key, which is how CITY_COORDS entries get found.
for (const [rawKey, [lat, lng]] of Object.entries(CITY_COORDS)) {
  coordsCache.set(rawKey.toLowerCase().trim(), { lat, lng });
}

// ---------------------------------------------------------------------------
// Cache key builder
// ---------------------------------------------------------------------------
export function cacheKey(city: string, country: string): string {
  return `${city.toLowerCase().trim()}|${country.toUpperCase().trim()}`;
}

// ---------------------------------------------------------------------------
// getCityCoordinates — async three-tier coordinate lookup
// ---------------------------------------------------------------------------
export async function getCityCoordinates(
  city: string,
  country: string,
  state?: string
): Promise<{ lat: number; lng: number; source: string } | null> {
  if (!city || !country) return null;

  const key = cacheKey(city, country);

  // Tier 1 — in-memory cache (CITY_COORDS + runtime)
  const cached = coordsCache.get(key);
  if (cached) return { ...cached, source: 'cache' };

  // Also check the legacy CITY_COORDS key format (bare lowercase city name)
  const legacyCached = coordsCache.get(city.toLowerCase().trim());
  if (legacyCached) return { ...legacyCached, source: 'cache' };

  // Tier 2 — geo_cities table
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from('geo_cities')
    .select('lat, lng, state_province, population')
    .eq('name_lower', city.toLowerCase().trim())
    .eq('country', country.toUpperCase().trim())
    .order('population', { ascending: false })
    .limit(5);

  if (data && data.length > 0) {
    // If state hint provided, prefer a match; otherwise take highest-population
    const match = state
      ? data.find(d =>
          d.state_province?.toLowerCase() === state.toLowerCase() ||
          d.state_province?.toLowerCase().startsWith(state.toLowerCase())
        ) || data[0]
      : data[0];

    const result = { lat: Number(match.lat), lng: Number(match.lng) };
    coordsCache.set(key, result);
    return { ...result, source: 'geo_cities' };
  }

  // Tier 3 — Mapbox geocoding API → write-back to geo_cities
  const geocoded = await geocodeViaMapbox(city, country, state);
  if (geocoded) {
    coordsCache.set(key, { lat: geocoded.lat, lng: geocoded.lng });

    // Write-back to geo_cities so we never look this up again.
    // Non-blocking — if write fails (RLS, network), log and continue.
    // TODO: name_lower stores accented lowercase ("são paulo"), so a future lookup
    // for the unaccented form ("sao paulo") won't match. To fix properly, store
    // ASCII-normalized form in name_lower and normalize queries before lookup.
    // Leaving for backlog — affects lookup logic in multiple places.
    supabase.from('geo_cities').insert({
      name: city,
      name_ascii: city.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      name_lower: city.toLowerCase().trim(),
      state_province: state || geocoded.state || null,
      country: country.toUpperCase().trim(),
      lat: geocoded.lat,
      lng: geocoded.lng,
      source: 'geocode_api',
    }).then(({ error }) => {
      if (error) console.warn('[geocoding] write-back failed:', error.message);
    });

    return { lat: geocoded.lat, lng: geocoded.lng, source: 'geocode_api' };
  }

  return null;
}

// ---------------------------------------------------------------------------
// getAirportForCity — async three-tier airport lookup
// ---------------------------------------------------------------------------
export async function getAirportForCity(
  city: string,
  country: string,
  state?: string,
  coords?: { lat: number; lng: number }
): Promise<{ iata: string; coords: [number, number] | undefined; source: string } | null> {
  if (!city || !country) return null;

  const cityLower = city.toLowerCase().trim();

  // Tier 1 — CITY_AIRPORTS constant (instant)
  const legacyCode = CITY_AIRPORTS[cityLower];
  if (legacyCode) {
    return { iata: legacyCode, coords: AIRPORT_COORDS[legacyCode], source: 'constant' };
  }

  // Tier 2 — exact city match in geo_cities where iata_code is populated
  const supabase = await supabaseServer();
  const { data: exact } = await supabase
    .from('geo_cities')
    .select('iata_code')
    .eq('name_lower', cityLower)
    .eq('country', country.toUpperCase().trim())
    .not('iata_code', 'is', null)
    .order('population', { ascending: false })
    .limit(1);

  if (exact && exact.length > 0 && exact[0].iata_code) {
    const iata = exact[0].iata_code;
    return { iata, coords: AIRPORT_COORDS[iata], source: 'geo_cities' };
  }

  // Tier 3 — nearest airport within 150km via RPC
  // Use provided coords, or resolve them first
  let searchCoords = coords;
  if (!searchCoords) {
    const resolved = await getCityCoordinates(city, country, state);
    if (resolved) searchCoords = { lat: resolved.lat, lng: resolved.lng };
  }

  if (searchCoords) {
    const { data: nearby } = await supabase
      .rpc('nearest_airport', {
        search_lat: searchCoords.lat,
        search_lng: searchCoords.lng,
        max_distance_km: 150,
      });

    if (nearby && nearby.length > 0 && nearby[0].iata_code) {
      const iata = nearby[0].iata_code;
      return { iata, coords: AIRPORT_COORDS[iata], source: 'nearest' };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// searchCities — autocomplete, ilike prefix search ordered by population
// ---------------------------------------------------------------------------
export async function searchCities(
  query: string,
  country?: string,
  limit = 10
): Promise<Array<{
  name: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  iata_code: string | null;
}>> {
  if (!query || query.trim().length === 0) return [];

  const supabase = await supabaseServer();
  let q = supabase
    .from('geo_cities')
    .select('name, state_province, country, lat, lng, population, iata_code')
    .ilike('name_lower', `${query.toLowerCase().trim()}%`)
    .order('population', { ascending: false })
    .limit(limit);

  if (country) q = q.eq('country', country.toUpperCase().trim());

  const { data } = await q;
  return (data || []).map(d => ({
    name: d.name,
    state: d.state_province || '',
    country: d.country,
    lat: Number(d.lat),
    lng: Number(d.lng),
    iata_code: d.iata_code || null,
  }));
}

// ---------------------------------------------------------------------------
// resolveAllCityCoords — prefetch helper for calcTourFinancials
//
// Mirrors the prefetchDriveDataServer pattern: call once before
// calcTourFinancials, pass result as the coordsMap parameter.
//
// Strategy: deduplicate cities, batch-query geo_cities (grouped by country,
// using .in() which is safe for city names with commas/periods/quotes),
// fall back to Mapbox only for misses (sequential, since Mapbox has rate limits).
// ---------------------------------------------------------------------------
export async function resolveAllCityCoords(
  shows: Array<{ city: string; country: string }>
): Promise<Map<string, [number, number]>> {
  const result = new Map<string, [number, number]>();

  // Deduplicate by cache key
  const uniqueCities = new Map<string, { city: string; country: string }>();
  for (const s of shows) {
    if (!s.city || !s.country) continue;
    const key = cacheKey(s.city, s.country);
    if (!uniqueCities.has(key)) {
      uniqueCities.set(key, { city: s.city, country: s.country });
    }
  }

  // Phase 1: resolve from in-memory cache (Tier 1)
  const cacheMisses: Array<{ key: string; city: string; country: string }> = [];

  for (const [key, { city, country }] of uniqueCities) {
    const cached = coordsCache.get(key) || coordsCache.get(city.toLowerCase().trim());
    if (cached) {
      result.set(key, [cached.lat, cached.lng]);
    } else {
      cacheMisses.push({ key, city, country });
    }
  }

  if (cacheMisses.length === 0) return result;

  // Phase 2: batch-query geo_cities for all cache misses.
  // Group by country and use .in() on name_lower — safe for city names with
  // commas, periods, quotes, etc. Tours rarely span more than 2-3 countries,
  // so this is typically 2-3 queries total.
  const supabase = await supabaseServer();
  const missesByCountry = new Map<string, Array<{ key: string; city: string }>>();
  for (const miss of cacheMisses) {
    const country = miss.country.toUpperCase().trim();
    let list = missesByCountry.get(country);
    if (!list) { list = []; missesByCountry.set(country, list); }
    list.push({ key: miss.key, city: miss.city.toLowerCase().trim() });
  }

  const dbResults = new Map<string, { lat: number; lng: number }>();

  for (const [country, missList] of missesByCountry) {
    const cityNames = missList.map(m => m.city);
    const { data } = await supabase
      .from('geo_cities')
      .select('name_lower, country, lat, lng, population')
      .eq('country', country)
      .in('name_lower', cityNames)
      .order('population', { ascending: false });

    if (data) {
      for (const row of data) {
        const rowKey = cacheKey(row.name_lower, row.country);
        // Keep highest-population match (results are ordered by pop desc)
        if (!dbResults.has(rowKey)) {
          dbResults.set(rowKey, { lat: Number(row.lat), lng: Number(row.lng) });
        }
      }
    }
  }

  // Separate DB hits from remaining misses
  const mapboxMisses: Array<{ key: string; city: string; country: string }> = [];

  for (const miss of cacheMisses) {
    const dbHit = dbResults.get(miss.key);
    if (dbHit) {
      result.set(miss.key, [dbHit.lat, dbHit.lng]);
      coordsCache.set(miss.key, dbHit);
    } else {
      mapboxMisses.push(miss);
    }
  }

  // Phase 3: Mapbox fallback for remaining misses (sequential — rate limits)
  for (const miss of mapboxMisses) {
    const resolved = await getCityCoordinates(miss.city, miss.country);
    if (resolved) {
      result.set(miss.key, [resolved.lat, resolved.lng]);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// resolveAllAirports — prefetch helper for calcTourFinancials
//
// Same pattern as resolveAllCityCoords. Takes optional pre-resolved coordsMap
// so it can pass coords to the nearest-airport fallback without re-resolving.
// ---------------------------------------------------------------------------
export async function resolveAllAirports(
  shows: Array<{ city: string; country: string }>,
  coordsMap?: Map<string, [number, number]>
): Promise<Map<string, AirportInfo>> {
  const result = new Map<string, AirportInfo>();

  // Deduplicate by cache key
  const uniqueCities = new Map<string, { city: string; country: string }>();
  for (const s of shows) {
    if (!s.city || !s.country) continue;
    const key = cacheKey(s.city, s.country);
    if (!uniqueCities.has(key)) {
      uniqueCities.set(key, { city: s.city, country: s.country });
    }
  }

  // Phase 1: resolve from CITY_AIRPORTS constant (Tier 1)
  const constantMisses: Array<{ key: string; city: string; country: string }> = [];

  for (const [key, { city, country }] of uniqueCities) {
    const cityLower = city.toLowerCase().trim();
    const code = CITY_AIRPORTS[cityLower];
    if (code) {
      result.set(key, { iata: code, coords: AIRPORT_COORDS[code] });
    } else {
      constantMisses.push({ key, city, country });
    }
  }

  if (constantMisses.length === 0) return result;

  // Phase 2: batch-query geo_cities for iata_code matches.
  // Group by country and use .in() — safe for special characters in city names.
  const supabase = await supabaseServer();
  const missesByCountry = new Map<string, Array<{ key: string; city: string }>>();
  for (const miss of constantMisses) {
    const country = miss.country.toUpperCase().trim();
    let list = missesByCountry.get(country);
    if (!list) { list = []; missesByCountry.set(country, list); }
    list.push({ key: miss.key, city: miss.city.toLowerCase().trim() });
  }

  const dbResults = new Map<string, string>(); // key -> iata_code

  for (const [country, missList] of missesByCountry) {
    const cityNames = missList.map(m => m.city);
    const { data } = await supabase
      .from('geo_cities')
      .select('name_lower, country, iata_code, population')
      .eq('country', country)
      .in('name_lower', cityNames)
      .not('iata_code', 'is', null)
      .order('population', { ascending: false });

    if (data) {
      for (const row of data) {
        const rowKey = cacheKey(row.name_lower, row.country);
        if (!dbResults.has(rowKey) && row.iata_code) {
          dbResults.set(rowKey, row.iata_code);
        }
      }
    }
  }

  // Separate DB hits from remaining misses that need nearest-airport RPC
  const rpcMisses: Array<{ key: string; city: string; country: string }> = [];

  for (const miss of constantMisses) {
    const iata = dbResults.get(miss.key);
    if (iata) {
      result.set(miss.key, { iata, coords: AIRPORT_COORDS[iata] });
    } else {
      rpcMisses.push(miss);
    }
  }

  // Phase 3: nearest-airport RPC for remaining misses (sequential)
  for (const miss of rpcMisses) {
    const coords = coordsMap?.get(miss.key);
    const searchCoords = coords
      ? { lat: coords[0], lng: coords[1] }
      : undefined;

    const airport = await getAirportForCity(miss.city, miss.country, undefined, searchCoords);
    if (airport) {
      result.set(miss.key, { iata: airport.iata, coords: airport.coords });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// geocodeViaMapbox — private Mapbox geocoding helper
// ---------------------------------------------------------------------------
async function geocodeViaMapbox(
  city: string,
  country: string,
  state?: string
): Promise<{ lat: number; lng: number; state?: string } | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.warn('[geocoding] MAPBOX_ACCESS_TOKEN not configured, skipping Mapbox lookup');
    return null;
  }

  const query = state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
    + `?access_token=${token}`
    + `&types=place,locality`
    + `&limit=1`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.features?.length) return null;

  const [lng, lat] = data.features[0].center;
  const stateMatch = data.features[0].context?.find(
    (c: { id: string; text: string }) => c.id.startsWith('region.')
  );

  return { lat, lng, state: stateMatch?.text };
}
