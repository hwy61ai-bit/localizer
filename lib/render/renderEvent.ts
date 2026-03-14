import sharp from "sharp";
import satori from "satori";

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

let cachedFont: ArrayBuffer | null = null;

async function getOswaldFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/fonts/Oswald.ttf`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch Oswald font: ${res.status}`);
  cachedFont = await res.arrayBuffer();
  return cachedFont;
}

function colorStr(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c: string) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgb(${r},${g},${b})`;
}

function textEl(text: string, field: FieldConfig, cfg: FormatConfig, w: number, h: number, bold: boolean): object {
  const maxW = Math.round(w * 0.85);
  const xLeft = Math.round(field.x * w) - Math.round(maxW / 2);
  const yTop = Math.round(field.y * h) - Math.round(field.size * 0.6);
  const color = cfg.textColor.startsWith("#") ? cfg.textColor : `#${cfg.textColor}`;

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
        color: colorStr(color),
        textAlign: "center" as const,
        lineHeight: 1.2,
        textShadow: "0px 2px 8px rgba(0,0,0,0.8)",
      },
      children: text,
    },
  };
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

export async function renderEventFormat(
  basePublicId: string,
  format: RenderFormat,
  event: EventData,
  cfg: FormatConfig,
  outputPublicId: string
): Promise<string> {
  const { w, h } = FORMAT_DIMS[format];
  const fontData = await getOswaldFont();

  const children: object[] = [];
  if (cfg.showBandName && cfg.band) {
    children.push(textEl(event.bandName, cfg.band, cfg, w, h, true));
  }
  children.push(textEl(event.venueName, cfg.venue, cfg, w, h, true));
  children.push(textEl(event.dateFormatted, cfg.date, cfg, w, h, false));
  children.push(textEl(event.cityState, cfg.city, cfg, w, h, false));

  const svg = await satori(
    ({
      type: "div",
      props: {
        style: { position: "relative", width: w, height: h, display: "flex" },
        children,
      },
    }) as any,
    {
      width: w,
      height: h,
      fonts: [
        { name: "Oswald", data: fontData, weight: 400, style: "normal" },
        { name: "Oswald", data: fontData, weight: 700, style: "normal" },
      ],
    }
  );

  const textLayer = await sharp(Buffer.from(svg)).toFormat("png").toBuffer();

  const imageBuffer = await fetchImageBuffer(basePublicId);
  const base = await sharp(imageBuffer)
    .resize(w, h, { fit: "cover", position: "center" })
    .toFormat("png")
    .toBuffer();

  const rendered = await sharp(base)
    .composite([{ input: textLayer, top: 0, left: 0 }])
    .toFormat("png")
    .toBuffer();

  return await uploadToCloudinary(rendered, outputPublicId);
}
