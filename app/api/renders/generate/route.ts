import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";
import {
  FORMATS as FORMAT_CATALOG,
  IMAGE_FORMATS,
  VIDEO_FORMATS as CATALOG_VIDEO_FORMATS,
  type FormatKey,
} from "@/lib/localizer/formats";
import { effectiveTierForFeatures, isFormatAllowedForTier } from "@/lib/localizer/tierGate";
import { checkRateLimit } from "@/lib/rateLimit";

type RenderFormat = Extract<FormatKey, "square" | "story" | "landscape">;

const FORMAT_DIMS: Record<RenderFormat, { w: number; h: number }> = {
  square:    { w: FORMAT_CATALOG.square.w,    h: FORMAT_CATALOG.square.h },
  story:     { w: FORMAT_CATALOG.story.w,     h: FORMAT_CATALOG.story.h },
  landscape: { w: FORMAT_CATALOG.landscape.w, h: FORMAT_CATALOG.landscape.h },
};

const FORMATS: RenderFormat[] = IMAGE_FORMATS as RenderFormat[];

type VideoFormat = Extract<FormatKey, "tiktok" | "yt_shorts">;
const VIDEO_DIMS: Record<VideoFormat, { w: number; h: number }> = {
  tiktok:    { w: FORMAT_CATALOG.tiktok.w,    h: FORMAT_CATALOG.tiktok.h },
  yt_shorts: { w: FORMAT_CATALOG.yt_shorts.w, h: FORMAT_CATALOG.yt_shorts.h },
};
const VIDEO_FORMATS: VideoFormat[] = CATALOG_VIDEO_FORMATS as VideoFormat[];

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
      const month = shortMonth(d).toUpperCase();
      const date = d.getDate();
      return `${month} ${date}${ordinal(date)}`;
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
  const cleanFont = font.replace(/ /g, "%20");
  
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

type CropRegion = { x: number; y: number; w: number; h: number };

function isValidCropRegion(r: any): r is CropRegion {
  if (!r || typeof r !== "object") return false;
  const { x, y, w, h } = r;
  if (![x, y, w, h].every((n) => typeof n === "number" && Number.isFinite(n))) return false;
  if (w <= 0 || h <= 0 || x < 0 || y < 0) return false;
  if (x + w > 1.0001 || y + h > 1.0001) return false;
  return true;
}

function formatFraction(n: number): string {
  return n.toFixed(4);
}

