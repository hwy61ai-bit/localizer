import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tourId = searchParams.get("tourId");
  const orgId = searchParams.get("orgId");
  if (!tourId || !orgId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const supabase = await supabaseServer();

  const { data: events } = await supabase
    .from("events")
    .select("id")
    .eq("tour_id", tourId);

  const eventIds = (events ?? []).map(e => e.id);
  if (eventIds.length === 0) return NextResponse.json({ links: [] });

  const { data: links } = await supabase
    .from("venue_links")
    .select("event_id, render_square_url, render_story_url, render_landscape_url")
    .in("event_id", eventIds)
    .eq("is_active", true);

  return NextResponse.json({ links: links ?? [] });
}
