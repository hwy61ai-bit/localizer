import { VEHICLE_MPG, VEHICLE_L100, type VehicleType } from './constants';
import { getRoadKm, getCityCoords, estimateDriveHours, isImperialCountry, legCountry } from './geography';
import { getRate, toUSD, type OfferObj } from './currency';
import { getAirport } from './flights';

// ============================================================
// TYPES
// ============================================================

export interface TourShow {
  date: Date | null;
  event: string;
  city: string;
  country: string;
  countryNorm?: string;
  venue: string;
  offer: OfferObj;
  usd: number;
  capacity: number;
  status: string;
  isOff: boolean;
  backend?: string;
  doors?: string;
  showtime?: string;
  merch?: string;
  notes?: string;
  support?: string;
  promoter?: string;
}

export interface FinancialParams {
  tourShows: TourShow[];
  legChoices: Record<number, string>;
  showExpenses: Record<number, number>;
  rates: Record<string, number>;
  pax: number;
  flightThreshold: number;
  blanketShowAmt: number;
  blanketOffAmt: number;
  blanketShowLabel: string;
  blanketOffLabel: string;
  vehicleType: VehicleType;
  vehicleCount: number;
  fuelPriceOverride: number | null;
  flightPriceCache: Record<string, number>;
}

export interface FinancialResults {
  shows: number;
  confirmedShows: number;
  pendingShows: number;
  backendShows: number;
  totalIncome: number;
  avgPerShow: number;
  totalCapacity: number;
  totalWOP: number;
  totalFuel: number;
  totalFlights: number;
  flightLegs: number;
  totalManual: number;
  blanketShowAmt: number;
  blanketOffAmt: number;
  totalBlanketShow: number;
  totalBlanketOff: number;
  showDayCount: number;
  offDayCount: number;
  totalExpenses: number;
  netIncome: number;
  margin: number;
  totalKm: number;
  imperialTour: boolean;
  longDrives: number;
  byCurrency: Record<string, number>;
  countries: string[];
  firstDate: Date | null;
  lastDate: Date | null;
  spanDays: number;
  pax: number;
  blanketShowLabel: string;
  blanketOffLabel: string;
}

// ============================================================
// FUEL CALCULATION (internal)
// ============================================================

function calcFuelCostUSD(
  km: number,
  fromCountry: string | null | undefined,
  toCountry: string | null | undefined,
  vehicleType: VehicleType,
  vehicleCount: number,
  fuelPriceOverride: number | null,
  rates: Record<string, number>,
): number {
  if (!km) return 0;
  // CRITICAL: variable is legCtry, not legCountry (name collision with function)
  const legCtry = legCountry(fromCountry, toCountry);

  if (legCtry === 'usa') {
    const mpg = VEHICLE_MPG[vehicleType] || 20;
    const miles = km * 0.6214;
    const pricePerGal = fuelPriceOverride || 3.50;
    return (miles / mpg) * pricePerGal * vehicleCount;
  } else {
    const l100 = VEHICLE_L100[vehicleType] || 11.8;
    const litres = (km / 100) * l100;
    const eurRate = getRate('EUR', rates);
    const pricePerLitre = 1.65 * eurRate; // ~EUR 1.65/L converted to USD
    return litres * (fuelPriceOverride ? fuelPriceOverride / 3.785 : pricePerLitre) * vehicleCount;
  }
}

// ============================================================
// SINGLE SOURCE OF TRUTH — calcTourFinancials
// ============================================================