function buildCloudinaryUrl(
  publicId: string,
  cloudName: string,
  format: RenderFormat,
  overlayConfig: any,
  eventData: { bandName: string; dateFormatted: string; venueName: string; cityState: string },
  customFontsMap: Map<string, string>,
  bandFontFamily: string | null,
  cropRegion?: CropRegion | null
): string {
  const { w, h } = FORMAT_DIMS[format];
  const cfg = overlayConfig?.[format] ?? {};
  const fontFamily = cfg.fontFamily ?? "Oswald";
  // Check if it's a custom font, otherwise use standard font with underscores
  const font = customFontsMap.has(fontFamily) 
    ? customFontsMap.get(fontFamily)! 
    : fontFamily.replace(/ /g, "%20");
  const color = cfg.textColor ?? "ffffff";

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
  const resolvedBandFontFamily = bandFontFamily ?? fontFamily;
  const bandFont = customFontsMap.has(resolvedBandFontFamily)
    ? customFontsMap.get(resolvedBandFontFamily)!
    : resolvedBandFontFamily.replace(/ /g, "%20");
  const bandColor = cfg.bandTextColor ?? color;
  const venueColor = cfg.venueColor ?? color;
  const cityColor = cfg.cityColor ?? color;
  const dateColor = cfg.dateColor ?? color;
  const bandSize = format === "landscape" ? bandSizeScaled : (cfg.bandSize ?? 48);
  const rawBandName = caps ? eventData.bandName.toUpperCase() : eventData.bandName;
  const bandName = sanitize(rawBandName);

  const baseLayer = isValidCropRegion(cropRegion)
    ? `c_crop,x_${formatFraction(cropRegion.x)},y_${formatFraction(cropRegion.y)},w_${formatFraction(cropRegion.w)},h_${formatFraction(cropRegion.h)}/c_fill,h_${h},w_${w}`
    : `c_fill,g_center,h_${h},w_${w}`;

  const layers = [
    baseLayer,
    ...(showBand ? [buildTextLayer(bandFont, bandSize, bandName, bandColor, bandXF, bandYF, w, h, bandAlign)] : []),
    ...((cfg.showVenue ?? true) ? [buildTextLayer(font, venueSize, venueName, venueColor, venueXF, venueYF, w, h, venueAlign)] : []),
    ...((cfg.showDate ?? true)  ? [buildTextLayer(font, dateSize,  dateStr,   dateColor, dateXF,  dateYF,  w, h, dateAlign)]  : []),
    ...((cfg.showCity ?? true)  ? [buildTextLayer(font, citySize,  cityState, cityColor, cityXF,  cityYF,  w, h, cityAlign)]  : []),
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${layers.join("/")}/${publicId}`;
}

function buildLogoLayer(
  logoUrl: string,
  logoCfg: { x: number; y: number; size: number },
  color: string,
  canvasW: number,
  canvasH: number
): string {
  // URL-safe base64 for l_fetch, no padding
  const base64Url = Buffer.from(logoUrl).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Center-relative positioning, same convention as buildTextLayer
  const xPx = Math.round((logoCfg.x - 0.5) * canvasW);
  const yPx = Math.round((logoCfg.y - 0.5) * canvasH);

  // Scale logo by height (width auto-preserved), colorize to text color, layer at center-relative position
  return `l_fetch:${base64Url}/c_scale,h_${logoCfg.size}/e_colorize:100,co_rgb:${color}/fl_layer_apply,g_center,x_${xPx},y_${yPx}`;
}

function buildSponsorLogoLayer(
  logoUrl: string,
  logoCfg: { x: number; y: number; size: number },
  canvasW: number,
  canvasH: number
): string {
  // URL-safe base64 for l_fetch, no padding
  const base64Url = Buffer.from(logoUrl).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Center-relative positioning, same convention as buildTextLayer
  const xPx = Math.round((logoCfg.x - 0.5) * canvasW);
  const yPx = Math.round((logoCfg.y - 0.5) * canvasH);

  // Scale logo by height, native colors (NO colorize), layer at center-relative position
  return `l_fetch:${base64Url}/c_scale,h_${logoCfg.size}/fl_layer_apply,g_center,x_${xPx},y_${yPx}`;
}

function buildCloudinaryVideoUrl(
  publicId: string,
  cloudName: string,
  format: VideoFormat,
  overlayConfig: any,
  eventData: { bandName: string; dateFormatted: string; venueName: string; cityState: string },
  customFontsMap: Map<string, string>,
  logoUrl: string | null,
  sponsorLogo1Url: string | null,
  sponsorLogo2Url: string | null,
  customText1: string | null,
  customText2: string | null,
  bandFontFamily: string | null,
  cropRegion?: CropRegion | null
): string {
  // v1: video formats do not support cropping; cropRegion is ignored for symmetry only
  const { w, h } = VIDEO_DIMS[format];
  const cfg = overlayConfig?.[format] ?? {};
  const fontFamily = cfg.fontFamily ?? "Oswald";
  const font = customFontsMap.has(fontFamily) 
    ? customFontsMap.get(fontFamily)! 
    : fontFamily.replace(/ /g, "%20");
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
  const resolvedBandFontFamily = bandFontFamily ?? fontFamily;
  const bandFont = customFontsMap.has(resolvedBandFontFamily)
    ? customFontsMap.get(resolvedBandFontFamily)!
    : resolvedBandFontFamily.replace(/ /g, "%20");
  const bandColor = cfg.bandTextColor ?? color;
  const venueColor = cfg.venueColor ?? color;
  const cityColor = cfg.cityColor ?? color;
  const dateColor = cfg.dateColor ?? color;
  const bandSize = cfg.bandSize ?? 48;
  const rawBandName = caps ? eventData.bandName.toUpperCase() : eventData.bandName;
  const bandName = sanitize(rawBandName);

  const showLogo = cfg.showLogo ?? false;
  const logoCfg = cfg.logo ?? null;
  const showSponsorLogo1 = cfg.showSponsorLogo1 ?? false;
  const sponsorLogo1Cfg = cfg.sponsorLogo1 ?? null;
  const showSponsorLogo2 = cfg.showSponsorLogo2 ?? false;
  const sponsorLogo2Cfg = cfg.sponsorLogo2 ?? null;

  const showCustomText1 = cfg.showCustomText1 ?? false;
  const customText1Cfg = cfg.customText1 ?? null;
  const customText1Size = customText1Cfg?.size ?? 28;
  const customText1XF = customText1Cfg?.x ?? 0.5;
  const customText1YF = customText1Cfg?.y ?? 0.97;
  const customText1Align = customText1Cfg?.align ?? "center";
  const hasCustomText1Content = !!(customText1 && customText1.trim().length > 0);
  const drawCustomText1 = showCustomText1 && hasCustomText1Content;
  const customText1Final = drawCustomText1
    ? sanitize(caps ? customText1!.toUpperCase() : customText1!)
    : "";

  const showCustomText2 = cfg.showCustomText2 ?? false;
  const customText2Cfg = cfg.customText2 ?? null;
  const customText2Size = customText2Cfg?.size ?? 28;
  const customText2XF = customText2Cfg?.x ?? 0.5;
  const customText2YF = customText2Cfg?.y ?? 0.99;
  const customText2Align = customText2Cfg?.align ?? "center";
  const hasCustomText2Content = !!(customText2 && customText2.trim().length > 0);
  const drawCustomText2 = showCustomText2 && hasCustomText2Content;
  const customText2Final = drawCustomText2
    ? sanitize(caps ? customText2!.toUpperCase() : customText2!)
    : "";

  const layers = [
    `c_fill,g_center,h_${h},w_${w}`,
    ...(showLogo && logoUrl && logoCfg ? [buildLogoLayer(logoUrl, logoCfg, color, w, h)] : []),
    ...(showSponsorLogo1 && sponsorLogo1Url && sponsorLogo1Cfg ? [buildSponsorLogoLayer(sponsorLogo1Url, sponsorLogo1Cfg, w, h)] : []),
    ...(showSponsorLogo2 && sponsorLogo2Url && sponsorLogo2Cfg ? [buildSponsorLogoLayer(sponsorLogo2Url, sponsorLogo2Cfg, w, h)] : []),
    ...(showBand ? [buildTextLayer(bandFont, bandSize, bandName, bandColor, bandXF, bandYF, w, h, bandAlign)] : []),
    ...((cfg.showVenue ?? true) ? [buildTextLayer(font, venueSize, venueName, venueColor, venueXF, venueYF, w, h, venueAlign)] : []),
    ...((cfg.showDate ?? true)  ? [buildTextLayer(font, dateSize,  dateStr,   dateColor, dateXF,  dateYF,  w, h, dateAlign)]  : []),
    ...((cfg.showCity ?? true)  ? [buildTextLayer(font, citySize,  cityState, cityColor, cityXF,  cityYF,  w, h, cityAlign)]  : []),
    ...(drawCustomText1
      ? [buildTextLayer(font, customText1Size, customText1Final, color, customText1XF, customText1YF, w, h, customText1Align)]
      : []),
    ...(drawCustomText2
      ? [buildTextLayer(font, customText2Size, customText2Final, color, customText2XF, customText2YF, w, h, customText2Align)]
      : []),
  ];

  return `https://res.cloudinary.com/${cloudName}/video/upload/${layers.join("/")}/${publicId}`;
}

export async function POST(req: NextRequest) {
  const { tourId, eventId, orgId, videosOnly } = await req.json();
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
      // cloudinary_public_id may already include the file extension
      // (depends on how the font was uploaded). Guard against double-append.
      const ext = `.${f.file_extension}`;
      const base = f.cloudinary_public_id.endsWith(ext)
        ? f.cloudinary_public_id
        : `${f.cloudinary_public_id}${ext}`;
      // Cloudinary requires slashes to be replaced with colons in font paths
      const cloudinaryPath = base.replace(/\//g, ":");
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
    .select("id, org_id, name, band_name, band_tour_label, image_square_id, image_story_id, image_landscape_id, video_tiktok_id, video_yt_shorts_id, overlay_config, crop_config, artist_id, sponsor_logo_1_url, sponsor_logo_2_url, custom_text_1, custom_text_2, band_font_family")
    .eq("id", tourId_resolved)
    .eq("org_id", orgId)
    .single();

  if (tourError || !tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  const rl = await checkRateLimit(`generate:${orgId}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: rl.reset
          ? { "Retry-After": String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))) }
          : undefined,
      }
    );
  }

  // Indie static-only tier gate. orgId is verified safe past the 404 above
  // (tour query requires .eq("org_id", orgId) — a spoofed orgId would have 404'd).
  // No admin bypass on this route — admins test on real-tier orgs.
  const { data: orgRow } = await supabase
    .from("orgs")
    .select("localizer_plan, localizer_plan_status, trial_ends_at")
    .eq("id", orgId)
    .maybeSingle();

  const tier = effectiveTierForFeatures({
    localizer_plan: orgRow?.localizer_plan ?? null,
    localizer_plan_status: orgRow?.localizer_plan_status ?? null,
    trial_ends_at: orgRow?.trial_ends_at ?? null,
  });

  // Computed once, before the per-event loop — not recomputed per event.
  // Missing org row -> tier "none" -> both arrays empty (fail closed).
  const allowedImageFormats = FORMATS.filter((f) => isFormatAllowedForTier(f, tier));
  const allowedVideoFormats = VIDEO_FORMATS.filter((f) => isFormatAllowedForTier(f, tier));

  // Defense-in-depth: an Indie client should never send videosOnly:true, but
  // if it does, refuse before any expensive work. Reads as "this tier can't
  // do any video" — robust to future tier-model changes.
  if (videosOnly && allowedVideoFormats.length === 0) {
    return NextResponse.json(
      { error: "Video assets require a Pro or Agency plan." },
      { status: 403 },
    );
  }

  if (videosOnly) {
    if (!(tour as any).video_tiktok_id && !(tour as any).video_yt_shorts_id) {
      return NextResponse.json({ ok: true, count: 0 });
    }
  } else {
    if (!tour.image_square_id) return NextResponse.json({ error: "No images uploaded. Go to Import Assets first." }, { status: 400 });
  }

  // Resolve artist logo URL for video overlays
  let logoUrl: string | null = null;
  if ((tour as any).artist_id) {
    const { data: artist } = await supabase
      .from("artists")
      .select("logo_url")
      .eq("id", (tour as any).artist_id)
      .single();
    logoUrl = artist?.logo_url ?? null;
  }
  const sponsorLogo1Url = (tour as any).sponsor_logo_1_url ?? null;
  const sponsorLogo2Url = (tour as any).sponsor_logo_2_url ?? null;

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

      const renderUrls: Record<string, string | null> = {};
      if (!videosOnly) {
        for (const format of allowedImageFormats) {
          const pid = formatPublicIds[format];
          if (!pid) {
            renderUrls[`render_${format}_url`] = null;
            continue;
          }
          const shortDate = !!(tour.overlay_config as any)?.[format]?.shortDate;
          const eventData = { ...baseEventData, dateFormatted: formatDateForRender(event.date_iso, shortDate) };
          renderUrls[`render_${format}_url`] = buildCloudinaryUrl(pid, cloudName, format, tour.overlay_config, eventData, customFontsMap, (tour as any).band_font_family ?? null, (tour as any).crop_config?.[format] ?? null);
        }
      }

      // Generate video render URLs
      const videoPublicIds: Record<VideoFormat, string | null> = {
        tiktok:    (tour as any).video_tiktok_id ?? null,
        yt_shorts: (tour as any).video_yt_shorts_id ?? null,
      };

      for (const vformat of allowedVideoFormats) {
        const pid = videoPublicIds[vformat];
        if (!pid) {
          if (!videosOnly) renderUrls[`render_${vformat}_url`] = null;
          continue;
        }
        const shortDateVideo = !!((tour.overlay_config as any)?.[vformat]?.shortDate || (tour.overlay_config as any)?.story?.shortDate);
        const eventData = { ...baseEventData, dateFormatted: formatDateForRender(event.date_iso, shortDateVideo) };
        renderUrls[`render_${vformat}_url`] = buildCloudinaryVideoUrl(pid, cloudName, vformat, tour.overlay_config, eventData, customFontsMap, logoUrl, sponsorLogo1Url, sponsorLogo2Url, tour.custom_text_1 ?? null, tour.custom_text_2 ?? null, (tour as any).band_font_family ?? null, null);
      }

      // Upsert venue_link
      const { data: existing } = await supabase
        .from("venue_links")
        .select("id, token")
        .eq("event_id", event.id)
        .eq("is_active", true)
        .maybeSingle();

      if (existing?.id) {
        const { data, error: updateErr } = await supabase
          .from("venue_links")
          .update({ ...renderUrls })
          .eq("id", existing.id)
          .select()
          .maybeSingle();
        console.log("UPDATE RESULT:", existing.id, "rows=" + (data ? 1 : 0), updateErr ? JSON.stringify(updateErr) : "");
        if (updateErr) throw updateErr;
        if (!data) {
          console.error("[renders/generate] venue_links update returned no row — possible silent RLS rejection", { eventId: event.id, orgId, venue_link_id: existing.id });
          throw new Error("venue_links_update_failed");
        }
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
