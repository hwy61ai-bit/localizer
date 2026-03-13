import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type RenderFormat = "poster" | "square" | "story" | "landscape";

export type FieldConfig = {
  x: number;    // 0.0-1.0 fraction of image width (0.5 = center)
  y: number;    // 0.0-1.0 fraction of image height
  size: number; // font size in px
};

export type FormatConfig = {
  fontFamily: string;
  textColor: string;
  showBandName: boolean;
  bandSize: number;
  date: FieldConfig;
  venue: FieldConfig;
  city: FieldConfig;
};

export const DEFAULT_FORMAT_CONFIG: FormatConfig = {
  fontFamily: "Oswald",
  textColor: "ffffff",
  showBandName: false,
  bandSize: 80,
  date:  { x: 0.5, y: 0.84, size: 40 },
  venue: { x: 0.5, y: 0.76, size: 52 },
  city:  { x: 0.5, y: 0.91, size: 40 },
};

const FORMAT_DIMS: Record<RenderFormat, { w: number; h: number }> = {
  poster:    { w: 1080, h: 1920 },
  square:    { w: 1080, h: 1080 },
  story:     { w: 1080, h: 1350 },
  landscape: { w: 1920, h: 1080 },
};

export type EventData = {
  bandName: string;
  dateFormatted: string;
  venueName: string;
  cityState: string;
};

function sanitizeText(text: string): string {
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
  formatConfig?: FormatConfig
): string {
  if (format === "poster") {
    return cloudinary.url(publicId, { secure: true });
  }

  const dims = FORMAT_DIMS[format];
  const cfg = { ...DEFAULT_FORMAT_CONFIG, ...formatConfig };
  const font = encodeURIComponent(cfg.fontFamily);
  const maxW = Math.round(dims.w * 0.85);
  const color = `#${cfg.textColor}`;

  // Convert fractional positions to pixel offsets from image center
  function toPixel(field: FieldConfig) {
    return {
      xPx: Math.round((field.x - 0.5) * dims.w),
      yPx: Math.round((field.y - 0.5) * dims.h),
    };
  }

  const venuePos = toPixel(cfg.venue);
  const datePos  = toPixel(cfg.date);
  const cityPos  = toPixel(cfg.city);

  const bandName  = sanitizeText(event.bandName);
  const dateStr   = sanitizeText(event.dateFormatted);
  const venueName = sanitizeText(event.venueName);
  const cityState = sanitizeText(event.cityState);

  const transformations: object[] = [
    { width: dims.w, height: dims.h, crop: "fill", gravity: "center" },
    ...(cfg.showGradient ? [{ effect: "gradient_fade:symmetric_pad", y: -0.5 }] : []),
    ...(cfg.showBandName ? [{
      overlay: { font_family: font, font_size: cfg.bandSize, font_weight: "bold", text: bandName },
      color, gravity: "center", x: 0,
      y: Math.round((0.65 - 0.5) * dims.h),
      width: maxW, crop: "fit", flags: "layer_apply",
    }] : []),
    {
      overlay: { font_family: font, font_size: cfg.venue.size, font_weight: "bold", text: venueName },
      color, gravity: "center",
      x: venuePos.xPx, y: venuePos.yPx,
      width: maxW, crop: "fit", flags: "layer_apply",
    },
    {
      overlay: { font_family: font, font_size: cfg.date.size, text: dateStr },
      color, gravity: "center",
      x: datePos.xPx, y: datePos.yPx,
      width: maxW, crop: "fit", flags: "layer_apply",
    },
    {
      overlay: { font_family: font, font_size: cfg.city.size, text: cityState },
      color, gravity: "center",
      x: cityPos.xPx, y: cityPos.yPx,
      width: maxW, crop: "fit", flags: "layer_apply",
    },
  ];

  return cloudinary.url(publicId, { transformation: transformations, secure: true });
}
