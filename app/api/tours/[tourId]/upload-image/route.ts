import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { supabaseServer } from "@/lib/supabaseServer";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  const { tourId } = params;
  const contentType = req.headers.get("content-type") ?? "";

  let public_id: string;

  if (contentType.includes("application/json")) {
    // Browser uploaded directly to Cloudinary, just save the public_id
    const body = await req.json();
    public_id = body.public_id;
  } else {
    // Fallback: file upload through server (small files only)
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "localizer/tours", public_id: `tour_${tourId}`, overwrite: true, resource_type: "image" },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as { public_id: string; secure_url: string });
        }
      ).end(buffer);
    });
    public_id = result.public_id;
  }

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("tours")
    .update({ image_url: public_id })
    .eq("id", tourId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, public_id });
}
