import { supabaseServer } from "@/lib/supabaseServer";
import { requirePaidTourRouterAccess } from "@/lib/tourrouter/requireAccess";
import {
  buildExportRows,
  calcTourFinancials,
  getRoadKm,
  estimateDriveHours,
  fmtHours,
  fmtUSD,
  fmtDist,
  formatDateDisplay,
  legCountry,
  buildDriveDataKey,
  type TourShow,
  type VehicleType,
  type ExportRow,
  type FinancialResults,
  type DriveDataMap,
} from "@/lib/tourrouter";
import type { TourVehicle } from "@/lib/tourrouter/vehicleTypes";
import { prefetchDriveDataServer } from "@/lib/tourrouter/mapbox";
import { resolveAllCityCoords, resolveAllAirports } from "@/lib/tourrouter/geocoding";

export type ExportData = {
  tour: Record<string, unknown>;
  shows: Record<string, unknown>[];
  rows: ExportRow[];
  fin: FinancialResults;
  tourName: string;
  legChoices: Record<number, string>;
  driveData: DriveDataMap;
};

type ExportFailure = { ok: false; reason: "unauthorized" | "no_org" | "no_tourrouter_access" | "export_requires_paid" | "not_found"; detail?: string };
type ExportSuccess = { ok: true; data: ExportData };
export type ExportResult = ExportFailure | ExportSuccess;

export async function getExportData(tourId: string): Promise<ExportResult> {
  const access = await requirePaidTourRouterAccess();
  if (!access.ok) {
    // access.reason is "unauthorized" | "no_org" | "no_tourrouter_access" |
    // "export_requires_paid" — all four are valid ExportFailure reasons.
    return { ok: false, reason: access.reason };
  }

  const supabase = await supabaseServer();

  const { data: tour } = await supabase
    .from("tours_routing")
    .select("*, artists(name)")
    .eq("id", tourId)
    .eq("org_id", access.orgId)
    .single();
  if (!tour) return { ok: false, reason: "not_found" };

  const { data: shows } = await supabase
    .from("tour_shows")
    .select("*")
    .eq("tour_id", tourId)
    .order("sort_order");

  const showsArr = shows || [];
  const rates = (tour.currency_rates as Record<string, number>) || {};
  const vehicleType = (tour.vehicle_type as VehicleType) || "van";
  const vehicleCount = 1;
  const pax = (tour.pax as number) || 4;

  const legChoices: Record<number, string> = {};
  if (tour.leg_choices) {
    for (const [k, v] of Object.entries(tour.leg_choices as Record<string, string>)) {
      legChoices[parseInt(k)] = v;
    }
  }

  const tourShows: TourShow[] = showsArr.map((s: Record<string, unknown>) => ({
    date: s.date_iso ? new Date((s.date_iso as string) + "T00:00:00") : null,
    event: (s.event as string) || "",
    city: (s.city as string) || "",
    country: (s.country as string) || "",
    countryNorm: (s.country_norm as string) || "",
    venue: (s.venue as string) || "",
    offer: {
      amount: (s.offer_amount as number) || 0,
      currency: (s.offer_currency as string) || "USD",
      display: (s.offer_display as string) || "",
    },
    usd: 0,
    capacity: (s.capacity as number) || 0,
    status: (s.status as string) || "",
    isOff: (s.is_off as boolean) || false,
    backend: (s.backend as string) || undefined,
    doors: (s.doors as string) || undefined,
    showtime: (s.showtime as string) || undefined,
    merch: (s.merch as string) || undefined,
  }));

  // Prefetch Mapbox drive data and geo coordinates in parallel
  const showPairs = showsArr.map((s: Record<string, unknown>) => ({
    city: (s.city as string) || "",
    country: (s.country as string) || "",
    isOff: (s.is_off as boolean) || false,
  }));

  const [driveData, coordsMap] = await Promise.all([
    prefetchDriveDataServer(showPairs),
    resolveAllCityCoords(showPairs),
  ]);

  // Airports need coordsMap for nearest-airport fallback, so resolve after coords
  const airportMap = await resolveAllAirports(showPairs, coordsMap);

  const fin = calcTourFinancials({
    tourShows,
    legChoices,
    showExpenses: {},
    rates,
    pax,
    flightThreshold: (tour.flight_threshold_h as number) || 6,
    blanketShowAmt: (tour.blanket_show_amount as number) || 0,
    blanketOffAmt: (tour.blanket_off_amount as number) || 0,
    blanketShowLabel: (tour.blanket_show_label as string) || "Band Pay",
    blanketOffLabel: (tour.blanket_off_label as string) || "Hotel + Per Diem",
    vehicleType,
    vehicleCount,
    fuelPriceOverride: (tour.fuel_price_usd as number) || null,
    tourVehicles: (tour.tour_vehicles as unknown as TourVehicle[] | undefined) ?? [],
    flightPriceCache: {},
    driveData,
    coordsMap,
    airportMap,
  });

  const rows = buildExportRows({
    tourShows,
    legChoices,
    showExpenses: {},
    pax,
    vehicleType,
    vehicleCount,
    fuelPriceOverride: (tour.fuel_price_usd as number) || null,
    rates,
    flightPriceCache: {},
    driveData,
  });

  return {
    ok: true,
    data: {
      tour,
      shows: showsArr,
      rows,
      fin,
      tourName: (tour.name as string) || "tour",
      legChoices,
      driveData,
    },
  };
}

// Re-export utilities needed by export routes
export { fmtUSD, fmtHours, fmtDist, formatDateDisplay, getRoadKm, estimateDriveHours, legCountry, buildDriveDataKey, type DriveDataMap };
