# GEO_CITIES — Build Spec for Drew
**Date:** April 8, 2026
**From:** Tim
**Goal:** Seed a `geo_cities` table with ~75,000–100,000 cities from GeoNames open data, wire up a three-tier geocoding lookup, add airport code resolution, and replace the hardcoded `CITY_COORDS` bottleneck so every city and airport in TourRouter resolves correctly.

**Why this matters now:** Cities, drive times, and airport lookups aren't resolving consistently in TourRouter. The root cause is that `CITY_COORDS` only covers ~170 cities and `CITY_AIRPORTS` only covers ~120. Any city outside those lists fails silently or falls through to an API call that may not return what we need. This fix gives us a proper database-backed lookup with ~75K–100K cities pre-loaded and a self-healing fallback for the long tail.

---

## What Already Exists (Don't Break These)

Drew — you've already built several pieces that this system needs to work alongside. **Do not remove or replace these. Layer on top.**

| What exists | Where | Keep it? |
|---|---|---|
| `CITY_COORDS` (~170 cities) | `lib/tourrouter/constants.ts` | **Yes** — becomes the fastest in-memory cache tier. Don't delete. |
| `CITY_AIRPORTS` (~120 cities) | `lib/tourrouter/constants.ts` | **Yes** — keep as fast fallback. Supplemented by `geo_cities.iata_code`. |
| `drive_cache` table | Supabase | **Yes** — Mapbox drive time cache. Untouched by this work. |
| `geocode_cache` table | Supabase | **Yes** — raw Mapbox geocode response cache. `geo_cities` is a *structured* lookup table, not a replacement. |
| `mapbox.ts` | `lib/tourrouter/mapbox.ts` | **Yes** — Mapbox Directions integration. Untouched. |
| `geography.ts` | `lib/tourrouter/geography.ts` | **Modified** — `getCityCoords()` updated to call the new three-tier lookup. |
| `flights.ts` | `lib/tourrouter/flights.ts` | **Modified** — `getAirport()` updated to check `geo_cities.iata_code`. |

### The lookup order after this build:

**For coordinates:**
```
1. In-memory cache (CITY_COORDS + runtime lookups)  →  instant
2. geo_cities table in Supabase                       →  <10ms with indexes
3. geocode_cache (existing Mapbox cache)              →  check before live call
4. Live Mapbox geocoding API                          →  write result back to geo_cities
5. null (flag for user to manually resolve)
```

**For airports:**
```
1. CITY_AIRPORTS constant                             →  instant
2. geo_cities.iata_code (if populated)                →  <10ms
3. Nearest-airport query on geo_cities                →  find closest city with an iata_code
4. null (no airport found — show "no airport" in UI)
```

---

---

# PART 1 — CLAUDE CODE AGENT SESSION (Mac Mini)

Everything in this section is what the Claude Code agent builds in a single session. Paste this entire document as the session context.

**Estimated time:** 2–3 hours

---

## Agent Task 1 — Write the SQL Migration File

Create `scripts/migrations/geo_cities.sql` containing the full migration. **The agent does NOT run this** — it just writes the file. Drew runs it manually in Supabase afterward.

