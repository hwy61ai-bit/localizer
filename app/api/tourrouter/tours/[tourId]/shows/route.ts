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
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  // Verify tour belongs to org
  const { data: tour } = await supabase
    .from("tours_routing")
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
    tour_id: tourId,
    org_id: profile.org_id,
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ shows: inserted }, { status: 201 });
}
