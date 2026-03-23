import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

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

  // Delete from Supabase Storage
  const storagePath = `${orgId}/${fontName}.${font.file_extension}`;
  await supabase.storage.from("fonts").remove([storagePath]);

  // Delete from DB
  const { error } = await supabase
    .from("custom_fonts")
    .delete()
    .eq("id", font.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
