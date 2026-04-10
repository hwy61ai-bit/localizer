/**
 * scripts/seed-geo-cities.ts
 *
 * Seeds the geo_cities table from GeoNames open data + OurAirports.
 *
 * Usage:
 *   npx tsx scripts/seed-geo-cities.ts              # Seed all countries + airports
 *   npx tsx scripts/seed-geo-cities.ts --dry-run     # Parse and count, don't insert
 *   npx tsx scripts/seed-geo-cities.ts --force        # Delete existing rows first, then re-seed
 *   npx tsx scripts/seed-geo-cities.ts --countries US,CA,GB   # Seed specific countries only
 *   npx tsx scripts/seed-geo-cities.ts --airports-only        # Only run airport code phase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import Papa from 'papaparse';

// ---------------------------------------------------------------------------
// Load .env.local (no dotenv dependency)
// ---------------------------------------------------------------------------
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.local not found at', envPath);
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

// ---------------------------------------------------------------------------
// Supabase client (service role — bypasses RLS)
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Target countries and population thresholds
// ---------------------------------------------------------------------------
const TARGETS = [
  // North America
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

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const AIRPORTS_ONLY = args.includes('--airports-only');

let COUNTRY_FILTER: string[] | null = null;
const countriesIdx = args.indexOf('--countries');
if (countriesIdx >= 0 && args[countriesIdx + 1]) {
  COUNTRY_FILTER = args[countriesIdx + 1].toUpperCase().split(',');
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------
async function fetchBuffer(url: string): Promise<Buffer> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);
  const arrayBuf = await resp.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// ---------------------------------------------------------------------------
// Admin1 codes (state/province name lookup)
// ---------------------------------------------------------------------------
type Admin1Map = Record<string, { name: string; asciiName: string }>;

async function loadAdmin1Codes(): Promise<Admin1Map> {
  console.log('Downloading admin1 codes...');
  const buf = await fetchBuffer('https://download.geonames.org/export/dump/admin1CodesASCII.txt');
  const text = buf.toString('utf-8');
  const map: Admin1Map = {};

  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length >= 3) {
      map[parts[0]] = { name: parts[1], asciiName: parts[2] };
    }
  }

  // Fatal if empty — seed is meaningless without state/province names.
  // The real file has ~4,000 entries. Anything under 100 means the download
  // failed silently or returned garbage.
  if (Object.keys(map).length < 100) {
    console.error('ERROR: admin1 codes download returned too few entries (' + Object.keys(map).length + ').');
    console.error('Every city would get state_province: null. Aborting.');
    process.exit(1);
  }

  console.log(`  Loaded ${Object.keys(map).length} admin1 codes`);
  return map;
}

// ---------------------------------------------------------------------------
// Parse a single GeoNames country file
// ---------------------------------------------------------------------------
interface GeoCity {
  geoname_id: number;
  name: string;
  name_ascii: string;
  name_lower: string;
  state_province: string | null;
  state_code: string | null;
  country: string;
  lat: number;
  lng: number;
  population: number;
  timezone: string | null;
  source: string;
}

function parseGeoNamesFile(
  text: string,
  countryCode: string,
  minPop: number,
  admin1Map: Admin1Map
): GeoCity[] {
  const cities: GeoCity[] = [];

  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    if (cols.length < 19) continue;

    const featureClass = cols[6];
    if (featureClass !== 'P') continue;

    const population = parseInt(cols[14], 10) || 0;
    if (population < minPop) continue;

    const name = cols[1];
    const lat = parseFloat(cols[4]);
    const lng = parseFloat(cols[5]);

    if (!name || (lat === 0 && lng === 0)) continue;

    const admin1Code = cols[10];
    const admin1Key = `${countryCode}.${admin1Code}`;
    const admin1 = admin1Map[admin1Key];

    cities.push({
      geoname_id: parseInt(cols[0], 10),
      name,
      name_ascii: cols[2] || name,
      name_lower: name.toLowerCase(),
      state_province: admin1?.name || null,
      state_code: admin1Code || null,
      country: countryCode,
      lat,
      lng,
      population,
      timezone: cols[17] || null,
      source: 'geonames',
    });
  }

  return cities;
}

// ---------------------------------------------------------------------------
// Download and parse a country zip from GeoNames
// ---------------------------------------------------------------------------
async function downloadAndParseCountry(
  countryCode: string,
  minPop: number,
  admin1Map: Admin1Map
): Promise<GeoCity[]> {
  const url = `https://download.geonames.org/export/dump/${countryCode}.zip`;
  console.log(`  Downloading ${url}...`);

  const buf = await fetchBuffer(url);
  const zip = await JSZip.loadAsync(buf);
  const txtFile = zip.file(`${countryCode}.txt`);
  if (!txtFile) {
    console.warn(`  WARNING: ${countryCode}.txt not found in zip`);
    return [];
  }

  const text = await txtFile.async('string');
  return parseGeoNamesFile(text, countryCode, minPop, admin1Map);
}

// ---------------------------------------------------------------------------
// Batch insert into Supabase (500 rows per batch)
// ---------------------------------------------------------------------------
const BATCH_SIZE = 500;

async function batchInsert(cities: GeoCity[]): Promise<{ inserted: number; failed: number }> {
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < cities.length; i += BATCH_SIZE) {
    const batch = cities.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('geo_cities').insert(batch);

    if (error) {
      console.error(`  ⚠ Batch insert error at offset ${i}: ${error.message}`);
      failed += batch.length;
    } else {
      inserted += batch.length;
    }
  }

  return { inserted, failed };
}

// ---------------------------------------------------------------------------
// Country row count
// ---------------------------------------------------------------------------
async function countryRowCount(countryCode: string): Promise<number> {
  const { count } = await supabase
    .from('geo_cities')
    .select('id', { count: 'exact', head: true })
    .eq('country', countryCode);
  return count || 0;
}

// ---------------------------------------------------------------------------
// Delete existing rows for a country (used with --force)
// ---------------------------------------------------------------------------
async function deleteCountryRows(countryCode: string): Promise<void> {
  const { error } = await supabase
    .from('geo_cities')
    .delete()
    .eq('country', countryCode);

  if (error) {
    console.error(`  Error deleting rows for ${countryCode}:`, error.message);
  }
}

// ---------------------------------------------------------------------------
// Airport seed phase — in-memory matching against OurAirports CSV
//
// Strategy:
//   1. Load ALL geo_cities rows into memory (~75-100K rows, ~30-50 MB)
//   2. Build in-memory indexes: by name+country and by country
//   3. For each OurAirports airport with an IATA code:
//      a. Strategy 1: exact match on country + municipality name
//      b. Strategy 2: nearest city in bounding box (~55km), lat-corrected
//      c. Strategy 3: insert new row with source='airport_seed'
//   4. Batch-apply all updates and inserts via upsert/insert
// ---------------------------------------------------------------------------

interface CityRow {
  id: string;
  geoname_id: number | null;
  name: string;
  name_ascii: string | null;
  name_lower: string;
  state_province: string | null;
  state_code: string | null;
  country: string;
  lat: number;
  lng: number;
  population: number;
  timezone: string | null;
  iata_code: string | null;
  source: string | null;
  created_at: string | null;
}

async function loadAllCities(): Promise<CityRow[]> {
  const allCities: CityRow[] = [];
  let offset = 0;
  const PAGE_SIZE = 10000;

  while (true) {
    const { data, error } = await supabase
      .from('geo_cities')
      .select('id, geoname_id, name, name_ascii, name_lower, state_province, state_code, country, lat, lng, population, timezone, iata_code, source, created_at')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`Failed to load geo_cities: ${error.message}`);
    if (!data || data.length === 0) break;
    allCities.push(...(data as CityRow[]));
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allCities;
}

async function seedAirports(): Promise<number> {
  console.log('\n--- Airport Seed Phase ---');

  // Idempotency: skip if airports are already seeded unless explicitly requested
  if (!FORCE && !AIRPORTS_ONLY) {
    const { count } = await supabase
      .from('geo_cities')
      .select('id', { count: 'exact', head: true })
      .not('iata_code', 'is', null);

    if ((count || 0) > 500) {
      console.log(`  Skipping: ${(count || 0).toLocaleString()} cities already have IATA codes (use --airports-only or --force to re-run)`);
      return count || 0;
    }
  }

  const t0 = Date.now();
  console.log('  Building in-memory match index...');

  const allCities = await loadAllCities();
  console.log(`  Loaded ${allCities.length.toLocaleString()} cities into memory`);

  // Index: "COUNTRY|name_lower" -> cities sorted by population desc
  const cityByNameCountry = new Map<string, CityRow[]>();
  // Index: "COUNTRY" -> all cities for bounding-box fallback
  const citiesByCountry = new Map<string, CityRow[]>();
  // Index: id -> city (for building complete upsert payloads)
  const cityById = new Map<string, CityRow>();

  for (const city of allCities) {
    cityById.set(city.id, city);

    const nameKey = `${city.country}|${city.name_lower}`;
    let nameList = cityByNameCountry.get(nameKey);
    if (!nameList) { nameList = []; cityByNameCountry.set(nameKey, nameList); }
    nameList.push(city);

    let countryList = citiesByCountry.get(city.country);
    if (!countryList) { countryList = []; citiesByCountry.set(city.country, countryList); }
    countryList.push(city);
  }

  // Sort name groups by population desc for "pick the biggest city" logic
  for (const arr of cityByNameCountry.values()) {
    arr.sort((a, b) => b.population - a.population);
  }

  // Download OurAirports
  console.log('  Downloading OurAirports data...');
  const buf = await fetchBuffer('https://davidmegginson.github.io/ourairports-data/airports.csv');
  const text = buf.toString('utf-8');
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  const rows = parsed.data as Record<string, string>[];

  const airports = rows.filter(r =>
    (r.type === 'large_airport' || r.type === 'medium_airport') &&
    r.iata_code &&
    r.iata_code.trim().length > 0
  );

  console.log(`  Matching ${airports.length} airports...`);

  // Track which city IDs we've already assigned an IATA code to in this run,
  // so two airports don't claim the same city row.
  const assignedIds = new Set<string>();

  // Collect results: updates to existing rows and brand-new rows
  const updates: { id: string; iata_code: string }[] = [];
  const newRows: Array<{
    name: string; name_ascii: string; name_lower: string;
    country: string; lat: number; lng: number;
    iata_code: string; population: number; source: string;
  }> = [];

  let mapped = 0;

  for (const apt of airports) {
    const iata = apt.iata_code.trim().toUpperCase();
    const aptLat = parseFloat(apt.latitude_deg);
    const aptLng = parseFloat(apt.longitude_deg);
    const country = (apt.iso_country || '').toUpperCase();
    const municipality = (apt.municipality || '').trim();

    if (!iata || isNaN(aptLat) || isNaN(aptLng)) continue;

    if (DRY_RUN) { mapped++; continue; }

    let matched = false;

    // Strategy 1: exact match on country + municipality name (highest-pop, unassigned)
    if (municipality) {
      const nameKey = `${country}|${municipality.toLowerCase()}`;
      const candidates = cityByNameCountry.get(nameKey);
      if (candidates) {
        const city = candidates.find(c => !c.iata_code && !assignedIds.has(c.id));
        if (city) {
          updates.push({ id: city.id, iata_code: iata });
          assignedIds.add(city.id);
          mapped++;
          matched = true;
        }
      }
    }

    // Strategy 2: highest-population city within ~55km bounding box, lat-corrected.
    // ±0.5° lat ≈ 55km everywhere. Longitude degrees shrink with latitude:
    // 1° lng ≈ 111km * cos(lat). Scale lng window by 1/cos(lat) to keep ~55km.
    // Cap at ±2° to avoid blowup near poles.
    // Picks highest-population city, not geographically closest — airports
    // typically serve the largest nearby city (e.g. Asheville Regional -> Asheville,
    // not the nearest village).
    if (!matched) {
      const latWindow = 0.5;
      const cosLat = Math.cos(aptLat * Math.PI / 180);
      const lngWindow = Math.min(cosLat > 0.01 ? 0.5 / cosLat : 2, 2);

      const countryCities = citiesByCountry.get(country) || [];
      let bestCity: CityRow | null = null;
      let bestPop = -1;

      for (const c of countryCities) {
        if (c.iata_code || assignedIds.has(c.id)) continue;
        if (c.lat < aptLat - latWindow || c.lat > aptLat + latWindow) continue;
        if (c.lng < aptLng - lngWindow || c.lng > aptLng + lngWindow) continue;
        if (c.population > bestPop) {
          bestPop = c.population;
          bestCity = c;
        }
      }

      if (bestCity) {
        updates.push({ id: bestCity.id, iata_code: iata });
        assignedIds.add(bestCity.id);
        mapped++;
        matched = true;
      }
    }

    // Strategy 3: no matching city — queue a new row
    if (!matched) {
      const displayName = municipality || apt.name || iata;
      newRows.push({
        name: displayName,
        name_ascii: displayName,
        name_lower: displayName.toLowerCase(),
        country,
        lat: aptLat,
        lng: aptLng,
        iata_code: iata,
        population: 0,
        source: 'airport_seed',
      });
      mapped++;
    }
  }

  // Apply updates via upsert in batches.
  // Supabase upsert with onConflict='id' REPLACES the row with the payload,
  // so we must carry ALL columns through unchanged — otherwise columns not in
  // the payload (state_province, population, timezone, etc.) would be wiped to
  // NULL/default. Only iata_code gets a new value.
  if (updates.length > 0 && !DRY_RUN) {
    console.log(`  Applying ${updates.length} IATA code updates...`);
    let updateFailed = 0;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      const payloads = batch.map(u => {
        const city = cityById.get(u.id)!;
        return {
          id: city.id,
          geoname_id: city.geoname_id,
          name: city.name,
          name_ascii: city.name_ascii,
          name_lower: city.name_lower,
          state_province: city.state_province,
          state_code: city.state_code,
          country: city.country,
          lat: city.lat,
          lng: city.lng,
          population: city.population,
          timezone: city.timezone,
          iata_code: u.iata_code,  // only field that changes
          source: city.source,
          created_at: city.created_at,
        };
      });
      const { error } = await supabase
        .from('geo_cities')
        .upsert(payloads, { onConflict: 'id' });
      if (error) {
        console.error(`  ⚠ Airport upsert error at offset ${i}: ${error.message}`);
        updateFailed += batch.length;
      }
    }
    if (updateFailed > 0) {
      console.error(`  ⚠ ${updateFailed} airport updates failed`);
    }
  }

  // Insert new airport-only rows in batches
  if (newRows.length > 0 && !DRY_RUN) {
    console.log(`  Inserting ${newRows.length} new airport city rows...`);
    let insertFailed = 0;
    for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
      const batch = newRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('geo_cities').insert(batch);
      if (error) {
        console.error(`  ⚠ Airport insert error at offset ${i}: ${error.message}`);
        insertFailed += batch.length;
      }
    }
    if (insertFailed > 0) {
      console.error(`  ⚠ ${insertFailed} airport inserts failed`);
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`  Mapped ${mapped} airports in ${elapsed}s (${updates.length} updated, ${newRows.length} new rows)`);
  return mapped;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== geo_cities seed script ===');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : FORCE ? 'FORCE (re-seed)' : 'normal'}`);
  if (COUNTRY_FILTER) console.log(`  Countries: ${COUNTRY_FILTER.join(', ')}`);
  if (AIRPORTS_ONLY) console.log(`  Airports only`);
  console.log('');

  const countriesWithErrors: string[] = [];

  // --airports-only skips city seeding
  if (!AIRPORTS_ONLY) {
    const admin1Map = await loadAdmin1Codes();
    const targets = COUNTRY_FILTER
      ? TARGETS.filter(t => COUNTRY_FILTER!.includes(t.code))
      : TARGETS;

    if (targets.length === 0) {
      console.error('ERROR: No matching countries found for filter:', COUNTRY_FILTER);
      process.exit(1);
    }

    let totalInserted = 0;

    for (const target of targets) {
      const { code, minPop } = target;
      console.log(`\n--- ${code} (minPop: ${minPop.toLocaleString()}) ---`);

      // Idempotency: skip countries that already have rows from a prior successful run.
      // If a prior run failed partway through a country, the script would have exited
      // non-zero (see batch failure handling below), signaling the operator to re-run
      // with --force for that country. So "rows exist" = "prior run completed cleanly."
      const existing = await countryRowCount(code);
      if (existing > 0 && !FORCE) {
        console.log(`  Skipping: ${existing.toLocaleString()} rows already exist (use --force to re-seed)`);
        continue;
      }

      if (existing > 0 && FORCE) {
        console.log(`  Deleting ${existing.toLocaleString()} existing rows (--force)...`);
        if (!DRY_RUN) {
          await deleteCountryRows(code);
        }
      }

      try {
        const cities = await downloadAndParseCountry(code, minPop, admin1Map);
        console.log(`  Parsed: ${cities.length.toLocaleString()} cities`);

        if (DRY_RUN) {
          totalInserted += cities.length;
          continue;
        }

        const { inserted, failed } = await batchInsert(cities);
        console.log(`  ${code}: ${inserted.toLocaleString()} cities inserted`);
        totalInserted += inserted;

        // Any batch failure leaves the country in a partial state. Track it so
        // we exit non-zero — the operator needs to re-run with --force for this country.
        if (failed > 0) {
          console.error(`  ⚠ WARNING: ${failed.toLocaleString()} rows FAILED to insert for ${code}. Country is incomplete.`);
          console.error(`    Re-run with: npx tsx scripts/seed-geo-cities.ts --force --countries ${code}`);
          countriesWithErrors.push(code);
        }
      } catch (err) {
        console.error(`  ERROR processing ${code}:`, err instanceof Error ? err.message : err);
        countriesWithErrors.push(code);
      }
    }

    console.log(`\n=== Cities total: ${totalInserted.toLocaleString()} rows ${DRY_RUN ? '(dry run)' : 'inserted'} ===`);
  }

  // Airport seed phase
  const airportsMapped = await seedAirports();
  console.log(`\n=== Done. Airports: ${airportsMapped.toLocaleString()} IATA codes mapped ===`);

  // Exit non-zero if any countries had errors
  if (countriesWithErrors.length > 0) {
    console.error(`\n⚠ INCOMPLETE: ${countriesWithErrors.join(', ')} had errors. Re-run with --force --countries ${countriesWithErrors.join(',')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
