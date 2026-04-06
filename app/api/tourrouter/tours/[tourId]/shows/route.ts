import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();

  // Verify tour belongs to org
  const { data: tour } = await supabase
    .from("tours_routing")
    .select("id")
    .eq("id", tourId)
    .eq("org_id", result.orgId)
    .single();
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  const { shows } = await req.json();
  if (!Array.isArray(shows) || shows.length === 0) {
    return NextResponse.json({ error: "Shows array required" }, { status: 400 });
  }

  const rows = shows.map((s: Record<string, unknown>, i: number) => ({
    tour_id: tourId,
    org_id: result.orgId,
    sort_order: i,
    date_iso: s.date_iso || s.date || null,
    event: s.event || s.event_name || null,
    city: s.city || null,
    country: s.country || null,
    country_norm: s.country_norm || null,
    venue: s.venue || null,
    offer_display: s.offer_display || s.offer || null,
    offer_amount: s.offer_amount ?? 0,
    offer_currency: s.offer_currency || "USD",
    capacity: s.capacity ?? null,
    status: s.status || null,
    is_off: s.is_off ?? false,
    doors: s.doors || null,
    showtime: s.showtime || null,
    merch: s.merch || null,
    backend: s.backend || null,
    promoter: s.promoter || null,
    notes: s.notes || null,
    support: s.support || null,
  }));

  const { data: inserted, error } = await supabase
    .from("tour_shows")
    .insert(rows)
    .select();

  if (error) {
    console.error("tour_shows insert error:", error.message, error.details, error.hint, "rows[0]:", JSON.stringify(rows[0]));
    return NextResponse.json({ error: error.message, details: error.details, hint: error.hint }, { status: 500 });
  }

  // ── Fill gaps between show dates with off days ──
  try {
    const { data: allShows } = await supabase
      .from("tour_shows")
      .select("id, date_iso, is_off, sort_order")
      .eq("tour_id", tourId)
      .order("date_iso", { ascending: true });

    if (allShows && allShows.length >= 2) {
      const existingDates = new Set(allShows.map((s) => s.date_iso).filter(Boolean));
      const offDayRows: Record<string, unknown>[] = [];

      for (let i = 0; i < allShows.length - 1; i++) {
        const currentDate = allShows[i].date_iso;
        const nextDate = allShows[i + 1].date_iso;
        if (!currentDate || !nextDate) continue;

        const d = new Date(currentDate + "T12:00:00");
        const end = new Date(nextDate + "T12:00:00");
        d.setDate(d.getDate() + 1);

        while (d < end) {
          const iso = d.toISOString().split("T")[0];
          if (!existingDates.has(iso)) {
            existingDates.add(iso);
            offDayRows.push({
              tour_id: tourId,
              org_id: result.orgId,
              date_iso: iso,
              is_off: true,
              event: "OFF",
              city: "",
              country: "",
              sort_order: 9999,
            });
          }
          d.setDate(d.getDate() + 1);
        }
      }

      if (offDayRows.length > 0) {
        await supabase.from("tour_shows").insert(offDayRows);
      }
    }
  } catch (e) {
    console.error("Off day gap fill error:", e);
  }

  return NextResponse.json({ shows: inserted }, { status: 201 });
}
