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
    "opener",
  ];

  const RENDER_AFFECTING = ["date_iso", "city", "state", "venue", "venue_name", "venue_city", "venue_state", "opener"];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_valid_fields" }, { status: 400 });
  }

  // Read paths (venue page, renders, tour-data) prefer venue_* siblings via
  // (venue_name ?? venue) style fallbacks — imported events populate the siblings
  // and edits to base columns silently don't propagate. Mirror server-side so the
  // base column and its sibling stay in sync. venue_name can arrive explicitly
  // from the pre-check modal (hence the guard); venue_city/venue_state are never
  // client-sent (not in `allowed`) so mirror unconditionally.
  if ("venue" in update && !("venue_name" in update)) update.venue_name = update.venue;
  if ("city" in update) update.venue_city = update.city;
  if ("state" in update) update.venue_state = update.state;

  const { data: current, error: currentErr } = await supabase
    .from("events")
    .select("date_iso, city, state, venue, venue_name, venue_city, venue_state, opener, needs_rerender")
    .eq("id", eventId)
    .maybeSingle();

  if (currentErr) {
    // Couldn't verify current values — flag stale rather than risk silent staleness.
    // A false positive (over-flagging) is recoverable via re-render; a false negative
    // ships stale assets to the promoter.
    console.error("[events/PATCH] current-value fetch errored — conservatively flagging needs_rerender", { eventId, error: currentErr.message });
    if (RENDER_AFFECTING.some(k => k in update)) {
      update.needs_rerender = true;
    }
  } else if (current) {
    const changed = RENDER_AFFECTING.some(k => {
      if (!(k in update)) return false;
      const before = (current as Record<string, unknown>)[k] ?? null;
      const after = update[k] ?? null;
      return before !== after;
    });
    if (changed) update.needs_rerender = true;
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
