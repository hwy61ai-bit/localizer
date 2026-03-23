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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tourId: string; showId: string }> },
) {
  const { tourId, showId } = await params;
  const supabase = await supabaseServer();
  const orgId = await getAuthOrg(supabase);
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const allowed = [
    "sort_order", "date", "event_name", "city", "country", "country_normalized",
    "venue", "offer_raw", "offer_amount", "offer_currency", "capacity",
    "status", "is_off_day", "doors", "showtime", "merch", "backend",
    "promoter", "notes", "support",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const { data: show, error } = await supabase
    .from("tour_shows")
    .update(update)
    .eq("id", showId)
    .eq("routing_tour_id", tourId)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ show });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string; showId: string }> },
) {
  const { tourId, showId } = await params;
  const supabase = await supabaseServer();
  const orgId = await getAuthOrg(supabase);
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("tour_shows")
    .delete()
    .eq("id", showId)
    .eq("routing_tour_id", tourId)
    .eq("org_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
