// Destroys a dedicated image render asset by its secure_url. IMAGE ONLY —
// video render URLs are transformation URLs on source videos; destroying their
// public_id would delete the user's uploaded source video. Callers must only
// pass render_square_url / render_story_url / render_landscape_url values.

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function extractPublicIdFromRenderUrl(secureUrl: string): string | null {
  const m = secureUrl.match(/\/image\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return m?.[1] ?? null;
}

export async function destroyRenderAsset(secureUrl: string): Promise<{ ok: boolean; error?: string }> {
  // Defense-in-depth: refuse video URLs regardless of what the regex would match.
  if (secureUrl.includes("/video/upload/")) {
    return { ok: false, error: "video_url_refused" };
  }

  const publicId = extractPublicIdFromRenderUrl(secureUrl);
  if (!publicId) {
    return { ok: false, error: "unparseable_url" };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    const status = (result as { result?: string })?.result ?? "";
    if (status === "ok" || status === "not found") {
      return { ok: true };
    }
    return { ok: false, error: status || "unknown" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
