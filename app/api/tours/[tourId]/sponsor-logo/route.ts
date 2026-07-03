import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = params;
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: tour } = await supabase
      .from("tours")
      .select("org_id, sponsor_logo_1_url, sponsor_logo_2_url")
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
      return NextResponse.json(
        { error: "Not a member of this org" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      sponsorLogo1Url: tour.sponsor_logo_1_url ?? null,
      sponsorLogo2Url: tour.sponsor_logo_2_url ?? null,
    });
  } catch (error: any) {
    console.error("Sponsor logo GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = params;
    const slot = req.nextUrl.searchParams.get("slot");
    if (slot !== "1" && slot !== "2") {
      return NextResponse.json(
        { error: "Missing or invalid slot param — must be 1 or 2" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify tour exists and user belongs to its org
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
      return NextResponse.json(
        { error: "Not a member of this org" },
        { status: 403 }
      );
    }

    // Rate limit: 30/min per org for sponsor-logo uploads (keyed on the verified org).
    const rl = await checkRateLimit(`sponsor-logo:${tour.org_id}`);
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

    // Parse file from FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".png")) {
      return NextResponse.json(
        { error: "Only .png files are allowed" },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storagePath = `tour-assets/${tourId}/sponsor-logo-${slot}.png`;

    const { error: uploadError } = await supabase.storage
      .from("localizer-assets")
      .upload(storagePath, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("localizer-assets")
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Update tours row
    const column =
      slot === "1" ? "sponsor_logo_1_url" : "sponsor_logo_2_url";

    const { data: updated } = await supabase
      .from("tours")
      .update({ [column]: publicUrl })
      .eq("id", tourId)
      .select()
      .maybeSingle();

    if (!updated) {
      throw new Error("Tour update failed — possible RLS rejection");
    }

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error("Sponsor logo upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = params;
    const slot = req.nextUrl.searchParams.get("slot");
    if (slot !== "1" && slot !== "2") {
      return NextResponse.json(
        { error: "Missing or invalid slot param — must be 1 or 2" },
        { status: 400 }
      );
    }

    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify tour exists and user belongs to its org
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
      return NextResponse.json(
        { error: "Not a member of this org" },
        { status: 403 }
      );
    }

    // Remove file from storage
    const storagePath = `tour-assets/${tourId}/sponsor-logo-${slot}.png`;
    await supabase.storage.from("localizer-assets").remove([storagePath]);

    // Null out the URL column
    const column =
      slot === "1" ? "sponsor_logo_1_url" : "sponsor_logo_2_url";

    const { data: updated } = await supabase
      .from("tours")
      .update({ [column]: null })
      .eq("id", tourId)
      .select()
      .maybeSingle();

    if (!updated) {
      throw new Error("Tour update failed — possible RLS rejection");
    }

    return NextResponse.json({ success: true, url: null });
  } catch (error: any) {
    console.error("Sponsor logo delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
