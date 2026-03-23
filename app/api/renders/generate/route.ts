import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";

// Set to false to disable auto line-wrapping for long venue/city names
const ENABLE_TEXT_WRAP = false;

type RenderFormat = "square" | "story" | "landscape";

const FORMAT_DIMS: Record<RenderFormat, { w: number; h: number }> = {
  square:    { w: 1080, h: 1080 },
  story:     { w: 1080, h: 1350 },
  landscape: { w: 820, h: 312 },
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


  function shortMonth(d: Date): string {
    const months = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];
    return months[d.getMonth()];
  }

function formatDateForRender(iso: string, short = false): string {
  try {
    const d = new Date(iso + "T12:00:00");
    if (short) {
      const day = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      const month = shortMonth(d).toUpperCase();
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
  // Remove dangerous chars, normalize spaces, but DON'T use encodeURIComponent
  // Cloudinary needs manual encoding: spaces -> %20, commas -> %252C
  const clean = t.replace(/[/?&#%()'"]/g, "").replace(/\s+/g, " ").trim();
  return clean.replace(/ /g, "%20").replace(/,/g, "%252C");
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

function fitFontSize(text: string, maxSize: number, availableW: number): number {
  for (let size = maxSize; size >= 12; size -= 2) {
    // Use 0.45 for safe fit without overflow
    const estimatedW = size * 0.45 * text.length;
    if (estimatedW <= availableW) return size;
  }
  return 12;
}

function buildTextLayer(font: string, size: number, text: string, color: string, xFrac: number, yFrac: number, canvasW: number, canvasH: number, align: string): string {
  const yPx = Math.round((yFrac - 0.5) * canvasH);
  let gravity = "center";
  let xPx = Math.round((xFrac - 0.5) * canvasW);
  if (align === "left") {
    gravity = "west";
    xPx = Math.round(xFrac * canvasW);
  } else if (align === "right") {
    gravity = "east";
    xPx = Math.round((1 - xFrac) * canvasW);
  }
  
  // Custom fonts (with colons) don't support weight modifiers like _bold
  const isCustomFont = font.includes(":");
  const cleanFont = font.replace(/ /g, "_");
  
  if (isCustomFont) {
    // Custom fonts: no _bold modifier (the font file IS the weight)
    return `l_text:${cleanFont}_${size}:${text},co_rgb:${color}/fl_layer_apply,g_${gravity},x_${xPx},y_${yPx}`;
  } else {
    // Standard fonts: include _bold
    return `l_text:${cleanFont}_${size}_bold:${text},co_rgb:${color}/fl_layer_apply,g_${gravity},x_${xPx},y_${yPx}`;
  }
}

function availableWidth(xFrac: number, canvasW: number, align: string): number {
  const margin = 0.85;
  if (align === "left")  return (1 - xFrac) * canvasW * margin;
  if (align === "right") return xFrac * canvasW * margin;
  // Center: constrained by whichever edge is closer
  return Math.min(xFrac, 1 - xFrac) * 2 * canvasW * margin;
}

function buildCloudinaryUrl(
  publicId: string,
  cloudName: string,
  format: RenderFormat,
  overlayConfig: any,
  eventData: { bandName: string; dateFormatted: string; venueName: string; cityState: string },
  customFontsMap: Map<string, string>
): string {
  const { w, h } = FORMAT_DIMS[format];
  const cfg = overlayConfig?.[format] ?? {};
  const fontFamily = cfg.fontFamily ?? "Oswald";
  // Check if it's a custom font, otherwise use standard font with underscores
  const font = customFontsMap.has(fontFamily) 
    ? customFontsMap.get(fontFamily)! 
    : fontFamily.replace(/ /g, "_");
  const color = cfg.textColor ?? "ffffff";
  const maxW = Math.round(w * 0.85);

  // Scale font sizes for landscape (820x312 vs 1920x1080 reference)
  const scaleFactor = format === "landscape" ? 0.427 : 1.0;
  const venueSizeMax = Math.round((cfg.venue?.size ?? 36) * scaleFactor);
  const dateSize     = Math.round((cfg.date?.size   ?? 28) * scaleFactor);
  const citySizeMax  = Math.round((cfg.city?.size   ?? 28) * scaleFactor);
  const bandSizeScaled = Math.round((cfg.bandSize ?? 48) * scaleFactor);

  const caps = cfg.allCaps ?? false;
  const rawVenue = caps ? eventData.venueName.toUpperCase() : eventData.venueName;
  const rawCity  = caps ? eventData.cityState.toUpperCase() : eventData.cityState;
  const venueXF = cfg.venue?.x ?? 0.5;
  const venueYF = cfg.venue?.y ?? 0.76;
  const dateXF  = cfg.date?.x  ?? 0.5;
  const dateYF  = cfg.date?.y  ?? 0.84;
  const cityXF  = cfg.city?.x  ?? 0.5;
  const cityYF  = cfg.city?.y  ?? 0.91;
  const bandXF  = cfg.band?.x  ?? 0.5;
  const bandYF  = cfg.band?.y  ?? 0.65;

  const venueAlign = cfg.venue?.align ?? "center";
  const dateAlign  = cfg.date?.align  ?? "center";
  const cityAlign  = cfg.city?.align  ?? "center";
  const bandAlign  = cfg.band?.align ?? "center";

  const venueSize = fitFontSize(rawVenue, venueSizeMax, availableWidth(venueXF, w, venueAlign));
  const citySize  = fitFontSize(rawCity,  citySizeMax,  availableWidth(cityXF,  w, cityAlign));

  const venueName = sanitize(rawVenue);
  const dateStr   = sanitize(eventData.dateFormatted);
  const cityState = sanitize(rawCity);

  const showBand = cfg.showBandName ?? false;
  const bandSize = format === "landscape" ? bandSizeScaled : (cfg.bandSize ?? 48);
  const rawBandName = caps ? eventData.bandName.toUpperCase() : eventData.bandName;
  const bandName = sanitize(rawBandName);

  const layers = [
    `c_fill,g_center,h_${h},w_${w}`,
    ...(showBand ? [buildTextLayer(font, bandSize, bandName, color, bandXF, bandYF, w, h, bandAlign)] : []),
    buildTextLayer(font, venueSize, venueName, color, venueXF, venueYF, w, h, venueAlign),
    buildTextLayer(font, dateSize,  dateStr,   color, dateXF,  dateYF,  w, h, dateAlign),
    buildTextLayer(font, citySize,  cityState, color, cityXF,  cityYF,  w, h, cityAlign),
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${layers.join("/")}/${publicId}`;
}

function buildCloudinaryVideoUrl(
  publicId: string,
  cloudName: string,
  format: VideoFormat,
  overlayConfig: any,
  eventData: { bandName: string; dateFormatted: string; venueName: string; cityState: string },
  customFontsMap: Map<string, string>
): string {
  const { w, h } = VIDEO_DIMS[format];
  const cfg = overlayConfig?.[format] ?? {};
  const fontFamily = cfg.fontFamily ?? "Oswald";
  const font = customFontsMap.has(fontFamily) 
    ? customFontsMap.get(fontFamily)! 
    : fontFamily.replace(/ /g, "_");
  const color = cfg.textColor ?? "ffffff";

  const venueSizeMax = cfg.venue?.size ?? 36;
  const dateSize     = cfg.date?.size  ?? 28;
  const citySizeMax  = cfg.city?.size  ?? 28;

  const caps = cfg.allCaps ?? false;
  const rawVenue = caps ? eventData.venueName.toUpperCase() : eventData.venueName;
  const rawCity  = caps ? eventData.cityState.toUpperCase() : eventData.cityState;
  const venueXF = cfg.venue?.x ?? 0.5;
  const venueYF = cfg.venue?.y ?? 0.76;
  const dateXF  = cfg.date?.x  ?? 0.5;
  const dateYF  = cfg.date?.y  ?? 0.84;
  const cityXF  = cfg.city?.x  ?? 0.5;
  const cityYF  = cfg.city?.y  ?? 0.91;
  const bandXF  = cfg.band?.x  ?? 0.5;
  const bandYF  = cfg.band?.y  ?? 0.65;

  const venueAlign = cfg.venue?.align ?? "center";
  const dateAlign  = cfg.date?.align  ?? "center";
  const cityAlign  = cfg.city?.align  ?? "center";
  const bandAlign  = cfg.band?.align ?? "center";

  const venueSize = fitFontSize(rawVenue, venueSizeMax, availableWidth(venueXF, w, venueAlign));
  const citySize  = fitFontSize(rawCity,  citySizeMax,  availableWidth(cityXF,  w, cityAlign));

  const venueName = sanitize(rawVenue);
  const dateStr   = sanitize(eventData.dateFormatted);
  const cityState = sanitize(rawCity);

  const showBand = cfg.showBandName ?? false;
  const bandSize = cfg.bandSize ?? 48;
  const rawBandName = caps ? eventData.bandName.toUpperCase() : eventData.bandName;
  const bandName = sanitize(rawBandName);

  const layers = [
    `c_fill,g_center,h_${h},w_${w}`,
    ...(showBand ? [buildTextLayer(font, bandSize, bandName, color, bandXF, bandYF, w, h, bandAlign)] : []),
    buildTextLayer(font, venueSize, venueName, color, venueXF, venueYF, w, h, venueAlign),
    buildTextLayer(font, dateSize,  dateStr,   color, dateXF,  dateYF,  w, h, dateAlign),
    buildTextLayer(font, citySize,  cityState, color, cityXF,  cityYF,  w, h, cityAlign),
  ];

  return `https://res.cloudinary.com/${cloudName}/video/upload/${layers.join("/")}/${publicId}`;
}

export async function POST(req: NextRequest) {
  const { tourId, eventId, orgId } = await req.json();
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
  if (!tourId && !eventId) return NextResponse.json({ error: "Missing tourId or eventId" }, { status: 400 });

  const supabase = await supabaseServer();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

  // Load custom fonts for this org
  const { data: customFontsData } = await supabase
    .from("custom_fonts")
    .select("font_name, cloudinary_public_id, file_extension")
    .eq("org_id", orgId);
  
  const customFontsMap = new Map(
    (customFontsData || []).map(f => {
      // Cloudinary requires slashes to be replaced with colons in font paths
      const cloudinaryPath = `${f.cloudinary_public_id}.${f.file_extension}`.replace(/\//g, ":");
      return [f.font_name, cloudinaryPath];
    })
  );

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
        renderUrls[`render_${format}_url`] = buildCloudinaryUrl(pid, cloudName, format, tour.overlay_config, eventData, customFontsMap);
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
        renderUrls[`render_${vformat}_url`] = buildCloudinaryVideoUrl(pid, cloudName, vformat, tour.overlay_config, eventData, customFontsMap);
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
