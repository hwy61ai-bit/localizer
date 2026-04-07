import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  calcTourFinancials,
  fmtUSD,
  formatDateDisplay,
  type TourShow,
  type VehicleType,
} from "@/lib/tourrouter";
import type { TourVehicle } from "@/lib/tourrouter/vehicleTypes";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = getServiceClient();

  // Look up token
  const { data: link } = await supabase
    .from("finance_report_links")
    .select("tour_id, org_id, expires_at")
    .eq("token", token)
    .single();

  if (!link) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "Report link has expired" }, { status: 404 });
  }

  const tourId = link.tour_id;

  // Fetch tour + shows
  const { data: tour } = await supabase
    .from("tours_routing")
    .select("*, artists(name)")
    .eq("id", tourId)
    .single();
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  const { data: shows } = await supabase
    .from("tour_shows")
    .select("*")
    .eq("tour_id", tourId)
    .order("sort_order");

  const showsArr = (shows || []) as Record<string, unknown>[];
  const rates = (tour.currency_rates as Record<string, number>) || {};
  const legChoices: Record<number, string> = {};
  if (tour.leg_choices) {
    for (const [k, v] of Object.entries(tour.leg_choices as Record<string, string>)) {
      legChoices[parseInt(k)] = v;
    }
  }

  const tourShows: TourShow[] = showsArr.map((s) => ({
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
    pax: (tour.pax as number) || 4,
    flightThreshold: (tour.flight_threshold_h as number) || 6,
    blanketShowAmt: (tour.blanket_show_amount as number) || 0,
    blanketOffAmt: (tour.blanket_off_amount as number) || 0,
    blanketShowLabel: (tour.blanket_show_label as string) || "Band Pay",
    blanketOffLabel: (tour.blanket_off_label as string) || "Hotel + Per Diem",
    vehicleType: (tour.vehicle_type as VehicleType) || "van",
    vehicleCount: 1,
    fuelPriceOverride: (tour.fuel_price_usd as number) || null,
    tourVehicles: (tour.tour_vehicles as TourVehicle[] | undefined) ?? [],
    flightPriceCache: {},
    commissions: (tour.tour_commissions as never[]) || [],
  });

  const artistData = tour.artists as Record<string, unknown> | null;
  const artistName = (artistData?.name as string) || "";

  const perShow = showsArr.filter((s) => !s.is_off).map((s) => ({
    date: s.date_iso ? formatDateDisplay(new Date((s.date_iso as string) + "T00:00:00")) : "",
    dateRaw: s.date_iso as string,
    venue: (s.venue as string) || "",
    city: (s.city as string) || "",
    country: (s.country as string) || "",
    guarantee: (s.offer_amount as number) || 0,
    currency: (s.offer_currency as string) || "USD",
    offerDisplay: (s.offer_display as string) || "",
    status: (s.status as string) || "",
  }));

  const commissionItems = fin.commissionResult
    ? (fin.commissionResult as unknown as Record<string, unknown>).items as { label: string; recipientName: string; type: string; amountUSD: number }[] ?? []
    : [];

  return NextResponse.json({
    tourName: (tour.name as string) || "",
    artistName,
    dateRange: {
      first: fin.firstDate ? formatDateDisplay(fin.firstDate) : null,
      last: fin.lastDate ? formatDateDisplay(fin.lastDate) : null,
      spanDays: fin.spanDays,
    },
    summary: {
      showCount: fin.showDayCount,
      offDayCount: fin.offDayCount,
      totalGross: fin.totalIncome,
      totalGrossFormatted: fmtUSD(fin.totalIncome),
      totalCommissions: fin.totalCommissions,
      totalCommissionsFormatted: fmtUSD(fin.totalCommissions),
      totalExpenses: fin.totalExpenses,
      totalExpensesFormatted: fmtUSD(fin.totalExpenses),
      labelSupportCredit: fin.labelSupportCredit,
      netIncome: fin.netIncome,
      netIncomeFormatted: fmtUSD(fin.netIncome),
      margin: fin.margin,
      avgPerShow: fin.avgPerShow,
      avgPerShowFormatted: fmtUSD(fin.avgPerShow),
    },
    commissions: commissionItems,
    perShow,
    transport: {
      totalKm: fin.totalKm,
      totalMiles: Math.round(fin.totalKm * 0.6214),
      fuelCost: fin.totalFuel,
      fuelCostFormatted: fmtUSD(fin.totalFuel),
      flightCost: fin.totalFlights,
      flightCostFormatted: fmtUSD(fin.totalFlights),
      flightLegs: fin.flightLegs,
      imperial: fin.imperialTour,
    },
    personnel: {
      totalPersonnel: fin.totalPersonnel,
      totalPersonnelFormatted: fmtUSD(fin.totalPersonnel),
      totalPerDiems: fin.totalPerDiems,
      totalPerDiemsFormatted: fmtUSD(fin.totalPerDiems),
    },
    generatedAt: new Date().toISOString(),
  });
}
