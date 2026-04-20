import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const { orgId, eventId } = await req.json();
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

  if (tour.org_id !== orgId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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

  const { data: existing } = await supabase
    .from("venue_links").select("token")
    .eq("event_id", eventId).eq("is_active", true).maybeSingle();

  if (existing?.token) {
    return NextResponse.json({ token: existing.token });
  }

  const token = generatePublicToken();
  const { data: inserted, error } = await supabase
    .from("venue_links")
    .insert({
      org_id: orgId,
      event_id: eventId,
      token,
      is_active: true,
    })
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!inserted) {
    console.error("[venue-link] Insert returned no row — possible silent RLS rejection", { eventId, orgId, userId: user.id });
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }

  return NextResponse.json({ token });
}
