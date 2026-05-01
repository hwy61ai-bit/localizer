// Client-side poster rendering via HTML Canvas
// Replaces Cloudinary text overlay URL construction

type FieldConfig = { x: number; y: number; size: number; align?: string };

type FormatConfig = {
  showLogo?: boolean;
  logo?: { x: number; y: number; size: number; align?: string };
  showSponsorLogo1?: boolean;
  sponsorLogo1?: { x: number; y: number; size: number; align?: string };
  showSponsorLogo2?: boolean;
  sponsorLogo2?: { x: number; y: number; size: number; align?: string };
  fontFamily: string;
  textColor: string;
  showBandName: boolean;
  bandSize: number;
  shortDate?: boolean;
  allCaps?: boolean;
  band?: FieldConfig;
  date: FieldConfig;
  venue: FieldConfig;
  city: FieldConfig;
  showCustomText1?: boolean;
  customText1?: FieldConfig;
  showCustomText2?: boolean;
  customText2?: FieldConfig;
  showVenue?: boolean;
  showCity?: boolean;
  showDate?: boolean;
};

type EventData = {
  bandName: string;
  dateFormatted: string;
  venueName: string;
  cityState: string;
  customText1?: string | null;
  customText2?: string | null;
};

const CUSTOM_TEXT_1_DEFAULT: FieldConfig = { x: 0.5, y: 0.08, size: 48, align: "center" };
const CUSTOM_TEXT_2_DEFAULT: FieldConfig = { x: 0.5, y: 0.92, size: 48, align: "center" };

// Match the generate route's output dimensions exactly
const FORMAT_DIMS: Record<string, { w: number; h: number }> = {
  square:    { w: 1080, h: 1080 },
  story:     { w: 1080, h: 1350 },
  landscape: { w: 820,  h: 312 },
};

// Landscape font sizes are stored at 1920x1080 scale in overlay_config,
// so we scale them down to match the 820x312 output (820/1920 ≈ 0.427)
const SCALE_FACTORS: Record<string, number> = {
  square: 1.0,
  story: 1.0,
  landscape: 1.0,
};

// Auto-shrink using canvas measureText for pixel-perfect accuracy
function fitFontSize(text: string, maxSize: number, availW: number, fontFamily?: string): number {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const font = fontFamily ?? "sans-serif";
  for (let size = maxSize; size >= 12; size -= 2) {
    ctx.font = "bold " + size + "px '" + font + "', sans-serif";
    const measured = ctx.measureText(text).width;
    if (measured <= availW) return size;
  }
  return 12;
}

function availableWidth(xFrac: number, canvasW: number, align: string): number {
  const margin = 0.95;
  if (align === "left") return (1 - xFrac) * canvasW * margin;
  if (align === "right") return xFrac * canvasW * margin;
  return Math.min(xFrac, 1 - xFrac) * 2 * canvasW * margin;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image: " + url));
    img.src = url;
  });
}

