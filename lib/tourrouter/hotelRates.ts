import { HOTEL_MARKET_RATES, HOTEL_FALLBACK_RATES } from './constants';

const UK_COUNTRIES = new Set(['uk', 'gb', 'england', 'scotland', 'wales']);
const EUROPEAN_COUNTRIES = new Set([
  'france', 'germany', 'netherlands', 'spain', 'italy', 'austria',
  'belgium', 'sweden', 'norway', 'denmark', 'finland', 'switzerland',
  'czech republic', 'hungary', 'poland', 'portugal', 'greece', 'ireland',
]);

/**
 * getProjectedHotelRate — Estimate a nightly hotel rate in USD for planning.
 *
 * Looks up the city in HOTEL_MARKET_RATES first. If the city is unknown,
 * falls back to a regional rate table keyed off country.
 *
 * Used by the Accommodations projection path when no confirmation or
 * receipt exists yet.
 */
export function getProjectedHotelRate(
  city: string | null | undefined,
  country: string | null | undefined,
  starRating: number, // 2, 3, 4, or 5
): number {
  // Map star rating to key; clamp out-of-range values to threeStar
  const starKey: 'twoStar' | 'threeStar' | 'fourStar' | 'fiveStar' =
    starRating === 2 ? 'twoStar' :
    starRating === 3 ? 'threeStar' :
    starRating === 4 ? 'fourStar' :
    starRating === 5 ? 'fiveStar' :
    'threeStar';

  // Try city lookup first
  const cityKey = (city || '').toLowerCase().trim();
  if (cityKey && HOTEL_MARKET_RATES[cityKey]) {
    return HOTEL_MARKET_RATES[cityKey][starKey];
  }

  // Fall back to regional rate keyed off country
  const countryKey = (country || '').toLowerCase().trim();
  let region: keyof typeof HOTEL_FALLBACK_RATES;
  if (countryKey === 'usa' || countryKey === 'us') {
    region = 'usa';
  } else if (countryKey === 'canada' || countryKey === 'ca') {
    region = 'canada';
  } else if (UK_COUNTRIES.has(countryKey)) {
    region = 'uk';
  } else if (countryKey === 'australia' || countryKey === 'au') {
    region = 'australia';
  } else if (EUROPEAN_COUNTRIES.has(countryKey)) {
    region = 'europe';
  } else {
    region = 'other';
  }

  return HOTEL_FALLBACK_RATES[region][starKey];
}