```sql
-- Create the geo_cities lookup table
CREATE TABLE IF NOT EXISTS geo_cities (
  id              uuid primary key default gen_random_uuid(),
  geoname_id      integer,
  name            text not null,
  name_ascii      text,
  name_lower      text not null,
  state_province  text,
  state_code      text,
  country         text not null,           -- ISO 3166-1 alpha-2 (US, CA, GB, etc.)
  lat             numeric not null,
  lng             numeric not null,
  population      integer default 0,
  timezone        text,
  iata_code       text,                    -- airport code (JFK, LAX, LHR, etc.) — null for most cities
  source          text default 'geonames', -- 'geonames' | 'geocode_api' | 'manual' | 'airport_seed'
  created_at      timestamptz default now()
);

-- Indexes
CREATE INDEX idx_geo_cities_name_country ON geo_cities(name_lower, country);
CREATE INDEX idx_geo_cities_country_state ON geo_cities(country, state_province);
CREATE INDEX idx_geo_cities_coords ON geo_cities USING gist (
  point(lng::float8, lat::float8)
);
CREATE INDEX idx_geo_cities_population ON geo_cities(country, population DESC);
CREATE INDEX idx_geo_cities_geoname_id ON geo_cities(geoname_id);
CREATE INDEX idx_geo_cities_iata ON geo_cities(iata_code) WHERE iata_code IS NOT NULL;

-- RLS
ALTER TABLE geo_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON geo_cities
  FOR SELECT USING (true);

CREATE POLICY "authenticated_insert" ON geo_cities
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "service_role_all" ON geo_cities
  FOR ALL USING (true) WITH CHECK (true);

-- Nearest airport lookup function
CREATE OR REPLACE FUNCTION nearest_airport(
  search_lat float8,
  search_lng float8,
  max_distance_km float8 DEFAULT 150
)
RETURNS TABLE(
  name text,
  iata_code text,
  lat numeric,
  lng numeric,
  distance_km float8
)
LANGUAGE sql STABLE
AS $$
  SELECT
    name,
    iata_code,
    lat,
    lng,
    (point(search_lng, search_lat) <-> point(lng::float8, lat::float8)) * 111.32 AS distance_km
  FROM geo_cities
  WHERE iata_code IS NOT NULL
    AND (point(search_lng, search_lat) <-> point(lng::float8, lat::float8)) * 111.32 <= max_distance_km
  ORDER BY point(search_lng, search_lat) <-> point(lng::float8, lat::float8)
  LIMIT 1;
$$;
```

---

## Agent Task 2 — Create the Seed Script

Create `scripts/seed-geo-cities.ts`. This script downloads GeoNames data, parses it, and bulk inserts into Supabase.

**The agent writes and tests the script. Drew runs it manually afterward** (it needs internet access to download GeoNames files).

### Target countries and population thresholds:

```typescript
const TARGETS = [
  // North America — low threshold, touring bands play everywhere
  { code: 'US', minPop: 500 },
  { code: 'CA', minPop: 500 },
  { code: 'MX', minPop: 2000 },

  // UK + Ireland
  { code: 'GB', minPop: 500 },
  { code: 'IE', minPop: 300 },

  // Central/Western Europe
  { code: 'DE', minPop: 1000 },
  { code: 'FR', minPop: 1000 },
  { code: 'NL', minPop: 500 },
  { code: 'BE', minPop: 500 },
  { code: 'AT', minPop: 500 },
  { code: 'CH', minPop: 500 },
  { code: 'CZ', minPop: 1000 },
  { code: 'PL', minPop: 2000 },
  { code: 'HU', minPop: 1000 },
  { code: 'DK', minPop: 500 },
  { code: 'SE', minPop: 1000 },
  { code: 'NO', minPop: 500 },
  { code: 'FI', minPop: 1000 },
  { code: 'IT', minPop: 2000 },
  { code: 'ES', minPop: 2000 },
  { code: 'PT', minPop: 1000 },
  { code: 'LU', minPop: 200 },

  // South America
  { code: 'BR', minPop: 5000 },
  { code: 'AR', minPop: 2000 },
  { code: 'CL', minPop: 2000 },
  { code: 'CO', minPop: 3000 },
  { code: 'PE', minPop: 3000 },
  { code: 'EC', minPop: 2000 },
  { code: 'UY', minPop: 1000 },
  { code: 'PY', minPop: 2000 },
  { code: 'BO', minPop: 2000 },
  { code: 'VE', minPop: 3000 },
  { code: 'GY', minPop: 1000 },
  { code: 'SR', minPop: 1000 },
  { code: 'GF', minPop: 500 },

  // Asia-Pacific
  { code: 'JP', minPop: 5000 },
  { code: 'AU', minPop: 500 },
  { code: 'NZ', minPop: 300 },
];
```

