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

    // Validate file type
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract font name (without extension)
    const fontName = file.name.replace(/\.(ttf|otf)$/i, "");
    const publicId = `custom-fonts/${orgId}/${fontName}`;

    // Upload to Cloudinary as authenticated raw asset
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          type: "authenticated",
          public_id: publicId,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // Save to database
    const { error: dbError } = await supabase
      .from("custom_fonts")
      .insert({
        org_id: orgId,
        font_name: fontName,
        cloudinary_public_id: uploadResult.public_id,
      });

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      fontName,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    console.error("Font upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
