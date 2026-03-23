import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client for public access (no user auth)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = getServiceClient();

  const { data: show } = await supabase
    .from("tour_shows")
    .select("id, date, event_name, city, country, venue, doors, showtime, onstage, curfew, routing_tour_id, advance_form_submitted_at")
    .eq("advance_form_token", token)
    .single();

  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch tour + artist name (NO financial fields)
  const { data: tour } = await supabase
    .from("routing_tours")
    .select("name, artist_id, artists(name)")
    .eq("id", show.routing_tour_id)
    .single();

  const tourData = tour as Record<string, unknown> | null;
  const artistData = (tourData?.artists as Record<string, unknown>) || null;

  let formattedDate = show.date || "";
  if (show.date) {
    try {
      const d = new Date(show.date + "T12:00:00");
      formattedDate = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    } catch { /* use raw */ }
  }

  return NextResponse.json({
    showId: show.id,
    date: formattedDate,
    dateRaw: show.date,
    eventName: show.event_name,
    city: show.city,
    country: show.country,
    venue: show.venue,
    artistName: (artistData?.name as string) || (tourData?.name as string) || "",
    tourName: (tourData?.name as string) || "",
    doors: show.doors,
    showtime: show.showtime,
    onstage: show.onstage,
    curfew: show.curfew,
    alreadySubmitted: !!show.advance_form_submitted_at,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = getServiceClient();

  // Find show by token
  const { data: show } = await supabase
    .from("tour_shows")
    .select("id")
    .eq("advance_form_token", token)
    .single();

  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Only allow advance-related fields (NEVER financial fields)
  const allowed = [
    "doors", "showtime", "onstage", "curfew",
    "adv_load_in", "adv_soundcheck",
    "adv_wifi_name", "adv_wifi_password", "adv_parking",
    "adv_venue_notes",
    "adv_production_contact_name", "adv_production_contact_email", "adv_production_contact_phone",
    "adv_backline_notes",
    "adv_hospitality_notes", "adv_catering", "adv_dressing_room",
    "adv_settlement_contact_name", "adv_settlement_contact_phone", "adv_settlement_contact_email",
    "adv_submitted_by_name", "adv_submitted_by_email",
  ];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  update.advance_form_submitted_at = new Date().toISOString();
  update.advance_status = "submitted";
  if (body.adv_submitted_by_name) {
    update.advance_form_submitted_by = body.adv_submitted_by_name;
  }

  const { error } = await supabase
    .from("tour_shows")
    .update(update)
    .eq("id", show.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