### GeoNames file format:

Download URL: `https://download.geonames.org/export/dump/{COUNTRY_CODE}.zip`

Each zip contains `{COUNTRY_CODE}.txt` — tab-delimited, no header. Columns:

```
0  geonameid        : integer
1  name             : UTF-8 display name
2  asciiname        : ASCII-safe name
3  alternatenames   : comma-separated alternates
4  latitude         : float
5  longitude        : float
6  feature class    : char — we want 'P' (populated place)
7  feature code     : string (PPL, PPLA, PPLC, etc.)
8  country code     : ISO 2-letter
9  cc2              : alternate country codes
10 admin1 code      : state/province code
11 admin2 code      : county/district
12 admin3 code      : (unused)
13 admin4 code      : (unused)
14 population       : integer
15 elevation        : integer meters
16 dem              : digital elevation model
17 timezone         : timezone string
18 modification date: YYYY-MM-DD
```

### Admin1 codes (state/province names):

Download: `https://download.geonames.org/export/dump/admin1CodesASCII.txt`

Format: `{countryCode}.{admin1Code}\tname\tasciiName\tgeonameId`

Use this to populate both `state_province` (human-readable: "Texas") and `state_code` (short: "TX").

### Airport code seed phase:

Download: `https://davidmegginson.github.io/ourairports-data/airports.csv`

Filter to `type = 'large_airport' OR type = 'medium_airport'`. For each airport with an IATA code, find the closest city in `geo_cities` (by country + name match on `municipality`, falling back to nearest-coordinate match within 50km). Update that city's `iata_code` column. If no matching city exists, insert a new row with `source = 'airport_seed'`.

### Filtering rules:
- `feature_class === 'P'` only
- `population >= target.minPop`
- Skip rows where `name` is empty or lat/lng is 0

### Insert strategy:
- Batch inserts: 500 rows per batch via Supabase service role client
- **Idempotent:** Check if rows exist for that country code before inserting. If yes, skip (or delete first if `--force`).
- Log progress per country: `"US: 28,431 cities inserted"`
- Log total at end

### CLI:

```bash
# Seed all countries (cities + airports)
npx ts-node scripts/seed-geo-cities.ts

# Seed specific countries
npx ts-node scripts/seed-geo-cities.ts --countries US,CA,GB

# Force re-seed (deletes existing rows first)
npx ts-node scripts/seed-geo-cities.ts --force

# Dry run (parse and count, don't insert)
npx ts-node scripts/seed-geo-cities.ts --dry-run

# Airport codes only (if cities already seeded)
npx ts-node scripts/seed-geo-cities.ts --airports-only
```

### Environment:
Uses existing env vars: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

---

## Agent Task 3 — Create the Geocoding Utility

Create `lib/tourrouter/geocoding.ts` with three exported functions:

### getCityCoordinates()

Three-tier coordinate lookup: in-memory cache → geo_cities table → Mapbox API → write-back.

