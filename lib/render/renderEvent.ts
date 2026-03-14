import sharp from "sharp";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { getOswaldRegular, getOswaldBold } from "./fonts";

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

function parseColor(hex: string): string {
  return hex.startsWith("#") ? hex : "#" + hex;
}

async function renderTextPng(text: string, fontSize: number, color: string, bold: boolean, maxWidth: number): Promise<Buffer> {
  const fontRegular = getOswaldRegular();
  const fontBold = getOswaldBold();
  const lineHeight = Math.round(fontSize * 1.2);
  const padH = Math.round(fontSize * 0.5);
  const h = lineHeight * 3 + padH * 2;
  const node = {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        width: maxWidth,
        height: h,
        fontSize,
        fontFamily: "Oswald",
        fontWeight: bold ? 700 : 400,
        color,
        textAlign: "center" as const,
        lineHeight: 1.2,
      },
      children: text,
    },
  };
  const svg = await satori(node as any, {
    width: maxWidth,
    height: h,
    fonts: [
      { name: "Oswald", data: fontRegular, weight: 400, style: "normal" as const },
      { name: "Oswald", data: fontBold, weight: 700, style: "normal" as const },
    ],
  });
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: maxWidth } });
  return Buffer.from(resvg.render().asPng());
}

async function fetchImageBuffer(publicId: string): Promise<Buffer> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const url = "https://res.cloudinary.com/" + cloudName + "/image/upload/" + publicId;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch image: " + publicId);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000);
  const str = "overwrite=true&public_id=" + publicId + "&timestamp=" + timestamp + apiSecret;
  const hashBuffer = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(str));
  const signature = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: "image/png" }), "render.png");
  form.append("public_id", publicId);
  form.append("overwrite", "true");
  form.append("timestamp", String(timestamp));
  form.append("api_key", apiKey);
  form.append("signature", signature);
  const res = await fetch("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload", { method: "POST", body: form });
  const result = await res.json();
  if (result.error) throw new Error("Cloudinary upload failed: " + result.error.message);
  return result.secure_url;
}

export async function renderEventFormat(basePublicId: string, format: RenderFormat, event: EventData, cfg: FormatConfig, outputPublicId: string): Promise<string> {
  const { w, h } = FORMAT_DIMS[format];
  const color = parseColor(cfg.textColor);
  const maxW = Math.round(w * 0.85);
  const imageBuffer = await fetchImageBuffer(basePublicId);
  let base = await sharp(imageBuffer).resize(w, h, { fit: "cover", position: "center" }).png().toBuffer();
  async function addText(text: string, field: FieldConfig, bold: boolean) {
    const textPng = await renderTextPng(text, field.size, color, bold, maxW);
    const meta = await sharp(textPng).metadata();
    const textH = meta.height ?? field.size * 2;
    const textW = meta.width ?? maxW;
    const left = Math.max(0, Math.round(field.x * w) - Math.round(textW / 2));
    const top = Math.max(0, Math.round(field.y * h) - Math.round(textH / 2));
    base = await sharp(base).composite([{ input: textPng, left, top }]).png().toBuffer();
  }
  if (cfg.showBandName && cfg.band) await addText(event.bandName, cfg.band, true);
  await addText(event.venueName, cfg.venue, true);
  await addText(event.dateFormatted, cfg.date, false);
  await addText(event.cityState, cfg.city, false);
  return await uploadToCloudinary(base, outputPublicId);
}
