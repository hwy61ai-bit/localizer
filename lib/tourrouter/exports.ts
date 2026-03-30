import type { TourShow } from './financials';
import type { VehicleType } from './constants';
import { VEHICLE_MPG, VEHICLE_L100 } from './constants';
import { getRoadKm, legCountry, formatDateDisplay, buildDriveDataKey, type DriveDataMap } from './geography';
import { getRate } from './currency';
import { getAirport } from './flights';

export interface ExportRow {
  num: string | number;
  date: string;
  event: string;
  city: string;
  country: string;
  venue: string;
  offer: string;
  usd: number;
  status: string;
  capacity: number;
  doors: string | undefined;
  showtime: string | undefined;
  merch: string | undefined;
  fuelCost: number;
  flightCost: number;
  manualExp: number;
  isOff: boolean;
}

export interface BuildExportRowsParams {
  tourShows: TourShow[];
  legChoices: Record<number, string>;
  showExpenses: Record<number, number>;
  pax: number;
  vehicleType: VehicleType;
  vehicleCount: number;
  fuelPriceOverride: number | null;
  rates: Record<string, number>;
  flightPriceCache: Record<string, number>;
  driveData?: DriveDataMap;
}

function calcFuelCostForExport(
  km: number,
  fromCountry: string | null | undefined,
  toCountry: string | null | undefined,
  vehicleType: VehicleType,
  vehicleCount: number,
  fuelPriceOverride: number | null,
  rates: Record<string, number>,
): number {
  if (!km) return 0;
  // CRITICAL: variable is legCtry, not legCountry (name collision)
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
    const pricePerLitre = 1.65 * eurRate;
    return litres * (fuelPriceOverride ? fuelPriceOverride / 3.785 : pricePerLitre) * vehicleCount;
  }
}

export function buildExportRows(params: BuildExportRowsParams): ExportRow[] {
  const {
    tourShows, legChoices, showExpenses, pax,
    vehicleType, vehicleCount, fuelPriceOverride, rates, flightPriceCache, driveData,
  } = params;

  const rows: ExportRow[] = [];
  let showNum = 0;

  tourShows.forEach((s, i) => {
    if (!s.isOff) showNum++;
    let fuelCost = 0, flightCost = 0;

    if (i > 0) {
      const prev = tourShows[i - 1];
      const driveKey = buildDriveDataKey(prev.city, s.city);
      const cached = driveData?.[driveKey];
      const km = cached ? cached.distanceKm : getRoadKm(prev.city, prev.country, s.city, s.country);
      const flying = legChoices[i] === 'fly';

      if (flying) {
        const fromAP = getAirport(prev.city, prev.country);
        const toAP = getAirport(s.city, s.country);
        if (fromAP && toAP) {
          const dateStr = s.date ? s.date.toISOString().split('T')[0] : '';
          const key = fromAP.iata + '-' + toAP.iata + '-' + dateStr + '-' + pax + 'pax';
          flightCost = flightPriceCache[key] || 0;
        }
      } else if (km) {
        fuelCost = calcFuelCostForExport(km, prev.country, s.country, vehicleType, vehicleCount, fuelPriceOverride, rates);
      }
    }

    rows.push({
      num: s.isOff ? 'OFF' : showNum,
      date: formatDateDisplay(s.date),
      event: s.event,
      city: s.city,
      country: s.country,
      venue: s.venue,
      offer: s.offer.display || '',
      usd: s.isOff ? 0 : s.usd,
      status: s.status,
      capacity: s.capacity || 0,
      doors: s.doors,
      showtime: s.showtime,
      merch: s.merch,
      fuelCost,
      flightCost,
      manualExp: showExpenses[i] || 0,
      isOff: s.isOff,
    });
  });

  return rows;
}
