import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[MarketingTokens List] Auth error:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tourId = req.nextUrl.searchParams.get("tourId");
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

    const { data: tokens } = await supabase
      .from("marketing_tokens")
      .select("token, label, expires_at, last_used_at, created_at")
      .eq("tour_id", tourId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    return NextResponse.json({ tokens: tokens ?? [] });
  } catch (e) {
    console.error("[MarketingTokens List] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
