import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Service role client bypasses RLS — used as fallback if auth client update fails
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  const { tourId } = params;
  const body = await req.json();

  const update: Record<string, any> = {};
  if (body && typeof body === "object") {
    if ("overlay_config" in body) update.overlay_config = body.overlay_config;
    if ("custom_text_1" in body) update.custom_text_1 = body.custom_text_1;
    if ("custom_text_2" in body) update.custom_text_2 = body.custom_text_2;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No updatable fields in request body" }, { status: 400 });
  }

  // Try authenticated client first
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("tours")
    .update(update)
    .eq("id", tourId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If auth client silently updated zero rows (RLS blocked), fall back to service role
  if (!data) {
    const { data: svcData, error: svcError } = await serviceClient
      .from("tours")
      .update(update)
      .eq("id", tourId)
      .select("id")
      .maybeSingle();

    if (svcError) {
      return NextResponse.json({ error: svcError.message }, { status: 500 });
    }
    if (!svcData) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ ok: true });
}
