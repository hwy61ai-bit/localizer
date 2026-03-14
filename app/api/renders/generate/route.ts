import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { renderEventFormat, DEFAULT_FORMAT_CONFIG } from "@/lib/render/renderEvent";
import type { RenderFormat, FormatConfig } from "@/lib/render/renderEvent";
import { generatePublicToken } from "@/lib/tokens";

const FORMATS: RenderFormat[] = ["square", "story", "landscape"];

function formatDateForRender(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00");
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day} ${year}`;
  } catch {
    return iso;
  }
}

async function renderOneEvent(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  event: any,
  tour: any,
  orgId: string
) {
  const eventId = event.id;
  const allConfigs = tour.overlay_config ?? {};

  const formatPublicIds: Record<RenderFormat, string | null> = {
    square:    tour.image_square_id ?? null,
    story:     tour.image_story_id ?? tour.image_square_id ?? null,
    landscape: tour.image_landscape_id ?? tour.image_square_id ?? null,
  };

  const eventData = {
    bandName: tour.band_tour_label ?? tour.name ?? "Artist",
    dateFormatted: formatDateForRender(event.date_iso),
    venueName: event.venue_name ?? event.venue ?? "",
    cityState: [event.venue_city ?? event.city, event.venue_state ?? event.state]
      .filter(Boolean).join(", "),
  };

  const renderUrls: Record<string, string> = {};

  for (const format of FORMATS) {
    const pid = formatPublicIds[format];
    if (!pid) continue;
    const cfg: FormatConfig = { ...DEFAULT_FORMAT_CONFIG, ...(allConfigs[format] ?? {}) };
    const outputId = `renders/${event.tour_id}/${eventId}_${format}`;
    try {
      const url = await renderEventFormat(pid, format, eventData, cfg, outputId);
      renderUrls[`render_${format}_url`] = url;
    } catch (err) {
      console.error(`Render failed for ${eventId} ${format}:`, err);
      throw err;
    }
  }

  // Upsert venue_link
  const { data: existing } = await supabase
    .from("venue_links")
    .select("id, token")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("venue_links").update({ ...renderUrls }).eq("id", existing.id);
  } else {
    const token = generatePublicToken();
    await supabase.from("venue_links").insert({
      org_id: orgId,
      event_id: eventId,
      token,
      is_active: true,
      ...renderUrls,
    });
  }

  await supabase.from("events").update({ render_status: "ready" }).eq("id", eventId);
}

export async function POST(req: NextRequest) {
  const { tourId, eventId, orgId } = await req.json();
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  if (!tourId && !eventId) return NextResponse.json({ error: "Missing tourId or eventId" }, { status: 400 });

  const supabase = await supabaseServer();

  // Fetch tour
  const tourQuery = tourId
    ? supabase.from("tours").select("id, org_id, name, band_tour_label, image_square_id, image_story_id, image_landscape_id, overlay_config").eq("id", tourId).eq("org_id", orgId).single()
    : supabase.from("tours").select("id, org_id, name, band_tour_label, image_square_id, image_story_id, image_landscape_id, overlay_config").eq("org_id", orgId).eq("id",
        (await supabase.from("events").select("tour_id").eq("id", eventId).single()).data?.tour_id ?? ""
      ).single();

  const { data: tour, error: tourError } = await tourQuery;
  if (tourError || !tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  if (!tour.image_square_id) {
    return NextResponse.json({ error: "No images uploaded. Go to Import Assets first." }, { status: 400 });
  }

  // Fetch events to render
  let events: any[] = [];
  if (eventId) {
    const { data } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (data) events = [data];
  } else {
    const { data } = await supabase.from("events").select("*").eq("tour_id", tourId).order("date_iso");
    events = data ?? [];
  }

  if (events.length === 0) return NextResponse.json({ error: "No events found" }, { status: 400 });

  // Mark all as rendering
  const ids = events.map(e => e.id);
  await supabase.from("events").update({ render_status: "rendering" }).in("id", ids);

  // Render sequentially to avoid memory spikes
  const errors: string[] = [];
  for (const event of events) {
    try {
      await renderOneEvent(supabase, event, tour, orgId);
    } catch (err: any) {
      console.error("RENDER ERROR", event.venue, JSON.stringify(err), err?.stack);
      errors.push(`${event.venue} (${event.date_iso}): ${err?.stack ?? err?.message ?? String(err)}`);
      await supabase.from("events").update({ render_status: "error" }).eq("id", event.id);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 207 });
  }

  return NextResponse.json({ ok: true, count: events.length });
}
