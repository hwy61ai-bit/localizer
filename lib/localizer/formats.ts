/**
 * Render-format catalog. Single source of truth for the six asset formats
 * the product generates. Mirrors lib/localizer/artistLimits.ts / tourLimits.ts
 * in shape.
 *
 * Canonical keys use the dominant vocabulary (square/story/landscape/print/
 * tiktok/yt_shorts) shared by TemplateEditor, generate, clientRender,
 * CropModal, download-format, EventsTable, ShareWithMarketingButton, and the
 * venue pages. The assets-upload surface (assets/page.tsx + upload-image)
 * uses an alternate vocabulary (ig_post/ig_story/facebook/...) captured here
 * as `uploadId` — formatFromUploadId() bridges the two.
 *
 * `category: "static" | "rich"` is the durable pricing axis. Static = the
 * three social JPEGs. Rich = print PDF + the two videos. The tier→category
 * gate policy lives elsewhere and is intentionally NOT expressed here, so
 * this file does not need to change when tier names evolve.
 *
 * Nothing imports this file yet — it is the consolidation target for a
 * follow-up sweep that replaces the ~11 local format-key declarations and
 * ~8 hard-coded DB-column lists across the codebase.
 */

export type FormatKey =
  | "square"
  | "story"
  | "landscape"
  | "print"
  | "tiktok"
  | "yt_shorts";

export type FormatMediaType = "image" | "video" | "pdf";
export type FormatCategory = "static" | "rich";

export type FormatDef = {
  key: FormatKey;
  uploadId: string;
  label: string;
  w: number;
  h: number;
  mediaType: FormatMediaType;
  category: FormatCategory;
  sourceColumn: string;
  renderColumn: string;
};

export const FORMATS: Record<FormatKey, FormatDef> = {
  square: {
    key: "square",
    uploadId: "ig_post",
    label: "Square",
    w: 1080,
    h: 1080,
    mediaType: "image",
    category: "static",
    sourceColumn: "image_square_id",
    renderColumn: "render_square_url",
  },
  story: {
    key: "story",
    uploadId: "ig_story",
    label: "Vertical",
    w: 1080,
    h: 1350,
    mediaType: "image",
    category: "static",
    sourceColumn: "image_story_id",
    renderColumn: "render_story_url",
  },
  landscape: {
    key: "landscape",
    uploadId: "facebook",
    label: "FB Cover",
    w: 820,
    h: 312,
    mediaType: "image",
    category: "static",
    sourceColumn: "image_landscape_id",
    renderColumn: "render_landscape_url",
  },
  print: {
    key: "print",
    uploadId: "print",
    label: "Local Poster",
    w: 3300,
    h: 5100,
    mediaType: "pdf",
    category: "rich",
    sourceColumn: "image_print_id",
    renderColumn: "render_poster_url",
  },
  tiktok: {
    key: "tiktok",
    uploadId: "tiktok",
    label: "Vertical Video",
    w: 1080,
    h: 1920,
    mediaType: "video",
    category: "rich",
    sourceColumn: "video_tiktok_id",
    renderColumn: "render_tiktok_url",
  },
  // yt_shorts is a legacy internal key — this is the SQUARE video format
  // (1080x1080), not vertical YouTube Shorts. The vertical/Shorts use case
  // is served by the 'tiktok' format. Key is load-bearing (DB columns,
  // overlay_config keys, Cloudinary paths) — do not rename. Label corrected
  // to 'Square Video'.
  yt_shorts: {
    key: "yt_shorts",
    uploadId: "yt_shorts",
    label: "Square Video",
    w: 1080,
    h: 1080,
    mediaType: "video",
    category: "rich",
    sourceColumn: "video_yt_shorts_id",
    renderColumn: "render_yt_shorts_url",
  },
};

/**
 * Translate the assets/page.tsx upload vocabulary (ig_post/ig_story/facebook/
 * print/tiktok/yt_shorts) back to a canonical FormatKey. Returns null for
 * unknown ids. Encodes what FORMAT_CROP_KEY does today in assets/page.tsx.
 */
export function formatFromUploadId(id: string): FormatKey | null {
  for (const def of Object.values(FORMATS)) {
    if (def.uploadId === id) return def.key;
  }
  return null;
}

export const ALL_FORMATS: FormatKey[] = Object.keys(FORMATS) as FormatKey[];

export const STATIC_FORMATS: FormatKey[] = ALL_FORMATS.filter(
  (k) => FORMATS[k].category === "static",
);

export const RICH_FORMATS: FormatKey[] = ALL_FORMATS.filter(
  (k) => FORMATS[k].category === "rich",
);

export const IMAGE_FORMATS: FormatKey[] = ALL_FORMATS.filter(
  (k) => FORMATS[k].mediaType === "image",
);

export const VIDEO_FORMATS: FormatKey[] = ALL_FORMATS.filter(
  (k) => FORMATS[k].mediaType === "video",
);
