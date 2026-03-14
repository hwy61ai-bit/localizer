import sharp from "sharp";

export type FieldConfig = { x: number; y: number; size: number };
export type FormatConfig = {
  fontFamily: string;
  textColor: string;
  showBandName: boolean;
  bandSize: number;
  band?: FieldConfig;
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

export type RenderFormat = "square" | "story" | "landscape";

export const FORMAT_DIMS: Record<RenderFormat, { w: number; h: number }> = {
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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3
    ? h.split("").map(c => c + c).join("")
    : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine && current.length > 0) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

function buildTextSvg(
  text: string,
  cfg: FormatConfig,
  field: FieldConfig,
  w: number,
  h: number,
  bold: boolean = false
): string {
  const color = cfg.textColor.startsWith("#") ? cfg.textColor : `#${cfg.textColor}`;
  const { r, g, b } = hexToRgb(color);
  const xPx = Math.round(field.x * w);
  const yPx = Math.round(field.y * h);
  const maxW = Math.round(w * 0.85);
  const fontSize = field.size;
  const fontWeight = bold ? "bold" : "normal";

  // Estimate chars per line based on font size and max width
  const charsPerLine = Math.floor(maxW / (fontSize * 0.55));
  const lines = wrapText(text, charsPerLine);
  const lineHeight = Math.round(fontSize * 1.15);
  const totalH = lines.length * lineHeight;
  const startY = yPx - Math.floor((lines.length - 1) * lineHeight / 2);

  const textEls = lines.map((line, i) => {
    const ly = startY + i * lineHeight;
    return `<text
      x="${xPx}"
      y="${ly}"
      text-anchor="middle"
      dominant-baseline="central"
      font-family="'${cfg.fontFamily}', 'Oswald', Arial, sans-serif"
      font-size="${fontSize}"
      font-weight="${fontWeight}"
      fill="rgb(${r},${g},${b})"
      paint-order="stroke"
      stroke="rgba(0,0,0,0.45)"
      stroke-width="${Math.round(fontSize * 0.08)}"
      stroke-linejoin="round"
    >${line}</text>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    ${textEls}
  </svg>`;
}

async function fetchImageBuffer(cloudinaryPublicId: string): Promise<Buffer> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const url = `https://res.cloudinary.com/${cloudName}/image/upload/${cloudinaryPublicId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${cloudinaryPublicId} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000);
  const str = `overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "image/png" }), "render.png");
  form.append("public_id", publicId);
  form.append("overwrite", "true");
  form.append("timestamp", String(timestamp));
  form.append("api_key", apiKey);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const result = await res.json();
  if (result.error) throw new Error(`Cloudinary upload failed: ${result.error.message}`);
  return result.secure_url;
}

export async function renderEventFormat(
  basePublicId: string,
  format: RenderFormat,
  event: EventData,
  cfg: FormatConfig,
  outputPublicId: string
): Promise<string> {
  const { w, h } = FORMAT_DIMS[format];

  // Fetch and resize base image
  const imageBuffer = await fetchImageBuffer(basePublicId);
  const base = await sharp(imageBuffer)
    .resize(w, h, { fit: "cover", position: "center" })
    .toFormat("png")
    .toBuffer();

  // Build SVG overlays for each text field
  const overlays: sharp.OverlayOptions[] = [];

  if (cfg.showBandName && cfg.band) {
    const svg = buildTextSvg(event.bandName, cfg, cfg.band, w, h, true);
    overlays.push({ input: Buffer.from(svg), top: 0, left: 0 });
  }

  const venueSvg = buildTextSvg(event.venueName, cfg, cfg.venue, w, h, true);
  overlays.push({ input: Buffer.from(venueSvg), top: 0, left: 0 });

  const dateSvg = buildTextSvg(event.dateFormatted, cfg, cfg.date, w, h, false);
  overlays.push({ input: Buffer.from(dateSvg), top: 0, left: 0 });

  const citySvg = buildTextSvg(event.cityState, cfg, cfg.city, w, h, false);
  overlays.push({ input: Buffer.from(citySvg), top: 0, left: 0 });

  // Composite all layers
  const rendered = await sharp(base)
    .composite(overlays)
    .toFormat("png")
    .toBuffer();

  // Upload baked flat to Cloudinary
  const url = await uploadToCloudinary(rendered, outputPublicId);
  return url;
}
