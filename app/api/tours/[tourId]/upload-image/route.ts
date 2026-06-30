import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

const FORMAT_COLUMN: Record<string, string> = {
  print: "image_print_id",
  ig_post: "image_square_id",
  ig_story: "image_story_id",
  facebook: "image_landscape_id",
  tiktok: "video_tiktok_id",
  yt_shorts: "video_yt_shorts_id",
};

export async function POST(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  const { tourId } = params;

  // Auth + ownership: verify the caller owns this tour before any upload or write.
  // (Mirrors sponsor-logo/route.ts. Without this, the Cloudinary upload below
  // runs for any caller against any tourId — burning Cloudinary cost.)
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tour } = await supabase
    .from("tours")
    .select("org_id")
    .eq("id", tourId)
    .maybeSingle();

  if (!tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("org_id", tour.org_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this org" }, { status: 403 });
  }

  // Rate limit: 30/min per org for uploads (keyed on the verified org).
  const rl = await checkRateLimit(`upload:${tour.org_id}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: rl.reset
          ? { "Retry-After": String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))) }
          : undefined,
      }
    );
  }

  const contentType = req.headers.get("content-type") ?? "";

  let public_id: string;
  let formatId: string = "tour_poster";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    public_id = body.public_id;
    formatId = body.formatId ?? "tour_poster";
  } else {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    formatId = (formData.get("formatId") as string) ?? "tour_poster";
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "localizer/tours", public_id: `tour_${tourId}_${formatId}`, overwrite: true, resource_type: "image" },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as { public_id: string; secure_url: string });
        }
      ).end(buffer);
    });
    public_id = result.public_id;
  }

  const column = FORMAT_COLUMN[formatId] ?? "image_url";
  const { error } = await supabase
    .from("tours")
    .update({ [column]: public_id })
    .eq("id", tourId)
    .eq("org_id", tour.org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, public_id });
}
