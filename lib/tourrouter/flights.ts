import { CITY_AIRPORTS, AIRPORT_COORDS } from './constants';
import { getCityCoords, haversine } from './geography';

export interface AirportInfo {
  iata: string;
  coords: [number, number] | undefined;
}

const CITY_ALIASES: Record<string, string> = {
  "brooklyn": "new york",
  "williamsburg": "new york",
  "asheville": "charlotte",
  "richmond": "richmond",
  "louisville": "louisville",
  "columbus": "columbus",
  "pittsburgh": "pittsburgh",
  "montreal": "montreal",
  "manchester": "manchester",
  "brussels": "brussels",
};

function lookupAirport(key: string): AirportInfo | null {
  const iata = CITY_AIRPORTS[key];
  if (iata) return { iata, coords: AIRPORT_COORDS[iata] };
  return null;
}

function findNearestAirport(lat: number, lon: number): AirportInfo | null {
  let bestIata: string | null = null;
  let bestDist = Infinity;
  for (const [iata, coords] of Object.entries(AIRPORT_COORDS)) {
    const dist = haversine(lat, lon, coords[0], coords[1]);
    if (dist < bestDist) {
      bestDist = dist;
      bestIata = iata;
    }
  }
  if (bestIata) return { iata: bestIata, coords: AIRPORT_COORDS[bestIata] };
  return null;
}

export function getAirport(city: string | null | undefined, country?: string | null): AirportInfo | null {
  if (!city) return null;

  // 1. Try full city string
  const key = city.toLowerCase().trim();
  const direct = lookupAirport(key);
  if (direct) return direct;

  // 2. Strip everything after the last comma (e.g. "Brooklyn, NY" → "brooklyn")
  const lastComma = key.lastIndexOf(",");
  if (lastComma > 0) {
    const stripped = key.slice(0, lastComma).trim();
    const strippedMatch = lookupAirport(stripped);
    if (strippedMatch) return strippedMatch;

    // 3. Check alias map on the stripped name
    const alias = CITY_ALIASES[stripped];
    if (alias) {
      const aliasMatch = lookupAirport(alias);
      if (aliasMatch) return aliasMatch;
    }
  }

  // 3b. Check alias map on the full key too
  const alias = CITY_ALIASES[key];
  if (alias) {
    const aliasMatch = lookupAirport(alias);
    if (aliasMatch) return aliasMatch;
  }

  // 4. Nearest-airport fallback — use city coords + haversine to find closest airport
  const cityCoords = getCityCoords(city, country);
  if (cityCoords) {
    return findNearestAirport(cityCoords[0], cityCoords[1]);
  }

  return null;
}

export interface FlightLinks {
  google: string;
  skyscanner: string;
  kiwi: string;
}

export function buildFlightLinks(from: string, to: string, _dateStr?: string, _pax?: number): FlightLinks {
  const google = `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(from)}+to+${encodeURIComponent(to)}`;
  const skyscanner = `https://www.skyscanner.com/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/`;
  const kiwi = `https://www.kiwi.com/en/search/results/${encodeURIComponent(from)}/${encodeURIComponent(to)}/`;
  return { google, skyscanner, kiwi };
}
