import { VEHICLE_MPG, VEHICLE_L100, type VehicleType } from './constants';
import { getRoadKm, getCityCoords, estimateDriveHours, isImperialCountry, legCountry, buildDriveDataKey, type DriveDataMap } from './geography';
import { getRate, toUSD, type OfferObj } from './currency';
import { getAirport } from './flights';
import { calculateShowIncome, type DealTerms, type SettlementData, type ShowForCalc } from './calculateShowIncome';
import { calculatePersonnelCosts, determineDayType, type RosterMember, type TourStats, type PersonnelCostResult } from './personnelPay';
import { calculateCommissions, type Commission, type CommissionResult } from './commissions';
import type { TourVehicle } from './vehicleTypes';
import { getProjectedHotelRate } from './hotelRates';

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
  deal?: DealTerms | null;
  settlement?: SettlementData | null;
  hotelCostActual?: number | null;
  hotelRate?: number | null;
  hotelRooms?: number | null;
  hotelCheckin?: string | null;
  hotelCheckout?: string | null;
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
  tourVehicles?: TourVehicle[];
  flightPriceCache: Record<string, number>;
  roster?: RosterMember[];
  commissions?: Commission[];
  driveData?: DriveDataMap;
  lodgingDefaults?: { rooms: Array<{ type: string; bed_config: string; count: number }>; star_minimum: number; nightly_budget_override?: number } | null;
  hotelBudgetOverride?: number | null;
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
  totalHotel: number;
  hotelCostByState: { actual: number; confirmed: number; projected: number };
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
  totalPersonnel: number;
  totalPerDiems: number;
  personnelResult: PersonnelCostResult | null;
  commissionResult: CommissionResult | null;
  totalCommissions: number;
  incomeAfterCommissions: number;
  labelSupportCredit: number;
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

export function calcFuelCostMultiVehicle(
  km: number,
  fromCountry: string | null | undefined,
  toCountry: string | null | undefined,
  vehicles: TourVehicle[],
  rates: Record<string, number>,
): number {
  if (!km) return 0;
  const legCtry = legCountry(fromCountry, toCountry);
  const activeVehicles = vehicles.filter(v => v.isActive);
  if (activeVehicles.length === 0) return 0;

  let total = 0;
  for (const v of activeVehicles) {
    const mpg = v.mpg > 0 ? v.mpg : 20; // defensive default
    const pricePerGal = v.fuelPricePerGallon > 0 ? v.fuelPricePerGallon : 3.50;
    if (legCtry === 'usa') {
      const miles = km * 0.6214;
      total += (miles / mpg) * pricePerGal;
    } else {
      // Convert MPG -> L/100km, gal price -> USD/litre
      const l100 = 235.215 / mpg;
      const litres = (km / 100) * l100;
      const pricePerLitre = pricePerGal / 3.785;
      total += litres * pricePerLitre;
    }
  }
  return total;
}

// ============================================================
// SINGLE SOURCE OF TRUTH — calcTourFinancials
// ============================================================

