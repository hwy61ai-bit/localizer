import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ tourId: string; showId: string }> },
) {
  const { tourId, showId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const body = await req.json();

  const allowed = [
    "sort_order", "date_iso", "event", "city", "country", "country_norm",
    "venue", "offer_display", "offer_amount", "offer_currency", "capacity",
    "status", "billing", "age_limit", "is_off", "doors", "showtime", "onstage", "curfew",
    "merch", "backend", "promoter", "promoter_contact", "production_contact",
    "hotel_name", "hotel_address", "hotel_checkin", "hotel_checkout",
    "hotel_rooms", "hotel_rate", "hotel_currency", "hotel_confirmation",
    "hotel_notes", "hotel_block", "hotel_block_size", "hotel_block_rate",
    "hotel_cutoff_date", "hotel_attrition_pct", "guest_list_cutoff",
    "deposit_amount", "deposit_currency", "deposit_status", "deposit_collected_by", "deposit_notes",
    "advance_status", "advance_auto_stop",
    "deal", "settlement",
    "notes", "support",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  const { data: show, error } = await supabase
    .from("tour_shows")
    .update(update)
    .eq("id", showId)
    .eq("tour_id", tourId)
    .eq("org_id", orgId)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!show) return NextResponse.json({ error: "Show not found" }, { status: 404 });
  return NextResponse.json({ show });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string; showId: string }> },
) {
  const { tourId, showId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const { data: deleted, error } = await supabase
    .from("tour_shows")
    .delete()
    .eq("id", showId)
    .eq("tour_id", tourId)
    .eq("org_id", orgId)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted) return NextResponse.json({ error: "Show not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
