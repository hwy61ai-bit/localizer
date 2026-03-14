import sharp from "sharp";
import satori from "satori";
import fs from "fs";
import path from "path";

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

let cachedRegular: ArrayBuffer | null = null;
let cachedBold: ArrayBuffer | null = null;

function getFont(weight: "Regular" | "Bold"): ArrayBuffer {
  if (weight === "Regular" && cachedRegular) return cachedRegular;
  if (weight === "Bold" && cachedBold) return cachedBold;
  const fontPath = path.join(process.cwd(), "public", "fonts", `Oswald-${weight}.ttf`);
  const buf = fs.readFileSync(fontPath);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  if (weight === "Regular") cachedRegular = ab;
  else cachedBold = ab;
  return ab;
}

function parseColor(hex: string): string {
  return hex.startsWith("#") ? hex : `#${hex}`;
}

async function fetchImageBuffer(publicId: string): Promise<Buffer> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${publicId} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const str = `overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const hashBuffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
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

function makeText(text: string, field: FieldConfig, cfg: FormatConfig, w: number, h: number, bold: boolean): object {
  const maxW = Math.round(w * 0.85);
  const xLeft = Math.round(field.x * w) - Math.round(maxW / 2);
  const yTop = Math.round(field.y * h) - Math.round(field.size * 0.6);
  const color = parseColor(cfg.textColor);
  return {
    type: "div",
    props: {
      style: {
        position: "absolute" as const,
        left: xLeft,
        top: yTop,
        width: maxW,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap" as const,
        fontSize: field.size,
        fontFamily: "Oswald",
        fontWeight: bold ? 700 : 400,
        color,
        lineHeight: 1.2,
        textAlign: "center" as const,
      },
      children: text,
    },
  };
}

export async function renderEventFormat(
  basePublicId: string,
  format: RenderFormat,
  event: EventData,
  cfg: FormatConfig,
  outputPublicId: string
): Promise<string> {
  const { w, h } = FORMAT_DIMS[format];

  const fontRegular = getFont("Regular");
  const fontBold = getFont("Bold");

  const color = parseColor(cfg.textColor);

  const children: object[] = [];
  if (cfg.showBandName && cfg.band) {
    children.push(makeText(event.bandName, cfg.band, cfg, w, h, true));
  }
  children.push(makeText(event.venueName, cfg.venue, cfg, w, h, true));
  children.push(makeText(event.dateFormatted, cfg.date, cfg, w, h, false));
  children.push(makeText(event.cityState, cfg.city, cfg, w, h, false));

  const node = {
    type: "div",
    props: {
      style: {
        position: "relative" as const,
        width: w,
        height: h,
        display: "flex",
        flexDirection: "column" as const,
      },
      children,
    },
  };

  const svg = await satori(node as any, {
    width: w,
    height: h,
    fonts: [
      { name: "Oswald", data: fontRegular, weight: 400, style: "normal" as const },
      { name: "Oswald", data: fontBold, weight: 700, style: "normal" as const },
    ],
  });

  const textLayer = await sharp(Buffer.from(svg)).resize(w, h).png().toBuffer();

  const imageBuffer = await fetchImageBuffer(basePublicId);
  const base = await sharp(imageBuffer)
    .resize(w, h, { fit: "cover", position: "center" })
    .png()
    .toBuffer();

  const rendered = await sharp(base)
    .composite([{ input: textLayer, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return await uploadToCloudinary(rendered, outputPublicId);
}
