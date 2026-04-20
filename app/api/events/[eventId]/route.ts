import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;
  const supabase = await supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, tour_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: tour } = await supabase
    .from("tours")
    .select("org_id")
    .eq("id", event.tour_id)
    .maybeSingle();

  if (!tour) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("org_id", tour.org_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: deleted, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, deleted_event_id: eventId });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;
  const supabase = await supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json() as Record<string, unknown>;

  const { data: event } = await supabase
    .from("events")
    .select("id, tour_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: tour } = await supabase
    .from("tours")
    .select("org_id")
    .eq("id", event.tour_id)
    .maybeSingle();

  if (!tour) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("org_id", tour.org_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const allowed = [
    "date_iso", "day", "city", "state",
    "venue", "venue_name", "promoter_email",
  ];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_valid_fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("events")
    .update(update)
    .eq("id", eventId)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, event: data });
}
