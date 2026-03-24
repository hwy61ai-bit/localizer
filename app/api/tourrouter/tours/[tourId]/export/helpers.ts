import { supabaseServer } from "@/lib/supabaseServer";
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
  type TourShow,
  type VehicleType,
  type ExportRow,
  type FinancialResults,
} from "@/lib/tourrouter";

export type ExportData = {
  tour: Record<string, unknown>;
  shows: Record<string, unknown>[];
  rows: ExportRow[];
  fin: FinancialResults;
  tourName: string;
  legChoices: Record<number, string>;
};

export async function getExportData(tourId: string): Promise<ExportData | null> {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return null;

  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return null;

  const { data: tour } = await supabase
    .from("tours_routing")
    .select("*")
    .eq("id", tourId)
    .eq("org_id", profile.org_id)
    .single();
  if (!tour) return null;

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
    flightPriceCache: {},
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
  });

  return {
    tour,
    shows: showsArr,
    rows,
    fin,
    tourName: (tour.name as string) || "tour",
    legChoices,
  };
}

// Re-export utilities needed by export routes
export { fmtUSD, fmtHours, fmtDist, formatDateDisplay, getRoadKm, estimateDriveHours, legCountry };