export function calcTourFinancials(params: FinancialParams): FinancialResults {
  const {
    tourShows, legChoices, showExpenses, rates, pax,
    flightThreshold, blanketShowAmt, blanketOffAmt,
    vehicleType, vehicleCount, fuelPriceOverride, flightPriceCache,
    blanketShowLabel, blanketOffLabel,
  } = params;

  let totalIncome = 0, totalFuel = 0, totalFlights = 0, totalManual = 0;
  let confirmedShows = 0, pendingShows = 0, backendShows = 0;
  let totalCapacity = 0, totalWOP = 0, totalKm = 0;
  let flightLegs = 0;
  const byCurrency: Record<string, number> = {};
  const countries = new Set<string>();
  let firstDate: Date | null = null, lastDate: Date | null = null;

  tourShows.forEach((s, i) => {
    s.usd = toUSD(s.offer, rates);
    if (!s.isOff) {
      totalIncome += s.usd;
      totalCapacity += s.capacity || 0;
      if (s.backend) backendShows++;
      const st = (s.status || '').toLowerCase();
      if (st.includes('confirm')) confirmedShows++;
      else pendingShows++;
      if (s.capacity && s.offer.amount) {
        totalWOP += s.capacity * (s.offer.amount || 0) * getRate(s.offer.currency || 'USD', rates) / Math.max(s.capacity, 1);
      }
    }
    if (s.offer.currency && s.offer.currency !== 'USD') {
      byCurrency[s.offer.currency] = (byCurrency[s.offer.currency] || 0) + s.offer.amount;
    }
    if (s.country) countries.add(s.countryNorm || s.country);
    if (s.date) {
      if (!firstDate || s.date < firstDate) firstDate = s.date;
      if (!lastDate || s.date > lastDate) lastDate = s.date;
    }

    // Fuel / flight for this leg
    if (i > 0 && !s.isOff && !tourShows[i - 1].isOff) {
      const prev = tourShows[i - 1];
      const km = getRoadKm(prev.city, prev.country, s.city, s.country);
      if (!km && typeof window !== 'undefined') {
        console.warn(`[TourRouter] No distance: "${prev.city}" → "${s.city}" (coords: ${getCityCoords(prev.city, prev.country) ? 'found' : 'MISSING'} → ${getCityCoords(s.city, s.country) ? 'found' : 'MISSING'})`);
      }
      const driveH = km ? estimateDriveHours(km) : null;
      const flying = legChoices[i] === 'fly';

      if (km) totalKm += km;

      if (flying) {
        flightLegs++;
        const fromAP = getAirport(prev.city, prev.country);
        const toAP = getAirport(s.city, s.country);
        if (fromAP && toAP) {
          const dateStr = s.date ? s.date.toISOString().split('T')[0] : '';
          const key = fromAP.iata + '-' + toAP.iata + '-' + dateStr + '-' + pax + 'pax';
          const cached = flightPriceCache[key] || null;
          if (cached) totalFlights += cached;
        }
      } else {
        if (km) totalFuel += calcFuelCostUSD(km, prev.country, s.country, vehicleType, vehicleCount, fuelPriceOverride, rates);
      }
      totalManual += showExpenses[i] || 0;
    }
  });

  const showDayCount = tourShows.filter(s => !s.isOff).length;
  const offDayCount = tourShows.filter(s => s.isOff).length;
  const totalBlanketShow = blanketShowAmt * showDayCount;
  const totalBlanketOff = blanketOffAmt * offDayCount;
  const totalExpenses = totalFuel + totalFlights + totalManual + totalBlanketShow + totalBlanketOff;
  const netIncome = totalIncome - totalExpenses;
  const margin = totalIncome ? (netIncome / totalIncome) * 100 : 0;
  const spanDays = (firstDate && lastDate) ? Math.round(((lastDate as Date).getTime() - (firstDate as Date).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const avgPerShow = showDayCount ? totalIncome / showDayCount : 0;

  // Count long drives
  let longDrives = 0;
  tourShows.forEach((s, i) => {
    if (i === 0) return;
    const prev = tourShows[i - 1];
    if (legChoices[i] === 'fly') return;
    const km = getRoadKm(prev.city, prev.country, s.city, s.country);
    const h = km ? estimateDriveHours(km) : null;
    if (h && h > 6) longDrives++;
  });

  // Imperial majority vote for aggregates
  const countryCounts: Record<string, number> = {};
  tourShows.forEach(s => {
    const c = s.countryNorm || s.country;
    if (c) countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const usaCount = (countryCounts['usa'] || 0) + (countryCounts['canada'] || 0) + (countryCounts['mexico'] || 0);
  const imperialTour = usaCount >= tourShows.length / 2;

  return {
    shows: tourShows.length, confirmedShows, pendingShows, backendShows,
    totalIncome, avgPerShow,
    totalCapacity, totalWOP,
    totalFuel, totalFlights, flightLegs, totalManual,
    blanketShowAmt, blanketOffAmt, totalBlanketShow, totalBlanketOff,
    showDayCount, offDayCount,
    totalExpenses, netIncome, margin,
    totalKm, imperialTour, longDrives,
    byCurrency, countries: [...countries],
    firstDate, lastDate, spanDays,
    pax, blanketShowLabel, blanketOffLabel,
  };
}
