/**
 * scripts/seed-curated-cities.ts
 *
 * Seeds the geo_cities table with a hand-curated list of touring-relevant
 * cities worldwide. Replaces the earlier GeoNames-based seed, which produced
 * too many tiny towns and had data quality issues with major city coverage
 * and airport assignments.
 *
 * Coverage targets:
 *   - US: ~150 major touring markets (every real venue city)
 *   - Canada: ~20 touring stops
 *   - UK + Ireland: ~30 cities
 *   - Continental Europe: ~100 cities (dense, per Tim's request)
 *   - Japan: ~10 cities
 *   - Australia + NZ: ~14 cities
 *
 * Each row has verified coordinates, primary commercial airport IATA code,
 * and clean metadata. Lookup order in geocoding.ts:
 *   Tier 1: CITY_COORDS in-memory constant (~170 cities, already shipped)
 *   Tier 2: geo_cities table (this seed)
 *   Tier 3: Mapbox API fallback (long tail, caches back to geo_cities)
 *
 * Usage:
 *   npx tsx scripts/seed-curated-cities.ts              # Seed all cities
 *   npx tsx scripts/seed-curated-cities.ts --dry-run    # Parse and count, no writes
 *   npx tsx scripts/seed-curated-cities.ts --force      # Wipe and re-seed
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvLocal();

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
// Types
// ---------------------------------------------------------------------------
interface CuratedCity {
  name: string;
  state_province: string | null;
  country: string;          // ISO 3166-1 alpha-2
  lat: number;
  lng: number;
  population: number;
  timezone: string;
  iata_code: string | null; // primary commercial airport
}

// ---------------------------------------------------------------------------
// UNITED STATES — ~150 cities
// Every major touring market plus significant regional markets.
// ---------------------------------------------------------------------------
const UNITED_STATES: CuratedCity[] = [
  // Top 25 metros
  { name: 'New York City', state_province: 'New York', country: 'US', lat: 40.7128, lng: -74.0060, population: 8_336_000, timezone: 'America/New_York', iata_code: 'JFK' },
  { name: 'Los Angeles', state_province: 'California', country: 'US', lat: 34.0522, lng: -118.2437, population: 3_979_000, timezone: 'America/Los_Angeles', iata_code: 'LAX' },
  { name: 'Chicago', state_province: 'Illinois', country: 'US', lat: 41.8781, lng: -87.6298, population: 2_693_000, timezone: 'America/Chicago', iata_code: 'ORD' },
  { name: 'Houston', state_province: 'Texas', country: 'US', lat: 29.7604, lng: -95.3698, population: 2_320_000, timezone: 'America/Chicago', iata_code: 'IAH' },
  { name: 'Phoenix', state_province: 'Arizona', country: 'US', lat: 33.4484, lng: -112.0740, population: 1_680_000, timezone: 'America/Phoenix', iata_code: 'PHX' },
  { name: 'Philadelphia', state_province: 'Pennsylvania', country: 'US', lat: 39.9526, lng: -75.1652, population: 1_584_000, timezone: 'America/New_York', iata_code: 'PHL' },
  { name: 'San Antonio', state_province: 'Texas', country: 'US', lat: 29.4241, lng: -98.4936, population: 1_547_000, timezone: 'America/Chicago', iata_code: 'SAT' },
  { name: 'San Diego', state_province: 'California', country: 'US', lat: 32.7157, lng: -117.1611, population: 1_423_000, timezone: 'America/Los_Angeles', iata_code: 'SAN' },
  { name: 'Dallas', state_province: 'Texas', country: 'US', lat: 32.7767, lng: -96.7970, population: 1_343_000, timezone: 'America/Chicago', iata_code: 'DFW' },
  { name: 'Austin', state_province: 'Texas', country: 'US', lat: 30.2672, lng: -97.7431, population: 978_000, timezone: 'America/Chicago', iata_code: 'AUS' },
  { name: 'Jacksonville', state_province: 'Florida', country: 'US', lat: 30.3322, lng: -81.6557, population: 911_000, timezone: 'America/New_York', iata_code: 'JAX' },
  { name: 'Fort Worth', state_province: 'Texas', country: 'US', lat: 32.7555, lng: -97.3308, population: 909_000, timezone: 'America/Chicago', iata_code: 'DFW' },
  { name: 'Columbus', state_province: 'Ohio', country: 'US', lat: 39.9612, lng: -82.9988, population: 898_000, timezone: 'America/New_York', iata_code: 'CMH' },
  { name: 'Indianapolis', state_province: 'Indiana', country: 'US', lat: 39.7684, lng: -86.1581, population: 876_000, timezone: 'America/Indiana/Indianapolis', iata_code: 'IND' },
  { name: 'Charlotte', state_province: 'North Carolina', country: 'US', lat: 35.2271, lng: -80.8431, population: 885_000, timezone: 'America/New_York', iata_code: 'CLT' },
  { name: 'San Francisco', state_province: 'California', country: 'US', lat: 37.7749, lng: -122.4194, population: 881_000, timezone: 'America/Los_Angeles', iata_code: 'SFO' },
  { name: 'Seattle', state_province: 'Washington', country: 'US', lat: 47.6062, lng: -122.3321, population: 753_000, timezone: 'America/Los_Angeles', iata_code: 'SEA' },
  { name: 'Denver', state_province: 'Colorado', country: 'US', lat: 39.7392, lng: -104.9903, population: 727_000, timezone: 'America/Denver', iata_code: 'DEN' },
  { name: 'Washington', state_province: 'District of Columbia', country: 'US', lat: 38.9072, lng: -77.0369, population: 705_000, timezone: 'America/New_York', iata_code: 'DCA' },
  { name: 'Boston', state_province: 'Massachusetts', country: 'US', lat: 42.3601, lng: -71.0589, population: 692_000, timezone: 'America/New_York', iata_code: 'BOS' },
  { name: 'Nashville', state_province: 'Tennessee', country: 'US', lat: 36.1627, lng: -86.7816, population: 670_000, timezone: 'America/Chicago', iata_code: 'BNA' },
  { name: 'Portland', state_province: 'Oregon', country: 'US', lat: 45.5152, lng: -122.6784, population: 654_000, timezone: 'America/Los_Angeles', iata_code: 'PDX' },
  { name: 'Oklahoma City', state_province: 'Oklahoma', country: 'US', lat: 35.4676, lng: -97.5164, population: 655_000, timezone: 'America/Chicago', iata_code: 'OKC' },
  { name: 'Las Vegas', state_province: 'Nevada', country: 'US', lat: 36.1699, lng: -115.1398, population: 651_000, timezone: 'America/Los_Angeles', iata_code: 'LAS' },
  { name: 'Detroit', state_province: 'Michigan', country: 'US', lat: 42.3314, lng: -83.0458, population: 670_000, timezone: 'America/Detroit', iata_code: 'DTW' },
  { name: 'Memphis', state_province: 'Tennessee', country: 'US', lat: 35.1495, lng: -90.0490, population: 633_000, timezone: 'America/Chicago', iata_code: 'MEM' },
  { name: 'Louisville', state_province: 'Kentucky', country: 'US', lat: 38.2527, lng: -85.7585, population: 617_000, timezone: 'America/New_York', iata_code: 'SDF' },
  { name: 'Baltimore', state_province: 'Maryland', country: 'US', lat: 39.2904, lng: -76.6122, population: 602_000, timezone: 'America/New_York', iata_code: 'BWI' },
  { name: 'Milwaukee', state_province: 'Wisconsin', country: 'US', lat: 43.0389, lng: -87.9065, population: 590_000, timezone: 'America/Chicago', iata_code: 'MKE' },
  { name: 'Albuquerque', state_province: 'New Mexico', country: 'US', lat: 35.0844, lng: -106.6504, population: 560_000, timezone: 'America/Denver', iata_code: 'ABQ' },

  // Major regional cities
  { name: 'Tucson', state_province: 'Arizona', country: 'US', lat: 32.2226, lng: -110.9747, population: 548_000, timezone: 'America/Phoenix', iata_code: 'TUS' },
  { name: 'Fresno', state_province: 'California', country: 'US', lat: 36.7378, lng: -119.7871, population: 542_000, timezone: 'America/Los_Angeles', iata_code: 'FAT' },
  { name: 'Sacramento', state_province: 'California', country: 'US', lat: 38.5816, lng: -121.4944, population: 513_000, timezone: 'America/Los_Angeles', iata_code: 'SMF' },
  { name: 'Atlanta', state_province: 'Georgia', country: 'US', lat: 33.7490, lng: -84.3880, population: 498_000, timezone: 'America/New_York', iata_code: 'ATL' },
  { name: 'Kansas City', state_province: 'Missouri', country: 'US', lat: 39.0997, lng: -94.5786, population: 495_000, timezone: 'America/Chicago', iata_code: 'MCI' },
  { name: 'Miami', state_province: 'Florida', country: 'US', lat: 25.7617, lng: -80.1918, population: 467_000, timezone: 'America/New_York', iata_code: 'MIA' },
  { name: 'Raleigh', state_province: 'North Carolina', country: 'US', lat: 35.7796, lng: -78.6382, population: 474_000, timezone: 'America/New_York', iata_code: 'RDU' },
  { name: 'Omaha', state_province: 'Nebraska', country: 'US', lat: 41.2565, lng: -95.9345, population: 478_000, timezone: 'America/Chicago', iata_code: 'OMA' },
  { name: 'Minneapolis', state_province: 'Minnesota', country: 'US', lat: 44.9778, lng: -93.2650, population: 429_000, timezone: 'America/Chicago', iata_code: 'MSP' },
  { name: 'Tulsa', state_province: 'Oklahoma', country: 'US', lat: 36.1540, lng: -95.9928, population: 401_000, timezone: 'America/Chicago', iata_code: 'TUL' },
  { name: 'Cleveland', state_province: 'Ohio', country: 'US', lat: 41.4993, lng: -81.6944, population: 381_000, timezone: 'America/New_York', iata_code: 'CLE' },
  { name: 'Wichita', state_province: 'Kansas', country: 'US', lat: 37.6872, lng: -97.3301, population: 390_000, timezone: 'America/Chicago', iata_code: 'ICT' },
  { name: 'New Orleans', state_province: 'Louisiana', country: 'US', lat: 29.9511, lng: -90.0715, population: 390_000, timezone: 'America/Chicago', iata_code: 'MSY' },
  { name: 'Tampa', state_province: 'Florida', country: 'US', lat: 27.9506, lng: -82.4572, population: 399_000, timezone: 'America/New_York', iata_code: 'TPA' },
  { name: 'Honolulu', state_province: 'Hawaii', country: 'US', lat: 21.3099, lng: -157.8581, population: 345_000, timezone: 'Pacific/Honolulu', iata_code: 'HNL' },
  { name: 'Orlando', state_province: 'Florida', country: 'US', lat: 28.5383, lng: -81.3792, population: 307_000, timezone: 'America/New_York', iata_code: 'MCO' },
  { name: 'Pittsburgh', state_province: 'Pennsylvania', country: 'US', lat: 40.4406, lng: -79.9959, population: 302_000, timezone: 'America/New_York', iata_code: 'PIT' },
  { name: 'Cincinnati', state_province: 'Ohio', country: 'US', lat: 39.1031, lng: -84.5120, population: 303_000, timezone: 'America/New_York', iata_code: 'CVG' },
  { name: 'St. Louis', state_province: 'Missouri', country: 'US', lat: 38.6270, lng: -90.1994, population: 301_000, timezone: 'America/Chicago', iata_code: 'STL' },
  { name: 'Salt Lake City', state_province: 'Utah', country: 'US', lat: 40.7608, lng: -111.8910, population: 200_000, timezone: 'America/Denver', iata_code: 'SLC' },
  { name: 'Anchorage', state_province: 'Alaska', country: 'US', lat: 61.2181, lng: -149.9003, population: 291_000, timezone: 'America/Anchorage', iata_code: 'ANC' },

  // Secondary touring markets (mid-size cities with real venue scenes)
  { name: 'Buffalo', state_province: 'New York', country: 'US', lat: 42.8864, lng: -78.8784, population: 255_000, timezone: 'America/New_York', iata_code: 'BUF' },
  { name: 'Richmond', state_province: 'Virginia', country: 'US', lat: 37.5407, lng: -77.4360, population: 230_000, timezone: 'America/New_York', iata_code: 'RIC' },
  { name: 'Norfolk', state_province: 'Virginia', country: 'US', lat: 36.8508, lng: -76.2859, population: 244_000, timezone: 'America/New_York', iata_code: 'ORF' },
  { name: 'Rochester', state_province: 'New York', country: 'US', lat: 43.1566, lng: -77.6088, population: 205_000, timezone: 'America/New_York', iata_code: 'ROC' },
  { name: 'Madison', state_province: 'Wisconsin', country: 'US', lat: 43.0731, lng: -89.4012, population: 269_000, timezone: 'America/Chicago', iata_code: 'MSN' },
  { name: 'Des Moines', state_province: 'Iowa', country: 'US', lat: 41.5868, lng: -93.6250, population: 214_000, timezone: 'America/Chicago', iata_code: 'DSM' },
  { name: 'Spokane', state_province: 'Washington', country: 'US', lat: 47.6588, lng: -117.4260, population: 228_000, timezone: 'America/Los_Angeles', iata_code: 'GEG' },
  { name: 'Boise', state_province: 'Idaho', country: 'US', lat: 43.6150, lng: -116.2023, population: 235_000, timezone: 'America/Boise', iata_code: 'BOI' },
  { name: 'Birmingham', state_province: 'Alabama', country: 'US', lat: 33.5186, lng: -86.8104, population: 209_000, timezone: 'America/Chicago', iata_code: 'BHM' },
  { name: 'Knoxville', state_province: 'Tennessee', country: 'US', lat: 35.9606, lng: -83.9207, population: 187_000, timezone: 'America/New_York', iata_code: 'TYS' },
  { name: 'Chattanooga', state_province: 'Tennessee', country: 'US', lat: 35.0456, lng: -85.3097, population: 181_000, timezone: 'America/New_York', iata_code: 'CHA' },
  { name: 'Grand Rapids', state_province: 'Michigan', country: 'US', lat: 42.9634, lng: -85.6681, population: 199_000, timezone: 'America/Detroit', iata_code: 'GRR' },
  { name: 'Providence', state_province: 'Rhode Island', country: 'US', lat: 41.8240, lng: -71.4128, population: 180_000, timezone: 'America/New_York', iata_code: 'PVD' },
  { name: 'Worcester', state_province: 'Massachusetts', country: 'US', lat: 42.2626, lng: -71.8023, population: 185_000, timezone: 'America/New_York', iata_code: 'ORH' },
  { name: 'Hartford', state_province: 'Connecticut', country: 'US', lat: 41.7658, lng: -72.6734, population: 123_000, timezone: 'America/New_York', iata_code: 'BDL' },
  { name: 'New Haven', state_province: 'Connecticut', country: 'US', lat: 41.3083, lng: -72.9279, population: 134_000, timezone: 'America/New_York', iata_code: 'HVN' },
  { name: 'Albany', state_province: 'New York', country: 'US', lat: 42.6526, lng: -73.7562, population: 96_000, timezone: 'America/New_York', iata_code: 'ALB' },
  { name: 'Syracuse', state_province: 'New York', country: 'US', lat: 43.0481, lng: -76.1474, population: 142_000, timezone: 'America/New_York', iata_code: 'SYR' },
  { name: 'Asheville', state_province: 'North Carolina', country: 'US', lat: 35.5951, lng: -82.5515, population: 94_000, timezone: 'America/New_York', iata_code: 'AVL' },
  { name: 'Greensboro', state_province: 'North Carolina', country: 'US', lat: 36.0726, lng: -79.7920, population: 299_000, timezone: 'America/New_York', iata_code: 'GSO' },
  { name: 'Charleston', state_province: 'South Carolina', country: 'US', lat: 32.7765, lng: -79.9311, population: 150_000, timezone: 'America/New_York', iata_code: 'CHS' },
  { name: 'Savannah', state_province: 'Georgia', country: 'US', lat: 32.0809, lng: -81.0912, population: 148_000, timezone: 'America/New_York', iata_code: 'SAV' },
  { name: 'Athens', state_province: 'Georgia', country: 'US', lat: 33.9519, lng: -83.3576, population: 127_000, timezone: 'America/New_York', iata_code: null }, // VERIFY: nearest is ATL
  { name: 'Columbia', state_province: 'South Carolina', country: 'US', lat: 34.0007, lng: -81.0348, population: 136_000, timezone: 'America/New_York', iata_code: 'CAE' },
  { name: 'Gainesville', state_province: 'Florida', country: 'US', lat: 29.6516, lng: -82.3248, population: 141_000, timezone: 'America/New_York', iata_code: 'GNV' },
  { name: 'Tallahassee', state_province: 'Florida', country: 'US', lat: 30.4383, lng: -84.2807, population: 196_000, timezone: 'America/New_York', iata_code: 'TLH' },
  { name: 'Jackson', state_province: 'Mississippi', country: 'US', lat: 32.2988, lng: -90.1848, population: 150_000, timezone: 'America/Chicago', iata_code: 'JAN' },
  { name: 'Little Rock', state_province: 'Arkansas', country: 'US', lat: 34.7465, lng: -92.2896, population: 198_000, timezone: 'America/Chicago', iata_code: 'LIT' },
  { name: 'Lexington', state_province: 'Kentucky', country: 'US', lat: 38.0406, lng: -84.5037, population: 322_000, timezone: 'America/New_York', iata_code: 'LEX' },
  { name: 'Fayetteville', state_province: 'Arkansas', country: 'US', lat: 36.0822, lng: -94.1719, population: 93_000, timezone: 'America/Chicago', iata_code: 'XNA' },

  // College towns + music markets
  { name: 'Ann Arbor', state_province: 'Michigan', country: 'US', lat: 42.2808, lng: -83.7430, population: 123_000, timezone: 'America/Detroit', iata_code: null }, // nearest DTW
  { name: 'Bloomington', state_province: 'Indiana', country: 'US', lat: 39.1653, lng: -86.5264, population: 80_000, timezone: 'America/Indiana/Indianapolis', iata_code: null }, // nearest IND
  { name: 'Iowa City', state_province: 'Iowa', country: 'US', lat: 41.6611, lng: -91.5302, population: 76_000, timezone: 'America/Chicago', iata_code: null }, // nearest CID
  { name: 'Lawrence', state_province: 'Kansas', country: 'US', lat: 38.9717, lng: -95.2353, population: 98_000, timezone: 'America/Chicago', iata_code: null }, // nearest MCI
  { name: 'Columbia', state_province: 'Missouri', country: 'US', lat: 38.9517, lng: -92.3341, population: 126_000, timezone: 'America/Chicago', iata_code: 'COU' },
  { name: 'Ithaca', state_province: 'New York', country: 'US', lat: 42.4440, lng: -76.5019, population: 31_000, timezone: 'America/New_York', iata_code: 'ITH' },
  { name: 'State College', state_province: 'Pennsylvania', country: 'US', lat: 40.7934, lng: -77.8600, population: 41_000, timezone: 'America/New_York', iata_code: 'UNV' },
  { name: 'Burlington', state_province: 'Vermont', country: 'US', lat: 44.4759, lng: -73.2121, population: 44_000, timezone: 'America/New_York', iata_code: 'BTV' },
  { name: 'Portland', state_province: 'Maine', country: 'US', lat: 43.6591, lng: -70.2568, population: 66_000, timezone: 'America/New_York', iata_code: 'PWM' },
  { name: 'Manchester', state_province: 'New Hampshire', country: 'US', lat: 42.9956, lng: -71.4548, population: 115_000, timezone: 'America/New_York', iata_code: 'MHT' },

  // Texas Triangle + Gulf Coast
  { name: 'El Paso', state_province: 'Texas', country: 'US', lat: 31.7619, lng: -106.4850, population: 681_000, timezone: 'America/Denver', iata_code: 'ELP' },
  { name: 'Corpus Christi', state_province: 'Texas', country: 'US', lat: 27.8006, lng: -97.3964, population: 326_000, timezone: 'America/Chicago', iata_code: 'CRP' },
  { name: 'Lubbock', state_province: 'Texas', country: 'US', lat: 33.5779, lng: -101.8552, population: 258_000, timezone: 'America/Chicago', iata_code: 'LBB' },
  { name: 'McAllen', state_province: 'Texas', country: 'US', lat: 26.2034, lng: -98.2300, population: 143_000, timezone: 'America/Chicago', iata_code: 'MFE' },
  { name: 'Waco', state_province: 'Texas', country: 'US', lat: 31.5493, lng: -97.1467, population: 139_000, timezone: 'America/Chicago', iata_code: 'ACT' },
  { name: 'Amarillo', state_province: 'Texas', country: 'US', lat: 35.2220, lng: -101.8313, population: 200_000, timezone: 'America/Chicago', iata_code: 'AMA' },

  // Mountain West
  { name: 'Missoula', state_province: 'Montana', country: 'US', lat: 46.8721, lng: -113.9940, population: 75_000, timezone: 'America/Denver', iata_code: 'MSO' },
  { name: 'Bozeman', state_province: 'Montana', country: 'US', lat: 45.6770, lng: -111.0429, population: 53_000, timezone: 'America/Denver', iata_code: 'BZN' },
  { name: 'Billings', state_province: 'Montana', country: 'US', lat: 45.7833, lng: -108.5007, population: 110_000, timezone: 'America/Denver', iata_code: 'BIL' },
  { name: 'Jackson', state_province: 'Wyoming', country: 'US', lat: 43.4799, lng: -110.7624, population: 10_000, timezone: 'America/Denver', iata_code: 'JAC' },
  { name: 'Cheyenne', state_province: 'Wyoming', country: 'US', lat: 41.1400, lng: -104.8202, population: 65_000, timezone: 'America/Denver', iata_code: 'CYS' },
  { name: 'Aspen', state_province: 'Colorado', country: 'US', lat: 39.1911, lng: -106.8175, population: 7_000, timezone: 'America/Denver', iata_code: 'ASE' },
  { name: 'Colorado Springs', state_province: 'Colorado', country: 'US', lat: 38.8339, lng: -104.8214, population: 478_000, timezone: 'America/Denver', iata_code: 'COS' },
  { name: 'Fort Collins', state_province: 'Colorado', country: 'US', lat: 40.5853, lng: -105.0844, population: 169_000, timezone: 'America/Denver', iata_code: null }, // nearest DEN
  { name: 'Santa Fe', state_province: 'New Mexico', country: 'US', lat: 35.6870, lng: -105.9378, population: 84_000, timezone: 'America/Denver', iata_code: 'SAF' },
  { name: 'Flagstaff', state_province: 'Arizona', country: 'US', lat: 35.1983, lng: -111.6513, population: 76_000, timezone: 'America/Phoenix', iata_code: 'FLG' },

  // California (beyond top 5)
  { name: 'Oakland', state_province: 'California', country: 'US', lat: 37.8044, lng: -122.2712, population: 433_000, timezone: 'America/Los_Angeles', iata_code: 'OAK' },
  { name: 'San Jose', state_province: 'California', country: 'US', lat: 37.3382, lng: -121.8863, population: 1_021_000, timezone: 'America/Los_Angeles', iata_code: 'SJC' },
  { name: 'Santa Cruz', state_province: 'California', country: 'US', lat: 36.9741, lng: -122.0308, population: 65_000, timezone: 'America/Los_Angeles', iata_code: null }, // nearest SJC
  { name: 'Santa Barbara', state_province: 'California', country: 'US', lat: 34.4208, lng: -119.6982, population: 91_000, timezone: 'America/Los_Angeles', iata_code: 'SBA' },
  { name: 'Long Beach', state_province: 'California', country: 'US', lat: 33.7701, lng: -118.1937, population: 462_000, timezone: 'America/Los_Angeles', iata_code: 'LGB' },
  { name: 'Anaheim', state_province: 'California', country: 'US', lat: 33.8366, lng: -117.9143, population: 350_000, timezone: 'America/Los_Angeles', iata_code: 'SNA' },
  { name: 'Bakersfield', state_province: 'California', country: 'US', lat: 35.3733, lng: -119.0187, population: 384_000, timezone: 'America/Los_Angeles', iata_code: 'BFL' },
  { name: 'Riverside', state_province: 'California', country: 'US', lat: 33.9533, lng: -117.3962, population: 331_000, timezone: 'America/Los_Angeles', iata_code: 'ONT' },
  { name: 'Ventura', state_province: 'California', country: 'US', lat: 34.2746, lng: -119.2290, population: 110_000, timezone: 'America/Los_Angeles', iata_code: null }, // nearest BUR/LAX
  { name: 'Palm Springs', state_province: 'California', country: 'US', lat: 33.8303, lng: -116.5453, population: 48_000, timezone: 'America/Los_Angeles', iata_code: 'PSP' },

  // Pacific Northwest
  { name: 'Eugene', state_province: 'Oregon', country: 'US', lat: 44.0521, lng: -123.0868, population: 172_000, timezone: 'America/Los_Angeles', iata_code: 'EUG' },
  { name: 'Bend', state_province: 'Oregon', country: 'US', lat: 44.0582, lng: -121.3153, population: 99_000, timezone: 'America/Los_Angeles', iata_code: 'RDM' },
  { name: 'Tacoma', state_province: 'Washington', country: 'US', lat: 47.2529, lng: -122.4443, population: 217_000, timezone: 'America/Los_Angeles', iata_code: null }, // nearest SEA
  { name: 'Bellingham', state_province: 'Washington', country: 'US', lat: 48.7519, lng: -122.4787, population: 92_000, timezone: 'America/Los_Angeles', iata_code: 'BLI' },

  // Florida
  { name: 'Fort Lauderdale', state_province: 'Florida', country: 'US', lat: 26.1224, lng: -80.1373, population: 183_000, timezone: 'America/New_York', iata_code: 'FLL' },
  { name: 'St. Petersburg', state_province: 'Florida', country: 'US', lat: 27.7676, lng: -82.6403, population: 265_000, timezone: 'America/New_York', iata_code: null }, // nearest TPA
  { name: 'Fort Myers', state_province: 'Florida', country: 'US', lat: 26.6406, lng: -81.8723, population: 92_000, timezone: 'America/New_York', iata_code: 'RSW' },
  { name: 'Key West', state_province: 'Florida', country: 'US', lat: 24.5551, lng: -81.7800, population: 25_000, timezone: 'America/New_York', iata_code: 'EYW' },
  { name: 'West Palm Beach', state_province: 'Florida', country: 'US', lat: 26.7153, lng: -80.0534, population: 111_000, timezone: 'America/New_York', iata_code: 'PBI' },
  { name: 'Pensacola', state_province: 'Florida', country: 'US', lat: 30.4213, lng: -87.2169, population: 54_000, timezone: 'America/Chicago', iata_code: 'PNS' },

  // Southeast / Appalachia
  { name: 'Mobile', state_province: 'Alabama', country: 'US', lat: 30.6954, lng: -88.0399, population: 188_000, timezone: 'America/Chicago', iata_code: 'MOB' },
  { name: 'Huntsville', state_province: 'Alabama', country: 'US', lat: 34.7304, lng: -86.5861, population: 215_000, timezone: 'America/Chicago', iata_code: 'HSV' },
  { name: 'Montgomery', state_province: 'Alabama', country: 'US', lat: 32.3792, lng: -86.3077, population: 198_000, timezone: 'America/Chicago', iata_code: 'MGM' },
  { name: 'Roanoke', state_province: 'Virginia', country: 'US', lat: 37.2710, lng: -79.9414, population: 99_000, timezone: 'America/New_York', iata_code: 'ROA' },
  { name: 'Charlottesville', state_province: 'Virginia', country: 'US', lat: 38.0293, lng: -78.4767, population: 48_000, timezone: 'America/New_York', iata_code: 'CHO' },
  { name: 'Wilmington', state_province: 'North Carolina', country: 'US', lat: 34.2257, lng: -77.9447, population: 123_000, timezone: 'America/New_York', iata_code: 'ILM' },
  { name: 'Durham', state_province: 'North Carolina', country: 'US', lat: 35.9940, lng: -78.8986, population: 283_000, timezone: 'America/New_York', iata_code: null }, // nearest RDU
  { name: 'Winston-Salem', state_province: 'North Carolina', country: 'US', lat: 36.0999, lng: -80.2442, population: 247_000, timezone: 'America/New_York', iata_code: null }, // nearest GSO

  // Midwest
  { name: 'Toledo', state_province: 'Ohio', country: 'US', lat: 41.6528, lng: -83.5379, population: 272_000, timezone: 'America/New_York', iata_code: 'TOL' },
  { name: 'Dayton', state_province: 'Ohio', country: 'US', lat: 39.7589, lng: -84.1916, population: 140_000, timezone: 'America/New_York', iata_code: 'DAY' },
  { name: 'Akron', state_province: 'Ohio', country: 'US', lat: 41.0814, lng: -81.5190, population: 197_000, timezone: 'America/New_York', iata_code: 'CAK' },
  { name: 'Fort Wayne', state_province: 'Indiana', country: 'US', lat: 41.0793, lng: -85.1394, population: 270_000, timezone: 'America/Indiana/Indianapolis', iata_code: 'FWA' },
  { name: 'Green Bay', state_province: 'Wisconsin', country: 'US', lat: 44.5133, lng: -88.0133, population: 107_000, timezone: 'America/Chicago', iata_code: 'GRB' },
  { name: 'Kalamazoo', state_province: 'Michigan', country: 'US', lat: 42.2917, lng: -85.5872, population: 76_000, timezone: 'America/Detroit', iata_code: 'AZO' },
  { name: 'Lansing', state_province: 'Michigan', country: 'US', lat: 42.7325, lng: -84.5555, population: 112_000, timezone: 'America/Detroit', iata_code: 'LAN' },
  { name: 'Traverse City', state_province: 'Michigan', country: 'US', lat: 44.7631, lng: -85.6206, population: 16_000, timezone: 'America/Detroit', iata_code: 'TVC' },
  { name: 'Springfield', state_province: 'Missouri', country: 'US', lat: 37.2090, lng: -93.2923, population: 169_000, timezone: 'America/Chicago', iata_code: 'SGF' },
  { name: 'Springfield', state_province: 'Illinois', country: 'US', lat: 39.7817, lng: -89.6501, population: 114_000, timezone: 'America/Chicago', iata_code: 'SPI' },
  { name: 'Peoria', state_province: 'Illinois', country: 'US', lat: 40.6936, lng: -89.5890, population: 113_000, timezone: 'America/Chicago', iata_code: 'PIA' },
  { name: 'Rockford', state_province: 'Illinois', country: 'US', lat: 42.2711, lng: -89.0940, population: 148_000, timezone: 'America/Chicago', iata_code: 'RFD' },
  { name: 'Fargo', state_province: 'North Dakota', country: 'US', lat: 46.8772, lng: -96.7898, population: 125_000, timezone: 'America/Chicago', iata_code: 'FAR' },
  { name: 'Sioux Falls', state_province: 'South Dakota', country: 'US', lat: 43.5446, lng: -96.7311, population: 192_000, timezone: 'America/Chicago', iata_code: 'FSD' },
  { name: 'Duluth', state_province: 'Minnesota', country: 'US', lat: 46.7867, lng: -92.1005, population: 86_000, timezone: 'America/Chicago', iata_code: 'DLH' },
];

// ---------------------------------------------------------------------------
// CANADA — ~20 cities
// ---------------------------------------------------------------------------
const CANADA: CuratedCity[] = [
  { name: 'Toronto', state_province: 'Ontario', country: 'CA', lat: 43.6532, lng: -79.3832, population: 2_930_000, timezone: 'America/Toronto', iata_code: 'YYZ' },
  { name: 'Montreal', state_province: 'Quebec', country: 'CA', lat: 45.5017, lng: -73.5673, population: 1_780_000, timezone: 'America/Toronto', iata_code: 'YUL' },
  { name: 'Vancouver', state_province: 'British Columbia', country: 'CA', lat: 49.2827, lng: -123.1207, population: 675_000, timezone: 'America/Vancouver', iata_code: 'YVR' },
  { name: 'Calgary', state_province: 'Alberta', country: 'CA', lat: 51.0447, lng: -114.0719, population: 1_336_000, timezone: 'America/Edmonton', iata_code: 'YYC' },
  { name: 'Edmonton', state_province: 'Alberta', country: 'CA', lat: 53.5461, lng: -113.4938, population: 1_010_000, timezone: 'America/Edmonton', iata_code: 'YEG' },
  { name: 'Ottawa', state_province: 'Ontario', country: 'CA', lat: 45.4215, lng: -75.6972, population: 1_017_000, timezone: 'America/Toronto', iata_code: 'YOW' },
  { name: 'Winnipeg', state_province: 'Manitoba', country: 'CA', lat: 49.8951, lng: -97.1384, population: 749_000, timezone: 'America/Winnipeg', iata_code: 'YWG' },
  { name: 'Quebec City', state_province: 'Quebec', country: 'CA', lat: 46.8139, lng: -71.2080, population: 549_000, timezone: 'America/Toronto', iata_code: 'YQB' },
  { name: 'Hamilton', state_province: 'Ontario', country: 'CA', lat: 43.2557, lng: -79.8711, population: 579_000, timezone: 'America/Toronto', iata_code: 'YHM' },
  { name: 'Kitchener', state_province: 'Ontario', country: 'CA', lat: 43.4516, lng: -80.4925, population: 256_000, timezone: 'America/Toronto', iata_code: null }, // nearest YKF
  { name: 'London', state_province: 'Ontario', country: 'CA', lat: 42.9849, lng: -81.2453, population: 422_000, timezone: 'America/Toronto', iata_code: 'YXU' },
  { name: 'Halifax', state_province: 'Nova Scotia', country: 'CA', lat: 44.6488, lng: -63.5752, population: 440_000, timezone: 'America/Halifax', iata_code: 'YHZ' },
  { name: 'Victoria', state_province: 'British Columbia', country: 'CA', lat: 48.4284, lng: -123.3656, population: 92_000, timezone: 'America/Vancouver', iata_code: 'YYJ' },
  { name: 'Saskatoon', state_province: 'Saskatchewan', country: 'CA', lat: 52.1332, lng: -106.6700, population: 273_000, timezone: 'America/Regina', iata_code: 'YXE' },
  { name: 'Regina', state_province: 'Saskatchewan', country: 'CA', lat: 50.4452, lng: -104.6189, population: 226_000, timezone: 'America/Regina', iata_code: 'YQR' },
  { name: "St. John's", state_province: 'Newfoundland and Labrador', country: 'CA', lat: 47.5615, lng: -52.7126, population: 110_000, timezone: 'America/St_Johns', iata_code: 'YYT' },
  { name: 'Fredericton', state_province: 'New Brunswick', country: 'CA', lat: 45.9636, lng: -66.6431, population: 63_000, timezone: 'America/Halifax', iata_code: 'YFC' },
  { name: 'Moncton', state_province: 'New Brunswick', country: 'CA', lat: 46.0878, lng: -64.7782, population: 79_000, timezone: 'America/Halifax', iata_code: 'YQM' },
  { name: 'Charlottetown', state_province: 'Prince Edward Island', country: 'CA', lat: 46.2382, lng: -63.1311, population: 38_000, timezone: 'America/Halifax', iata_code: 'YYG' },
  { name: 'Whitehorse', state_province: 'Yukon', country: 'CA', lat: 60.7212, lng: -135.0568, population: 28_000, timezone: 'America/Whitehorse', iata_code: 'YXY' },
];  // ---------------------------------------------------------------------------
// UNITED KINGDOM — ~25 cities
// Dense coverage — the UK touring circuit is tight.
// ---------------------------------------------------------------------------
const UNITED_KINGDOM: CuratedCity[] = [
  { name: 'London', state_province: 'England', country: 'GB', lat: 51.5074, lng: -0.1278, population: 8_982_000, timezone: 'Europe/London', iata_code: 'LHR' },
  { name: 'Manchester', state_province: 'England', country: 'GB', lat: 53.4808, lng: -2.2426, population: 553_000, timezone: 'Europe/London', iata_code: 'MAN' },
  { name: 'Birmingham', state_province: 'England', country: 'GB', lat: 52.4862, lng: -1.8904, population: 1_141_000, timezone: 'Europe/London', iata_code: 'BHX' },
  { name: 'Glasgow', state_province: 'Scotland', country: 'GB', lat: 55.8642, lng: -4.2518, population: 635_000, timezone: 'Europe/London', iata_code: 'GLA' },
  { name: 'Edinburgh', state_province: 'Scotland', country: 'GB', lat: 55.9533, lng: -3.1883, population: 488_000, timezone: 'Europe/London', iata_code: 'EDI' },
  { name: 'Liverpool', state_province: 'England', country: 'GB', lat: 53.4084, lng: -2.9916, population: 498_000, timezone: 'Europe/London', iata_code: 'LPL' },
  { name: 'Leeds', state_province: 'England', country: 'GB', lat: 53.8008, lng: -1.5491, population: 789_000, timezone: 'Europe/London', iata_code: 'LBA' },
  { name: 'Bristol', state_province: 'England', country: 'GB', lat: 51.4545, lng: -2.5879, population: 463_000, timezone: 'Europe/London', iata_code: 'BRS' },
  { name: 'Newcastle upon Tyne', state_province: 'England', country: 'GB', lat: 54.9783, lng: -1.6178, population: 302_000, timezone: 'Europe/London', iata_code: 'NCL' },
  { name: 'Sheffield', state_province: 'England', country: 'GB', lat: 53.3811, lng: -1.4701, population: 584_000, timezone: 'Europe/London', iata_code: null }, // nearest MAN/LBA
  { name: 'Nottingham', state_province: 'England', country: 'GB', lat: 52.9548, lng: -1.1581, population: 323_000, timezone: 'Europe/London', iata_code: 'EMA' },
  { name: 'Leicester', state_province: 'England', country: 'GB', lat: 52.6369, lng: -1.1398, population: 355_000, timezone: 'Europe/London', iata_code: 'EMA' },
  { name: 'Cardiff', state_province: 'Wales', country: 'GB', lat: 51.4816, lng: -3.1791, population: 362_000, timezone: 'Europe/London', iata_code: 'CWL' },
  { name: 'Swansea', state_province: 'Wales', country: 'GB', lat: 51.6214, lng: -3.9436, population: 246_000, timezone: 'Europe/London', iata_code: null }, // nearest CWL
  { name: 'Belfast', state_province: 'Northern Ireland', country: 'GB', lat: 54.5973, lng: -5.9301, population: 343_000, timezone: 'Europe/London', iata_code: 'BFS' },
  { name: 'Brighton', state_province: 'England', country: 'GB', lat: 50.8225, lng: -0.1372, population: 290_000, timezone: 'Europe/London', iata_code: null }, // nearest LGW
  { name: 'Cambridge', state_province: 'England', country: 'GB', lat: 52.2053, lng: 0.1218, population: 145_000, timezone: 'Europe/London', iata_code: 'CBG' },
  { name: 'Oxford', state_province: 'England', country: 'GB', lat: 51.7520, lng: -1.2577, population: 152_000, timezone: 'Europe/London', iata_code: null }, // nearest OXF/LHR
  { name: 'Norwich', state_province: 'England', country: 'GB', lat: 52.6309, lng: 1.2974, population: 141_000, timezone: 'Europe/London', iata_code: 'NWI' },
  { name: 'Exeter', state_province: 'England', country: 'GB', lat: 50.7184, lng: -3.5339, population: 131_000, timezone: 'Europe/London', iata_code: 'EXT' },
  { name: 'Plymouth', state_province: 'England', country: 'GB', lat: 50.3755, lng: -4.1427, population: 263_000, timezone: 'Europe/London', iata_code: null }, // nearest EXT
  { name: 'Aberdeen', state_province: 'Scotland', country: 'GB', lat: 57.1497, lng: -2.0943, population: 200_000, timezone: 'Europe/London', iata_code: 'ABZ' },
  { name: 'Dundee', state_province: 'Scotland', country: 'GB', lat: 56.4620, lng: -2.9707, population: 149_000, timezone: 'Europe/London', iata_code: 'DND' },
  { name: 'Inverness', state_province: 'Scotland', country: 'GB', lat: 57.4778, lng: -4.2247, population: 47_000, timezone: 'Europe/London', iata_code: 'INV' },
  { name: 'Southampton', state_province: 'England', country: 'GB', lat: 50.9097, lng: -1.4044, population: 269_000, timezone: 'Europe/London', iata_code: 'SOU' },
  { name: 'Portsmouth', state_province: 'England', country: 'GB', lat: 50.8198, lng: -1.0880, population: 205_000, timezone: 'Europe/London', iata_code: null }, // nearest SOU
  { name: 'York', state_province: 'England', country: 'GB', lat: 53.9600, lng: -1.0873, population: 210_000, timezone: 'Europe/London', iata_code: null }, // nearest LBA
  { name: 'Hull', state_province: 'England', country: 'GB', lat: 53.7676, lng: -0.3274, population: 259_000, timezone: 'Europe/London', iata_code: 'HUY' },
];

// ---------------------------------------------------------------------------
// IRELAND — ~5 cities
// ---------------------------------------------------------------------------
const IRELAND: CuratedCity[] = [
  { name: 'Dublin', state_province: null, country: 'IE', lat: 53.3498, lng: -6.2603, population: 1_388_000, timezone: 'Europe/Dublin', iata_code: 'DUB' },
  { name: 'Cork', state_province: null, country: 'IE', lat: 51.8985, lng: -8.4756, population: 210_000, timezone: 'Europe/Dublin', iata_code: 'ORK' },
  { name: 'Galway', state_province: null, country: 'IE', lat: 53.2707, lng: -9.0568, population: 80_000, timezone: 'Europe/Dublin', iata_code: null }, // GWY closed, nearest SNN
  { name: 'Limerick', state_province: null, country: 'IE', lat: 52.6638, lng: -8.6267, population: 94_000, timezone: 'Europe/Dublin', iata_code: 'SNN' },
  { name: 'Waterford', state_province: null, country: 'IE', lat: 52.2593, lng: -7.1101, population: 54_000, timezone: 'Europe/Dublin', iata_code: 'WAT' },
];

// ---------------------------------------------------------------------------
// GERMANY — ~20 cities
// Major touring market — dense coverage.
// ---------------------------------------------------------------------------
const GERMANY: CuratedCity[] = [
  { name: 'Berlin', state_province: 'Berlin', country: 'DE', lat: 52.5200, lng: 13.4050, population: 3_669_000, timezone: 'Europe/Berlin', iata_code: 'BER' },
  { name: 'Hamburg', state_province: 'Hamburg', country: 'DE', lat: 53.5511, lng: 9.9937, population: 1_899_000, timezone: 'Europe/Berlin', iata_code: 'HAM' },
  { name: 'Munich', state_province: 'Bavaria', country: 'DE', lat: 48.1351, lng: 11.5820, population: 1_472_000, timezone: 'Europe/Berlin', iata_code: 'MUC' },
  { name: 'Cologne', state_province: 'North Rhine-Westphalia', country: 'DE', lat: 50.9375, lng: 6.9603, population: 1_086_000, timezone: 'Europe/Berlin', iata_code: 'CGN' },
  { name: 'Frankfurt', state_province: 'Hesse', country: 'DE', lat: 50.1109, lng: 8.6821, population: 753_000, timezone: 'Europe/Berlin', iata_code: 'FRA' },
  { name: 'Stuttgart', state_province: 'Baden-Württemberg', country: 'DE', lat: 48.7758, lng: 9.1829, population: 635_000, timezone: 'Europe/Berlin', iata_code: 'STR' },
  { name: 'Düsseldorf', state_province: 'North Rhine-Westphalia', country: 'DE', lat: 51.2277, lng: 6.7735, population: 619_000, timezone: 'Europe/Berlin', iata_code: 'DUS' },
  { name: 'Leipzig', state_province: 'Saxony', country: 'DE', lat: 51.3397, lng: 12.3731, population: 597_000, timezone: 'Europe/Berlin', iata_code: 'LEJ' },
  { name: 'Dortmund', state_province: 'North Rhine-Westphalia', country: 'DE', lat: 51.5136, lng: 7.4653, population: 588_000, timezone: 'Europe/Berlin', iata_code: 'DTM' },
  { name: 'Essen', state_province: 'North Rhine-Westphalia', country: 'DE', lat: 51.4556, lng: 7.0116, population: 583_000, timezone: 'Europe/Berlin', iata_code: null }, // nearest DUS
  { name: 'Bremen', state_province: 'Bremen', country: 'DE', lat: 53.0793, lng: 8.8017, population: 569_000, timezone: 'Europe/Berlin', iata_code: 'BRE' },
  { name: 'Dresden', state_province: 'Saxony', country: 'DE', lat: 51.0504, lng: 13.7373, population: 556_000, timezone: 'Europe/Berlin', iata_code: 'DRS' },
  { name: 'Hannover', state_province: 'Lower Saxony', country: 'DE', lat: 52.3759, lng: 9.7320, population: 538_000, timezone: 'Europe/Berlin', iata_code: 'HAJ' },
  { name: 'Nuremberg', state_province: 'Bavaria', country: 'DE', lat: 49.4521, lng: 11.0767, population: 518_000, timezone: 'Europe/Berlin', iata_code: 'NUE' },
  { name: 'Bonn', state_province: 'North Rhine-Westphalia', country: 'DE', lat: 50.7374, lng: 7.0982, population: 329_000, timezone: 'Europe/Berlin', iata_code: null }, // nearest CGN
  { name: 'Mannheim', state_province: 'Baden-Württemberg', country: 'DE', lat: 49.4875, lng: 8.4660, population: 309_000, timezone: 'Europe/Berlin', iata_code: null }, // nearest FRA
  { name: 'Karlsruhe', state_province: 'Baden-Württemberg', country: 'DE', lat: 49.0069, lng: 8.4037, population: 312_000, timezone: 'Europe/Berlin', iata_code: 'FKB' },
  { name: 'Münster', state_province: 'North Rhine-Westphalia', country: 'DE', lat: 51.9607, lng: 7.6261, population: 316_000, timezone: 'Europe/Berlin', iata_code: 'FMO' },
  { name: 'Wiesbaden', state_province: 'Hesse', country: 'DE', lat: 50.0826, lng: 8.2400, population: 278_000, timezone: 'Europe/Berlin', iata_code: null }, // nearest FRA
  { name: 'Freiburg', state_province: 'Baden-Württemberg', country: 'DE', lat: 47.9990, lng: 7.8421, population: 231_000, timezone: 'Europe/Berlin', iata_code: null }, // nearest EAP/BSL
];

// ---------------------------------------------------------------------------
// FRANCE — ~15 cities
// ---------------------------------------------------------------------------
const FRANCE: CuratedCity[] = [
  { name: 'Paris', state_province: 'Île-de-France', country: 'FR', lat: 48.8566, lng: 2.3522, population: 2_148_000, timezone: 'Europe/Paris', iata_code: 'CDG' },
  { name: 'Lyon', state_province: 'Auvergne-Rhône-Alpes', country: 'FR', lat: 45.7640, lng: 4.8357, population: 515_000, timezone: 'Europe/Paris', iata_code: 'LYS' },
  { name: 'Marseille', state_province: "Provence-Alpes-Côte d'Azur", country: 'FR', lat: 43.2965, lng: 5.3698, population: 870_000, timezone: 'Europe/Paris', iata_code: 'MRS' },
  { name: 'Toulouse', state_province: 'Occitanie', country: 'FR', lat: 43.6047, lng: 1.4442, population: 479_000, timezone: 'Europe/Paris', iata_code: 'TLS' },
  { name: 'Nice', state_province: "Provence-Alpes-Côte d'Azur", country: 'FR', lat: 43.7102, lng: 7.2620, population: 342_000, timezone: 'Europe/Paris', iata_code: 'NCE' },
  { name: 'Bordeaux', state_province: 'Nouvelle-Aquitaine', country: 'FR', lat: 44.8378, lng: -0.5792, population: 257_000, timezone: 'Europe/Paris', iata_code: 'BOD' },
  { name: 'Nantes', state_province: 'Pays de la Loire', country: 'FR', lat: 47.2184, lng: -1.5536, population: 318_000, timezone: 'Europe/Paris', iata_code: 'NTE' },
  { name: 'Lille', state_province: 'Hauts-de-France', country: 'FR', lat: 50.6292, lng: 3.0573, population: 234_000, timezone: 'Europe/Paris', iata_code: 'LIL' },
  { name: 'Strasbourg', state_province: 'Grand Est', country: 'FR', lat: 48.5734, lng: 7.7521, population: 280_000, timezone: 'Europe/Paris', iata_code: 'SXB' },
  { name: 'Montpellier', state_province: 'Occitanie', country: 'FR', lat: 43.6108, lng: 3.8767, population: 290_000, timezone: 'Europe/Paris', iata_code: 'MPL' },
  { name: 'Rennes', state_province: 'Brittany', country: 'FR', lat: 48.1173, lng: -1.6778, population: 216_000, timezone: 'Europe/Paris', iata_code: 'RNS' },
  { name: 'Reims', state_province: 'Grand Est', country: 'FR', lat: 49.2583, lng: 4.0317, population: 183_000, timezone: 'Europe/Paris', iata_code: null }, // nearest CDG
  { name: 'Rouen', state_province: 'Normandy', country: 'FR', lat: 49.4431, lng: 1.0993, population: 111_000, timezone: 'Europe/Paris', iata_code: null }, // nearest CDG
  { name: 'Grenoble', state_province: 'Auvergne-Rhône-Alpes', country: 'FR', lat: 45.1885, lng: 5.7245, population: 158_000, timezone: 'Europe/Paris', iata_code: 'GNB' },
  { name: 'Dijon', state_province: 'Bourgogne-Franche-Comté', country: 'FR', lat: 47.3220, lng: 5.0415, population: 156_000, timezone: 'Europe/Paris', iata_code: 'DIJ' },
];

// ---------------------------------------------------------------------------
// NETHERLANDS — ~8 cities
// ---------------------------------------------------------------------------
const NETHERLANDS: CuratedCity[] = [
  { name: 'Amsterdam', state_province: 'North Holland', country: 'NL', lat: 52.3676, lng: 4.9041, population: 872_000, timezone: 'Europe/Amsterdam', iata_code: 'AMS' },
  { name: 'Rotterdam', state_province: 'South Holland', country: 'NL', lat: 51.9244, lng: 4.4777, population: 651_000, timezone: 'Europe/Amsterdam', iata_code: 'RTM' },
  { name: 'The Hague', state_province: 'South Holland', country: 'NL', lat: 52.0705, lng: 4.3007, population: 545_000, timezone: 'Europe/Amsterdam', iata_code: null }, // nearest RTM
  { name: 'Utrecht', state_province: 'Utrecht', country: 'NL', lat: 52.0907, lng: 5.1214, population: 358_000, timezone: 'Europe/Amsterdam', iata_code: null }, // nearest AMS
  { name: 'Eindhoven', state_province: 'North Brabant', country: 'NL', lat: 51.4416, lng: 5.4697, population: 235_000, timezone: 'Europe/Amsterdam', iata_code: 'EIN' },
  { name: 'Groningen', state_province: 'Groningen', country: 'NL', lat: 53.2194, lng: 6.5665, population: 234_000, timezone: 'Europe/Amsterdam', iata_code: 'GRQ' },
  { name: 'Tilburg', state_province: 'North Brabant', country: 'NL', lat: 51.5555, lng: 5.0913, population: 219_000, timezone: 'Europe/Amsterdam', iata_code: null }, // nearest EIN
  { name: 'Nijmegen', state_province: 'Gelderland', country: 'NL', lat: 51.8426, lng: 5.8546, population: 177_000, timezone: 'Europe/Amsterdam', iata_code: null }, // nearest EIN
];

// ---------------------------------------------------------------------------
// BELGIUM — ~5 cities
// ---------------------------------------------------------------------------
const BELGIUM: CuratedCity[] = [
  { name: 'Brussels', state_province: null, country: 'BE', lat: 50.8503, lng: 4.3517, population: 1_218_000, timezone: 'Europe/Brussels', iata_code: 'BRU' },
  { name: 'Antwerp', state_province: 'Flanders', country: 'BE', lat: 51.2194, lng: 4.4025, population: 525_000, timezone: 'Europe/Brussels', iata_code: 'ANR' },
  { name: 'Ghent', state_province: 'Flanders', country: 'BE', lat: 51.0543, lng: 3.7174, population: 263_000, timezone: 'Europe/Brussels', iata_code: null }, // nearest BRU
  { name: 'Bruges', state_province: 'Flanders', country: 'BE', lat: 51.2093, lng: 3.2247, population: 118_000, timezone: 'Europe/Brussels', iata_code: null }, // nearest OST
  { name: 'Liège', state_province: 'Wallonia', country: 'BE', lat: 50.6326, lng: 5.5797, population: 197_000, timezone: 'Europe/Brussels', iata_code: 'LGG' },
];

// ---------------------------------------------------------------------------
// SPAIN — ~10 cities
// ---------------------------------------------------------------------------
const SPAIN: CuratedCity[] = [
  { name: 'Madrid', state_province: 'Community of Madrid', country: 'ES', lat: 40.4168, lng: -3.7038, population: 3_223_000, timezone: 'Europe/Madrid', iata_code: 'MAD' },
  { name: 'Barcelona', state_province: 'Catalonia', country: 'ES', lat: 41.3851, lng: 2.1734, population: 1_620_000, timezone: 'Europe/Madrid', iata_code: 'BCN' },
  { name: 'Valencia', state_province: 'Valencian Community', country: 'ES', lat: 39.4699, lng: -0.3763, population: 791_000, timezone: 'Europe/Madrid', iata_code: 'VLC' },
  { name: 'Seville', state_province: 'Andalusia', country: 'ES', lat: 37.3891, lng: -5.9845, population: 688_000, timezone: 'Europe/Madrid', iata_code: 'SVQ' },
  { name: 'Zaragoza', state_province: 'Aragon', country: 'ES', lat: 41.6488, lng: -0.8891, population: 675_000, timezone: 'Europe/Madrid', iata_code: 'ZAZ' },
  { name: 'Málaga', state_province: 'Andalusia', country: 'ES', lat: 36.7213, lng: -4.4214, population: 578_000, timezone: 'Europe/Madrid', iata_code: 'AGP' },
  { name: 'Bilbao', state_province: 'Basque Country', country: 'ES', lat: 43.2630, lng: -2.9350, population: 346_000, timezone: 'Europe/Madrid', iata_code: 'BIO' },
  { name: 'Granada', state_province: 'Andalusia', country: 'ES', lat: 37.1773, lng: -3.5986, population: 232_000, timezone: 'Europe/Madrid', iata_code: 'GRX' },
  { name: 'San Sebastián', state_province: 'Basque Country', country: 'ES', lat: 43.3183, lng: -1.9812, population: 188_000, timezone: 'Europe/Madrid', iata_code: 'EAS' },
  { name: 'Palma', state_province: 'Balearic Islands', country: 'ES', lat: 39.5696, lng: 2.6502, population: 416_000, timezone: 'Europe/Madrid', iata_code: 'PMI' },
];

// ---------------------------------------------------------------------------
// ITALY — ~12 cities
// ---------------------------------------------------------------------------
const ITALY: CuratedCity[] = [
  { name: 'Rome', state_province: 'Lazio', country: 'IT', lat: 41.9028, lng: 12.4964, population: 2_873_000, timezone: 'Europe/Rome', iata_code: 'FCO' },
  { name: 'Milan', state_province: 'Lombardy', country: 'IT', lat: 45.4642, lng: 9.1900, population: 1_352_000, timezone: 'Europe/Rome', iata_code: 'MXP' },
  { name: 'Naples', state_province: 'Campania', country: 'IT', lat: 40.8518, lng: 14.2681, population: 967_000, timezone: 'Europe/Rome', iata_code: 'NAP' },
  { name: 'Turin', state_province: 'Piedmont', country: 'IT', lat: 45.0703, lng: 7.6869, population: 870_000, timezone: 'Europe/Rome', iata_code: 'TRN' },
  { name: 'Florence', state_province: 'Tuscany', country: 'IT', lat: 43.7696, lng: 11.2558, population: 383_000, timezone: 'Europe/Rome', iata_code: 'FLR' },
  { name: 'Bologna', state_province: 'Emilia-Romagna', country: 'IT', lat: 44.4949, lng: 11.3426, population: 392_000, timezone: 'Europe/Rome', iata_code: 'BLQ' },
  { name: 'Venice', state_province: 'Veneto', country: 'IT', lat: 45.4408, lng: 12.3155, population: 261_000, timezone: 'Europe/Rome', iata_code: 'VCE' },
  { name: 'Verona', state_province: 'Veneto', country: 'IT', lat: 45.4384, lng: 10.9916, population: 259_000, timezone: 'Europe/Rome', iata_code: 'VRN' },
  { name: 'Genoa', state_province: 'Liguria', country: 'IT', lat: 44.4056, lng: 8.9463, population: 580_000, timezone: 'Europe/Rome', iata_code: 'GOA' },
  { name: 'Padua', state_province: 'Veneto', country: 'IT', lat: 45.4064, lng: 11.8768, population: 214_000, timezone: 'Europe/Rome', iata_code: null }, // nearest VCE
  { name: 'Bari', state_province: 'Apulia', country: 'IT', lat: 41.1171, lng: 16.8719, population: 320_000, timezone: 'Europe/Rome', iata_code: 'BRI' },
  { name: 'Catania', state_province: 'Sicily', country: 'IT', lat: 37.5079, lng: 15.0830, population: 311_000, timezone: 'Europe/Rome', iata_code: 'CTA' },
];

// ---------------------------------------------------------------------------
// PORTUGAL — ~4 cities
// ---------------------------------------------------------------------------
const PORTUGAL: CuratedCity[] = [
  { name: 'Lisbon', state_province: null, country: 'PT', lat: 38.7223, lng: -9.1393, population: 548_000, timezone: 'Europe/Lisbon', iata_code: 'LIS' },
  { name: 'Porto', state_province: null, country: 'PT', lat: 41.1579, lng: -8.6291, population: 231_000, timezone: 'Europe/Lisbon', iata_code: 'OPO' },
  { name: 'Coimbra', state_province: null, country: 'PT', lat: 40.2033, lng: -8.4103, population: 143_000, timezone: 'Europe/Lisbon', iata_code: null }, // nearest OPO
  { name: 'Faro', state_province: null, country: 'PT', lat: 37.0194, lng: -7.9304, population: 65_000, timezone: 'Europe/Lisbon', iata_code: 'FAO' },
];

// ---------------------------------------------------------------------------
// SWITZERLAND — ~5 cities
// ---------------------------------------------------------------------------
const SWITZERLAND: CuratedCity[] = [
  { name: 'Zürich', state_province: null, country: 'CH', lat: 47.3769, lng: 8.5417, population: 434_000, timezone: 'Europe/Zurich', iata_code: 'ZRH' },
  { name: 'Geneva', state_province: null, country: 'CH', lat: 46.2044, lng: 6.1432, population: 203_000, timezone: 'Europe/Zurich', iata_code: 'GVA' },
  { name: 'Basel', state_province: null, country: 'CH', lat: 47.5596, lng: 7.5886, population: 178_000, timezone: 'Europe/Zurich', iata_code: 'BSL' },
  { name: 'Bern', state_province: null, country: 'CH', lat: 46.9480, lng: 7.4474, population: 134_000, timezone: 'Europe/Zurich', iata_code: 'BRN' },
  { name: 'Lausanne', state_province: null, country: 'CH', lat: 46.5197, lng: 6.6323, population: 140_000, timezone: 'Europe/Zurich', iata_code: null }, // nearest GVA
];

// ---------------------------------------------------------------------------
// AUSTRIA — ~4 cities
// ---------------------------------------------------------------------------
const AUSTRIA: CuratedCity[] = [
  { name: 'Vienna', state_province: null, country: 'AT', lat: 48.2082, lng: 16.3738, population: 1_911_000, timezone: 'Europe/Vienna', iata_code: 'VIE' },
  { name: 'Salzburg', state_province: null, country: 'AT', lat: 47.8095, lng: 13.0550, population: 155_000, timezone: 'Europe/Vienna', iata_code: 'SZG' },
  { name: 'Graz', state_province: null, country: 'AT', lat: 47.0707, lng: 15.4395, population: 289_000, timezone: 'Europe/Vienna', iata_code: 'GRZ' },
  { name: 'Innsbruck', state_province: null, country: 'AT', lat: 47.2692, lng: 11.4041, population: 132_000, timezone: 'Europe/Vienna', iata_code: 'INN' },
];

// ---------------------------------------------------------------------------
// CZECH REPUBLIC — ~3 cities
// ---------------------------------------------------------------------------
const CZECH_REPUBLIC: CuratedCity[] = [
  { name: 'Prague', state_province: null, country: 'CZ', lat: 50.0755, lng: 14.4378, population: 1_309_000, timezone: 'Europe/Prague', iata_code: 'PRG' },
  { name: 'Brno', state_province: null, country: 'CZ', lat: 49.1951, lng: 16.6068, population: 379_000, timezone: 'Europe/Prague', iata_code: 'BRQ' },
  { name: 'Ostrava', state_province: null, country: 'CZ', lat: 49.8209, lng: 18.2625, population: 287_000, timezone: 'Europe/Prague', iata_code: 'OSR' },
];

// ---------------------------------------------------------------------------
// POLAND — ~5 cities
// ---------------------------------------------------------------------------
const POLAND: CuratedCity[] = [
  { name: 'Warsaw', state_province: null, country: 'PL', lat: 52.2297, lng: 21.0122, population: 1_793_000, timezone: 'Europe/Warsaw', iata_code: 'WAW' },
  { name: 'Kraków', state_province: null, country: 'PL', lat: 50.0647, lng: 19.9450, population: 779_000, timezone: 'Europe/Warsaw', iata_code: 'KRK' },
  { name: 'Łódź', state_province: null, country: 'PL', lat: 51.7592, lng: 19.4560, population: 672_000, timezone: 'Europe/Warsaw', iata_code: 'LCJ' },
  { name: 'Wrocław', state_province: null, country: 'PL', lat: 51.1079, lng: 17.0385, population: 643_000, timezone: 'Europe/Warsaw', iata_code: 'WRO' },
  { name: 'Poznań', state_province: null, country: 'PL', lat: 52.4064, lng: 16.9252, population: 534_000, timezone: 'Europe/Warsaw', iata_code: 'POZ' },
];

// ---------------------------------------------------------------------------
// HUNGARY — ~2 cities
// ---------------------------------------------------------------------------
const HUNGARY: CuratedCity[] = [
  { name: 'Budapest', state_province: null, country: 'HU', lat: 47.4979, lng: 19.0402, population: 1_752_000, timezone: 'Europe/Budapest', iata_code: 'BUD' },
  { name: 'Debrecen', state_province: null, country: 'HU', lat: 47.5316, lng: 21.6273, population: 202_000, timezone: 'Europe/Budapest', iata_code: 'DEB' },
];

// ---------------------------------------------------------------------------
// SCANDINAVIA — ~12 cities (Denmark, Norway, Sweden, Finland, Iceland)
// ---------------------------------------------------------------------------
const SCANDINAVIA: CuratedCity[] = [
  // Denmark
  { name: 'Copenhagen', state_province: null, country: 'DK', lat: 55.6761, lng: 12.5683, population: 660_000, timezone: 'Europe/Copenhagen', iata_code: 'CPH' },
  { name: 'Aarhus', state_province: null, country: 'DK', lat: 56.1629, lng: 10.2039, population: 285_000, timezone: 'Europe/Copenhagen', iata_code: 'AAR' },
  { name: 'Odense', state_province: null, country: 'DK', lat: 55.4038, lng: 10.4024, population: 180_000, timezone: 'Europe/Copenhagen', iata_code: null }, // nearest BLL
  // Norway
  { name: 'Oslo', state_province: null, country: 'NO', lat: 59.9139, lng: 10.7522, population: 697_000, timezone: 'Europe/Oslo', iata_code: 'OSL' },
  { name: 'Bergen', state_province: null, country: 'NO', lat: 60.3913, lng: 5.3221, population: 285_000, timezone: 'Europe/Oslo', iata_code: 'BGO' },
  { name: 'Trondheim', state_province: null, country: 'NO', lat: 63.4305, lng: 10.3951, population: 205_000, timezone: 'Europe/Oslo', iata_code: 'TRD' },
  // Sweden
  { name: 'Stockholm', state_province: null, country: 'SE', lat: 59.3293, lng: 18.0686, population: 975_000, timezone: 'Europe/Stockholm', iata_code: 'ARN' },
  { name: 'Gothenburg', state_province: null, country: 'SE', lat: 57.7089, lng: 11.9746, population: 579_000, timezone: 'Europe/Stockholm', iata_code: 'GOT' },
  { name: 'Malmö', state_province: null, country: 'SE', lat: 55.6050, lng: 13.0038, population: 347_000, timezone: 'Europe/Stockholm', iata_code: 'MMX' },
  // Finland
  { name: 'Helsinki', state_province: null, country: 'FI', lat: 60.1699, lng: 24.9384, population: 656_000, timezone: 'Europe/Helsinki', iata_code: 'HEL' },
  { name: 'Tampere', state_province: null, country: 'FI', lat: 61.4978, lng: 23.7610, population: 244_000, timezone: 'Europe/Helsinki', iata_code: 'TMP' },
  // Iceland
  { name: 'Reykjavík', state_province: null, country: 'IS', lat: 64.1466, lng: -21.9426, population: 131_000, timezone: 'Atlantic/Reykjavik', iata_code: 'KEF' },
];  // ---------------------------------------------------------------------------
// JAPAN — ~10 cities
// ---------------------------------------------------------------------------
const JAPAN: CuratedCity[] = [
  { name: 'Tokyo', state_province: null, country: 'JP', lat: 35.6762, lng: 139.6503, population: 13_960_000, timezone: 'Asia/Tokyo', iata_code: 'NRT' },
  { name: 'Osaka', state_province: null, country: 'JP', lat: 34.6937, lng: 135.5023, population: 2_691_000, timezone: 'Asia/Tokyo', iata_code: 'KIX' },
  { name: 'Kyoto', state_province: null, country: 'JP', lat: 35.0116, lng: 135.7681, population: 1_464_000, timezone: 'Asia/Tokyo', iata_code: null }, // nearest KIX
  { name: 'Nagoya', state_province: null, country: 'JP', lat: 35.1815, lng: 136.9066, population: 2_296_000, timezone: 'Asia/Tokyo', iata_code: 'NGO' },
  { name: 'Sapporo', state_province: null, country: 'JP', lat: 43.0618, lng: 141.3545, population: 1_952_000, timezone: 'Asia/Tokyo', iata_code: 'CTS' },
  { name: 'Fukuoka', state_province: null, country: 'JP', lat: 33.5904, lng: 130.4017, population: 1_600_000, timezone: 'Asia/Tokyo', iata_code: 'FUK' },
  { name: 'Yokohama', state_province: null, country: 'JP', lat: 35.4437, lng: 139.6380, population: 3_726_000, timezone: 'Asia/Tokyo', iata_code: null }, // nearest HND
  { name: 'Kobe', state_province: null, country: 'JP', lat: 34.6901, lng: 135.1955, population: 1_518_000, timezone: 'Asia/Tokyo', iata_code: 'UKB' },
  { name: 'Hiroshima', state_province: null, country: 'JP', lat: 34.3853, lng: 132.4553, population: 1_199_000, timezone: 'Asia/Tokyo', iata_code: 'HIJ' },
  { name: 'Sendai', state_province: null, country: 'JP', lat: 38.2682, lng: 140.8694, population: 1_082_000, timezone: 'Asia/Tokyo', iata_code: 'SDJ' },
];

// ---------------------------------------------------------------------------
// AUSTRALIA — ~10 cities
// ---------------------------------------------------------------------------
const AUSTRALIA: CuratedCity[] = [
  { name: 'Sydney', state_province: 'New South Wales', country: 'AU', lat: -33.8688, lng: 151.2093, population: 5_312_000, timezone: 'Australia/Sydney', iata_code: 'SYD' },
  { name: 'Melbourne', state_province: 'Victoria', country: 'AU', lat: -37.8136, lng: 144.9631, population: 5_078_000, timezone: 'Australia/Melbourne', iata_code: 'MEL' },
  { name: 'Brisbane', state_province: 'Queensland', country: 'AU', lat: -27.4698, lng: 153.0251, population: 2_560_000, timezone: 'Australia/Brisbane', iata_code: 'BNE' },
  { name: 'Perth', state_province: 'Western Australia', country: 'AU', lat: -31.9505, lng: 115.8605, population: 2_125_000, timezone: 'Australia/Perth', iata_code: 'PER' },
  { name: 'Adelaide', state_province: 'South Australia', country: 'AU', lat: -34.9285, lng: 138.6007, population: 1_345_000, timezone: 'Australia/Adelaide', iata_code: 'ADL' },
  { name: 'Gold Coast', state_province: 'Queensland', country: 'AU', lat: -28.0167, lng: 153.4000, population: 679_000, timezone: 'Australia/Brisbane', iata_code: 'OOL' },
  { name: 'Canberra', state_province: 'Australian Capital Territory', country: 'AU', lat: -35.2809, lng: 149.1300, population: 431_000, timezone: 'Australia/Sydney', iata_code: 'CBR' },
  { name: 'Hobart', state_province: 'Tasmania', country: 'AU', lat: -42.8821, lng: 147.3272, population: 238_000, timezone: 'Australia/Hobart', iata_code: 'HBA' },
  { name: 'Darwin', state_province: 'Northern Territory', country: 'AU', lat: -12.4634, lng: 130.8456, population: 147_000, timezone: 'Australia/Darwin', iata_code: 'DRW' },
  { name: 'Newcastle', state_province: 'New South Wales', country: 'AU', lat: -32.9283, lng: 151.7817, population: 322_000, timezone: 'Australia/Sydney', iata_code: 'NTL' },
];

// ---------------------------------------------------------------------------
// NEW ZEALAND — ~4 cities
// ---------------------------------------------------------------------------
const NEW_ZEALAND: CuratedCity[] = [
  { name: 'Auckland', state_province: null, country: 'NZ', lat: -36.8485, lng: 174.7633, population: 1_657_000, timezone: 'Pacific/Auckland', iata_code: 'AKL' },
  { name: 'Wellington', state_province: null, country: 'NZ', lat: -41.2865, lng: 174.7762, population: 215_000, timezone: 'Pacific/Auckland', iata_code: 'WLG' },
  { name: 'Christchurch', state_province: null, country: 'NZ', lat: -43.5321, lng: 172.6362, population: 383_000, timezone: 'Pacific/Auckland', iata_code: 'CHC' },
  { name: 'Queenstown', state_province: null, country: 'NZ', lat: -45.0312, lng: 168.6626, population: 16_000, timezone: 'Pacific/Auckland', iata_code: 'ZQN' },
];

// ---------------------------------------------------------------------------
// Combine all regions
// ---------------------------------------------------------------------------
const ALL_CITIES: CuratedCity[] = [
  ...UNITED_STATES,
  ...CANADA,
  ...UNITED_KINGDOM,
  ...IRELAND,
  ...GERMANY,
  ...FRANCE,
  ...NETHERLANDS,
  ...BELGIUM,
  ...SPAIN,
  ...ITALY,
  ...PORTUGAL,
  ...SWITZERLAND,
  ...AUSTRIA,
  ...CZECH_REPUBLIC,
  ...POLAND,
  ...HUNGARY,
  ...SCANDINAVIA,
  ...JAPAN,
  ...AUSTRALIA,
  ...NEW_ZEALAND,
];

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== curated geo_cities seed ===');
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN' : FORCE ? 'FORCE (wipe + re-seed)' : 'normal'}`);
  console.log(`  Total cities: ${ALL_CITIES.length.toLocaleString()}`);
  console.log('');

  // Per-country breakdown for sanity checking
  const byCountry = new Map<string, number>();
  for (const c of ALL_CITIES) {
    byCountry.set(c.country, (byCountry.get(c.country) ?? 0) + 1);
  }
  const sorted = [...byCountry.entries()].sort((a, b) => b[1] - a[1]);
  console.log('  Per-country breakdown:');
  for (const [country, count] of sorted) {
    console.log(`    ${country}: ${count}`);
  }
  console.log('');

  // Airport coverage stats
  const withIata = ALL_CITIES.filter(c => c.iata_code !== null).length;
  const withoutIata = ALL_CITIES.length - withIata;
  console.log(`  Airport coverage: ${withIata} with IATA, ${withoutIata} without (fall back to nearest-airport)`);
  console.log('');

  if (DRY_RUN) {
    console.log('DRY RUN — no database writes.');
    return;
  }

  // Check existing state
  const { count: existingCount } = await supabase
    .from('geo_cities')
    .select('id', { count: 'exact', head: true });

  if ((existingCount ?? 0) > 0 && !FORCE) {
    console.error(`ERROR: geo_cities already has ${existingCount} rows. Use --force to wipe and re-seed.`);
    process.exit(1);
  }

  if ((existingCount ?? 0) > 0 && FORCE) {
    console.log(`  Wiping ${existingCount} existing rows (--force)...`);
    const { error: delError } = await supabase
      .from('geo_cities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // matches all
    if (delError) {
      console.error(`  ERROR wiping table: ${delError.message}`);
      process.exit(1);
    }
    console.log(`  Wiped.`);
  }

  // Insert in batches of 100 (well under the 500-row batch limit, tiny dataset)
  const BATCH_SIZE = 100;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < ALL_CITIES.length; i += BATCH_SIZE) {
    const batch = ALL_CITIES.slice(i, i + BATCH_SIZE).map(c => ({
      name: c.name,
      name_ascii: c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      name_lower: c.name.toLowerCase().trim(),
      state_province: c.state_province,
      state_code: null,
      country: c.country,
      lat: c.lat,
      lng: c.lng,
      population: c.population,
      timezone: c.timezone,
      iata_code: c.iata_code,
      source: 'curated',
    }));

    // Retry with exponential backoff — same pattern as the GeoNames seed
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { error } = await supabase.from('geo_cities').insert(batch);
      if (!error) {
        inserted += batch.length;
        break;
      }
      if (attempt === 3) {
        console.error(`  ⚠ Batch insert FAILED after 3 retries at offset ${i}: ${error.message}`);
        failed += batch.length;
      } else {
        console.warn(`  Batch retry ${attempt}/3 at offset ${i}: ${error.message}`);
        await new Promise(r => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
      }
    }
  }

  console.log('');
  console.log(`=== Done. ${inserted} inserted, ${failed} failed ===`);

  if (failed > 0) {
    console.error(`\n⚠ INCOMPLETE: ${failed} rows failed. Re-run with --force to retry.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
