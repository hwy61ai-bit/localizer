import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    const isAdmin = authUser?.email === "hwy61ai@gmail.com" || authUser?.email === "tentenpm@gmail.com";

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

    // Upload to Cloudinary as raw asset (needed for video text overlay l_text references)
    try {
      await new Promise<void>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            public_id: storagePath,
            overwrite: true,
            type: "authenticated",
          },
          (error) => {
            if (error) reject(error);
            else resolve();
          }
        ).end(buffer);
      });
    } catch (cloudinaryError: any) {
      // Cleanup: remove the Supabase file we just uploaded
      await supabase.storage.from("fonts").remove([storagePath]);
      throw new Error("Cloudinary upload failed: " + (cloudinaryError?.message ?? String(cloudinaryError)));
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("fonts")
      .getPublicUrl(storagePath);

    const storageUrl = urlData.publicUrl;

    // Save to database. Upsert on (org_id, font_name) — matches the storage
    // layer's upsert-on-path behavior above. Re-uploading a font under the same
    // name replaces the existing row rather than conflicting with the UNIQUE
    // constraint on (org_id, font_name).
    const { error: dbError } = await supabase
      .from("custom_fonts")
      .upsert({
        org_id: orgId,
        font_name: fontName,
        cloudinary_public_id: storagePath,
        file_extension: fileExt,
        storage_url: storageUrl,
      }, { onConflict: "org_id,font_name" });

    if (dbError) {
      // Cleanup both uploads
      await supabase.storage.from("fonts").remove([storagePath]);
      try { await cloudinary.uploader.destroy(storagePath, { resource_type: "raw", type: "authenticated" }); } catch {}
      throw dbError;
    }

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
