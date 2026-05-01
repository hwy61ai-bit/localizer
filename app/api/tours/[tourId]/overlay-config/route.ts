import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  const { tourId } = params;

  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const body = await req.json();

  const update: Record<string, any> = {};
  if (body && typeof body === "object") {
    if ("overlay_config" in body) update.overlay_config = body.overlay_config;
    if ("custom_text_1" in body) update.custom_text_1 = body.custom_text_1;
    if ("custom_text_2" in body) update.custom_text_2 = body.custom_text_2;
    if ("band_font_family" in body) update.band_font_family = body.band_font_family;
    if ("band_text_color" in body) update.band_text_color = body.band_text_color;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No updatable fields in request body" }, { status: 400 });
  }

  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("org_id")
    .eq("id", tourId)
    .maybeSingle();

  if (tourError) {
    return NextResponse.json({ error: tourError.message }, { status: 500 });
  }
  if (!tour) {
    return NextResponse.json({ error: "tour_not_found" }, { status: 404 });
  }

  const { data: membership, error: memberError } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("org_id", tour.org_id)
    .maybeSingle();

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }
  if (!membership) {
    return NextResponse.json({ error: "not_org_member" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("tours")
    .update(update)
    .eq("id", tourId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
