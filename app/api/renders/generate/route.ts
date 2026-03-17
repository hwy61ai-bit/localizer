import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";

// Set to false to disable auto line-wrapping for long venue/city names
const ENABLE_TEXT_WRAP = true;

type RenderFormat = "square" | "story" | "landscape";

const FORMAT_DIMS: Record<RenderFormat, { w: number; h: number }> = {
  square:    { w: 1080, h: 1080 },
  story:     { w: 1080, h: 1350 },
  landscape: { w: 1920, h: 1080 },
};

const FORMATS: RenderFormat[] = ["square", "story", "landscape"];

type VideoFormat = "tiktok" | "yt_shorts";
const VIDEO_DIMS: Record<VideoFormat, { w: number; h: number }> = {
  tiktok:    { w: 1080, h: 1920 },
  yt_shorts: { w: 1080, h: 1920 },
};
const VIDEO_FORMATS: VideoFormat[] = ["tiktok", "yt_shorts"];

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return "TH";
  switch (n % 10) {
    case 1: return "ST";
    case 2: return "ND";
    case 3: return "RD";
    default: return "TH";
  }
}

function formatDateForRender(iso: string, short = false): string {
  try {
    const d = new Date(iso + "T12:00:00");
    if (short) {
      const day = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
      const date = d.getDate();
      return `${day}. ${month} ${date}${ordinal(date)}`;
    }
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day} ${year}`;
  } catch {
    return iso;
  }
}

function sanitize(t: string): string {
  const clean = t.replace(/[/?&#%()'"]/g, "").replace(/\s+/g, " ").trim();
  return clean.split(",").map(part => encodeURIComponent(part.trim())).join("%252C%20");
}

function wrapText(text: string, fontSize: number, canvasW: number): string {
  if (!ENABLE_TEXT_WRAP) return text;
  const maxW = canvasW * 0.85;
  const charsPerLine = Math.floor(maxW / (fontSize * 0.6));
  if (text.length <= charsPerLine) return text;
  // Split at word boundaries
  const words = text.split("%20");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (test.length > charsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.join("%0A");
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
  const font = "Arial";
  const color = cfg.textColor ?? "ffffff";
  const maxW = Math.round(w * 0.85);

  const venueSize  = cfg.venue?.size  ?? 36;
  const dateSize   = cfg.date?.size   ?? 28;
  const citySize   = cfg.city?.size   ?? 28;

  const venueX = Math.round(((cfg.venue?.x ?? 0.5) - 0.5) * w);
  const venueY = Math.round(((cfg.venue?.y ?? 0.76) - 0.5) * h);
  const dateX  = Math.round(((cfg.date?.x  ?? 0.5) - 0.5) * w);
  const dateY  = Math.round(((cfg.date?.y  ?? 0.84) - 0.5) * h);
  const cityX  = Math.round(((cfg.city?.x  ?? 0.5) - 0.5) * w);
  const cityY  = Math.round(((cfg.city?.y  ?? 0.91) - 0.5) * h);

  const caps = cfg.allCaps ?? false;
  const venueName = wrapText(sanitize(caps ? eventData.venueName.toUpperCase() : eventData.venueName), venueSize, w);
  const dateStr   = sanitize(eventData.dateFormatted);
  const cityState = wrapText(sanitize(caps ? eventData.cityState.toUpperCase() : eventData.cityState), citySize, w);

  const showBand = cfg.showBandName ?? false;
  const bandSize = cfg.bandSize ?? 48;
  const bandName = sanitize(eventData.bandName);
  const bandX = Math.round(((cfg.band?.x ?? 0.5) - 0.5) * w);
  const bandY = Math.round(((cfg.band?.y ?? 0.65) - 0.5) * h);

  const layers = [
    `c_fill,g_center,h_${h},w_${w}`,
    ...(showBand ? [`l_text:${font}_${bandSize}_bold:${bandName},co_rgb:${color}/fl_layer_apply,g_center,x_${bandX},y_${bandY}`] : []),
    `l_text:${font}_${venueSize}_bold_center:${venueName},co_rgb:${color}/fl_layer_apply,g_center,x_${venueX},y_${venueY}`,
    `l_text:${font}_${dateSize}_bold_center:${dateStr},co_rgb:${color}/fl_layer_apply,g_center,x_${dateX},y_${dateY}`,
    `l_text:${font}_${citySize}_bold_center:${cityState},co_rgb:${color}/fl_layer_apply,g_center,x_${cityX},y_${cityY}`,
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${layers.join("/")}/${publicId}`;
}

