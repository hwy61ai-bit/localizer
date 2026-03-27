// Client-side poster rendering via HTML Canvas
// Replaces Cloudinary text overlay URL construction

type FieldConfig = { x: number; y: number; size: number; align?: string };

type FormatConfig = {
  showLogo?: boolean;
  logo?: { x: number; y: number; size: number; align?: string };
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
};

type EventData = {
  bandName: string;
  dateFormatted: string;
  venueName: string;
  cityState: string;
};

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
  logoUrl?: string | null
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
  if (cfg.showLogo && logoUrl) {
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
    ctx.textBaseline = "middle";

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
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, blockTop + i * lh);
      }
      ctx.restore();
      return;
    }

    // Single line — shrink to fit if needed
    for (let sz = size; sz >= 12; sz -= 2) {
      ctx.font = "bold " + sz + "px '" + fontFamily + "', sans-serif";
      if (ctx.measureText(text).width <= avail) {
        ctx.fillText(text, x, y);
        ctx.restore();
        return;
      }
    }

    // Last resort
    ctx.font = "bold 12px '" + fontFamily + "', sans-serif";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Band name (optional)
  if (cfg.showBandName) {
    const bandField = cfg.band ?? { x: 0.5, y: 0.65, size: 80, align: "center" };
    const bandText = caps ? eventData.bandName.toUpperCase() : eventData.bandName;
    drawText(bandText, bandField, cfg.bandSize);
  }

  // Venue — auto-shrink to fit
  const rawVenue = caps ? eventData.venueName.toUpperCase() : eventData.venueName;

  drawText(rawVenue, cfg.venue, cfg.venue.size, true, formatKey);

  // Date
  drawText(eventData.dateFormatted, cfg.date, cfg.date.size);

  // City — auto-shrink to fit
  const rawCity = caps ? eventData.cityState.toUpperCase() : eventData.cityState;
  drawText(rawCity, cfg.city, cfg.city.size);

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
