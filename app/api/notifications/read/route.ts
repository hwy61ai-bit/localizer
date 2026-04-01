import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[Notifications read PATCH] Auth error:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids, all } = body as { ids?: string[]; all?: boolean };

    if (!all && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json({ error: "Provide { ids: string[] } or { all: true }" }, { status: 400 });
    }

    let query = supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id);

    if (!all && ids) {
      query = query.in("id", ids);
    }

    const { error } = await query;

    if (error) {
      console.error("[Notifications read PATCH] Update error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Notifications read PATCH] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
