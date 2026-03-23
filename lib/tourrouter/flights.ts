import { CITY_AIRPORTS, AIRPORT_COORDS } from './constants';

export interface AirportInfo {
  iata: string;
  coords: [number, number] | undefined;
}

export function getAirport(city: string | null | undefined, _country?: string | null): AirportInfo | null {
  if (!city) return null;
  const key = city.toLowerCase().trim();
  const iata = CITY_AIRPORTS[key];
  if (iata) return { iata, coords: AIRPORT_COORDS[iata] };
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