export function ordinal(n: number): string {
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

export function formatDateForRender(iso: string, short = false): string {
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

/**
 * Renders a single poster to a JPEG blob using browser canvas.
 *
 * @param baseImageUrl  Cloudinary URL for the base image (with c_fill dimensions)
 * @param cfg           The overlay config for this format
 * @param formatKey     "square" | "story" | "landscape"
 * @param eventData     Text content for this event
 * @returns             JPEG Blob ready for upload
 */
export async function renderPoster(
  baseImageUrl: string,
  cfg: FormatConfig,
  formatKey: string,
  eventData: EventData,
  logoUrl?: string | null,
  sponsorLogo1Url?: string | null,
  sponsorLogo2Url?: string | null,
  bandFontFamily?: string | null,
  bandTextColor?: string | null
): Promise<Blob> {
  const dims = FORMAT_DIMS[formatKey] ?? FORMAT_DIMS.square;
  const scale = SCALE_FACTORS[formatKey] ?? 1.0;
  const { w, h } = dims;

  // Create offscreen canvas at exact output dimensions
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Load base image (Cloudinary pre-crops it via URL params)
  const img = await loadImage(baseImageUrl);
  ctx.drawImage(img, 0, 0, w, h);

  // Wait for all fonts to finish loading
  await document.fonts.ready;

  // Draw band logo if enabled
  if (formatKey !== "print" && cfg.showLogo && logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      const logoCfg = cfg.logo ?? { x: 0.5, y: 0.15, size: 80 };
      const logoH = Math.round(logoCfg.size * scale);
      const logoW = Math.round(logoH * (logoImg.width / logoImg.height));
      const logoX = logoCfg.x * w - logoW / 2;
      const logoY = logoCfg.y * h - logoH / 2;

      // Draw logo to offscreen canvas, then tint to text color
      const logoCanvas = document.createElement("canvas");
      logoCanvas.width = logoW;
      logoCanvas.height = logoH;
      const logoCtx = logoCanvas.getContext("2d")!;
      logoCtx.drawImage(logoImg, 0, 0, logoW, logoH);

      // Apply text color tint: draw color over logo using source-in composite
      logoCtx.globalCompositeOperation = "source-in";
      logoCtx.fillStyle = "#" + (cfg.textColor ?? "ffffff");
      logoCtx.fillRect(0, 0, logoW, logoH);

      ctx.drawImage(logoCanvas, logoX, logoY);
    } catch (e) {
      console.warn("Failed to draw logo:", e);
    }
  }

  // Draw sponsor logo 1 if enabled (tinted to text color)
  if (formatKey !== "print" && cfg.showSponsorLogo1 && sponsorLogo1Url) {
    try {
      const sponsorImg = await loadImage(sponsorLogo1Url);
      const sponsorCfg = cfg.sponsorLogo1 ?? { x: 0.35, y: 0.88, size: 60 };
      const sponsorH = Math.round(sponsorCfg.size * scale);
      const sponsorW = Math.round(sponsorH * (sponsorImg.width / sponsorImg.height));
      const sponsorX = sponsorCfg.x * w - sponsorW / 2;
      const sponsorY = sponsorCfg.y * h - sponsorH / 2;

      const sponsorCanvas = document.createElement("canvas");
      sponsorCanvas.width = sponsorW;
      sponsorCanvas.height = sponsorH;
      const sponsorCtx = sponsorCanvas.getContext("2d")!;
      sponsorCtx.drawImage(sponsorImg, 0, 0, sponsorW, sponsorH);

      // Apply text color tint: draw color over logo using source-in composite
      sponsorCtx.globalCompositeOperation = "source-in";
      sponsorCtx.fillStyle = "#" + (cfg.textColor ?? "ffffff");
      sponsorCtx.fillRect(0, 0, sponsorW, sponsorH);

      ctx.drawImage(sponsorCanvas, sponsorX, sponsorY);
    } catch (e) {
      console.warn("Failed to draw sponsor logo 1:", e);
    }
  }

  // Draw sponsor logo 2 if enabled (tinted to text color)
  if (formatKey !== "print" && cfg.showSponsorLogo2 && sponsorLogo2Url) {
    try {
      const sponsorImg = await loadImage(sponsorLogo2Url);
      const sponsorCfg = cfg.sponsorLogo2 ?? { x: 0.65, y: 0.88, size: 60 };
      const sponsorH = Math.round(sponsorCfg.size * scale);
      const sponsorW = Math.round(sponsorH * (sponsorImg.width / sponsorImg.height));
      const sponsorX = sponsorCfg.x * w - sponsorW / 2;
      const sponsorY = sponsorCfg.y * h - sponsorH / 2;

      const sponsorCanvas = document.createElement("canvas");
      sponsorCanvas.width = sponsorW;
      sponsorCanvas.height = sponsorH;
      const sponsorCtx = sponsorCanvas.getContext("2d")!;
      sponsorCtx.drawImage(sponsorImg, 0, 0, sponsorW, sponsorH);

      // Apply text color tint: draw color over logo using source-in composite
      sponsorCtx.globalCompositeOperation = "source-in";
      sponsorCtx.fillStyle = "#" + (cfg.textColor ?? "ffffff");
      sponsorCtx.fillRect(0, 0, sponsorW, sponsorH);

      ctx.drawImage(sponsorCanvas, sponsorX, sponsorY);
    } catch (e) {
      console.warn("Failed to draw sponsor logo 2:", e);
    }
  }

  const fontFamily = cfg.fontFamily;
  const color = `#${cfg.textColor}`;
  const caps = cfg.allCaps ?? false;

  // Shared text drawing function — mirrors buildTextLayer from generate route
  function drawText(text: string, field: FieldConfig, maxFontSize: number, isVenue = false, formatKey = "") {
    const align = (field.align ?? "center") as CanvasTextAlign;
    const size = Math.round(maxFontSize * scale);
    const avail = availableWidth(field.x, w, field.align ?? "center");
    const x = field.x * w;
    const y = field.y * h;

    ctx.save();
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";

    // Venue with explicit | line break
    if (isVenue && text.includes("|") && formatKey !== "landscape") {
      const lines = text.split("|").map(l => l.trim());
      // Find size that fits all lines
      let fitSize = size;
      for (let sz = size; sz >= 12; sz -= 2) {
        ctx.font = "bold " + sz + "px '" + fontFamily + "', sans-serif";
        if (lines.every(l => ctx.measureText(l).width <= avail)) {
          fitSize = sz;
          break;
        }
        if (sz <= 12) fitSize = 12;
      }
      ctx.font = "bold " + fitSize + "px '" + fontFamily + "', sans-serif";
      const lh = fitSize * 0.85;
      const blockTop = y - ((lines.length - 1) * lh) / 2;
      const lbm = ctx.measureText(lines[0] || "M");
      const lineBoxOffset = (lbm.fontBoundingBoxAscent - lbm.fontBoundingBoxDescent) / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, blockTop + i * lh + lineBoxOffset);
      }
      ctx.restore();
      return;
    }

    // Single line — shrink to fit if needed
    for (let sz = size; sz >= 12; sz -= 2) {
      ctx.font = "bold " + sz + "px '" + fontFamily + "', sans-serif";
      const m = ctx.measureText(text);
      if (m.width <= avail) {
        const lineBoxOffset = (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
        ctx.fillText(text, x, y + lineBoxOffset);
        ctx.restore();
        return;
      }
    }

    // Last resort
    ctx.font = "bold 12px '" + fontFamily + "', sans-serif";
    const lrm = ctx.measureText(text);
    const lrLineBoxOffset = (lrm.fontBoundingBoxAscent - lrm.fontBoundingBoxDescent) / 2;
    ctx.fillText(text, x, y + lrLineBoxOffset);
    ctx.restore();
  }

  // Band name (optional) — uses optional override font/color
  if (cfg.showBandName) {
    const bandField = cfg.band ?? { x: 0.5, y: 0.65, size: 80, align: "center" };
    const bandText = caps ? eventData.bandName.toUpperCase() : eventData.bandName;
    const resolvedBandFont = bandFontFamily ?? fontFamily;
    const resolvedBandColor = bandTextColor ? `#${bandTextColor}` : color;
    const bandSize = Math.round(cfg.bandSize * scale);
    const bandAvail = availableWidth(bandField.x, w, bandField.align ?? "center");
    const bandX = bandField.x * w;
    const bandY = bandField.y * h;
    const bandAlign = (bandField.align ?? "center") as CanvasTextAlign;
    ctx.save();
    ctx.fillStyle = resolvedBandColor;
    ctx.textAlign = bandAlign;
    ctx.textBaseline = "alphabetic";
    // Shrink-to-fit loop matching drawText's pattern
    let fitSize = bandSize;
    for (let sz = bandSize; sz >= 12; sz -= 2) {
      ctx.font = "bold " + sz + "px '" + resolvedBandFont + "', sans-serif";
      if (ctx.measureText(bandText).width <= bandAvail) {
        fitSize = sz;
        break;
      }
      if (sz <= 12) fitSize = 12;
    }
    ctx.font = "bold " + fitSize + "px '" + resolvedBandFont + "', sans-serif";
    const m = ctx.measureText(bandText);
    const lineBoxOffset = (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
    ctx.fillText(bandText, bandX, bandY + lineBoxOffset);
    ctx.restore();
  }

  // Venue — auto-shrink to fit
  if (cfg.showVenue ?? true) {
    const rawVenue = caps ? eventData.venueName.toUpperCase() : eventData.venueName;
    drawText(rawVenue, cfg.venue, cfg.venue.size, true, formatKey);
  }

  // Date
  if (cfg.showDate ?? true) {
    drawText(eventData.dateFormatted, cfg.date, cfg.date.size);
  }

  // City — auto-shrink to fit
  if (cfg.showCity ?? true) {
    const rawCity = caps ? eventData.cityState.toUpperCase() : eventData.cityState;
    drawText(rawCity, cfg.city, cfg.city.size);
  }

  // Custom text 1 — opt-in, not drawn on print
  if (formatKey !== "print" && (cfg.showCustomText1 ?? false) && (eventData.customText1 ?? "").length > 0) {
    const ct1 = cfg.customText1 ?? CUSTOM_TEXT_1_DEFAULT;
    drawText(eventData.customText1!, ct1, ct1.size);
  }

  // Custom text 2 — opt-in, not drawn on print
  if (formatKey !== "print" && (cfg.showCustomText2 ?? false) && (eventData.customText2 ?? "").length > 0) {
    const ct2 = cfg.customText2 ?? CUSTOM_TEXT_2_DEFAULT;
    drawText(eventData.customText2!, ct2, ct2.size);
  }

  // Export as JPEG
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      0.92
    );
  });
}

/**
 * Upload a rendered JPEG blob to Cloudinary via unsigned upload.
 * Returns the secure CDN URL.
 */
export async function uploadToCloudinary(
  blob: Blob,
  cloudName: string,
  uploadPreset: string = "localizer_tours"
): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, "poster.jpg");
  fd.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await res.json();
  return data.secure_url;
}
