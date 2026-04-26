import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import { fetchFontBytes } from "@/lib/fetchFont";

// Public route — token-gated (validates against venue_links or marketing_tokens)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { global: { fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }) } }
);

// PDF uses 72 points per inch. 11x17 inches = 792x1224 points.
const PAGE_WIDTH_PT = 792;
const PAGE_HEIGHT_PT = 1224;

// Base image pixel dimensions for scaling font sizes
const PIXEL_WIDTH = 3300;
const SCALE_FACTOR = PAGE_WIDTH_PT / PIXEL_WIDTH; // ~0.24

const SHORT_MONTHS = ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"];

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return "TH";
  switch (n % 10) {
    case 1: return "ST";
    case 2: return "ND";
    case 3: return "RD";
    default: return "TH";
  }
}

function formatDate(iso: string, short = false): string {
  try {
    const d = new Date(iso + "T12:00:00");
    if (short) {
      const month = SHORT_MONTHS[d.getMonth()].toUpperCase();
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

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return rgb(
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255
  );
}

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("eventId");
  const token = req.nextUrl.searchParams.get("token");
  if (!eventId || !token) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  const { data: venueLink } = await supabase
    .from("venue_links")
    .select("id")
    .eq("token", token)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!venueLink) {
    const { data: marketingToken } = await supabase
      .from("marketing_tokens")
      .select("tour_id")
      .eq("token", token)
      .maybeSingle();

    if (!marketingToken) {
      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    const { data: scopedEvent } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .eq("tour_id", marketingToken.tour_id)
      .maybeSingle();

    if (!scopedEvent) {
      return NextResponse.json({ error: "token_event_mismatch" }, { status: 403 });
    }
  }

  // Fetch event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, tour_id, date_iso, city, state, venue, venue_name, venue_city, venue_state")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Fetch tour
  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("id, org_id, image_print_id, overlay_config, band_name, name")
    .eq("id", event.tour_id)
    .single();

  if (tourError || !tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  // overlay_config is JSONB — Supabase should return it as a parsed object,
  // but guard against it being returned as a string.
  let overlayConfig = tour.overlay_config as Record<string, any> | string | null;
  if (typeof overlayConfig === "string") {
    try { overlayConfig = JSON.parse(overlayConfig); } catch { overlayConfig = null; }
  }
  const printConfig = (overlayConfig as Record<string, any> | null)?.print;

  if (!tour.image_print_id || !printConfig) {
    return NextResponse.json({ error: "Print poster not configured" }, { status: 404 });
  }

  // Fetch the high-res base image from Cloudinary (resize to exact 3300x5100)
  const imageUrl = `https://res.cloudinary.com/dlhrc91ne/image/upload/w_3300,h_5100,c_fill/${tour.image_print_id}`;
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    return NextResponse.json({ error: "Failed to fetch base image" }, { status: 500 });
  }
  const imageBytes = new Uint8Array(await imageRes.arrayBuffer());

  // Fetch custom fonts for this org (using service role to bypass RLS)
  const { data: customFonts } = await supabase
    .from("custom_fonts")
    .select("font_name, storage_url")
    .eq("org_id", tour.org_id);

  // Fetch font bytes
  const fontFamily = printConfig.fontFamily || "Oswald";
  let fontBytes: Uint8Array;
  try {
    fontBytes = await fetchFontBytes(fontFamily, customFonts ?? []);
  } catch {
    // Fallback to Oswald
    fontBytes = await fetchFontBytes("Oswald", []);
  }

  // Build PDF — dynamic import fontkit to avoid webpack CJS bundling issues
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const page = pdfDoc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT]);
  const font = await pdfDoc.embedFont(fontBytes);
  const textColor = hexToRgb(printConfig.textColor || "ffffff");
  const allCaps = printConfig.allCaps ?? false;
  const shortDate = printConfig.shortDate ?? false;

  // Embed and draw base image
  const contentType = imageRes.headers.get("content-type") ?? "";
  let embeddedImage;
  if (contentType.includes("png")) {
    embeddedImage = await pdfDoc.embedPng(imageBytes);
  } else {
    embeddedImage = await pdfDoc.embedJpg(imageBytes);
  }
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width: PAGE_WIDTH_PT,
    height: PAGE_HEIGHT_PT,
  });

  // Prepare event text
  const venueName = event.venue_name ?? event.venue ?? "";
  const city = event.venue_city ?? event.city ?? "";
  const state = event.venue_state ?? event.state ?? "";
  const cityState = [city, state].filter(Boolean).join(", ");
  const dateStr = formatDate(event.date_iso, shortDate);

  // Baseline offset: the editor uses textBaseline:"middle", meaning the stored y
  // represents the vertical center of the text (midpoint between ascent and descent).
  // pdf-lib positions at the baseline. To convert:
  //   middle_y = baseline_y + ascent - totalHeight/2
  //   baseline_y = middle_y - ascent + totalHeight/2
  // So the offset from middle to baseline = ascent - totalHeight/2
  function baselineOffset(fontSize: number): number {
    const totalHeight = font.heightAtSize(fontSize);                      // ascent + |descent|
    const ascentHeight = font.heightAtSize(fontSize, { descender: false }); // ascent only
    return ascentHeight - totalHeight / 2;
  }

  function drawTextField(
    text: string,
    fieldConfig: { x: number; y: number; size: number; align?: string },
    isVenue = false
  ) {
    if (!fieldConfig) return;
    const pdfFontSize = fieldConfig.size * SCALE_FACTOR;
    const xCenter = fieldConfig.x * PAGE_WIDTH_PT;
    const align = fieldConfig.align ?? "center";

    // Available width calculation
    const margin = 0.95;
    let availWidth: number;
    if (align === "left") {
      availWidth = (1 - fieldConfig.x) * PAGE_WIDTH_PT * margin;
    } else if (align === "right") {
      availWidth = fieldConfig.x * PAGE_WIDTH_PT * margin;
    } else {
      availWidth = Math.min(fieldConfig.x, 1 - fieldConfig.x) * 2 * PAGE_WIDTH_PT * margin;
    }

    // Handle pipe line breaks for venue names
    if (isVenue && text.includes("|")) {
      const lines = text.split("|").map(l => l.trim());
      // Find size that fits all lines
      let fitSize = pdfFontSize;
      for (let sz = pdfFontSize; sz >= 6; sz -= 0.5) {
        if (lines.every(l => font.widthOfTextAtSize(l, sz) <= availWidth)) {
          fitSize = sz;
          break;
        }
        if (sz <= 6) fitSize = 6;
      }
      const lh = fitSize * 0.85;
      // PDF origin is bottom-left, config origin is top-left
      // Convert y fraction to PDF y, then adjust for "middle" baseline
      const yCenterPdf = PAGE_HEIGHT_PT - fieldConfig.y * PAGE_HEIGHT_PT;
      const yBaseline = yCenterPdf - baselineOffset(fitSize);
      const blockTop = yBaseline + ((lines.length - 1) * lh) / 2;
      for (let i = 0; i < lines.length; i++) {
        const lineWidth = font.widthOfTextAtSize(lines[i], fitSize);
        let xPos: number;
        if (align === "left") xPos = xCenter;
        else if (align === "right") xPos = xCenter - lineWidth;
        else xPos = xCenter - lineWidth / 2;
        page.drawText(lines[i], {
          x: xPos,
          y: blockTop - i * lh,
          size: fitSize,
          font,
          color: textColor,
        });
      }
      return;
    }

    // Single line — auto-shrink to fit
    let fitSize = pdfFontSize;
    for (let sz = pdfFontSize; sz >= 6; sz -= 0.5) {
      if (font.widthOfTextAtSize(text, sz) <= availWidth) {
        fitSize = sz;
        break;
      }
      if (sz <= 6) fitSize = 6;
    }

    // PDF origin is bottom-left, config origin is top-left
    // Adjust for "middle" baseline using actual font metrics
    const yCenterPdf = PAGE_HEIGHT_PT - fieldConfig.y * PAGE_HEIGHT_PT;
    const yBaseline = yCenterPdf - baselineOffset(fitSize);

    const textWidth = font.widthOfTextAtSize(text, fitSize);
    let xPos: number;
    if (align === "left") xPos = xCenter;
    else if (align === "right") xPos = xCenter - textWidth;
    else xPos = xCenter - textWidth / 2;

    page.drawText(text, {
      x: xPos,
      y: yBaseline,
      size: fitSize,
      font,
      color: textColor,
    });
  }

  // Draw band name if enabled
  if (printConfig.showBandName) {
    const bandField = printConfig.band ?? { x: 0.5, y: 0.65, size: 80, align: "center" };
    const bandText = allCaps ? (tour.band_name ?? tour.name ?? "").toUpperCase() : (tour.band_name ?? tour.name ?? "");
    drawTextField(bandText, { ...bandField, size: printConfig.bandSize ?? 80 });
  }

  // Draw venue
  if (printConfig.showVenue ?? true) {
    const venueText = allCaps ? venueName.toUpperCase() : venueName;
    drawTextField(venueText, printConfig.venue, true);
  }

  // Draw date
  if (printConfig.showDate ?? true) {
    const dateText = allCaps ? dateStr.toUpperCase() : dateStr;
    drawTextField(dateText, printConfig.date);
  }

  // Draw city
  if (printConfig.showCity ?? true) {
    const cityText = allCaps ? cityState.toUpperCase() : cityState;
    drawTextField(cityText, printConfig.city);
  }

  // Serialize PDF
  const pdfBytes = await pdfDoc.save();

  const safeVenue = venueName.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);
  const safeDate = event.date_iso ?? "unknown";
  const filename = `${safeVenue}_${safeDate}_print_poster.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
