import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[MarketingTokens Create] Auth error:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tourId, label, expiresInDays } = body ?? {};

    if (!tourId) {
      return NextResponse.json({ error: "Missing tourId" }, { status: 400 });
    }

    const { data: tour } = await supabase
      .from("tours")
      .select("org_id")
      .eq("id", tourId)
      .single();

    if (!tour) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("org_id", tour.org_id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = crypto.randomBytes(24).toString("base64url");

    const expiresAt = expiresInDays && expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null;

    const { data: row } = await supabase
      .from("marketing_tokens")
      .insert({
        token,
        tour_id: tourId,
        org_id: tour.org_id,
        created_by: user.id,
        label: label ?? null,
        expires_at: expiresAt,
      })
      .select()
      .maybeSingle();

    if (!row) {
      console.error("[MarketingTokens Create] Insert returned no row — possible silent RLS rejection");
      return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
    }

    return NextResponse.json({ token, label: label ?? null, expiresAt, hubUrl: `/v/tour/${token}` });
  } catch (e) {
    console.error("[MarketingTokens Create] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