```typescript
import { CITY_COORDS } from './constants';

const coordsCache = new Map<string, { lat: number; lng: number }>();

// Pre-load CITY_COORDS into cache on module init
for (const [key, coords] of Object.entries(CITY_COORDS)) {
  coordsCache.set(key.toLowerCase(), coords);
}

export async function getCityCoordinates(
  city: string,
  country: string,
  state?: string
): Promise<{ lat: number; lng: number; source: string } | null> {

  // Tier 1 — in-memory cache
  const cacheKey = `${city.toLowerCase()}|${country.toUpperCase()}|${(state || '').toLowerCase()}`;
  const cached = coordsCache.get(cacheKey);
  if (cached) return { ...cached, source: 'cache' };

  // Also check old CITY_COORDS format ("City, ST" or "City")
  const legacyKey = state ? `${city}, ${state}` : city;
  const legacyCached = coordsCache.get(legacyKey.toLowerCase());
  if (legacyCached) return { ...legacyCached, source: 'cache' };

  // Tier 2 — geo_cities table
  const { data } = await supabase
    .from('geo_cities')
    .select('lat, lng, name, state_province, population')
    .eq('name_lower', city.toLowerCase())
    .eq('country', country.toUpperCase())
    .order('population', { ascending: false })
    .limit(5);

  if (data && data.length > 0) {
    const match = state
      ? data.find(d =>
          d.state_province?.toLowerCase() === state.toLowerCase() ||
          d.state_province?.toLowerCase().startsWith(state.toLowerCase())
        ) || data[0]
      : data[0];

    const result = { lat: Number(match.lat), lng: Number(match.lng) };
    coordsCache.set(cacheKey, result);
    return { ...result, source: 'geo_cities' };
  }

  // Tier 3 — Mapbox geocoding API → write back to geo_cities
  const geocoded = await geocodeViaMapbox(city, country, state);
  if (geocoded) {
    coordsCache.set(cacheKey, { lat: geocoded.lat, lng: geocoded.lng });

    // Write back so we never look this up again
    await supabase.from('geo_cities').insert({
      name: city,
      name_ascii: city.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      name_lower: city.toLowerCase(),
      state_province: state || geocoded.state || null,
      country: country.toUpperCase(),
      lat: geocoded.lat,
      lng: geocoded.lng,
      source: 'geocode_api',
    });

    return { lat: geocoded.lat, lng: geocoded.lng, source: 'geocode_api' };
  }

  return null;
}
```

### getAirportForCity()

Three-tier airport lookup: CITY_AIRPORTS constant → geo_cities.iata_code → nearest airport within 150km.

```typescript
export async function getAirportForCity(
  city: string,
  country: string,
  state?: string,
  coords?: { lat: number; lng: number }
): Promise<{ code: string; source: string } | null> {

  // Tier 1 — CITY_AIRPORTS constant
  const legacyKey = state ? `${city}, ${state}` : city;
  const legacyCode = CITY_AIRPORTS[legacyKey] || CITY_AIRPORTS[city];
  if (legacyCode) return { code: legacyCode, source: 'constant' };

  // Tier 2 — exact city match in geo_cities
  const { data: exact } = await supabase
    .from('geo_cities')
    .select('iata_code')
    .eq('name_lower', city.toLowerCase())
    .eq('country', country.toUpperCase())
    .not('iata_code', 'is', null)
    .limit(1);

  if (exact?.[0]?.iata_code) {
    return { code: exact[0].iata_code, source: 'geo_cities' };
  }

  // Tier 3 — nearest airport within 150km
  if (coords) {
    const { data: nearby } = await supabase
      .rpc('nearest_airport', {
        search_lat: coords.lat,
        search_lng: coords.lng,
        max_distance_km: 150,
      });

    if (nearby?.[0]?.iata_code) {
      return { code: nearby[0].iata_code, source: 'nearest' };
    }
  }

  return null;
}
```

### searchCities()

Autocomplete for city names — used in import mapping and manual show entry.

```typescript
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
  let q = supabase
    .from('geo_cities')
    .select('name, state_province, country, lat, lng, population, iata_code')
    .ilike('name_lower', `${query.toLowerCase()}%`)
    .order('population', { ascending: false })
    .limit(limit);

  if (country) q = q.eq('country', country.toUpperCase());

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
```

### Mapbox geocoding helper (private to this module):

```typescript
async function geocodeViaMapbox(
  city: string,
  country: string,
  state?: string
): Promise<{ lat: number; lng: number; state?: string } | null> {
  const query = state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
    + `?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`
    + `&types=place,locality`
    + `&limit=1`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.features?.length) return null;

  const [lng, lat] = data.features[0].center;
  const stateMatch = data.features[0].context?.find(
    (c: any) => c.id.startsWith('region.')
  );

  return { lat, lng, state: stateMatch?.text };
}
```

---

