import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import {
  calcTourFinancials,
  fmtUSD,
  formatDateDisplay,
  type TourShow,
  type VehicleType,
} from "@/lib/tourrouter";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const { data: tour } = await supabase
    .from("tours_routing")
    .select("*, artists(name)")
    .eq("id", tourId)
    .eq("org_id", orgId)
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
    flightPriceCache: {},
    commissions: (tour.tour_commissions as never[]) || [],
  });

  const artistData = tour.artists as Record<string, unknown> | null;
  const artistName = (artistData?.name as string) || "";

  // Per-show breakdown
  const perShow = showsArr.filter((s) => !s.is_off).map((s) => {
    const dateStr = s.date_iso ? formatDateDisplay(new Date((s.date_iso as string) + "T00:00:00")) : "";
    return {
      date: dateStr,
      dateRaw: s.date_iso as string,
      venue: (s.venue as string) || "",
      city: (s.city as string) || "",
      country: (s.country as string) || "",
      guarantee: (s.offer_amount as number) || 0,
      currency: (s.offer_currency as string) || "USD",
      offerDisplay: (s.offer_display as string) || "",
      status: (s.status as string) || "",
    };
  });

  // Commission items
  const commissionItems = fin.commissionResult
    ? (fin.commissionResult as unknown as Record<string, unknown>).items as { label: string; recipientName: string; type: string; amountUSD: number }[] ?? []
    : [];

  const report = {
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
  };

  return NextResponse.json(report);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  // Verify tour ownership
  const { data: tour } = await supabase
    .from("tours_routing")
    .select("id")
    .eq("id", tourId)
    .eq("org_id", orgId)
    .single();
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("finance_report_links")
    .insert({
      tour_id: tourId,
      org_id: orgId,
      token,
      expires_at: expiresAt,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    console.error("NEXT_PUBLIC_APP_URL env var is not set — cannot build share link");
    return NextResponse.json(
      { error: "Server configuration error: missing NEXT_PUBLIC_APP_URL" },
      { status: 500 }
    );
  }
  const url = `${appUrl}/report/${token}`;
  return NextResponse.json({ token, url, expiresAt });
}
