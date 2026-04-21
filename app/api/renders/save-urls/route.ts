import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const { eventId, orgId, renderUrls } = await req.json();
  if (!eventId || !orgId || !renderUrls) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  // Upsert venue_link — same logic as existing generate route
  const { data: existing } = await supabase
    .from("venue_links")
    .select("id, token")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("venue_links")
      .update({ ...renderUrls })
      .eq("id", existing.id)
      .select()
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) {
      console.error("[renders/save-urls] venue_links update returned no row — possible silent RLS rejection", { eventId, orgId, venue_link_id: existing.id });
      return NextResponse.json({ error: "venue_links_update_failed" }, { status: 500 });
    }
  } else {
    const token = generatePublicToken();
    const { error } = await supabase.from("venue_links").insert({
      org_id: orgId,
      event_id: eventId,
      token,
      is_active: true,
      ...renderUrls,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark event as ready
  const { data: eventUpdate, error: eventUpdateErr } = await supabase
    .from("events")
    .update({ render_status: "ready" })
    .eq("id", eventId)
    .select()
    .maybeSingle();
  if (eventUpdateErr) {
    console.error("[renders/save-urls] events update errored", { eventId, orgId, error: eventUpdateErr.message });
  } else if (!eventUpdate) {
    console.error("[renders/save-urls] events render_status update returned no row — possible silent RLS rejection (non-fatal, venue_links already saved)", { eventId, orgId });
  }

  return NextResponse.json({ ok: true });
}
