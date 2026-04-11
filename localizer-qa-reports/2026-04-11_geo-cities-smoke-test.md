# GEO_CITIES Smoke Test — 2026-04-11

## CHECK 1: Curated Seed Data — PASS

All three cities present in `scripts/seed-curated-cities.ts` with correct data:

| City | State | Country | Lat | Lng | IATA | Line |
|------|-------|---------|-----|-----|------|------|
| Miami | Florida | US | 25.7617 | -80.1918 | MIA | 125 |
| Austin | Texas | US | 30.2672 | -97.7431 | AUS | 97 |
| Philadelphia | Pennsylvania | US | 39.9526 | -75.1652 | PHL | 93 |

Coordinates cross-checked — all accurate to standard city-center values.

**Known-missing city:** Shreveport, LA (pop ~190k, IATA SHV). Not in the curated 332-city list. Suitable for testing Tier 2/3 fallback in Check 3 scenarios.

---

## CHECK 2: Geocoding Logic — PASS

### `lib/tourrouter/geocoding.ts`

**getCityCoordinates()** (line 48): Three-tier lookup confirmed:
- Tier 1: In-memory `coordsCache` (pre-loaded from `CITY_COORDS` constant), checks canonical key then legacy bare-city key
- Tier 2: `geo_cities` table query via `supabaseServer()`, with state disambiguation and population ordering
- Tier 3: `geocodeViaMapbox()` with write-back to `geo_cities` (non-blocking insert)

**getAirportForCity()** (line 122): Three-tier lookup confirmed:
- Tier 1: `CITY_AIRPORTS` constant (instant)
- Tier 2: `geo_cities.iata_code` exact city match, filtered by `not null`, population-ordered
- Tier 3: `nearest_airport` RPC within 150km

**Imports:** `supabaseServer` imported from `@/lib/supabaseServer` (server-only). `cacheKey` imported from `./geocoding-shared`. No client-safe module violations.

### `lib/tourrouter/geocoding-shared.ts`

Exports only `cacheKey(city, country)` — a pure string function. Zero imports. No server dependencies. PASS.

### `lib/tourrouter/index.ts`

Line 94: `export { cacheKey } from './geocoding-shared'` — re-exports only the pure helper. Server-only functions from `geocoding.ts` are NOT re-exported (commented out at line 90-91 with guidance to import directly). PASS.

### Client boundary in import page

`app/dashboard/routing/[tourId]/import/page.tsx` line 18: imports `cacheKey` from `@/lib/tourrouter/geocoding-shared` (not from `geocoding.ts`). No server-only leakage into the client bundle. PASS.

---

## CHECK 3: Unresolved City Flag — PASS

The amber NOT FOUND flag logic is at line 748 of `app/dashboard/routing/[tourId]/import/page.tsx`:

```tsx
const unresolved = !s.is_off && geoResolvedReady && s.city && s.country && geoResolved.get(geoCacheKey(s.city, s.country)) === false;
```

Rendering at lines 761-762:

```tsx
{unresolved && (
  <span style={{ marginLeft: 6, fontFamily: "var(--hw-font-mono)", fontSize: 9, letterSpacing: "1px", color: "var(--hw-amber)", textTransform: "uppercase" }}>&#9888; NOT FOUND</span>
)}
```

**Conditions verified:**
1. Skipped for OFF days (`!s.is_off`)
2. Only renders after geocode prefetch completes (`geoResolvedReady`)
3. Only renders when city+country are present
4. Only renders when `geoResolved.get(key) === false` — i.e., the prefetch API returned no coords for this city

Cities that resolve successfully get `true` in the map (line 137: `resolved.set(key, !!data.coords?.[key])`), so the flag does NOT render for them. PASS.

The cell also gets an amber background (`var(--hw-amber-ghost)`) when unresolved (line 759).

---

## Other Observations

1. **Write-back RLS check missing (line 100-111):** The Mapbox write-back in `getCityCoordinates()` uses `.insert()` without `.select().maybeSingle()` to verify the row was created. This is a fire-and-forget insert, so a silent RLS rejection would mean the city gets re-looked-up via Mapbox on every request. Not a data-correctness bug (the function still returns the correct coords), but it violates Non-negotiable Rule 6 and could cause repeated Mapbox API calls for the same city.

2. **Accent normalization TODO (line 97-99):** Documented in-code — `name_lower` stores accented forms, so unaccented queries won't match. Acknowledged as backlog.
