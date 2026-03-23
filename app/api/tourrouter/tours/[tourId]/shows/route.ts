import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  if (!profile?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  // Verify tour belongs to org
  const { data: tour } = await supabase
    .from("routing_tours")
    .select("id")
    .eq("id", tourId)
    .eq("org_id", profile.org_id)
    .single();
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  const { shows } = await req.json();
  if (!Array.isArray(shows) || shows.length === 0) {
    return NextResponse.json({ error: "Shows array required" }, { status: 400 });
  }

  const rows = shows.map((s: Record<string, unknown>, i: number) => ({
    routing_tour_id: tourId,
    org_id: profile.org_id,
    sort_order: i,
    date: s.date || null,
    event_name: s.event_name || s.event || null,
    city: s.city || null,
    country: s.country || null,
    country_normalized: s.country_normalized || null,
    venue: s.venue || null,
    offer_raw: s.offer_raw || s.offer || null,
    offer_amount: s.offer_amount ?? 0,
    offer_currency: s.offer_currency || "USD",
    capacity: s.capacity ?? null,
    status: s.status || null,
    is_off_day: s.is_off_day ?? false,
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ shows: inserted }, { status: 201 });
}