function buildCloudinaryVideoUrl(
  publicId: string,
  cloudName: string,
  format: VideoFormat,
  overlayConfig: any,
  eventData: { bandName: string; dateFormatted: string; venueName: string; cityState: string }
): string {
  const { w, h } = VIDEO_DIMS[format];
  const storyH = 1350; // positions were set in story editor
  const yScale = h / storyH;
  const cfg = overlayConfig?.[format] ?? overlayConfig?.story ?? {};
  const font = "Arial";
  const color = cfg.textColor ?? "ffffff";

  const venueSize = cfg.venue?.size ?? 36;
  const dateSize  = cfg.date?.size  ?? 28;
  const citySize  = cfg.city?.size  ?? 28;

  const venueX = Math.round(((cfg.venue?.x ?? 0.5) - 0.5) * w);
  const venueY = Math.round(((cfg.venue?.y ?? 0.76) - 0.5) * storyH * yScale);
  const dateX  = Math.round(((cfg.date?.x  ?? 0.5) - 0.5) * w);
  const dateY  = Math.round(((cfg.date?.y  ?? 0.84) - 0.5) * storyH * yScale);
  const cityX  = Math.round(((cfg.city?.x  ?? 0.5) - 0.5) * w);
  const cityY  = Math.round(((cfg.city?.y  ?? 0.91) - 0.5) * storyH * yScale);

  const caps = cfg.allCaps ?? false;
  const venueName = sanitize(caps ? eventData.venueName.toUpperCase() : eventData.venueName);
  const dateStr   = sanitize(eventData.dateFormatted);
  const cityState = sanitize(caps ? eventData.cityState.toUpperCase() : eventData.cityState);

  const showBand = cfg.showBandName ?? false;
  const bandSize = cfg.bandSize ?? 48;
  const bandName = sanitize(eventData.bandName);
  const bandX = Math.round(((cfg.band?.x ?? 0.5) - 0.5) * w);
  const bandY = Math.round(((cfg.band?.y ?? 0.65) - 0.5) * storyH * yScale);

  const layers = [
    `c_fill,g_center,h_${h},w_${w}`,
    ...(showBand ? [`l_text:${font}_${bandSize}_bold:${bandName},co_rgb:${color}/fl_layer_apply,g_center,x_${bandX},y_${bandY}`] : []),
    `l_text:${font}_${venueSize}_bold_center:${venueName},co_rgb:${color}/fl_layer_apply,g_center,x_${venueX},y_${venueY}`,
    `l_text:${font}_${dateSize}_bold_center:${dateStr},co_rgb:${color}/fl_layer_apply,g_center,x_${dateX},y_${dateY}`,
    `l_text:${font}_${citySize}_bold_center:${cityState},co_rgb:${color}/fl_layer_apply,g_center,x_${cityX},y_${cityY}`,
  ];

  return `https://res.cloudinary.com/${cloudName}/video/upload/${layers.join("/")}/${publicId}`;
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
    .select("id, org_id, name, band_name, band_tour_label, image_square_id, image_story_id, image_landscape_id, video_tiktok_id, video_yt_shorts_id, overlay_config")
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

      const baseEventData = {
        bandName:  (tour as any).band_name ?? tour.band_tour_label ?? tour.name ?? "Artist",
        venueName: event.venue_name ?? event.venue ?? "",
        cityState: [event.venue_city ?? event.city, event.venue_state ?? event.state].filter(Boolean).join(", "),
      };

      const renderUrls: Record<string, string> = {};
      for (const format of FORMATS) {
        const pid = formatPublicIds[format];
        if (!pid) continue;
        const shortDate = !!(tour.overlay_config as any)?.[format]?.shortDate;
        const eventData = { ...baseEventData, dateFormatted: formatDateForRender(event.date_iso, shortDate) };
        renderUrls[`render_${format}_url`] = buildCloudinaryUrl(pid, cloudName, format, tour.overlay_config, eventData);
      }

      // Generate video render URLs
      const videoPublicIds: Record<VideoFormat, string | null> = {
        tiktok:    (tour as any).video_tiktok_id ?? null,
        yt_shorts: (tour as any).video_yt_shorts_id ?? null,
      };

      for (const vformat of VIDEO_FORMATS) {
        const pid = videoPublicIds[vformat];
        if (!pid) continue;
        const shortDateVideo = !!((tour.overlay_config as any)?.[vformat]?.shortDate || (tour.overlay_config as any)?.story?.shortDate);
        const eventData = { ...baseEventData, dateFormatted: formatDateForRender(event.date_iso, shortDateVideo) };
        renderUrls[`render_${vformat}_url`] = buildCloudinaryVideoUrl(pid, cloudName, vformat, tour.overlay_config, eventData);
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

      await supabase.from("events").update({ render_status: "ready" }).eq("id", event.id);

    } catch (err: any) {
      errors.push(`${event.venue} (${event.date_iso}): ${err?.message ?? String(err)}`);
      await supabase.from("events").update({ render_status: "error" }).eq("id", event.id);
    }
  }

  // Warm CDN cache in background — fetch thumbnail versions so Preview All is fast
  (async () => {
    try {
      for (const event of events) {
        const { data: link } = await supabase.from("venue_links")
          .select("render_square_url, render_story_url, render_landscape_url")
          .eq("event_id", event.id).maybeSingle();
        if (link) {
          for (const url of [link.render_square_url, link.render_story_url, link.render_landscape_url]) {
            if (url) fetch(url.replace("/image/upload/", "/image/upload/w_600/")).catch(() => {});
          }
        }
      }
    } catch {}
  })();

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 207 });
  }

  return NextResponse.json({ ok: true, count: events.length });
}