## Agent Task 4 — Create the API Route

Create `app/api/tourrouter/geocode/route.ts`:

```
GET /api/tourrouter/geocode?q=austin&country=US&limit=5
→ returns top matches from searchCities()

GET /api/tourrouter/geocode?q=austin&country=US&resolve=true
→ returns single best match from getCityCoordinates()
```

Standard auth check (Supabase session). Returns JSON.

---

## Agent Task 5 — Update geography.ts

Replace the internals of `getCityCoords()` to call `getCityCoordinates()` from the new `geocoding.ts`. **Keep the existing function signature** so nothing downstream breaks. The old `CITY_COORDS` lookup is now handled inside `getCityCoordinates()` as Tier 1.

---

## Agent Task 6 — Update flights.ts

Replace the internals of `getAirport()` to call `getAirportForCity()` from the new `geocoding.ts`. **Keep the existing function signature.** The old `CITY_AIRPORTS` lookup is now handled inside `getAirportForCity()` as Tier 1.

---

## Agent Task 7 — Update Import Flow

When CSV/PDF import has a city name, use `getCityCoordinates()` to resolve it. If it returns `null`, flag the row in the import preview so the user can manually enter coordinates or pick from autocomplete suggestions.

---

## Agent Task 8 — Add City Autocomplete to Show Entry Form

When the user types a city name in the show entry form, call `/api/tourrouter/geocode?q=...` for typeahead suggestions. On selection, auto-fill city, state, country, and coordinates. Also show airport code if available.

---

---

# PART 2 — DREW'S MANUAL STEPS (After Agent Session)

Everything below requires Drew's hands. The Claude Code agent can't do these — they need Supabase dashboard access, internet access, environment variable changes, or manual verification.

---

## Drew Step 1 — Run the SQL Migration

Open Supabase SQL Editor. Copy the contents of `scripts/migrations/geo_cities.sql` (written by the agent in Task 1). Run it. Verify the table, indexes, RLS policies, and `nearest_airport` function all created successfully.

**Verify:** In Supabase Table Editor, confirm `geo_cities` table exists with all columns. In SQL Editor, run `SELECT nearest_airport(30.267, -97.743, 50);` (Austin coords) — should return a result after seeding.

---

## Drew Step 2 — Verify Mapbox Token

The seed script and geocoding utility use `MAPBOX_ACCESS_TOKEN`. This should already be in `.env.local` and Vercel since you're using Mapbox for drive times. Confirm it's there:

```bash
grep MAPBOX_ACCESS_TOKEN .env.local
```

If missing, get it from your Mapbox dashboard and add to both `.env.local` and Vercel environment variables.

---

## Drew Step 3 — Run the Seed Script

**This must run locally on the Mac Mini** — it downloads ~40 country zip files from `download.geonames.org` plus the OurAirports CSV. Won't work in sandboxed environments.

```bash
# Dry run first — see what we'd insert without touching the DB
npx ts-node scripts/seed-geo-cities.ts --dry-run

# If counts look right, run for real
npx ts-node scripts/seed-geo-cities.ts

# Watch the output — should see per-country counts like:
# US: 28,431 cities inserted
# CA: 3,412 cities inserted
# GB: 6,102 cities inserted
# ...
# Airports: 1,187 IATA codes mapped
# Total: 87,234 rows
```

**Expected run time:** 10–20 minutes (mostly download time).

If anything fails partway through, it's safe to re-run — the script is idempotent (skips countries already seeded). Use `--force` to re-seed a country that had issues.

---

## Drew Step 4 — Verify Row Counts

Run in Supabase SQL Editor:

