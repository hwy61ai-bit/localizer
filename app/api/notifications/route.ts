import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[Notifications GET] Auth error:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [{ data: notifications, error }, { count, error: countError }] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),
    ]);

    if (error) {
      console.error("[Notifications GET] Query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (countError) {
      console.error("[Notifications GET] Count error:", countError.message);
    }

    return NextResponse.json({
      notifications: notifications ?? [],
      unread_count: count ?? 0,
    });
  } catch (e) {
    console.error("[Notifications GET] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
