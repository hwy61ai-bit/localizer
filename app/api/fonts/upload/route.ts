import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const orgId = formData.get("orgId") as string;

    if (!file || !orgId) {
      return NextResponse.json({ error: "Missing file or orgId" }, { status: 400 });
    }

    if (!file.name.endsWith(".ttf") && !file.name.endsWith(".otf")) {
      return NextResponse.json({ error: "Only .ttf and .otf fonts allowed" }, { status: 400 });
    }

    // Verify user has access to org
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this org" }, { status: 403 });
    }

    // Check plan - custom fonts are Pro/Agency only (admin bypass)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const isAdmin = authUser?.email === "hwy61ai@gmail.com" || authUser?.email === "hwy61regan@gmail.com";

    if (!isAdmin) {
      const { data: org } = await supabase
        .from("orgs")
        .select("plan")
        .eq("id", orgId)
        .single();

      if (org?.plan !== "pro" && org?.plan !== "agency") {
        return NextResponse.json({
          error: "Custom fonts require Pro or Agency plan. Upgrade at /pricing"
        }, { status: 403 });
      }
    }

    // Extract font name and extension
    const fileExt = file.name.endsWith(".otf") ? "otf" : "ttf";
    const fontName = file.name
      .replace(/\.(ttf|otf)$/i, "")
      .replace(/[_\s.]/g, "-");

    // Upload to Supabase Storage (public bucket)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storagePath = `${orgId}/${fontName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("fonts")
      .upload(storagePath, buffer, {
        contentType: fileExt === "otf" ? "font/otf" : "font/ttf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("fonts")
      .getPublicUrl(storagePath);

    const storageUrl = urlData.publicUrl;

    // Save to database
    const { error: dbError } = await supabase
      .from("custom_fonts")
      .insert({
        org_id: orgId,
        font_name: fontName,
        cloudinary_public_id: storagePath,
        file_extension: fileExt,
        storage_url: storageUrl,
      });

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      fontName,
      storageUrl,
    });
  } catch (error: any) {
    console.error("Font upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
