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
    .select("id, date_iso, event, city, country, venue, doors, showtime, onstage, curfew, tour_id, advance_form_submitted_at")
    .eq("advance_form_token", token)
    .single();

  if (!show) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch tour + artist name (NO financial fields)
  const { data: tour } = await supabase
    .from("tours_routing")
    .select("name, artist_id, artists(name)")
    .eq("id", show.tour_id)
    .single();

  const tourData = tour as Record<string, unknown> | null;
  const artistData = (tourData?.artists as Record<string, unknown>) || null;

  let formattedDate = show.date_iso || "";
  if (show.date_iso) {
    try {
      const d = new Date(show.date_iso + "T12:00:00");
      formattedDate = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    } catch { /* use raw */ }
  }

  return NextResponse.json({
    showId: show.id,
    date: formattedDate,
    dateRaw: show.date_iso,
    eventName: show.event,
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

  // Map form field names → actual tour_shows column names
  const FIELD_MAP: Record<string, string> = {
    doors: "doors",
    showtime: "showtime",
    onstage: "onstage",
    curfew: "curfew",
    adv_load_in: "load_in_time",
    adv_soundcheck: "soundcheck_time",
    adv_wifi_name: "venue_wifi_name",
    adv_wifi_password: "venue_wifi_password",
    adv_production_contact_name: "production_contact",
    adv_production_contact_email: "production_contact_email",
    adv_production_contact_phone: "production_contact_phone",
    adv_settlement_contact_name: "settlement_contact",
    adv_settlement_contact_phone: "settlement_contact_phone",
    adv_settlement_contact_email: "settlement_contact_email",
  };

  const update: Record<string, unknown> = {};

  // Direct 1:1 field mappings
  for (const [formKey, dbCol] of Object.entries(FIELD_MAP)) {
    if (body[formKey] !== undefined && body[formKey] !== "") {
      update[dbCol] = body[formKey];
    }
  }

  // Concatenated fields: venue_notes (parking + venue notes)
  const venueNotesParts: string[] = [];
  if (body.adv_parking?.trim()) venueNotesParts.push(`PARKING: ${body.adv_parking.trim()}`);
  if (body.adv_venue_notes?.trim()) venueNotesParts.push(`NOTES: ${body.adv_venue_notes.trim()}`);
  if (venueNotesParts.length > 0) update.venue_notes = venueNotesParts.join("\n");

  // Concatenated fields: advance_notes (backline + hospitality + catering + dressing room)
  const advNotesParts: string[] = [];
  if (body.adv_backline_notes?.trim()) advNotesParts.push(`BACKLINE: ${body.adv_backline_notes.trim()}`);
  if (body.adv_hospitality_notes?.trim()) advNotesParts.push(`HOSPITALITY: ${body.adv_hospitality_notes.trim()}`);
  if (body.adv_catering?.trim()) advNotesParts.push(`CATERING: ${body.adv_catering.trim()}`);
  if (body.adv_dressing_room?.trim()) advNotesParts.push(`DRESSING ROOM: ${body.adv_dressing_room.trim()}`);
  if (advNotesParts.length > 0) update.advance_notes = advNotesParts.join("\n");

  // Status + submission metadata
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
