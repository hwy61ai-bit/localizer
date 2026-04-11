/**
 * Pure helper functions for geocoding, safe to import from both
 * server and client code. No Supabase, no next/headers, no server-only deps.
 */

export function cacheKey(city: string, country: string): string {
  return `${city.toLowerCase().trim()}|${country.toUpperCase().trim()}`;
}
