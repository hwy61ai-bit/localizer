import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[MarketingTokens Revoke] Auth error:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body ?? {};

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const { data: marketingToken } = await supabase
      .from("marketing_tokens")
      .select("org_id")
      .eq("token", token)
      .maybeSingle();

    if (!marketingToken) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("org_id", marketingToken.org_id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: updated } = await supabase
      .from("marketing_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token", token)
      .select()
      .maybeSingle();

    if (!updated) {
      console.error("[MarketingTokens Revoke] Update returned no row — possible silent RLS rejection");
      return NextResponse.json({ error: "Failed to revoke token" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[MarketingTokens Revoke] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
