import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  // Fetch routing tour
  const { data: routingTour } = await supabase
    .from("tours_routing")
    .select("*, artists(name)")
    .eq("id", tourId)
    .eq("org_id", orgId)
    .single();

  if (!routingTour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  // Fetch shows (non-off-day only)
  const { data: shows } = await supabase
    .from("tour_shows")
    .select("*")
    .eq("tour_id", tourId)
    .eq("is_off", false)
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

    // Deliberate: this path bypasses TOUR_LIMITS (lib/localizer/tourLimits.ts).
    // TourRouter is out of Localizer launch scope; if push-to-localizer ever
    // ships to real customers, route this insert through the same enforcement
    // pattern as createTourForArtist (app/dashboard/artists/[artistId]/actions.ts).
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
    const dateIso = (s.date_iso as string) || null;
    let day: string | null = null;
    if (dateIso) {
      try {
        const d = new Date(dateIso + "T12:00:00");
        day = d.toLocaleDateString("en-US", { weekday: "short" });
      } catch { /* skip */ }
    }

    const cityRaw = (s.city as string) || "";
    const cityParts = cityRaw.split(",").map(p => p.trim()).filter(Boolean);
    const cityOnly = cityParts[0] || "";
    const stateOnly = cityParts[1] || null;

    return {
      org_id: orgId,
      tour_id: localizerTourId,
      source: "tourrouter",
      event_index: i,
      date_iso: dateIso,
      day,
      city: cityOnly,
      state: stateOnly,
      venue: (s.venue as string) || (s.event as string) || "",
      venue_name: (s.venue as string) || null,
      venue_city: cityOnly,
      venue_state: stateOnly,
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
    .from("tours_routing")
    .update({ localizer_tour_id: localizerTourId })
    .eq("id", tourId);

  return NextResponse.json({
    localizerTourId,
    eventCount: showsArr.length,
    status,
  });
}
