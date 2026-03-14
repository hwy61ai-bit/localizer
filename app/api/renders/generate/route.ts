import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";

type RenderFormat = "square" | "story" | "landscape";

const FORMAT_DIMS: Record<RenderFormat, { w: number; h: number }> = {
  square:    { w: 1080, h: 1080 },
  story:     { w: 1080, h: 1350 },
  landscape: { w: 1920, h: 1080 },
};

const FORMATS: RenderFormat[] = ["square", "story", "landscape"];
const PREVIEW_SCALE = 0.56; // editor container ~600px / image 1080px

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

function sanitize(t: string): string {
  return encodeURIComponent(
    t.replace(/,/g, " ").replace(/[/?&#%()'"]/g, "").replace(/\s+/g, " ").trim()
  );
}

function buildCloudinaryUrl(
  publicId: string,
  cloudName: string,
  format: RenderFormat,
  overlayConfig: any,
  eventData: { bandName: string; dateFormatted: string; venueName: string; cityState: string }
): string {
  const { w, h } = FORMAT_DIMS[format];
  const cfg = overlayConfig?.[format] ?? {};
  const font = (cfg.fontFamily ?? "Oswald").replace(/ /g, "_");
  const color = cfg.textColor ?? "ffffff";
  const maxW = Math.round(w * 0.85);

  const venueSize  = Math.round((cfg.venue?.size  ?? 52) * PREVIEW_SCALE);
  const dateSize   = Math.round((cfg.date?.size   ?? 40) * PREVIEW_SCALE);
  const citySize   = Math.round((cfg.city?.size   ?? 40) * PREVIEW_SCALE);

  const venueX = Math.round(((cfg.venue?.x ?? 0.5) - 0.5) * w);
  const venueY = Math.round(((cfg.venue?.y ?? 0.76) - 0.5) * h);
  const dateX  = Math.round(((cfg.date?.x  ?? 0.5) - 0.5) * w);
  const dateY  = Math.round(((cfg.date?.y  ?? 0.84) - 0.5) * h);
  const cityX  = Math.round(((cfg.city?.x  ?? 0.5) - 0.5) * w);
  const cityY  = Math.round(((cfg.city?.y  ?? 0.91) - 0.5) * h);

  const venueName = sanitize(eventData.venueName);
  const dateStr   = sanitize(eventData.dateFormatted);
  const cityState = sanitize(eventData.cityState);

  const layers = [
    `c_fill,g_center,h_${h},w_${w}`,
    `l_text:${font}_${venueSize}_bold:${venueName},co_rgb:${color}/c_fit,fl_layer_apply,g_center,w_${maxW},x_${venueX},y_${venueY}`,
    `l_text:${font}_${dateSize}:${dateStr},co_rgb:${color}/c_fit,fl_layer_apply,g_center,w_${maxW},x_${dateX},y_${dateY}`,
    `l_text:${font}_${citySize}:${cityState},co_rgb:${color}/c_fit,fl_layer_apply,g_center,w_${maxW},x_${cityX},y_${cityY}`,
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${layers.join("/")}/${publicId}`;
}

export async function POST(req: NextRequest) {
  const { tourId, eventId, orgId } = await req.json();
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  if (!tourId && !eventId) return NextResponse.json({ error: "Missing tourId or eventId" }, { status: 400 });

  const supabase = await supabaseServer();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

  // Fetch tour
  let tourId_resolved = tourId;
  if (!tourId_resolved) {
    const { data: ev } = await supabase.from("events").select("tour_id").eq("id", eventId).single();
    tourId_resolved = ev?.tour_id;
  }

  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("id, org_id, name, band_tour_label, image_square_id, image_story_id, image_landscape_id, overlay_config")
    .eq("id", tourId_resolved)
    .eq("org_id", orgId)
    .single();

  if (tourError || !tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  if (!tour.image_square_id) return NextResponse.json({ error: "No images uploaded. Go to Import Assets first." }, { status: 400 });

  // Fetch events
  let events: any[] = [];
  if (eventId) {
    const { data } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (data) events = [data];
  } else {
    const { data } = await supabase.from("events").select("*").eq("tour_id", tourId_resolved).order("date_iso");
    events = data ?? [];
  }

  if (events.length === 0) return NextResponse.json({ error: "No events found" }, { status: 400 });

  const ids = events.map((e: any) => e.id);
  await supabase.from("events").update({ render_status: "rendering" }).in("id", ids);

  const errors: string[] = [];

  for (const event of events) {
    try {
      const formatPublicIds: Record<RenderFormat, string | null> = {
        square:    tour.image_square_id ?? null,
        story:     tour.image_story_id ?? tour.image_square_id ?? null,
        landscape: tour.image_landscape_id ?? tour.image_square_id ?? null,
      };

      const eventData = {
        bandName:      tour.band_tour_label ?? tour.name ?? "Artist",
        dateFormatted: formatDateForRender(event.date_iso),
        venueName:     event.venue_name ?? event.venue ?? "",
        cityState:     [event.venue_city ?? event.city, event.venue_state ?? event.state].filter(Boolean).join(", "),
      };

      const renderUrls: Record<string, string> = {};
      console.log("EVENT DATA:", JSON.stringify(eventData));
      console.log("FORMAT IDS:", JSON.stringify(formatPublicIds));
      for (const format of FORMATS) {
        const pid = formatPublicIds[format];
        if (!pid) continue;
        renderUrls[`render_${format}_url`] = buildCloudinaryUrl(pid, cloudName, format, tour.overlay_config, eventData);
      }

      // Upsert venue_link
      const { data: existing } = await supabase
        .from("venue_links")
        .select("id, token")
        .eq("event_id", event.id)
        .eq("is_active", true)
        .maybeSingle();

      if (existing?.id) {
        const { error: updateErr } = await supabase.from("venue_links").update({ ...renderUrls }).eq("id", existing.id);
        console.log("UPDATE RESULT:", existing.id, updateErr ? JSON.stringify(updateErr) : "OK");
      } else {
        const token = generatePublicToken();
        await supabase.from("venue_links").insert({
          org_id: orgId,
          event_id: event.id,
          token,
          is_active: true,
          ...renderUrls,
        });
      }

      console.log("RENDER URLS:", JSON.stringify(renderUrls));
      await supabase.from("events").update({ render_status: "ready" }).eq("id", event.id);

    } catch (err: any) {
      errors.push(`${event.venue} (${event.date_iso}): ${err?.message ?? String(err)}`);
      await supabase.from("events").update({ render_status: "error" }).eq("id", event.id);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 207 });
  }

  return NextResponse.json({ ok: true, count: events.length });
}