```sql
-- Total rows
SELECT count(*) FROM geo_cities;
-- Expected: 75,000–100,000

-- Per country (top 10)
SELECT country, count(*) as cities
FROM geo_cities
GROUP BY country
ORDER BY cities DESC
LIMIT 10;

-- Airport codes
SELECT count(*) FROM geo_cities WHERE iata_code IS NOT NULL;
-- Expected: ~1,200

-- Spot check: Austin TX
SELECT name, state_province, country, lat, lng, iata_code
FROM geo_cities
WHERE name_lower = 'austin' AND country = 'US';
-- Should show Austin, Texas, US with iata_code = 'AUS'

-- Spot check: Marfa TX (small town, pop ~1,700)
SELECT name, state_province, population
FROM geo_cities
WHERE name_lower = 'marfa' AND country = 'US';
-- Should exist (US threshold is 500)
```

---

## Drew Step 5 — Deploy and Test End-to-End

```bash
# Push to main — Vercel auto-deploys
git add .
git commit -m "feat: geo_cities seed + three-tier geocoding + airport lookup"
git push origin main
```

After deploy, test these scenarios in the live app:

| Test | What to check |
|---|---|
| Create a new tour, add a show in **Marfa, TX** | City resolves, coordinates populate, drive time calculates from previous show |
| Add a show in **Tromsø, Norway** | Unicode city name resolves correctly |
| Add a show in **Köln, Germany** | Alternate name handling — should resolve |
| Check a fly leg to **Wichita, KS** | Airport should resolve to ICT |
| Check a fly leg to **Asheville, NC** | Airport should resolve to AVL (nearest airport lookup) |
| Import a CSV with **St. Louis** | Should normalize and resolve |
| Import a CSV with a city not in GeoNames | Should fall through to Mapbox, then write back to geo_cities |
| Type "Aus" in show entry city field | Autocomplete should show Austin TX, Austin MN, Australian cities, etc. |

---

## Drew Step 6 — Verify Nothing Broke

These existing features should still work exactly as before:

- [ ] Drive times between known cities (Mapbox directions — untouched)
- [ ] Flight price lookups for common city pairs
- [ ] CSV import with the ~170 cities that were already in CITY_COORDS
- [ ] Financial calculations (nothing in calcTourFinancials changed)
- [ ] All existing tours load correctly

---

---

# REFERENCE — Expected Row Counts

| Region | Est. Cities |
|---|---|
| US | 25,000–30,000 |
| Canada | 3,000–4,000 |
| Mexico | 4,000–6,000 |
| UK + Ireland | 6,000–8,500 |
| Western/Central Europe | 10,000–15,000 |
| Scandinavia | 3,000–4,000 |
| Southern Europe (IT, ES, PT) | 4,000–6,000 |
| South America | 8,000–12,000 |
| Japan | 2,000–3,000 |
| Australia + NZ | 2,000–3,300 |
| **Total** | **~75,000–100,000 cities** |
| **Airports with IATA codes** | **~1,200** |

---

# REFERENCE — Edge Cases to Test

| Input | Expected Resolution |
|---|---|
| `St. Louis, MO` | Saint Louis, Missouri, US |
| `Köln, DE` | Cologne / Köln, Nordrhein-Westfalen, Germany |
| `Den Haag, NL` | The Hague, Zuid-Holland, Netherlands |
| `São Paulo, BR` | São Paulo, São Paulo, Brazil |
| `Bogotá, CO` | Bogotá, Bogotá D.C., Colombia |
| `Ft. Worth, TX` | Fort Worth, Texas, US |
| `NYC, US` | New York City, New York, US |
| `NOLA, US` | Should fail gracefully (abbreviation, not a city name) |
| `Marfa, TX` | Tiny town (pop ~1,700) — should be in US at minPop 500 |
| `Tromsø, NO` | Norwegian characters — should resolve |
| `Wichita, KS` (airport) | ICT |
| `Asheville, NC` (airport) | AVL via nearest-airport lookup |

---

*One-session agent build (Part 1) + Drew's manual steps afterward (Part 2). The agent writes all the code and wires everything together. Drew runs the migration, seeds the data from the Mac Mini, verifies counts, deploys, and tests. The geo_cities table lives in Supabase and is available to all environments immediately after seeding.*
