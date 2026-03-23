import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tourId = req.nextUrl.searchParams.get("tourId");
  if (!tourId) return NextResponse.json({ error: "tourId required" }, { status: 400 });

  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  const { data: shows } = await supabase
    .from("tour_shows")
    .select("id, advance_status, advance_sent_at, advance_form_submitted_at, advance_form_submitted_by, advance_recipient_email, advance_form_token")
    .eq("routing_tour_id", tourId)
    .eq("org_id", profile.org_id)
    .order("sort_order");

  return NextResponse.json({ shows: shows ?? [] });
}
