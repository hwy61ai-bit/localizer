import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type RenderFormat = "poster" | "square" | "story" | "landscape";

const FORMAT_DIMS: Record<RenderFormat, { w: number; h: number }> = {
  poster:    { w: 1080, h: 1920 },
  square:    { w: 1080, h: 1080 },
  story:     { w: 1080, h: 1350 },
  landscape: { w: 1920, h: 1080 },
};

export type OverlayConfig = {
  fontFamily?: string;       // must be a supported Google Font e.g. "Oswald", "Anton", "Teko" 
  bandColor?: string;        // hex without #, e.g. "ffffff"
  dateColor?: string;
  venueColor?: string;
  cityColor?: string;
  bandSize?: number;
  dateSize?: number;
  venueSize?: number;
  citySize?: number;
  gravity?: string;          // e.g. "south" — anchor point for text block
  yOffset?: number;          // pixels from anchor
  xOffset?: number;          // horizontal offset, 0 = centered
  showGradient?: boolean;    // default false
  showBandName?: boolean;    // default false
};

export type EventData = {
  bandName: string;
  dateFormatted: string;     // e.g. "Friday, May 9, 2026"
  venueName: string;
  cityState: string;         // e.g. "Chicago, IL"
};

const DEFAULT_CONFIG: Required<OverlayConfig> = {
  fontFamily: "Oswald",
  bandColor: "ffffff",
  dateColor: "cccccc",
  venueColor: "ffffff",
  cityColor: "cccccc",
  bandSize: 80,
  dateSize: 40,
  venueSize: 52,
  citySize: 40,
  gravity: "south",
  yOffset: 120,
  xOffset: 0,
  showGradient: false,
  showBandName: false,
};

function sanitizeText(text: string): string {
  // Replace commas and problematic characters for Cloudinary text overlays
  return text
    .replace(/,/g, " ")
    .replace(/\//g, " ")
    .replace(/[?&#%]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildRenderUrl(
  publicId: string,
  event: EventData,
  format: RenderFormat,
  overrideConfig?: OverlayConfig
): string {
  // Poster is the pre-made image — no text overlays needed
  if (format === "poster") {
    return cloudinary.url(publicId, { secure: true });
  }

  const dims = FORMAT_DIMS[format];
  const cfg = { ...DEFAULT_CONFIG, ...overrideConfig };

  // Scale font sizes for landscape (wider, shorter canvas)
  const scale = format === "landscape" ? 0.75 : 1;
  const bandSize  = Math.round(cfg.bandSize  * scale);
  const dateSize  = Math.round(cfg.dateSize  * scale);
  const venueSize = Math.round(cfg.venueSize * scale);
  const citySize  = Math.round(cfg.citySize  * scale);

  const font = encodeURIComponent(cfg.fontFamily);
  const maxW = Math.round(dims.w * 0.85); // text constrained to 85% of canvas width

  const bandName  = sanitizeText(event.bandName);
  const dateStr   = sanitizeText(event.dateFormatted);
  const venueName = sanitizeText(event.venueName);
  const cityState = sanitizeText(event.cityState);

  const transformations: object[] = [
    // 1. Resize base image to target format
    { width: dims.w, height: dims.h, crop: "fill", gravity: "center" },

    // 2. Optional gradient fade at bottom for text legibility
    ...(cfg.showGradient ? [{ effect: "gradient_fade:symmetric_pad", y: -0.5 }] : []),

    // 3. Band name (optional — off by default since most posters have it baked in)
    ...(cfg.showBandName ? [{
      overlay: { font_family: font, font_size: bandSize, font_weight: "bold", text: bandName },
      color: `#${cfg.bandColor}`,
      gravity: cfg.gravity,
      y: cfg.yOffset + dateSize + venueSize + citySize + 24,
      width: maxW,
      crop: "fit",
      flags: "layer_apply",
    }] : []),

    // 4. Date
    {
      overlay: { font_family: font, font_size: dateSize, text: dateStr },
      color: `#${cfg.dateColor}`,
      gravity: cfg.gravity,
      x: cfg.xOffset,
      y: cfg.yOffset + venueSize + citySize + 12,
      width: maxW,
      crop: "fit",
      flags: "layer_apply",
    },

    // 5. Venue name
    {
      overlay: { font_family: font, font_size: venueSize, font_weight: "bold", text: venueName },
      color: `#${cfg.venueColor}`,
      gravity: cfg.gravity,
      x: cfg.xOffset,
      y: cfg.yOffset + citySize + 6,
      width: maxW,
      crop: "fit",
      flags: "layer_apply",
    },

    // 6. City, State
    {
      overlay: { font_family: font, font_size: citySize, text: cityState },
      color: `#${cfg.cityColor}`,
      gravity: cfg.gravity,
      x: cfg.xOffset,
      y: cfg.yOffset,
      width: maxW,
      crop: "fit",
      flags: "layer_apply",
    },
  ];

  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
  });
}