export function calcTourFinancials(params: FinancialParams): FinancialResults {
  const {
    tourShows, legChoices, showExpenses, rates, pax,
    flightThreshold, blanketShowAmt, blanketOffAmt,
    vehicleType, vehicleCount, fuelPriceOverride, flightPriceCache,
    blanketShowLabel, blanketOffLabel, roster, commissions, driveData,
    tourVehicles,
  } = params;

  // ── Fuel cost — ESTIMATED only (never replaced by receipts)
  // Hotel costs use a three-state waterfall where receipts replace estimates.
  // Fuel is different: receipts are scattered partial purchases (multiple gas stops per leg)
  // so replacing the estimate with a partial actual would understate total fuel cost mid-tour.
  // Decision (Tim, April 8 2026): estimates persist permanently in totalFuel.
  // Actual fuel receipts live in tour_expenses (category: "Fuel") and are summed separately
  // via expTotalByCategory["Fuel"] on the finance page. Both are shown side-by-side.
  // At end-of-tour report time, use actuals when available, estimates as fallback.
  let totalIncome = 0, totalFuel = 0, totalFlights = 0, totalManual = 0;
  let confirmedShows = 0, pendingShows = 0, backendShows = 0;
  let totalCapacity = 0, totalWOP = 0, totalKm = 0;
  let flightLegs = 0;
  const byCurrency: Record<string, number> = {};
  const countries = new Set<string>();
  let firstDate: Date | null = null, lastDate: Date | null = null;

  tourShows.forEach((s, i) => {
    const showForCalc: ShowForCalc = {
      offer: { amount: s.offer.amount, currency: s.offer.currency },
      deal: s.deal ?? null,
      settlement: s.settlement ?? null,
    };
    s.usd = calculateShowIncome(showForCalc, false, rates);
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
      const driveKey = buildDriveDataKey(prev.city, s.city);
      const cached = driveData?.[driveKey];
      const km = cached ? cached.distanceKm : getRoadKm(prev.city, prev.country, s.city, s.country);
      if (!km && typeof window !== 'undefined') {
        console.warn(`[TourRouter] No distance: "${prev.city}" → "${s.city}" (coords: ${getCityCoords(prev.city, prev.country) ? 'found' : 'MISSING'} → ${getCityCoords(s.city, s.country) ? 'found' : 'MISSING'})`);
      }
      const driveH = cached ? cached.driveHours : (km ? estimateDriveHours(km) : null);
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
        if (km) {
          if (tourVehicles && tourVehicles.some(v => v.isActive)) {
            totalFuel += calcFuelCostMultiVehicle(km, prev.country, s.country, tourVehicles, rates);
          } else {
            totalFuel += calcFuelCostUSD(km, prev.country, s.country, vehicleType, vehicleCount, fuelPriceOverride, rates);
          }
        }
      }
      totalManual += showExpenses[i] || 0;
    }
  });

  const showDayCount = tourShows.filter(s => !s.isOff).length;
  const offDayCount = tourShows.filter(s => s.isOff).length;

  // Personnel pay — if roster exists, use it instead of flat blankets
  let totalPersonnel = 0;
  let totalPerDiems = 0;
  let personnelResult: PersonnelCostResult | null = null;

  if (roster && roster.length > 0) {
    const tourStats: TourStats = {
      days: [],
      showDayCount,
      offDayCount,
      travelDayCount: 0,
      loadInDayCount: 0,
      totalDayCount: showDayCount + offDayCount,
      weekCount: Math.ceil((showDayCount + offDayCount) / 7),
      zeroShowWeeks: 0,
      totalMerchGross: 0,
      totalMerchNet: 0,
      netTourIncome: totalIncome,
    };
    personnelResult = calculatePersonnelCosts(roster, tourStats, rates);
    totalPersonnel = personnelResult.totalPersonnelCost;
    totalPerDiems = personnelResult.totalPerDiems;
  }

  const totalBlanketShow = personnelResult ? 0 : blanketShowAmt * showDayCount;
  const totalBlanketOff = personnelResult ? 0 : blanketOffAmt * offDayCount;

  // Hotel costs — three-state waterfall per show
  // State 1: actual receipt (hotel_cost_actual)
  // State 2: confirmation estimate (hotel_rate × hotel_rooms × nights)
  // State 3: planning projection (artist lodging defaults × market rate)
  const { lodgingDefaults, hotelBudgetOverride } = params;
  let totalHotel = 0;
  const hotelCostByState = { actual: 0, confirmed: 0, projected: 0 };

  const starRating = lodgingDefaults?.star_minimum || 3;
  const defaultRoomCount = lodgingDefaults?.rooms
    ? lodgingDefaults.rooms.reduce((sum, r) => sum + (r.count || 1), 0)
    : 0;

  tourShows.forEach((s) => {
    // State 1 — actual receipt
    if (s.hotelCostActual && s.hotelCostActual > 0) {
      totalHotel += s.hotelCostActual;
      hotelCostByState.actual += s.hotelCostActual;
      return;
    }
    // State 2 — confirmation estimate
    if (s.hotelRate && s.hotelRooms) {
      const nights = (s.hotelCheckin && s.hotelCheckout)
        ? Math.max(1, Math.round((new Date(s.hotelCheckout).getTime() - new Date(s.hotelCheckin).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;
      const confirmationCost = s.hotelRate * s.hotelRooms * nights;
      totalHotel += confirmationCost;
      hotelCostByState.confirmed += confirmationCost;
      return;
    }
    // State 3 — planning projection
    if (defaultRoomCount > 0) {
      const rateOverride = hotelBudgetOverride || lodgingDefaults?.nightly_budget_override || null;
      const nightlyRate = rateOverride || getProjectedHotelRate(s.city, s.countryNorm || s.country, starRating);
      const projectedCost = nightlyRate * defaultRoomCount;
      totalHotel += projectedCost;
      hotelCostByState.projected += projectedCost;
    }
  });

  // Add hotel to total expenses
  const totalExpenses = totalFuel + totalFlights + totalManual + totalBlanketShow + totalBlanketOff + totalPersonnel + totalHotel;

  // Commissions
  let commissionResult: CommissionResult | null = null;
  if (commissions && commissions.length > 0) {
    const tourWeeks = Math.ceil((showDayCount + offDayCount) / 7);
    commissionResult = calculateCommissions(commissions, totalIncome, totalExpenses, tourWeeks, rates);
  }

  const netIncome = totalIncome - (commissionResult?.totalCommissions ?? 0) - totalExpenses + (commissionResult?.labelSupportTotal ?? 0);
  const margin = totalIncome ? (netIncome / totalIncome) * 100 : 0;
  const spanDays = (firstDate && lastDate) ? Math.round(((lastDate as Date).getTime() - (firstDate as Date).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const avgPerShow = showDayCount ? totalIncome / showDayCount : 0;

  // Count long drives
  let longDrives = 0;
  tourShows.forEach((s, i) => {
    if (i === 0) return;
    const prev = tourShows[i - 1];
    if (legChoices[i] === 'fly') return;
    const driveKey = buildDriveDataKey(prev.city, s.city);
    const cached = driveData?.[driveKey];
    const km = cached ? cached.distanceKm : getRoadKm(prev.city, prev.country, s.city, s.country);
    const h = cached ? cached.driveHours : (km ? estimateDriveHours(km) : null);
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
    totalExpenses, totalHotel, hotelCostByState, netIncome, margin,
    totalKm, imperialTour, longDrives,
    byCurrency, countries: [...countries],
    firstDate, lastDate, spanDays,
    pax, blanketShowLabel, blanketOffLabel,
    totalPersonnel, totalPerDiems, personnelResult,
    commissionResult,
    totalCommissions: commissionResult?.totalCommissions ?? 0,
    incomeAfterCommissions: commissionResult?.incomeAfterCommissions ?? totalIncome,
    labelSupportCredit: commissionResult?.labelSupportTotal ?? 0,
  };
}
