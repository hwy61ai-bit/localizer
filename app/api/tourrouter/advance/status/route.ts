import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function GET(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const tourId = req.nextUrl.searchParams.get("tourId");
  if (!tourId) return NextResponse.json({ error: "tourId required" }, { status: 400 });

  const supabase = await supabaseServer();
  const { data: shows } = await supabase
    .from("tour_shows")
    .select("id, advance_status, advance_sent_at, advance_form_submitted_at, advance_form_submitted_by, advance_recipient_email, advance_form_token")
    .eq("tour_id", tourId)
    .eq("org_id", result.orgId)
    .order("sort_order");

  return NextResponse.json({ shows: shows ?? [] });
}
