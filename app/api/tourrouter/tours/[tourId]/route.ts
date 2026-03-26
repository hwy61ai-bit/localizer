import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

async function getAuthOrg(supabase: Awaited<ReturnType<typeof supabaseServer>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return profile?.org_id ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const supabase = await supabaseServer();
  const orgId = await getAuthOrg(supabase);
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: tour, error: tourError } = await supabase
    .from("tours_routing")
    .select("*")
    .eq("id", tourId)
    .eq("org_id", orgId)
    .single();

  if (tourError || !tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  const { data: shows } = await supabase
    .from("tour_shows")
    .select("*")
    .eq("tour_id", tourId)
    .order("sort_order");

  return NextResponse.json({ tour, shows: shows ?? [] });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const supabase = await supabaseServer();
  const orgId = await getAuthOrg(supabase);
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Only allow known settings fields
  const allowed = [
    "name", "artist_id", "vehicle_type", "pax", "mpg",
    "fuel_price_usd", "flight_threshold_h",
    "blanket_show_amount", "blanket_off_amount",
    "blanket_show_label", "blanket_off_label",
    "currency_rates", "leg_choices", "image_url", "advance_config",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  update.updated_at = new Date().toISOString();

  const { data: tour, error } = await supabase
    .from("tours_routing")
    .update(update)
    .eq("id", tourId)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tour });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const supabase = await supabaseServer();
  const orgId = await getAuthOrg(supabase);
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("tours_routing")
    .delete()
    .eq("id", tourId)
    .eq("org_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
