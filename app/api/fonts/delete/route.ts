import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  const { fontName, orgId } = await req.json();
  if (!fontName || !orgId) {
    return NextResponse.json({ error: "Missing fontName or orgId" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  // Verify user has access to org
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Not a member of this org" }, { status: 403 });

  // Get font record
  const { data: font } = await supabase
    .from("custom_fonts")
    .select("id, cloudinary_public_id, file_extension")
    .eq("org_id", orgId)
    .eq("font_name", fontName)
    .maybeSingle();

  if (!font) return NextResponse.json({ error: "Font not found" }, { status: 404 });

  const storagePath = `${orgId}/${fontName}.${font.file_extension}`;

  // Delete from Cloudinary (non-blocking — don't prevent font deletion if this fails)
  try {
    await cloudinary.uploader.destroy(storagePath, { resource_type: "raw", type: "authenticated" });
  } catch (e) {
    console.warn("Cloudinary delete failed (non-blocking):", e);
  }

  // Delete from Supabase Storage
  await supabase.storage.from("fonts").remove([storagePath]);

  // Delete from DB
  const { error } = await supabase
    .from("custom_fonts")
    .delete()
    .eq("id", font.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
