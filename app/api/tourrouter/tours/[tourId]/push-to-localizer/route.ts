import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  if (!profile?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  const orgId = profile.org_id;

  // Fetch routing tour
  const { data: routingTour } = await supabase
    .from("routing_tours")
    .select("*, artists(name)")
    .eq("id", tourId)
    .eq("org_id", orgId)
    .single();

  if (!routingTour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  // Fetch shows (non-off-day only)
  const { data: shows } = await supabase
    .from("tour_shows")
    .select("*")
    .eq("routing_tour_id", tourId)
    .eq("is_off_day", false)
    .order("sort_order");

  const showsArr = shows || [];
  if (showsArr.length === 0) {
    return NextResponse.json({ error: "No shows to push" }, { status: 400 });
  }

  const artistData = routingTour.artists as Record<string, unknown> | null;
  const artistName = (artistData?.name as string) || routingTour.name || "Tour";

  let localizerTourId = routingTour.localizer_tour_id as string | null;
  let status: "created" | "updated" = "created";

  if (localizerTourId) {
    // Update existing Localizer tour — delete old events, insert new
    status = "updated";

    // Verify the Localizer tour still exists
    const { data: existingTour } = await supabase
      .from("tours")
      .select("id")
      .eq("id", localizerTourId)
      .eq("org_id", orgId)
      .single();

    if (!existingTour) {
      // Tour was deleted — create fresh
      localizerTourId = null;
    } else {
      // Delete existing events
      await supabase
        .from("events")
        .delete()
        .eq("tour_id", localizerTourId);

      // Update tour name
      await supabase
        .from("tours")
        .update({
          name: routingTour.name,
          band_name: artistName,
          artist_id: routingTour.artist_id || null,
        })
        .eq("id", localizerTourId);
    }
  }

  if (!localizerTourId) {
    // Create new Localizer tour
    status = "created";
    localizerTourId = randomUUID();

    const { error: tourError } = await supabase
      .from("tours")
      .insert({
        id: localizerTourId,
        org_id: orgId,
        name: routingTour.name,
        band_name: artistName,
        artist_id: routingTour.artist_id || null,
      });

    if (tourError) {
      return NextResponse.json({ error: "Failed to create Localizer tour: " + tourError.message }, { status: 500 });
    }
  }

  // Map routing shows → Localizer events
  // CRITICAL: Only dates, venues, cities — NEVER financial data
  const events = showsArr.map((s: Record<string, unknown>, i: number) => {
    const dateIso = (s.date as string) || null;
    let day: string | null = null;
    if (dateIso) {
      try {
        const d = new Date(dateIso + "T12:00:00");
        day = d.toLocaleDateString("en-US", { weekday: "short" });
      } catch { /* skip */ }
    }

    return {
      org_id: orgId,
      tour_id: localizerTourId,
      source: "tourrouter",
      event_index: i,
      date_iso: dateIso,
      day,
      city: (s.city as string) || "",
      state: (s.country as string) || null,
      venue: (s.venue as string) || (s.event_name as string) || "",
      venue_name: (s.venue as string) || null,
      venue_city: (s.city as string) || null,
      venue_state: (s.country as string) || null,
      promoter_email: null,
      manager_email: null,
    };
  });

  const { error: eventsError } = await supabase
    .from("events")
    .insert(events);

  if (eventsError) {
    return NextResponse.json({ error: "Failed to create events: " + eventsError.message }, { status: 500 });
  }

  // Save the Localizer tour ID back to routing tour
  await supabase
    .from("routing_tours")
    .update({ localizer_tour_id: localizerTourId })
    .eq("id", tourId);

  return NextResponse.json({
    localizerTourId,
    eventCount: showsArr.length,
    status,
  });
}
